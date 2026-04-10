<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Models\SystemSetting;
use App\Models\User;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AuditUserActivity
{
    /**
     * @var list<string>
     */
    private const TRACKED_ROLES = ['super_admin', 'teacher', 'student'];

    /**
     * Only persist mutation requests to avoid noisy page-view logs.
     *
     * @var list<string>
     */
    private const TRACKED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    /**
     * @var list<string>
     */
    private const EXCLUDED_PATH_PREFIXES = [
        'up',
        '_ignition',
        'telescope',
        'horizon',
    ];

    /**
     * Routes that are functional but too low-signal for audit reporting.
     *
     * @var list<string>
     */
    private const EXCLUDED_ROUTE_NAMES = [
        'notifications.read',
        'notifications.read-all',
        'feedback.read',
        'teacher.attendance.check',
    ];

    /**
     * @var list<string>
     */
    private const SENSITIVE_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'remember_token',
        'authorization',
        'secret',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->shouldTrack($request)) {
            return $next($request);
        }

        try {
            $response = $next($request);
            $this->writeLog($request, $response->getStatusCode(), null);

            return $response;
        } catch (Throwable $exception) {
            $this->writeLog($request, 500, $exception);

            throw $exception;
        }
    }

    private function shouldTrack(Request $request): bool
    {
        $method = strtoupper($request->method());

        if (! in_array($method, self::TRACKED_METHODS, true)) {
            return false;
        }

        $path = ltrim($request->path(), '/');

        foreach (self::EXCLUDED_PATH_PREFIXES as $excludedPrefix) {
            if ($path === $excludedPrefix || Str::startsWith($path, $excludedPrefix . '/')) {
                return false;
            }
        }

        $routeName = Str::lower((string) $request->route()?->getName());

        if ($routeName !== '' && in_array($routeName, self::EXCLUDED_ROUTE_NAMES, true)) {
            return false;
        }

        $user = $request->user();

        return $user instanceof User && $this->resolvePrimaryRole($user) !== null;
    }

    private function writeLog(Request $request, int $statusCode, ?Throwable $exception): void
    {
        try {
            $user = $request->user();

            if (! $user instanceof User) {
                return;
            }

            $primaryRole = $this->resolvePrimaryRole($user);

            if ($primaryRole === null) {
                return;
            }

            $route = $request->route();
            $routeName = $route?->getName();
            $routeParameters = is_array($route?->parameters()) ? $route->parameters() : [];

            [$targetType, $targetId] = $this->extractTarget($routeParameters);

            $module = $this->resolveModule($request, $routeName, $primaryRole);
            $action = $this->resolveAction($request->method(), $routeName);

            $metadata = [
                'route_parameters' => $this->normalizeRouteParameters($routeParameters),
            ];

            if ($exception !== null) {
                $metadata['exception_message'] = Str::limit($exception->getMessage(), 500, '...');
            }

            AuditLog::create([
                'logged_at' => now(),
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_role' => $primaryRole,
                'school_year' => SystemSetting::getCurrentSchoolYear(),
                'module' => $module,
                'task' => $this->buildTaskLabel(
                    action: $action,
                    module: $module,
                    routeName: $routeName,
                    path: $request->path()
                ),
                'action' => $action,
                'target_type' => $targetType,
                'target_id' => $targetId,
                'route_name' => $routeName,
                'method' => strtoupper($request->method()),
                'path' => '/' . ltrim($request->path(), '/'),
                'status_code' => $statusCode,
                'is_success' => $statusCode >= 200 && $statusCode < 400 && $exception === null,
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 1000, '...'),
                'query_params' => $this->sanitizeValue($request->query()),
                'request_payload' => $this->extractRequestPayload($request),
                'metadata' => $metadata,
            ]);
        } catch (Throwable) {
            // Audit writes should never block application behavior.
        }
    }

    private function resolvePrimaryRole(User $user): ?string
    {
        $roleNames = $user->relationLoaded('roles')
            ? $user->roles->pluck('name')->all()
            : $user->roles()->pluck('name')->all();

        foreach (self::TRACKED_ROLES as $trackedRole) {
            if (in_array($trackedRole, $roleNames, true)) {
                return $trackedRole;
            }
        }

        return null;
    }

    private function resolveModule(Request $request, ?string $routeName, string $role): string
    {
        if (is_string($routeName) && $routeName !== '') {
            $segments = explode('.', $routeName);

            if (in_array($segments[0] ?? '', ['superadmin', 'teacher', 'admin'], true)) {
                array_shift($segments);
            }

            $moduleSegment = $segments[0] ?? null;

            if (is_string($moduleSegment) && $moduleSegment !== '') {
                return Str::headline(str_replace(['-', '_'], ' ', $moduleSegment));
            }
        }

        $pathSegments = array_values(array_filter(explode('/', trim($request->path(), '/'))));

        if (($pathSegments[0] ?? null) === 'superadmin' || ($pathSegments[0] ?? null) === 'teacher') {
            $candidate = $pathSegments[1] ?? $pathSegments[0];
        } else {
            $candidate = $pathSegments[0] ?? $role;
        }

        return Str::headline(str_replace(['-', '_'], ' ', (string) $candidate));
    }

    private function resolveAction(string $method, ?string $routeName): string
    {
        $name = Str::lower((string) $routeName);
        $tail = $name !== '' ? Str::afterLast($name, '.') : '';

        $tailMap = [
            'index' => 'view',
            'show' => 'view',
            'create' => 'view',
            'edit' => 'view',
            'store' => 'create',
            'bulk' => 'create',
            'update' => 'update',
            'toggle' => 'update',
            'destroy' => 'delete',
            'delete' => 'delete',
            'approve' => 'approve',
            'reject' => 'reject',
            'export' => 'export',
            'import' => 'import',
            'login' => 'login',
            'logout' => 'logout',
        ];

        foreach ($tailMap as $key => $mappedAction) {
            if ($tail === $key || Str::contains($tail, $key)) {
                return $mappedAction;
            }
        }

        return match (strtoupper($method)) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => 'view',
        };
    }

    private function buildTaskLabel(string $action, string $module, ?string $routeName, string $path): string
    {
        $actionLabel = match ($action) {
            'view' => 'Viewed',
            'create' => 'Created',
            'update' => 'Updated',
            'delete' => 'Deleted',
            'approve' => 'Approved',
            'reject' => 'Rejected',
            'export' => 'Exported',
            'import' => 'Imported',
            'login' => 'Logged In',
            'logout' => 'Logged Out',
            default => Str::headline($action),
        };

        $entity = $module;

        if (is_string($routeName) && $routeName !== '') {
            $segments = explode('.', $routeName);

            if (in_array($segments[0] ?? '', ['superadmin', 'teacher', 'admin'], true)) {
                array_shift($segments);
            }

            $entitySegment = collect($segments)
                ->reject(fn(string $segment) => in_array($segment, ['index', 'show', 'create', 'store', 'edit', 'update', 'destroy'], true))
                ->first();

            if (is_string($entitySegment) && $entitySegment !== '') {
                $entity = Str::headline(str_replace(['-', '_'], ' ', $entitySegment));
            }
        }

        if (in_array($action, ['login', 'logout'], true)) {
            return $actionLabel;
        }

        return trim(sprintf('%s %s (%s)', $actionLabel, $entity, '/' . ltrim($path, '/')));
    }

    /**
     * @param  array<string, mixed>  $parameters
     * @return array{0: string|null, 1: string|null}
     */
    private function extractTarget(array $parameters): array
    {
        foreach ($parameters as $value) {
            if ($value instanceof Model) {
                return [class_basename($value), (string) $value->getKey()];
            }

            if (is_scalar($value) && $value !== '') {
                return ['RouteParameter', (string) $value];
            }
        }

        return [null, null];
    }

    /**
     * @param  array<string, mixed>  $parameters
     * @return array<string, mixed>
     */
    private function normalizeRouteParameters(array $parameters): array
    {
        $normalized = [];

        foreach ($parameters as $key => $value) {
            if ($value instanceof Model) {
                $normalized[$key] = [
                    'model' => class_basename($value),
                    'id' => (string) $value->getKey(),
                ];

                continue;
            }

            $normalized[$key] = $this->sanitizeValue($value, (string) $key);
        }

        return $normalized;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function extractRequestPayload(Request $request): ?array
    {
        if (in_array(strtoupper($request->method()), ['GET', 'HEAD'], true)) {
            return null;
        }

        /** @var array<string, mixed> $input */
        $input = $request->all();

        if ($input === []) {
            return null;
        }

        $sanitized = $this->sanitizeValue($input);

        return is_array($sanitized) ? $sanitized : null;
    }

    private function sanitizeValue(mixed $value, string $parentKey = ''): mixed
    {
        if ($value instanceof UploadedFile) {
            return [
                'uploaded_file' => $value->getClientOriginalName(),
                'size' => $value->getSize(),
            ];
        }

        if (is_array($value)) {
            $sanitized = [];
            $count = 0;

            foreach ($value as $key => $item) {
                $count++;

                if ($count > 100) {
                    $sanitized['__truncated__'] = 'Array truncated to 100 items.';
                    break;
                }

                $keyString = (string) $key;

                if ($this->isSensitiveKey($keyString, $parentKey)) {
                    $sanitized[$keyString] = '[FILTERED]';
                    continue;
                }

                $sanitized[$keyString] = $this->sanitizeValue($item, $keyString);
            }

            return $sanitized;
        }

        if (is_string($value)) {
            return Str::limit($value, 500, '...');
        }

        if (is_scalar($value) || $value === null) {
            return $value;
        }

        if (is_object($value) && method_exists($value, '__toString')) {
            return Str::limit((string) $value, 500, '...');
        }

        return '[UNSERIALIZABLE]';
    }

    private function isSensitiveKey(string $key, string $parentKey = ''): bool
    {
        $normalized = Str::lower(trim($parentKey . '.' . $key, '.'));

        foreach (self::SENSITIVE_KEYS as $sensitiveKey) {
            if ($normalized === $sensitiveKey || Str::endsWith($normalized, '.' . $sensitiveKey)) {
                return true;
            }
        }

        return false;
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AuthenticatedSessionController extends Controller
{
    /**
     * @var list<string>
     */
    private const TRACKED_ROLES = ['super_admin', 'admin', 'teacher', 'student'];

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status'           => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $intendedVerificationUrl = $this->resolveIntendedEmailVerificationUrl($request);
        if ($intendedVerificationUrl !== null) {
            return redirect()->intended($intendedVerificationUrl);
        }

        $user = Auth::user();

        if (! $user instanceof User) {
            return redirect('/');
        }

        $this->logAuthActivity($user, $request, 'login');

        // Force password change on first login — runs before any role redirect
        if ($user->must_change_password) {
            return redirect()->route('password.force-change');
        }

        // Super admins must set and verify personal email before portal access.
        if (
            $user->isSuperAdmin() &&
            (! filled((string) $user->personal_email) || ! $user->hasVerifiedEmail())
        ) {
            return redirect()->route('verification.notice')
                ->with('status', 'verification-email-required');
        }

        // Teachers must verify email before teacher portal access.
        if (
            $user->isTeacher() &&
            (! filled((string) $user->personal_email) || ! $user->hasVerifiedEmail())
        ) {
            return redirect()->route('verification.notice')
                ->with('status', 'verification-email-required');
        }

        // Students must complete email setup and verification before dashboard access.
        if (
            $user->isStudent() &&
            (! filled((string) $user->personal_email) || ! $user->hasVerifiedEmail())
        ) {
            return redirect()->route('verification.notice');
        }

        // Always prioritize teacher dashboard if user has teacher role
        if ($user->isTeacher()) {
            return redirect()->route('teacher.dashboard');
        }
        // Otherwise, check for superadmin, then admin, then student
        if ($user->isSuperAdmin()) {
            return redirect()->route('superadmin.dashboard');
        }
        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }
        if ($user->isStudent()) {
            return redirect()->route('dashboard');
        }
        return redirect('/');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        if ($user instanceof User) {
            $this->logAuthActivity($user, $request, 'logout');
        }

        return redirect('/');
    }

    private function logAuthActivity(User $user, Request $request, string $action): void
    {
        $trackedRoles = $this->resolveTrackedRoles($user);

        if ($trackedRoles === []) {
            return;
        }

        $task = $action === 'logout' ? 'Logged Out' : 'Logged In';

        try {
            AuditLog::create([
                'logged_at' => now(),
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_role' => $trackedRoles[0],
                'user_roles' => $trackedRoles,
                'school_year' => SystemSetting::getCurrentSchoolYear(),
                'semester' => SystemSetting::getCurrentSemester(),
                'module' => 'Authentication',
                'task' => $task,
                'action' => $action,
                'target_type' => 'User',
                'target_id' => (string) $user->id,
                'route_name' => $request->route()?->getName(),
                'method' => strtoupper($request->method()),
                'path' => '/' . ltrim($request->path(), '/'),
                'status_code' => 302,
                'is_success' => true,
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 1000, '...'),
                'query_params' => $request->query(),
                'request_payload' => null,
                'metadata' => [
                    'source' => 'authenticated_session_controller',
                ],
            ]);
        } catch (Throwable) {
            // Activity log writes should never block authentication.
        }
    }

    /**
     * @return array<int, string>
     */
    private function resolveTrackedRoles(User $user): array
    {
        $roleNames = $user->relationLoaded('roles')
            ? $user->roles->pluck('name')->all()
            : $user->roles()->pluck('name')->all();

        $tracked = [];

        foreach (self::TRACKED_ROLES as $trackedRole) {
            if (in_array($trackedRole, $roleNames, true)) {
                $tracked[] = $trackedRole;
            }
        }

        return $tracked;
    }

    private function resolveIntendedEmailVerificationUrl(Request $request): ?string
    {
        $intendedUrl = $request->session()->get('url.intended');

        if (! is_string($intendedUrl) || $intendedUrl === '') {
            return null;
        }

        $path = parse_url($intendedUrl, PHP_URL_PATH);
        if (! is_string($path) || ! Str::startsWith('/' . ltrim($path, '/'), '/verify-email/')) {
            return null;
        }

        $query = parse_url($intendedUrl, PHP_URL_QUERY);
        if (! is_string($query) || $query === '') {
            return null;
        }

        parse_str($query, $queryParams);

        if (! array_key_exists('signature', $queryParams) || ! array_key_exists('expires', $queryParams)) {
            return null;
        }

        return $intendedUrl;
    }
}

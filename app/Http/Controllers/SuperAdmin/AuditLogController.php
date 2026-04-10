<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * Display a paginated list of tracked activity logs.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'role' => ['nullable', 'string', 'in:super_admin,teacher,student'],
            'action' => ['nullable', 'string', 'max:50'],
            'school_year' => ['nullable', 'string', 'max:32'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $role = (string) ($validated['role'] ?? '');
        $action = (string) ($validated['action'] ?? '');
        $schoolYear = (string) ($validated['school_year'] ?? '');

        $query = AuditLog::query()->with('user:id,first_name,middle_name,last_name,username');

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('user_name', 'like', "%{$search}%")
                    ->orWhere('task', 'like', "%{$search}%")
                    ->orWhere('module', 'like', "%{$search}%")
                    ->orWhere('path', 'like', "%{$search}%")
                    ->orWhere('route_name', 'like', "%{$search}%")
                    ->orWhere('school_year', 'like', "%{$search}%");
            });
        }

        if ($role !== '') {
            $query->where('user_role', $role);
        }

        if ($action !== '') {
            $query->where('action', $action);
        }

        if ($schoolYear !== '') {
            $query->where('school_year', $schoolYear);
        }

        $logs = $query
            ->latest('logged_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        $logs->setCollection(
            $logs->getCollection()->map(function (AuditLog $log): array {
                return [
                    'id' => $log->id,
                    'logged_at' => $log->logged_at?->toIso8601String(),
                    'user' => [
                        'id' => $log->user_id,
                        'name' => $log->user_name ?? $log->user?->name ?? 'Unknown User',
                        'username' => $log->user?->username,
                    ],
                    'user_role' => $log->user_role,
                    'school_year' => $log->school_year,
                    'module' => $log->module,
                    'task' => $log->task,
                    'action' => $log->action,
                    'method' => $log->method,
                    'status_code' => $log->status_code,
                    'is_success' => (bool) $log->is_success,
                    'path' => $log->path,
                    'route_name' => $log->route_name,
                    'ip_address' => $log->ip_address,
                    'target_type' => $log->target_type,
                    'target_id' => $log->target_id,
                    'query_params' => $log->query_params ?? [],
                    'request_payload' => $log->request_payload ?? [],
                    'metadata' => $log->metadata ?? [],
                ];
            })
        );

        $actionOptions = AuditLog::query()
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action')
            ->filter()
            ->values()
            ->all();

        $schoolYearOptions = AuditLog::query()
            ->select('school_year')
            ->whereNotNull('school_year')
            ->distinct()
            ->orderByDesc('school_year')
            ->pluck('school_year')
            ->filter()
            ->values()
            ->all();

        return Inertia::render('SuperAdmin/AuditLogs/Index', [
            'logs' => $logs,
            'filters' => [
                'search' => $search,
                'role' => $role,
                'action' => $action,
                'school_year' => $schoolYear,
            ],
            'options' => [
                'roles' => [
                    ['label' => 'Super Admin', 'value' => 'super_admin'],
                    ['label' => 'Teacher', 'value' => 'teacher'],
                    ['label' => 'Student', 'value' => 'student'],
                ],
                'actions' => $actionOptions,
                'school_years' => $schoolYearOptions,
            ],
        ]);
    }
}

<?php

namespace App\Http\Middleware;

use App\Models\Intervention;
use App\Models\StudentNotification;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        // Build user data with department for admin users
        $userData = $user;
        if ($user && $user->role === 'admin') {
            $userData = array_merge($user->toArray(), [
                'department' => $user->department ? [
                    'id' => $user->department->id,
                    'name' => $user->department->name,
                    'code' => $user->department->code,
                ] : null,
            ]);
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userData,
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
                'message' => fn() => $request->session()->get('message'),
                'import_summary' => fn() => $request->session()->get('import_summary'),
                'new_student_password' => fn() => $request->session()->get('new_student_password'),
                'grade_update_summary' => fn() => $request->session()->get('grade_update_summary'),
                'grade_import_summary' => fn() => $request->session()->get('grade_import_summary'),
            ],
            'notifications' => $this->getNotificationData($user),
        ];
    }

    /**
     * Get notification data based on user role
     */
    private function getNotificationData($user): array
    {
        if (!$user) {
            return [
                'unreadCount' => 0,
                'pendingInterventions' => 0,
                'items' => [],
            ];
        }

        // For students: get unread notifications with details
        if ($user->role === 'student') {
            $notifications = StudentNotification::where('user_id', $user->id)
                ->with(['sender:id,name', 'intervention:id,type,status'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            $unreadCount = StudentNotification::where('user_id', $user->id)
                ->where('is_read', false)
                ->count();

            return [
                'unreadCount' => $unreadCount,
                'pendingInterventions' => 0,
                'items' => $notifications->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'is_read' => $notification->is_read,
                        'created_at' => $notification->created_at->diffForHumans(),
                        'intervention_id' => $notification->intervention_id,
                        'sender_name' => $notification->sender?->name ?? 'System',
                    ];
                })->toArray(),
            ];
        }

        // For teachers: count pending/active interventions they created
        if ($user->role === 'teacher') {
            $enrollmentIds = Enrollment::whereHas('subject', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->pluck('id');

            $pendingInterventions = Intervention::whereIn('enrollment_id', $enrollmentIds)
                ->whereIn('status', ['in-progress', 'pending'])
                ->count();

            return [
                'unreadCount' => 0,
                'pendingInterventions' => $pendingInterventions,
                'items' => [],
            ];
        }

        return [
            'unreadCount' => 0,
            'pendingInterventions' => 0,
            'items' => [],
        ];
    }
}

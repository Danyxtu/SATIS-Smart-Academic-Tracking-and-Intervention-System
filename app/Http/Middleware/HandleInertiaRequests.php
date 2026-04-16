<?php

namespace App\Http\Middleware;

use App\Models\Intervention;
use App\Models\StudentNotification;
use App\Models\Enrollment;
use App\Models\SystemSetting;
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
        $user = $request->user()?->loadMissing(
            'roles:id,name',
            'department:id,department_name,department_code',
            'student:id,user_id,student_name,lrn,grade_level,section,section_id,strand,track'
        );

        // Build user data with explicit roles array and department for admin-capable users
        $userData = $user ? array_merge($user->toArray(), [
            // Explicitly include computed attributes that are not in toArray().
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->roles->map(fn($role) => [
                'id' => $role->id,
                'name' => $role->name,
            ])->values()->all(),
            'department' => ($user->isAdmin() || $user->isSuperAdmin()) && $user->department ? [
                'id' => $user->department->id,
                'name' => $user->department->department_name,
                'code' => $user->department->department_code,
            ] : null,
            'student' => $user->isStudent() && $user->student ? [
                'id' => $user->student->id,
                'student_name' => $user->student->student_name,
                'lrn' => $user->student->lrn,
                'grade_level' => $user->student->grade_level,
                'section' => $user->student->section,
                'section_id' => $user->student->section_id,
                'strand' => $user->student->strand,
                'track' => $user->student->track,
            ] : null,
        ]) : null;

        $sharedDepartment = $user && $user->department ? [
            'id' => $user->department->id,
            'name' => $user->department->department_name,
            'code' => $user->department->department_code,
        ] : null;

        $sharedAcademicPeriod = $user ? [
            'schoolYear' => SystemSetting::getCurrentSchoolYear(),
            'semester' => (string) SystemSetting::getCurrentSemester(),
        ] : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userData,
            ],
            'academicPeriod' => $sharedAcademicPeriod,
            'department' => $sharedDepartment,
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
                'message' => fn() => $request->session()->get('message'),
                'import_summary' => fn() => $request->session()->get('import_summary'),
                'class_create_summary' => fn() => $request->session()->get('class_create_summary'),
                'new_student_password' => fn() => $request->session()->get('new_student_password'),
                'created_student_credentials' => fn() => $request->session()->get('created_student_credentials'),
                'password_reset_credentials' => fn() => $request->session()->get('password_reset_credentials'),
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
        if ($user->hasRole('student')) {
            $notifications = StudentNotification::where('user_id', $user->id)
                ->with(['sender:id,first_name,last_name', 'intervention:id,type,status'])
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
        if ($user->hasRole('teacher')) {
            $enrollmentIds = Enrollment::whereHas('subject', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->pluck('id');

            $pendingInterventions = Intervention::whereIn('enrollment_id', $enrollmentIds)
                ->forSchoolYear(SystemSetting::getCurrentSchoolYear())
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

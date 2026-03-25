<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Subject;
use App\Models\SystemSetting;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the super admin dashboard.
     */
    public function index(): Response
    {
        $stats = [
            'total_departments' => Department::count(),
            'active_departments' => Department::active()->count(),
            'total_admins' => User::whereHas('roles', function ($q) {
                $q->where('name', 'admin');
            })->count(),
            'total_teachers' => User::whereHas('roles', function ($q) {
                $q->where('name', 'teacher');
            })->count(),
            'total_students' => User::whereHas('roles', function ($q) {
                $q->where('name', 'student');
            })->count(),
            'total_subjects' => Subject::count(),
            'active_subjects' => Subject::count(), // All subjects are considered active
        ];

        $recentAdmins = User::query()
            ->with('department')
            ->whereHas('roles', function ($q) {
                $q->where('name', 'admin');
            })
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'department' => $user->department?->department_name ?? 'Unassigned',
                'created_at' => $user->created_at?->diffForHumans(),
            ]);

        $departments = Department::query()
            ->withCount([
                'users as admins_count' => function ($q) {
                    $q->whereHas('roles', function ($roleQ) {
                        $roleQ->where('name', 'admin');
                    });
                },
                'users as teachers_count' => function ($q) {
                    $q->whereHas('roles', function ($roleQ) {
                        $roleQ->where('name', 'teacher');
                    });
                },
                'users as students_count' => function ($q) {
                    $q->whereHas('roles', function ($roleQ) {
                        $roleQ->where('name', 'student');
                    });
                },
            ])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($dept) => [
                'id' => $dept->id,
                'name' => $dept->department_name,
                'code' => $dept->department_code,
                'admins_count' => (int) $dept->admins_count,
                'teachers_count' => (int) $dept->teachers_count,
                'students_count' => (int) $dept->students_count,
                'is_active' => (bool) $dept->is_active,
            ]);

        $currentSettings = [
            'school_year' => SystemSetting::getCurrentSchoolYear(),
            'semester' => SystemSetting::getCurrentSemester(),
        ];

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => $stats,
            'recentAdmins' => $recentAdmins,
            'departments' => $departments,
            'currentSettings' => $currentSettings,
        ]);
    }
}

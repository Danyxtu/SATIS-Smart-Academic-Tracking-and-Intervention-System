<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\MasterSubject;
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
            'total_admins' => User::role('admin')->count(),
            'total_teachers' => User::role('teacher')->count(),
            'total_students' => User::role('student')->count(),
            'total_subjects' => MasterSubject::count(),
            'active_subjects' => MasterSubject::active()->count(),
        ];

        $recentAdmins = User::role('admin')
            ->with('department')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'department' => $user->department?->name ?? 'Unassigned',
                'created_at' => $user->created_at->diffForHumans(),
            ]);

        $departments = Department::withCount(['admins', 'teachers', 'students'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($dept) => [
                'id' => $dept->id,
                'name' => $dept->name,
                'code' => $dept->code,
                'admins_count' => $dept->admins_count,
                'teachers_count' => $dept->teachers_count,
                'students_count' => $dept->students_count,
                'is_active' => $dept->is_active,
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

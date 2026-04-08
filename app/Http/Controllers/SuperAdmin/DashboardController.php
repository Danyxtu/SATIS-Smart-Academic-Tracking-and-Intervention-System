<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Models\SubjectTeacher;
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
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();
        $currentSemester = SystemSetting::getCurrentSemester();
        $classTable = (new SubjectTeacher())->getTable();

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

        $classesByDepartment = SubjectTeacher::query()
            ->selectRaw('users.department_id, COUNT(*) as classes_count')
            ->join('users', 'users.id', '=', "{$classTable}.teacher_id")
            ->where("{$classTable}.school_year", $currentSchoolYear)
            ->whereNotNull('users.department_id')
            ->groupBy('users.department_id')
            ->pluck('classes_count', 'users.department_id');

        $enrolledStudentsByDepartment = Enrollment::query()
            ->selectRaw('users.department_id, COUNT(DISTINCT enrollments.user_id) as students_count')
            ->join($classTable, "{$classTable}.id", '=', 'enrollments.class_id')
            ->join('users', 'users.id', '=', "{$classTable}.teacher_id")
            ->where("{$classTable}.school_year", $currentSchoolYear)
            ->whereNotNull('users.department_id')
            ->groupBy('users.department_id')
            ->pluck('students_count', 'users.department_id');

        $departmentAssignments = Department::query()
            ->with([
                'admins:id,first_name,middle_name,last_name,personal_email,department_id',
            ])
            ->orderBy('department_name')
            ->get()
            ->map(function (Department $department) use ($classesByDepartment, $enrolledStudentsByDepartment) {
                $admins = $department->admins
                    ->map(fn(User $admin) => [
                        'id' => $admin->id,
                        'name' => $admin->name,
                        'email' => $admin->email,
                    ])
                    ->values();

                return [
                    'id' => $department->id,
                    'name' => $department->department_name,
                    'code' => $department->department_code,
                    'is_active' => (bool) $department->is_active,
                    'admins' => $admins,
                    'admin_count' => $admins->count(),
                    'classes_count' => (int) ($classesByDepartment[$department->id] ?? 0),
                    'students_enrolled_count' => (int) ($enrolledStudentsByDepartment[$department->id] ?? 0),
                ];
            })
            ->values();

        $departmentsWithAdminCount = $departmentAssignments
            ->where('admin_count', '>', 0)
            ->count();

        $currentYearStatus = [
            'school_year' => $currentSchoolYear,
            'semester' => $currentSemester,
            'students_enrolled' => Enrollment::query()
                ->whereHas('subjectTeacher', function ($query) use ($currentSchoolYear) {
                    $query->where('school_year', $currentSchoolYear);
                })
                ->distinct('user_id')
                ->count('user_id'),
            'teachers_handling_classes' => SubjectTeacher::query()
                ->where('school_year', $currentSchoolYear)
                ->distinct('teacher_id')
                ->count('teacher_id'),
            'classes_created' => SubjectTeacher::query()
                ->where('school_year', $currentSchoolYear)
                ->count(),
            'departments_total' => (int) $stats['total_departments'],
            'departments_with_admin' => $departmentsWithAdminCount,
            'departments_without_admin' => (int) $stats['total_departments'] - $departmentsWithAdminCount,
            'overall_admins' => (int) $stats['total_admins'],
            'overall_teachers' => (int) $stats['total_teachers'],
            'department_assignments' => $departmentAssignments,
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
            'school_year' => $currentSchoolYear,
            'semester' => $currentSemester,
        ];

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => $stats,
            'recentAdmins' => $recentAdmins,
            'departments' => $departments,
            'currentSettings' => $currentSettings,
            'currentYearStatus' => $currentYearStatus,
        ]);
    }
}

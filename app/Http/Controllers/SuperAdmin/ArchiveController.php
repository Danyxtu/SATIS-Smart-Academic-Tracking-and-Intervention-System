<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\SubjectTeacher;
use App\Models\SystemSetting;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class ArchiveController extends Controller
{
    public function index(): Response
    {
        $currentSY = SystemSetting::getCurrentSchoolYear();

        $allYears = SubjectTeacher::select('school_year')
            ->distinct()
            ->orderByDesc('school_year')
            ->pluck('school_year');

        $years = $allYears->map(function ($sy) use ($currentSY) {
            $classIds = SubjectTeacher::where('school_year', $sy)->pluck('id');
            $students = Enrollment::whereIn('subject_teachers_id', $classIds)
                ->distinct('user_id')->count('user_id');
            $classes  = SubjectTeacher::where('school_year', $sy)->count();
            $teachers = SubjectTeacher::where('school_year', $sy)
                ->distinct('teacher_id')->count('teacher_id');

            return [
                'school_year' => $sy,
                'is_current'  => $sy === $currentSY,
                'students'    => $students,
                'classes'     => $classes,
                'teachers'    => $teachers,
            ];
        })->values();

        $snapshots = SystemSetting::query()
            ->where('key', 'like', 'school_year_archive_snapshot_%')
            ->orderByDesc('created_at')
            ->get(['key', 'value', 'created_at'])
            ->map(function (SystemSetting $setting) {
                $payload = json_decode($setting->value ?? '{}', true);
                if (!is_array($payload)) {
                    return null;
                }

                $schoolYear = data_get($payload, 'school_year');
                if (!$schoolYear) {
                    return null;
                }

                return [
                    'archive_key' => $setting->key,
                    'school_year' => $schoolYear,
                    'next_school_year' => data_get($payload, 'next_school_year'),
                    'created_at' => data_get($payload, 'created_at', optional($setting->created_at)->toIso8601String()),
                    'students' => (int) data_get($payload, 'stats.students', 0),
                    'teachers' => (int) data_get($payload, 'stats.teachers', 0),
                    'classes' => (int) data_get($payload, 'totals.classes', 0),
                    'enrollments' => (int) data_get($payload, 'totals.enrollments', 0),
                    'grades' => (int) data_get($payload, 'totals.grades', 0),
                    'attendance_records' => (int) data_get($payload, 'totals.attendance_records', 0),
                    'interventions' => (int) data_get($payload, 'totals.interventions', 0),
                    'intervention_tasks' => (int) data_get($payload, 'totals.intervention_tasks', 0),
                    'student_notifications' => (int) data_get($payload, 'totals.student_notifications', 0),
                ];
            })
            ->filter()
            ->values();

        return Inertia::render('SuperAdmin/Archive/Index', [
            'years'      => $years,
            'currentSY'  => $currentSY,
            'snapshots'  => $snapshots,
        ]);
    }

    public function show(string $schoolYear): Response
    {
        $currentSY = SystemSetting::getCurrentSchoolYear();

        $classIds = SubjectTeacher::where('school_year', $schoolYear)->pluck('id');

        $students = Enrollment::whereIn('subject_teachers_id', $classIds)
            ->distinct('user_id')->count('user_id');

        $teachers = SubjectTeacher::where('school_year', $schoolYear)
            ->distinct('teacher_id')->count('teacher_id');

        $classesBySemester = SubjectTeacher::where('school_year', $schoolYear)
            ->selectRaw('semester, count(*) as total')
            ->groupBy('semester')
            ->pluck('total', 'semester');

        $departments = Department::withCount([
            'users as teachers_count' => fn($q) => $q->whereHas('roles', fn($r) => $r->where('name', 'teacher')),
        ])->get()->map(fn($d) => [
            'id'             => $d->id,
            'name'           => $d->department_name,
            'code'           => $d->department_code,
            'teachers_count' => (int) $d->teachers_count,
        ])->values();

        // Grade distribution for the school year
        $gradeStats = Enrollment::whereIn('subject_teachers_id', $classIds)
            ->whereNotNull('final_grade')
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN final_grade >= 75 THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN final_grade < 75 THEN 1 ELSE 0 END) as failed
            ')
            ->first();

        // Intervention counts
        $interventionCounts = Intervention::whereHas(
            'enrollment',
            fn($q) =>
            $q->whereIn('subject_teachers_id', $classIds)
        )->selectRaw("type, COUNT(*) as total")->groupBy('type')->pluck('total', 'type');

        return Inertia::render('SuperAdmin/Archive/Show', [
            'schoolYear'         => $schoolYear,
            'isCurrent'          => $schoolYear === $currentSY,
            'stats' => [
                'students'           => $students,
                'teachers'           => $teachers,
                'total_classes'      => $classIds->count(),
                'sem1_classes'       => (int) ($classesBySemester[1] ?? 0),
                'sem2_classes'       => (int) ($classesBySemester[2] ?? 0),
                'passed'             => (int) ($gradeStats->passed ?? 0),
                'failed'             => (int) ($gradeStats->failed ?? 0),
                'total_graded'       => (int) ($gradeStats->total ?? 0),
                'interventions'      => $interventionCounts,
            ],
            'departments'        => $departments,
        ]);
    }

    public function snapshotShow(string $archiveKey): Response
    {
        $snapshotSetting = SystemSetting::query()
            ->where('key', $archiveKey)
            ->where('key', 'like', 'school_year_archive_snapshot_%')
            ->firstOrFail();

        $payload = json_decode($snapshotSetting->value ?? '{}', true);
        if (!is_array($payload)) {
            abort(404, 'Archive snapshot is invalid.');
        }

        $schoolYear = data_get($payload, 'school_year');
        if (!$schoolYear) {
            abort(404, 'Archive snapshot is missing school year metadata.');
        }

        return Inertia::render('SuperAdmin/Archive/Snapshot', [
            'snapshot' => [
                'archive_key' => $snapshotSetting->key,
                'school_year' => $schoolYear,
                'next_school_year' => data_get($payload, 'next_school_year'),
                'semester' => (int) data_get($payload, 'semester', 1),
                'created_at' => data_get($payload, 'created_at', optional($snapshotSetting->created_at)->toIso8601String()),
                'stats' => [
                    'students' => (int) data_get($payload, 'stats.students', 0),
                    'teachers' => (int) data_get($payload, 'stats.teachers', 0),
                    'active_classes' => (int) data_get($payload, 'stats.active_classes', 0),
                    'departments' => (int) data_get($payload, 'stats.departments', 0),
                    'admins' => (int) data_get($payload, 'stats.admins', 0),
                ],
                'totals' => [
                    'classes' => (int) data_get($payload, 'totals.classes', 0),
                    'enrollments' => (int) data_get($payload, 'totals.enrollments', 0),
                    'grades' => (int) data_get($payload, 'totals.grades', 0),
                    'attendance_records' => (int) data_get($payload, 'totals.attendance_records', 0),
                    'interventions' => (int) data_get($payload, 'totals.interventions', 0),
                    'intervention_tasks' => (int) data_get($payload, 'totals.intervention_tasks', 0),
                    'student_notifications' => (int) data_get($payload, 'totals.student_notifications', 0),
                ],
            ],
        ]);
    }
}

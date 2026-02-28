<?php

namespace App\Services\Teacher;

use App\Models\Intervention;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Auth;
use App\Models\Enrollment;

class DashboardServices
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function getDashboardData(): array
    {
        $teacher = Auth::user(); // For the name of the teacher

        $teacher->load('department');
        // Get all enrollments for the teacher's subjects
        $enrollments = Enrollment::whereHas('subjectTeacher', function ($query) use ($teacher) {
            $query->where('teacher_id', $teacher->id);
        })->with([
            'user',
            'grades',
            'student',
            'subjectTeacher.subject',
            'attendanceRecords',
            'intervention',
        ])->get();

        $students = $enrollments->map(function ($enrollment) {
            $grades = $enrollment->grades;
            $hasGrades = $grades->isNotEmpty();
            $averageGrade = $hasGrades ? $grades->avg('score') : null;
            $studentProfile = $enrollment->student;

            return [
                'id' => $studentProfile?->id ?? $enrollment->user->id,
                'student_name' => $studentProfile?->student_name ?? $enrollment->user?->name ?? 'Student',
                'name' => $studentProfile?->student_name ?? $enrollment->user?->name ?? 'Student',
                'avatar' => $studentProfile?->avatar,
                'subject' => $enrollment->subjectTeacher?->subject?->name,
                'grade' => $hasGrades ? round($averageGrade) : null,
                'has_grades' => $hasGrades,
                'trend' => $studentProfile?->trend,
                'enrollment_id' => $enrollment->id,
                'intervention' => $enrollment->intervention ? [
                    'id' => $enrollment->intervention->id,
                    'type' => $enrollment->intervention->type,
                    'status' => $enrollment->intervention->status,
                    'notes' => $enrollment->intervention->notes,
                ] : null,
            ];
        });

        // Only consider students WITH grades for risk calculations
        $studentsWithGrades = $students->filter(fn($s) => $s['has_grades'] === true);

        // 1. Students at Risk (only those with grades below 75)
        $studentsAtRiskCount = $studentsWithGrades->filter(fn($s) => $s['grade'] < 75)->count();

        // 2. Average Grade (only from students with grades)
        $averageGrade = $studentsWithGrades->avg('grade') ?? 0;

        // 3. Needs Attention (based on attendance - 2+ absences)
        $needsAttentionCount = $enrollments->filter(function ($enrollment) {
            return $enrollment->attendanceRecords->where('status', 'absent')->count() >= 2;
        })->count();

        // 4. Recent Declines
        $recentDeclinesCount = $studentsWithGrades->filter(fn($s) => $s['trend'] === 'Declining')->count();

        // 5. Priority Students - Based on expected/actual grade thresholds
        // Critical: Grade below 70 (failing)
        // Warning: Grade between 70-74 (at risk of failing)
        // Watchlist: Grade between 75-79 AND declining trend
        $criticalStudents = $studentsWithGrades->filter(fn($s) => $s['grade'] < 70);
        $warningStudents = $studentsWithGrades->filter(fn($s) => $s['grade'] >= 70 && $s['grade'] < 75);
        $watchListStudents = $studentsWithGrades->filter(fn($s) => $s['grade'] >= 75 && $s['grade'] < 80 && $s['trend'] === 'Declining');

        // 6. Grade Distribution (only students with grades)
        $gradeDistribution = [
            '90-100' => $studentsWithGrades->filter(fn($s) => $s['grade'] >= 90)->count(),
            '80-89' => $studentsWithGrades->filter(fn($s) => $s['grade'] >= 80 && $s['grade'] < 90)->count(),
            '75-79' => $studentsWithGrades->filter(fn($s) => $s['grade'] >= 75 && $s['grade'] < 80)->count(),
            '70-74' => $studentsWithGrades->filter(fn($s) => $s['grade'] >= 70 && $s['grade'] < 75)->count(),
            '<70' => $studentsWithGrades->filter(fn($s) => $s['grade'] < 70)->count(),
        ];

        // 7. Recent Activity
        $recentActivity = Intervention::whereIn('enrollment_id', $enrollments->pluck('id'))
            ->latest()->limit(5)->with('enrollment.user')->get();

        $totalStudents = $students->count();
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();
        $currentSemester = SystemSetting::getCurrentSemester();

        $department = $teacher->department ? [
            'id' => $teacher->department->id,
            'name' => $teacher->department->name,
            'code' => $teacher->department->code,
        ] : null;


        return [
            'currentSchoolYear' => $currentSchoolYear,
            'currentSemester' => $currentSemester,
            'teacher' => $teacher,
            'criticalStudents' => $criticalStudents,
            'warningStudents' => $warningStudents,
            'watchlistsStudents' => $watchListStudents,
            'studentsAtRisk' => $studentsAtRiskCount,
            'needsAttention' => $needsAttentionCount,
            'recentDeclines' => $recentDeclinesCount,
            'totalStudents' => $totalStudents,
            'studentsWithGrades' => $studentsWithGrades->count(),
            'recentActivity' => $recentActivity,
            'gradeDistribution' => $gradeDistribution,
            'department' => $department,
        ];
    }
}

<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\Grade;
use App\Models\Intervention;
use App\Models\User;
use App\Models\SystemSetting;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $teacher = Auth::user();
        $teacher->load('department');

        // Get current academic period
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();
        $currentSemester = SystemSetting::getCurrentSemester();

        // Get all enrollments for the teacher's subjects
        $enrollments = Enrollment::whereHas('subject', function ($query) use ($teacher) {
            $query->where('user_id', $teacher->id);
        })->with([
            'user',
            'grades',
            'student',
            'subject',
            'attendanceRecords',
            'intervention',
        ])->get();

        $students = $enrollments->map(function ($enrollment) {
            $grades = $enrollment->grades;
            $hasGrades = $grades->isNotEmpty();
            $averageGrade = $hasGrades ? $grades->avg('score') : null;
            $studentProfile = $enrollment->student;

            return [
                'id' => optional($studentProfile)->id ?? $enrollment->user->id,
                'first_name' => optional($studentProfile)->first_name ?? $enrollment->user->name,
                'last_name' => optional($studentProfile)->last_name ?? '',
                'avatar' => optional($studentProfile)->avatar,
                'subject' => optional($enrollment->subject)->name,
                'grade' => $hasGrades ? round($averageGrade) : null,
                'has_grades' => $hasGrades,
                'trend' => optional($studentProfile)->trend,
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

        return Inertia::render('Teacher/Dashboard', [
            'stats' => [
                'studentsAtRisk' => $studentsAtRiskCount,
                'averageGrade' => round($averageGrade, 2),
                'needsAttention' => $needsAttentionCount,
                'recentDeclines' => $recentDeclinesCount,
                'totalStudents' => $students->count(),
                'studentsWithGrades' => $studentsWithGrades->count(),
            ],
            'priorityStudents' => [
                'critical' => $criticalStudents->values(),
                'warning' => $warningStudents->values(),
                'watchList' => $watchListStudents->values(),
            ],
            'gradeDistribution' => $gradeDistribution,
            'recentActivity' => $recentActivity,
            'academicPeriod' => [
                'schoolYear' => $currentSchoolYear,
                'semester' => $currentSemester,
            ],
            'department' => $teacher->department ? [
                'id' => $teacher->department->id,
                'name' => $teacher->department->name,
                'code' => $teacher->department->code,
            ] : null,
        ]);
    }
}

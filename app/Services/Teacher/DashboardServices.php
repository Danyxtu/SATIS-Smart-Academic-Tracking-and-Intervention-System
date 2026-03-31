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
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();
        $currentSemester = SystemSetting::getCurrentSemester();

        $teacher->load('department');
        // Get all enrollments for the teacher's subjects
        $enrollments = Enrollment::whereHas('subjectTeacher', function ($query) use ($teacher, $currentSchoolYear) {
            $query->where('teacher_id', $teacher->id)
                ->where('school_year', $currentSchoolYear);
        })->with([
            'user',
            'grades',
            'student',
            'subjectTeacher.subject',
            'attendanceRecords',
            'intervention',
        ])->get();

        $allSubjects = $this->getAllTeacherSubjects();

        $students = $enrollments->map(function ($enrollment) {
            $grades = $enrollment->grades;
            $hasGrades = $grades->isNotEmpty();
            $averageGrade = $hasGrades ? $grades->avg('score') : null;
            $studentProfile = $enrollment->student;
            $grade = $hasGrades ? round($averageGrade) : null;
            $absences = $enrollment->attendanceRecords->where('status', 'absent')->count();
            $recentDecline = $this->hasRecentDeclineToAtRisk($enrollment);

            return [
                'id' => $studentProfile?->id ?? $enrollment->user->id,
                'student_name' => $studentProfile?->student_name ?? $enrollment->user?->name ?? 'Student',
                'name' => $studentProfile?->student_name ?? $enrollment->user?->name ?? 'Student',
                'avatar' => $studentProfile?->avatar,
                'subject' => $enrollment->subjectTeacher?->subject?->subject_name ?? $enrollment->subjectTeacher?->subject?->name,
                'section' => $enrollment->subjectTeacher?->section ?? $studentProfile?->section,
                'grade' => $grade,
                'absences' => $absences,
                'has_grades' => $hasGrades,
                'trend' => $studentProfile?->trend,
                'at_risk' => $hasGrades && $grade < 75,
                'needs_attention' => $absences > 5,
                'recent_decline' => $recentDecline,
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
        $studentsAtRiskCount = $students->filter(fn($s) => $s['at_risk'] === true)->count();

        // 2. Average Grade (only from students with grades)
        $averageGrade = $studentsWithGrades->avg('grade') ?? 0;

        // 3. Needs Attention (based on attendance - more than 5 absences)
        $needsAttentionCount = $students->filter(fn($s) => $s['needs_attention'] === true)->count();

        // 4. Recent Declines
        // Flag students whose average crossed from above baseline passing (>75)
        // to 75 or below based on the latest two available quarter averages.
        $recentDeclinesCount = $students->filter(fn($s) => $s['recent_decline'] === true)->count();

        // Flat list used by the Students Needing Attention table in the dashboard.
        $attentionStudents = $students
            ->filter(function ($student) {
                return $student['at_risk'] || $student['needs_attention'] || $student['recent_decline'];
            })
            ->map(function ($student) {
                return [
                    'id' => $student['id'],
                    'enrollment_id' => $student['enrollment_id'],
                    'student_name' => $student['student_name'],
                    'section' => $student['section'] ?? 'N/A',
                    'subject' => $student['subject'] ?? 'N/A',
                    'grade' => $student['grade'],
                    'absences' => $student['absences'],
                    'at_risk' => $student['at_risk'],
                    'needs_attention' => $student['needs_attention'],
                    'recent_decline' => $student['recent_decline'],
                ];
            })
            ->sortBy('student_name')
            ->values();

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

        $department = $teacher->department ? [
            'id' => $teacher->department->id,
            'name' => $teacher->department->department_name,
            'code' => $teacher->department->department_code,
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
            'allSubjects' => $allSubjects,
            'attentionStudents' => $attentionStudents,
        ];
    }

    private function hasRecentDeclineToAtRisk(Enrollment $enrollment): bool
    {
        $quarterAverages = $enrollment->grades
            ->groupBy('quarter')
            ->map(function ($quarterGrades) {
                $quarterTotalScore = $quarterGrades->sum('score');
                $quarterTotalPossible = $quarterGrades->sum('total_score');

                if ($quarterTotalPossible <= 0) {
                    return null;
                }

                return round(($quarterTotalScore / $quarterTotalPossible) * 100, 2);
            })
            ->filter(fn($average) => $average !== null)
            ->sortKeys()
            ->values();

        if ($quarterAverages->count() < 2) {
            return false;
        }

        $previousQuarterAverage = $quarterAverages->get($quarterAverages->count() - 2);
        $currentQuarterAverage = $quarterAverages->last();

        return $previousQuarterAverage > 75
            && $currentQuarterAverage <= 75
            && ($previousQuarterAverage - $currentQuarterAverage) > 0;
    }

    private function getAllTeacherSubjects(): array
    {
        $teacher = Auth::user();
        $currentSemester = SystemSetting::getCurrentSemester();
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        $subjectTeachers = \App\Models\SubjectTeacher::where('teacher_id', $teacher->id)
            ->where('semester', $currentSemester)
            ->where('school_year', $currentSchoolYear)
            ->with('subject')
            ->get();

        // Fallback: if strict current period filters return no rows,
        // expose current-school-year assignments across semesters.
        if ($subjectTeachers->isEmpty()) {
            $subjectTeachers = \App\Models\SubjectTeacher::where('teacher_id', $teacher->id)
                ->where('school_year', $currentSchoolYear)
                ->with('subject')
                ->orderBy('semester')
                ->get();
        }

        return $subjectTeachers->map(function ($subjectTeacher) {
            return [
                'id' => $subjectTeacher->subject->id,
                'name' => $subjectTeacher->subject->subject_name ?? $subjectTeacher->subject->name,
                'code' => $subjectTeacher->subject->subject_code ?? null,
                'subject_teacher_id' => $subjectTeacher->id,
            ];
        })->toArray();
    }
}

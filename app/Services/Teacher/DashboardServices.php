<?php

namespace App\Services\Teacher;

use App\Models\Intervention;
use App\Models\SystemSetting;
use App\Services\WatchlistRuleService;
use Illuminate\Support\Facades\Auth;
use App\Models\Enrollment;

class DashboardServices
{
    protected WatchlistRuleService $watchlistRuleService;

    /**
     * Create a new class instance.
     */
    public function __construct(WatchlistRuleService $watchlistRuleService)
    {
        $this->watchlistRuleService = $watchlistRuleService;
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
            $studentProfile = $enrollment->student;
            $risk = $this->watchlistRuleService->evaluateEnrollment($enrollment);
            $metrics = $risk['metrics'] ?? [];

            $currentGrade = data_get($metrics, 'current_grade');
            $grade = $currentGrade !== null ? (int) round((float) $currentGrade) : null;
            $hasGrades = (bool) data_get($metrics, 'has_grades', false);
            $absences = (int) data_get($metrics, 'absences', 0);
            $failingActivities = (int) data_get($metrics, 'failing_activities_total', 0);
            $missingActivities = $enrollment->grades
                ->filter(fn($gradeRow) => $gradeRow->score === null || (float) $gradeRow->score <= 0)
                ->count();

            return [
                'id' => $studentProfile?->id ?? $enrollment->user->id,
                'student_name' => $studentProfile?->student_name ?? $enrollment->user?->name ?? 'Student',
                'name' => $studentProfile?->student_name ?? $enrollment->user?->name ?? 'Student',
                'avatar' => $studentProfile?->avatar,
                'subject' => $enrollment->subjectTeacher?->subject?->subject_name ?? $enrollment->subjectTeacher?->subject?->name,
                'section' => $enrollment->subjectTeacher?->section ?? $studentProfile?->section,
                'grade' => $grade,
                'absences' => $absences,
                'missing_activities' => $missingActivities,
                'failing_activities' => $failingActivities,
                'has_grades' => $hasGrades,
                'trend' => (string) data_get($metrics, 'trend', $studentProfile?->trend ?? 'Stable'),
                'at_risk' => (bool) ($risk['at_risk'] ?? false),
                'needs_attention' => (bool) ($risk['needs_attention'] ?? false),
                'recent_decline' => (bool) ($risk['recent_decline'] ?? false),
                'risk_key' => $risk['risk_key'] ?? 'on_track',
                'risk_label' => $risk['risk_label'] ?? 'On Track',
                'priority' => $risk['priority'] ?? 'Low',
                'watch_level' => $risk['watch_level'] ?? 'none',
                'rule_reasons' => $risk['reasons'] ?? [],
                'predicted_grade' => data_get($metrics, 'predicted_grade'),
                'midterm_grade' => data_get($metrics, 'midterm_grade'),
                'drop_points' => data_get($metrics, 'drop_points'),
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

        // 2. Needs Attention (shared policy: absences > 3 or failing activities > 3)
        $needsAttentionCount = $students->filter(fn($s) => $s['needs_attention'] === true)->count();

        // 3. Recent Declines (shared policy via WatchlistRuleService)
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
                    'status' => strtolower((string) ($student['priority'] ?? 'low')),
                    'reason' => $this->buildDashboardAttentionReason($student),
                    'at_risk' => $student['at_risk'],
                    'needs_attention' => $student['needs_attention'],
                    'recent_decline' => $student['recent_decline'],
                ];
            })
            ->sortBy('student_name')
            ->values();

        // 4. Priority groups aligned with the shared global rule set.
        $criticalStudents = $students->filter(fn($s) => $s['at_risk'] === true)->values();
        $warningStudents = $students->filter(fn($s) => $s['needs_attention'] === true)->values();
        $watchListStudents = $students->filter(fn($s) => $s['recent_decline'] === true)->values();

        // 5. Grade Distribution (only students with grades)
        $gradeDistribution = [
            '90-100' => $studentsWithGrades->filter(fn($s) => $s['grade'] >= 90)->count(),
            '80-89' => $studentsWithGrades->filter(fn($s) => $s['grade'] >= 80 && $s['grade'] < 90)->count(),
            '75-79' => $studentsWithGrades->filter(fn($s) => $s['grade'] >= 75 && $s['grade'] < 80)->count(),
            '70-74' => $studentsWithGrades->filter(fn($s) => $s['grade'] >= 70 && $s['grade'] < 75)->count(),
            '<70' => $studentsWithGrades->filter(fn($s) => $s['grade'] < 70)->count(),
        ];

        // 6. Recent Activity
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

    private function buildDashboardAttentionReason(array $student): string
    {
        $status = strtolower((string) ($student['priority'] ?? 'low'));
        $grade = $student['grade'];
        $absences = (int) ($student['absences'] ?? 0);
        $missingActivities = (int) ($student['missing_activities'] ?? 0);
        $failingActivities = (int) ($student['failing_activities'] ?? 0);
        $dropPoints = $student['drop_points'] ?? null;

        if ($status === 'high') {
            $parts = [];

            if ($grade !== null && (int) $grade < 75) {
                $parts[] = sprintf('failing grade of %d', (int) $grade);
            }

            if ($absences >= 5) {
                $parts[] = sprintf('absent of %d', $absences);
            }

            return !empty($parts)
                ? implode(' or ', $parts)
                : 'high risk indicators detected';
        }

        if ($status === 'medium') {
            $parts = [];

            if ($absences > 3) {
                $parts[] = sprintf('absent of %d', $absences);
            }

            if ($missingActivities > 0) {
                $parts[] = sprintf('missed %d activities', $missingActivities);
            }

            if ($failingActivities > 3) {
                $parts[] = sprintf('failed %d activities', $failingActivities);
            }

            return !empty($parts)
                ? implode(', ', $parts)
                : 'needs attention indicators detected';
        }

        if (is_numeric($dropPoints) && (float) $dropPoints > 0) {
            return sprintf('recent decline with %.0f-point drop', (float) $dropPoints);
        }

        return 'recent decline detected';
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

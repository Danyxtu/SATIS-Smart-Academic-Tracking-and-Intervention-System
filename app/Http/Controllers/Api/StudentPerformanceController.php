<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\StudentNotification;
use App\Models\SystemSetting;
use App\Services\PredictionService;
use App\Services\WatchlistRuleService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class StudentPerformanceController extends Controller
{
    protected PredictionService $predictionService;
    protected WatchlistRuleService $watchlistRuleService;

    public function __construct(PredictionService $predictionService, WatchlistRuleService $watchlistRuleService)
    {
        $this->predictionService = $predictionService;
        $this->watchlistRuleService = $watchlistRuleService;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        // Get current and selected semester
        $currentSemester = SystemSetting::getCurrentSemester();
        $selectedSemester = $request->query('semester', $currentSemester);
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        // Get all enrollments for this student with related data
        $allEnrollments = Enrollment::with([
            'subjectTeacher.subject',
            'subjectTeacher.teacher',
            'schoolClass.subject',
            'schoolClass.teacher',
            'subject',
            'grades',
            'attendanceRecords',
            'intervention',
        ])
            ->where('user_id', $user->id)
            ->get();

        // Filter enrollments by semester (if no semester on class, include in all)
        $enrollments = $allEnrollments->filter(function ($enrollment) use ($selectedSemester) {
            $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
            $semester = $class?->semester;

            if (!$semester) {
                return true;
            }

            return $semester == $selectedSemester;
        });

        // Count enrollments per semester for navigation
        $semester1Count = $allEnrollments->filter(function ($enrollment) {
            $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
            $semester = $class?->semester;

            return $semester === 1 || $semester === '1' || $semester === null;
        })->count();
        $semester2Count = $allEnrollments->filter(function ($enrollment) {
            $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
            $semester = $class?->semester;

            return $semester === 2 || $semester === '2';
        })->count();

        $totalSubjects = $enrollments->count();

        $subjectGrades = $enrollments
            ->map(function ($enrollment) {
                return $this->calculatePercentageFromGrades(
                    $this->scoreableGrades($enrollment->grades),
                    1,
                );
            })
            ->filter(fn($grade) => $grade !== null)
            ->values();

        $overallGrade = $subjectGrades->count() > 0
            ? round($subjectGrades->avg(), 1)
            : null;

        $allAttendance = $enrollments->flatMap(fn($e) => $e->attendanceRecords);
        $totalDays = $allAttendance->count();
        $presentDays = $allAttendance->whereIn('status', ['present', 'excused'])->count();
        $lateDays = $allAttendance->where('status', 'late')->count();
        $overallAttendance = $totalDays > 0
            ? round((($presentDays + ($lateDays * 0.5)) / $totalDays) * 100)
            : 100;

        $subjectPerformance = $enrollments->map(function ($enrollment) {
            $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
            $subject = $class?->subject ?? $enrollment->subject;
            $teacher = $class?->teacher;

            $grades = $enrollment->grades;
            $scoredGrades = $this->scoreableGrades($grades);
            $percentage = $this->calculatePercentageFromGrades($scoredGrades);

            $attendance = $enrollment->attendanceRecords;
            $totalDays = $attendance->count();
            $presentDays = $attendance->whereIn('status', ['present', 'excused'])->count();
            $lateDays = $attendance->where('status', 'late')->count();
            $attendanceRate = $totalDays > 0
                ? round((($presentDays + ($lateDays * 0.5)) / $totalDays) * 100)
                : 100;

            // Only explicit zero scores count as missing work.
            $missingCount = $grades
                ->filter(fn($grade) => $grade->score !== null && (float) $grade->score === 0.0)
                ->count();

            $risk = $this->watchlistRuleService->evaluateEnrollment($enrollment);
            $riskKey = (string) ($risk['risk_key'] ?? 'on_track');
            $riskLabel = (string) ($risk['risk_label'] ?? 'On Track');
            $riskColor = $this->riskColorHex((string) ($risk['risk_color'] ?? 'green'));

            $prediction = $this->predictionService->predictFinalGrade($enrollment);

            // Determine remarks
            $remarks = 'N/A';
            if ($percentage !== null) {
                if ($percentage >= 90) $remarks = 'Excellent';
                elseif ($percentage >= 85) $remarks = 'Very Good';
                elseif ($percentage >= 80) $remarks = 'Good';
                elseif ($percentage >= 75) $remarks = 'Satisfactory';
                else $remarks = 'Needs Improvement';
            }

            return [
                'id' => $enrollment->id,
                'subjectId' => $class?->subject_id ?? $subject?->id,
                'subject' => $subject?->subject_name ?? 'Unknown Subject',
                'subject_name' => $subject?->subject_name ?? 'Unknown Subject',
                'name' => $subject?->subject_name ?? 'Unknown Subject',
                'section' => $class?->section,
                'teacher' => $teacher?->name ?? 'N/A',
                'grade' => $percentage,
                'gradeDisplay' => $percentage !== null ? "{$percentage}%" : 'N/A',
                'remarks' => $remarks,
                'attendance' => $attendanceRate,
                'attendanceRate' => $attendanceRate,
                'missingCount' => $missingCount,
                'riskCategory' => $riskKey,
                'riskLabel' => $riskLabel,
                'riskColor' => $riskColor,
                'status' => match ($riskKey) {
                    'at_risk' => 'critical',
                    'needs_attention', 'recent_decline' => 'warning',
                    default => 'good',
                },
                'hasIntervention' => $enrollment->intervention !== null,
                'interventionType' => $enrollment->intervention?->type,
                'gradeCount' => $scoredGrades->count(),
                'predictedGrade' => $prediction['predicted_grade'],
                'gradeTrend' => $prediction['trend'],
                'trendDirection' => $prediction['trend_direction'],
                'semester' => $class?->semester,
            ];
        })->sortBy(function ($subject) {
            $priority = $this->riskSortOrder((string) ($subject['riskCategory'] ?? 'on_track'));
            $gradeRank = (int) round($subject['grade'] ?? 101);

            return ($priority * 1000) + $gradeRank;
        })->values();

        $subjectsAtRisk = $subjectPerformance->filter(
            fn($subject) => $subject['riskCategory'] === 'at_risk',
        )->count();
        $subjectsNeedingAttention = $subjectPerformance->filter(
            fn($subject) => $subject['riskCategory'] === 'needs_attention',
        )->count();
        $subjectsRecentDecline = $subjectPerformance->filter(
            fn($subject) => $subject['riskCategory'] === 'recent_decline',
        )->count();
        $subjectsOnTrack = $subjectPerformance->filter(
            fn($subject) => $subject['riskCategory'] === 'on_track',
        )->count();
        $subjectsExcelling = $subjectPerformance->filter(
            fn($subject) => $subject['grade'] !== null && $subject['grade'] >= 90,
        )->count();

        $recentGrades = $enrollments
            ->flatMap(fn($e) => $this->scoreableGrades($e->grades))
            ->sortByDesc('created_at')
            ->take(20)
            ->groupBy(fn($g) => $g->created_at->format('W'))
            ->take(4)
            ->map(function ($weekGrades) {
                $total = $weekGrades->sum('score');
                $possible = $weekGrades->sum('total_score');
                return $possible > 0 ? round(($total / $possible) * 100) : null;
            })
            ->filter()
            ->reverse()
            ->values()
            ->toArray();

        $notifications = StudentNotification::where('user_id', $user->id)
            ->with('sender')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'message' => $n->message,
                'sender' => $n->sender?->name ?? 'System',
                'isRead' => $n->is_read,
                'createdAt' => $n->created_at->diffForHumans(),
            ]);

        $unreadCount = StudentNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'student' => [
                'id' => $student?->id,
                'firstName' => $user->name ? explode(' ', $user->name)[0] : 'Student',
                'lastName' => $user->name ? (explode(' ', $user->name)[1] ?? '') : '',
                'fullName' => $user->name,
                'email' => $user->email,
                'gradeLevel' => $student?->grade_level,
                'section' => $student?->section,
                'lrn' => $student?->lrn,
            ],
            'stats' => [
                'overallGrade' => $overallGrade,
                'overallAttendance' => $overallAttendance,
                'totalSubjects' => $totalSubjects,
                'subjectsAtRisk' => $subjectsAtRisk,
                'subjectsNeedingAttention' => $subjectsNeedingAttention,
                'subjectsRecentDecline' => $subjectsRecentDecline,
                'subjectsOnTrack' => $subjectsOnTrack,
                'subjectsExcelling' => $subjectsExcelling,
            ],
            'subjectPerformance' => $subjectPerformance,
            'notifications' => $notifications,
            'unreadNotificationCount' => $unreadCount,
            'gradeTrend' => $recentGrades,
            'semesters' => [
                'current' => (int) $currentSemester,
                'selected' => (int) $selectedSemester,
                'schoolYear' => $currentSchoolYear,
                'semester1Count' => $semester1Count,
                'semester2Count' => $semester2Count,
            ],
        ]);
    }

    /**
     * Get detailed analytics for a specific subject/enrollment.
     */
    public function show(Request $request, $enrollmentId)
    {
        $user = $request->user();

        $enrollment = Enrollment::with([
            'subjectTeacher.subject',
            'subjectTeacher.teacher',
            'schoolClass.subject',
            'schoolClass.teacher',
            'subject',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
        ])
            ->where('user_id', $user->id)
            ->where('id', $enrollmentId)
            ->firstOrFail();

        $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
        $subject = $class?->subject ?? $enrollment->subject;
        $grades = $enrollment->grades;
        $scoredGrades = $this->scoreableGrades($grades);

        // Calculate overall grade
        $overallGrade = $this->calculatePercentageFromGrades($scoredGrades);

        // Determine remarks
        $remarks = 'N/A';
        if ($overallGrade !== null) {
            if ($overallGrade >= 90) $remarks = 'Excellent';
            elseif ($overallGrade >= 85) $remarks = 'Very Good';
            elseif ($overallGrade >= 80) $remarks = 'Good';
            elseif ($overallGrade >= 75) $remarks = 'Satisfactory';
            else $remarks = 'Needs Improvement';
        }

        // Group grades by quarter (only Q1 and Q2 for semester-based subjects)
        $quarterlyData = [];
        $previousQuarterGrade = null;

        for ($q = 1; $q <= 2; $q++) {
            $quarterGrades = $grades->where('quarter', $q);
            $scoredQuarterGrades = $this->scoreableGrades($quarterGrades);
            $hasStarted = $scoredQuarterGrades->isNotEmpty();
            $qGrade = $this->calculatePercentageFromGrades($scoredQuarterGrades);

            // Attendance for this subject
            $attendance = $enrollment->attendanceRecords;
            $totalDays = $attendance->count();
            $presentDays = $attendance->whereIn('status', ['present', 'excused'])->count();
            $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : null;

            // Quarter remarks
            $qRemarks = 'N/A';
            if ($qGrade !== null) {
                if ($qGrade >= 90) $qRemarks = 'Excellent';
                elseif ($qGrade >= 85) $qRemarks = 'Very Good';
                elseif ($qGrade >= 80) $qRemarks = 'Good';
                elseif ($qGrade >= 75) $qRemarks = 'Satisfactory';
                else $qRemarks = 'Needs Improvement';
            }

            $expectedGrade = null;
            if ($hasStarted) {
                $expectedGrade = match ($q) {
                    1 => $enrollment->expected_grade_q1,
                    2 => $enrollment->expected_grade_q2,
                    default => null,
                };

                $expectedGrade = $expectedGrade !== null
                    ? round((float) $expectedGrade, 1)
                    : null;
            }

            // Calculate trend BEFORE updating previousQuarterGrade
            $trend = $this->calculateTrend($qGrade, $previousQuarterGrade, $q);

            // Store for next iteration
            if ($qGrade !== null) {
                $previousQuarterGrade = $qGrade;
            }

            $quarterlyData[] = [
                'quarter' => $q,
                'label' => $this->quarterLabel($q),
                'grade' => $qGrade,
                'remarks' => $qRemarks,
                'attendance' => $attendanceRate,
                'itemCount' => $scoredQuarterGrades->count(),
                'totalItemCount' => $quarterGrades->count(),
                'expectedGrade' => $expectedGrade,
                'trend' => $trend,
                'hasStarted' => $hasStarted,
            ];
        }

        // Build grade breakdown by category
        $gradesByCategory = $grades->groupBy(function ($grade) {
            // Determine category from assignment_key or name
            $key = strtolower($grade->assignment_key ?? '');
            $name = strtolower($grade->assignment_name ?? '');
            $combined = $key . ' ' . $name;

            if (str_contains($combined, 'written') || str_contains($combined, 'ww') || str_contains($key, 'written_work')) {
                return 'written_works';
            } elseif (str_contains($combined, 'performance') || str_contains($combined, 'pt') || str_contains($key, 'performance_task')) {
                return 'performance_task';
            } elseif (str_contains($combined, 'exam') || str_contains($combined, 'quarterly') || str_contains($key, 'quarterly_exam')) {
                return 'quarterly_exam';
            }
            // Default to written works if uncategorized
            return 'written_works';
        });

        $gradeBreakdown = [
            'writtenWorks' => [
                'label' => 'Written Works',
                'items' => $gradesByCategory->get('written_works', collect())->map(fn($g) => [
                    'id' => $g->id,
                    'name' => $g->assignment_name,
                    'score' => $g->score,
                    'totalScore' => $g->total_score,
                    'percentage' => ($g->score !== null && (float) $g->total_score > 0)
                        ? round(((float) $g->score / (float) $g->total_score) * 100)
                        : null,
                    'quarter' => $g->quarter,
                    'date' => $g->created_at->format('M d, Y'),
                ])->values(),
                'count' => $gradesByCategory->get('written_works', collect())->count(),
            ],
            'performanceTask' => [
                'label' => 'Performance Task',
                'items' => $gradesByCategory->get('performance_task', collect())->map(fn($g) => [
                    'id' => $g->id,
                    'name' => $g->assignment_name,
                    'score' => $g->score,
                    'totalScore' => $g->total_score,
                    'percentage' => ($g->score !== null && (float) $g->total_score > 0)
                        ? round(((float) $g->score / (float) $g->total_score) * 100)
                        : null,
                    'quarter' => $g->quarter,
                    'date' => $g->created_at->format('M d, Y'),
                ])->values(),
                'count' => $gradesByCategory->get('performance_task', collect())->count(),
            ],
            'quarterlyExam' => [
                'label' => 'Quarterly Exam',
                'items' => $gradesByCategory->get('quarterly_exam', collect())->map(fn($g) => [
                    'id' => $g->id,
                    'name' => $g->assignment_name,
                    'score' => $g->score,
                    'totalScore' => $g->total_score,
                    'percentage' => ($g->score !== null && (float) $g->total_score > 0)
                        ? round(((float) $g->score / (float) $g->total_score) * 100)
                        : null,
                    'quarter' => $g->quarter,
                    'date' => $g->created_at->format('M d, Y'),
                ])->values(),
                'count' => $gradesByCategory->get('quarterly_exam', collect())->count(),
            ],
        ];

        // Calculate attendance stats
        $attendanceRecords = $enrollment->attendanceRecords;
        $totalDays = $attendanceRecords->count();
        $presentDays = $attendanceRecords->where('status', 'present')->count();
        $absentDays = $attendanceRecords->where('status', 'absent')->count();
        $lateDays = $attendanceRecords->where('status', 'late')->count();
        $excusedDays = $attendanceRecords->where('status', 'excused')->count();
        $attendanceRate = $totalDays > 0
            ? round((($presentDays + $excusedDays + ($lateDays * 0.5)) / $totalDays) * 100)
            : 100;

        // Grade trend by quarter (Q1 and Q2 only)
        $gradeTrend = [];
        for ($q = 1; $q <= 2; $q++) {
            $quarterGrades = $grades->where('quarter', $q);
            $qGrade = $this->calculatePercentageFromGrades($this->scoreableGrades($quarterGrades)) ?? 0;

            $gradeTrend[] = [
                'label' => "Q{$q}",
                'value' => $qGrade,
            ];
        }

        // School year
        $schoolYear = $subject?->school_year ?? date('Y') . '-' . (date('Y') + 1);
        $risk = $this->watchlistRuleService->evaluateEnrollment($enrollment);

        return response()->json([
            'enrollment' => [
                'id' => $enrollment->id,
                'subjectId' => $class?->subject_id ?? $subject?->id,
            ],
            'subject' => [
                'id' => $subject?->id,
                'name' => $subject?->subject_name ?? $subject?->name ?? 'Unknown Subject',
                'teacher' => $class?->teacher?->name ?? 'N/A',
                'section' => $class?->section ?? $subject?->section,
                'schoolYear' => $schoolYear,
            ],
            'performance' => [
                'overallGrade' => $overallGrade,
                'remarks' => $remarks,
                'quarterlyGrades' => $quarterlyData,
                'gradeBreakdown' => $gradeBreakdown,
            ],
            'attendance' => [
                'rate' => $attendanceRate,
                'totalDays' => $totalDays,
                'presentDays' => $presentDays,
                'absentDays' => $absentDays,
                'lateDays' => $lateDays,
                'excusedDays' => $excusedDays,
            ],
            'risk' => [
                'key' => (string) ($risk['risk_key'] ?? 'on_track'),
                'label' => (string) ($risk['risk_label'] ?? 'On Track'),
                'color' => $this->riskColorHex((string) ($risk['risk_color'] ?? 'green')),
                'reasons' => (array) ($risk['reasons'] ?? []),
            ],
            'gradeTrend' => $gradeTrend,
        ]);
    }

    private function scoreableGrades(Collection $grades): Collection
    {
        return $grades
            ->filter(function ($grade) {
                $score = $grade->score;

                return $score !== null
                    && is_numeric($score)
                    && (float) ($grade->total_score ?? 0) > 0;
            })
            ->values();
    }

    private function calculatePercentageFromGrades(Collection $grades, int $precision = 0): ?float
    {
        if ($grades->isEmpty()) {
            return null;
        }

        $totalScore = (float) $grades->sum('score');
        $totalPossible = (float) $grades->sum('total_score');

        if ($totalPossible <= 0) {
            return null;
        }

        return round(($totalScore / $totalPossible) * 100, $precision);
    }

    private function riskSortOrder(string $riskKey): int
    {
        return match ($riskKey) {
            'at_risk' => 0,
            'needs_attention' => 1,
            'recent_decline' => 2,
            default => 3,
        };
    }

    private function riskColorHex(string $riskColor): string
    {
        return match ($riskColor) {
            'red' => '#EF4444',
            'orange' => '#F59E0B',
            'blue' => '#3B82F6',
            default => '#10B981',
        };
    }

    /**
     * Calculate trend direction based on current vs previous quarter grades
     * 
     * @param float|null $currentGrade Current quarter grade
     * @param float|null $previousGrade Previous quarter grade
     * @param int $quarter Current quarter number
     * @return string 'improving', 'declining', 'stable', or 'new'
     */
    private function calculateTrend(?float $currentGrade, ?float $previousGrade, int $quarter): string
    {
        // Q1 or no current grade = new baseline
        if ($quarter === 1 || $currentGrade === null) {
            return 'new';
        }

        // No previous grade to compare
        if ($previousGrade === null) {
            return 'new';
        }

        $difference = $currentGrade - $previousGrade;

        // Consider it stable if within 3% variance
        if (abs($difference) <= 3) {
            return 'stable';
        }

        return $difference > 0 ? 'improving' : 'declining';
    }

    private function quarterLabel(int $quarter): string
    {
        return match ($quarter) {
            1 => 'Midterm Quarter (Q1)',
            2 => 'Final Quarter (Q2)',
            default => "Quarter {$quarter}",
        };
    }

    /**
     * Export subject analytics as PDF for mobile app.
     */
    public function exportPdf(Request $request, $enrollmentId)
    {
        $user = $request->user();

        $enrollment = Enrollment::with([
            'subject.teacher',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
            'user.student',
        ])
            ->where('user_id', $user->id)
            ->where('id', $enrollmentId)
            ->firstOrFail();

        $subject = $enrollment->subject;
        $grades = $enrollment->grades;
        $scoredGrades = $this->scoreableGrades($grades);

        $overallGrade = $this->calculatePercentageFromGrades($scoredGrades);
        $risk = $this->watchlistRuleService->evaluateEnrollment($enrollment);
        $riskKey = (string) ($risk['risk_key'] ?? 'on_track');
        $riskLabel = (string) ($risk['risk_label'] ?? 'On Track');

        // Group grades by quarter
        $quarterlyData = $grades->groupBy('quarter')->map(function ($quarterGrades, $quarter) use ($enrollment) {
            $qGrade = $this->calculatePercentageFromGrades($this->scoreableGrades($quarterGrades));

            $attendance = $enrollment->attendanceRecords;
            $totalDays = $attendance->count();
            $presentDays = $attendance->whereIn('status', ['present', 'excused'])->count();
            $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

            return [
                'quarterNum' => $quarter,
                'grade' => $qGrade,
                'attendance' => "{$attendanceRate}%",
                'assignmentCount' => $this->scoreableGrades($quarterGrades)->count(),
            ];
        })->sortBy('quarterNum')->values();

        $gradeBreakdown = $grades->map(function ($grade) {
            $percentage = ($grade->score !== null && (float) $grade->total_score > 0)
                ? round(((float) $grade->score / (float) $grade->total_score) * 100)
                : null;
            return [
                'name' => $grade->assignment_name,
                'score' => $grade->score,
                'totalScore' => $grade->total_score,
                'percentage' => $percentage,
                'quarter' => (int) $grade->quarter,
            ];
        })->values();

        $attendanceRecords = $enrollment->attendanceRecords;
        $totalDays = $attendanceRecords->count();
        $presentDays = $attendanceRecords->where('status', 'present')->count();
        $absentDays = $attendanceRecords->where('status', 'absent')->count();
        $lateDays = $attendanceRecords->where('status', 'late')->count();
        $excusedDays = $attendanceRecords->where('status', 'excused')->count();
        $attendanceRate = $totalDays > 0
            ? round((($presentDays + $excusedDays + ($lateDays * 0.5)) / $totalDays) * 100)
            : 100;

        // Generate suggestions based on performance
        $suggestions = [];
        if ($riskKey === 'at_risk') {
            $suggestions[] = 'Focus on completing all assignments on time';
            $suggestions[] = 'Consider seeking help from the teacher during office hours';
        }
        if ($riskKey === 'needs_attention' || $riskKey === 'recent_decline') {
            $suggestions[] = 'Review the latest feedback and prioritize weaker activities this week';
        }
        if ($attendanceRate < 90) {
            $suggestions[] = 'Improve attendance to avoid missing important lessons';
        }
        if ($absentDays > 3) {
            $suggestions[] = 'Catch up on missed work from absent days';
        }
        if (empty($suggestions)) {
            $suggestions[] = 'Keep up the good work!';
            $suggestions[] = 'Continue maintaining your study habits';
        }

        if (! app()->bound('dompdf.wrapper')) {
            return response()->json([
                'message' => 'PDF export not available. Please install barryvdh/laravel-dompdf.',
            ], 501);
        }

        $dataForView = [
            'student' => [
                'name' => $enrollment->user->name,
                'lrn' => $enrollment->user->student->lrn ?? null,
                'gradeLevel' => $enrollment->user->student->grade_level ?? null,
                'strand' => $enrollment->user->student->strand ?? null,
            ],
            'subject' => [
                'name' => $subject?->subject_name ?? $subject?->name ?? 'Unknown Subject',
                'section' => $subject?->section,
                'grade_level' => $subject?->grade_level,
                'teacher' => $subject?->teacher?->name ?? 'N/A',
                'current_quarter' => $subject?->current_quarter ?? 1,
            ],
            'performance' => [
                'overallGrade' => $overallGrade,
                'quarterlyGrades' => $quarterlyData,
                'gradeBreakdown' => $gradeBreakdown,
            ],
            'attendance' => [
                'rate' => $attendanceRate,
                'totalDays' => $totalDays,
                'presentDays' => $presentDays,
                'absentDays' => $absentDays,
                'lateDays' => $lateDays,
                'excusedDays' => $excusedDays,
            ],
            'risk' => [
                'label' => $riskLabel,
            ],
            'suggestions' => $suggestions,
            'generatedAt' => now()->format('F d, Y h:i A'),
        ];

        $pdf = app('dompdf.wrapper')->loadView('pdf.mobile_student_analytics', $dataForView);
        $filename = sprintf('analytics_%s_%s.pdf', $enrollment->id, now()->format('Y-m-d'));

        return $pdf->download($filename);
    }
}

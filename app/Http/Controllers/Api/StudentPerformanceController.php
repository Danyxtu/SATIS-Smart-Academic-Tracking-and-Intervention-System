<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\StudentNotification;
use App\Models\SystemSetting;
use Illuminate\Http\Request;

class StudentPerformanceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        // Get current and selected semester
        $currentSemester = SystemSetting::getCurrentSemester();
        $selectedSemester = $request->query('semester', $currentSemester);
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        // Get all enrollments for this student with related data
        $allEnrollments = Enrollment::with(['subject.teacher', 'grades', 'attendanceRecords', 'intervention'])
            ->where('user_id', $user->id)
            ->get();

        // Filter enrollments by semester
        $enrollments = $allEnrollments->filter(function ($enrollment) use ($selectedSemester) {
            $subjectSemester = $enrollment->subject?->semester;
            return $subjectSemester == $selectedSemester;
        });

        // Count enrollments per semester for navigation
        $semester1Count = $allEnrollments->filter(fn($e) => ($e->subject?->semester ?? '1') == '1')->count();
        $semester2Count = $allEnrollments->filter(fn($e) => ($e->subject?->semester ?? '1') == '2')->count();

        $totalSubjects = $enrollments->count();

        $subjectGrades = $enrollments->map(function ($enrollment) {
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            return $totalPossible > 0 ? ($totalScore / $totalPossible) * 100 : null;
        })->filter()->values();

        $overallGrade = $subjectGrades->count() > 0
            ? round($subjectGrades->avg(), 1)
            : null;

        $allAttendance = $enrollments->flatMap(fn($e) => $e->attendanceRecords);
        $totalDays = $allAttendance->count();
        $presentDays = $allAttendance->where('status', 'present')->count();
        $overallAttendance = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

        $subjectsAtRisk = $enrollments->filter(function ($enrollment) {
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            $percentage = $totalPossible > 0 ? ($totalScore / $totalPossible) * 100 : null;
            return $percentage !== null && $percentage < 75;
        })->count();

        $subjectsExcelling = $enrollments->filter(function ($enrollment) {
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            $percentage = $totalPossible > 0 ? ($totalScore / $totalPossible) * 100 : null;
            return $percentage !== null && $percentage >= 90;
        })->count();

        $subjectPerformance = $enrollments->map(function ($enrollment) {
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            $percentage = $totalPossible > 0 ? round(($totalScore / $totalPossible) * 100) : null;

            $attendance = $enrollment->attendanceRecords;
            $totalDays = $attendance->count();
            $presentDays = $attendance->where('status', 'present')->count();
            $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

            $status = 'good';
            if ($percentage !== null && $percentage < 70) $status = 'critical';
            elseif ($percentage !== null && $percentage < 75) $status = 'warning';

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
                'subjectId' => $enrollment->subject_id,
                'name' => $enrollment->subject?->name ?? 'Unknown Subject',
                'section' => $enrollment->subject?->section,
                'teacher' => $enrollment->subject?->teacher?->name ?? 'N/A',
                'grade' => $percentage,
                'gradeDisplay' => $percentage !== null ? "{$percentage}%" : 'N/A',
                'remarks' => $remarks,
                'attendance' => $attendanceRate,
                'status' => $status,
                'hasIntervention' => $enrollment->intervention !== null,
                'interventionType' => $enrollment->intervention?->type,
                'gradeCount' => $grades->count(),
            ];
        })->sortByDesc('grade')->values();

        $recentGrades = $enrollments
            ->flatMap(fn($e) => $e->grades)
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
            'subject.teacher',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
        ])
            ->where('user_id', $user->id)
            ->where('id', $enrollmentId)
            ->firstOrFail();

        $subject = $enrollment->subject;
        $grades = $enrollment->grades;

        // Calculate overall grade
        $totalScore = $grades->sum('score');
        $totalPossible = $grades->sum('total_score');
        $overallGrade = $totalPossible > 0 ? round(($totalScore / $totalPossible) * 100) : null;

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
            $qScore = $quarterGrades->sum('score');
            $qTotal = $quarterGrades->sum('total_score');
            $qGrade = $qTotal > 0 ? round(($qScore / $qTotal) * 100) : null;

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

            // Calculate expected grade with logical reasoning:
            // 1. If this is Q1 and has grades, expected = current grade (baseline)
            // 2. If this is Q2 and Q1 exists, use Q1 as baseline with attendance adjustment
            // 3. Attendance below 90% typically reduces grade by proportional amount
            // 4. If no grades yet, use 80 as target (passing with good standing)
            $expectedGrade = 80; // Default target

            if ($q === 1 && $qGrade !== null) {
                // Q1: Expected is slightly higher than current (room for improvement)
                $expectedGrade = min(100, round($qGrade + 3));
            } elseif ($q === 2) {
                if ($previousQuarterGrade !== null) {
                    // Q2: Base expected on Q1 performance
                    $expectedGrade = $previousQuarterGrade;

                    // Adjust based on attendance (poor attendance = lower expected)
                    if ($attendanceRate !== null && $attendanceRate < 90) {
                        // For every 10% drop in attendance below 90%, reduce expected by 5%
                        $attendancePenalty = floor((90 - $attendanceRate) / 10) * 5;
                        $expectedGrade = max(60, $expectedGrade - $attendancePenalty);
                    }

                    // If current Q2 grade exists and is lower than Q1, project the trend
                    if ($qGrade !== null && $qGrade < $previousQuarterGrade) {
                        // Declining trend - expected might be even lower
                        $decline = $previousQuarterGrade - $qGrade;
                        $expectedGrade = max(60, round($qGrade - ($decline * 0.5)));
                    } elseif ($qGrade !== null && $qGrade > $previousQuarterGrade) {
                        // Improving trend - project continued improvement
                        $improvement = $qGrade - $previousQuarterGrade;
                        $expectedGrade = min(100, round($qGrade + ($improvement * 0.5)));
                    }
                } elseif ($qGrade !== null) {
                    // No Q1 data, use current Q2 as basis
                    $expectedGrade = min(100, round($qGrade + 3));
                }
            }

            // Calculate trend BEFORE updating previousQuarterGrade
            $trend = $this->calculateTrend($qGrade, $previousQuarterGrade, $q);

            // Store for next iteration
            if ($qGrade !== null) {
                $previousQuarterGrade = $qGrade;
            }

            $quarterlyData[] = [
                'quarter' => $q,
                'label' => "Quarter {$q}",
                'grade' => $qGrade,
                'remarks' => $qRemarks,
                'attendance' => $attendanceRate,
                'itemCount' => $quarterGrades->count(),
                'expectedGrade' => $expectedGrade,
                'trend' => $trend,
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
                    'percentage' => $g->total_score > 0 ? round(($g->score / $g->total_score) * 100) : null,
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
                    'percentage' => $g->total_score > 0 ? round(($g->score / $g->total_score) * 100) : null,
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
                    'percentage' => $g->total_score > 0 ? round(($g->score / $g->total_score) * 100) : null,
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
            $qScore = $quarterGrades->sum('score');
            $qTotal = $quarterGrades->sum('total_score');
            $qGrade = $qTotal > 0 ? round(($qScore / $qTotal) * 100) : 0;

            $gradeTrend[] = [
                'label' => "Q{$q}",
                'value' => $qGrade,
            ];
        }

        // School year
        $schoolYear = $subject?->school_year ?? date('Y') . '-' . (date('Y') + 1);

        return response()->json([
            'enrollment' => [
                'id' => $enrollment->id,
                'subjectId' => $enrollment->subject_id,
            ],
            'subject' => [
                'id' => $subject?->id,
                'name' => $subject?->name ?? 'Unknown Subject',
                'teacher' => $subject?->teacher?->name ?? 'N/A',
                'section' => $subject?->section,
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
            'gradeTrend' => $gradeTrend,
        ]);
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

        $totalScore = $grades->sum('score');
        $totalPossible = $grades->sum('total_score');
        $overallGrade = $totalPossible > 0 ? round(($totalScore / $totalPossible) * 100) : null;

        // Group grades by quarter
        $quarterlyData = $grades->groupBy('quarter')->map(function ($quarterGrades, $quarter) use ($enrollment) {
            $qScore = $quarterGrades->sum('score');
            $qTotal = $quarterGrades->sum('total_score');
            $qGrade = $qTotal > 0 ? round(($qScore / $qTotal) * 100) : null;

            $attendance = $enrollment->attendanceRecords;
            $totalDays = $attendance->count();
            $presentDays = $attendance->whereIn('status', ['present', 'excused'])->count();
            $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

            return [
                'quarterNum' => $quarter,
                'grade' => $qGrade,
                'attendance' => "{$attendanceRate}%",
                'assignmentCount' => $quarterGrades->count(),
            ];
        })->sortBy('quarterNum')->values();

        $gradeBreakdown = $grades->map(function ($grade) {
            $percentage = $grade->total_score > 0
                ? round(($grade->score / $grade->total_score) * 100)
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

        // Determine risk level
        $riskLabel = 'On Track';
        if ($overallGrade !== null) {
            if ($overallGrade < 70) {
                $riskLabel = 'Critical';
            } elseif ($overallGrade < 75) {
                $riskLabel = 'At Risk';
            } elseif ($overallGrade < 80) {
                $riskLabel = 'Needs Attention';
            }
        }

        // Generate suggestions based on performance
        $suggestions = [];
        if ($overallGrade !== null && $overallGrade < 75) {
            $suggestions[] = 'Focus on completing all assignments on time';
            $suggestions[] = 'Consider seeking help from the teacher during office hours';
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

        // Check if PDF package is present
        $pdfClass = 'Barryvdh\\DomPDF\\Facade\\Pdf';
        if (!class_exists($pdfClass)) {
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
                'name' => $subject->name,
                'section' => $subject->section,
                'grade_level' => $subject->grade_level,
                'teacher' => $subject->teacher?->name ?? 'N/A',
                'current_quarter' => $subject->current_quarter ?? 1,
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

        $pdf = $pdfClass::loadView('pdf.mobile_student_analytics', $dataForView);
        $filename = sprintf('analytics_%s_%s.pdf', $enrollment->id, now()->format('Y-m-d'));

        return $pdf->download($filename);
    }
}

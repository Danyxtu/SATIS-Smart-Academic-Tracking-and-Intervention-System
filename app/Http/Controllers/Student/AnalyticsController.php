<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Models\SystemSetting;
use App\Services\PredictionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    protected PredictionService $predictionService;

    public function __construct(PredictionService $predictionService)
    {
        $this->predictionService = $predictionService;
    }

    /**
     * Display the analytics index with all subjects and their grades.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $selectedSemester = $request->query('semester', SystemSetting::getCurrentSemester());
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        // Get all enrollments for this student with related data
        $enrollments = Enrollment::with([
            'subject.teacher',
            'subject.masterSubject',
            'grades',
            'attendanceRecords',
            'intervention',
        ])
            ->where('user_id', $user->id)
            ->get();

        // Filter enrollments by semester (if master subject exists)
        $filteredEnrollments = $enrollments->filter(function ($enrollment) use ($selectedSemester) {
            $masterSubject = $enrollment->subject?->masterSubject;
            // If no master subject, show in both semesters
            if (!$masterSubject) {
                return true;
            }
            return $masterSubject->semester == $selectedSemester;
        });

        // Build subjects data with calculated grades and predictions
        $subjects = $filteredEnrollments->map(function ($enrollment) {
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            $percentage = $totalPossible > 0 ? round(($totalScore / $totalPossible) * 100) : null;

            // Calculate attendance rate
            $attendance = $enrollment->attendanceRecords;
            $totalDays = $attendance->count();
            $presentDays = $attendance->whereIn('status', ['present', 'excused'])->count();
            $lateDays = $attendance->where('status', 'late')->count();
            $attendanceRate = $totalDays > 0
                ? round((($presentDays + ($lateDays * 0.5)) / $totalDays) * 100)
                : 100;

            // Count missing assignments
            $missingCount = $grades->filter(fn($g) => $g->score === null || $g->score === 0)->count();

            // Get risk category from PredictionService
            $riskCategory = $this->predictionService->determineRiskCategory($percentage, $missingCount, $attendanceRate);
            $riskKey = $this->predictionService->getRiskCategoryKey($percentage, $missingCount, $attendanceRate);

            // Get prediction
            $prediction = $this->predictionService->predictFinalGrade($enrollment);

            return [
                'id' => $enrollment->id,
                'subjectId' => $enrollment->subject_id,
                'subject' => $enrollment->subject?->name ?? 'Unknown Subject',
                'teacher' => $enrollment->subject?->teacher?->name ?? 'N/A',
                'grade' => $percentage,
                'attendanceRate' => $attendanceRate,
                'missingCount' => $missingCount,
                // New risk category format
                'riskCategory' => $riskKey,
                'riskLabel' => $riskCategory['label'],
                'riskColor' => $riskCategory['color'],
                // Legacy status for backwards compatibility
                'status' => match ($riskKey) {
                    'on_track' => 'good',
                    'needs_attention' => 'warning',
                    'at_risk', 'critical' => 'critical',
                    default => 'good',
                },
                'hasIntervention' => $enrollment->intervention !== null,
                'gradeCount' => $grades->count(),
                // Prediction data
                'predictedGrade' => $prediction['predicted_grade'],
                'gradeTrend' => $prediction['trend'],
                'trendDirection' => $prediction['trend_direction'],
                // Semester info
                'semester' => $enrollment->subject?->masterSubject?->semester ?? null,
            ];
        })->sortByDesc('grade')->values();

        // Calculate overall statistics
        $overallGrade = $subjects->whereNotNull('grade')->avg('grade');
        $overallGrade = $overallGrade ? round($overallGrade, 1) : null;

        $subjectsAtRisk = $subjects->filter(fn($s) => in_array($s['riskCategory'], ['at_risk', 'critical']))->count();
        $subjectsNeedingAttention = $subjects->filter(fn($s) => $s['riskCategory'] === 'needs_attention')->count();

        // Calculate stats for each semester for navigation display
        $semester1Subjects = $enrollments->filter(function ($e) {
            $semester = $e->subject?->masterSubject?->semester;
            return $semester === 1 || $semester === null;
        });
        $semester2Subjects = $enrollments->filter(function ($e) {
            return $e->subject?->masterSubject?->semester === 2;
        });

        return Inertia::render('Student/Analytics/Index', [
            'subjects' => $subjects,
            'stats' => [
                'overallGrade' => $overallGrade,
                'totalSubjects' => $subjects->count(),
                'subjectsAtRisk' => $subjectsAtRisk,
                'subjectsNeedingAttention' => $subjectsNeedingAttention,
                'subjectsExcelling' => $subjects->filter(fn($s) => $s['grade'] !== null && $s['grade'] >= 90)->count(),
                'subjectsOnTrack' => $subjects->filter(fn($s) => $s['riskCategory'] === 'on_track')->count(),
            ],
            'semesters' => [
                'current' => (int) $selectedSemester,
                'schoolYear' => $currentSchoolYear,
                'semester1Count' => $semester1Subjects->count(),
                'semester2Count' => $semester2Subjects->count(),
            ],
        ]);
    }

    /**
     * Display detailed analytics for a specific subject/enrollment.
     */
    public function show(Request $request, $enrollmentId): Response
    {
        $user = $request->user();

        // Get the specific enrollment with all related data
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

        // Get comprehensive analytics from PredictionService
        $analytics = $this->predictionService->getStudentAnalytics($enrollment);

        // Group grades by quarter
        $quarterlyData = $grades->groupBy('quarter')->map(function ($quarterGrades, $quarter) use ($enrollment) {
            $qScore = $quarterGrades->sum('score');
            $qTotal = $quarterGrades->sum('total_score');
            $qGrade = $qTotal > 0 ? round(($qScore / $qTotal) * 100) : null;

            // Get attendance for this quarter (approximate by date range)
            $attendance = $enrollment->attendanceRecords;
            $totalDays = $attendance->count();
            $presentDays = $attendance->whereIn('status', ['present', 'excused'])->count();
            $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

            // Determine remarks
            $remarks = 'N/A';
            if ($qGrade !== null) {
                if ($qGrade >= 90) $remarks = 'Excellent';
                elseif ($qGrade >= 85) $remarks = 'Very Good';
                elseif ($qGrade >= 80) $remarks = 'Good';
                elseif ($qGrade >= 75) $remarks = 'Satisfactory';
                else $remarks = 'Needs Improvement';
            }

            return [
                'quarter' => "Q{$quarter}",
                'quarterNum' => $quarter,
                'grade' => $qGrade,
                'remarks' => $remarks,
                'attendance' => "{$attendanceRate}%",
                'assignmentCount' => $quarterGrades->count(),
            ];
        })->sortBy('quarterNum')->values();

        // Build grade breakdown by category/assignment
        $gradeBreakdown = $grades->map(function ($grade) {
            $percentage = $grade->total_score > 0
                ? round(($grade->score / $grade->total_score) * 100)
                : null;
            return [
                'id' => $grade->id,
                'name' => $grade->assignment_name,
                'key' => $grade->assignment_key,
                'score' => $grade->score,
                'totalScore' => $grade->total_score,
                'percentage' => $percentage,
                'quarter' => $grade->quarter,
                'createdAt' => $grade->created_at->format('M d, Y'),
            ];
        })->sortByDesc('created_at')->values();

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

        // Get intervention data (as feedback/notes)
        $intervention = $enrollment->intervention;
        $interventionData = null;
        if ($intervention) {
            $interventionData = [
                'id' => $intervention->id,
                'type' => $intervention->type,
                'typeLabel' => \App\Models\Intervention::getTypes()[$intervention->type] ?? $intervention->type,
                'status' => $intervention->status,
                'notes' => $intervention->notes,
                'tasks' => $intervention->tasks->map(fn($t) => [
                    'id' => $t->id,
                    'description' => $t->description,
                    'isCompleted' => $t->is_completed,
                ])->values(),
                'completedTasks' => $intervention->tasks->where('is_completed', true)->count(),
                'totalTasks' => $intervention->tasks->count(),
            ];
        }

        // Determine school year (from subject or current)
        $schoolYear = $subject?->school_year ?? date('Y') . '-' . (date('Y') + 1);

        return Inertia::render('Student/Analytics/Show', [
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
            'intervention' => $interventionData,
            // Enhanced analytics from PredictionService
            'prediction' => $analytics['prediction'],
            'risk' => $analytics['risk'],
            'suggestions' => $analytics['suggestions'],
        ]);
    }

    /**
     * Export student analytics as a PDF.
     */
    public function exportPdf(Request $request, $enrollmentId)
    {
        $user = $request->user();

        $enrollment = Enrollment::with([
            'subject.teacher',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
            'user',
        ])
            ->where('user_id', $user->id)
            ->where('id', $enrollmentId)
            ->firstOrFail();

        $subject = $enrollment->subject;
        // Build the same data as `show()` to ensure parity
        $grades = $enrollment->grades;

        $totalScore = $grades->sum('score');
        $totalPossible = $grades->sum('total_score');
        $overallGrade = $totalPossible > 0 ? round(($totalScore / $totalPossible) * 100) : null;

        $analytics = $this->predictionService->getStudentAnalytics($enrollment);

        // Group grades by quarter
        $quarterlyData = $grades->groupBy('quarter')->map(function ($quarterGrades, $quarter) use ($enrollment) {
            $qScore = $quarterGrades->sum('score');
            $qTotal = $quarterGrades->sum('total_score');
            $qGrade = $qTotal > 0 ? round(($qScore / $qTotal) * 100) : null;

            // Determine attendance roughly
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

        // Check if PDF package present
        $pdfClass = 'Barryvdh\\DomPDF\\Facade\\Pdf';
        if (! class_exists($pdfClass)) {
            return response()->json([
                'message' => 'PDF export not available. Please install barryvdh/laravel-dompdf via Composer: composer require barryvdh/laravel-dompdf',
            ], 501);
        }

        $dataForView = [
            'student' => [
                'name' => $enrollment->user->name,
                'lrn' => $enrollment->user->student->lrn ?? null,
            ],
            'subject' => [
                'name' => $subject->name,
                'section' => $subject->section,
                'grade_level' => $subject->grade_level,
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
            'prediction' => $analytics['prediction'],
            'risk' => $analytics['risk'],
            'suggestions' => $analytics['suggestions'],
        ];

        $pdf = $pdfClass::loadView('pdf.student_analytics', $dataForView);
        $filename = sprintf('analytics_%s_%s.pdf', $enrollment->id, now()->format('Y-m-d'));

        return $pdf->download($filename);
    }
}

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

        $requestedRiskFilter = (string) $request->query('risk', 'all');
        $allowedRiskFilters = ['all', 'at-risk', 'critical', 'needs_attention', 'on_track'];
        $activeRiskFilter = in_array($requestedRiskFilter, $allowedRiskFilters, true)
            ? $requestedRiskFilter
            : 'all';

        // Get all enrollments for this student with related data
        $enrollments = Enrollment::with([
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

        // Filter enrollments by semester
        $filteredEnrollments = $enrollments->filter(function ($enrollment) use ($selectedSemester) {
            $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
            $semester = $class?->semester;
            // If no semester set, show in both semesters
            if (!$semester) {
                return true;
            }
            return $semester == $selectedSemester;
        });

        // Build subjects data with calculated grades and predictions
        $subjects = $filteredEnrollments->map(function ($enrollment) {
            $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
            $subject = $class?->subject ?? $enrollment->subject;
            $teacher = $class?->teacher;

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
                'subjectId' => $class?->subject_id ?? $subject?->id,
                'subject' => $subject?->subject_name ?? 'Unknown Subject',
                'teacher' => $teacher?->name ?? 'N/A',
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
                'semester' => $class?->semester ?? null,
            ];
        })->sortByDesc('grade')->values();

        // Calculate overall statistics
        $overallGrade = $subjects->whereNotNull('grade')->avg('grade');
        $overallGrade = $overallGrade ? round($overallGrade, 1) : null;

        $subjectsAtRisk = $subjects->filter(fn($s) => in_array($s['riskCategory'], ['at_risk', 'critical']))->count();
        $subjectsNeedingAttention = $subjects->filter(fn($s) => $s['riskCategory'] === 'needs_attention')->count();

        // Calculate stats for each semester for navigation display
        $semester1Subjects = $enrollments->filter(function ($e) {
            $class = $e->subjectTeacher ?? $e->schoolClass;
            $semester = $class?->semester;
            return $semester === 1 || $semester === null;
        });
        $semester2Subjects = $enrollments->filter(function ($e) {
            $class = $e->subjectTeacher ?? $e->schoolClass;
            return $class?->semester === 2;
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
            'activeRiskFilter' => $activeRiskFilter,
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
        $teacher = $class?->teacher;
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
        $schoolYear = $class?->school_year ?? SystemSetting::getCurrentSchoolYear();

        return Inertia::render('Student/Analytics/Show', [
            'enrollment' => [
                'id' => $enrollment->id,
                'subjectId' => $class?->subject_id ?? $subject?->id,
            ],
            'subject' => [
                'id' => $subject?->id,
                // Subject model uses `subject_name` column; use that to avoid "Unknown Subject"
                'name' => $subject?->subject_name ?? 'Unknown Subject',
                // Safely build teacher full name (fixing previous typo)
                'teacher' => $teacher?->name ?? 'N/A',
                'section' => $class?->section ?? $subject?->section,
                'schoolYear' => $schoolYear,
                'current_quarter' => $class?->current_quarter ?? 1,
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
     * Display quarter details page with grade category/activity breakdown.
     */
    public function showQuarter(Request $request, $enrollmentId, $quarter): Response
    {
        $user = $request->user();
        $selectedQuarter = (int) $quarter;

        if ($selectedQuarter < 1 || $selectedQuarter > 4) {
            abort(404);
        }

        $enrollment = Enrollment::with([
            'subjectTeacher.subject',
            'subjectTeacher.teacher',
            'schoolClass.subject',
            'schoolClass.teacher',
            'subject',
            'grades',
        ])
            ->where('user_id', $user->id)
            ->where('id', $enrollmentId)
            ->firstOrFail();

        $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
        $subject = $class?->subject ?? $enrollment->subject;
        $teacher = $class?->teacher;
        $storedCategories = $class?->grade_categories ?? [];

        $quarterNumbers = collect([1, 2, $selectedQuarter])
            ->filter(fn($q) => $q >= 1 && $q <= 4)
            ->unique()
            ->values();

        $quarters = $quarterNumbers
            ->map(function ($quarterNumber) use ($enrollment, $storedCategories) {
                $categories = $this->resolveQuarterCategories($storedCategories, (int) $quarterNumber);
                return $this->buildQuarterInsights($enrollment, (int) $quarterNumber, $categories);
            })
            ->values();

        $midtermQuarter = $quarters->firstWhere('quarter', 1);
        $finalQuarter = $quarters->firstWhere('quarter', 2);

        $midtermQuarterGrade = $midtermQuarter['quarterlyGrade'] ?? null;
        $finalQuarterGrade = $finalQuarter['quarterlyGrade'] ?? null;

        $combinedAverage = ($midtermQuarterGrade !== null && $finalQuarterGrade !== null)
            ? $enrollment->final_grade
            : null;

        $remarks = trim((string) ($enrollment->remarks ?? ''));
        $remarks = $remarks !== '' ? $remarks : 'N/A';

        if ($finalQuarterGrade === null || $combinedAverage === null) {
            $remarks = 'N/A';
        }

        $schoolYear = $class?->school_year ?? SystemSetting::getCurrentSchoolYear();

        return Inertia::render('Student/Analytics/QuarterDetails', [
            'enrollment' => [
                'id' => $enrollment->id,
                'subjectId' => $class?->subject_id ?? $subject?->id,
            ],
            'subject' => [
                'id' => $subject?->id,
                'name' => $subject?->subject_name ?? 'Unknown Subject',
                'teacher' => $teacher?->name ?? 'N/A',
                'section' => $class?->section ?? $subject?->section,
                'schoolYear' => $schoolYear,
            ],
            'selectedQuarter' => $selectedQuarter,
            'quarters' => $quarters,
            'overallFinal' => [
                'midtermQuarterGrade' => $midtermQuarterGrade,
                'finalQuarterGrade' => $finalQuarterGrade,
                'combinedAverage' => $combinedAverage,
                'remarks' => $remarks,
            ],
        ]);
    }

    private function buildQuarterInsights(Enrollment $enrollment, int $quarter, array $categories): array
    {
        $quarterGrades = $enrollment->grades
            ->where('quarter', $quarter)
            ->values();

        $scoredQuarterGrades = $quarterGrades
            ->filter(fn($grade) => $grade->score !== null && $grade->score !== '')
            ->values();

        $hasStarted = $scoredQuarterGrades->isNotEmpty();

        $scoresByKey = $quarterGrades->keyBy(fn($grade) => (string) $grade->assignment_key);

        $totalScore = (float) $scoredQuarterGrades->sum(fn($grade) => (float) $grade->score);
        $totalPossible = (float) $scoredQuarterGrades->sum(fn($grade) => (float) ($grade->total_score ?? 0));
        $rawQuarterGrade = $totalPossible > 0
            ? round(($totalScore / $totalPossible) * 100, 1)
            : null;

        $initialGrade = match ($quarter) {
            1 => $hasStarted ? $enrollment->initial_grade_q1 : null,
            2 => $hasStarted ? $enrollment->initial_grade_q2 : null,
            default => $rawQuarterGrade,
        };

        $expectedGrade = match ($quarter) {
            1 => $hasStarted ? $enrollment->expected_grade_q1 : null,
            2 => $hasStarted ? $enrollment->expected_grade_q2 : null,
            default => $rawQuarterGrade,
        };

        $quarterlyGrade = match ($quarter) {
            1 => $hasStarted ? $enrollment->q1_grade : null,
            2 => $hasStarted ? $enrollment->q2_grade : null,
            default => $rawQuarterGrade !== null ? (int) round($rawQuarterGrade) : null,
        };

        $categoryRows = collect($categories)
            ->map(function ($category) use ($scoresByKey, $quarterlyGrade) {
                $tasks = collect($category['tasks'] ?? [])
                    ->filter(fn($task) => is_array($task))
                    ->values();

                $activities = $tasks
                    ->map(function ($task) use ($scoresByKey) {
                        $taskId = (string) ($task['id'] ?? '');
                        $grade = $taskId !== '' ? $scoresByKey->get($taskId) : null;

                        $taskTotal = is_numeric($task['total'] ?? null)
                            ? (float) $task['total']
                            : (float) ($grade?->total_score ?? 0);

                        $score = $grade?->score;
                        $percentage = ($score !== null && $taskTotal > 0)
                            ? round(((float) $score / $taskTotal) * 100, 1)
                            : null;

                        $taskName = trim((string) ($grade?->assignment_name ?? ($task['label'] ?? ($task['name'] ?? ''))));

                        if ($taskName === '') {
                            $taskName = $taskId !== '' ? $taskId : 'Activity';
                        }

                        return [
                            'id' => $taskId,
                            'name' => $taskName,
                            'score' => $score,
                            'totalScore' => $taskTotal > 0 ? round($taskTotal, 2) : null,
                            'percentage' => $percentage,
                        ];
                    })
                    ->values();

                $completedActivities = $activities->filter(fn($item) => $item['score'] !== null)->count();
                $earnedScore = (float) $activities
                    ->filter(fn($item) => $item['score'] !== null)
                    ->sum(fn($item) => (float) $item['score']);
                $possibleScore = (float) $activities
                    ->filter(fn($item) => $item['score'] !== null && $item['totalScore'] !== null)
                    ->sum(fn($item) => (float) $item['totalScore']);

                $categoryInitial = $possibleScore > 0
                    ? round(($earnedScore / $possibleScore) * 100, 1)
                    : null;

                return [
                    'id' => (string) ($category['id'] ?? ''),
                    'label' => (string) ($category['label'] ?? 'Category'),
                    'weight' => (float) ($category['weight'] ?? 0),
                    'activitiesCount' => $tasks->count(),
                    'completedActivities' => $completedActivities,
                    'initialGrade' => $categoryInitial,
                    'expectedGrade' => $categoryInitial,
                    'quarterlyGrade' => $quarterlyGrade,
                    'activities' => $activities,
                ];
            })
            ->values();

        $knownTaskIds = collect($categories)
            ->flatMap(fn($category) => collect($category['tasks'] ?? [])->pluck('id'))
            ->filter()
            ->map(fn($id) => (string) $id)
            ->values();

        $uncategorizedGrades = $quarterGrades
            ->filter(fn($grade) => !$knownTaskIds->contains((string) $grade->assignment_key))
            ->values();

        if ($uncategorizedGrades->isNotEmpty()) {
            $uncategorizedActivities = $uncategorizedGrades
                ->map(function ($grade) {
                    $taskTotal = (float) $grade->total_score;
                    $score = $grade->score;
                    $percentage = ($score !== null && $taskTotal > 0)
                        ? round(((float) $score / $taskTotal) * 100, 1)
                        : null;

                    return [
                        'id' => (string) ($grade->assignment_key ?? $grade->id),
                        'name' => (string) ($grade->assignment_name ?? 'Activity'),
                        'score' => $score,
                        'totalScore' => $taskTotal > 0 ? round($taskTotal, 2) : null,
                        'percentage' => $percentage,
                    ];
                })
                ->values();

            $earnedScore = (float) $uncategorizedActivities
                ->filter(fn($item) => $item['score'] !== null)
                ->sum(fn($item) => (float) $item['score']);
            $possibleScore = (float) $uncategorizedActivities
                ->filter(fn($item) => $item['score'] !== null && $item['totalScore'] !== null)
                ->sum(fn($item) => (float) $item['totalScore']);

            $uncategorizedInitial = $possibleScore > 0
                ? round(($earnedScore / $possibleScore) * 100, 1)
                : null;

            $categoryRows->push([
                'id' => 'uncategorized',
                'label' => 'Uncategorized Activities',
                'weight' => 0,
                'activitiesCount' => $uncategorizedActivities->count(),
                'completedActivities' => $uncategorizedActivities->filter(fn($item) => $item['score'] !== null)->count(),
                'initialGrade' => $uncategorizedInitial,
                'expectedGrade' => $uncategorizedInitial,
                'quarterlyGrade' => $quarterlyGrade,
                'activities' => $uncategorizedActivities,
            ]);
        }

        return [
            'quarter' => $quarter,
            'label' => $this->quarterLabel($quarter),
            'hasStarted' => $hasStarted,
            'initialGrade' => $initialGrade,
            'expectedGrade' => $expectedGrade,
            'quarterlyGrade' => $quarterlyGrade,
            'totalActivities' => $categoryRows->sum('activitiesCount'),
            'completedActivities' => $categoryRows->sum('completedActivities'),
            'categories' => $categoryRows,
        ];
    }

    private function resolveQuarterCategories(array $storedCategories, int $quarter): array
    {
        $firstQuarter = $storedCategories['1'] ?? $storedCategories[1] ?? null;

        if ($firstQuarter !== null && is_array($firstQuarter) && !isset($firstQuarter['id']) && !isset($firstQuarter['label'])) {
            return $storedCategories[$quarter] ?? $storedCategories[(string) $quarter] ?? [];
        }

        return $storedCategories;
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
     * Export student analytics as a PDF.
     */
    public function exportPdf(Request $request, $enrollmentId)
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
            'user',
        ])
            ->where('user_id', $user->id)
            ->where('id', $enrollmentId)
            ->firstOrFail();

        $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
        $subject = $class?->subject ?? $enrollment->subject;
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
                'name' => $subject?->subject_name ?? 'Unknown Subject',
                'section' => $class?->section ?? $subject?->section,
                'grade_level' => $class?->grade_level ?? $subject?->grade_level,
                'current_quarter' => $class?->current_quarter ?? 1,
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

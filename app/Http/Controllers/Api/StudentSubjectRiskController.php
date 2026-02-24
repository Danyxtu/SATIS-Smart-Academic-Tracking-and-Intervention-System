<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Intervention;
use Illuminate\Http\Request;

class StudentSubjectRiskController extends Controller
{
    /**
     * Display subjects at risk for the student (JSON API).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get all enrollments with related data
        $enrollments = Enrollment::with([
            'subjectTeacher.subject',
            'subjectTeacher.teacher',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
        ])
            ->where('user_id', $user->id)
            ->get();

        // Process each enrollment to determine risk status
        $subjects = $enrollments->map(function ($enrollment) {
            $subject = $enrollment->subjectTeacher?->subject;
            $grades = $enrollment->grades;
            $attendance = $enrollment->attendanceRecords;
            $intervention = $enrollment->intervention;

            // Calculate overall grade
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            $currentGrade = $totalPossible > 0
                ? round(($totalScore / $totalPossible) * 100, 1)
                : null;

            // Calculate attendance rate
            $totalDays = $attendance->count();
            $presentDays = $attendance->where('status', 'present')->count();
            $absentDays = $attendance->where('status', 'absent')->count();
            $lateDays = $attendance->where('status', 'late')->count();
            $attendanceRate = $totalDays > 0
                ? round(($presentDays / $totalDays) * 100, 1)
                : 100;

            // Group grades by category/type for breakdown
            $gradesByCategory = $grades->groupBy(function ($grade) {
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
                return 'other';
            })->map(function ($categoryGrades) {
                $score = $categoryGrades->sum('score');
                $possible = $categoryGrades->sum('total_score');
                return [
                    'score' => $score,
                    'total' => $possible,
                    'percentage' => $possible > 0 ? round(($score / $possible) * 100, 1) : null,
                    'count' => $categoryGrades->count(),
                ];
            });

            // Group grades by quarter
            $gradesByQuarter = $grades->groupBy('quarter')->map(function ($quarterGrades) {
                $score = $quarterGrades->sum('score');
                $possible = $quarterGrades->sum('total_score');
                return [
                    'score' => $score,
                    'total' => $possible,
                    'percentage' => $possible > 0 ? round(($score / $possible) * 100, 1) : null,
                ];
            });

            // Calculate grade trend by comparing quarterly performance (same as Performance Analytics)
            // Group grades by quarter and compare Q1 to Q2
            $q1Grades = $grades->where('quarter', 1);
            $q2Grades = $grades->where('quarter', 2);

            $q1Score = $q1Grades->sum('score');
            $q1Total = $q1Grades->sum('total_score');
            $q1Grade = $q1Total > 0 ? ($q1Score / $q1Total) * 100 : null;

            $q2Score = $q2Grades->sum('score');
            $q2Total = $q2Grades->sum('total_score');
            $q2Grade = $q2Total > 0 ? ($q2Score / $q2Total) * 100 : null;

            // Calculate trend using the same logic as StudentPerformanceController
            $trend = 'new'; // Default for first quarter or no data

            if ($q2Grade !== null && $q1Grade !== null) {
                // We have both quarters - compare them
                $difference = $q2Grade - $q1Grade;

                // Consider stable if within 3% variance (same threshold as PerformanceController)
                if (abs($difference) <= 3) {
                    $trend = 'stable';
                } elseif ($difference > 0) {
                    $trend = 'improving';
                } else {
                    $trend = 'declining';
                }
            } elseif ($q1Grade !== null && $q2Grade === null) {
                // Only Q1 exists - this is the baseline
                $trend = 'new';
            } elseif ($q2Grade !== null && $q1Grade === null) {
                // Only Q2 exists (unusual) - treat as new baseline
                $trend = 'new';
            }
            // If no grades at all, trend stays 'new'

            // Determine risk level
            $riskLevel = 'low';
            $riskReasons = [];

            if ($currentGrade !== null) {
                if ($currentGrade < 70) {
                    $riskLevel = 'high';
                    $riskReasons[] = 'Grade below 70%';
                } elseif ($currentGrade < 75) {
                    $riskLevel = 'medium';
                    $riskReasons[] = 'Grade below passing (75%)';
                }
            }

            if ($attendanceRate < 80) {
                if ($riskLevel !== 'high') $riskLevel = 'high';
                $riskReasons[] = 'Attendance below 80%';
            } elseif ($attendanceRate < 90) {
                if ($riskLevel === 'low') $riskLevel = 'medium';
                $riskReasons[] = 'Attendance needs improvement';
            }

            // Check for low category scores
            foreach ($gradesByCategory as $category => $data) {
                if ($data['percentage'] !== null && $data['percentage'] < 70) {
                    if ($riskLevel === 'low') $riskLevel = 'medium';
                    $riskReasons[] = ucfirst(str_replace('_', ' ', $category)) . ' score is low (' . $data['percentage'] . '%)';
                }
            }

            // Check for missing work (0 scores)
            $missingWork = $grades->where('score', 0)->count();
            if ($missingWork > 0) {
                if ($riskLevel === 'low') $riskLevel = 'medium';
                $riskReasons[] = $missingWork . ' missing assignment(s)';
            }

            if ($trend === 'declining') {
                if ($riskLevel === 'low') $riskLevel = 'medium';
                $riskReasons[] = 'Grade trend is declining';
            }

            // Calculate expected/projected grade
            $expectedGrade = $currentGrade;
            if ($trend === 'declining' && $currentGrade !== null) {
                $expectedGrade = max(0, $currentGrade - 5);
            } elseif ($trend === 'improving' && $currentGrade !== null) {
                $expectedGrade = min(100, $currentGrade + 5);
            }

            // Generate advice based on risk
            $advice = 'Keep up the great work!';
            if ($riskLevel === 'high') {
                $advice = 'Immediate action required. Consider meeting with your teacher.';
            } elseif ($riskLevel === 'medium') {
                $advice = 'Focus on improving weak areas and maintain consistent study habits.';
            }

            // Get recent grade entries
            $recentGradeEntries = $grades->sortByDesc('created_at')->take(5)->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->assignment_name,
                'score' => $g->score,
                'totalScore' => $g->total_score,
                'percentage' => $g->total_score > 0 ? round(($g->score / $g->total_score) * 100, 1) : 0,
                'quarter' => $g->quarter,
                'date' => $g->created_at->format('M d'),
            ])->values();

            // Calculate course progress (% of graded items vs expected)
            $courseProgress = $currentGrade ?? 0;

            // Get risk label text
            $riskLabel = match ($riskLevel) {
                'high' => 'High Risk',
                'medium' => 'Medium Risk',
                default => 'Low Risk',
            };

            return [
                'id' => $enrollment->id,
                'subjectId' => $enrollment->subjectTeacher?->subject_id,
                'name' => $subject?->name ?? 'Unknown Subject',
                'instructor' => $enrollment->subjectTeacher?->teacher?->name ?? 'N/A',
                'section' => $subject?->section,
                'grade' => $currentGrade,
                'expectedGrade' => $expectedGrade !== null ? round($expectedGrade, 1) : null,
                'attendanceRate' => $attendanceRate,
                'totalClasses' => $totalDays,
                'presentDays' => $presentDays,
                'absentDays' => $absentDays,
                'lateDays' => $lateDays,
                'trend' => $trend,
                'risk' => $riskLabel,
                'riskLevel' => $riskLevel,
                'riskReasons' => $riskReasons,
                'missingWork' => $missingWork,
                'courseProgress' => $courseProgress,
                'advice' => $advice,
                'deadline' => now()->addWeeks(2)->format('M d, Y'), // Placeholder
                'gradesByCategory' => $gradesByCategory,
                'gradesByQuarter' => $gradesByQuarter,
                'recentGrades' => $recentGradeEntries,
                'intervention' => $intervention ? [
                    'id' => $intervention->id,
                    'type' => $intervention->type,
                    'typeLabel' => Intervention::getTypes()[$intervention->type] ?? $intervention->type,
                    'status' => $intervention->status,
                    'notes' => $intervention->notes,
                    'createdAt' => $intervention->created_at->format('M d, Y'),
                    'tasks' => ($intervention->tasks ?? collect())->map(fn($t) => [
                        'id' => $t->id,
                        'description' => $t->description,
                        'isCompleted' => $t->is_completed,
                    ])->values(),
                ] : null,
            ];
        })
            ->sortBy(function ($subject) {
                // Sort by risk level (high first)
                $order = ['high' => 0, 'medium' => 1, 'low' => 2];
                return $order[$subject['riskLevel']] ?? 3;
            })
            ->values();

        // Calculate summary stats
        $highRiskCount = $subjects->where('riskLevel', 'high')->count();
        $mediumRiskCount = $subjects->where('riskLevel', 'medium')->count();
        $lowRiskCount = $subjects->where('riskLevel', 'low')->count();

        return response()->json([
            'subjects' => $subjects,
            'stats' => [
                'total' => $subjects->count(),
                'highRisk' => $highRiskCount,
                'mediumRisk' => $mediumRiskCount,
                'lowRisk' => $lowRiskCount,
                'atRiskCount' => $highRiskCount + $mediumRiskCount,
            ],
        ]);
    }
}

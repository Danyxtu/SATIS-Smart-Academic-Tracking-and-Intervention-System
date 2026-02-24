<?php

namespace App\Services;

use App\Models\Enrollment;
use Illuminate\Support\Collection;

class PredictionService
{
    /**
     * Risk category thresholds and labels.
     */
    public const RISK_CATEGORIES = [
        'on_track' => [
            'label' => 'On Track',
            'color' => 'green',
            'min_grade' => 85,
            'max_missing' => 1,
            'min_attendance' => 90,
        ],
        'needs_attention' => [
            'label' => 'Needs Attention',
            'color' => 'yellow',
            'min_grade' => 75,
            'max_missing' => 3,
            'min_attendance' => 80,
        ],
        'at_risk' => [
            'label' => 'At Risk',
            'color' => 'orange',
            'min_grade' => 65,
            'max_missing' => 5,
            'min_attendance' => 70,
        ],
        'critical' => [
            'label' => 'Critical',
            'color' => 'red',
            'min_grade' => 0,
            'max_missing' => 999,
            'min_attendance' => 0,
        ],
    ];

    /**
     * Determine the risk category for a student based on their performance.
     */
    public function determineRiskCategory(
        ?float $currentGrade,
        int $missingAssignments = 0,
        float $attendanceRate = 100
    ): array {
        // If no grade yet, use attendance and missing work
        if ($currentGrade === null) {
            if ($missingAssignments >= 5 || $attendanceRate < 70) {
                return self::RISK_CATEGORIES['critical'];
            }
            if ($missingAssignments >= 3 || $attendanceRate < 80) {
                return self::RISK_CATEGORIES['at_risk'];
            }
            if ($missingAssignments >= 1 || $attendanceRate < 90) {
                return self::RISK_CATEGORIES['needs_attention'];
            }
            return self::RISK_CATEGORIES['on_track'];
        }

        // Weighted score calculation
        $gradeWeight = 0.6;
        $attendanceWeight = 0.25;
        $missingWeight = 0.15;

        // Normalize missing assignments (0-100 scale, inverse)
        $missingScore = max(0, 100 - ($missingAssignments * 15));

        // Calculate weighted performance score
        $performanceScore = ($currentGrade * $gradeWeight)
            + ($attendanceRate * $attendanceWeight)
            + ($missingScore * $missingWeight);

        // Determine category based on weighted score
        if ($performanceScore >= 85) {
            return self::RISK_CATEGORIES['on_track'];
        }
        if ($performanceScore >= 75) {
            return self::RISK_CATEGORIES['needs_attention'];
        }
        if ($performanceScore >= 65) {
            return self::RISK_CATEGORIES['at_risk'];
        }

        return self::RISK_CATEGORIES['critical'];
    }

    /**
     * Get the risk category key (e.g., 'on_track', 'at_risk').
     */
    public function getRiskCategoryKey(
        ?float $currentGrade,
        int $missingAssignments = 0,
        float $attendanceRate = 100
    ): string {
        $category = $this->determineRiskCategory($currentGrade, $missingAssignments, $attendanceRate);

        return array_search($category, self::RISK_CATEGORIES) ?: 'on_track';
    }

    /**
     * Calculate predicted final grade based on current performance and trends.
     */
    public function predictFinalGrade(Enrollment $enrollment): array
    {
        $grades = $enrollment->grades()->orderBy('created_at')->get();

        if ($grades->isEmpty()) {
            return [
                'predicted_grade' => null,
                'confidence' => 0,
                'trend' => 'unknown',
                'trend_direction' => 0,
                'message' => 'Not enough data to predict final grade.',
            ];
        }

        // Calculate current grade
        $totalScore = $grades->sum('score');
        $totalPossible = $grades->sum('total_score');
        $currentGrade = $totalPossible > 0 ? ($totalScore / $totalPossible) * 100 : 0;

        // Calculate grade trend using simple linear regression
        $gradePoints = $grades->map(function ($grade, $index) {
            $percentage = $grade->total_score > 0
                ? ($grade->score / $grade->total_score) * 100
                : 0;
            return ['x' => $index, 'y' => $percentage];
        });

        $trend = $this->calculateTrend($gradePoints);

        // Predict final grade based on trend
        $remainingAssignments = $this->estimateRemainingAssignments($enrollment);
        $trendImpact = $trend['slope'] * $remainingAssignments;

        // Predicted grade with trend adjustment (clamped to 0-100)
        $predictedGrade = max(0, min(100, $currentGrade + ($trendImpact * 0.5)));

        // Calculate confidence based on data points
        $dataPoints = $grades->count();
        $confidence = min(95, 30 + ($dataPoints * 8));

        // Determine trend description
        $trendDescription = 'Stable';
        $trendDirection = 0;

        if ($trend['slope'] > 2) {
            $trendDescription = 'Improving';
            $trendDirection = 1;
        } elseif ($trend['slope'] < -2) {
            $trendDescription = 'Declining';
            $trendDirection = -1;
        }

        return [
            'current_grade' => round($currentGrade, 1),
            'predicted_grade' => round($predictedGrade, 1),
            'confidence' => $confidence,
            'trend' => $trendDescription,
            'trend_direction' => $trendDirection,
            'trend_slope' => round($trend['slope'], 2),
            'data_points' => $dataPoints,
            'message' => $this->generatePredictionMessage($currentGrade, $predictedGrade, $trendDescription),
        ];
    }

    /**
     * Calculate trend using simple linear regression.
     */
    private function calculateTrend(Collection $points): array
    {
        $n = $points->count();

        if ($n < 2) {
            return ['slope' => 0, 'intercept' => 0];
        }

        $sumX = $points->sum('x');
        $sumY = $points->sum('y');
        $sumXY = $points->sum(fn($p) => $p['x'] * $p['y']);
        $sumX2 = $points->sum(fn($p) => $p['x'] * $p['x']);

        $denominator = ($n * $sumX2) - ($sumX * $sumX);

        if ($denominator == 0) {
            return ['slope' => 0, 'intercept' => $sumY / $n];
        }

        $slope = (($n * $sumXY) - ($sumX * $sumY)) / $denominator;
        $intercept = ($sumY - ($slope * $sumX)) / $n;

        return ['slope' => $slope, 'intercept' => $intercept];
    }

    /**
     * Estimate remaining assignments in the grading period.
     */
    private function estimateRemainingAssignments(Enrollment $enrollment): int
    {
        // Get the subject's grade structure
        $subjectTeacher = $enrollment->subjectTeacher;
        $gradeCategories = $subjectTeacher?->grade_categories ?? [];

        // Count total expected assignments from structure
        $totalExpected = 0;
        foreach ($gradeCategories as $category) {
            $totalExpected += count($category['tasks'] ?? []);
        }

        // Count completed assignments
        $completed = $enrollment->grades()->count();

        // Estimate remaining (minimum 3 for prediction purposes)
        return max(3, $totalExpected - $completed);
    }

    /**
     * Generate a human-readable prediction message.
     */
    private function generatePredictionMessage(float $current, float $predicted, string $trend): string
    {
        $difference = $predicted - $current;

        if ($predicted >= 90) {
            return "Excellent! You're on track for outstanding performance.";
        }

        if ($predicted >= 85) {
            if ($trend === 'Improving') {
                return "Great progress! Keep up the momentum to reach excellence.";
            }
            return "Very good performance expected. Stay consistent.";
        }

        if ($predicted >= 75) {
            if ($trend === 'Declining') {
                return "Warning: Your grades are slipping. Focus on upcoming assignments.";
            }
            return "Satisfactory performance expected. There's room for improvement.";
        }

        if ($trend === 'Improving') {
            return "You're improving, but need to accelerate. Seek help if needed.";
        }

        return "Alert: Your predicted grade is below passing. Immediate action required.";
    }

    /**
     * Generate smart study suggestions based on performance analysis.
     */
    public function generateStudySuggestions(Enrollment $enrollment): array
    {
        $grades = $enrollment->grades;
        $attendance = $enrollment->attendanceRecords ?? collect();

        $totalScore = $grades->sum('score');
        $totalPossible = $grades->sum('total_score');
        $currentGrade = $totalPossible > 0 ? ($totalScore / $totalPossible) * 100 : null;

        $totalDays = $attendance->count();
        $presentDays = $attendance->whereIn('status', ['present', 'excused'])->count();
        $attendanceRate = $totalDays > 0 ? ($presentDays / $totalDays) * 100 : 100;

        $suggestions = [];

        // Analyze grade categories to find weak areas
        $categoryPerformance = $this->analyzeByCategory($grades);

        // Low-scoring categories
        foreach ($categoryPerformance as $category => $performance) {
            if ($performance['percentage'] !== null && $performance['percentage'] < 75) {
                $suggestions[] = [
                    'type' => 'focus_area',
                    'priority' => 'high',
                    'icon' => 'target',
                    'title' => "Focus on {$category}",
                    'message' => "Your {$category} average is {$performance['percentage']}%. Practice more problems in this area.",
                    'actions' => [
                        "Review notes and materials for {$category}",
                        "Complete practice exercises before next assessment",
                        "Ask your teacher for additional resources",
                    ],
                ];
            }
        }

        // Missing assignments
        $missingCount = $grades->filter(fn($g) => $g->score === null || $g->score === 0)->count();
        if ($missingCount > 0) {
            $suggestions[] = [
                'type' => 'missing_work',
                'priority' => 'high',
                'icon' => 'alert-circle',
                'title' => 'Complete Missing Assignments',
                'message' => "You have {$missingCount} missing or incomplete assignment(s). Completing these can significantly boost your grade.",
                'actions' => [
                    "Make a list of all missing assignments",
                    "Set daily goals to complete 1-2 assignments",
                    "Ask for extensions if needed",
                ],
            ];
        }

        // Attendance-based suggestions
        if ($attendanceRate < 90) {
            $suggestions[] = [
                'type' => 'attendance',
                'priority' => $attendanceRate < 80 ? 'high' : 'medium',
                'icon' => 'calendar',
                'title' => 'Improve Attendance',
                'message' => "Your attendance rate is " . round($attendanceRate) . "%. Regular attendance helps you stay on track with lessons.",
                'actions' => [
                    "Set reminders for class times",
                    "Prepare materials the night before",
                    "Contact your teacher if you need to miss class",
                ],
            ];
        }

        // General study tips based on grade level
        if ($currentGrade !== null) {
            if ($currentGrade >= 90) {
                $suggestions[] = [
                    'type' => 'excellence',
                    'priority' => 'low',
                    'icon' => 'star',
                    'title' => 'Maintain Excellence',
                    'message' => "You're performing excellently! Keep challenging yourself.",
                    'actions' => [
                        "Help classmates who are struggling",
                        "Explore advanced topics in this subject",
                        "Participate in competitions or projects",
                    ],
                ];
            } elseif ($currentGrade >= 75 && $currentGrade < 85) {
                $suggestions[] = [
                    'type' => 'improvement',
                    'priority' => 'medium',
                    'icon' => 'trending-up',
                    'title' => 'Push for Higher Grades',
                    'message' => "You're doing well! With focused effort, you can reach excellence.",
                    'actions' => [
                        "Study for 30 extra minutes daily",
                        "Form or join a study group",
                        "Review errors on graded work",
                    ],
                ];
            } elseif ($currentGrade < 75) {
                $suggestions[] = [
                    'type' => 'urgent',
                    'priority' => 'high',
                    'icon' => 'alert-triangle',
                    'title' => 'Urgent: Get Support',
                    'message' => "Your grade is at risk. Take immediate action to improve.",
                    'actions' => [
                        "Schedule a meeting with your teacher",
                        "Visit during office hours for help",
                        "Consider tutoring or peer assistance",
                        "Create a daily study schedule",
                    ],
                ];
            }
        }

        // Time management suggestion
        $suggestions[] = [
            'type' => 'time_management',
            'priority' => 'low',
            'icon' => 'clock',
            'title' => 'Effective Study Habits',
            'message' => "Consistent study habits lead to better retention and grades.",
            'actions' => [
                "Use the Pomodoro technique: 25 min study, 5 min break",
                "Review notes within 24 hours of class",
                "Create summary sheets for each topic",
            ],
        ];

        // Sort by priority
        usort($suggestions, function ($a, $b) {
            $priorityOrder = ['high' => 0, 'medium' => 1, 'low' => 2];
            return ($priorityOrder[$a['priority']] ?? 2) <=> ($priorityOrder[$b['priority']] ?? 2);
        });

        return $suggestions;
    }

    /**
     * Analyze grades by category (Written Works, Performance Tasks, etc.)
     */
    private function analyzeByCategory(Collection $grades): array
    {
        $categories = [];

        foreach ($grades as $grade) {
            // Try to determine category from assignment key or name
            $categoryKey = $this->guessCategoryFromAssignment($grade->assignment_key, $grade->assignment_name);

            if (!isset($categories[$categoryKey])) {
                $categories[$categoryKey] = ['score' => 0, 'total' => 0, 'count' => 0];
            }

            $categories[$categoryKey]['score'] += $grade->score ?? 0;
            $categories[$categoryKey]['total'] += $grade->total_score ?? 0;
            $categories[$categoryKey]['count']++;
        }

        // Calculate percentages
        foreach ($categories as $key => &$data) {
            $data['percentage'] = $data['total'] > 0
                ? round(($data['score'] / $data['total']) * 100)
                : null;
        }

        return $categories;
    }

    /**
     * Guess the category from assignment key or name.
     */
    private function guessCategoryFromAssignment(?string $key, ?string $name): string
    {
        $text = strtolower(($key ?? '') . ' ' . ($name ?? ''));

        if (str_contains($text, 'exam') || str_contains($text, 'quarterly') || str_contains($text, 'periodical')) {
            return 'Quarterly Exam';
        }

        if (str_contains($text, 'performance') || str_contains($text, 'project') || str_contains($text, 'lab') || str_contains($text, 'activity')) {
            return 'Performance Tasks';
        }

        if (str_contains($text, 'written') || str_contains($text, 'quiz') || str_contains($text, 'seatwork') || str_contains($text, 'assignment')) {
            return 'Written Works';
        }

        return 'Other';
    }

    /**
     * Get comprehensive student analytics including prediction and risk.
     */
    public function getStudentAnalytics(Enrollment $enrollment): array
    {
        $grades = $enrollment->grades;
        $attendance = $enrollment->attendanceRecords ?? collect();

        // Calculate current metrics
        $totalScore = $grades->sum('score');
        $totalPossible = $grades->sum('total_score');
        $currentGrade = $totalPossible > 0 ? ($totalScore / $totalPossible) * 100 : null;

        $totalDays = $attendance->count();
        $presentDays = $attendance->whereIn('status', ['present', 'excused'])->count();
        $attendanceRate = $totalDays > 0 ? ($presentDays / $totalDays) * 100 : 100;

        $missingCount = $grades->filter(fn($g) => $g->score === null || $g->score === 0)->count();

        // Get predictions and suggestions
        $prediction = $this->predictFinalGrade($enrollment);
        $riskCategory = $this->determineRiskCategory($currentGrade, $missingCount, $attendanceRate);
        $riskKey = $this->getRiskCategoryKey($currentGrade, $missingCount, $attendanceRate);
        $suggestions = $this->generateStudySuggestions($enrollment);

        return [
            'current_grade' => $currentGrade ? round($currentGrade, 1) : null,
            'attendance_rate' => round($attendanceRate, 1),
            'missing_assignments' => $missingCount,
            'total_assignments' => $grades->count(),
            'risk' => [
                'key' => $riskKey,
                'label' => $riskCategory['label'],
                'color' => $riskCategory['color'],
            ],
            'prediction' => $prediction,
            'suggestions' => $suggestions,
        ];
    }
}

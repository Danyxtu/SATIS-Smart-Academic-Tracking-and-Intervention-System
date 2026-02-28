<?php

namespace App\Services;

use App\Models\Enrollment;
use Illuminate\Support\Collection;

/**
 * Grade Calculation Service
 * 
 * Handles all grade calculations for students.
 * Moved from frontend to ensure data integrity and consistency.
 */
class GradeCalculationService
{
    /**
     * Calculate final grade for a specific quarter
     */
    public function calculateFinalGrade(array $grades, array $categories, int $quarter = 1): string
    {
        if (empty($categories)) {
            return 'N/A';
        }

        $quarterGrades = $this->filterGradesByQuarter($grades, $quarter);

        $totalWeight = 0;
        $weightedScore = 0;

        foreach ($categories as $category) {
            $tasks = $category['tasks'] ?? [];
            $weight = $category['weight'] ?? 0;

            if (empty($tasks) || !$weight) {
                continue;
            }

            $earned = 0;
            $possible = 0;

            foreach ($tasks as $task) {
                $rawValue = $quarterGrades[$task['id']] ?? null;

                if ($rawValue === '' || $rawValue === null) {
                    continue;
                }

                $numericValue = (float) $rawValue;
                if (is_nan($numericValue)) {
                    continue;
                }

                $earned += $numericValue;
                $possible += (float) ($task['total'] ?? 0);
            }

            if ($possible === 0) {
                continue;
            }

            $categoryAverage = $earned / $possible;
            $weightedScore += $categoryAverage * $weight;
            $totalWeight += $weight;
        }

        if ($totalWeight === 0) {
            return '—';
        }

        $percentage = ($weightedScore / $totalWeight) * 100;
        return number_format($percentage, 1) . '%';
    }

    /**
     * Check if a quarter has quarterly exam scores
     */
    public function hasQuarterlyExamScores(array $grades, array $categories, int $quarter = 1): bool
    {
        $quarterlyExamCategory = collect($categories)->first(function ($category) {
            return ($category['id'] ?? '') === 'quarterly_exam' ||
                str_contains(strtolower($category['label'] ?? ''), 'quarterly exam');
        });

        if (!$quarterlyExamCategory || empty($quarterlyExamCategory['tasks'])) {
            return false;
        }

        foreach ($quarterlyExamCategory['tasks'] as $task) {
            $gradeKey = $quarter === 2 ? "q2_{$task['id']}" : $task['id'];
            $value = $grades[$gradeKey] ?? null;

            if ($value !== '' && $value !== null) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if quarter is complete (all categories have at least some scores)
     */
    public function isQuarterComplete(array $grades, array $categories, int $quarter = 1): bool
    {
        if (empty($categories)) {
            return false;
        }

        foreach ($categories as $category) {
            $tasks = $category['tasks'] ?? [];
            if (empty($tasks)) {
                return false;
            }

            $hasScores = false;
            foreach ($tasks as $task) {
                $gradeKey = $quarter === 2 ? "q2_{$task['id']}" : $task['id'];
                $value = $grades[$gradeKey] ?? null;

                if ($value !== '' && $value !== null) {
                    $hasScores = true;
                    break;
                }
            }

            if (!$hasScores) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate the overall final grade (average of Q1 and Q2)
     */
    public function calculateOverallFinalGrade(array $grades, array $categories): string
    {
        $q1Complete = $this->isQuarterComplete($grades, $categories, 1);
        $q2Complete = $this->isQuarterComplete($grades, $categories, 2);

        if (!$q1Complete || !$q2Complete) {
            return '—';
        }

        $q1Grade = $this->calculateFinalGrade($grades, $categories, 1);
        $q2Grade = $this->calculateFinalGrade($grades, $categories, 2);

        if ($q1Grade === '—' || $q2Grade === '—') {
            return '—';
        }

        $q1Numeric = (float) str_replace('%', '', $q1Grade);
        $q2Numeric = (float) str_replace('%', '', $q2Grade);

        if (is_nan($q1Numeric) || is_nan($q2Numeric)) {
            return '—';
        }

        $average = ($q1Numeric + $q2Numeric) / 2;
        return number_format($average, 1) . '%';
    }

    /**
     * Calculate Expected Quarterly Grade
     * Projects what the grade would be if all remaining tasks are completed at current performance level
     */
    public function calculateExpectedQuarterlyGrade(array $grades, array $categories, int $quarter = 1): string
    {
        if (empty($categories)) {
            return 'N/A';
        }

        $quarterGrades = $this->filterGradesByQuarter($grades, $quarter);

        $totalEarned = 0;
        $totalPossible = 0;
        $completedTasksCount = 0;
        $totalTasksCount = 0;

        // Calculate current performance across all categories
        foreach ($categories as $category) {
            $tasks = $category['tasks'] ?? [];

            foreach ($tasks as $task) {
                $totalTasksCount++;
                $rawValue = $quarterGrades[$task['id']] ?? null;
                $taskTotal = (float) ($task['total'] ?? 0);

                if ($rawValue !== '' && $rawValue !== null && $taskTotal > 0) {
                    $numericValue = (float) $rawValue;
                    if (!is_nan($numericValue)) {
                        $totalEarned += $numericValue;
                        $totalPossible += $taskTotal;
                        $completedTasksCount++;
                    }
                }
            }
        }

        if ($completedTasksCount === 0 || $totalPossible === 0) {
            return 'Insufficient Data';
        }

        $currentPerformanceRate = $totalEarned / $totalPossible;

        // Apply current performance to incomplete tasks
        $projectedTotalEarned = $totalEarned;
        $projectedTotalPossible = $totalPossible;

        foreach ($categories as $category) {
            $tasks = $category['tasks'] ?? [];

            foreach ($tasks as $task) {
                $rawValue = $quarterGrades[$task['id']] ?? null;
                $taskTotal = (float) ($task['total'] ?? 0);

                if (($rawValue === '' || $rawValue === null) && $taskTotal > 0) {
                    $projectedTotalEarned += $taskTotal * $currentPerformanceRate;
                    $projectedTotalPossible += $taskTotal;
                }
            }
        }

        if ($projectedTotalPossible === 0) {
            return 'N/A';
        }

        $projectedPercentage = ($projectedTotalEarned / $projectedTotalPossible) * 100;
        return number_format($projectedPercentage, 1) . '%';
    }

    /**
     * Calculate all grade data for a student
     */
    public function calculateStudentGrades(Enrollment $enrollment, array $gradeStructure): array
    {
        $grades = $enrollment->grades->keyBy('assignment_key')->map->score->toArray();
        $categories = $gradeStructure['categories'] ?? [];

        return [
            'q1_grade' => $this->calculateFinalGrade($grades, $categories, 1),
            'q2_grade' => $this->calculateFinalGrade($grades, $categories, 2),
            'overall_grade' => $this->calculateOverallFinalGrade($grades, $categories),
            'q1_complete' => $this->isQuarterComplete($grades, $categories, 1),
            'q2_complete' => $this->isQuarterComplete($grades, $categories, 2),
            'q1_has_exam' => $this->hasQuarterlyExamScores($grades, $categories, 1),
            'q2_has_exam' => $this->hasQuarterlyExamScores($grades, $categories, 2),
            'q1_expected' => $this->calculateExpectedQuarterlyGrade($grades, $categories, 1),
            'q2_expected' => $this->calculateExpectedQuarterlyGrade($grades, $categories, 2),
        ];
    }

    /**
     * Calculate grades for multiple students in a class
     */
    public function calculateClassGrades(Collection $enrollments, array $gradeStructure): array
    {
        return $enrollments->map(function ($enrollment) use ($gradeStructure) {
            return [
                'enrollment_id' => $enrollment->id,
                'student' => $enrollment->user->student ?? null,
                'calculated_grades' => $this->calculateStudentGrades($enrollment, $gradeStructure),
            ];
        })->toArray();
    }

    /**
     * Filter grades by quarter
     */
    private function filterGradesByQuarter(array $grades, int $quarter): array
    {
        $quarterGrades = [];

        foreach ($grades as $key => $value) {
            $isQ1Grade = !str_starts_with($key, 'q2_');
            $isQ2Grade = str_starts_with($key, 'q2_');

            if ($quarter === 1 && $isQ1Grade) {
                $quarterGrades[$key] = $value;
            } elseif ($quarter === 2 && $isQ2Grade) {
                $quarterGrades[str_replace('q2_', '', $key)] = $value;
            } elseif ($quarter === 1) {
                // For backward compatibility, use raw grades for Q1
                $quarterGrades[$key] = $value;
            }
        }

        return $quarterGrades;
    }
}

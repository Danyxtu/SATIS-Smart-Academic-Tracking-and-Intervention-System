<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Services\TransmutationGradeServices;

/**
 * Enrollment Grade Service
 *
 * Computes and persists all enrollment-level grades:
 * - Initial Grade (raw weighted percentage per quarter)
 * - Expected Grade (trend-projected grade per quarter)
 * - Quarterly Grade (transmuted via DepEd transmutation table)
 * - Final Grade (average of transmuted Q1 & Q2)
 */
class EnrollmentGradeService
{
    public function __construct(
        protected TransmutationGradeServices $transmutationService,
    ) {}

    // =========================================================================
    // Public API
    // =========================================================================

    /**
     * Recalculate and persist all grade columns for every enrollment in a class.
     */
    public function recalculateClassGrades(SchoolClass $subjectTeacher): void
    {
        $subjectTeacher->load(['enrollments.grades', 'enrollments.attendanceRecords']);
        $storedCategories = $subjectTeacher->grade_categories ?? [];

        foreach ($subjectTeacher->enrollments as $enrollment) {
            $this->recalculateEnrollmentGrades($enrollment, $storedCategories);
        }
    }

    /**
     * Recalculate and persist all grade columns for a single enrollment.
     *
     * @param  array  $storedCategories  The full per-quarter map { 1: [...], 2: [...] } or legacy flat array
     */
    public function recalculateEnrollmentGrades(Enrollment $enrollment, array $storedCategories): void
    {
        // Group grades by their quarter column, then map assignment_key => score
        $gradesByQuarter = $enrollment->grades->groupBy('quarter')->map(function ($quarterGrades) {
            return $quarterGrades->mapWithKeys(fn($g) => [$g->assignment_key => $g->score])->toArray();
        })->toArray();

        $q1Grades = $gradesByQuarter[1] ?? [];
        $q2Grades = $gradesByQuarter[2] ?? [];

        // Resolve categories per quarter
        $q1Categories = $this->resolveCategories($storedCategories, 1);
        $q2Categories = $this->resolveCategories($storedCategories, 2);
        $attendanceRate = $this->resolveAttendanceRate($enrollment);

        // --- Quarter 1 ---
        $initialQ1 = $this->computeInitialGrade($q1Grades, $q1Categories, $attendanceRate);
        $expectedQ1 = $this->computeExpectedGrade($q1Grades, $q1Categories, $attendanceRate);
        $q1Transmuted = $initialQ1 !== null
            ? $this->transmutationService->transmuteGrade($initialQ1)
            : null;

        // --- Quarter 2 ---
        $initialQ2 = $this->computeInitialGrade($q2Grades, $q2Categories, $attendanceRate);
        $expectedQ2 = $this->computeExpectedGrade($q2Grades, $q2Categories, $attendanceRate);
        $q2Transmuted = $initialQ2 !== null
            ? $this->transmutationService->transmuteGrade($initialQ2)
            : null;

        // --- Final Grade ---
        $finalGrade = ($q1Transmuted !== null && $q2Transmuted !== null)
            ? (int) round(($q1Transmuted + $q2Transmuted) / 2)
            : null;
        $remarks = $this->deriveRemarks($finalGrade);

        $enrollment->update([
            'initial_grade_q1' => $initialQ1 !== null ? round($initialQ1, 2) : null,
            'expected_grade_q1' => $expectedQ1 !== null ? round($expectedQ1, 2) : null,
            'q1_grade' => $q1Transmuted,
            'initial_grade_q2' => $initialQ2 !== null ? round($initialQ2, 2) : null,
            'expected_grade_q2' => $expectedQ2 !== null ? round($expectedQ2, 2) : null,
            'q2_grade' => $q2Transmuted,
            'final_grade' => $finalGrade,
            'remarks' => $remarks,
        ]);
    }

    /**
     * Build a summary array for a single enrollment (used by the controller/API).
     */
    public function buildGradeSummary(Enrollment $enrollment): array
    {
        return [
            'initial_grade_q1' => $enrollment->initial_grade_q1,
            'expected_grade_q1' => $enrollment->expected_grade_q1,
            'q1_grade' => $enrollment->q1_grade,
            'initial_grade_q2' => $enrollment->initial_grade_q2,
            'expected_grade_q2' => $enrollment->expected_grade_q2,
            'q2_grade' => $enrollment->q2_grade,
            'final_grade' => $enrollment->final_grade,
            'remarks' => $enrollment->remarks ?? $this->deriveRemarks($enrollment->final_grade),
        ];
    }

    // =========================================================================
    // Grade Computation (private)
    // =========================================================================

    /**
     * Compute the raw weighted percentage for a set of grades (already filtered by quarter).
     *
     * Returns null if no scores exist.
     */
    private function computeInitialGrade(array $grades, array $categories, ?float $attendanceRate = null): ?float
    {
        $totalWeight = 0;
        $weightedScore = 0;
        $hasAnyScore = false;

        foreach ($categories as $category) {
            $tasks = $category['tasks'] ?? [];
            $weight = (float) ($category['weight'] ?? 0);

            if ($this->isAttendanceCategory($category)) {
                if ($weight > 0 && $attendanceRate !== null) {
                    $weightedScore += $attendanceRate * $weight;
                    $totalWeight += $weight;
                    $hasAnyScore = true;
                }
                continue;
            }

            if (empty($tasks) || $weight <= 0) {
                continue;
            }

            $earned = 0;
            $possible = 0;

            foreach ($tasks as $task) {
                $value = $grades[$task['id']] ?? null;
                if ($value === null || $value === '') {
                    continue;
                }

                $earned += (float) $value;
                $possible += (float) ($task['total'] ?? 0);
                $hasAnyScore = true;
            }

            if ($possible <= 0) {
                continue;
            }

            $weightedScore += ($earned / $possible) * $weight;
            $totalWeight += $weight;
        }

        if (!$hasAnyScore || $totalWeight <= 0) {
            return null;
        }

        return ($weightedScore / $totalWeight) * 100;
    }

    /**
     * Compute the expected (trend-projected) grade for a set of grades (already filtered by quarter).
     *
     * Algorithm:
     * 1. Collect each task's percentage in chronological order.
     * 2. Compute the average percentage change between consecutive tasks (trend).
     * 3. Project the trend forward for every incomplete task.
     * 4. Re-weight by category to produce the projected overall percentage.
     *
     * Returns null if fewer than 2 scored tasks exist (can't determine a trend).
     */
    private function computeExpectedGrade(array $grades, array $categories, ?float $attendanceRate = null): ?float
    {
        // 1) Collect chronological task percentages across ALL categories
        $taskPercentages = [];

        foreach ($categories as $category) {
            if ($this->isAttendanceCategory($category)) {
                continue;
            }

            foreach ($category['tasks'] ?? [] as $task) {
                $value = $grades[$task['id']] ?? null;
                $total = (float) ($task['total'] ?? 0);

                if ($value !== null && $value !== '' && $total > 0) {
                    $taskPercentages[] = ((float) $value / $total) * 100;
                }
            }
        }

        // Need at least 2 data points to calculate a trend
        if (count($taskPercentages) < 2) {
            return null;
        }

        // 2) Compute the average change between consecutive tasks
        $changes = [];
        for ($i = 1; $i < count($taskPercentages); $i++) {
            $changes[] = $taskPercentages[$i] - $taskPercentages[$i - 1];
        }
        $averageChange = array_sum($changes) / count($changes);

        // Current performance rate (latest data point)
        $latestPercentage = end($taskPercentages);

        // 3) Project forward for each incomplete task
        $projectedIndex = 1;
        $totalWeight = 0;
        $weightedScore = 0;

        foreach ($categories as $category) {
            $tasks = $category['tasks'] ?? [];
            $weight = (float) ($category['weight'] ?? 0);

            if ($this->isAttendanceCategory($category)) {
                if ($weight > 0 && $attendanceRate !== null) {
                    $weightedScore += $attendanceRate * $weight;
                    $totalWeight += $weight;
                }
                continue;
            }

            if (empty($tasks) || $weight <= 0) {
                continue;
            }

            $earned = 0;
            $possible = 0;

            foreach ($tasks as $task) {
                $value = $grades[$task['id']] ?? null;
                $total = (float) ($task['total'] ?? 0);

                if ($total <= 0) {
                    continue;
                }

                if ($value !== null && $value !== '') {
                    // Actual score
                    $earned += (float) $value;
                } else {
                    // Projected score: latest + trend * steps, clamped to [0, total]
                    $projected = ($latestPercentage + ($averageChange * $projectedIndex)) / 100 * $total;
                    $earned += max(0, min($total, $projected));
                    $projectedIndex++;
                }

                $possible += $total;
            }

            if ($possible <= 0) {
                continue;
            }

            $weightedScore += ($earned / $possible) * $weight;
            $totalWeight += $weight;
        }

        if ($totalWeight <= 0) {
            return null;
        }

        return ($weightedScore / $totalWeight) * 100;
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /**
     * Resolve categories for a specific quarter from the stored structure.
     *
     * Handles both per-quarter { "1": [...], "2": [...] } and legacy flat [...] formats.
     */
    private function resolveCategories(array $storedCategories, int $quarter): array
    {
        // Detect per-quarter format by checking if key "1"/1 holds a list of categories
        // (not a single category object which would have 'id'/'label' keys).
        $firstQuarter = $storedCategories['1'] ?? $storedCategories[1] ?? null;

        if ($firstQuarter !== null && is_array($firstQuarter) && !isset($firstQuarter['id']) && !isset($firstQuarter['label'])) {
            return $storedCategories[$quarter] ?? $storedCategories[(string) $quarter] ?? [];
        }

        // Legacy flat format — same categories for both quarters
        return $storedCategories;
    }

    private function isAttendanceCategory(array $category): bool
    {
        $id = strtolower((string) ($category['id'] ?? ''));
        $label = strtolower((string) ($category['label'] ?? ''));

        return $id === 'attendance' || str_contains($label, 'attendance');
    }

    private function resolveAttendanceRate(Enrollment $enrollment): ?float
    {
        $records = $enrollment->relationLoaded('attendanceRecords')
            ? $enrollment->attendanceRecords
            : $enrollment->attendanceRecords()->get();

        $totalMeetings = $records->count();

        if ($totalMeetings <= 0) {
            return null;
        }

        $presentCount = $records->where('status', 'present')->count();

        return max(0.0, min(1.0, $presentCount / $totalMeetings));
    }

    private function deriveRemarks(?int $finalGrade): ?string
    {
        if ($finalGrade === null) {
            return null;
        }

        return $finalGrade >= 75 ? 'Passed' : 'Failed';
    }
}

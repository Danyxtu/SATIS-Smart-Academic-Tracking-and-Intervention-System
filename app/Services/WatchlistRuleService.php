<?php

namespace App\Services;

use App\Models\Enrollment;
use Illuminate\Support\Collection;

class WatchlistRuleService
{
    private const RISK_META = [
        'at_risk' => [
            'label' => 'At Risk',
            'color' => 'red',
            'priority' => 'High',
            'watch_level' => 'high',
        ],
        'needs_attention' => [
            'label' => 'Needs Attention',
            'color' => 'orange',
            'priority' => 'Medium',
            'watch_level' => 'medium',
        ],
        'recent_decline' => [
            'label' => 'Recent Decline',
            'color' => 'blue',
            'priority' => 'Low',
            'watch_level' => 'low',
        ],
        'on_track' => [
            'label' => 'On Track',
            'color' => 'green',
            'priority' => 'Low',
            'watch_level' => 'none',
        ],
    ];

    public function __construct(
        private PredictionService $predictionService,
        private TransmutationGradeServices $transmutationService,
    ) {}

    /**
     * Evaluate one enrollment against the shared watchlist policy.
     *
     * This keeps teacher dashboard/watchlist logic in one place and is
     * intentionally config-driven so per-class customization can be added later.
     */
    public function evaluateEnrollment(Enrollment $enrollment, ?array $ruleOverrides = null): array
    {
        $enrollment->loadMissing(['grades', 'attendanceRecords']);

        $rules = array_replace_recursive(config('watchlist', []), $ruleOverrides ?? []);
        $passingGrade = (float) data_get($rules, 'passing_grade', 75.0);

        $highRiskAbsenceThreshold = (int) data_get($rules, 'high_risk.absence_threshold', 5);
        $needsAttentionAbsenceThreshold = (int) data_get($rules, 'needs_attention.absence_threshold', 3);
        $needsAttentionFailingActivitiesThreshold = (int) data_get(
            $rules,
            'needs_attention.failing_activities_threshold',
            3,
        );

        $declineMinimumDropPercent = (float) data_get(
            $rules,
            'recent_decline.minimum_drop_percent',
            data_get($rules, 'recent_decline.massive_drop_percent', 20.0),
        );
        $declineRequiresFailingFinalQuarter = (bool) data_get(
            $rules,
            'recent_decline.require_final_quarter_failing',
            true,
        );

        $grades = $enrollment->grades;
        $scoredGrades = $this->filterScoredGrades($grades);

        $rawOverallGrade = $this->calculateOverallGradePercentage($scoredGrades);
        $hasGrades = $rawOverallGrade !== null;
        
        // TRANSMUTE RAW GRADE TO DEPED SCALE
        $transmutedOverallGrade = $hasGrades 
            ? (float) $this->transmutationService->transmuteGrade($rawOverallGrade)
            : null;

        $absences = (int) $enrollment->attendanceRecords
            ->where('status', 'absent')
            ->count();

        $failingActivitiesTotal = $this->countFailingActivities($scoredGrades, $passingGrade);

        $normalizedRemarks = strtolower(trim((string) ($enrollment->remarks ?? '')));
        $isRemarkedPassed = $normalizedRemarks === 'passed';

        $quarterAverages = $this->calculateQuarterAverages($scoredGrades);
        $midtermRawGrade = $this->resolveMidtermAverage($quarterAverages);
        $finalQuarterRawGrade = $this->resolveFinalQuarterAverage($quarterAverages);
        
        // Transmute quarter averages for better decline comparison and failing check
        $midtermGrade = $midtermRawGrade !== null 
            ? (float) $this->transmutationService->transmuteGrade($midtermRawGrade)
            : null;
        $finalQuarterGrade = $finalQuarterRawGrade !== null
            ? (float) $this->transmutationService->transmuteGrade($finalQuarterRawGrade)
            : null;

        $finalQuarterNumber = $quarterAverages->keys()->last();

        $finalQuarterFailingActivities = $finalQuarterNumber !== null
            ? $this->countFailingActivities(
                $scoredGrades->where('quarter', (int) $finalQuarterNumber),
                $passingGrade,
            )
            : 0;

        $midtermExamTaken = $this->hasQuarterlyExam($scoredGrades, 1);
        $finalQuarterExamTaken = $this->hasQuarterlyExam($scoredGrades, 2);

        $prediction = $this->predictionService->predictFinalGrade($enrollment);
        $predictedRawGrade = is_numeric(data_get($prediction, 'predicted_grade'))
            ? (float) data_get($prediction, 'predicted_grade')
            : $finalQuarterRawGrade;
        
        $predictedGrade = $predictedRawGrade !== null
            ? (float) $this->transmutationService->transmuteGrade($predictedRawGrade)
            : null;

        $trendDirection = (int) data_get($prediction, 'trend_direction', 0);
        $trendLabel = (string) data_get($prediction, 'trend', 'Stable');

        $declineReferenceGrade = $finalQuarterGrade ?? $predictedGrade;

        $dropPoints = $midtermGrade !== null && $declineReferenceGrade !== null
            ? round($midtermGrade - $declineReferenceGrade, 2)
            : null;
        $dropPercent = $dropPoints !== null && $midtermGrade > 0
            ? round(($dropPoints / $midtermGrade) * 100, 2)
            : null;

        // Determine individual quarter risk
        $midtermFailing = $midtermGrade !== null && $midtermGrade < $passingGrade;
        // BUG FIX: Quarter 2 risk evaluation ONLY after final exam taken
        $finalQuarterFailing = $finalQuarterGrade !== null && $finalQuarterGrade < $passingGrade && $finalQuarterExamTaken;
        $absenceThresholdReached = $absences >= $highRiskAbsenceThreshold;

        // High risk: below passing in Q1, Q2 OR absences reached the high-risk threshold,
        // except when the enrollment is explicitly marked as Passed.
        $atRisk = ! $isRemarkedPassed
            && (
                $midtermFailing
                || $finalQuarterFailing
                || $absenceThresholdReached
            );

        // Medium risk: either attendance concern OR sustained failing activity pattern.
        $needsAttention = ! $atRisk
            && (
                $absences >= $needsAttentionAbsenceThreshold
                || $failingActivitiesTotal >= $needsAttentionFailingActivitiesThreshold
            );

        $hasDownTrend = ($dropPoints !== null && $dropPoints > 0)
            || $trendDirection < 0;
        $hasQuarterDrop = $midtermGrade !== null
            && $finalQuarterGrade !== null
            && $finalQuarterGrade < $midtermGrade;
        $meetsDropPercent = $dropPercent !== null
            && $dropPercent >= $declineMinimumDropPercent;
        $finalQuarterIsFailing = $finalQuarterGrade !== null
            && $finalQuarterGrade < $passingGrade;
        $meetsFinalQuarterRequirement = ! $declineRequiresFailingFinalQuarter
            || $finalQuarterIsFailing;

        // Low risk: decline trend from midterm to final quarter using percentage threshold.
        $recentDecline = ! $atRisk
            && ! $needsAttention
            && $hasDownTrend
            && $hasQuarterDrop
            && $meetsDropPercent
            && $meetsFinalQuarterRequirement;

        $riskKey = match (true) {
            $atRisk => 'at_risk',
            $needsAttention => 'needs_attention',
            $recentDecline => 'recent_decline',
            default => 'on_track',
        };

        $meta = self::RISK_META[$riskKey];

        return [
            'risk_key' => $riskKey,
            'risk_label' => $meta['label'],
            'risk_color' => $meta['color'],
            'priority' => $meta['priority'],
            'watch_level' => $meta['watch_level'],
            'at_risk' => $riskKey === 'at_risk',
            'needs_attention' => $riskKey === 'needs_attention',
            'recent_decline' => $riskKey === 'recent_decline',
            'reasons' => $this->buildReasons(
                $riskKey,
                $midtermGrade,
                $finalQuarterGrade,
                $absences,
                $failingActivitiesTotal,
                $dropPoints,
                $dropPercent,
                $passingGrade,
                $highRiskAbsenceThreshold,
                $needsAttentionAbsenceThreshold,
                $needsAttentionFailingActivitiesThreshold,
                $finalQuarterExamTaken,
            ),
            'metrics' => [
                'has_grades' => $hasGrades,
                'graded_items_count' => $scoredGrades->count(),
                'total_items_count' => $grades->count(),
                'current_grade' => $transmutedOverallGrade,
                'raw_grade' => $rawOverallGrade,
                'absences' => $absences,
                'failing_activities_total' => $failingActivitiesTotal,
                'failing_activities_final_quarter' => $finalQuarterFailingActivities,
                'midterm_grade' => $midtermGrade,
                'midterm_exam_taken' => $midtermExamTaken,
                'final_quarter_grade' => $finalQuarterGrade,
                'final_quarter_exam_taken' => $finalQuarterExamTaken,
                'predicted_grade' => $predictedGrade,
                'trend_direction' => $trendDirection,
                'trend' => $trendLabel,
                'drop_points' => $dropPoints,
                'drop_percent' => $dropPercent,
            ],
        ];
    }

    private function calculateOverallGradePercentage(Collection $grades): ?float
    {
        if ($grades->isEmpty()) {
            return null;
        }

        $totalScore = (float) $grades->sum('score');
        $totalPossible = (float) $grades->sum('total_score');

        if ($totalPossible <= 0) {
            return null;
        }

        return round(($totalScore / $totalPossible) * 100, 2);
    }

    private function calculateQuarterAverages(Collection $grades): Collection
    {
        return $grades
            ->groupBy(fn($grade) => (int) $grade->quarter)
            ->map(function (Collection $quarterGrades) {
                $totalScore = (float) $quarterGrades->sum('score');
                $totalPossible = (float) $quarterGrades->sum('total_score');

                if ($totalPossible <= 0) {
                    return null;
                }

                return round(($totalScore / $totalPossible) * 100, 2);
            })
            ->filter(fn($average) => $average !== null)
            ->sortKeys();
    }

    private function resolveMidtermAverage(Collection $quarterAverages): ?float
    {
        // Explicitly only Q1
        return $quarterAverages->has(1) ? (float) $quarterAverages->get(1) : null;
    }

    private function resolveFinalQuarterAverage(Collection $quarterAverages): ?float
    {
        // Explicitly only Q2
        return $quarterAverages->has(2) ? (float) $quarterAverages->get(2) : null;
    }

    private function countFailingActivities(Collection $grades, float $passingGrade): int
    {
        return $grades
            ->filter(function ($grade) use ($passingGrade) {
                $score = $grade->score;
                if ($score === null || ! is_numeric($score)) {
                    return false;
                }

                $totalScore = (float) ($grade->total_score ?? 0);
                if ($totalScore <= 0) {
                    return false;
                }

                $percentage = (((float) $score) / $totalScore) * 100;

                return $percentage < $passingGrade;
            })
            ->count();
    }

    private function filterScoredGrades(Collection $grades): Collection
    {
        return $grades
            ->filter(function ($grade) {
                $score = $grade->score;
                if ($score === null || ! is_numeric($score)) {
                    return false;
                }

                return (float) ($grade->total_score ?? 0) > 0;
            })
            ->values();
    }

    private function hasQuarterlyExam(Collection $grades, int $quarter): bool
    {
        return $grades->where('quarter', $quarter)->contains(function ($grade) {
            $name = strtolower($grade->assignment_name ?? '');
            $key = strtolower($grade->assignment_key ?? '');
            return str_contains($name, 'exam') || str_contains($key, 'exam') || str_contains($name, 'quarterly') || str_contains($key, 'qe');
        });
    }

    private function buildReasons(
        string $riskKey,
        ?float $midtermGrade,
        ?float $finalQuarterGrade,
        int $absences,
        int $failingActivitiesTotal,
        ?float $dropPoints,
        ?float $dropPercent,
        float $passingGrade,
        int $highRiskAbsenceThreshold,
        int $needsAttentionAbsenceThreshold,
        int $needsAttentionFailingActivitiesThreshold,
        bool $finalQuarterExamTaken = false,
    ): array {
        return match ($riskKey) {
            'at_risk' => array_values(array_filter([
                ($midtermGrade !== null && $midtermGrade < $passingGrade)
                    ? sprintf('Quarter 1 grade %.1f%% is below %.0f%%.', $midtermGrade, $passingGrade)
                    : null,
                ($finalQuarterGrade !== null && $finalQuarterGrade < $passingGrade && $finalQuarterExamTaken)
                    ? sprintf('Quarter 2 grade %.1f%% is below %.0f%%.', $finalQuarterGrade, $passingGrade)
                    : null,
                $absences >= $highRiskAbsenceThreshold
                    ? sprintf(
                        '%d absence(s) reached the high-risk threshold (%d).',
                        $absences,
                        $highRiskAbsenceThreshold,
                    )
                    : null,
            ])),
            'needs_attention' => array_values(array_filter([
                $absences >= $needsAttentionAbsenceThreshold
                    ? sprintf(
                        '%d absence(s) reached the needs attention threshold (%d).',
                        $absences,
                        $needsAttentionAbsenceThreshold,
                    )
                    : null,
                $failingActivitiesTotal >= $needsAttentionFailingActivitiesThreshold
                    ? sprintf(
                        '%d failing activity score(s) reached the threshold (%d).',
                        $failingActivitiesTotal,
                        $needsAttentionFailingActivitiesThreshold,
                    )
                    : null,
            ])),
            'recent_decline' => array_values(array_filter([
                $midtermGrade !== null && $finalQuarterGrade !== null
                    ? sprintf('Midterm %.1f%% to final quarter %.1f%%.', $midtermGrade, $finalQuarterGrade)
                    : null,
                $dropPoints !== null
                    ? sprintf('Decline of %.1f point(s) (%.1f%%).', $dropPoints, (float) ($dropPercent ?? 0.0))
                    : null,
                $finalQuarterGrade !== null && $finalQuarterGrade < $passingGrade && $finalQuarterExamTaken
                    ? sprintf('Final quarter %.1f%% is below the passing score %.0f%%.', $finalQuarterGrade, $passingGrade)
                    : null,
            ])),
            default => ['Performance is currently within watchlist thresholds.'],
        };
    }
}

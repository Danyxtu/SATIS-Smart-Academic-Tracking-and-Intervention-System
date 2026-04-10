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

    public function __construct(private PredictionService $predictionService) {}

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

        $overallGrade = $this->calculateOverallGradePercentage($scoredGrades);
        $hasGrades = $overallGrade !== null;

        $absences = (int) $enrollment->attendanceRecords
            ->where('status', 'absent')
            ->count();

        $failingActivitiesTotal = $this->countFailingActivities($scoredGrades, $passingGrade);

        $quarterAverages = $this->calculateQuarterAverages($scoredGrades);
        $midtermGrade = $this->resolveMidtermAverage($quarterAverages);
        $finalQuarterGrade = $this->resolveFinalQuarterAverage($quarterAverages);
        $finalQuarterNumber = $quarterAverages->keys()->last();

        $finalQuarterFailingActivities = $finalQuarterNumber !== null
            ? $this->countFailingActivities(
                $scoredGrades->where('quarter', (int) $finalQuarterNumber),
                $passingGrade,
            )
            : 0;

        $prediction = $this->predictionService->predictFinalGrade($enrollment);
        $predictedGrade = is_numeric(data_get($prediction, 'predicted_grade'))
            ? (float) data_get($prediction, 'predicted_grade')
            : $finalQuarterGrade;
        $trendDirection = (int) data_get($prediction, 'trend_direction', 0);
        $trendLabel = (string) data_get($prediction, 'trend', 'Stable');

        $declineReferenceGrade = $finalQuarterGrade ?? $predictedGrade;

        $dropPoints = $midtermGrade !== null && $declineReferenceGrade !== null
            ? round($midtermGrade - $declineReferenceGrade, 2)
            : null;
        $dropPercent = $dropPoints !== null && $midtermGrade > 0
            ? round(($dropPoints / $midtermGrade) * 100, 2)
            : null;

        // High risk: below passing OR absences reached the high-risk threshold.
        $atRisk = ($hasGrades && $overallGrade < $passingGrade)
            || $absences >= $highRiskAbsenceThreshold;

        // Medium risk: either attendance concern OR sustained failing activity pattern.
        $needsAttention = ! $atRisk
            && (
                $absences > $needsAttentionAbsenceThreshold
                || $failingActivitiesTotal > $needsAttentionFailingActivitiesThreshold
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
                $overallGrade,
                $absences,
                $failingActivitiesTotal,
                $midtermGrade,
                $finalQuarterGrade,
                $dropPoints,
                $dropPercent,
                $passingGrade,
            ),
            'metrics' => [
                'has_grades' => $hasGrades,
                'graded_items_count' => $scoredGrades->count(),
                'total_items_count' => $grades->count(),
                'current_grade' => $overallGrade,
                'absences' => $absences,
                'failing_activities_total' => $failingActivitiesTotal,
                'failing_activities_final_quarter' => $finalQuarterFailingActivities,
                'midterm_grade' => $midtermGrade,
                'final_quarter_grade' => $finalQuarterGrade,
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
        if ($quarterAverages->isEmpty()) {
            return null;
        }

        if ($quarterAverages->has(1)) {
            return (float) $quarterAverages->get(1);
        }

        return (float) $quarterAverages->first();
    }

    private function resolveFinalQuarterAverage(Collection $quarterAverages): ?float
    {
        if ($quarterAverages->isEmpty()) {
            return null;
        }

        return (float) $quarterAverages->last();
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

    private function buildReasons(
        string $riskKey,
        ?float $overallGrade,
        int $absences,
        int $failingActivitiesTotal,
        ?float $midtermGrade,
        ?float $finalQuarterGrade,
        ?float $dropPoints,
        ?float $dropPercent,
        float $passingGrade,
    ): array {
        return match ($riskKey) {
            'at_risk' => array_values(array_filter([
                $overallGrade !== null
                    ? sprintf('Current grade %.2f%% is below %.2f%%.', $overallGrade, $passingGrade)
                    : null,
                $absences > 0
                    ? sprintf('%d absence(s) reached the high-risk threshold.', $absences)
                    : null,
            ])),
            'needs_attention' => [
                sprintf('%d absence(s) exceeded the medium threshold.', $absences),
                sprintf('%d failing activity score(s) detected.', $failingActivitiesTotal),
            ],
            'recent_decline' => array_values(array_filter([
                $midtermGrade !== null && $finalQuarterGrade !== null
                    ? sprintf('Midterm %.2f%% to final quarter %.2f%%.', $midtermGrade, $finalQuarterGrade)
                    : null,
                $dropPoints !== null
                    ? sprintf('Decline of %.2f point(s) (%.2f%%).', $dropPoints, (float) ($dropPercent ?? 0.0))
                    : null,
                $finalQuarterGrade !== null && $finalQuarterGrade < $passingGrade
                    ? sprintf('Final quarter %.2f%% is below the passing score %.2f%%.', $finalQuarterGrade, $passingGrade)
                    : null,
            ])),
            default => ['Performance is currently within watchlist thresholds.'],
        };
    }
}

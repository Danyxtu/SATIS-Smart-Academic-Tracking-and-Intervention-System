<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Services\WatchlistRuleService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class StudentSubjectRiskController extends Controller
{
    public function __construct(private WatchlistRuleService $watchlistRuleService) {}

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
            'schoolClass.subject',
            'schoolClass.teacher',
            'subject',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
        ])
            ->where('user_id', $user->id)
            ->get();

        // Process each enrollment using the shared global watchlist rules.
        $subjects = $enrollments->map(function (Enrollment $enrollment) {
            $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
            $subject = $class?->subject ?? $enrollment->subject;
            $teacher = $class?->teacher;

            $grades = $enrollment->grades;
            $scoredGrades = $this->scoreableGrades($grades);
            $attendance = $enrollment->attendanceRecords;
            $intervention = $enrollment->intervention;

            $risk = $this->watchlistRuleService->evaluateEnrollment($enrollment);
            $riskKey = (string) ($risk['risk_key'] ?? 'on_track');
            $riskLabel = (string) ($risk['risk_label'] ?? 'On Track');

            $currentGrade = $this->calculateCurrentGrade($scoredGrades);
            $expectedGrade = $this->resolveExpectedGrade($enrollment, $scoredGrades);

            // Calculate attendance rate
            $totalDays = $attendance->count();
            $presentDays = $attendance->whereIn('status', ['present', 'excused'])->count();
            $absentDays = $attendance->where('status', 'absent')->count();
            $lateDays = $attendance->where('status', 'late')->count();
            $attendanceRate = $totalDays > 0
                ? round((($presentDays + ($lateDays * 0.5)) / $totalDays) * 100, 1)
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
            })->map(function (Collection $categoryGrades) {
                $scoredCategoryGrades = $this->scoreableGrades($categoryGrades);
                $score = (float) $scoredCategoryGrades->sum('score');
                $possible = (float) $scoredCategoryGrades->sum('total_score');

                return [
                    'score' => $score,
                    'total' => $possible,
                    'percentage' => $possible > 0 ? round(($score / $possible) * 100, 1) : null,
                    'count' => $categoryGrades->count(),
                    'gradedCount' => $scoredCategoryGrades->count(),
                ];
            });

            // Group grades by quarter
            $gradesByQuarter = $scoredGrades->groupBy('quarter')->map(function (Collection $quarterGrades) {
                $score = (float) $quarterGrades->sum('score');
                $possible = (float) $quarterGrades->sum('total_score');
                return [
                    'score' => $score,
                    'total' => $possible,
                    'percentage' => $possible > 0 ? round(($score / $possible) * 100, 1) : null,
                ];
            });

            $trend = $scoredGrades->isEmpty()
                ? 'new'
                : strtolower((string) data_get($risk, 'metrics.trend', 'stable'));

            if (! in_array($trend, ['new', 'stable', 'improving', 'declining'], true)) {
                $trend = 'stable';
            }

            $riskLevel = $this->toRiskLevel($riskKey);
            $riskReasons = (array) ($risk['reasons'] ?? []);

            // Only explicit zero scores are treated as missing work; null means not graded yet.
            $missingWork = $grades
                ->filter(fn($grade) => $grade->score !== null && (float) $grade->score === 0.0)
                ->count();

            $courseProgress = $grades->count() > 0
                ? round(($scoredGrades->count() / $grades->count()) * 100, 1)
                : 0;

            $advice = $this->buildAdvice($riskKey);

            // Get recent grade entries
            $recentGradeEntries = $grades->sortByDesc('created_at')->take(5)->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->assignment_name,
                'score' => $g->score,
                'totalScore' => $g->total_score,
                'percentage' => ($g->score !== null && (float) $g->total_score > 0)
                    ? round(((float) $g->score / (float) $g->total_score) * 100, 1)
                    : null,
                'quarter' => $g->quarter,
                'date' => $g->created_at->format('M d'),
            ])->values();

            return [
                'id' => $enrollment->id,
                'subjectId' => $class?->subject_id ?? $subject?->id,
                'name' => $subject?->subject_name ?? $subject?->name ?? 'Unknown Subject',
                'instructor' => $teacher?->name ?? 'N/A',
                'section' => $class?->section ?? $subject?->section,
                'grade' => $currentGrade,
                'expectedGrade' => $expectedGrade,
                'attendanceRate' => $attendanceRate,
                'totalClasses' => $totalDays,
                'presentDays' => $presentDays,
                'absentDays' => $absentDays,
                'lateDays' => $lateDays,
                'trend' => $trend,
                'risk' => $riskLabel,
                'riskLabel' => $riskLabel,
                'riskKey' => $riskKey,
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
                return $this->riskSortOrder((string) ($subject['riskKey'] ?? 'on_track'));
            })
            ->values();

        // Calculate summary stats
        $atRiskCount = $subjects->where('riskKey', 'at_risk')->count();
        $needsAttentionCount = $subjects->where('riskKey', 'needs_attention')->count();
        $recentDeclineCount = $subjects->where('riskKey', 'recent_decline')->count();
        $onTrackCount = $subjects->where('riskKey', 'on_track')->count();

        return response()->json([
            'subjects' => $subjects,
            'stats' => [
                'total' => $subjects->count(),
                'atRisk' => $atRiskCount,
                'needsAttention' => $needsAttentionCount,
                'recentDecline' => $recentDeclineCount,
                'onTrack' => $onTrackCount,
                // Backwards-compatible aliases used by older app builds.
                'highRisk' => $atRiskCount,
                'mediumRisk' => $needsAttentionCount,
                'lowRisk' => $recentDeclineCount + $onTrackCount,
                'atRiskCount' => $atRiskCount + $needsAttentionCount + $recentDeclineCount,
            ],
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

    private function calculateCurrentGrade(Collection $scoredGrades): ?float
    {
        if ($scoredGrades->isEmpty()) {
            return null;
        }

        $totalScore = (float) $scoredGrades->sum('score');
        $totalPossible = (float) $scoredGrades->sum('total_score');

        if ($totalPossible <= 0) {
            return null;
        }

        return round(($totalScore / $totalPossible) * 100, 1);
    }

    private function resolveExpectedGrade(Enrollment $enrollment, Collection $scoredGrades): ?float
    {
        if ($scoredGrades->isEmpty()) {
            return null;
        }

        $latestQuarter = (int) ($scoredGrades->max(fn($grade) => (int) ($grade->quarter ?? 0)) ?? 0);

        if ($latestQuarter >= 2) {
            return $enrollment->expected_grade_q2 !== null
                ? round((float) $enrollment->expected_grade_q2, 1)
                : null;
        }

        return $enrollment->expected_grade_q1 !== null
            ? round((float) $enrollment->expected_grade_q1, 1)
            : null;
    }

    private function toRiskLevel(string $riskKey): string
    {
        return match ($riskKey) {
            'at_risk' => 'high',
            'needs_attention' => 'medium',
            default => 'low',
        };
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

    private function buildAdvice(string $riskKey): string
    {
        return match ($riskKey) {
            'at_risk' => 'Immediate action required. Coordinate with your teacher and complete priority tasks first.',
            'needs_attention' => 'Stay consistent this week and address your weakest activities before the next grading update.',
            'recent_decline' => 'Your performance is slipping recently. Review feedback early to recover momentum.',
            default => 'Keep up the great work and maintain your current habits.',
        };
    }
}

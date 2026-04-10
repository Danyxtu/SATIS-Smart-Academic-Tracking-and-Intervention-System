<?php

namespace App\Services\Teacher;

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class WatchlistSettingsService
{
    private const SETTING_KEY_PREFIX = 'teacher_watchlist_settings_';

    public function getForTeacher(User $teacher): array
    {
        $defaults = $this->defaults();
        $key = $this->settingKey((int) $teacher->id);

        $stored = SystemSetting::get($key, []);
        if (is_string($stored)) {
            $decoded = json_decode($stored, true);
            $stored = is_array($decoded) ? $decoded : [];
        }

        if (! is_array($stored)) {
            $stored = [];
        }

        $merged = array_replace_recursive($defaults, $stored);

        return [
            'observe' => $this->normalizeObserve(data_get($merged, 'observe', [])),
            'needs_attention' => $this->normalizeNeedsAttention(data_get($merged, 'needs_attention', [])),
            'recent_decline' => $this->normalizeRecentDecline(data_get($merged, 'recent_decline', [])),
        ];
    }

    public function getObservedCategoriesForTeacher(User $teacher): array
    {
        return $this->getForTeacher($teacher)['observe'];
    }

    public function getEvaluationRulesForTeacher(User $teacher): array
    {
        $rules = config('watchlist', []);
        $settings = $this->getForTeacher($teacher);
        $needsAttention = $settings['needs_attention'];

        $recentDecline = $settings['recent_decline'];

        data_set(
            $rules,
            'needs_attention.absence_threshold',
            (int) data_get($needsAttention, 'absence_threshold', data_get($rules, 'needs_attention.absence_threshold', 3)),
        );
        data_set(
            $rules,
            'needs_attention.failing_activities_threshold',
            (int) data_get(
                $needsAttention,
                'failing_activities_threshold',
                data_get($rules, 'needs_attention.failing_activities_threshold', 3),
            ),
        );

        data_set(
            $rules,
            'recent_decline.minimum_drop_percent',
            (float) data_get(
                $recentDecline,
                'minimum_drop_percent',
                data_get(
                    $rules,
                    'recent_decline.minimum_drop_percent',
                    data_get($rules, 'recent_decline.massive_drop_percent', 20.0),
                ),
            ),
        );

        return $rules;
    }

    public function getGlobalRuleSnapshot(): array
    {
        $rules = config('watchlist', []);

        return [
            'passing_grade' => (float) data_get($rules, 'passing_grade', 75.0),
            'at_risk' => [
                'absence_threshold' => (int) data_get($rules, 'high_risk.absence_threshold', 5),
            ],
            'needs_attention' => [
                'absence_threshold' => (int) data_get($rules, 'needs_attention.absence_threshold', 3),
                'failing_activities_threshold' => (int) data_get($rules, 'needs_attention.failing_activities_threshold', 3),
            ],
            'needs_attention_defaults' => [
                'absence_threshold' => (int) data_get($rules, 'needs_attention.absence_threshold', 3),
                'failing_activities_threshold' => (int) data_get($rules, 'needs_attention.failing_activities_threshold', 3),
            ],
            'recent_decline_defaults' => [
                'minimum_drop_percent' => (float) data_get(
                    $rules,
                    'recent_decline.minimum_drop_percent',
                    data_get($rules, 'recent_decline.massive_drop_percent', 20.0),
                ),
                'require_final_quarter_failing' => (bool) data_get(
                    $rules,
                    'recent_decline.require_final_quarter_failing',
                    true,
                ),
            ],
        ];
    }

    public function saveForTeacher(User $teacher, array $payload): array
    {
        $normalized = [
            'observe' => $this->normalizeObserve(data_get($payload, 'observe', [])),
            'needs_attention' => $this->normalizeNeedsAttention(data_get($payload, 'needs_attention', [])),
            'recent_decline' => $this->normalizeRecentDecline(data_get($payload, 'recent_decline', [])),
        ];

        $key = $this->settingKey((int) $teacher->id);

        SystemSetting::updateOrCreate(
            ['key' => $key],
            [
                'value' => json_encode($normalized),
                'type' => 'json',
                'group' => 'teacher_watchlist',
                'description' => 'Teacher-scoped watchlist visibility, needs attention, and recent decline calibration.',
                'updated_by' => $teacher->id,
            ],
        );

        Cache::forget("system_setting_{$key}");

        return $normalized;
    }

    private function defaults(): array
    {
        $globalRules = config('watchlist', []);

        return [
            'observe' => [
                'at_risk' => true,
                'needs_attention' => true,
                'recent_decline' => true,
            ],
            'needs_attention' => [
                'absence_threshold' => (int) data_get($globalRules, 'needs_attention.absence_threshold', 3),
                'failing_activities_threshold' => (int) data_get($globalRules, 'needs_attention.failing_activities_threshold', 3),
            ],
            'recent_decline' => [
                'minimum_drop_percent' => (float) data_get(
                    $globalRules,
                    'recent_decline.minimum_drop_percent',
                    data_get($globalRules, 'recent_decline.massive_drop_percent', 20.0),
                ),
            ],
        ];
    }

    private function normalizeObserve(array $observe): array
    {
        return [
            'at_risk' => $this->toBoolean(data_get($observe, 'at_risk'), true),
            'needs_attention' => $this->toBoolean(data_get($observe, 'needs_attention'), true),
            'recent_decline' => $this->toBoolean(data_get($observe, 'recent_decline'), true),
        ];
    }

    private function normalizeRecentDecline(array $recentDecline): array
    {
        $defaults = $this->defaults()['recent_decline'];

        $minimumDropPercent = is_numeric(data_get($recentDecline, 'minimum_drop_percent'))
            ? (float) data_get($recentDecline, 'minimum_drop_percent')
            : (
                is_numeric(data_get($recentDecline, 'minimum_drop_points'))
                ? (float) data_get($recentDecline, 'minimum_drop_points')
                : (float) $defaults['minimum_drop_percent']
            );

        return [
            'minimum_drop_percent' => round(min(max($minimumDropPercent, 1.0), 60.0), 2),
        ];
    }

    private function normalizeNeedsAttention(array $needsAttention): array
    {
        $defaults = $this->defaults()['needs_attention'];

        $absenceThreshold = is_numeric(data_get($needsAttention, 'absence_threshold'))
            ? (int) round((float) data_get($needsAttention, 'absence_threshold'))
            : (int) $defaults['absence_threshold'];
        $failingActivitiesThreshold = is_numeric(data_get($needsAttention, 'failing_activities_threshold'))
            ? (int) round((float) data_get($needsAttention, 'failing_activities_threshold'))
            : (int) $defaults['failing_activities_threshold'];

        return [
            'absence_threshold' => min(max($absenceThreshold, 1), 15),
            'failing_activities_threshold' => min(max($failingActivitiesThreshold, 1), 20),
        ];
    }

    private function toBoolean(mixed $value, bool $default): bool
    {
        if ($value === null) {
            return $default;
        }

        if (is_bool($value)) {
            return $value;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
    }

    private function settingKey(int $teacherId): string
    {
        return self::SETTING_KEY_PREFIX . $teacherId;
    }
}

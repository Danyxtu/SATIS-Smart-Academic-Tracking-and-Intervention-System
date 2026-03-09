<?php

namespace App\Support\Concerns;

use Illuminate\Support\Str;

trait HasDefaultAssignments
{
    protected function defaultGradeCategories(): array
    {
        return [
            [
                'id' => 'written_works',
                'label' => 'Written Works',
                'weight' => 0.30,
                'tasks' => [],
            ],
            [
                'id' => 'performance_task',
                'label' => 'Performance Task',
                'weight' => 0.40,
                'tasks' => [],
            ],
            [
                'id' => 'quarterly_exam',
                'label' => 'Quarterly Exam',
                'weight' => 0.30,
                'tasks' => [],
            ],
        ];
    }

    protected function defaultAssignments(): array
    {
        return $this->flattenAssignmentsFromCategories($this->defaultGradeCategories());
    }

    /**
     * Build grade structure for a single flat categories array.
     */
    protected function buildGradeStructure(?array $categories = null): array
    {
        $normalized = $this->normalizeGradeCategories($categories);

        return [
            'categories' => $normalized,
            'assignments' => $this->flattenAssignmentsFromCategories($normalized),
        ];
    }

    /**
     * Resolve the stored grade_categories (which may be per-quarter or legacy flat)
     * into the categories array for a specific quarter.
     *
     * Stored format (per-quarter): { "1": [...categories], "2": [...categories] }
     * Legacy format (flat):        [ ...categories ]
     */
    protected function resolveQuarterCategories(?array $storedCategories, int $quarter = 1): array
    {
        if ($storedCategories === null || empty($storedCategories)) {
            return $this->defaultGradeCategories();
        }

        // Detect per-quarter format: { "1": [...categories], "2": [...categories] }
        // vs legacy flat format: [ {id, label, weight, tasks}, ... ]
        // A flat array has numeric keys 0,1,2 where each value is a category (has 'id'/'label').
        // A per-quarter map has keys "1","2" where each value is an ARRAY of categories (a list).
        if ($this->isPerQuarterFormat($storedCategories)) {
            return $storedCategories[$quarter] ?? $storedCategories[(string) $quarter] ?? $this->defaultGradeCategories();
        }

        // Legacy flat format — treat entire array as this quarter's categories
        return $storedCategories;
    }

    /**
     * Detect whether the stored grade_categories uses per-quarter format.
     *
     * Per-quarter:  { "1": [ {id,label,...}, ... ], "2": [ {id,label,...}, ... ] }
     * Legacy flat:  [ {id,label,weight,tasks}, {id,...}, ... ]
     */
    private function isPerQuarterFormat(array $stored): bool
    {
        // Check if key "1" or 1 exists and its value is a sequential list (not a single category object)
        $firstQuarter = $stored['1'] ?? $stored[1] ?? null;

        if ($firstQuarter === null) {
            return false;
        }

        // If the value under key 1/"1" is a list of arrays (categories), it's per-quarter.
        // A single category object would have keys like 'id', 'label', 'weight', 'tasks'.
        // A list of categories is a sequential array whose first element is also an array with 'tasks'.
        if (is_array($firstQuarter) && !isset($firstQuarter['id']) && !isset($firstQuarter['label'])) {
            // Extra safety: for per-quarter format, the value must be a sequential list
            // where each element looks like a category (has 'tasks' key or is an array of arrays).
            // If the first element of $firstQuarter is itself an array, it's per-quarter.
            $firstItem = reset($firstQuarter);
            if (is_array($firstItem)) {
                return true;
            }
            // If $firstQuarter is an empty array, treat as per-quarter (empty quarter)
            if (empty($firstQuarter)) {
                return true;
            }
            return false;
        }

        return false;
    }

    /**
     * Build the full per-quarter grade_categories map for storage.
     * Returns { 1: [...categories], 2: [...categories] }.
     */
    protected function buildPerQuarterCategories(?array $storedCategories, int $quarter, array $newCategories): array
    {
        $existing = $storedCategories ?? [];

        // If legacy flat format, migrate: put existing flat data under quarter 1
        if (!empty($existing) && !$this->isPerQuarterFormat($existing)) {
            $existing = [1 => $existing, 2 => $this->defaultGradeCategories()];
        }

        $existing[$quarter] = $newCategories;

        return $existing;
    }

    /**
     * Well-known category IDs mapped to their default label and weight.
     * Used as a fallback when stored data is missing label/weight fields.
     */
    private static array $knownCategories = [
        'written_works'    => ['label' => 'Written Works',    'weight' => 0.30],
        'performance_task' => ['label' => 'Performance Task', 'weight' => 0.40],
        'quarterly_exam'   => ['label' => 'Quarterly Exam',   'weight' => 0.30],
    ];

    /**
     * Default categories ordered by index, used to repair generic "Category N" entries.
     */
    private static array $defaultCategoryOrder = [
        0 => ['id' => 'written_works',    'label' => 'Written Works',    'weight' => 0.30],
        1 => ['id' => 'performance_task', 'label' => 'Performance Task', 'weight' => 0.40],
        2 => ['id' => 'quarterly_exam',   'label' => 'Quarterly Exam',   'weight' => 0.30],
    ];

    protected function normalizeGradeCategories(?array $categories = null): array
    {
        $fallback = $categories ?? $this->defaultGradeCategories();

        return collect($fallback)
            ->map(function ($category, $index) {
                $id = $category['id'] ?? null;
                $known = $id ? (self::$knownCategories[$id] ?? null) : null;

                $label = trim($category['label'] ?? '');
                $storedWeight = $category['weight'] ?? null;

                // Detect generic "Category N" labels (e.g. "Category 1", "category2", "Category 3")
                // and repair them using the default category order.
                $isGenericLabel = empty($label) || preg_match('/^category\s*\d+$/i', $label);
                $isGenericId    = $id !== null && preg_match('/^category\s*\d+$/i', $id);

                if (($isGenericLabel || $isGenericId) && isset(self::$defaultCategoryOrder[$index])) {
                    $default = self::$defaultCategoryOrder[$index];
                    if ($isGenericLabel) {
                        $label = $default['label'];
                    }
                    if ($isGenericId || $id === null) {
                        $id = $default['id'];
                    }
                    if ($storedWeight === null || (float) $storedWeight === 0.0) {
                        $storedWeight = $default['weight'];
                    }
                } elseif (empty($label)) {
                    $label = $known['label'] ?? ('Category ' . ($index + 1));
                }

                if ($id === null) {
                    $id = Str::snake($label);
                }

                $weight = $this->normalizeCategoryWeight(
                    $storedWeight ?? ($known['weight'] ?? null)
                );

                $tasks = collect($category['tasks'] ?? [])
                    ->map(function ($task, $taskIndex) use ($id) {
                        $taskLabel = trim($task['label'] ?? ('Task ' . ($taskIndex + 1)));
                        $taskId = $task['id'] ?? Str::slug($taskLabel . '-' . $id . '-' . Str::random(6), '_');

                        return [
                            'id' => $taskId,
                            'label' => $taskLabel,
                            'total' => (float) ($task['total'] ?? 100),
                            'category_id' => $id, // Always use the (possibly repaired) parent category id
                        ];
                    })
                    ->values()
                    ->all();

                return [
                    'id' => $id,
                    'label' => $label,
                    'weight' => $weight,
                    'tasks' => $tasks,
                ];
            })
            ->values()
            ->all();
    }

    protected function flattenAssignmentsFromCategories(array $categories): array
    {
        return collect($categories)
            ->flatMap(function ($category) {
                return collect($category['tasks'] ?? [])->map(function ($task) use ($category) {
                    return [
                        'id' => $task['id'],
                        'label' => $task['label'],
                        'total' => $task['total'],
                        'category_id' => $task['category_id'] ?? $category['id'],
                        'category_label' => $category['label'],
                        'category_weight' => $category['weight'],
                    ];
                });
            })
            ->values()
            ->all();
    }

    private function normalizeCategoryWeight($weight): float
    {
        if ($weight === null || $weight === '') {
            return 0.0;
        }

        $numeric = is_string($weight)
            ? (float) str_replace('%', '', $weight)
            : (float) $weight;

        if ($numeric > 1) {
            $numeric = $numeric / 100;
        }

        return round($numeric, 4);
    }
}

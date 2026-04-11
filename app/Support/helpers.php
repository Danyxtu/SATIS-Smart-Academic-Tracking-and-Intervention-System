<?php



if (! function_exists('satis_grade_level_options')) {
    /**
     * @return array<int, string>
     */
    function satis_grade_level_options(): array
    {
        return ['11', '12'];
    }
}

if (! function_exists('satis_normalize_whitespace')) {
    function satis_normalize_whitespace(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = preg_replace('/\s+/', ' ', trim($value)) ?? trim($value);

        return $normalized !== '' ? $normalized : null;
    }
}

if (! function_exists('satis_normalize_grade_level')) {
    function satis_normalize_grade_level(?string $value): ?string
    {
        $normalized = satis_normalize_whitespace($value);

        if ($normalized === null) {
            return null;
        }

        if (preg_match('/(^|\D)(11|12)(\D|$)/', $normalized, $matches) !== 1) {
            return null;
        }

        return $matches[2];
    }
}

if (! function_exists('satis_grade_level_label')) {
    function satis_grade_level_label(?string $value): ?string
    {
        $gradeLevel = satis_normalize_grade_level($value);

        return $gradeLevel !== null ? 'Grade ' . $gradeLevel : null;
    }
}

if (! function_exists('satis_extract_section_base_name')) {
    function satis_extract_section_base_name(?string $value): ?string
    {
        $normalized = satis_normalize_whitespace($value);

        if ($normalized === null) {
            return null;
        }

        if (preg_match('/^(?:Grade\s*)?(?:11|12)\s*-\s*[^-]+\s*-\s*(.+)$/i', $normalized, $matches) === 1) {
            return satis_normalize_whitespace($matches[1]);
        }

        if (preg_match('/^(?:Grade\s*)?(?:11|12)\s+(.+)$/i', $normalized, $matches) === 1) {
            return satis_normalize_whitespace($matches[1]);
        }

        return $normalized;
    }
}

if (! function_exists('satis_section_full_label')) {
    function satis_section_full_label(
        ?string $gradeLevel,
        ?string $specialization,
        ?string $sectionName
    ): string {
        $parts = [];

        $normalizedGradeLevel = satis_normalize_grade_level($gradeLevel);
        if ($normalizedGradeLevel !== null) {
            $parts[] = $normalizedGradeLevel;
        }

        $normalizedSpecialization = satis_normalize_whitespace($specialization);
        if ($normalizedSpecialization !== null) {
            $parts[] = $normalizedSpecialization;
        }

        $normalizedSectionName = satis_extract_section_base_name($sectionName);
        if ($normalizedSectionName !== null) {
            $parts[] = $normalizedSectionName;
        }

        return implode(' - ', $parts);
    }
}

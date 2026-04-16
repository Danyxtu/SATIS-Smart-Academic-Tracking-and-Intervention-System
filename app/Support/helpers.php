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

if (! function_exists('satis_generate_section_code')) {
    /**
     * Build a section code from grade level, strand/specialization, and section name.
     */
    function satis_generate_section_code(
        ?string $gradeLevel,
        ?string $specialization,
        ?string $sectionName,
    ): string {
        $gradeTokenSource = satis_normalize_grade_level($gradeLevel)
            ?? satis_normalize_whitespace($gradeLevel)
            ?? 'GRADE';
        $specializationTokenSource = satis_normalize_whitespace($specialization)
            ?? 'STRAND';
        $sectionTokenSource = satis_extract_section_base_name($sectionName)
            ?? satis_normalize_whitespace($sectionName)
            ?? 'SECTION';

        $sanitizeToken = static function (?string $value, string $fallback): string {
            $raw = strtoupper((string) ($value ?? ''));
            $token = preg_replace('/[^A-Z0-9]+/', '-', $raw) ?? '';
            $token = trim($token, '-');

            return $token !== '' ? $token : $fallback;
        };

        $sectionCode = implode('-', [
            $sanitizeToken($gradeTokenSource, 'GRADE'),
            $sanitizeToken($specializationTokenSource, 'STRAND'),
            $sanitizeToken($sectionTokenSource, 'SECTION'),
        ]);

        if (strlen($sectionCode) <= 100) {
            return $sectionCode;
        }

        $trimmed = substr($sectionCode, 0, 100);

        return rtrim($trimmed, '-');
    }
}

if (! function_exists('satis_resolve_department_track')) {
    /**
     * Resolve a canonical track label from a department model or array payload.
     */
    function satis_resolve_department_track($department, string $fallback = 'Academic'): string
    {
        $extractTrackName = static function ($source): ?string {
            if (is_array($source)) {
                $direct = $source['track'] ?? null;
                if (is_string($direct) && trim($direct) !== '') {
                    return trim($direct);
                }

                $schoolTrack = $source['schoolTrack'] ?? $source['school_track'] ?? null;
                if (is_array($schoolTrack)) {
                    $trackName = $schoolTrack['track_name'] ?? null;
                    if (is_string($trackName) && trim($trackName) !== '') {
                        return trim($trackName);
                    }
                }

                return null;
            }

            if (is_object($source)) {
                $direct = $source->track ?? null;
                if (is_string($direct) && trim($direct) !== '') {
                    return trim($direct);
                }

                $schoolTrack = $source->schoolTrack ?? $source->school_track ?? null;
                if (is_object($schoolTrack)) {
                    $trackName = $schoolTrack->track_name ?? null;
                    if (is_string($trackName) && trim($trackName) !== '') {
                        return trim($trackName);
                    }
                }
            }

            return null;
        };

        $trackName = $extractTrackName($department) ?? $fallback;
        $normalizedTrack = strtolower(trim((string) $trackName));

        if ($normalizedTrack === 'tvl') {
            return 'TVL';
        }

        if ($normalizedTrack === 'academic') {
            return 'Academic';
        }

        return trim((string) $trackName) !== '' ? (string) $trackName : $fallback;
    }
}

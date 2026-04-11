<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->normalizeGradeLevels();
        $this->normalizeSectionNames();
        $this->syncStudentSectionValues();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['sections', 'students', 'classes', 'subjects'] as $table) {
            DB::table($table)
                ->orderBy('id')
                ->chunkById(500, function ($rows) use ($table): void {
                    foreach ($rows as $row) {
                        $gradeLevel = satis_normalize_grade_level((string) ($row->grade_level ?? ''));

                        if ($gradeLevel === null) {
                            continue;
                        }

                        DB::table($table)
                            ->where('id', (int) $row->id)
                            ->update([
                                'grade_level' => 'Grade ' . $gradeLevel,
                                'updated_at' => now(),
                            ]);
                    }
                });
        }
    }

    private function normalizeGradeLevels(): void
    {
        foreach (['sections', 'students', 'classes', 'subjects'] as $table) {
            DB::table($table)
                ->orderBy('id')
                ->chunkById(500, function ($rows) use ($table): void {
                    foreach ($rows as $row) {
                        $currentValue = $row->grade_level;
                        $normalized = satis_normalize_grade_level(
                            is_string($currentValue) ? $currentValue : null,
                        );

                        if ($normalized === null || $normalized === $currentValue) {
                            continue;
                        }

                        DB::table($table)
                            ->where('id', (int) $row->id)
                            ->update([
                                'grade_level' => $normalized,
                                'updated_at' => now(),
                            ]);
                    }
                });
        }
    }

    private function normalizeSectionNames(): void
    {
        DB::table('sections')
            ->orderBy('id')
            ->chunkById(500, function ($rows): void {
                foreach ($rows as $row) {
                    $currentName = is_string($row->section_name)
                        ? $row->section_name
                        : null;
                    $baseName = satis_extract_section_base_name($currentName);

                    if ($baseName === null || $baseName === $currentName) {
                        continue;
                    }

                    DB::table('sections')
                        ->where('id', (int) $row->id)
                        ->update([
                            'section_name' => $baseName,
                            'updated_at' => now(),
                        ]);
                }
            });
    }

    private function syncStudentSectionValues(): void
    {
        $sectionNamesById = DB::table('sections')
            ->pluck('section_name', 'id')
            ->map(fn($value) => is_string($value) ? $value : null)
            ->all();

        DB::table('students')
            ->orderBy('id')
            ->chunkById(500, function ($rows) use ($sectionNamesById): void {
                foreach ($rows as $row) {
                    $currentSection = is_string($row->section)
                        ? $row->section
                        : null;
                    $resolvedSection = null;

                    if ($row->section_id !== null) {
                        $resolvedSection = $sectionNamesById[(int) $row->section_id] ?? null;
                    }

                    $normalizedSection = $resolvedSection
                        ?? satis_extract_section_base_name($currentSection);

                    if ($normalizedSection === null || $normalizedSection === $currentSection) {
                        continue;
                    }

                    DB::table('students')
                        ->where('id', (int) $row->id)
                        ->update([
                            'section' => $normalizedSection,
                            'updated_at' => now(),
                        ]);
                }
            });
    }
};

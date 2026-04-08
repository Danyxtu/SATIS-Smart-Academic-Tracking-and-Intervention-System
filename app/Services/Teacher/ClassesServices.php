<?php

namespace App\Services\Teacher;

use App\Support\Concerns\HasDefaultAssignments;
use Illuminate\Support\Str;
use App\Models\SystemSetting;
use App\Models\SchoolClass;

class ClassesServices
{
    use HasDefaultAssignments;
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function getClassesData($request)
    {
        $teacher = $request->user();

        // Get current system semester and allow user to select which semester to view
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();
        $currentSemester = (string) SystemSetting::getCurrentSemester();
        $selectedSemester = (string) $request->query('semester', $currentSemester);

        if (!in_array($selectedSemester, ['1', '2'], true)) {
            $selectedSemester = $currentSemester;
        }

        // Only show active classes for the configured school year.
        $allClasses = SchoolClass::with([
            'subject',
            'sectionRecord',
            'enrollments.user.student',
            'enrollments.grades',
        ])->where('teacher_id', $teacher->id)
            ->where('school_year', $currentSchoolYear)
            ->orderBy('grade_level')
            ->get();

        // Filter classes by selected semester for display.
        $classesForSemester = $allClasses->filter(function ($schoolClass) use ($selectedSemester) {
            return (string) $schoolClass->semester === $selectedSemester;
        });

        // Count classes per semester for the toggle UI.
        $semester1Count = $allClasses->filter(fn($schoolClass) => (string) $schoolClass->semester === '1')->count();
        $semester2Count = $allClasses->filter(fn($schoolClass) => (string) $schoolClass->semester === '2')->count();

        $classes = $classesForSemester->map(fn($schoolClass) => [
            'id' => $schoolClass->id,
            'subject_id' => (int) $schoolClass->subject_id,
            'section_id' => (int) $schoolClass->section_id,
            'name' => $schoolClass->grade_level,
            'section' => $schoolClass->section,
            'subject' => $schoolClass->subject?->subject_name ?? 'N/A',
            'subject_name' => $schoolClass->subject?->subject_name ?? 'N/A',
            'color' => $schoolClass->color,
            'strand' => $schoolClass->strand,
            'track' => $schoolClass->track,
            'school_year' => $schoolClass->school_year,
            'student_count' => $schoolClass->enrollments->count(),
            'current_quarter' => $schoolClass->current_quarter ?? 1,
            'semester' => (int) ($schoolClass->semester ?? 1),
        ])->values();

        $roster = $classesForSemester->mapWithKeys(function ($schoolClass) {
            return [
                $schoolClass->id => $schoolClass->enrollments
                    ->map(function ($enrollment) {
                        $user = $enrollment->user;
                        $studentProfile = $user?->student;

                        return [
                            'id' => $enrollment->user_id,
                            'name' => $this->formatStudentDisplayName($user, $studentProfile),
                            'student_number' => $studentProfile?->student_number ?? 'N/A',
                            'sort_key' => $this->buildStudentSortKey($user, $studentProfile),
                        ];
                    })
                    ->sortBy('sort_key', SORT_NATURAL | SORT_FLAG_CASE)
                    ->values()
                    ->map(fn(array $student) => [
                        'id' => $student['id'],
                        'name' => $student['name'],
                        'student_number' => $student['student_number'],
                    ])
                    ->values(),
            ];
        });
        return [
            'classes' => $classes,
            'defaultSchoolYear' => $currentSchoolYear,
            'currentSemester' => (int) $currentSemester,
            'selectedSemester' => (int) $selectedSemester,
            'semester1Count' => $semester1Count,
            'semester2Count' => $semester2Count,
            'roster' => $roster,
        ];
    }

    private function formatStudentDisplayName($user, $studentProfile): string
    {
        $lastName = trim((string) ($user?->last_name ?? ''));
        $firstName = trim((string) ($user?->first_name ?? ''));
        $middleName = trim((string) ($user?->middle_name ?? ''));

        if ($lastName !== '' || $firstName !== '' || $middleName !== '') {
            $middleInitial = $middleName !== ''
                ? Str::upper(Str::substr($middleName, 0, 1)) . '.'
                : '';

            $firstAndMiddle = trim($firstName . ($middleInitial !== '' ? ' ' . $middleInitial : ''));

            if ($lastName !== '' && $firstAndMiddle !== '') {
                return $lastName . ', ' . $firstAndMiddle;
            }

            if ($lastName !== '') {
                return $lastName;
            }

            return $firstAndMiddle;
        }

        $fallbackName = preg_replace(
            '/\s+/',
            ' ',
            trim((string) ($studentProfile?->student_name ?? $user?->name ?? 'Student')),
        );

        return is_string($fallbackName) && trim($fallbackName) !== ''
            ? trim($fallbackName)
            : 'Student';
    }

    private function buildStudentSortKey($user, $studentProfile): string
    {
        $lastName = Str::lower(trim((string) ($user?->last_name ?? '')));
        $firstName = Str::lower(trim((string) ($user?->first_name ?? '')));
        $middleName = Str::lower(trim((string) ($user?->middle_name ?? '')));

        if ($lastName !== '' || $firstName !== '' || $middleName !== '') {
            return trim($lastName . ' ' . $firstName . ' ' . $middleName);
        }

        return Str::lower($this->formatStudentDisplayName($user, $studentProfile));
    }

    public function createClass() {}

    public function ensureStructureCoversExistingGrades(SchoolClass $subjectTeacher, array $structure, ?int $quarter = null): array
    {
        $assignments = collect($structure['assignments']);

        $existingAssignments = $subjectTeacher->enrollments
            ->flatMap(function ($enrollment) use ($quarter) {
                $grades = $enrollment->grades;

                // Filter grades by quarter if specified
                if ($quarter !== null) {
                    $grades = $grades->where('quarter', $quarter);
                }

                return $grades->map(function ($grade) {
                    $assignmentId = $grade->assignment_key ?: Str::slug($grade->assignment_name ?? 'assignment', '_');

                    return [
                        'id' => $assignmentId,
                        'label' => $grade->assignment_name ?? 'Assignment',
                        'total' => $grade->total_score ?? 100,
                    ];
                });
            })
            ->filter(fn($assignment) => ! empty($assignment['id']))
            ->unique('id')
            ->values();

        $missingAssignments = $existingAssignments->reject(function ($assignment) use ($assignments) {
            return $assignments->contains('id', $assignment['id']);
        });

        if ($missingAssignments->isEmpty()) {
            return $structure;
        }

        $categories = $structure['categories'];

        foreach ($missingAssignments as $assignment) {
            $categoryId = $this->guessCategoryForAssignment($assignment['label'], $categories);

            foreach ($categories as &$category) {
                if ($category['id'] === $categoryId) {
                    $category['tasks'][] = [
                        'id' => $assignment['id'],
                        'label' => $assignment['label'],
                        'total' => $assignment['total'],
                        'category_id' => $categoryId,
                    ];
                    break;
                }
            }
            unset($category);
        }

        $updatedStructure = $this->buildGradeStructure($categories);

        // Persist: merge back into the per-quarter map if quarter was specified
        if ($quarter !== null) {
            $perQuarter = $this->buildPerQuarterCategories(
                $subjectTeacher->grade_categories,
                $quarter,
                $updatedStructure['categories'],
            );
            $subjectTeacher->update(['grade_categories' => $perQuarter]);
        } else {
            $subjectTeacher->update(['grade_categories' => $updatedStructure['categories']]);
        }

        return $updatedStructure;
    }
    private function guessCategoryForAssignment(?string $assignmentLabel, array $categories): string
    {
        $fallback = $categories[0]['id'] ?? 'written_works';
        $label = Str::lower($assignmentLabel ?? '');

        if (str_contains($label, 'exam') || str_contains($label, 'periodical')) {
            return $this->pickCategoryId($categories, 'quarterly_exam', $fallback);
        }

        if (str_contains($label, 'performance') || str_contains($label, 'project') || str_contains($label, 'lab')) {
            return $this->pickCategoryId($categories, 'performance_task', $fallback);
        }

        return $this->pickCategoryId($categories, 'written_works', $fallback);
    }

    private function pickCategoryId(array $categories, string $preferredId, string $fallback): string
    {
        foreach ($categories as $category) {
            if ($category['id'] === $preferredId) {
                return $category['id'];
            }
        }

        return $fallback;
    }

    private function currentSchoolYear(): string
    {
        return SystemSetting::getCurrentSchoolYear();
    }
}

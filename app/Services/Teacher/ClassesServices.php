<?php

namespace App\Services\Teacher;

use App\Support\Concerns\HasDefaultAssignments;
use Illuminate\Support\Str;
use App\Models\SystemSetting;
use App\Models\SubjectTeacher;

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
        $currentSemester = SystemSetting::getCurrentSemester();
        $selectedSemester = $request->query('semester', $currentSemester);

        // Get ALL subject-teacher assignments for this teacher (for counting)
        $allSubjectTeachers = SubjectTeacher::with([
            'subject',
            'enrollments.user.student',
            'enrollments.grades',
        ])->where('teacher_id', $teacher->id)
            ->orderBy('grade_level')
            ->get();

        // Filter subject-teachers by selected semester for display
        $subjectTeachers = $allSubjectTeachers->filter(function ($st) use ($selectedSemester) {
            return $st->semester == $selectedSemester;
        });

        // Count classes per semester for the toggle UI
        $semester1Count = $allSubjectTeachers->filter(fn($s) => $s->semester == '1')->count();
        $semester2Count = $allSubjectTeachers->filter(fn($s) => $s->semester == '2')->count();


        $gradeStructures = $subjectTeachers->mapWithKeys(function ($subjectTeacher) {
            $structure = $this->buildGradeStructure($subjectTeacher->grade_categories);
            $structure = $this->ensureStructureCoversExistingGrades($subjectTeacher, $structure);

            return [$subjectTeacher->id => $structure];
        });

        $classes = $subjectTeachers->map(fn($st) => [
            'id' => $st->id,
            'name' => $st->grade_level,
            'section' => $st->section,
            'subject_name' => $st->subject?->subject_name ?? 'N/A',
            'color' => $st->color,
            'strand' => $st->strand,
            'track' => $st->track,
            'student_count' => $st->enrollments->count(),
            'current_quarter' => $st->current_quarter ?? 1,
            'semester' => $st->semester,
        ])->values();

        $roster = $subjectTeachers->mapWithKeys(function ($st) {
            return [
                $st->id => $st->enrollments->map(function ($enrollment) {
                    return [
                        'id' => $enrollment->user_id,
                        'name' => $enrollment->user->name,
                        'student_number' => $enrollment->user->student?->student_number ?? 'N/A',
                    ];
                }),
            ];
        });
        return [
            'classes' => $classes,
            'defaultSchoolYear' => $this->currentSchoolYear(),
            'currentSemester' => $currentSemester,
            'selectedSemester' => (int) $selectedSemester,
            'semester1Count' => $semester1Count,
            'semester2Count' => $semester2Count,
            'roster' => $roster,
        ];
    }

    public function createClass() {}

    public function ensureStructureCoversExistingGrades(SubjectTeacher $subjectTeacher, array $structure): array
    {
        $assignments = collect($structure['assignments']);

        $existingAssignments = $subjectTeacher->enrollments
            ->flatMap(function ($enrollment) {
                return $enrollment->grades->map(function ($grade) {
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
        $subjectTeacher->update(['grade_categories' => $updatedStructure['categories']]);

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
        $year = now()->year;
        $next = $year + 1;

        return sprintf('%d-%d', $year, $next);
    }
}

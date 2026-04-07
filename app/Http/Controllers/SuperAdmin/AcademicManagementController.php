<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Subject;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AcademicManagementController extends Controller
{
    private const COLOR_OPTIONS = ['indigo', 'blue', 'red', 'green', 'amber', 'purple', 'teal'];

    /**
     * Display section/class management across all departments.
     */
    public function index(Request $request): Response
    {
        $tab = in_array($request->input('tab'), ['sections', 'classes'], true)
            ? (string) $request->input('tab')
            : 'sections';

        $search = trim((string) $request->input('search', ''));
        $departmentId = $request->filled('department_id')
            ? (int) $request->input('department_id')
            : null;

        $departments = Department::query()
            ->orderBy('department_code')
            ->get(['id', 'department_name', 'department_code'])
            ->map(fn(Department $department) => [
                'id' => (int) $department->id,
                'department_name' => $department->department_name,
                'department_code' => $department->department_code,
            ])
            ->values();

        $sectionsQuery = Section::query()
            ->with(['department:id,department_name,department_code'])
            ->withCount('students');

        $classesQuery = SchoolClass::query()
            ->with([
                'subject:id,subject_name,subject_code',
                'teacher:id,first_name,middle_name,last_name,department_id',
                'sectionRecord:id,department_id,section_name,section_code,cohort,grade_level,strand,track,is_active',
                'sectionRecord.department:id,department_name,department_code',
            ]);

        if ($departmentId !== null && $departmentId > 0) {
            $sectionsQuery->where('department_id', $departmentId);
            $classesQuery->whereHas('sectionRecord', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            });
        }

        if ($search !== '') {
            $sectionsQuery->where(function ($query) use ($search) {
                $query->where('section_name', 'like', "%{$search}%")
                    ->orWhere('section_code', 'like', "%{$search}%")
                    ->orWhere('cohort', 'like', "%{$search}%")
                    ->orWhere('grade_level', 'like', "%{$search}%")
                    ->orWhere('strand', 'like', "%{$search}%")
                    ->orWhere('track', 'like', "%{$search}%")
                    ->orWhereHas('department', function ($departmentQuery) use ($search) {
                        $departmentQuery->where('department_name', 'like', "%{$search}%")
                            ->orWhere('department_code', 'like', "%{$search}%");
                    });
            });

            $classesQuery->where(function ($query) use ($search) {
                $query->where('school_year', 'like', "%{$search}%")
                    ->orWhereHas('subject', function ($subjectQuery) use ($search) {
                        $subjectQuery->where('subject_name', 'like', "%{$search}%")
                            ->orWhere('subject_code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('sectionRecord', function ($sectionQuery) use ($search) {
                        $sectionQuery->where('section_name', 'like', "%{$search}%")
                            ->orWhere('section_code', 'like', "%{$search}%")
                            ->orWhere('cohort', 'like', "%{$search}%")
                            ->orWhere('grade_level', 'like', "%{$search}%")
                            ->orWhere('strand', 'like', "%{$search}%")
                            ->orWhere('track', 'like', "%{$search}%")
                            ->orWhereHas('department', function ($departmentQuery) use ($search) {
                                $departmentQuery->where('department_name', 'like', "%{$search}%")
                                    ->orWhere('department_code', 'like', "%{$search}%");
                            });
                    })
                    ->orWhereHas('teacher', function ($teacherQuery) use ($search) {
                        $teacherQuery->where('first_name', 'like', "%{$search}%")
                            ->orWhere('middle_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $sections = $sectionsQuery
            ->orderByDesc('created_at')
            ->paginate(10, ['*'], 'sections_page')
            ->withQueryString();

        $sections->setCollection(
            $sections->getCollection()->map(function (Section $section) {
                return [
                    'id' => (int) $section->id,
                    'department_id' => (int) $section->department_id,
                    'section_name' => $section->section_name,
                    'section_code' => $section->section_code,
                    'cohort' => $section->cohort,
                    'grade_level' => $section->grade_level,
                    'strand' => $section->strand,
                    'track' => $section->track,
                    'school_year' => $section->school_year,
                    'description' => $section->description,
                    'students_count' => (int) ($section->students_count ?? 0),
                    'is_active' => (bool) $section->is_active,
                    'department' => $section->department ? [
                        'id' => (int) $section->department->id,
                        'department_name' => $section->department->department_name,
                        'department_code' => $section->department->department_code,
                    ] : null,
                    'created_at' => $section->created_at?->toIso8601String(),
                ];
            })
        );

        $classes = $classesQuery
            ->orderByDesc('created_at')
            ->paginate(10, ['*'], 'classes_page')
            ->withQueryString();

        $classes->setCollection(
            $classes->getCollection()->map(function (SchoolClass $schoolClass) {
                return [
                    'id' => (int) $schoolClass->id,
                    'subject_id' => (int) $schoolClass->subject_id,
                    'section_id' => (int) $schoolClass->section_id,
                    'teacher_id' => (int) $schoolClass->teacher_id,
                    'subject_name' => $schoolClass->subject?->subject_name,
                    'subject_code' => $schoolClass->subject?->subject_code,
                    'teacher_name' => $schoolClass->teacher?->name,
                    'section_name' => $schoolClass->sectionRecord?->section_name,
                    'section_code' => $schoolClass->sectionRecord?->section_code,
                    'cohort' => $schoolClass->sectionRecord?->cohort,
                    'grade_level' => $schoolClass->sectionRecord?->grade_level,
                    'strand' => $schoolClass->sectionRecord?->strand,
                    'track' => $schoolClass->sectionRecord?->track,
                    'school_year' => $schoolClass->school_year,
                    'color' => $schoolClass->color,
                    'department' => $schoolClass->sectionRecord?->department ? [
                        'id' => (int) $schoolClass->sectionRecord->department->id,
                        'department_name' => $schoolClass->sectionRecord->department->department_name,
                        'department_code' => $schoolClass->sectionRecord->department->department_code,
                    ] : null,
                    'created_at' => $schoolClass->created_at?->toIso8601String(),
                ];
            })
        );

        $sectionOptions = Section::query()
            ->with('department:id,department_name,department_code')
            ->where('is_active', true)
            ->orderBy('section_name')
            ->get([
                'id',
                'department_id',
                'section_name',
                'section_code',
                'cohort',
                'grade_level',
                'strand',
                'track',
                'is_active',
            ])
            ->map(fn(Section $section) => [
                'id' => (int) $section->id,
                'department_id' => (int) $section->department_id,
                'section_name' => $section->section_name,
                'section_code' => $section->section_code,
                'cohort' => $section->cohort,
                'grade_level' => $section->grade_level,
                'strand' => $section->strand,
                'track' => $section->track,
                'is_active' => (bool) $section->is_active,
                'department' => $section->department ? [
                    'id' => (int) $section->department->id,
                    'department_name' => $section->department->department_name,
                    'department_code' => $section->department->department_code,
                ] : null,
            ])
            ->values();

        $subjects = Subject::query()
            ->orderBy('subject_name')
            ->get(['id', 'subject_name', 'subject_code'])
            ->map(fn(Subject $subject) => [
                'id' => (int) $subject->id,
                'subject_name' => $subject->subject_name,
                'subject_code' => $subject->subject_code,
            ])
            ->values();

        $teachers = User::query()
            ->with('department:id,department_name,department_code')
            ->whereHas('roles', function ($query) {
                $query->where('name', 'teacher');
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'department_id'])
            ->map(fn(User $teacher) => [
                'id' => (int) $teacher->id,
                'name' => $teacher->name,
                'department_id' => $teacher->department_id ? (int) $teacher->department_id : null,
                'department' => $teacher->department ? [
                    'id' => (int) $teacher->department->id,
                    'department_name' => $teacher->department->department_name,
                    'department_code' => $teacher->department->department_code,
                ] : null,
            ])
            ->values();

        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        return Inertia::render('SuperAdmin/AcademicManagement/Index', [
            'tab' => $tab,
            'sections' => $sections,
            'classes' => $classes,
            'departments' => $departments,
            'sectionOptions' => $sectionOptions,
            'subjects' => $subjects,
            'teachers' => $teachers,
            'currentSchoolYear' => $currentSchoolYear,
            'colorOptions' => self::COLOR_OPTIONS,
            'filters' => [
                'tab' => $tab,
                'search' => $search,
                'department_id' => $departmentId,
            ],
            'stats' => [
                'departments_count' => Department::query()->count(),
                'sections_count' => Section::query()->count(),
                'classes_count' => SchoolClass::query()->count(),
            ],
        ]);
    }

    public function storeSection(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->sectionValidationRules());

        $department = Department::query()->findOrFail((int) $validated['department_id']);
        $sectionName = $this->normalizeText($validated['section_name']);
        $cohort = $this->normalizeText($validated['cohort']);

        $sectionCode = $this->normalizeNullableText($validated['section_code'] ?? null);
        $sectionCode = $sectionCode !== null
            ? $this->normalizeSectionCode($sectionCode)
            : $this->generateSectionCode($sectionName);

        $this->ensureUniqueSectionName((int) $department->id, $cohort, $sectionName);
        $sectionCode = $this->ensureUniqueSectionCode((int) $department->id, $cohort, $sectionCode);

        Section::create([
            'department_id' => (int) $department->id,
            'created_by' => $request->user()?->id,
            'section_name' => $sectionName,
            'section_code' => $sectionCode,
            'cohort' => $cohort,
            'grade_level' => $this->normalizeNullableText($validated['grade_level'] ?? null),
            'strand' => $this->normalizeNullableText($validated['strand'] ?? null) ?? $department->department_code,
            'track' => $this->normalizeNullableText($validated['track'] ?? null),
            'school_year' => $this->normalizeNullableText($validated['school_year'] ?? null) ?? SystemSetting::getCurrentSchoolYear(),
            'description' => $this->normalizeNullableText($validated['description'] ?? null),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect()
            ->route('superadmin.academic-management.index', ['tab' => 'sections'])
            ->with('success', 'Section created successfully.');
    }

    public function updateSection(Request $request, Section $section): RedirectResponse
    {
        $validated = $request->validate($this->sectionValidationRules());

        $department = Department::query()->findOrFail((int) $validated['department_id']);
        $sectionName = $this->normalizeText($validated['section_name']);
        $cohort = $this->normalizeText($validated['cohort']);

        $sectionCode = $this->normalizeNullableText($validated['section_code'] ?? null);
        $sectionCode = $sectionCode !== null
            ? $this->normalizeSectionCode($sectionCode)
            : $this->generateSectionCode($sectionName);

        $this->ensureUniqueSectionName((int) $department->id, $cohort, $sectionName, (int) $section->id);
        $sectionCode = $this->ensureUniqueSectionCode((int) $department->id, $cohort, $sectionCode, (int) $section->id);

        $section->update([
            'department_id' => (int) $department->id,
            'section_name' => $sectionName,
            'section_code' => $sectionCode,
            'cohort' => $cohort,
            'grade_level' => $this->normalizeNullableText($validated['grade_level'] ?? null),
            'strand' => $this->normalizeNullableText($validated['strand'] ?? null) ?? $department->department_code,
            'track' => $this->normalizeNullableText($validated['track'] ?? null),
            'school_year' => $this->normalizeNullableText($validated['school_year'] ?? null) ?? SystemSetting::getCurrentSchoolYear(),
            'description' => $this->normalizeNullableText($validated['description'] ?? null),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect()
            ->route('superadmin.academic-management.index', ['tab' => 'sections'])
            ->with('success', 'Section updated successfully.');
    }

    public function destroySection(Section $section): RedirectResponse
    {
        if ($section->classes()->exists()) {
            return back()->with('error', 'Cannot delete section assigned to classes. Remove related classes first.');
        }

        if ($section->students()->exists()) {
            return back()->with('error', 'Cannot delete section with assigned students. Reassign students first.');
        }

        $section->delete();

        return redirect()
            ->route('superadmin.academic-management.index', ['tab' => 'sections'])
            ->with('success', 'Section deleted successfully.');
    }

    public function storeClass(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->classValidationRules());

        $section = Section::query()->findOrFail((int) $validated['section_id']);

        $this->ensureTeacherAssignable((int) $validated['teacher_id'], (int) $section->department_id);
        $this->ensureUniqueClassAssignment(
            (int) $validated['subject_id'],
            (int) $validated['section_id'],
            $validated['school_year'],
        );

        SchoolClass::create([
            'subject_id' => (int) $validated['subject_id'],
            'section_id' => (int) $validated['section_id'],
            'teacher_id' => (int) $validated['teacher_id'],
            'school_year' => $this->normalizeText($validated['school_year']),
            'grade_level' => $section->grade_level ?? 'Grade 12',
            'section' => $section->section_code ?: $section->section_name,
            'strand' => $section->strand,
            'track' => $section->track,
            'color' => $validated['color'] ?? 'indigo',
            'semester' => (string) SystemSetting::getCurrentSemester(),
        ]);

        return redirect()
            ->route('superadmin.academic-management.index', ['tab' => 'classes'])
            ->with('success', 'Class created successfully.');
    }

    public function updateClass(Request $request, SchoolClass $schoolClass): RedirectResponse
    {
        $validated = $request->validate($this->classValidationRules());

        $section = Section::query()->findOrFail((int) $validated['section_id']);

        $this->ensureTeacherAssignable((int) $validated['teacher_id'], (int) $section->department_id);
        $this->ensureUniqueClassAssignment(
            (int) $validated['subject_id'],
            (int) $validated['section_id'],
            $validated['school_year'],
            (int) $schoolClass->id,
        );

        $schoolClass->update([
            'subject_id' => (int) $validated['subject_id'],
            'section_id' => (int) $validated['section_id'],
            'teacher_id' => (int) $validated['teacher_id'],
            'school_year' => $this->normalizeText($validated['school_year']),
            'grade_level' => $section->grade_level ?? $schoolClass->grade_level,
            'section' => $section->section_code ?: $section->section_name,
            'strand' => $section->strand,
            'track' => $section->track,
            'color' => $validated['color'] ?? $schoolClass->color,
        ]);

        return redirect()
            ->route('superadmin.academic-management.index', ['tab' => 'classes'])
            ->with('success', 'Class updated successfully.');
    }

    public function destroyClass(SchoolClass $schoolClass): RedirectResponse
    {
        if ($schoolClass->enrollments()->exists()) {
            return back()->with('error', 'Cannot delete class with enrolled students.');
        }

        $schoolClass->delete();

        return redirect()
            ->route('superadmin.academic-management.index', ['tab' => 'classes'])
            ->with('success', 'Class deleted successfully.');
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function sectionValidationRules(): array
    {
        return [
            'department_id' => ['required', 'integer', Rule::exists('departments', 'id')],
            'section_name' => ['required', 'string', 'max:255'],
            'section_code' => ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z0-9\s\-]+$/'],
            'cohort' => ['required', 'string', 'max:120'],
            'grade_level' => ['nullable', 'string', 'max:100'],
            'strand' => ['nullable', 'string', 'max:100'],
            'track' => ['nullable', 'string', 'max:100'],
            'school_year' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function classValidationRules(): array
    {
        return [
            'subject_id' => ['required', 'integer', Rule::exists('subjects', 'id')],
            'section_id' => ['required', 'integer', Rule::exists('sections', 'id')->where(fn($query) => $query->where('is_active', true))],
            'teacher_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'school_year' => ['required', 'string', 'max:9', 'regex:/^\d{4}-\d{4}$/'],
            'color' => ['nullable', 'string', Rule::in(self::COLOR_OPTIONS)],
        ];
    }

    private function ensureTeacherAssignable(int $teacherId, int $departmentId): void
    {
        $teacherIsAssignable = User::query()
            ->where('id', $teacherId)
            ->where('department_id', $departmentId)
            ->whereHas('roles', function ($query) {
                $query->where('name', 'teacher');
            })
            ->exists();

        if (! $teacherIsAssignable) {
            throw ValidationException::withMessages([
                'teacher_id' => 'Selected teacher is invalid or belongs to another department.',
            ]);
        }
    }

    private function ensureUniqueClassAssignment(
        int $subjectId,
        int $sectionId,
        string $schoolYear,
        ?int $ignoreClassId = null,
    ): void {
        $query = SchoolClass::query()
            ->where('subject_id', $subjectId)
            ->where('section_id', $sectionId)
            ->where('school_year', $schoolYear);

        if ($ignoreClassId !== null) {
            $query->where('id', '!=', $ignoreClassId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'section_id' => 'This section already has the selected subject for the given school year.',
            ]);
        }
    }

    private function normalizeText(string $value): string
    {
        return preg_replace('/\s+/', ' ', trim($value)) ?? trim($value);
    }

    private function normalizeNullableText(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = $this->normalizeText($value);

        return $normalized !== '' ? $normalized : null;
    }

    private function normalizeSectionCode(string $value): string
    {
        $normalized = Str::upper($this->normalizeText($value));

        return preg_replace('/[^A-Z0-9\-\s]/', '', $normalized) ?? $normalized;
    }

    private function generateSectionCode(string $sectionName): string
    {
        $candidate = Str::upper(Str::slug($sectionName, '-'));

        if ($candidate === '') {
            return 'SECTION';
        }

        return $candidate;
    }

    private function ensureUniqueSectionCode(
        int $departmentId,
        string $cohort,
        string $baseCode,
        ?int $ignoreSectionId = null,
    ): string {
        $counter = 1;
        $candidate = $baseCode;

        while ($this->sectionCodeExists($departmentId, $cohort, $candidate, $ignoreSectionId)) {
            $counter++;
            $candidate = $baseCode . '-' . $counter;
        }

        return $candidate;
    }

    private function sectionCodeExists(
        int $departmentId,
        string $cohort,
        string $sectionCode,
        ?int $ignoreSectionId = null,
    ): bool {
        $query = Section::query()
            ->where('department_id', $departmentId)
            ->where('cohort', $cohort)
            ->where('section_code', $sectionCode);

        if ($ignoreSectionId !== null) {
            $query->where('id', '!=', $ignoreSectionId);
        }

        return $query->exists();
    }

    private function ensureUniqueSectionName(
        int $departmentId,
        string $cohort,
        string $sectionName,
        ?int $ignoreSectionId = null,
    ): void {
        $query = Section::query()
            ->where('department_id', $departmentId)
            ->where('cohort', $cohort)
            ->where('section_name', $sectionName);

        if ($ignoreSectionId !== null) {
            $query->where('id', '!=', $ignoreSectionId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'section_name' => 'A section with this name already exists for the selected cohort and department.',
            ]);
        }
    }
}

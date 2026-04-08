<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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

        $availableStudents = Student::query()
            ->with([
                'user:id,first_name,middle_name,last_name,personal_email,department_id',
                'sectionRecord:id,department_id,section_name',
            ])
            ->whereHas('user.roles', function ($query) {
                $query->where('name', 'student');
            })
            ->orderBy('student_name')
            ->get()
            ->map(function (Student $student) {
                return [
                    'id' => (int) $student->id,
                    'user_id' => $student->user_id ? (int) $student->user_id : null,
                    'student_name' => $student->student_name,
                    'lrn' => $student->lrn,
                    'grade_level' => $student->grade_level,
                    'strand' => $student->strand,
                    'track' => $student->track,
                    'personal_email' => $student->user?->personal_email,
                    'department_id' => $student->user?->department_id ? (int) $student->user->department_id : null,
                    'section_id' => $student->section_id ? (int) $student->section_id : null,
                    'section_name' => $student->sectionRecord?->section_name ?? $student->section,
                ];
            })
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
            'availableStudents' => $availableStudents,
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
        $validated = $request->validate($this->sectionCreateValidationRules());

        $department = Department::query()->findOrFail((int) $validated['department_id']);
        $schoolYear = SystemSetting::getCurrentSchoolYear();
        $cohort = $this->resolveCohortFromSchoolYear($schoolYear);

        $sectionBaseName = $this->normalizeText($validated['section_name']);
        $gradeLevel = $this->normalizeGradeLevel($validated['grade_level']);
        $formattedSectionName = $this->formatSectionName(
            $gradeLevel,
            $department->department_code,
            $sectionBaseName,
        );

        $sectionCode = $this->generateSectionCode($formattedSectionName);

        $this->ensureUniqueSectionName((int) $department->id, $cohort, $formattedSectionName);
        $sectionCode = $this->ensureUniqueSectionCode((int) $department->id, $cohort, $sectionCode);

        $assignedStudentIds = collect($validated['assigned_student_ids'] ?? [])
            ->map(fn($value) => (int) $value)
            ->filter(fn($value) => $value > 0)
            ->unique()
            ->values();

        $newStudents = collect($validated['new_students'] ?? [])
            ->map(function (array $item) {
                return [
                    'first_name' => $this->normalizeText($item['first_name'] ?? ''),
                    'last_name' => $this->normalizeText($item['last_name'] ?? ''),
                    'middle_name' => isset($item['middle_name']) ? $this->normalizeNullableText($item['middle_name']) : null,
                    'lrn' => $this->normalizeText($item['lrn'] ?? ''),
                    'personal_email' => isset($item['personal_email']) ? $this->normalizeNullableEmail($item['personal_email']) : null,
                ];
            })
            ->values();

        if ($assignedStudentIds->isEmpty() && $newStudents->isEmpty()) {
            throw ValidationException::withMessages([
                'student_assignment' => 'Add at least one student (assign existing or create new) before saving.',
            ]);
        }

        $summary = DB::transaction(function () use (
            $request,
            $department,
            $schoolYear,
            $cohort,
            $gradeLevel,
            $formattedSectionName,
            $sectionCode,
            $assignedStudentIds,
            $newStudents
        ) {
            $section = Section::create([
                'department_id' => (int) $department->id,
                'created_by' => $request->user()?->id,
                'section_name' => $formattedSectionName,
                'section_code' => $sectionCode,
                'cohort' => $cohort,
                'grade_level' => $gradeLevel,
                'strand' => $department->department_code,
                'track' => null,
                'school_year' => $schoolYear,
                'description' => null,
                'is_active' => true,
            ]);

            $assignedExistingStudents = [];
            if ($assignedStudentIds->isNotEmpty()) {
                $students = Student::query()
                    ->with('user')
                    ->whereIn('id', $assignedStudentIds)
                    ->get();

                foreach ($students as $student) {
                    $previousSection = $student->section;

                    if (
                        $student->user &&
                        (int) ($student->user->department_id ?? 0) !== (int) $department->id
                    ) {
                        $student->user->update(['department_id' => (int) $department->id]);
                    }

                    $student->update([
                        'section_id' => (int) $section->id,
                        'section' => $section->section_name,
                        'grade_level' => $section->grade_level,
                        'strand' => $section->strand,
                        'track' => $section->track,
                    ]);

                    $assignedExistingStudents[] = [
                        'id' => (int) $student->id,
                        'student_name' => $student->student_name,
                        'lrn' => $student->lrn,
                        'previous_section' => $previousSection,
                    ];
                }
            }

            $createdStudents = [];
            foreach ($newStudents as $newStudent) {
                $temporaryPassword = Str::random(10);

                $user = User::create([
                    'first_name' => $newStudent['first_name'],
                    'middle_name' => $newStudent['middle_name'],
                    'last_name' => $newStudent['last_name'],
                    'username' => User::generateUniqueUsername($newStudent['first_name'] . ' ' . $newStudent['last_name']),
                    'personal_email' => $newStudent['personal_email'],
                    'password' => Hash::make($temporaryPassword),
                    'must_change_password' => true,
                    'department_id' => (int) $department->id,
                    'created_by' => $request->user()?->id,
                ]);

                $user->syncRolesByName(['student']);

                $middleName = $newStudent['middle_name'];
                $studentName = trim(
                    $newStudent['first_name']
                        . ' '
                        . ($middleName ? $middleName . ' ' : '')
                        . $newStudent['last_name']
                );

                $createdStudent = Student::create([
                    'user_id' => (int) $user->id,
                    'student_name' => $studentName,
                    'lrn' => $newStudent['lrn'],
                    'grade_level' => $section->grade_level,
                    'section' => $section->section_name,
                    'section_id' => (int) $section->id,
                    'strand' => $section->strand,
                    'track' => $section->track,
                ]);

                $createdStudents[] = [
                    'id' => (int) $createdStudent->id,
                    'student_name' => $createdStudent->student_name,
                    'lrn' => $createdStudent->lrn,
                    'personal_email' => $newStudent['personal_email'],
                ];
            }

            return [
                'section_id' => (int) $section->id,
                'section_name' => $section->section_name,
                'section_code' => $section->section_code,
                'department_name' => $department->department_name,
                'department_code' => $department->department_code,
                'cohort' => $section->cohort,
                'grade_level' => $section->grade_level,
                'school_year' => $section->school_year,
                'is_active' => (bool) $section->is_active,
                'existing_assigned_count' => count($assignedExistingStudents),
                'new_students_created_count' => count($createdStudents),
                'total_students' => count($assignedExistingStudents) + count($createdStudents),
                'assigned_existing_students' => $assignedExistingStudents,
                'created_students' => $createdStudents,
            ];
        });

        return redirect()
            ->route('superadmin.academic-management.index', ['tab' => 'sections'])
            ->with('success', 'Section created successfully.')
            ->with('section_create_summary', $summary);
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

    /**
     * @return array<string, array<int, mixed>>
     */
    private function sectionCreateValidationRules(): array
    {
        return [
            'department_id' => ['required', 'integer', Rule::exists('departments', 'id')],
            'section_name' => ['required', 'string', 'max:255'],
            'grade_level' => ['required', 'string', 'max:100'],
            'school_year' => ['nullable', 'string', 'max:20'],
            'assigned_student_ids' => ['nullable', 'array'],
            'assigned_student_ids.*' => ['integer', Rule::exists('students', 'id')],
            'new_students' => ['nullable', 'array'],
            'new_students.*.first_name' => ['required', 'string', 'max:255'],
            'new_students.*.last_name' => ['required', 'string', 'max:255'],
            'new_students.*.middle_name' => ['nullable', 'string', 'max:255'],
            'new_students.*.lrn' => ['required', 'string', 'max:20', 'distinct', Rule::unique('students', 'lrn')],
            'new_students.*.personal_email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'personal_email')],
        ];
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

    private function normalizeNullableEmail(?string $value): ?string
    {
        $normalized = $this->normalizeNullableText($value);

        return $normalized !== null ? Str::lower($normalized) : null;
    }

    private function normalizeGradeLevel(string $value): string
    {
        $normalized = $this->normalizeText($value);

        if (preg_match('/(\d{1,2})/', $normalized, $matches) === 1) {
            return 'Grade ' . $matches[1];
        }

        return $normalized;
    }

    private function extractGradeToken(string $gradeLevel): string
    {
        if (preg_match('/(\d{1,2})/', $gradeLevel, $matches) === 1) {
            return $matches[1];
        }

        return $gradeLevel;
    }

    private function formatSectionName(string $gradeLevel, string $departmentCode, string $baseSectionName): string
    {
        $gradeToken = $this->extractGradeToken($gradeLevel);
        $normalizedDepartmentCode = Str::upper($this->normalizeText($departmentCode));
        $normalizedSectionName = $this->normalizeText($baseSectionName);

        return sprintf(
            '%s - %s - %s',
            $gradeToken,
            $normalizedDepartmentCode,
            $normalizedSectionName,
        );
    }

    private function resolveCohortFromSchoolYear(string $schoolYear): string
    {
        if (preg_match('/^(\d{4})-\d{4}$/', $schoolYear, $matches) === 1) {
            return $matches[1];
        }

        if (preg_match('/(\d{4})/', $schoolYear, $matches) === 1) {
            return $matches[1];
        }

        return (string) now()->year;
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

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Student;
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

class SectionController extends Controller
{
    /**
     * Display section management page for the admin's department.
     */
    public function index(Request $request): Response
    {
        $admin = $request->user();
        $departmentId = $admin?->department_id;
        $departmentCode = $admin?->department?->department_code;
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        $sectionsQuery = Section::query()
            ->with(['advisorTeacher:id,first_name,middle_name,last_name'])
            ->withCount('students')
            ->where('department_id', $departmentId);

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));

            $sectionsQuery->where(function ($query) use ($search) {
                $query->where('section_name', 'like', "%{$search}%")
                    ->orWhere('section_code', 'like', "%{$search}%")
                    ->orWhere('cohort', 'like', "%{$search}%");
            });
        }

        $sections = $sectionsQuery
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        $sections->setCollection(
            $sections->getCollection()->map(function (Section $section) use ($departmentCode) {
                $specialization = $section->track ?: ($section->strand ?: $departmentCode);

                return [
                    'id' => $section->id,
                    'section_name' => $section->section_name,
                    'section_full_label' => satis_section_full_label(
                        $section->grade_level,
                        $specialization,
                        $section->section_name,
                    ),
                    'section_code' => $section->section_code,
                    'cohort' => $section->cohort,
                    'grade_level' => $section->grade_level,
                    'strand' => $section->strand,
                    'track' => $section->track,
                    'school_year' => $section->school_year,
                    'advisor_teacher_id' => $section->advisor_teacher_id ? (int) $section->advisor_teacher_id : null,
                    'advisor_teacher_name' => $section->advisorTeacher?->name,
                    'description' => $section->description,
                    'students_count' => (int) ($section->students_count ?? 0),
                    'is_active' => (bool) $section->is_active,
                    'created_at' => $section->created_at?->toIso8601String(),
                ];
            })
        );

        $availableStudents = Student::query()
            ->with(['user:id,first_name,middle_name,last_name,personal_email,department_id'])
            ->where(function ($query) {
                $query->whereNull('section_id')
                    ->where(function ($subQuery) {
                        $subQuery->whereNull('section')
                            ->orWhere('section', '');
                    });
            })
            ->whereHas('user', function ($query) use ($departmentId) {
                $query->whereHas('roles', function ($roleQuery) {
                    $roleQuery->where('name', 'student');
                })->where(function ($departmentQuery) use ($departmentId) {
                    $departmentQuery->whereNull('department_id')
                        ->orWhere('department_id', $departmentId);
                });
            })
            ->orderBy('student_name')
            ->limit(500)
            ->get()
            ->map(function (Student $student) {
                return [
                    'id' => $student->id,
                    'user_id' => $student->user_id,
                    'student_name' => $student->student_name,
                    'lrn' => $student->lrn,
                    'grade_level' => $student->grade_level,
                    'strand' => $student->strand,
                    'track' => $student->track,
                    'personal_email' => $student->user?->personal_email,
                    'department_id' => $student->user?->department_id,
                ];
            })
            ->values();

        $teachers = User::query()
            ->where('department_id', $departmentId)
            ->whereHas('roles', function ($query) {
                $query->where('name', 'teacher');
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'middle_name', 'last_name'])
            ->map(fn(User $teacher) => [
                'id' => (int) $teacher->id,
                'name' => $teacher->name,
            ])
            ->values();

        return Inertia::render('Admin/Sections/Index', [
            'sections' => $sections,
            'availableStudents' => $availableStudents,
            'teachers' => $teachers,
            'filters' => $request->only(['search']),
            'currentSchoolYear' => $currentSchoolYear,
            'department' => $admin?->department ? [
                'id' => $admin->department->id,
                'name' => $admin->department->department_name,
                'code' => $admin->department->department_code,
            ] : null,
        ]);
    }

    /**
     * Store a newly created section and assignment payload from wizard.
     */
    public function store(Request $request): RedirectResponse
    {
        $admin = $request->user();
        $departmentId = $admin?->department_id;

        if (!$departmentId) {
            return back()->with('error', 'Your account has no assigned department.');
        }

        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        $validated = $request->validate([
            'section_name' => ['required', 'string', 'max:255'],
            'section_code' => ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z0-9\s\-]+$/'],
            'cohort' => ['required', 'string', 'max:120'],
            'grade_level' => ['nullable', 'string', Rule::in(satis_grade_level_options())],
            'strand' => ['nullable', 'string', 'max:100'],
            'track' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'advisor_teacher_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'assigned_student_ids' => ['nullable', 'array'],
            'assigned_student_ids.*' => ['integer', 'exists:students,id'],
            'new_students' => ['nullable', 'array'],
            'new_students.*.first_name' => ['required', 'string', 'max:255'],
            'new_students.*.last_name' => ['required', 'string', 'max:255'],
            'new_students.*.middle_name' => ['nullable', 'string', 'max:255'],
            'new_students.*.lrn' => ['required', 'string', 'size:12', 'distinct', Rule::unique('students', 'lrn')],
            'new_students.*.personal_email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'personal_email')],
        ]);

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

        $advisorTeacherId = isset($validated['advisor_teacher_id'])
            ? (int) $validated['advisor_teacher_id']
            : null;

        if ($advisorTeacherId !== null && $advisorTeacherId > 0) {
            $this->ensureTeacherAssignable($advisorTeacherId, $departmentId, 'advisor_teacher_id');
        } else {
            $advisorTeacherId = null;
        }

        $sectionName = satis_extract_section_base_name($validated['section_name'])
            ?? $this->normalizeText($validated['section_name']);
        $cohort = $this->normalizeText($validated['cohort']);
        $gradeLevel = satis_normalize_grade_level($validated['grade_level'] ?? null);

        $sectionCode = $this->normalizeNullableText($validated['section_code'] ?? null);
        $sectionCode = $sectionCode !== null
            ? $this->normalizeSectionCode($sectionCode)
            : $this->generateSectionCode($sectionName);

        $sectionCode = $this->ensureUniqueSectionCode($departmentId, $cohort, $sectionCode);

        $conflictingSection = Section::query()
            ->where('department_id', $departmentId)
            ->where('cohort', $cohort)
            ->where('section_name', $sectionName)
            ->exists();

        if ($conflictingSection) {
            throw ValidationException::withMessages([
                'section_name' => 'A section with this name already exists for the selected cohort in your department.',
            ]);
        }

        $assignableStudentIds = Student::query()
            ->whereIn('id', $assignedStudentIds)
            ->where(function ($query) {
                $query->whereNull('section_id')
                    ->where(function ($subQuery) {
                        $subQuery->whereNull('section')
                            ->orWhere('section', '');
                    });
            })
            ->whereHas('user', function ($query) use ($departmentId) {
                $query->whereHas('roles', function ($roleQuery) {
                    $roleQuery->where('name', 'student');
                })->where(function ($departmentQuery) use ($departmentId) {
                    $departmentQuery->whereNull('department_id')
                        ->orWhere('department_id', $departmentId);
                });
            })
            ->pluck('id');

        if ($assignableStudentIds->count() !== $assignedStudentIds->count()) {
            throw ValidationException::withMessages([
                'assigned_student_ids' => 'One or more selected students are no longer assignable. Please refresh and try again.',
            ]);
        }

        $summary = DB::transaction(function () use (
            $admin,
            $departmentId,
            $sectionName,
            $sectionCode,
            $cohort,
            $gradeLevel,
            $validated,
            $assignedStudentIds,
            $newStudents,
            $advisorTeacherId,
            $currentSchoolYear
        ) {
            $section = Section::create([
                'department_id' => $departmentId,
                'advisor_teacher_id' => $advisorTeacherId,
                'created_by' => $admin->id,
                'section_name' => $sectionName,
                'section_code' => $sectionCode,
                'cohort' => $cohort,
                'grade_level' => $gradeLevel,
                'strand' => $this->normalizeNullableText($validated['strand'] ?? null),
                'track' => $this->normalizeNullableText($validated['track'] ?? null),
                'school_year' => $currentSchoolYear,
                'description' => $this->normalizeNullableText($validated['description'] ?? null),
                'is_active' => true,
            ]);

            $existingAssignedCount = 0;
            if ($assignedStudentIds->isNotEmpty()) {
                $students = Student::query()
                    ->with('user')
                    ->whereIn('id', $assignedStudentIds)
                    ->get();

                foreach ($students as $student) {
                    if ($student->user && $student->user->department_id !== $departmentId) {
                        $student->user->update(['department_id' => $departmentId]);
                    }

                    $student->update([
                        'section_id' => $section->id,
                        'section' => $section->section_name,
                        'grade_level' => $section->grade_level ?? $student->grade_level,
                        'strand' => $section->strand ?? $student->strand,
                        'track' => $section->track ?? $student->track,
                    ]);
                }

                $existingAssignedCount = $students->count();
            }

            $newStudentsCreatedCount = 0;
            foreach ($newStudents as $newStudent) {
                $tempPassword = Str::random(10);

                $user = User::create([
                    'first_name' => $newStudent['first_name'],
                    'middle_name' => $newStudent['middle_name'],
                    'last_name' => $newStudent['last_name'],
                    'username' => User::generateUniqueUsername($newStudent['first_name'] . ' ' . $newStudent['last_name']),
                    'personal_email' => $newStudent['personal_email'],
                    'temporary_password' => $tempPassword,
                    'password' => Hash::make($tempPassword),
                    'must_change_password' => true,
                    'department_id' => $departmentId,
                    'created_by' => $admin->id,
                    'email_verified_at' => null,
                ]);

                $user->syncRolesByName(['student']);

                $middleName = $newStudent['middle_name'];
                $studentName = trim(
                    $newStudent['first_name']
                        . ' '
                        . ($middleName ? $middleName . ' ' : '')
                        . $newStudent['last_name']
                );

                Student::create([
                    'user_id' => $user->id,
                    'student_name' => $studentName,
                    'lrn' => $newStudent['lrn'],
                    'grade_level' => $section->grade_level,
                    'section' => $section->section_name,
                    'section_id' => $section->id,
                    'strand' => $section->strand,
                    'track' => $section->track,
                ]);

                $newStudentsCreatedCount++;
            }

            return [
                'section_name' => $section->section_name,
                'section_full_label' => satis_section_full_label(
                    $section->grade_level,
                    $section->strand,
                    $section->section_name,
                ),
                'section_code' => $section->section_code,
                'cohort' => $section->cohort,
                'school_year' => $section->school_year,
                'existing_assigned_count' => $existingAssignedCount,
                'new_students_created_count' => $newStudentsCreatedCount,
                'total_students' => $existingAssignedCount + $newStudentsCreatedCount,
            ];
        });

        return redirect()
            ->route('admin.sections.index')
            ->with('success', 'Section created successfully.')
            ->with('section_create_summary', $summary);
    }

    private function ensureTeacherAssignable(int $teacherId, int $departmentId, string $field = 'advisor_teacher_id'): void
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
                $field => 'Selected adviser must be a teacher in your department.',
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

    private function ensureUniqueSectionCode(int $departmentId, string $cohort, string $baseCode): string
    {
        $counter = 1;
        $candidate = $baseCode;

        while (Section::query()
            ->where('department_id', $departmentId)
            ->where('cohort', $cohort)
            ->where('section_code', $candidate)
            ->exists()
        ) {
            $counter++;
            $candidate = $baseCode . '-' . $counter;
        }

        return $candidate;
    }
}

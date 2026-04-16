<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Subject;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ClassController extends Controller
{
    /**
     * Display class management page for the admin's department.
     */
    public function index(Request $request): Response
    {
        $admin = $request->user();
        $departmentId = $admin?->department_id;
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        $classesQuery = SchoolClass::query()
            ->with([
                'subject:id,subject_name,subject_code',
                'sectionRecord:id,department_id,section_name,section_code,grade_level,strand,track,is_active',
                'teacher:id,first_name,middle_name,last_name,department_id',
            ])
            ->whereHas('sectionRecord', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            });

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));

            $classesQuery->where(function ($query) use ($search) {
                $query->where('school_year', 'like', "%{$search}%")
                    ->orWhereHas('subject', function ($subjectQuery) use ($search) {
                        $subjectQuery->where('subject_name', 'like', "%{$search}%")
                            ->orWhere('subject_code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('sectionRecord', function ($sectionQuery) use ($search) {
                        $sectionQuery->where('section_name', 'like', "%{$search}%")
                            ->orWhere('section_code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('teacher', function ($teacherQuery) use ($search) {
                        $teacherQuery->where('first_name', 'like', "%{$search}%")
                            ->orWhere('middle_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $classes = $classesQuery
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        $classes->setCollection(
            $classes->getCollection()->map(function (SchoolClass $schoolClass) {
                return [
                    'id' => $schoolClass->id,
                    'subject_id' => (int) $schoolClass->subject_id,
                    'section_id' => (int) $schoolClass->section_id,
                    'teacher_id' => (int) $schoolClass->teacher_id,
                    'subject_name' => $schoolClass->subject?->subject_name,
                    'subject_code' => $schoolClass->subject?->subject_code,
                    'section_name' => $schoolClass->sectionRecord?->section_name,
                    'section_code' => $schoolClass->sectionRecord?->section_code,
                    'teacher_name' => $schoolClass->teacher?->name,
                    'school_year' => $schoolClass->school_year,
                    'created_at' => $schoolClass->created_at?->toIso8601String(),
                    'updated_at' => $schoolClass->updated_at?->toIso8601String(),
                ];
            })
        );

        $subjects = Subject::query()
            ->orderBy('subject_name')
            ->get(['id', 'subject_name', 'subject_code'])
            ->map(function (Subject $subject) {
                return [
                    'id' => $subject->id,
                    'subject_name' => $subject->subject_name,
                    'subject_code' => $subject->subject_code,
                ];
            })
            ->values();

        $sections = Section::query()
            ->where('department_id', $departmentId)
            ->where('is_active', true)
            ->orderBy('section_name')
            ->get(['id', 'section_name', 'section_code', 'grade_level', 'strand', 'track'])
            ->map(function (Section $section) {
                return [
                    'id' => $section->id,
                    'section_name' => $section->section_name,
                    'section_code' => $section->section_code,
                    'grade_level' => $section->grade_level,
                    'strand' => $section->strand,
                    'track' => $section->track,
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
            ->map(function (User $teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                ];
            })
            ->values();

        return Inertia::render('Admin/Classes/Index', [
            'classes' => $classes,
            'subjects' => $subjects,
            'sections' => $sections,
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
     * Store a newly created class assignment.
     */
    public function store(Request $request): RedirectResponse
    {
        $admin = $request->user();
        $departmentId = $admin?->department_id;

        if (!$departmentId) {
            return back()->with('error', 'Your account has no assigned department.');
        }

        $validated = $request->validate($this->validationRules($departmentId));

        $this->ensureTeacherRole((int) $validated['teacher_id'], $departmentId);
        $this->ensureUniqueClassAssignment(
            (int) $validated['subject_id'],
            (int) $validated['section_id'],
            $validated['school_year']
        );

        $class = SchoolClass::create([
            'subject_id' => (int) $validated['subject_id'],
            'section_id' => (int) $validated['section_id'],
            'teacher_id' => (int) $validated['teacher_id'],
            'school_year' => $validated['school_year'],
        ]);

        return redirect()
            ->route('admin.classes.index')
            ->with('success', 'Class created successfully.')
            ->with('class_create_summary', [
                'id' => $class->id,
                'subject_id' => $class->subject_id,
                'section_id' => $class->section_id,
                'teacher_id' => $class->teacher_id,
                'school_year' => $class->school_year,
            ]);
    }

    /**
     * Update the specified class assignment.
     */
    public function update(Request $request, SchoolClass $schoolClass): RedirectResponse
    {
        $admin = $request->user();
        $departmentId = $admin?->department_id;

        if (!$departmentId) {
            return back()->with('error', 'Your account has no assigned department.');
        }

        $managedClass = $this->resolveManagedClass($schoolClass, $departmentId);

        $validated = $request->validate($this->validationRules($departmentId));

        $this->ensureTeacherRole((int) $validated['teacher_id'], $departmentId);
        $this->ensureUniqueClassAssignment(
            (int) $validated['subject_id'],
            (int) $validated['section_id'],
            $validated['school_year'],
            $managedClass->id
        );

        $managedClass->update([
            'subject_id' => (int) $validated['subject_id'],
            'section_id' => (int) $validated['section_id'],
            'teacher_id' => (int) $validated['teacher_id'],
            'school_year' => $validated['school_year'],
        ]);

        return redirect()
            ->route('admin.classes.index')
            ->with('success', 'Class updated successfully.');
    }

    /**
     * Remove the specified class assignment.
     */
    public function destroy(Request $request, SchoolClass $schoolClass): RedirectResponse
    {
        $admin = $request->user();
        $departmentId = $admin?->department_id;

        if (!$departmentId) {
            return back()->with('error', 'Your account has no assigned department.');
        }

        $managedClass = $this->resolveManagedClass($schoolClass, $departmentId);
        $managedClass->delete();

        return redirect()
            ->route('admin.classes.index')
            ->with('success', 'Class deleted successfully.');
    }

    /**
     * Build class validation rules.
     *
     * @return array<string, array<int, \Illuminate\Contracts\Validation\ValidationRule|string>>
     */
    private function validationRules(int $departmentId): array
    {
        return [
            'subject_id' => [
                'required',
                'integer',
                Rule::exists('subjects', 'id'),
            ],
            'section_id' => [
                'required',
                'integer',
                Rule::exists('sections', 'id')->where(function ($query) use ($departmentId) {
                    $query->where('department_id', $departmentId)
                        ->where('is_active', true);
                }),
            ],
            'teacher_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(function ($query) use ($departmentId) {
                    $query->where('department_id', $departmentId);
                }),
            ],
            'school_year' => [
                'required',
                'string',
                'max:9',
                'regex:/^\d{4}-\d{4}$/',
            ],
        ];
    }

    /**
     * Ensure selected teacher belongs to teacher role.
     */
    private function ensureTeacherRole(int $teacherId, int $departmentId): void
    {
        $teacherIsAssignable = User::query()
            ->where('id', $teacherId)
            ->where('department_id', $departmentId)
            ->whereHas('roles', function ($query) {
                $query->where('name', 'teacher');
            })
            ->exists();

        if (!$teacherIsAssignable) {
            throw ValidationException::withMessages([
                'teacher_id' => 'Selected teacher is invalid or no longer assignable.',
            ]);
        }
    }

    /**
     * Prevent duplicate subject+section assignments for a school year.
     */
    private function ensureUniqueClassAssignment(
        int $subjectId,
        int $sectionId,
        string $schoolYear,
        ?int $ignoreClassId = null
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

    /**
     * Scope class operations to the admin's department.
     */
    private function resolveManagedClass(SchoolClass $schoolClass, int $departmentId): SchoolClass
    {
        $resolved = SchoolClass::query()
            ->with('sectionRecord:id,department_id')
            ->findOrFail($schoolClass->id);

        if ((int) $resolved->sectionRecord?->department_id !== (int) $departmentId) {
            abort(404);
        }

        return $resolved;
    }
}

<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\Subject;
use App\Models\SubjectType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    /**
     * @var array<int, string>
     */
    private const SEMESTER_OPTIONS = ['1', '2'];

    /**
     * @var array<int, string>
     */
    private const GRADE_LEVEL_OPTIONS = ['11', '12'];

    /**
     * Display a listing of subjects.
     */
    public function index(Request $request): Response
    {
        $this->authorize('manage-subjects');

        $search = trim((string) $request->input('search', ''));
        $typeFilter = $this->resolveTypeFilter($request->input('type'));
        $semesterFilter = $this->resolveSemesterFilter($request->input('semester'));
        $gradeLevelFilter = $this->resolveGradeLevelFilter($request->input('grade_level'));
        $currentSchoolYear = $this->currentSchoolYear();
        $currentSemester = $this->currentSemester();

        $query = Subject::query()
            ->with(['subjectTypes:id,type_key,name'])
            ->withCount([
                'subjectTeachers',
                'subjectTeachers as current_subject_teachers_count' => function ($builder) use ($currentSchoolYear, $currentSemester) {
                    $builder
                        ->where('school_year', $currentSchoolYear)
                        ->where('semester', $currentSemester);
                },
            ]);

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('subject_name', 'like', "%{$search}%")
                    ->orWhere('subject_code', 'like', "%{$search}%");
            });
        }

        if ($typeFilter !== 'all') {
            $query->whereHas('subjectTypes', function ($builder) use ($typeFilter) {
                $builder->where('type_key', $typeFilter);
            });
        }

        if ($semesterFilter !== 'all') {
            $query->where('semester', $semesterFilter);
        }

        if ($gradeLevelFilter !== 'all') {
            $query->where('grade_level', $gradeLevelFilter);
        }

        $subjects = $query
            ->orderBy('subject_name')
            ->paginate(10)
            ->withQueryString();

        $subjects->setCollection(
            $subjects->getCollection()->map(function (Subject $subject) use ($currentSchoolYear, $currentSemester) {
                $primaryType = $subject->primarySubjectType();
                $currentClassesCount = (int) ($subject->current_subject_teachers_count ?? 0);
                $canDelete = $currentClassesCount === 0;
                $semesterLabel = $this->semesterLabel($currentSemester);

                return [
                    'id' => $subject->id,
                    'subject_name' => $subject->subject_name,
                    'subject_code' => $subject->subject_code,
                    'total_hours' => $subject->total_hours,
                    'semester' => $subject->semester,
                    'grade_level' => $subject->grade_level,
                    'subject_type_key' => $primaryType?->type_key,
                    'subject_type_name' => $primaryType?->name,
                    'subject_type_keys' => $subject->subjectTypes
                        ->pluck('type_key')
                        ->values()
                        ->all(),
                    'classes_count' => (int) ($subject->subject_teachers_count ?? 0),
                    'current_classes_count' => $currentClassesCount,
                    'can_delete' => $canDelete,
                    'delete_blocked_reason' => $canDelete
                        ? ''
                        : "Cannot delete subject assigned to classes for {$currentSchoolYear}, {$semesterLabel}.",
                    'current_school_year' => $currentSchoolYear,
                    'current_semester' => $currentSemester,
                    'created_at' => $subject->created_at?->toIso8601String(),
                    'updated_at' => $subject->updated_at?->toIso8601String(),
                ];
            })
        );

        $summaryQuery = Subject::query();

        if ($semesterFilter !== 'all') {
            $summaryQuery->where('semester', $semesterFilter);
        }

        if ($gradeLevelFilter !== 'all') {
            $summaryQuery->where('grade_level', $gradeLevelFilter);
        }

        $totalSubjects = (clone $summaryQuery)->count();
        $coreSubjects = (clone $summaryQuery)
            ->whereHas('subjectTypes', fn($builder) => $builder->where('type_key', SubjectType::CORE))
            ->count();
        $appliedSubjects = (clone $summaryQuery)
            ->whereHas('subjectTypes', fn($builder) => $builder->where('type_key', SubjectType::APPLIED))
            ->count();
        $academicSpecializedSubjects = (clone $summaryQuery)
            ->whereHas('subjectTypes', fn($builder) => $builder->where('type_key', SubjectType::SPECIALIZED_ACADEMIC))
            ->count();
        $tvlSpecializedSubjects = (clone $summaryQuery)
            ->whereHas('subjectTypes', fn($builder) => $builder->where('type_key', SubjectType::SPECIALIZED_TVL))
            ->count();

        return Inertia::render('SuperAdmin/Subjects/Index', [
            'subjects' => $subjects,
            'typeOptions' => $this->subjectTypeOptions(),
            'semesterOptions' => self::SEMESTER_OPTIONS,
            'gradeLevelOptions' => self::GRADE_LEVEL_OPTIONS,
            'summary' => [
                'all' => (int) $totalSubjects,
                'core' => (int) $coreSubjects,
                'applied' => (int) $appliedSubjects,
                'specialized_academic' => (int) $academicSpecializedSubjects,
                'specialized_tvl' => (int) $tvlSpecializedSubjects,
            ],
            'filters' => [
                'search' => $search,
                'type' => $typeFilter,
                'semester' => $semesterFilter,
                'grade_level' => $gradeLevelFilter,
            ],
        ]);
    }

    /**
     * Store a newly created subject.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create-subject');

        if ($this->isQueuePayload($request)) {
            $validated = $request->validate($this->queueValidationRules());
            $subjectTypeId = $this->resolveSubjectTypeId($validated['type_key']);
            $queueSubjects = $this->normalizeQueueSubjects(
                $validated['subjects'],
                $validated['semester'],
                $validated['grade_level']
            );

            DB::transaction(function () use ($queueSubjects, $subjectTypeId): void {
                $queueSubjects->each(function (array $subjectData) use ($subjectTypeId): void {
                    $subject = Subject::create($subjectData);
                    $subject->subjectTypes()->sync([$subjectTypeId]);
                });
            });

            $subjectCount = $queueSubjects->count();

            return redirect()
                ->route('superadmin.subjects.index')
                ->with('success', "{$subjectCount} subject" . ($subjectCount === 1 ? '' : 's') . ' created successfully.');
        }

        $validated = $request->validate($this->singleValidationRules());
        $subjectTypeId = $this->resolveSubjectTypeId($validated['type_key'] ?? SubjectType::CORE);

        $subject = Subject::create([
            'subject_name' => $this->normalizeText($validated['subject_name']),
            'subject_code' => strtoupper($this->normalizeText($validated['subject_code'])),
            'total_hours' => isset($validated['total_hours']) ? (int) $validated['total_hours'] : null,
            'semester' => $validated['semester'],
            'grade_level' => $validated['grade_level'],
        ]);

        $subject->subjectTypes()->sync([$subjectTypeId]);

        return redirect()
            ->route('superadmin.subjects.index')
            ->with('success', "Subject {$subject->subject_name} created successfully.");
    }

    /**
     * Update the specified subject.
     */
    public function update(Request $request, Subject $subject): RedirectResponse
    {
        $this->authorize('update-subject');

        $validated = $request->validate($this->singleValidationRules($subject));

        $subject->update([
            'subject_name' => $this->normalizeText($validated['subject_name']),
            'subject_code' => strtoupper($this->normalizeText($validated['subject_code'])),
            'total_hours' => isset($validated['total_hours']) ? (int) $validated['total_hours'] : null,
            'semester' => $validated['semester'],
            'grade_level' => $validated['grade_level'],
        ]);

        if (!empty($validated['type_key'])) {
            $subject->subjectTypes()->sync([$this->resolveSubjectTypeId($validated['type_key'])]);
        }

        return redirect()
            ->route('superadmin.subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    /**
     * Remove the specified subject.
     */
    public function destroy(Subject $subject): RedirectResponse
    {
        $this->authorize('delete-subject');

        $currentSchoolYear = $this->currentSchoolYear();
        $currentSemester = $this->currentSemester();
        $semesterLabel = $this->semesterLabel($currentSemester);

        $isAssignedToCurrentClasses = $subject->subjectTeachers()
            ->where('school_year', $currentSchoolYear)
            ->where('semester', $currentSemester)
            ->exists();

        if ($isAssignedToCurrentClasses) {
            return back()->with(
                'error',
                "Cannot delete subject assigned to classes for {$currentSchoolYear}, {$semesterLabel}."
            );
        }

        $subject->delete();

        return redirect()
            ->route('superadmin.subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }

    /**
     * Build validation rules for create and update actions.
     *
     * @return array<string, array<int, \Illuminate\Contracts\Validation\ValidationRule|string>>
     */
    private function singleValidationRules(?Subject $subject = null): array
    {
        $subjectNameUniqueRule = Rule::unique('subjects', 'subject_name');
        $subjectCodeUniqueRule = Rule::unique('subjects', 'subject_code');

        if ($subject !== null) {
            $subjectNameUniqueRule->ignore($subject->id);
            $subjectCodeUniqueRule->ignore($subject->id);
        }

        return [
            'subject_name' => [
                'required',
                'string',
                'max:255',
                $subjectNameUniqueRule,
            ],
            'subject_code' => [
                'required',
                'string',
                'max:100',
                'regex:/^[A-Za-z0-9\s\-]+$/',
                $subjectCodeUniqueRule,
            ],
            'total_hours' => [
                'nullable',
                'integer',
                'min:1',
                'max:1000',
            ],
            'type_key' => [
                'nullable',
                'string',
                Rule::exists('subject_types', 'type_key'),
            ],
            'grade_level' => [
                'required',
                'string',
                Rule::in(self::GRADE_LEVEL_OPTIONS),
            ],
            'semester' => [
                'required',
                'string',
                Rule::in(self::SEMESTER_OPTIONS),
            ],
        ];
    }

    /**
     * @return array<string, array<int, \Illuminate\Contracts\Validation\ValidationRule|string>>
     */
    private function queueValidationRules(): array
    {
        return [
            'type_key' => [
                'required',
                'string',
                Rule::exists('subject_types', 'type_key'),
            ],
            'grade_level' => [
                'required',
                'string',
                Rule::in(self::GRADE_LEVEL_OPTIONS),
            ],
            'semester' => [
                'required',
                'string',
                Rule::in(self::SEMESTER_OPTIONS),
            ],
            'subjects' => [
                'required',
                'array',
                'min:1',
                'max:100',
            ],
            'subjects.*.subject_name' => [
                'required',
                'string',
                'max:255',
                'distinct',
                Rule::unique('subjects', 'subject_name'),
            ],
            'subjects.*.subject_code' => [
                'required',
                'string',
                'max:100',
                'regex:/^[A-Za-z0-9\s\-]+$/',
                'distinct',
                Rule::unique('subjects', 'subject_code'),
            ],
            'subjects.*.total_hours' => [
                'required',
                'integer',
                'min:1',
                'max:1000',
            ],
        ];
    }

    private function isQueuePayload(Request $request): bool
    {
        return is_array($request->input('subjects'));
    }

    /**
     * @param array<int, array{subject_name: string, subject_code: string, total_hours: int|string}> $subjects
     * @return Collection<int, array{subject_name: string, subject_code: string, total_hours: int, semester: string, grade_level: string}>
     */
    private function normalizeQueueSubjects(array $subjects, string $semester, string $gradeLevel): Collection
    {
        return collect($subjects)
            ->map(function (array $subject) use ($semester, $gradeLevel): array {
                return [
                    'subject_name' => $this->normalizeText($subject['subject_name']),
                    'subject_code' => strtoupper($this->normalizeText($subject['subject_code'])),
                    'total_hours' => (int) $subject['total_hours'],
                    'semester' => $semester,
                    'grade_level' => $gradeLevel,
                ];
            });
    }

    private function resolveSubjectTypeId(string $typeKey): int
    {
        $subjectTypeId = SubjectType::query()
            ->where('type_key', $typeKey)
            ->value('id');

        if ($subjectTypeId === null) {
            throw ValidationException::withMessages([
                'type_key' => 'Invalid subject type selected.',
            ]);
        }

        return (int) $subjectTypeId;
    }

    private function resolveTypeFilter(mixed $filter): string
    {
        $value = is_string($filter) ? trim($filter) : '';

        $allowed = array_merge(['all'], SubjectType::priorityOrder());

        if (!in_array($value, $allowed, true)) {
            return 'all';
        }

        return $value;
    }

    private function resolveSemesterFilter(mixed $filter): string
    {
        $value = is_string($filter) ? trim($filter) : '';

        if ($value === '' || strtolower($value) === 'all') {
            return 'all';
        }

        if (!in_array($value, self::SEMESTER_OPTIONS, true)) {
            return 'all';
        }

        return $value;
    }

    private function resolveGradeLevelFilter(mixed $filter): string
    {
        $value = is_string($filter) ? trim($filter) : '';

        if ($value === '' || strtolower($value) === 'all') {
            return 'all';
        }

        if (!in_array($value, self::GRADE_LEVEL_OPTIONS, true)) {
            return 'all';
        }

        return $value;
    }

    /**
     * @return array<int, array{key: string, label: string}>
     */
    private function subjectTypeOptions(): array
    {
        $subjectTypes = SubjectType::query()
            ->get(['type_key', 'name'])
            ->keyBy('type_key');

        return collect(SubjectType::priorityOrder())
            ->map(function (string $typeKey) use ($subjectTypes): ?array {
                $subjectType = $subjectTypes->get($typeKey);

                if ($subjectType === null) {
                    return null;
                }

                return [
                    'key' => $typeKey,
                    'label' => $subjectType->name,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Normalize whitespace in plain text inputs.
     */
    private function normalizeText(string $value): string
    {
        return preg_replace('/\s+/', ' ', trim($value)) ?? trim($value);
    }

    private function currentSchoolYear(): string
    {
        return trim((string) SystemSetting::getCurrentSchoolYear());
    }

    private function currentSemester(): string
    {
        return trim((string) SystemSetting::getCurrentSemester());
    }

    private function semesterLabel(string $semester): string
    {
        return $semester === '2' ? '2nd Semester' : '1st Semester';
    }
}

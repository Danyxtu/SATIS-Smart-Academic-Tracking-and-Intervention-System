<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Department;
use App\Models\Grade;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentNotification;
use App\Models\Subject;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\EnrollmentGradeService;
use App\Services\GradeCalculationService;
use App\Support\Concerns\HasDefaultAssignments;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

use App\Services\Teacher\ClassesServices;

class ClassController extends Controller
{
    use HasDefaultAssignments;

    protected $ClassesServices;
    protected GradeCalculationService $gradeCalculationService;
    protected EnrollmentGradeService $enrollmentGradeService;

    public function __construct(
        ClassesServices $myClassesServices,
        GradeCalculationService $gradeCalculationService,
        EnrollmentGradeService $enrollmentGradeService,
    ) {
        $this->ClassesServices = $myClassesServices;
        $this->gradeCalculationService = $gradeCalculationService;
        $this->enrollmentGradeService = $enrollmentGradeService;
    }

    private const COLOR_OPTIONS = ['indigo', 'blue', 'red', 'green', 'amber', 'purple', 'teal'];
    private const REQUIRED_ROW_FIELDS = ['student_name', 'lrn', 'grade_level'];
    private const COLUMN_ALIASES = [
        'student_name' => [
            'name',
            'student_name',
            'student name',
            'full_name',
            'full name',
            'learner_name',
            'learner name',
            'pupil_name',
            'pupil name',
        ],
        'first_name' => [
            'first_name',
            'first name',
            'firstname',
            'given_name',
            'given name',
            'fname',
            'f_name',
        ],
        'last_name' => [
            'last_name',
            'last name',
            'lastname',
            'family_name',
            'family name',
            'surname',
            'lname',
            'l_name',
        ],
        'middle_name' => [
            'middle_name',
            'middle name',
            'middlename',
            'mname',
            'm_name',
        ],
        'lrn' => ['lrn', 'student_lrn', 'student lrn', 'learner_reference_number', 'learner reference number'],
        'grade_level' => ['grade_level', 'grade level', 'grade', 'year_level', 'year level'],
        'section' => ['section', 'class_section', 'class section'],
        'strand' => ['strand', 'track_strand', 'track strand'],
        'track' => ['track', 'tvl_track', 'tvl track', 'program', 'specialization'],
        'personal_email' => ['personal_email', 'personal email', 'email', 'student_email', 'student email', 'email_address', 'email address'],
    ];


    public function goToMyClasses(Request $request): Response
    {
        $classesData = $this->ClassesServices->getClassesData($request);
        $departments = Department::query()
            ->where('is_active', true)
            ->orderBy('department_code')
            ->get(['department_name', 'department_code']);
        $availableSubjects = Subject::query()
            ->orderBy('subject_name')
            ->get(['id', 'subject_name', 'subject_code'])
            ->map(fn(Subject $subject) => [
                'id' => (int) $subject->id,
                'subject_name' => $subject->subject_name,
                'subject_code' => $subject->subject_code,
            ])
            ->values();
        $sectionsCohort = $this->cohortFromSchoolYear($classesData['defaultSchoolYear']);
        $availableSections = Section::query()
            ->with('department:id,department_code,department_name')
            ->where('is_active', true)
            ->where('cohort', $sectionsCohort)
            ->orderBy('section_name')
            ->get([
                'id',
                'department_id',
                'section_name',
                'section_code',
                'grade_level',
                'strand',
                'track',
                'cohort',
            ])
            ->map(fn(Section $section) => [
                'id' => (int) $section->id,
                'section_name' => $section->section_name,
                'section_code' => $section->section_code,
                'grade_level' => $section->grade_level,
                'strand' => $section->strand,
                'track' => $section->track,
                'department_code' => $section->department?->department_code,
                'department_name' => $section->department?->department_name,
            ])
            ->values();

        $classes = $classesData['classes'];
        $defaultSchoolYear = $classesData['defaultSchoolYear'];
        $currentSemester = $classesData['currentSemester'];
        $selectedSemester = $classesData['selectedSemester'];
        $semester1Count = $classesData['semester1Count'];
        $semester2Count = $classesData['semester2Count'];
        $roster = $classesData['roster'];

        return Inertia::render('Teacher/MyClasses', compact(
            'classes',
            'defaultSchoolYear',
            'currentSemester',
            'selectedSemester',
            'semester1Count',
            'semester2Count',
            'roster',
            'departments',
            'availableSubjects',
            'availableSections',
        ));
    }

    public function archiveSummary(Request $request): JsonResponse
    {
        $teacherId = $request->user()->id;
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        $archivedClasses = SchoolClass::query()
            ->withCount('enrollments')
            ->where('teacher_id', $teacherId)
            ->where('school_year', '!=', $currentSchoolYear)
            ->get(['id', 'subject_id', 'school_year', 'semester', 'updated_at']);

        $archives = $archivedClasses
            ->groupBy('school_year')
            ->map(function ($classes, $schoolYear) {
                $latestClass = $classes->sortByDesc('updated_at')->first();

                return [
                    'school_year' => $schoolYear,
                    'classes_count' => $classes->count(),
                    'subjects_count' => $classes->pluck('subject_id')->unique()->count(),
                    'students_count' => (int) $classes->sum('enrollments_count'),
                    'semester1_count' => $classes->where('semester', '1')->count(),
                    'semester2_count' => $classes->where('semester', '2')->count(),
                    'last_updated_at' => $latestClass?->updated_at?->toISOString(),
                ];
            })
            ->sortByDesc('school_year')
            ->values();

        return response()->json([
            'current_school_year' => $currentSchoolYear,
            'archives' => $archives,
        ]);
    }

    public function archiveShow(Request $request, string $schoolYear): JsonResponse
    {
        if (!preg_match('/^\d{4}-\d{4}$/', $schoolYear)) {
            return response()->json([
                'message' => 'Invalid school year format.',
            ], 422);
        }

        $selectedSemester = (string) $request->query('semester', '1');

        if (!in_array($selectedSemester, ['1', '2'], true)) {
            $selectedSemester = '1';
        }

        $teacherId = $request->user()->id;

        $archivedClasses = SchoolClass::query()
            ->with([
                'subject',
                'enrollments.user.student',
            ])
            ->withCount('enrollments')
            ->where('teacher_id', $teacherId)
            ->where('school_year', $schoolYear)
            ->orderBy('grade_level')
            ->get();

        if ($archivedClasses->isEmpty()) {
            return response()->json([
                'message' => 'Archive school year not found.',
            ], 404);
        }

        $summary = [
            'school_year' => $schoolYear,
            'classes_count' => $archivedClasses->count(),
            'subjects_count' => $archivedClasses->pluck('subject_id')->unique()->count(),
            'students_count' => (int) $archivedClasses->sum('enrollments_count'),
            'semester1_count' => $archivedClasses->where('semester', '1')->count(),
            'semester2_count' => $archivedClasses->where('semester', '2')->count(),
            'last_updated_at' => $archivedClasses
                ->sortByDesc('updated_at')
                ->first()?->updated_at?->toISOString(),
        ];

        $classes = $archivedClasses
            ->filter(fn($subjectTeacher) => (string) $subjectTeacher->semester === $selectedSemester)
            ->values()
            ->map(fn($subjectTeacher) => [
                'id' => $subjectTeacher->id,
                'name' => $subjectTeacher->grade_level,
                'section' => $subjectTeacher->section,
                'subject' => $subjectTeacher->subject?->subject_name ?? 'N/A',
                'subject_name' => $subjectTeacher->subject?->subject_name ?? 'N/A',
                'color' => $subjectTeacher->color,
                'strand' => $subjectTeacher->strand,
                'track' => $subjectTeacher->track,
                'school_year' => $subjectTeacher->school_year,
                'student_count' => $subjectTeacher->enrollments_count,
                'current_quarter' => $subjectTeacher->current_quarter ?? 1,
                'semester' => $subjectTeacher->semester,
            ]);

        return response()->json([
            'school_year' => $schoolYear,
            'selected_semester' => (int) $selectedSemester,
            'semester1_count' => $summary['semester1_count'],
            'semester2_count' => $summary['semester2_count'],
            'summary' => $summary,
            'classes' => $classes,
        ]);
    }

    public function useArchivedClasses(Request $request): JsonResponse
    {
        $teacherId = (int) $request->user()->id;
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();
        $currentSemester = (string) SystemSetting::getCurrentSemester();

        $validator = Validator::make($request->all(), [
            'school_year' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'semester' => ['required', Rule::in(['1', '2'])],
            'class_ids' => ['required', 'array', 'min:1'],
            'class_ids.*' => ['integer'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid archived class selection.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $sourceSchoolYear = (string) $data['school_year'];
        $targetSemester = (string) $data['semester'];

        if ($sourceSchoolYear === $currentSchoolYear) {
            return response()->json([
                'message' => 'Only archived school years can be reused.',
            ], 422);
        }

        if ($targetSemester === '2' && $currentSemester !== '2') {
            return response()->json([
                'message' => 'Second semester should start to proceed with this operation.',
            ], 422);
        }

        $requestedClassIds = collect($data['class_ids'])
            ->map(fn($id) => (int) $id)
            ->filter(fn($id) => $id > 0)
            ->unique()
            ->values();

        if ($requestedClassIds->isEmpty()) {
            return response()->json([
                'message' => 'Select at least one archived class to continue.',
            ], 422);
        }

        $archivedClasses = SchoolClass::query()
            ->with('subject:id,subject_name')
            ->where('teacher_id', $teacherId)
            ->where('school_year', $sourceSchoolYear)
            ->where('semester', $targetSemester)
            ->whereIn('id', $requestedClassIds)
            ->get([
                'id',
                'subject_id',
                'section_id',
                'grade_level',
                'section',
                'color',
                'strand',
                'track',
                'grade_categories',
                'semester',
            ]);

        if ($archivedClasses->isEmpty()) {
            return response()->json([
                'message' => 'No matching archived classes were found.',
            ], 404);
        }

        $foundClassIds = $archivedClasses
            ->pluck('id')
            ->map(fn($id) => (int) $id);

        $skippedMissingIds = $requestedClassIds
            ->diff($foundClassIds)
            ->values()
            ->all();

        $existingSignatures = SchoolClass::query()
            ->where('teacher_id', $teacherId)
            ->where('school_year', $currentSchoolYear)
            ->where('semester', $targetSemester)
            ->get(['subject_id', 'grade_level', 'section'])
            ->mapWithKeys(fn($class) => [
                $this->buildClassReuseSignature(
                    (int) $class->subject_id,
                    (string) $class->grade_level,
                    (string) $class->section,
                ) => true,
            ])
            ->all();

        $createdClasses = [];
        $skippedDuplicates = [];

        DB::transaction(function () use (
            $archivedClasses,
            $teacherId,
            $currentSchoolYear,
            $targetSemester,
            &$existingSignatures,
            &$createdClasses,
            &$skippedDuplicates,
        ) {
            foreach ($archivedClasses as $archivedClass) {
                $signature = $this->buildClassReuseSignature(
                    (int) $archivedClass->subject_id,
                    (string) $archivedClass->grade_level,
                    (string) $archivedClass->section,
                );

                if (isset($existingSignatures[$signature])) {
                    $skippedDuplicates[] = [
                        'source_id' => (int) $archivedClass->id,
                        'subject' => $archivedClass->subject?->subject_name ?? 'N/A',
                        'grade_level' => $archivedClass->grade_level,
                        'section' => $archivedClass->section,
                        'reason' => 'Class already exists in the active school year.',
                    ];

                    continue;
                }

                $resolvedSectionId = $archivedClass->section_id
                    ? (int) $archivedClass->section_id
                    : $this->resolveSectionRecordId(
                        $teacherId,
                        $currentSchoolYear,
                        (string) $archivedClass->section,
                        (string) $archivedClass->grade_level,
                        $archivedClass->strand,
                        $archivedClass->track,
                    );

                $newClass = SchoolClass::create([
                    'subject_id' => $archivedClass->subject_id,
                    'section_id' => $resolvedSectionId,
                    'teacher_id' => $teacherId,
                    'grade_level' => $archivedClass->grade_level,
                    'section' => $archivedClass->section,
                    'color' => $archivedClass->color ?: 'indigo',
                    'strand' => $archivedClass->strand,
                    'track' => $archivedClass->track,
                    'school_year' => $currentSchoolYear,
                    'current_quarter' => 1,
                    'grade_categories' => $archivedClass->grade_categories ?: $this->defaultGradeCategories(),
                    'semester' => $targetSemester,
                ]);

                $createdClasses[] = [
                    'id' => (int) $newClass->id,
                    'source_id' => (int) $archivedClass->id,
                    'subject' => $archivedClass->subject?->subject_name ?? 'N/A',
                    'grade_level' => $newClass->grade_level,
                    'section' => $newClass->section,
                    'semester' => $newClass->semester,
                ];

                $existingSignatures[$signature] = true;
            }
        });

        return response()->json([
            'message' => count($createdClasses) > 0
                ? 'Archived classes added successfully.'
                : 'No archived classes were added.',
            'summary' => [
                'source_school_year' => $sourceSchoolYear,
                'target_school_year' => $currentSchoolYear,
                'semester' => (int) $targetSemester,
                'requested_count' => $requestedClassIds->count(),
                'found_count' => $archivedClasses->count(),
                'created_count' => count($createdClasses),
                'skipped_duplicate_count' => count($skippedDuplicates),
                'skipped_missing_count' => count($skippedMissingIds),
                'created_classes' => $createdClasses,
                'skipped_duplicates' => $skippedDuplicates,
                'skipped_missing_ids' => $skippedMissingIds,
            ],
        ]);
    }

    public function createAClass(Request $request): RedirectResponse
    {
        $teacher = $request->user();

        // Get current semester from system settings
        $currentSemester = SystemSetting::getCurrentSemester();
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        $sanitizedManualStudents = collect($request->input('manual_students', []))
            ->filter(fn($student) => is_array($student))
            ->map(function (array $student) {
                return [
                    'student_name' => preg_replace('/\s+/', ' ', trim((string) ($student['student_name'] ?? ''))),
                    'lrn' => $this->sanitizeLrn($student['lrn'] ?? null),
                    'personal_email' => isset($student['personal_email']) && trim((string) $student['personal_email']) !== ''
                        ? Str::lower(trim((string) $student['personal_email']))
                        : null,
                ];
            })
            ->values()
            ->all();

        $request->merge([
            'manual_students' => $sanitizedManualStudents,
        ]);

        $data = $request->validate([
            'grade_level' => 'required|string|max:255',
            'section' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z]+$/'],
            'subject_name' => 'required|string|max:255',
            'color' => 'required|string|in:' . implode(',', self::COLOR_OPTIONS),
            'school_year' => ['required', 'string', 'max:255', Rule::in([$currentSchoolYear])],
            'strand' => ['required', 'string', Rule::exists('departments', 'department_code')],
            'track' => 'nullable|string|max:255',
            'classlist' => 'nullable|file|mimes:csv,txt,xls,xlsx|max:4096',
            'manual_students' => 'nullable|array',
            'manual_students.*' => 'array',
        ]);

        $sectionSuffix = strtoupper(trim($data['section']));
        $normalizedStrand = strtoupper(trim($data['strand']));
        $sectionCombined = $normalizedStrand . '-' . $sectionSuffix;

        $sectionId = $this->resolveSectionRecordId(
            (int) $teacher->id,
            $currentSchoolYear,
            $sectionCombined,
            (string) $data['grade_level'],
            $normalizedStrand,
            $data['track'] ?? null,
        );

        $duplicateSectionCount = SchoolClass::query()
            ->where('teacher_id', $teacher->id)
            ->where('grade_level', $data['grade_level'])
            ->where('section', $sectionCombined)
            ->count();

        // First, find or create the subject
        $subjectCode = Str::slug($data['subject_name'], '_') . '_' . Str::random(6);
        $subject = Subject::firstOrCreate(
            ['subject_name' => $data['subject_name']],
            ['subject_code' => $subjectCode]
        );

        // Create the SubjectTeacher (teacher's class assignment)
        $subjectTeacher = SchoolClass::create([
            'subject_id' => $subject->id,
            'section_id' => $sectionId,
            'teacher_id' => $teacher->id,
            'grade_level' => $data['grade_level'],
            'section' => $sectionCombined,
            'strand' => $normalizedStrand,
            'track' => $data['track'] ?? null,
            'color' => $data['color'],
            'school_year' => $currentSchoolYear,
            'semester' => (string) $currentSemester,
            'grade_categories' => $this->defaultGradeCategories(),
        ]);

        $summary = null;

        if ($request->hasFile('classlist')) {
            try {
                $summary = $this->importClasslist($subjectTeacher, $request->file('classlist'));
            } catch (RuntimeException $exception) {
                $subjectTeacher->delete();

                return back()
                    ->withErrors(['classlist' => $exception->getMessage()])
                    ->withInput();
            }
        }

        if (! empty($data['manual_students'])) {
            $manualSummary = $this->importManualStudents($subjectTeacher, $data['manual_students']);
            $summary = $this->mergeImportSummaries($summary, $manualSummary);
        }

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', 'Class created successfully.')
            ->with('class_create_summary', [
                'class_id' => $subjectTeacher->id,
                'grade_level' => $data['grade_level'],
                'strand' => strtoupper(trim($data['strand'])),
                'section_suffix' => $sectionSuffix,
                'section' => $sectionCombined,
                'subject_name' => $data['subject_name'],
                'color' => $data['color'],
                'track' => $data['track'] ?? null,
                'school_year' => $currentSchoolYear,
                'semester' => (string) $currentSemester,
                'duplicate_basis' => 'grade_section',
                'duplicate_section' => $duplicateSectionCount > 0,
                'duplicate_count' => $duplicateSectionCount,
            ])
            ->with('import_summary', $summary);
    }

    public function updateClass(Request $request, SchoolClass $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        $data = $request->validate([
            'grade_level' => 'required|string|max:255',
            'section' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z]+$/'],
            'subject_name' => 'required|string|max:255',
            'color' => 'required|string|in:' . implode(',', self::COLOR_OPTIONS),
            'school_year' => ['required', 'string', 'max:255', Rule::in([$currentSchoolYear])],
            'strand' => ['required', 'string', Rule::exists('departments', 'department_code')],
            'track' => 'nullable|string|max:255',
        ]);

        $sectionSuffix = strtoupper(trim($data['section']));
        $normalizedStrand = strtoupper(trim($data['strand']));
        $sectionCombined = $normalizedStrand . '-' . $sectionSuffix;

        $sectionId = $this->resolveSectionRecordId(
            (int) $request->user()->id,
            $currentSchoolYear,
            $sectionCombined,
            (string) $data['grade_level'],
            $normalizedStrand,
            $data['track'] ?? null,
        );

        $subjectCode = Str::slug($data['subject_name'], '_') . '_' . Str::random(6);
        $subject = Subject::firstOrCreate(
            ['subject_name' => $data['subject_name']],
            ['subject_code' => $subjectCode]
        );

        $subjectTeacher->update([
            'subject_id' => $subject->id,
            'section_id' => $sectionId,
            'grade_level' => $data['grade_level'],
            'section' => $sectionCombined,
            'strand' => $normalizedStrand,
            'track' => $data['track'] ?? null,
            'color' => $data['color'],
            'school_year' => $currentSchoolYear,
        ]);

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', 'Class updated successfully.');
    }

    public function destroyClass(Request $request, SchoolClass $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $request->validate([
            'password' => 'required|string',
        ]);

        if (!Hash::check($request->password, $request->user()->password)) {
            return back()->withErrors([
                'password' => 'The provided password is incorrect.',
            ]);
        }

        $subjectTeacher->delete();

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', 'Class deleted successfully.');
    }

    public function enrollStudent(Request $request, SchoolClass $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $normalizedLrn = $this->sanitizeLrn($request->input('lrn'));
        $request->merge([
            'lrn' => $normalizedLrn,
            'personal_email' => $request->input('personal_email', $request->input('email')),
        ]);

        $data = $request->validate([
            'student_name' => ['required', 'string', 'max:255', 'not_regex:/\d/'],
            'lrn' => [
                'required',
                'string',
                'digits:12',
                'not_in:000000000000',
                Rule::unique('students', 'lrn'),
            ],
            'personal_email' => 'nullable|email|max:255',
        ], [
            'student_name.not_regex' => 'Student name cannot contain numbers.',
            'lrn.digits' => 'LRN must be exactly 12 digits.',
            'lrn.not_in' => 'LRN cannot be 000000000000.',
            'lrn.unique' => 'This LRN is already registered and cannot be added again.',
        ]);

        // Normalize the student name (remove extra spaces)
        $studentName = preg_replace('/\s+/', ' ', trim($data['student_name']));

        $result = $this->persistStudentRecord($subjectTeacher, [
            'student_name' => $studentName,
            'grade_level' => $subjectTeacher->grade_level,
            'section' => $subjectTeacher->section,
            'strand' => $subjectTeacher->strand,
            'track' => $subjectTeacher->track,
            'lrn' => $data['lrn'],
            'personal_email' => $data['personal_email'] ?? null,
        ]);

        $statusMessage = match ($result['status']) {
            'created' => 'Student account created and assigned to class.',
            'assigned_existing' => 'Existing student assigned to class.',
            'already_assigned' => 'Student already exists and is already assigned to this class.',
            default => 'Student added to class.',
        };

        // Prepare flash with generated password if a new account was created
        $redirect = redirect()->route('teacher.classes.index')->with('success', $statusMessage);

        if (is_array($result) && ! empty($result['password'])) {
            $redirect = $redirect->with('new_student_password', [
                'name' => $studentName,
                'lrn' => $data['lrn'],
                'username' => $result['username'] ?? null,
                'personal_email' => $result['personal_email'] ?? null,
                'password' => $result['password'],
            ]);
        }

        return $redirect;
    }

    public function uploadClasslist(Request $request, SchoolClass $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $request->validate([
            'classlist' => 'required|file|mimes:csv,txt,xls,xlsx|max:4096',
        ]);

        try {
            $summary = $this->importClasslist($subjectTeacher, $request->file('classlist'));
        } catch (RuntimeException $exception) {
            return back()->withErrors(['classlist' => $exception->getMessage()]);
        }

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', 'Classlist uploaded successfully.')
            ->with('import_summary', $summary);
    }

    public function updateGradeStructure(Request $request, SchoolClass $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $data = $request->validate([
            'quarter' => 'nullable|integer|min:1|max:2',
            'categories' => 'required|array|min:1',
            'categories.*.id' => 'nullable|string|max:255',
            'categories.*.label' => 'required|string|max:255',
            'categories.*.weight' => 'nullable',
            'categories.*.tasks' => 'array',
            'categories.*.tasks.*.id' => 'nullable|string|max:255',
            'categories.*.tasks.*.label' => 'required|string|max:255',
            'categories.*.tasks.*.total' => 'required|numeric|min:1',
            'delete_task_grades' => 'sometimes|boolean',
            'deleted_task_ids' => 'sometimes|array',
            'deleted_task_ids.*' => 'string|max:255',
        ]);

        $quarter = $data['quarter'] ?? ($subjectTeacher->current_quarter ?? 1);
        $structure = $this->buildGradeStructure($data['categories']);

        // Merge into the per-quarter map
        $perQuarter = $this->buildPerQuarterCategories(
            $subjectTeacher->grade_categories,
            $quarter,
            $structure['categories'],
        );

        $shouldDeleteTaskGrades = (bool) ($data['delete_task_grades'] ?? false);
        $deletedTaskIds = collect($data['deleted_task_ids'] ?? [])
            ->filter(fn($taskId) => is_string($taskId) && trim($taskId) !== '')
            ->map(fn($taskId) => trim($taskId))
            ->unique()
            ->values();

        DB::transaction(function () use ($subjectTeacher, $perQuarter, $quarter, $shouldDeleteTaskGrades, $deletedTaskIds) {
            $subjectTeacher->update([
                'grade_categories' => $perQuarter,
            ]);

            if (! $shouldDeleteTaskGrades || $deletedTaskIds->isEmpty()) {
                return;
            }

            $enrollmentIds = $subjectTeacher->enrollments()->pluck('id');

            if ($enrollmentIds->isEmpty()) {
                return;
            }

            Grade::whereIn('enrollment_id', $enrollmentIds)
                ->where('quarter', $quarter)
                ->whereIn('assignment_key', $deletedTaskIds)
                ->delete();
        });

        return back()->with('success', 'Grade structure updated.');
    }

    private function importClasslist(SchoolClass $subjectTeacher, UploadedFile $file): array
    {
        $rows = $this->readSpreadsheetRows($file);

        if (count($rows) === 0) {
            throw new RuntimeException('The uploaded classlist file is empty.');
        }

        $headerRow = array_shift($rows);
        $columnMap = $this->buildColumnMap($headerRow);

        $missingColumns = array_diff(self::REQUIRED_ROW_FIELDS, array_keys($columnMap));
        if (! empty($missingColumns)) {
            throw new RuntimeException('Missing required columns: ' . implode(', ', $missingColumns));
        }

        $summary = [
            'newly_created' => 0,
            'assigned_existing' => 0,
            'already_enrolled' => 0,
            'skipped' => 0,
            'errors' => [],
            'newly_created_students' => [],
            'assigned_existing_students' => [],
            'already_enrolled_students' => [],
        ];

        $seenLrns = [];

        foreach ($rows as $index => $row) {
            if ($this->rowIsEmpty($row)) {
                continue;
            }

            $rowNumber = $index + 2; // account for header
            $payload = $this->buildPayloadFromRow($row, $columnMap);
            $payload['section'] = $payload['section'] ?? $subjectTeacher->section;
            $payload['strand'] = $payload['strand'] ?? $subjectTeacher->strand;
            $payload['track'] = $payload['track'] ?? $subjectTeacher->track;

            if (! empty($payload['lrn'])) {
                if (isset($seenLrns[$payload['lrn']])) {
                    $summary['skipped']++;
                    $summary['errors'][] = "Row {$rowNumber}: Duplicate LRN {$payload['lrn']} detected in this upload.";
                    continue;
                }

                $seenLrns[$payload['lrn']] = true;
            }

            try {
                $result = $this->persistStudentRecord($subjectTeacher, $payload);

                if ($result['status'] === 'created') {
                    $summary['newly_created']++;
                    $summary['newly_created_students'][] = [
                        'name' => $payload['student_name'] ?? null,
                        'lrn' => $payload['lrn'] ?? null,
                        'username' => $result['username'] ?? null,
                        'personal_email' => $result['personal_email'] ?? null,
                        'password' => $result['password'],
                    ];
                } elseif ($result['status'] === 'assigned_existing') {
                    $summary['assigned_existing']++;
                    $summary['assigned_existing_students'][] = [
                        'name' => $payload['student_name'] ?? null,
                        'lrn' => $payload['lrn'] ?? null,
                        'username' => $result['username'] ?? null,
                        'personal_email' => $result['personal_email'] ?? null,
                    ];
                } elseif ($result['status'] === 'already_assigned') {
                    $summary['already_enrolled']++;
                    $summary['already_enrolled_students'][] = [
                        'name' => $payload['student_name'] ?? null,
                        'lrn' => $payload['lrn'] ?? null,
                        'username' => $result['username'] ?? null,
                        'personal_email' => $result['personal_email'] ?? null,
                    ];
                }
            } catch (ValidationException $exception) {
                $summary['skipped']++;
                $summary['errors'][] = "Row {$rowNumber}: " . $this->flattenValidationErrors($exception);
            } catch (RuntimeException $exception) {
                $summary['skipped']++;
                $summary['errors'][] = "Row {$rowNumber}: {$exception->getMessage()}";
            }
        }

        // Legacy keys kept for compatibility with existing flash consumers.
        $summary['imported'] = $summary['newly_created'];
        $summary['updated'] = $summary['assigned_existing'] + $summary['already_enrolled'];
        $summary['created_students'] = $summary['newly_created_students'];

        return $summary;
    }

    private function importManualStudents(SchoolClass $subjectTeacher, array $manualStudents): array
    {
        $summary = [
            'newly_created' => 0,
            'assigned_existing' => 0,
            'already_enrolled' => 0,
            'skipped' => 0,
            'errors' => [],
            'newly_created_students' => [],
            'assigned_existing_students' => [],
            'already_enrolled_students' => [],
        ];

        $seenLrns = [];

        foreach ($manualStudents as $index => $manualStudent) {
            $rowNumber = $index + 1;

            $payload = [
                'student_name' => preg_replace('/\s+/', ' ', trim((string) ($manualStudent['student_name'] ?? ''))),
                'lrn' => $this->sanitizeLrn($manualStudent['lrn'] ?? null),
                'personal_email' => $manualStudent['personal_email'] ?? null,
                'grade_level' => $subjectTeacher->grade_level,
                'section' => $subjectTeacher->section,
                'strand' => $subjectTeacher->strand,
                'track' => $subjectTeacher->track,
            ];

            if (empty($payload['student_name']) || empty($payload['lrn'])) {
                $summary['skipped']++;
                $summary['errors'][] = "Student #{$rowNumber}: Missing required student name or LRN.";
                continue;
            }

            if (isset($seenLrns[$payload['lrn']])) {
                $summary['skipped']++;
                $summary['errors'][] = "Student #{$rowNumber}: Duplicate LRN {$payload['lrn']} detected in this queue.";
                continue;
            }

            $seenLrns[$payload['lrn']] = true;

            try {
                $result = $this->persistStudentRecord($subjectTeacher, $payload);

                if ($result['status'] === 'created') {
                    $summary['newly_created']++;
                    $summary['newly_created_students'][] = [
                        'name' => $payload['student_name'] ?? null,
                        'lrn' => $payload['lrn'] ?? null,
                        'username' => $result['username'] ?? null,
                        'personal_email' => $result['personal_email'] ?? null,
                        'password' => $result['password'],
                    ];
                } elseif ($result['status'] === 'assigned_existing') {
                    $summary['assigned_existing']++;
                    $summary['assigned_existing_students'][] = [
                        'name' => $payload['student_name'] ?? null,
                        'lrn' => $payload['lrn'] ?? null,
                        'username' => $result['username'] ?? null,
                        'personal_email' => $result['personal_email'] ?? null,
                    ];
                } elseif ($result['status'] === 'already_assigned') {
                    $summary['already_enrolled']++;
                    $summary['already_enrolled_students'][] = [
                        'name' => $payload['student_name'] ?? null,
                        'lrn' => $payload['lrn'] ?? null,
                        'username' => $result['username'] ?? null,
                        'personal_email' => $result['personal_email'] ?? null,
                    ];
                }
            } catch (ValidationException $exception) {
                $summary['skipped']++;
                $summary['errors'][] = "Student #{$rowNumber}: " . $this->flattenValidationErrors($exception);
            } catch (RuntimeException $exception) {
                $summary['skipped']++;
                $summary['errors'][] = "Student #{$rowNumber}: {$exception->getMessage()}";
            }
        }

        $summary['imported'] = $summary['newly_created'];
        $summary['updated'] = $summary['assigned_existing'] + $summary['already_enrolled'];
        $summary['created_students'] = $summary['newly_created_students'];

        return $summary;
    }

    private function mergeImportSummaries(?array $baseSummary, ?array $incomingSummary): ?array
    {
        if ($baseSummary === null) {
            return $incomingSummary;
        }

        if ($incomingSummary === null) {
            return $baseSummary;
        }

        $merged = [
            'newly_created' => (int) ($baseSummary['newly_created'] ?? $baseSummary['imported'] ?? 0)
                + (int) ($incomingSummary['newly_created'] ?? $incomingSummary['imported'] ?? 0),
            'assigned_existing' => (int) ($baseSummary['assigned_existing'] ?? 0)
                + (int) ($incomingSummary['assigned_existing'] ?? 0),
            'already_enrolled' => (int) ($baseSummary['already_enrolled'] ?? 0)
                + (int) ($incomingSummary['already_enrolled'] ?? 0),
            'skipped' => (int) ($baseSummary['skipped'] ?? 0)
                + (int) ($incomingSummary['skipped'] ?? 0),
            'errors' => array_values(array_merge(
                $baseSummary['errors'] ?? [],
                $incomingSummary['errors'] ?? [],
            )),
            'newly_created_students' => array_values(array_merge(
                $baseSummary['newly_created_students'] ?? $baseSummary['created_students'] ?? [],
                $incomingSummary['newly_created_students'] ?? $incomingSummary['created_students'] ?? [],
            )),
            'assigned_existing_students' => array_values(array_merge(
                $baseSummary['assigned_existing_students'] ?? [],
                $incomingSummary['assigned_existing_students'] ?? [],
            )),
            'already_enrolled_students' => array_values(array_merge(
                $baseSummary['already_enrolled_students'] ?? [],
                $incomingSummary['already_enrolled_students'] ?? [],
            )),
        ];

        $merged['imported'] = $merged['newly_created'];
        $merged['updated'] = $merged['assigned_existing'] + $merged['already_enrolled'];
        $merged['created_students'] = $merged['newly_created_students'];

        return $merged;
    }

    private function persistStudentRecord(SchoolClass $subjectTeacher, array $payload): array
    {
        if (! array_key_exists('personal_email', $payload) && array_key_exists('email', $payload)) {
            $payload['personal_email'] = $payload['email'];
        }

        $validator = Validator::make($payload, [
            'student_name' => ['required', 'string', 'max:255', 'not_regex:/\d/'],
            'lrn' => ['required', 'string', 'digits:12', 'not_in:000000000000'],
            'grade_level' => 'required|string|max:255',
            'section' => 'nullable|string|max:255',
            'strand' => 'nullable|string|max:255',
            'track' => 'nullable|string|max:255',
            'personal_email' => 'nullable|email|max:255',
        ], [
            'student_name.not_regex' => 'Student name cannot contain numbers.',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $lrn = $this->sanitizeLrn($payload['lrn']);
        $studentName = trim($payload['student_name']);

        // Extract first/last name for user creation (User table may have separate fields)
        $firstName = $payload['first_name'] ?? null;
        $lastName = $payload['last_name'] ?? null;
        $middleName = $payload['middle_name'] ?? null;

        if (!$firstName || !$lastName) {
            [$firstName, $lastName] = $this->splitName($studentName);
        }

        $student = null;
        $generatedPlainPassword = null;

        if ($lrn) {
            $student = Student::where('lrn', $lrn)->first();
        }

        $normalizedPersonalEmail = ! empty($payload['personal_email'])
            ? Str::lower(trim((string) $payload['personal_email']))
            : null;

        if ($normalizedPersonalEmail !== null) {
            $emailOwner = User::where('personal_email', $normalizedPersonalEmail)->first();

            if ($emailOwner && (! $student || $emailOwner->id !== $student->user_id)) {
                throw new RuntimeException('Personal email is already assigned to another account.');
            }
        }

        if ($student) {
            $user = $student->user;

            if (!$user) {
                $created = $this->createStudentUser($firstName, $lastName, $middleName, $normalizedPersonalEmail, $lrn);
                $user = $created['user'];
                $generatedPlainPassword = $created['password'];
                $student->user()->associate($user);
            } else {
                $user->fill([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => $middleName,
                ]);

                if (! filled($user->username)) {
                    $user->username = $this->generateStudentUsername($firstName, $lastName, $lrn);
                }

                if ($normalizedPersonalEmail !== null) {
                    $user->personal_email = $normalizedPersonalEmail;
                }

                $user->save();
            }
        } else {
            $created = $this->createStudentUser($firstName, $lastName, $middleName, $normalizedPersonalEmail, $lrn);
            $user = $created['user'];
            $generatedPlainPassword = $created['password'];
            $student = Student::firstOrNew(['user_id' => $user->id]);
        }

        if (!$student->user_id) {
            $student->user_id = $user->id;
        }

        $studentExistedBeforeSave = $student->exists;

        // Update student record - use student_name (single field)
        $student->student_name = $studentName;
        if (! filled($student->subject)) {
            $student->subject = $subjectTeacher->subject?->subject_name ?? 'N/A';
        }
        $student->grade = $student->grade ?? 75;
        $student->trend = $student->trend ?? 'Stable';
        $student->avatar = $student->avatar ?? $this->avatarFor($studentName);
        $student->lrn = $lrn;
        $student->grade_level = $student->grade_level ?: ($payload['grade_level'] ?? $subjectTeacher->grade_level);
        $student->section = $student->section ?: ($payload['section'] ?? $subjectTeacher->section);
        $student->strand = $student->strand ?: ($payload['strand'] ?? $subjectTeacher->strand ?? 'N/A');
        $student->track = $student->track ?: ($payload['track'] ?? $subjectTeacher->track ?? 'N/A');

        if (empty($student->section_id) && ! empty($subjectTeacher->section_id)) {
            $student->section_id = $subjectTeacher->section_id;
        }

        $student->save();

        $enrollment = Enrollment::firstOrCreate(
            [
                'user_id' => $student->user_id,
                'class_id' => $subjectTeacher->id,
            ],
            [
                'risk_status' => 'low',
                'current_grade' => null,
                'current_attendance_rate' => null,
            ]
        );

        $status = 'assigned_existing';
        if (! $studentExistedBeforeSave) {
            $status = 'created';
        } elseif (! $enrollment->wasRecentlyCreated) {
            $status = 'already_assigned';
        }

        return [
            'status' => $status,
            'password' => $generatedPlainPassword,
            'username' => $user->username,
            'personal_email' => $user->personal_email,
            'user' => $user,
        ];
    }

    private function readSpreadsheetRows(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension() ?? '');

        if (in_array($extension, ['xlsx', 'xls'], true)) {
            throw new RuntimeException('Excel uploads require PHP ext-zip and ext-gd on the server. Convert the sheet to CSV or enable the extensions before retrying.');
        }

        $handle = fopen($file->getRealPath(), 'r');

        if (! $handle) {
            throw new RuntimeException('Unable to read the uploaded file.');
        }

        $rows = [];

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            $rows[] = array_map(fn($value) => is_string($value) ? trim($value) : $value, $row);
        }

        fclose($handle);

        return $rows;
    }

    private function buildColumnMap(array $headerRow): array
    {
        $map = [];

        foreach ($headerRow as $index => $value) {
            $normalized = $this->normalizeHeaderValue($value);

            foreach (self::COLUMN_ALIASES as $key => $aliases) {
                if (in_array($normalized, $aliases, true)) {
                    $map[$key] = $index;
                }
            }
        }

        // If we have first_name and last_name but no student_name, we'll construct student_name later
        // If we have student_name, that takes precedence
        // Mark that we need to construct student_name from parts
        if (!isset($map['student_name']) && (isset($map['first_name']) || isset($map['last_name']))) {
            $map['_construct_name_from_parts'] = true;
        }

        return $map;
    }

    private function normalizeHeaderValue(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        return Str::snake(strtolower(trim($value)));
    }

    private function buildPayloadFromRow(array $row, array $columnMap): array
    {
        $payload = [];

        foreach ($columnMap as $key => $index) {
            // Skip internal flags
            if (str_starts_with($key, '_')) {
                continue;
            }
            $payload[$key] = isset($row[$index]) ? trim((string) $row[$index]) : null;
        }

        if (isset($payload['lrn'])) {
            $payload['lrn'] = $this->sanitizeLrn($payload['lrn']);
        }

        // Construct student_name from parts if needed
        if (!empty($columnMap['_construct_name_from_parts']) || !isset($payload['student_name'])) {
            $firstName = $payload['first_name'] ?? '';
            $lastName = $payload['last_name'] ?? '';
            $middleName = $payload['middle_name'] ?? '';

            // Build full name from parts
            $nameParts = array_filter([trim($firstName), trim($middleName), trim($lastName)]);
            $fullName = implode(' ', $nameParts);

            if (!empty($fullName)) {
                $payload['student_name'] = $fullName;
            }
        }

        // If student_name exists but no first/last name, split it for user creation
        if (!empty($payload['student_name']) && empty($payload['first_name'])) {
            [$firstName, $lastName] = $this->splitName($payload['student_name']);
            $payload['first_name'] = $firstName;
            $payload['last_name'] = $lastName ?: $firstName; // Use first name as last if no last name
        }

        return $payload;
    }

    private function flattenValidationErrors(ValidationException $exception): string
    {
        return collect($exception->errors())->flatten()->implode('; ');
    }

    private function sanitizeLrn(?string $lrn): ?string
    {
        if ($lrn === null) {
            return null;
        }

        $digits = preg_replace('/[^0-9]/', '', $lrn);

        return $digits !== '' ? $digits : null;
    }

    private function createStudentUser(
        string $firstName,
        string $lastName,
        ?string $middleName = null,
        ?string $preferredPersonalEmail = null,
        ?string $lrn = null,
    ): array {
        $plainPassword = Str::random(12);
        $username = $this->generateStudentUsername($firstName, $lastName, $lrn);

        $user = User::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'middle_name' => $middleName,
            'username' => $username,
            'personal_email' => $preferredPersonalEmail,
            'password' => Hash::make($plainPassword),
            'must_change_password' => true,
        ]);

        $studentRoleId = Role::where('name', 'student')->value('id');
        if ($studentRoleId) {
            $user->roles()->syncWithoutDetaching([$studentRoleId]);
        }

        // Only return the generated plaintext password when a user was newly created
        return [
            'user' => $user,
            'password' => $plainPassword,
        ];
    }

    private function splitName(string $fullName): array
    {
        $parts = preg_split('/\s+/', $fullName, 2);

        return [
            $parts[0] ?? $fullName,
            $parts[1] ?? '',
        ];
    }

    private function formatStudentDisplayName(?User $user, ?Student $studentProfile): string
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

    private function buildStudentSortKey(?User $user, ?Student $studentProfile): string
    {
        $lastName = Str::lower(trim((string) ($user?->last_name ?? '')));
        $firstName = Str::lower(trim((string) ($user?->first_name ?? '')));
        $middleName = Str::lower(trim((string) ($user?->middle_name ?? '')));

        if ($lastName !== '' || $firstName !== '' || $middleName !== '') {
            return trim($lastName . ' ' . $firstName . ' ' . $middleName);
        }

        return Str::lower($this->formatStudentDisplayName($user, $studentProfile));
    }

    private function generateStudentUsername(string $firstName, string $lastName, ?string $lrn = null): string
    {
        $seed = trim("{$firstName} {$lastName}");

        return User::generateUniqueUsername($seed);
    }

    private function avatarFor(string $fullName): string
    {
        return 'https://ui-avatars.com/api/?background=4c1d95&color=fff&name=' . urlencode($fullName);
    }

    private function rowIsEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function ensureTeacherOwnsSubjectTeacher(int $teacherId, SchoolClass $subjectTeacher): void
    {
        if ($subjectTeacher->teacher_id !== $teacherId) {
            abort(403, 'You are not allowed to modify this class.');
        }
    }

    private function buildClassReuseSignature(int $subjectId, string $gradeLevel, string $section): string
    {
        return implode('|', [
            $subjectId,
            mb_strtolower(trim($gradeLevel)),
            mb_strtolower(trim($section)),
        ]);
    }

    private function resolveSectionRecordId(
        int $teacherId,
        string $schoolYear,
        string $sectionCombined,
        string $gradeLevel,
        ?string $strand,
        ?string $track,
    ): int {
        $normalizedSection = strtoupper(trim($sectionCombined));
        $normalizedStrand = strtoupper(trim((string) $strand));

        if ($normalizedStrand === '' && str_contains($normalizedSection, '-')) {
            $normalizedStrand = strtoupper((string) Str::before($normalizedSection, '-'));
        }

        $departmentQuery = Department::query();

        if ($normalizedStrand !== '') {
            $departmentQuery->where('department_code', $normalizedStrand);
        } else {
            $teacherDepartmentId = User::query()
                ->whereKey($teacherId)
                ->value('department_id');

            if ($teacherDepartmentId) {
                $departmentQuery->whereKey($teacherDepartmentId);
            }
        }

        $department = $departmentQuery->first();

        if (! $department) {
            throw ValidationException::withMessages([
                'strand' => 'Selected strand is not linked to a department.',
            ]);
        }

        $cohort = $this->cohortFromSchoolYear($schoolYear);

        $sectionRecord = Section::query()
            ->where('department_id', $department->id)
            ->where('cohort', $cohort)
            ->where(function ($query) use ($normalizedSection) {
                $query
                    ->whereRaw('UPPER(section_name) = ?', [$normalizedSection])
                    ->orWhereRaw('UPPER(section_code) = ?', [$normalizedSection]);
            })
            ->first();

        if ($sectionRecord) {
            return (int) $sectionRecord->id;
        }

        $sectionRecord = Section::create([
            'department_id' => $department->id,
            'created_by' => $teacherId,
            'section_name' => $normalizedSection,
            'section_code' => $normalizedSection,
            'cohort' => $cohort,
            'grade_level' => $gradeLevel,
            'strand' => $normalizedStrand !== '' ? $normalizedStrand : $department->department_code,
            'track' => $track,
            'school_year' => $schoolYear,
            'description' => 'Auto-created from teacher class workflow.',
            'is_active' => true,
        ]);

        return (int) $sectionRecord->id;
    }

    private function cohortFromSchoolYear(string $schoolYear): string
    {
        if (preg_match('/^(\d{4})-\d{4}$/', $schoolYear, $matches) === 1) {
            return $matches[1];
        }

        return $schoolYear;
    }



    /**
     * Send a nudge notification to all students in a class.
     */
    public function sendNudge(Request $request, SchoolClass $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $data = $request->validate([
            'message' => 'required|string|max:500',
            'title' => 'nullable|string|max:255',
        ]);

        $teacher = $request->user();
        $enrollments = $subjectTeacher->enrollments()->with('user')->get();

        if ($enrollments->isEmpty()) {
            return back()->with('error', 'No students enrolled in this class.');
        }

        $sentCount = 0;
        $subjectName = $subjectTeacher->subject?->subject_name ?? 'N/A';

        foreach ($enrollments as $enrollment) {
            if (!$enrollment->user_id) {
                continue;
            }

            $title = $data['title'] ?? "📣 Message from {$teacher->name}";

            StudentNotification::create([
                'user_id' => $enrollment->user_id,
                'sender_id' => $teacher->id,
                'intervention_id' => null,
                'type' => 'nudge',
                'title' => $title,
                'message' => $data['message'],
            ]);

            $sentCount++;
        }

        return back()->with('success', "Nudge sent to {$sentCount} student(s) in {$subjectName}!");
    }

    /**
     * Start or advance the active quarter for the class.
     *
     * If the current quarter has no quarterly-exam scores the teacher must
     * confirm by providing their password.
     */
    public function startQuarter(Request $request, SchoolClass $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $data = $request->validate([
            'quarter'  => 'required|integer|min:1|max:4',
            'password' => 'nullable|string',
        ]);

        $quarter = (int) $data['quarter'];

        // Only allow advancing forward, not going backward
        if ($quarter <= ($subjectTeacher->current_quarter ?? 1)) {
            return back()->with('error', 'Cannot set to a previous or same quarter.');
        }

        // Check whether the previous quarter has quarterly-exam scores
        $previousQuarter = $quarter - 1;
        $subjectTeacher->loadMissing('enrollments.grades');

        $hasQuarterlyExam = $this->classHasQuarterlyExamScores(
            $subjectTeacher,
            $previousQuarter
        );

        // If no quarterly exam scores exist, require password confirmation
        if (!$hasQuarterlyExam) {
            if (empty($data['password'])) {
                return back()->withErrors([
                    'password' => 'Password is required when advancing without quarterly exam scores.',
                ]);
            }

            if (!Hash::check($data['password'], $request->user()->password)) {
                return back()->withErrors([
                    'password' => 'The provided password is incorrect.',
                ]);
            }
        }

        // Initialize the new quarter's categories if they don't exist yet
        $storedCategories = $subjectTeacher->grade_categories;
        $newQuarterCategories = $this->resolveQuarterCategories($storedCategories, $quarter);

        // If the new quarter has no categories (or empty default), seed with category structure (no tasks)
        if (empty($newQuarterCategories) || !isset($storedCategories[$quarter]) && !isset($storedCategories[(string) $quarter])) {
            $previousCategories = $this->resolveQuarterCategories($storedCategories, $previousQuarter);
            // Copy category structure (id, label, weight) but with empty tasks
            $emptyCategories = array_map(function ($cat) {
                return [
                    'id' => $cat['id'],
                    'label' => $cat['label'],
                    'weight' => $cat['weight'],
                    'tasks' => [],
                ];
            }, $previousCategories);

            $perQuarter = $this->buildPerQuarterCategories($storedCategories, $quarter, $emptyCategories);
            $subjectTeacher->update([
                'current_quarter' => $quarter,
                'grade_categories' => $perQuarter,
            ]);
        } else {
            $subjectTeacher->update(['current_quarter' => $quarter]);
        }

        $subjectName = $subjectTeacher->subject?->subject_name ?? $subjectTeacher->name;

        return back()->with('success', "Quarter {$quarter} started for {$subjectName}.");
    }

    /**
     * Check if at least one enrollment in the class has a quarterly-exam score
     * for the given quarter.
     */
    private function classHasQuarterlyExamScores(SchoolClass $subjectTeacher, int $quarter): bool
    {
        $categories = $this->resolveQuarterCategories($subjectTeacher->grade_categories, $quarter);

        // Find the quarterly exam category
        $qeCategory = collect($categories)->first(function ($cat) {
            $id = $cat['id'] ?? '';
            $label = strtolower($cat['label'] ?? '');
            return $id === 'quarterly_exam' || str_contains($label, 'quarterly exam');
        });

        if (!$qeCategory || empty($qeCategory['tasks'])) {
            return false;
        }

        $taskIds = collect($qeCategory['tasks'])->pluck('id')->toArray();

        foreach ($subjectTeacher->enrollments as $enrollment) {
            foreach ($enrollment->grades as $grade) {
                // Filter by the quarter column
                if ((int) $grade->quarter !== $quarter) {
                    continue;
                }

                if (in_array($grade->assignment_key, $taskIds) && $grade->score !== null) {
                    return true;
                }
            }
        }

        return false;
    }

    public function myClass(Request $request, SchoolClass $subjectTeacher)
    {
        try {
            // Add error logging
            Log::info('Accessing class:', ['class_id' => $subjectTeacher->id, 'user_id' => $request->user()->id]);

            $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

            $subjectTeacher->load([
                'subject',
                'enrollments.user.student',
                'enrollments.grades',
            ]);

            // Use a try-catch to handle potential errors
            try {
                // Build per-quarter grade structures
                $currentQuarter = $subjectTeacher->current_quarter ?? 1;
                $storedCategories = $subjectTeacher->grade_categories;

                $q1Categories = $this->resolveQuarterCategories($storedCategories, 1);
                $q2Categories = $this->resolveQuarterCategories($storedCategories, 2);

                $q1Structure = $this->buildGradeStructure($q1Categories);
                $q2Structure = $this->buildGradeStructure($q2Categories);

                $q1Structure = $this->ClassesServices->ensureStructureCoversExistingGrades($subjectTeacher, $q1Structure, 1);
                $q2Structure = $this->ClassesServices->ensureStructureCoversExistingGrades($subjectTeacher, $q2Structure, 2);

                // Persist the normalised categories so repaired labels/weights are saved
                $repairedPerQuarter = $this->buildPerQuarterCategories(
                    $subjectTeacher->grade_categories,
                    1,
                    $q1Structure['categories'],
                );
                $repairedPerQuarter = $this->buildPerQuarterCategories(
                    $repairedPerQuarter,
                    2,
                    $q2Structure['categories'],
                );
                $subjectTeacher->updateQuietly(['grade_categories' => $repairedPerQuarter]);

                // Combined structure keyed by quarter for the frontend
                $gradeStructure = [
                    '1' => $q1Structure,
                    '2' => $q2Structure,
                ];
            } catch (\Exception $e) {
                Log::error('Grade structure error:', ['error' => $e->getMessage()]);
                $fallback = $this->buildGradeStructure($this->defaultGradeCategories());
                $gradeStructure = [
                    '1' => $fallback,
                    '2' => $fallback,
                ];
            }

            $classData = [
                'id' => $subjectTeacher->id,
                'name' => $subjectTeacher->grade_level,
                'section' => $subjectTeacher->section,
                'subject' => $subjectTeacher->subject?->subject_name ?? 'N/A',
                'subject_name' => $subjectTeacher->subject?->subject_name ?? 'N/A',
                'color' => $subjectTeacher->color,
                'strand' => $subjectTeacher->strand,
                'track' => $subjectTeacher->track,
                'student_count' => $subjectTeacher->enrollments->count(),
                'current_quarter' => $subjectTeacher->current_quarter ?? 1,
                'semester' => $subjectTeacher->semester,
                'school_year' => $subjectTeacher->school_year,
            ];

            $roster = $subjectTeacher->enrollments
                ->map(function ($enrollment) use ($subjectTeacher) {
                    $user = $enrollment->user;
                    $studentProfile = $user?->student;
                    $formattedName = $this->formatStudentDisplayName($user, $studentProfile);

                    return [
                        'id' => $enrollment->id,
                        'name' => $formattedName,
                        'sort_key' => $this->buildStudentSortKey($user, $studentProfile),
                        'lrn' => $studentProfile?->lrn,
                        'username' => $user?->username,
                        'personal_email' => $user?->personal_email,
                        'email' => $user?->personal_email,
                        'avatar' => $studentProfile?->avatar,
                        'grade_level' => $studentProfile?->grade_level ?? $subjectTeacher->grade_level,
                        'section' => $studentProfile?->section ?? $subjectTeacher->section,
                        'strand' => $studentProfile?->strand ?? $subjectTeacher->strand,
                        'track' => $studentProfile?->track ?? $subjectTeacher->track,
                        'must_change_password' => $user?->must_change_password ?? true,
                        'grades' => $enrollment->grades->groupBy('quarter')->map(function ($quarterGrades) {
                            return $quarterGrades->mapWithKeys(fn($grade) => [
                                $grade->assignment_key ?: Str::slug($grade->assignment_name, '_') => $grade->score,
                            ])->all();
                        })->toArray(),
                    ];
                })
                ->sortBy('sort_key', SORT_NATURAL | SORT_FLAG_CASE)
                ->values()
                ->map(fn(array $student) => array_diff_key($student, ['sort_key' => true]))
                ->values();

            // Calculate grades for all students using the service
            $calculatedGrades = $this->gradeCalculationService->calculateClassGrades(
                $subjectTeacher->enrollments,
                $gradeStructure
            );

            // Recalculate and persist enrollment-level grades (initial, expected, transmuted, final)
            $this->enrollmentGradeService->recalculateClassGrades($subjectTeacher);
            $subjectTeacher->load('enrollments'); // reload to get fresh values

            // Build per-enrollment grade summaries keyed by enrollment ID
            $gradeSummaries = $subjectTeacher->enrollments
                ->mapWithKeys(fn($e) => [
                    $e->id => $this->enrollmentGradeService->buildGradeSummary($e),
                ])
                ->toArray();

            return response()->json([
                'class' => $classData,
                'roster' => $roster,
                'gradeStructure' => $gradeStructure,
                'calculatedGrades' => $calculatedGrades,
                'gradeSummaries' => $gradeSummaries,
                'updated_at' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Class access error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'class_id' => $subjectTeacher->id ?? 'unknown'
            ]);

            return response()->json([
                'error' => 'Unable to load class data',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

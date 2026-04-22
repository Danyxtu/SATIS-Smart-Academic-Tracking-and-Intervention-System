<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\ArchiveClass;
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
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
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
    private const DUPLICATE_CLASS_ERROR_MESSAGE = 'Duplicate class detected. A class with the same grade level, subject, and section already exists. Please edit the class details or cancel.';
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
            ->with(['specializations:id,specialization_name'])
            ->where('is_active', true)
            ->orderBy('department_code')
            ->get()
            ->map(fn(Department $department) => [
                'id' => (int) $department->id,
                'department_name' => $department->department_name,
                'department_code' => $department->department_code,
                'track' => $department->track,
                'description' => $department->description,
                'is_active' => (bool) $department->is_active,
                'specializations' => $department->specializations
                    ->map(fn($specialization) => [
                        'id' => (int) $specialization->id,
                        'specialization_name' => $specialization->specialization_name,
                    ])
                    ->values(),
            ])
            ->values();
        $availableSubjects = Subject::query()
            ->orderBy('subject_name')
            ->get(['id', 'subject_name', 'subject_code'])
            ->map(fn(Subject $subject) => [
                'id' => (int) $subject->id,
                'subject_name' => $subject->subject_name,
                'subject_code' => $subject->subject_code,
            ])
            ->values();
        $sectionsSchoolYear = $classesData['defaultSchoolYear'];
        $availableSections = Section::query()
            ->with('department:id,department_code,department_name')
            ->where('is_active', true)
            ->where('school_year', $sectionsSchoolYear)
            ->orderBy('section_name')
            ->get([
                'id',
                'department_id',
                'section_name',
                'section_code',
                'grade_level',
                'strand',
                'track',
            ])
            ->map(function (Section $section) {
                $specialization = $section->strand
                    ?: $section->department?->department_code;

                return [
                    'id' => (int) $section->id,
                    'section_name' => $section->section_name,
                    'section_code' => $section->section_code,
                    'grade_level' => $section->grade_level,
                    'strand' => $section->strand,
                    'track' => $section->track,
                    'specialization' => $specialization,
                    'section_full_label' => satis_section_full_label(
                        $section->grade_level,
                        $specialization,
                        $section->section_name,
                    ),
                    'department_code' => $section->department?->department_code,
                    'department_name' => $section->department?->department_name,
                ];
            })
            ->values();

        $classes = $classesData['classes'];
        $defaultSchoolYear = $classesData['defaultSchoolYear'];
        $currentSemester = $classesData['currentSemester'];
        $selectedSemester = $classesData['selectedSemester'];
        $semester1Count = $classesData['semester1Count'];
        $semester2Count = $classesData['semester2Count'];
        $roster = $classesData['roster'];
        $archivedClassYears = $this->buildArchivedClassYears(
            (int) $request->user()->id,
            (string) $defaultSchoolYear,
            (string) $currentSemester,
        );

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
            'archivedClassYears',
        ));
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
            'grade_level' => ['required', 'string', Rule::in(satis_grade_level_options())],
            'section' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z]+$/'],
            'subject_name' => 'required|string|max:255',
            'color' => 'required|string|in:' . implode(',', self::COLOR_OPTIONS),
            'school_year' => ['required', 'string', 'max:255', Rule::in([$currentSchoolYear])],
            'strand' => ['required', 'string', Rule::exists('departments', 'department_code')],
            'specialization' => 'nullable|string|max:255',
            'track' => 'nullable|string|max:255',
            'classlist' => 'nullable|file|mimes:csv,txt,xls,xlsx|max:4096',
            'manual_students' => 'nullable|array',
            'manual_students.*' => 'array',
        ]);

        $sectionSuffix = strtoupper(trim($data['section']));
        $normalizedStrand = strtoupper(trim($data['strand']));
        $normalizedSpecialization = $this->normalizeSectionSpecialization(
            $data['specialization'] ?? null,
        );
        $sectionCombined = $normalizedStrand . '-' . $sectionSuffix;
        $normalizedSubjectName = preg_replace('/\s+/', ' ', trim((string) $data['subject_name'])) ?? '';
        $resolvedTrack = $this->resolveTrackFromDepartmentCode($normalizedStrand);

        if ($normalizedSubjectName === '') {
            throw ValidationException::withMessages([
                'subject_name' => 'Subject is required.',
            ]);
        }

        $sectionId = $this->resolveSectionRecordId(
            (int) $teacher->id,
            $currentSchoolYear,
            $sectionCombined,
            (string) $data['grade_level'],
            $normalizedStrand,
            $normalizedSpecialization,
        );

        // First, find or create the subject
        $subject = Subject::query()
            ->whereRaw('LOWER(TRIM(subject_name)) = ?', [mb_strtolower($normalizedSubjectName)])
            ->first();

        if (! $subject) {
            $subjectCode = Str::slug($normalizedSubjectName, '_') . '_' . Str::random(6);
            $subject = Subject::create([
                'subject_name' => $normalizedSubjectName,
                'subject_code' => $subjectCode,
            ]);
        }

        $classLock = Cache::lock(
            $this->buildTeacherClassAssignmentLockKey(
                (int) $teacher->id,
                (int) $subject->id,
                (string) $data['grade_level'],
                $sectionCombined,
                $currentSchoolYear,
                (string) $currentSemester,
            ),
            10,
        );

        try {
            $classLock->block(3);

            $this->ensureTeacherClassAssignmentIsUnique(
                (int) $teacher->id,
                (int) $subject->id,
                (string) $data['grade_level'],
                $sectionCombined,
                $currentSchoolYear,
                (string) $currentSemester,
            );

            // Create the SubjectTeacher (teacher's class assignment)
            $subjectTeacher = SchoolClass::create([
                'subject_id' => $subject->id,
                'section_id' => $sectionId,
                'teacher_id' => $teacher->id,
                'grade_level' => $data['grade_level'],
                'section' => $sectionCombined,
                'strand' => $normalizedStrand,
                'track' => $resolvedTrack,
                'color' => $data['color'],
                'school_year' => $currentSchoolYear,
                'semester' => (string) $currentSemester,
                'grade_categories' => $this->defaultGradeCategories(),
            ]);
        } catch (LockTimeoutException $exception) {
            throw ValidationException::withMessages([
                'class_duplicate' => self::DUPLICATE_CLASS_ERROR_MESSAGE,
            ]);
        } finally {
            optional($classLock)->release();
        }

        $summary = $this->autoAssignSectionStudents($subjectTeacher);

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
                'subject_name' => $normalizedSubjectName,
                'color' => $data['color'],
                'track' => $resolvedTrack,
                'specialization' => $normalizedSpecialization,
                'school_year' => $currentSchoolYear,
                'semester' => (string) $currentSemester,
                'duplicate_section' => false,
            ])
            ->with('import_summary', $summary);
    }

    public function updateClass(Request $request, SchoolClass $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        $data = $request->validate([
            'grade_level' => ['required', 'string', Rule::in(satis_grade_level_options())],
            'section' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z]+$/'],
            'subject_name' => 'required|string|max:255',
            'color' => 'required|string|in:' . implode(',', self::COLOR_OPTIONS),
            'school_year' => ['required', 'string', 'max:255', Rule::in([$currentSchoolYear])],
            'strand' => ['required', 'string', Rule::exists('departments', 'department_code')],
            'specialization' => 'nullable|string|max:255',
            'track' => 'nullable|string|max:255',
        ]);

        $sectionSuffix = strtoupper(trim($data['section']));
        $normalizedStrand = strtoupper(trim($data['strand']));
        $normalizedSpecialization = $this->normalizeSectionSpecialization(
            $data['specialization'] ?? null,
        );
        $sectionCombined = $normalizedStrand . '-' . $sectionSuffix;
        $normalizedSubjectName = preg_replace('/\s+/', ' ', trim((string) $data['subject_name'])) ?? '';
        $resolvedTrack = $this->resolveTrackFromDepartmentCode($normalizedStrand);

        if ($normalizedSubjectName === '') {
            throw ValidationException::withMessages([
                'subject_name' => 'Subject is required.',
            ]);
        }

        $sectionId = $this->resolveSectionRecordId(
            (int) $request->user()->id,
            $currentSchoolYear,
            $sectionCombined,
            (string) $data['grade_level'],
            $normalizedStrand,
            $normalizedSpecialization,
        );

        $subject = Subject::query()
            ->whereRaw('LOWER(TRIM(subject_name)) = ?', [mb_strtolower($normalizedSubjectName)])
            ->first();

        if (! $subject) {
            $subjectCode = Str::slug($normalizedSubjectName, '_') . '_' . Str::random(6);
            $subject = Subject::create([
                'subject_name' => $normalizedSubjectName,
                'subject_code' => $subjectCode,
            ]);
        }

        $targetSemester = (string) ($subjectTeacher->semester ?? SystemSetting::getCurrentSemester());

        $classLock = Cache::lock(
            $this->buildTeacherClassAssignmentLockKey(
                (int) $request->user()->id,
                (int) $subject->id,
                (string) $data['grade_level'],
                $sectionCombined,
                $currentSchoolYear,
                $targetSemester,
            ),
            10,
        );

        try {
            $classLock->block(3);

            $this->ensureTeacherClassAssignmentIsUnique(
                (int) $request->user()->id,
                (int) $subject->id,
                (string) $data['grade_level'],
                $sectionCombined,
                $currentSchoolYear,
                $targetSemester,
                (int) $subjectTeacher->id,
            );

            $subjectTeacher->update([
                'subject_id' => $subject->id,
                'section_id' => $sectionId,
                'grade_level' => $data['grade_level'],
                'section' => $sectionCombined,
                'strand' => $normalizedStrand,
                'track' => $resolvedTrack,
                'color' => $data['color'],
                'school_year' => $currentSchoolYear,
            ]);
        } catch (LockTimeoutException $exception) {
            throw ValidationException::withMessages([
                'class_duplicate' => self::DUPLICATE_CLASS_ERROR_MESSAGE,
            ]);
        } finally {
            optional($classLock)->release();
        }

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', 'Class updated successfully.');
    }

    public function restoreArchivedClass(Request $request, ArchiveClass $archiveClass): RedirectResponse
    {
        $teacherId = (int) $request->user()->id;

        if ((int) $archiveClass->teacher_user_id !== $teacherId) {
            abort(403, 'You are not allowed to restore this archived class.');
        }

        $currentSchoolYear = (string) SystemSetting::getCurrentSchoolYear();
        $currentSemester = (string) SystemSetting::getCurrentSemester();

        if (! in_array($currentSemester, ['1', '2'], true)) {
            $currentSemester = '1';
        }

        $gradeLevel = trim((string) ($archiveClass->grade_level ?? ''));

        if ($gradeLevel === '') {
            return back()->with('error', 'Unable to restore class because the archived grade level is missing.');
        }

        $normalizedStrand = strtoupper(trim((string) ($archiveClass->strand ?: $archiveClass->teacher_department_code)));

        if ($normalizedStrand === '') {
            return back()->with('error', 'Unable to restore class because the archived strand is missing.');
        }

        $sectionSource = trim((string) ($archiveClass->section_name ?: $archiveClass->section_code));

        if ($sectionSource === '') {
            return back()->with('error', 'Unable to restore class because the archived section is missing.');
        }

        $sectionCombined = $this->buildArchivedSectionIdentifier($normalizedStrand, $sectionSource);

        if ($sectionCombined === '') {
            return back()->with('error', 'Unable to restore class because the archived section could not be resolved.');
        }

        $sectionId = $this->resolveSectionRecordId(
            $teacherId,
            $currentSchoolYear,
            $sectionCombined,
            $gradeLevel,
            $normalizedStrand,
            $archiveClass->strand,
        );

        $normalizedSubjectName = preg_replace('/\s+/', ' ', trim((string) ($archiveClass->subject_name ?? '')));
        $normalizedSubjectName = is_string($normalizedSubjectName) ? $normalizedSubjectName : '';

        $subject = null;

        if ($archiveClass->original_subject_id) {
            $subject = Subject::query()->find($archiveClass->original_subject_id);
        }

        if (! $subject && $normalizedSubjectName !== '') {
            $subject = Subject::query()
                ->whereRaw('LOWER(TRIM(subject_name)) = ?', [mb_strtolower($normalizedSubjectName)])
                ->first();
        }

        if (! $subject) {
            if ($normalizedSubjectName === '') {
                return back()->with('error', 'Unable to restore class because the archived subject is missing.');
            }

            $subjectCode = Str::slug($normalizedSubjectName, '_') . '_' . Str::random(6);
            $subject = Subject::query()->create([
                'subject_name' => $normalizedSubjectName,
                'subject_code' => $subjectCode,
            ]);
        }

        $resolvedTrack = trim((string) ($archiveClass->track ?? ''));
        $resolvedTrack = $resolvedTrack !== ''
            ? Str::lower($resolvedTrack)
            : $this->resolveTrackFromDepartmentCode($normalizedStrand);

        $resolvedColor = trim((string) ($archiveClass->color ?? ''));

        if (! in_array($resolvedColor, self::COLOR_OPTIONS, true)) {
            $resolvedColor = 'indigo';
        }

        $gradeCategories = is_array($archiveClass->grade_categories) && $archiveClass->grade_categories !== []
            ? $archiveClass->grade_categories
            : $this->defaultGradeCategories();

        $classLock = Cache::lock(
            $this->buildTeacherClassAssignmentLockKey(
                $teacherId,
                (int) $subject->id,
                $gradeLevel,
                $sectionCombined,
                $currentSchoolYear,
                $currentSemester,
            ),
            10,
        );

        try {
            $classLock->block(3);

            $this->ensureTeacherClassAssignmentIsUnique(
                $teacherId,
                (int) $subject->id,
                $gradeLevel,
                $sectionCombined,
                $currentSchoolYear,
                $currentSemester,
            );

            SchoolClass::query()->create([
                'subject_id' => (int) $subject->id,
                'section_id' => $sectionId,
                'teacher_id' => $teacherId,
                'grade_level' => $gradeLevel,
                'section' => $sectionCombined,
                'strand' => $normalizedStrand,
                'track' => $resolvedTrack,
                'color' => $resolvedColor,
                'school_year' => $currentSchoolYear,
                'semester' => $currentSemester,
                'grade_categories' => $gradeCategories,
            ]);
        } catch (LockTimeoutException $exception) {
            throw ValidationException::withMessages([
                'archive_restore' => self::DUPLICATE_CLASS_ERROR_MESSAGE,
            ]);
        } finally {
            optional($classLock)->release();
        }

        $restoredSubjectName = $subject->subject_name ?: $normalizedSubjectName;

        return redirect()
            ->route('teacher.classes.index', ['semester' => $currentSemester])
            ->with('success', "Archived class {$restoredSubjectName} ({$sectionCombined}) was added to {$currentSchoolYear} with an empty student list.");
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

    public function searchStudentByLrn(Request $request, SchoolClass $subjectTeacher): JsonResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $normalizedLrn = $this->sanitizeLrn($request->query('lrn'));

        $validator = Validator::make([
            'lrn' => $normalizedLrn,
        ], [
            'lrn' => ['required', 'string', 'digits:12', 'not_in:000000000000'],
        ], [
            'lrn.digits' => 'LRN must be exactly 12 digits.',
            'lrn.not_in' => 'LRN cannot be 000000000000.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please provide a valid LRN.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $student = Student::query()
            ->with(['user:id,first_name,last_name,middle_name,username,personal_email'])
            ->where('lrn', $normalizedLrn)
            ->first();

        if (! $student || ! $student->user_id) {
            return response()->json([
                'message' => 'No student account was found for this LRN.',
            ], 404);
        }

        $isAlreadyAssigned = Enrollment::query()
            ->where('class_id', $subjectTeacher->id)
            ->where('user_id', $student->user_id)
            ->exists();

        return response()->json([
            'student' => [
                'id' => (int) $student->id,
                'user_id' => (int) $student->user_id,
                'name' => $this->formatStudentDisplayName($student->user, $student),
                'lrn' => $student->lrn,
                'username' => $student->user?->username,
                'personal_email' => $student->user?->personal_email,
                'grade_level' => $student->grade_level,
                'section' => $student->section,
                'strand' => $student->strand,
                'track' => $student->track,
                'is_already_assigned' => $isAlreadyAssigned,
            ],
        ]);
    }

    public function globalSearchStudentByLrn(Request $request): JsonResponse
    {
        $normalizedLrn = $this->sanitizeLrn($request->query('lrn'));

        $validator = Validator::make([
            'lrn' => $normalizedLrn,
        ], [
            'lrn' => ['required', 'string', 'digits:12', 'not_in:000000000000'],
        ], [
            'lrn.digits' => 'LRN must be exactly 12 digits.',
            'lrn.not_in' => 'LRN cannot be 000000000000.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please provide a valid LRN.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $student = Student::query()
            ->with(['user:id,first_name,last_name,middle_name,username,personal_email'])
            ->where('lrn', $normalizedLrn)
            ->first();

        if (! $student || ! $student->user_id) {
            return response()->json([
                'message' => 'No student account was found for this LRN.',
            ], 404);
        }

        return response()->json([
            'student' => [
                'id' => (int) $student->id,
                'user_id' => (int) $student->user_id,
                'name' => $this->formatStudentDisplayName($student->user, $student),
                'lrn' => $student->lrn,
                'username' => $student->user?->username,
                'personal_email' => $student->user?->personal_email,
                'grade_level' => $student->grade_level,
                'section' => $student->section,
                'strand' => $student->strand,
                'track' => $student->track,
            ],
        ]);
    }

    public function enrollStudent(Request $request, SchoolClass $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $normalizedLrn = $this->sanitizeLrn($request->input('lrn'));
        $request->merge([
            'lrn' => $normalizedLrn,
        ]);

        $data = $request->validate([
            'lrn' => [
                'required',
                'string',
                'digits:12',
                'not_in:000000000000',
                Rule::exists('students', 'lrn'),
            ],
        ], [
            'lrn.digits' => 'LRN must be exactly 12 digits.',
            'lrn.not_in' => 'LRN cannot be 000000000000.',
            'lrn.exists' => 'No student account was found for this LRN.',
        ]);

        $student = Student::query()
            ->where('lrn', $data['lrn'])
            ->first();

        if (! $student || ! $student->user_id) {
            throw ValidationException::withMessages([
                'lrn' => 'No student account was found for this LRN.',
            ]);
        }

        $enrollment = Enrollment::firstOrCreate([
            'user_id' => $student->user_id,
            'class_id' => $subjectTeacher->id,
        ], [
            'risk_status' => 'low',
            'current_grade' => null,
            'current_attendance_rate' => null,
        ]);

        $statusMessage = $enrollment->wasRecentlyCreated
            ? 'Student assigned to class.'
            : 'Student is already assigned to this class.';

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', $statusMessage);
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

    private function autoAssignSectionStudents(SchoolClass $subjectTeacher): ?array
    {
        $normalizedSection = strtoupper(trim((string) $subjectTeacher->section));
        $sectionSuffix = strtoupper(trim((string) Str::after($normalizedSection, '-')));

        $sectionCandidates = collect([$normalizedSection, $sectionSuffix])
            ->filter(fn($value) => $value !== '')
            ->unique()
            ->values();

        $candidateUserIdsFromClasses = Enrollment::query()
            ->whereHas('schoolClass', function ($query) use ($subjectTeacher) {
                $query
                    ->where('teacher_id', $subjectTeacher->teacher_id)
                    ->where('school_year', $subjectTeacher->school_year)
                    ->where('semester', $subjectTeacher->semester)
                    ->where('grade_level', $subjectTeacher->grade_level)
                    ->where('section', $subjectTeacher->section)
                    ->where('id', '!=', $subjectTeacher->id);
            })
            ->pluck('user_id');

        $candidateStudentsQuery = Student::query()->whereNotNull('user_id');

        $candidateStudentsQuery->where(function ($query) use ($subjectTeacher, $sectionCandidates) {
            if (! empty($subjectTeacher->section_id)) {
                $query
                    ->where('section_id', $subjectTeacher->section_id)
                    ->orWhere(function ($inner) use ($subjectTeacher, $sectionCandidates) {
                        $inner
                            ->where('grade_level', $subjectTeacher->grade_level)
                            ->where(function ($sectionQuery) use ($sectionCandidates) {
                                foreach ($sectionCandidates as $candidateSection) {
                                    $sectionQuery->orWhereRaw('UPPER(section) = ?', [$candidateSection]);
                                }
                            });

                        if (! empty($subjectTeacher->strand)) {
                            $inner->where(function ($strandQuery) use ($subjectTeacher) {
                                $strandQuery
                                    ->whereNull('strand')
                                    ->orWhereRaw('UPPER(strand) = ?', [strtoupper((string) $subjectTeacher->strand)]);
                            });
                        }
                    });

                return;
            }

            $query->where(function ($inner) use ($subjectTeacher, $sectionCandidates) {
                $inner
                    ->where('grade_level', $subjectTeacher->grade_level)
                    ->where(function ($sectionQuery) use ($sectionCandidates) {
                        foreach ($sectionCandidates as $candidateSection) {
                            $sectionQuery->orWhereRaw('UPPER(section) = ?', [$candidateSection]);
                        }
                    });

                if (! empty($subjectTeacher->strand)) {
                    $inner->where(function ($strandQuery) use ($subjectTeacher) {
                        $strandQuery
                            ->whereNull('strand')
                            ->orWhereRaw('UPPER(strand) = ?', [strtoupper((string) $subjectTeacher->strand)]);
                    });
                }
            });
        });

        $candidateUserIdsFromStudents = $candidateStudentsQuery->pluck('user_id');

        $candidateUserIds = $candidateUserIdsFromClasses
            ->merge($candidateUserIdsFromStudents)
            ->filter(fn($id) => ! is_null($id))
            ->map(fn($id) => (int) $id)
            ->filter(fn($id) => $id > 0)
            ->unique()
            ->values();

        if ($candidateUserIds->isEmpty()) {
            return null;
        }

        $studentsByUserId = Student::query()
            ->whereIn('user_id', $candidateUserIds)
            ->get(['user_id', 'student_name', 'lrn'])
            ->keyBy('user_id');

        $usersById = User::query()
            ->whereIn('id', $candidateUserIds)
            ->get(['id', 'first_name', 'last_name', 'middle_name', 'username', 'personal_email'])
            ->keyBy('id');

        $assignedExistingStudents = [];
        $alreadyEnrolledStudents = [];

        foreach ($candidateUserIds as $candidateUserId) {
            $enrollment = Enrollment::firstOrCreate(
                [
                    'user_id' => $candidateUserId,
                    'class_id' => $subjectTeacher->id,
                ],
                [
                    'risk_status' => 'low',
                    'current_grade' => null,
                    'current_attendance_rate' => null,
                ]
            );

            $user = $usersById->get($candidateUserId);
            $studentProfile = $studentsByUserId->get($candidateUserId);

            $studentPayload = [
                'name' => $this->formatStudentDisplayName($user, $studentProfile),
                'lrn' => $studentProfile?->lrn,
                'username' => $user?->username,
                'personal_email' => $user?->personal_email,
            ];

            if ($enrollment->wasRecentlyCreated) {
                $assignedExistingStudents[] = $studentPayload;
                continue;
            }

            $alreadyEnrolledStudents[] = $studentPayload;
        }

        if ($assignedExistingStudents === [] && $alreadyEnrolledStudents === []) {
            return null;
        }

        return [
            'newly_created' => 0,
            'assigned_existing' => count($assignedExistingStudents),
            'already_enrolled' => count($alreadyEnrolledStudents),
            'skipped' => 0,
            'errors' => [],
            'newly_created_students' => [],
            'assigned_existing_students' => $assignedExistingStudents,
            'already_enrolled_students' => $alreadyEnrolledStudents,
            'imported' => 0,
            'updated' => count($assignedExistingStudents) + count($alreadyEnrolledStudents),
            'created_students' => [],
        ];
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

        if (! $student) {
            throw new RuntimeException("Student account with LRN {$lrn} was not found. Teachers are not allowed to create new student accounts.");
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
            'temporary_password' => $plainPassword,
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

    private function buildArchivedClassYears(int $teacherId, string $currentSchoolYear, string $targetSemester): array
    {
        $normalizedTargetSemester = in_array($targetSemester, ['1', '2'], true)
            ? $targetSemester
            : (string) SystemSetting::getCurrentSemester();

        if (! in_array($normalizedTargetSemester, ['1', '2'], true)) {
            $normalizedTargetSemester = '1';
        }

        $archivedClasses = ArchiveClass::query()
            ->where('teacher_user_id', $teacherId)
            ->whereHas('archive')
            ->with('archive:id,archive_key,school_year,next_school_year,captured_at')
            ->orderByDesc('school_year_archive_id')
            ->orderBy('semester')
            ->orderBy('subject_name')
            ->get([
                'id',
                'school_year_archive_id',
                'original_subject_id',
                'subject_name',
                'subject_code',
                'grade_level',
                'section_name',
                'section_code',
                'strand',
                'track',
                'semester',
                'color',
                'students_total',
            ]);

        if ($archivedClasses->isEmpty()) {
            return [];
        }

        $currentClasses = SchoolClass::query()
            ->where('teacher_id', $teacherId)
            ->where('school_year', $currentSchoolYear)
            ->where('semester', $normalizedTargetSemester)
            ->with('subject:id,subject_name')
            ->get([
                'id',
                'subject_id',
                'grade_level',
                'section',
            ]);

        $existingBySubjectId = [];
        $existingBySubjectName = [];

        foreach ($currentClasses as $currentClass) {
            $assignmentSignature = $this->buildClassAssignmentSignature(
                $currentClass->grade_level,
                $currentClass->section,
            );

            if ($currentClass->subject_id) {
                $existingBySubjectId[(int) $currentClass->subject_id . '|' . $assignmentSignature] = true;
            }

            $subjectNameKey = $this->normalizeSubjectNameKey($currentClass->subject?->subject_name);

            if ($subjectNameKey !== '') {
                $existingBySubjectName[$subjectNameKey . '|' . $assignmentSignature] = true;
            }
        }

        return $archivedClasses
            ->groupBy(fn(ArchiveClass $archiveClass) => (int) $archiveClass->school_year_archive_id)
            ->map(function ($classesForArchive) use ($existingBySubjectId, $existingBySubjectName, $normalizedTargetSemester) {
                $archiveMetadata = $classesForArchive->first()?->archive;

                $classRows = $classesForArchive
                    ->map(function (ArchiveClass $archiveClass) use ($existingBySubjectId, $existingBySubjectName) {
                        $sectionSource = $archiveClass->section_name ?: $archiveClass->section_code;
                        $sectionIdentifier = $this->buildArchivedSectionIdentifier(
                            $archiveClass->strand,
                            $sectionSource,
                        );

                        $assignmentSignature = $this->buildClassAssignmentSignature(
                            $archiveClass->grade_level,
                            $sectionIdentifier,
                        );

                        $alreadyRestored = false;

                        if ($archiveClass->original_subject_id) {
                            $alreadyRestored = isset($existingBySubjectId[(int) $archiveClass->original_subject_id . '|' . $assignmentSignature]);
                        }

                        if (! $alreadyRestored) {
                            $subjectNameKey = $this->normalizeSubjectNameKey($archiveClass->subject_name);

                            if ($subjectNameKey !== '') {
                                $alreadyRestored = isset($existingBySubjectName[$subjectNameKey . '|' . $assignmentSignature]);
                            }
                        }

                        return [
                            'id' => (int) $archiveClass->id,
                            'subject_name' => $archiveClass->subject_name,
                            'subject_code' => $archiveClass->subject_code,
                            'grade_level' => $archiveClass->grade_level,
                            'section_name' => $archiveClass->section_name,
                            'section_code' => $archiveClass->section_code,
                            'section_identifier' => $sectionIdentifier,
                            'strand' => $archiveClass->strand,
                            'track' => $archiveClass->track,
                            'semester' => (int) ($archiveClass->semester ?? 0),
                            'color' => $archiveClass->color,
                            'students_total' => (int) ($archiveClass->students_total ?? 0),
                            'already_restored' => $alreadyRestored,
                        ];
                    })
                    ->values();

                return [
                    'archive_id' => (int) ($classesForArchive->first()->school_year_archive_id ?? 0),
                    'archive_key' => $archiveMetadata?->archive_key,
                    'school_year' => $archiveMetadata?->school_year,
                    'next_school_year' => $archiveMetadata?->next_school_year,
                    'captured_at' => $archiveMetadata?->captured_at,
                    'restore_target_semester' => (int) $normalizedTargetSemester,
                    'summary' => [
                        'classes_total' => $classRows->count(),
                        'students_total' => (int) $classRows->sum('students_total'),
                        'semester_1_classes' => $classRows->where('semester', 1)->count(),
                        'semester_2_classes' => $classRows->where('semester', 2)->count(),
                        'already_restored' => $classRows->where('already_restored', true)->count(),
                    ],
                    'classes' => $classRows,
                ];
            })
            ->values()
            ->all();
    }

    private function buildClassAssignmentSignature(?string $gradeLevel, ?string $section): string
    {
        $normalizedGradeLevel = satis_normalize_grade_level((string) $gradeLevel);
        $gradePart = $normalizedGradeLevel !== null
            ? (string) $normalizedGradeLevel
            : Str::lower(trim((string) $gradeLevel));

        $sectionPart = strtoupper(trim((string) $section));

        return $gradePart . '|' . $sectionPart;
    }

    private function buildArchivedSectionIdentifier(?string $strand, ?string $sectionName): string
    {
        $normalizedStrand = strtoupper(trim((string) $strand));
        $normalizedSectionName = strtoupper(trim((string) $sectionName));

        if ($normalizedSectionName === '') {
            return $normalizedStrand;
        }

        if ($normalizedStrand === '') {
            return $normalizedSectionName;
        }

        if (str_starts_with($normalizedSectionName, $normalizedStrand . '-')) {
            return $normalizedSectionName;
        }

        return $normalizedStrand . '-' . $normalizedSectionName;
    }

    private function normalizeSubjectNameKey(?string $subjectName): string
    {
        $normalized = preg_replace('/\s+/', ' ', trim((string) $subjectName));

        return Str::lower((string) ($normalized ?? ''));
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

    private function buildTeacherClassAssignmentLockKey(
        int $teacherId,
        int $subjectId,
        string $gradeLevel,
        string $section,
        string $schoolYear,
        string $semester,
    ): string {
        $signature = implode('|', [
            $teacherId,
            $subjectId,
            mb_strtolower(trim($gradeLevel)),
            mb_strtolower(trim($section)),
            trim($schoolYear),
            trim($semester),
        ]);

        return 'teacher_class_assignment:' . sha1($signature);
    }

    /**
     * Prevent duplicate grade level + subject + section assignments per teacher, school year, and semester.
     */
    private function ensureTeacherClassAssignmentIsUnique(
        int $teacherId,
        int $subjectId,
        string $gradeLevel,
        string $section,
        string $schoolYear,
        string $semester,
        ?int $ignoreClassId = null,
    ): void {
        $query = SchoolClass::query()
            ->where('teacher_id', $teacherId)
            ->where('subject_id', $subjectId)
            ->where('grade_level', $gradeLevel)
            ->where('section', $section)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester);

        if ($ignoreClassId !== null) {
            $query->where('id', '!=', $ignoreClassId);
        }

        if (! $query->exists()) {
            return;
        }

        throw ValidationException::withMessages([
            'class_duplicate' => self::DUPLICATE_CLASS_ERROR_MESSAGE,
        ]);
    }

    private function normalizeSectionSpecialization(?string $specialization): string
    {
        $normalized = preg_replace('/\s+/', ' ', trim((string) $specialization));

        return strtoupper((string) ($normalized ?? ''));
    }

    private function resolveTrackFromDepartmentCode(?string $departmentCode): string
    {
        $normalizedDepartmentCode = strtoupper(trim((string) $departmentCode));

        if ($normalizedDepartmentCode === '') {
            return 'academic';
        }

        $departmentTrack = Department::query()
            ->whereRaw('UPPER(department_code) = ?', [$normalizedDepartmentCode])
            ->value('track');

        $normalizedTrack = strtolower(trim((string) $departmentTrack));

        if ($normalizedTrack !== '') {
            return $normalizedTrack;
        }

        return $normalizedDepartmentCode === 'ICT' ? 'tvl' : 'academic';
    }

    private function resolveSectionRecordId(
        int $teacherId,
        string $schoolYear,
        string $sectionCombined,
        string $gradeLevel,
        ?string $departmentCode,
        ?string $specialization,
    ): int {
        $normalizedSection = strtoupper(trim($sectionCombined));
        $normalizedDepartmentCode = strtoupper(trim((string) $departmentCode));
        $normalizedSpecialization = $this->normalizeSectionSpecialization($specialization);
        $normalizedGradeLevel = satis_normalize_grade_level($gradeLevel);

        if ($normalizedGradeLevel === null) {
            throw ValidationException::withMessages([
                'grade_level' => 'Grade level must be one of: 11, 12.',
            ]);
        }

        $sectionBaseName = strtoupper(
            trim((string) (satis_extract_section_base_name((string) Str::after($normalizedSection, '-')) ?? '')),
        );

        if ($sectionBaseName === '') {
            throw ValidationException::withMessages([
                'section' => 'Section name is required.',
            ]);
        }

        if ($normalizedDepartmentCode === '' && str_contains($normalizedSection, '-')) {
            $normalizedDepartmentCode = strtoupper((string) Str::before($normalizedSection, '-'));
        }

        $departmentQuery = Department::query();

        if ($normalizedDepartmentCode !== '') {
            $departmentQuery->where('department_code', $normalizedDepartmentCode);
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

        if ($normalizedSpecialization === '') {
            $normalizedSpecialization = strtoupper((string) $department->department_code);
        }

        $sectionCode = satis_generate_section_code(
            $normalizedGradeLevel,
            $normalizedSpecialization,
            $sectionBaseName,
        );
        $gradeLevelCandidates = [
            $normalizedGradeLevel,
            'Grade ' . $normalizedGradeLevel,
            'GRADE ' . $normalizedGradeLevel,
        ];

        $existingByUniqueCode = Section::query()
            ->where('department_id', $department->id)
            ->where('school_year', $schoolYear)
            ->whereRaw('UPPER(section_code) = ?', [strtoupper($sectionCode)])
            ->first();

        if ($existingByUniqueCode) {
            return (int) $existingByUniqueCode->id;
        }

        $sectionRecord = Section::query()
            ->where('department_id', $department->id)
            ->where('school_year', $schoolYear)
            ->whereIn('grade_level', $gradeLevelCandidates)
            ->where(function ($query) use ($sectionBaseName, $normalizedSection) {
                $query
                    ->whereRaw('UPPER(section_name) = ?', [$sectionBaseName])
                    ->orWhereRaw('UPPER(section_code) = ?', [$normalizedSection]);
            })
            ->when($normalizedSpecialization !== '', function ($query) use ($normalizedSpecialization) {
                $query->where(function ($strandQuery) use ($normalizedSpecialization) {
                    $strandQuery
                        ->whereNull('strand')
                        ->orWhereRaw('UPPER(strand) = ?', [$normalizedSpecialization]);
                });
            })
            ->first();

        if ($sectionRecord) {
            return (int) $sectionRecord->id;
        }

        try {
            $sectionRecord = Section::create([
                'department_id' => $department->id,
                'created_by' => $teacherId,
                'section_name' => $sectionBaseName,
                'section_code' => $sectionCode,
                'grade_level' => $normalizedGradeLevel,
                'strand' => $normalizedSpecialization,
                'track' => $this->resolveTrackFromDepartmentCode((string) $department->department_code),
                'school_year' => $schoolYear,
                'description' => 'Auto-created from teacher class workflow.',
                'is_active' => true,
            ]);
        } catch (UniqueConstraintViolationException $exception) {
            $existingSection = Section::query()
                ->where('department_id', $department->id)
                ->where('school_year', $schoolYear)
                ->whereRaw('UPPER(section_code) = ?', [strtoupper($sectionCode)])
                ->first();

            if ($existingSection) {
                return (int) $existingSection->id;
            }

            throw $exception;
        }

        return (int) $sectionRecord->id;
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
                'enrollments.attendanceRecords',
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
                    $attendanceRecords = $enrollment->attendanceRecords
                        ->sortByDesc('date')
                        ->values();

                    $presentDays = (int) $attendanceRecords->where('status', 'present')->count();
                    $absentDays = (int) $attendanceRecords->where('status', 'absent')->count();
                    $lateDays = (int) $attendanceRecords->where('status', 'late')->count();
                    $excusedDays = (int) $attendanceRecords->where('status', 'excused')->count();
                    $totalAttendanceDays = (int) $attendanceRecords->count();
                    $attendedDays = $presentDays + $lateDays + $excusedDays;
                    $attendanceRate = $totalAttendanceDays > 0
                        ? round(($attendedDays / $totalAttendanceDays) * 100, 1)
                        : null;

                    $latestAttendance = $attendanceRecords->first();

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
                        'temporary_password' => ($user?->must_change_password ?? false)
                            ? $user?->temporary_password
                            : null,
                        'grades' => $enrollment->grades->groupBy('quarter')->map(function ($quarterGrades) {
                            return $quarterGrades->mapWithKeys(fn($grade) => [
                                $grade->assignment_key ?: Str::slug($grade->assignment_name, '_') => $grade->score,
                            ])->all();
                        })->toArray(),
                        'attendance' => [
                            'summary' => [
                                'total_days' => $totalAttendanceDays,
                                'present_days' => $presentDays,
                                'absent_days' => $absentDays,
                                'late_days' => $lateDays,
                                'excused_days' => $excusedDays,
                                'attended_days' => $attendedDays,
                                'attendance_rate' => $attendanceRate,
                                'last_status' => $latestAttendance?->status,
                                'last_recorded_at' => $latestAttendance?->date?->format('Y-m-d'),
                            ],
                            'records' => $attendanceRecords
                                ->take(20)
                                ->map(fn($record) => [
                                    'date' => $record->date?->format('Y-m-d'),
                                    'date_label' => $record->date?->format('M d, Y'),
                                    'status' => $record->status,
                                    'status_label' => Str::headline(str_replace('_', ' ', (string) $record->status)),
                                ])
                                ->values()
                                ->all(),
                        ],
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

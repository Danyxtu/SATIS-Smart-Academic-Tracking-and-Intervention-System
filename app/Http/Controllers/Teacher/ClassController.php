<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\StudentNotification;
use App\Models\Subject;
use App\Models\SubjectTeacher;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\GradeCalculationService;
use App\Support\Concerns\HasDefaultAssignments;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
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

    public function __construct(ClassesServices $myClassesServices, GradeCalculationService $gradeCalculationService)
    {
        $this->ClassesServices = $myClassesServices;
        $this->gradeCalculationService = $gradeCalculationService;
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
        'email' => ['email', 'student_email', 'student email', 'email_address', 'email address'],
    ];


    public function goToMyClasses(Request $request): Response
    {
        $classesData = $this->ClassesServices->getClassesData($request);

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
        ));
    }

    public function createAClass(Request $request): RedirectResponse
    {
        $teacher = $request->user();

        $result = $this->ClassesServices->createClass($request);

        // Get current semester from system settings
        $currentSemester = SystemSetting::getCurrentSemester();

        $data = $request->validate([
            'grade_level' => 'required|string|max:255',
            'section' => 'required|string|max:255',
            'subject_name' => 'required|string|max:255',
            'color' => 'required|string|in:' . implode(',', self::COLOR_OPTIONS),
            'school_year' => 'required|string|max:255',
            'strand' => 'nullable|string|max:255',
            'track' => 'nullable|string|max:255',
            'classlist' => 'nullable|file|mimes:csv,txt,xls,xlsx|max:4096',
        ]);

        // First, find or create the subject
        $subjectCode = Str::slug($data['subject_name'], '_') . '_' . Str::random(6);
        $subject = Subject::firstOrCreate(
            ['subject_name' => $data['subject_name']],
            ['subject_code' => $subjectCode]
        );

        // Create the SubjectTeacher (teacher's class assignment)
        $subjectTeacher = SubjectTeacher::create([
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'grade_level' => $data['grade_level'],
            'section' => $data['section'],
            'strand' => $data['strand'] ?? null,
            'track' => $data['track'] ?? null,
            'color' => $data['color'],
            'school_year' => $data['school_year'],
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

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', 'Class created successfully.')
            ->with('import_summary', $summary);
    }

    public function enrollStudent(Request $request, SubjectTeacher $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $data = $request->validate([
            'student_name' => 'required|string|max:255',
            'lrn' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
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
            'email' => $data['email'] ?? null,
        ]);

        // Prepare flash with generated password if created
        $redirect = redirect()->route('teacher.classes.index')->with('success', 'Student added to class.');

        if (is_array($result) && ! empty($result['password'])) {
            $redirect = $redirect->with('new_student_password', [
                'student_name' => $studentName,
                'lrn' => $data['lrn'],
                'email' => $data['email'] ?? null,
                'password' => $result['password'],
            ]);
        }

        return $redirect;
    }

    public function uploadClasslist(Request $request, SubjectTeacher $subjectTeacher): RedirectResponse
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

    public function updateGradeStructure(Request $request, SubjectTeacher $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $data = $request->validate([
            'categories' => 'required|array|min:1',
            'categories.*.id' => 'nullable|string|max:255',
            'categories.*.label' => 'required|string|max:255',
            'categories.*.weight' => 'nullable',
            'categories.*.tasks' => 'array',
            'categories.*.tasks.*.id' => 'nullable|string|max:255',
            'categories.*.tasks.*.label' => 'required|string|max:255',
            'categories.*.tasks.*.total' => 'required|numeric|min:1',
        ]);

        $structure = $this->buildGradeStructure($data['categories']);

        $subjectTeacher->update([
            'grade_categories' => $structure['categories'],
        ]);

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', 'Grade structure updated.');
    }

    private function importClasslist(SubjectTeacher $subjectTeacher, UploadedFile $file): array
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
            'imported' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => [],
            'created_students' => [],
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
                    $summary['imported']++;
                } else {
                    $summary['updated']++;
                }

                if (!empty($result['password'])) {
                    $summary['created_students'][] = [
                        'name' => $payload['student_name'] ?? null,
                        'lrn' => $payload['lrn'] ?? null,
                        'email' => $payload['email'] ?? null,
                        'password' => $result['password'],
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

        // Ensure created_students array exists
        $summary['created_students'] = $summary['created_students'] ?? [];

        return $summary;
    }

    private function persistStudentRecord(SubjectTeacher $subjectTeacher, array $payload): array
    {
        $validator = Validator::make($payload, [
            'student_name' => 'required|string|max:255',
            'lrn' => 'required|string|max:255',
            'grade_level' => 'required|string|max:255',
            'section' => 'nullable|string|max:255',
            'strand' => 'nullable|string|max:255',
            'track' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
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

        if ($student) {
            $user = $student->user;

            if (!$user) {
                $created = $this->createStudentUser($firstName, $lastName, $middleName, $payload['email'] ?? null);
                $user = $created['user'];
                $generatedPlainPassword = $created['password'];
                $student->user()->associate($user);
            } else {
                $user->update([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => $middleName,
                ]);
            }
        } else {
            $created = $this->createStudentUser($firstName, $lastName, $middleName, $payload['email'] ?? null);
            $user = $created['user'];
            $generatedPlainPassword = $created['password'];
            $student = Student::firstOrNew(['user_id' => $user->id]);
        }

        if (!$student->user_id) {
            $student->user_id = $user->id;
        }

        $wasExisting = $student->exists;

        // Update student record - use student_name (single field)
        $student->student_name = $studentName;
        $student->subject = $subjectTeacher->subject?->subject_name ?? 'N/A';
        $student->grade = $student->grade ?? 75;
        $student->trend = $student->trend ?? 'Stable';
        $student->avatar = $student->avatar ?? $this->avatarFor($studentName);
        $student->lrn = $lrn;
        $student->grade_level = $payload['grade_level'] ?? $subjectTeacher->grade_level;
        $student->section = $payload['section'] ?? $subjectTeacher->section;
        $student->strand = $payload['strand'] ?? $subjectTeacher->strand ?? 'N/A';
        $student->track = $payload['track'] ?? $subjectTeacher->track ?? 'N/A';

        $student->save();

        Enrollment::firstOrCreate(
            [
                'user_id' => $student->user_id,
                'subject_teachers_id' => $subjectTeacher->id,
            ],
            [
                'risk_status' => 'low',
                'current_grade' => null,
                'current_attendance_rate' => null,
            ]
        );

        return [
            'status' => $wasExisting ? 'updated' : 'created',
            'password' => $generatedPlainPassword,
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

    private function createStudentUser(string $firstName, string $lastName, ?string $middleName = null, ?string $preferredEmail = null): array
    {
        $fullName = trim("{$firstName} {$lastName}" . ($middleName ? " {$middleName}" : ''));
        $email = strtolower($preferredEmail ?: $this->generateSchoolEmail($fullName));

        $plainPassword = Str::random(12);

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'middle_name' => $middleName,
                'password' => $plainPassword, // Store plain text initially - will be hashed on first login change
                'temp_password' => $plainPassword, // Store for teacher to view
                'must_change_password' => true,
                'role' => 'student',
            ]
        );

        // Only return the generated plaintext password when a user was newly created
        return [
            'user' => $user,
            'password' => $user->wasRecentlyCreated ? $plainPassword : null,
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

    private function generateSchoolEmail(string $fullName): string
    {
        $initials = Str::of($fullName)
            ->replaceMatches('/[^a-zA-Z\s]/', '')
            ->trim()
            ->explode(' ')
            ->map(fn($segment) => Str::lower(Str::substr($segment, 0, 1)))
            ->implode('');

        $year = now()->format('Y');
        $random = random_int(1000, 9999);

        $fallback = $initials ?: 'student';

        return sprintf('%s%s%04d@bshs.edu.ph', $fallback, $year, $random);
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

    private function ensureTeacherOwnsSubjectTeacher(int $teacherId, SubjectTeacher $subjectTeacher): void
    {
        if ($subjectTeacher->teacher_id !== $teacherId) {
            abort(403, 'You are not allowed to modify this class.');
        }
    }



    /**
     * Send a nudge notification to all students in a class.
     */
    public function sendNudge(Request $request, SubjectTeacher $subjectTeacher): RedirectResponse
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
     */
    public function startQuarter(Request $request, SubjectTeacher $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $data = $request->validate([
            'quarter' => 'required|integer|min:1|max:4',
        ]);

        $quarter = (int) $data['quarter'];

        // Only allow advancing forward, not going backward
        if ($quarter <= ($subjectTeacher->current_quarter ?? 1)) {
            return back()->with('error', 'Cannot set to a previous or same quarter.');
        }

        $subjectTeacher->update(['current_quarter' => $quarter]);

        $subjectName = $subjectTeacher->subject?->subject_name ?? $subjectTeacher->name;

        return back()->with('success', "Quarter {$quarter} started for {$subjectName}.");
    }

    public function myClass(Request $request, SubjectTeacher $subjectTeacher)
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
                $gradeStructure = $this->buildGradeStructure($subjectTeacher->grade_categories);
                $gradeStructure = $this->ClassesServices->ensureStructureCoversExistingGrades($subjectTeacher, $gradeStructure);
            } catch (\Exception $e) {
                Log::error('Grade structure error:', ['error' => $e->getMessage()]);
                // Fallback to default grade structure if there's an error
                $gradeStructure = $this->buildGradeStructure($this->defaultGradeCategories());
            }

            $classData = [
                'id' => $subjectTeacher->id,
                'name' => $subjectTeacher->grade_level,
                'section' => $subjectTeacher->section,
                'subject_name' => $subjectTeacher->subject?->subject_name ?? 'N/A',
                'color' => $subjectTeacher->color,
                'strand' => $subjectTeacher->strand,
                'track' => $subjectTeacher->track,
                'student_count' => $subjectTeacher->enrollments->count(),
                'current_quarter' => $subjectTeacher->current_quarter ?? 1,
                'semester' => $subjectTeacher->semester,
                'school_year' => $subjectTeacher->school_year,
            ];

            $roster = $subjectTeacher->enrollments->map(function ($enrollment) use ($subjectTeacher) {
                $user = $enrollment->user;
                $studentProfile = $user?->student;

                // Get name from student_name field, or fallback to user name
                $fullName = $studentProfile?->student_name
                    ?? $user?->name
                    ?? 'Student';

                return [
                    'id' => $enrollment->id,
                    'name' => $fullName,
                    'lrn' => $studentProfile?->lrn,
                    'email' => $user?->email,
                    'avatar' => $studentProfile?->avatar,
                    'grade_level' => $studentProfile?->grade_level ?? $subjectTeacher->grade_level,
                    'section' => $studentProfile?->section ?? $subjectTeacher->section,
                    'strand' => $studentProfile?->strand ?? $subjectTeacher->strand,
                    'track' => $studentProfile?->track ?? $subjectTeacher->track,
                    'temp_password' => $user?->temp_password,
                    'must_change_password' => $user?->must_change_password ?? true,
                    'grades' => $enrollment->grades->mapWithKeys(fn($grade) => [
                        $grade->assignment_key ?: Str::slug($grade->assignment_name, '_') => $grade->score,
                    ])->all(),
                ];
            })->values();

            // Calculate grades for all students using the service
            $calculatedGrades = $this->gradeCalculationService->calculateClassGrades(
                $subjectTeacher->enrollments,
                $gradeStructure
            );

            return response()->json([
                'class' => $classData,
                'roster' => $roster,
                'gradeStructure' => $gradeStructure,
                'calculatedGrades' => $calculatedGrades,
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

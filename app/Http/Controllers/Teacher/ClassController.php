<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\MasterSubject;
use App\Models\Student;
use App\Models\StudentNotification;
use App\Models\Subject;
use App\Models\SystemSetting;
use App\Models\User;
use App\Support\Concerns\HasDefaultAssignments;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ClassController extends Controller
{
    use HasDefaultAssignments;

    private const COLOR_OPTIONS = ['indigo', 'blue', 'red', 'green', 'amber', 'purple', 'teal'];
    private const REQUIRED_ROW_FIELDS = ['name', 'lrn', 'grade_level'];
    private const COLUMN_ALIASES = [
        'name' => ['name', 'student_name', 'student name', 'full_name', 'full name'],
        'lrn' => ['lrn', 'student_lrn', 'student lrn', 'learner_reference_number', 'learner reference number'],
        'grade_level' => ['grade_level', 'grade level', 'grade'],
        'section' => ['section', 'class_section', 'class section'],
        'strand' => ['strand', 'track_strand', 'track strand'],
        'track' => ['track', 'tvl_track', 'tvl track', 'program', 'specialization'],
        'email' => ['email', 'student_email', 'student email'],
    ];

    public function index(Request $request): Response
    {
        $teacher = $request->user();

        // Get current system semester and allow user to select which semester to view
        $currentSemester = SystemSetting::getCurrentSemester();
        $selectedSemester = $request->query('semester', $currentSemester);

        // Get ALL subjects for this teacher (for counting)
        $allSubjects = Subject::with([
            'enrollments.user.student',
            'enrollments.grades',
        ])->where('user_id', $teacher->id)
            ->orderBy('grade_level')
            ->get();

        // Filter subjects by selected semester for display
        $subjects = $allSubjects->filter(function ($subject) use ($selectedSemester) {
            return $subject->semester == $selectedSemester;
        });

        // Count classes per semester for the toggle UI
        $semester1Count = $allSubjects->filter(fn($s) => $s->semester == '1')->count();
        $semester2Count = $allSubjects->filter(fn($s) => $s->semester == '2')->count();

        $gradeStructures = $subjects->mapWithKeys(function ($subject) {
            $structure = $this->buildGradeStructure($subject->grade_categories);
            $structure = $this->ensureStructureCoversExistingGrades($subject, $structure);

            return [$subject->id => $structure];
        });

        // Get master subjects filtered by selected semester for the dropdown
        $masterSubjects = MasterSubject::where('is_active', true)
            ->where('semester', $selectedSemester)
            ->orderBy('grade_level')
            ->orderBy('strand')
            ->orderBy('name')
            ->get()
            ->map(fn($subject) => [
                'id' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
                'description' => $subject->description,
                'grade_level' => $subject->grade_level,
                'strand' => $subject->strand,
                'track' => $subject->track,
                'semester' => $subject->semester,
            ]);

        return Inertia::render('Teacher/MyClasses', [
            'classes' => $subjects->map(fn($subject) => [
                'id' => $subject->id,
                'name' => $subject->grade_level,
                'section' => $subject->section,
                'subject' => $subject->name,
                'color' => $subject->color,
                'strand' => $subject->strand,
                'track' => $subject->track,
                'student_count' => $subject->enrollments->count(),
                'current_quarter' => $subject->current_quarter ?? 1,
                'semester' => $subject->semester,
            ])->values(),
            'rosters' => $subjects->mapWithKeys(fn($subject) => [
                $subject->id => $subject->enrollments->map(function ($enrollment) use ($subject) {
                    $user = $enrollment->user;
                    $studentProfile = $user?->student;
                    $fullName = $user?->name ?? trim(
                        ($studentProfile->first_name ?? '') . ' ' . ($studentProfile->last_name ?? '')
                    );

                    return [
                        'id' => $enrollment->id,
                        'name' => $fullName ?: 'Student',
                        'lrn' => $studentProfile?->lrn,
                        'email' => $user?->email,
                        'avatar' => $studentProfile?->avatar,
                        'grade_level' => $studentProfile?->grade_level ?? $subject->grade_level,
                        'section' => $studentProfile?->section ?? $subject->section,
                        'strand' => $studentProfile?->strand ?? $subject->strand,
                        'track' => $studentProfile?->track ?? $subject->track,
                        'temp_password' => $user?->temp_password,
                        'must_change_password' => $user?->must_change_password ?? true,
                        'grades' => $enrollment->grades->mapWithKeys(fn($grade) => [
                            $grade->assignment_key ?: Str::slug($grade->assignment_name, '_') => $grade->score,
                        ])->all(),
                    ];
                })->values(),
            ])->all(),
            'gradeStructures' => $gradeStructures->all(),
            'defaultSchoolYear' => $this->currentSchoolYear(),
            'currentSemester' => $currentSemester,
            'selectedSemester' => (int) $selectedSemester,
            'semester1Count' => $semester1Count,
            'semester2Count' => $semester2Count,
            'masterSubjects' => $masterSubjects,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $teacher = $request->user();

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

        $subject = Subject::create([
            'user_id' => $teacher->id,
            'name' => $data['subject_name'],
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
                $summary = $this->importClasslist($subject, $request->file('classlist'));
            } catch (RuntimeException $exception) {
                $subject->delete();

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

    public function enrollStudent(Request $request, Subject $subject): RedirectResponse
    {
        $this->ensureTeacherOwnsSubject($request->user()->id, $subject);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'lrn' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
        ]);

        $result = $this->persistStudentRecord($subject, array_merge([
            'grade_level' => $subject->grade_level,
            'section' => $subject->section,
            'strand' => $subject->strand,
            'track' => $subject->track,
        ], $data));

        // Prepare flash with generated password if created
        $redirect = redirect()->route('teacher.classes.index')->with('success', 'Student added to class.');

        if (is_array($result) && ! empty($result['password'])) {
            $redirect = $redirect->with('new_student_password', [
                'name' => $data['name'],
                'lrn' => $data['lrn'],
                'email' => $data['email'] ?? null,
                'password' => $result['password'],
            ]);
        }

        return $redirect;
    }

    public function uploadClasslist(Request $request, Subject $subject): RedirectResponse
    {
        $this->ensureTeacherOwnsSubject($request->user()->id, $subject);

        $request->validate([
            'classlist' => 'required|file|mimes:csv,txt,xls,xlsx|max:4096',
        ]);

        try {
            $summary = $this->importClasslist($subject, $request->file('classlist'));
        } catch (RuntimeException $exception) {
            return back()->withErrors(['classlist' => $exception->getMessage()]);
        }

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', 'Classlist uploaded successfully.')
            ->with('import_summary', $summary);
    }

    private function ensureStructureCoversExistingGrades(Subject $subject, array $structure): array
    {
        $assignments = collect($structure['assignments']);

        $existingAssignments = $subject->enrollments
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
        $subject->update(['grade_categories' => $updatedStructure['categories']]);

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

    public function updateGradeStructure(Request $request, Subject $subject): RedirectResponse
    {
        $this->ensureTeacherOwnsSubject($request->user()->id, $subject);

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

        $subject->update([
            'grade_categories' => $structure['categories'],
        ]);

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', 'Grade structure updated.');
    }

    private function importClasslist(Subject $subject, UploadedFile $file): array
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
            $payload['section'] = $payload['section'] ?? $subject->section;
            $payload['strand'] = $payload['strand'] ?? $subject->strand;
            $payload['track'] = $payload['track'] ?? $subject->track;

            if (! empty($payload['lrn'])) {
                if (isset($seenLrns[$payload['lrn']])) {
                    $summary['skipped']++;
                    $summary['errors'][] = "Row {$rowNumber}: Duplicate LRN {$payload['lrn']} detected in this upload.";
                    continue;
                }

                $seenLrns[$payload['lrn']] = true;
            }

            try {
                $result = $this->persistStudentRecord($subject, $payload);
                if ($result['status'] === 'created') {
                    $summary['imported']++;
                } else {
                    $summary['updated']++;
                }

                if (!empty($result['password'])) {
                    $summary['created_students'][] = [
                        'name' => $payload['name'] ?? null,
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

    private function persistStudentRecord(Subject $subject, array $payload): array
    {
        $validator = Validator::make($payload, [
            'name' => 'required|string|max:255',
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
        $fullName = trim($payload['name']);
        [$firstName, $lastName] = $this->splitName($fullName);

        $student = null;

        if ($lrn) {
            $student = Student::where('lrn', $lrn)->first();
        }

        if ($student) {
            $user = $student->user;

            if (! $user) {
                $created = $this->createStudentUser($fullName, $payload['email'] ?? null);
                $user = $created['user'];
                $generatedPlainPassword = $created['password'];
                $student->user()->associate($user);
            } else {
                $user->update(['name' => $fullName]);
            }
        } else {
            $created = $this->createStudentUser($fullName, $payload['email'] ?? null);
            $user = $created['user'];
            $generatedPlainPassword = $created['password'];
            $student = Student::firstOrNew(['user_id' => $user->id]);
        }

        if (! $student->user_id) {
            $student->user_id = $user->id;
        }

        $wasExisting = $student->exists;

        $student->first_name = $firstName;
        $student->last_name = $lastName;
        $student->subject = $subject->name;
        $student->grade = $student->grade ?? 75;
        $student->trend = $student->trend ?? 'Stable';
        $student->avatar = $student->avatar ?? $this->avatarFor($fullName);
        $student->lrn = $lrn;
        $student->grade_level = $payload['grade_level'] ?? $subject->grade_level;
        $student->section = $payload['section'] ?? $subject->section;
        $student->strand = $payload['strand'] ?? $subject->strand;
        $student->track = $payload['track'] ?? $subject->track;

        $student->save();

        Enrollment::firstOrCreate(
            [
                'user_id' => $student->user_id,
                'subject_id' => $subject->id,
            ],
            [
                'risk_status' => 'low',
                'current_grade' => null,
                'current_attendance_rate' => null,
            ]
        );

        return ['status' => $wasExisting ? 'updated' : 'created', 'password' => $generatedPlainPassword ?? null, 'user' => $user];
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
            $payload[$key] = isset($row[$index]) ? trim((string) $row[$index]) : null;
        }

        if (isset($payload['lrn'])) {
            $payload['lrn'] = $this->sanitizeLrn($payload['lrn']);
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

    private function createStudentUser(string $fullName, ?string $preferredEmail = null): array
    {
        $email = strtolower($preferredEmail ?: $this->generateSchoolEmail($fullName));

        $plainPassword = Str::random(12);

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $fullName,
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

    private function ensureTeacherOwnsSubject(int $teacherId, Subject $subject): void
    {
        if ($subject->user_id !== $teacherId) {
            abort(403, 'You are not allowed to modify this class.');
        }
    }

    private function currentSchoolYear(): string
    {
        $year = now()->year;
        $next = $year + 1;

        return sprintf('%d-%d', $year, $next);
    }

    /**
     * Send a nudge notification to all students in a class.
     */
    public function sendNudge(Request $request, Subject $subject): RedirectResponse
    {
        $this->ensureTeacherOwnsSubject($request->user()->id, $subject);

        $data = $request->validate([
            'message' => 'required|string|max:500',
            'title' => 'nullable|string|max:255',
        ]);

        $teacher = $request->user();
        $enrollments = $subject->enrollments()->with('user')->get();

        if ($enrollments->isEmpty()) {
            return back()->with('error', 'No students enrolled in this class.');
        }

        $sentCount = 0;

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

        return back()->with('success', "Nudge sent to {$sentCount} student(s) in {$subject->name}!");
    }

    /**
     * Start or advance the active quarter for the class.
     */
    public function startQuarter(Request $request, Subject $subject): RedirectResponse
    {
        $this->ensureTeacherOwnsSubject($request->user()->id, $subject);

        $data = $request->validate([
            'quarter' => 'required|integer|min:1|max:4',
        ]);

        $quarter = (int) $data['quarter'];

        // Only allow advancing forward, not going backward
        if ($quarter <= ($subject->current_quarter ?? 1)) {
            return back()->with('error', 'Cannot set to a previous or same quarter.');
        }

        $subject->update(['current_quarter' => $quarter]);

        return back()->with('success', "Quarter {$quarter} started for {$subject->name}.");
    }
}

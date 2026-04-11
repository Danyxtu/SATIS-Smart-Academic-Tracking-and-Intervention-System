<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Intervention;
use App\Models\InterventionTask;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentNotification;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\SchoolYearArchiveDetailsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Display system settings.
     */
    public function index(): Response
    {
        $settings = SystemSetting::all()->mapWithKeys(fn($s) => [$s->key => $s->value]);

        // Generate school year options (current year - 2 to current year + 2)
        $currentYear = (int) date('Y');
        $schoolYearOptions = [];
        for ($i = $currentYear - 2; $i <= $currentYear + 2; $i++) {
            $schoolYearOptions[] = "{$i}-" . ($i + 1);
        }

        $currentSY  = $settings['current_school_year'] ?? date('Y') . '-' . (date('Y') + 1);
        $currentSem = (int) ($settings['current_semester'] ?? 1);
        $syStats    = $this->buildSyStats($currentSY, $currentSem);

        // Archive: all distinct school years that have classes, excluding current
        $archiveYears = SchoolClass::select('school_year')
            ->distinct()
            ->where('school_year', '!=', $currentSY)
            ->orderByDesc('school_year')
            ->pluck('school_year');

        $archive = $archiveYears->map(fn($sy) => [
            'school_year' => $sy,
            'stats'       => $this->buildSyStats($sy),
        ])->values();

        $lockKey = "grades_locked_{$currentSY}_{$currentSem}";

        return Inertia::render('SuperAdmin/Settings/Index', [
            'settings' => [
                'current_school_year'   => $currentSY,
                'current_semester'      => (string) $currentSem,
                'enrollment_open'       => filter_var($settings['enrollment_open'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
                'grade_submission_open' => filter_var($settings['grade_submission_open'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
                'grades_locked'         => filter_var($settings[$lockKey] ?? 'false', FILTER_VALIDATE_BOOLEAN),
                'school_name'           => $settings['school_name'] ?? '',
                'school_address'        => $settings['school_address'] ?? '',
            ],
            'schoolYears' => $schoolYearOptions,
            'syStats'     => $syStats,
            'archive'     => $archive,
        ]);
    }

    /**
     * Update academic settings.
     */
    public function updateAcademic(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_semester' => ['required', 'in:1,2'],
        ]);

        $userId = Auth::id();

        SystemSetting::updateOrCreate(
            ['key' => 'current_semester'],
            [
                'value' => $validated['current_semester'],
                'type' => 'integer',
                'group' => 'academic',
                'description' => 'Current semester (1 or 2)',
                'updated_by' => $userId,
            ]
        );

        // Clear cache
        cache()->forget('system_setting_current_semester');

        return back()->with('success', 'Semester updated successfully.');
    }

    /**
     * Update enrollment settings.
     */
    public function updateEnrollment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'enrollment_open' => ['required', 'boolean'],
        ]);

        SystemSetting::updateOrCreate(
            ['key' => 'enrollment_open'],
            [
                'value' => $validated['enrollment_open'] ? 'true' : 'false',
                'type' => 'boolean',
                'group' => 'academic',
                'description' => 'Whether enrollment is currently open',
                'updated_by' => Auth::id(),
            ]
        );

        cache()->forget('system_setting_enrollment_open');

        $status = $validated['enrollment_open'] ? 'opened' : 'closed';
        return back()->with('success', "Enrollment {$status} successfully.");
    }

    /**
     * Update grading settings.
     */
    public function updateGrading(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'grades_locked' => ['required', 'boolean'],
        ]);

        $schoolYear = SystemSetting::getCurrentSchoolYear();
        $semester   = SystemSetting::getCurrentSemester();
        $key        = "grades_locked_{$schoolYear}_{$semester}";

        SystemSetting::updateOrCreate(
            ['key' => $key],
            [
                'value'       => $validated['grades_locked'] ? 'true' : 'false',
                'type'        => 'boolean',
                'group'       => 'academic',
                'description' => "Whether grade editing is locked for {$schoolYear} semester {$semester}",
                'updated_by'  => Auth::id(),
            ]
        );

        cache()->forget("system_setting_{$key}");

        $status = $validated['grades_locked'] ? 'locked' : 'unlocked';
        return back()->with('success', "Grades {$status} successfully.");
    }

    /**
     * Update school information.
     */
    public function updateSchoolInfo(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'school_name' => ['nullable', 'string', 'max:255'],
            'school_address' => ['nullable', 'string', 'max:500'],
        ]);

        $userId = Auth::id();

        SystemSetting::updateOrCreate(
            ['key' => 'school_name'],
            [
                'value' => $validated['school_name'] ?? '',
                'type' => 'string',
                'group' => 'general',
                'description' => 'School name',
                'updated_by' => $userId,
            ]
        );

        SystemSetting::updateOrCreate(
            ['key' => 'school_address'],
            [
                'value' => $validated['school_address'] ?? '',
                'type' => 'string',
                'group' => 'general',
                'description' => 'School address',
                'updated_by' => $userId,
            ]
        );

        cache()->forget('system_setting_school_name');
        cache()->forget('system_setting_school_address');

        return back()->with('success', 'School information updated successfully.');
    }

    /**
     * Create a snapshot archive entry for the current school year.
     */
    public function archiveCurrentSchoolYear(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'new_school_year' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
        ]);

        $oldSY = SystemSetting::getCurrentSchoolYear();
        $newSY = $validated['new_school_year'];

        if ($oldSY === $newSY) {
            return response()->json([
                'message' => 'New school year must be different from the current school year.',
            ], 422);
        }

        $archiveKey = $this->createArchiveSnapshot($oldSY, $newSY, Auth::id());

        return response()->json([
            'message' => "Archive for {$oldSY} created successfully.",
            'archive_key' => $archiveKey,
            'archived_school_year' => $oldSY,
            'new_school_year' => $newSY,
        ]);
    }

    /**
     * End current school year and roll over to a new one.
     * All existing data is preserved (archived by school_year).
     */
    public function rollover(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'new_school_year' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'archive_key' => ['nullable', 'string'],
        ]);

        $newSY              = $validated['new_school_year'];
        $userId             = Auth::id();
        $providedArchiveKey = $validated['archive_key'] ?? null;
        $rolloverSummary    = null;

        if ($providedArchiveKey && !SystemSetting::where('key', $providedArchiveKey)->exists()) {
            return back()->withErrors([
                'new_school_year' => 'Archive creation step was not completed. Please try again.',
            ]);
        }

        DB::transaction(function () use ($newSY, $userId, $providedArchiveKey, &$rolloverSummary) {
            $oldSY   = SystemSetting::getCurrentSchoolYear();
            $oldSem  = SystemSetting::getCurrentSemester();
            $lockKey = "grades_locked_{$oldSY}_{$oldSem}";

            if (!$providedArchiveKey) {
                $this->createArchiveSnapshot($oldSY, $newSY, $userId);
            }

            $rolloverSummary = $this->processSchoolYearTransition($oldSY, $newSY, $userId);

            // Lock grades for the outgoing period
            SystemSetting::updateOrCreate(
                ['key' => $lockKey],
                ['value' => 'true', 'type' => 'boolean', 'group' => 'academic', 'updated_by' => $userId]
            );
            cache()->forget("system_setting_{$lockKey}");

            foreach (
                [
                    ['key' => 'current_school_year',  'value' => $newSY,  'type' => 'string'],
                    ['key' => 'current_semester',      'value' => '1',     'type' => 'integer'],
                    ['key' => 'enrollment_open',       'value' => 'false', 'type' => 'boolean'],
                    ['key' => 'grade_submission_open', 'value' => 'true',  'type' => 'boolean'],
                ] as $s
            ) {
                SystemSetting::updateOrCreate(
                    ['key' => $s['key']],
                    ['value' => $s['value'], 'type' => $s['type'], 'group' => 'academic', 'updated_by' => $userId]
                );
                cache()->forget("system_setting_{$s['key']}");
            }

            if (is_array($rolloverSummary)) {
                SystemSetting::updateOrCreate(
                    ['key' => 'rollover_last_transition'],
                    [
                        'value' => json_encode($rolloverSummary),
                        'type' => 'json',
                        'group' => 'academic',
                        'description' => 'Last school year rollover transition summary',
                        'updated_by' => $userId,
                    ]
                );

                cache()->forget('system_setting_rollover_last_transition');
            }
        });

        return back()
            ->with('success', "Rolled over to {$newSY}. Previous data is archived.")
            ->with('rollover_summary', $rolloverSummary);
    }

    /**
     * Promote Grade 11 -> Grade 12 sections/students and process Grade 12 graduates.
     *
     * @return array<string, mixed>
     */
    private function processSchoolYearTransition(string $oldSY, string $newSY, ?int $userId): array
    {
        $oldSections = Section::query()
            ->where('school_year', $oldSY)
            ->get([
                'id',
                'department_id',
                'advisor_teacher_id',
                'section_name',
                'section_code',
                'cohort',
                'grade_level',
                'strand',
                'track',
                'description',
                'is_active',
            ]);

        $grade11Sections = $oldSections
            ->filter(fn(Section $section): bool => $this->isGradeLevel($section->grade_level, 11))
            ->values();

        $grade12Sections = $oldSections
            ->filter(fn(Section $section): bool => $this->isGradeLevel($section->grade_level, 12))
            ->values();

        $newCohort = $this->resolveCohortFromSchoolYear($newSY);

        $promotedSectionMap = [];
        $grade11Templates = [];

        foreach ($grade11Sections as $grade11Section) {
            $promotedSection = Section::create([
                'department_id' => (int) $grade11Section->department_id,
                'advisor_teacher_id' => $grade11Section->advisor_teacher_id ? (int) $grade11Section->advisor_teacher_id : null,
                'created_by' => $userId,
                'section_name' => $grade11Section->section_name,
                'section_code' => $grade11Section->section_code,
                'cohort' => $newCohort,
                'grade_level' => 'Grade 12',
                'strand' => $grade11Section->strand,
                'track' => $grade11Section->track,
                'school_year' => $newSY,
                'description' => $grade11Section->description,
                'is_active' => true,
            ]);

            $promotedSectionMap[(int) $grade11Section->id] = $promotedSection;

            $grade11Templates[] = [
                'department_id' => (int) $grade11Section->department_id,
                'section_name' => $grade11Section->section_name,
                'section_code' => $grade11Section->section_code,
                'strand' => $grade11Section->strand,
                'track' => $grade11Section->track,
                'description' => $grade11Section->description,
            ];
        }

        $promotedStudentsCount = 0;

        if (!empty($promotedSectionMap)) {
            $grade11Students = Student::query()
                ->with('user:id,status')
                ->whereIn('section_id', array_keys($promotedSectionMap))
                ->get();

            foreach ($grade11Students as $student) {
                $targetSection = $promotedSectionMap[(int) $student->section_id] ?? null;

                if (!$targetSection) {
                    continue;
                }

                $student->update([
                    'grade_level' => 'Grade 12',
                    'section_id' => (int) $targetSection->id,
                    'section' => $targetSection->section_name,
                    'strand' => $targetSection->strand,
                    'track' => $targetSection->track,
                ]);

                if ($student->user && $student->user->status !== 'active') {
                    $student->user->update(['status' => 'active']);
                }

                $promotedStudentsCount++;
            }
        }

        $grade12StudentSectionIds = $grade12Sections->pluck('id')->map(fn($id) => (int) $id)->all();

        $graduatedCount = 0;
        $failedCount = 0;

        if (!empty($grade12StudentSectionIds)) {
            $grade12Students = Student::query()
                ->with('user:id,status')
                ->whereIn('section_id', $grade12StudentSectionIds)
                ->get();

            $grade12UserIds = $grade12Students
                ->pluck('user_id')
                ->filter(fn($id) => $id !== null)
                ->map(fn($id) => (int) $id)
                ->unique()
                ->values();

            $grade12Enrollments = Enrollment::query()
                ->whereIn('user_id', $grade12UserIds)
                ->whereHas('schoolClass', function ($query) use ($oldSY) {
                    $query->where('school_year', $oldSY);
                })
                ->get(['user_id', 'final_grade', 'remarks']);

            $usersWithEnrollments = $grade12Enrollments
                ->pluck('user_id')
                ->map(fn($id) => (int) $id)
                ->unique()
                ->flip();

            $failedUserIds = $grade12Enrollments
                ->filter(fn(Enrollment $enrollment): bool => $this->isFailedEnrollment($enrollment))
                ->pluck('user_id')
                ->map(fn($id) => (int) $id)
                ->unique()
                ->flip();

            foreach ($grade12Students as $student) {
                $studentUserId = $student->user_id ? (int) $student->user_id : null;

                if ($studentUserId === null) {
                    continue;
                }

                $student->update([
                    'section_id' => null,
                    'section' => null,
                ]);

                if (!$student->user) {
                    continue;
                }

                $hasEnrollment = $usersWithEnrollments->has($studentUserId);
                $hasFailedEnrollment = $failedUserIds->has($studentUserId);

                if ($hasFailedEnrollment || !$hasEnrollment) {
                    if ($student->user->status !== 'active') {
                        $student->user->update(['status' => 'active']);
                    }

                    if ($hasFailedEnrollment) {
                        $failedCount++;
                    }

                    continue;
                }

                if ($student->user->status !== 'inactive') {
                    $student->user->update(['status' => 'inactive']);
                }

                $graduatedCount++;
            }
        }

        return [
            'old_school_year' => $oldSY,
            'new_school_year' => $newSY,
            'promoted_sections_count' => count($promotedSectionMap),
            'promoted_students_count' => $promotedStudentsCount,
            'graduated_students_count' => $graduatedCount,
            'failed_students_count' => $failedCount,
            'grade11_templates' => array_values($grade11Templates),
            'processed_at' => now()->toIso8601String(),
        ];
    }

    private function isGradeLevel(?string $gradeLevel, int $targetGrade): bool
    {
        if (!is_string($gradeLevel) || trim($gradeLevel) === '') {
            return false;
        }

        return preg_match('/\b' . preg_quote((string) $targetGrade, '/') . '\b/', $gradeLevel) === 1;
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

    private function isFailedEnrollment(Enrollment $enrollment): bool
    {
        $remarks = Str::lower(trim((string) ($enrollment->remarks ?? '')));

        if ($remarks === 'failed') {
            return true;
        }

        if ($enrollment->final_grade === null) {
            return false;
        }

        return (int) $enrollment->final_grade < 75;
    }

    private function createArchiveSnapshot(string $oldSY, string $newSY, ?int $userId): string
    {
        $classIds = SchoolClass::where('school_year', $oldSY)->pluck('id');
        $enrollmentIds = Enrollment::whereIn('class_id', $classIds)->pluck('id');
        $interventionIds = Intervention::whereIn('enrollment_id', $enrollmentIds)->pluck('id');
        $details = app(SchoolYearArchiveDetailsService::class)->build($oldSY);

        $snapshot = [
            'school_year' => $oldSY,
            'next_school_year' => $newSY,
            'semester' => SystemSetting::getCurrentSemester(),
            'stats' => $this->buildSyStats($oldSY),
            'details' => $details,
            'totals' => [
                'classes' => (int) $classIds->count(),
                'enrollments' => (int) $enrollmentIds->count(),
                'grades' => (int) Grade::whereIn('enrollment_id', $enrollmentIds)->count(),
                'attendance_records' => (int) AttendanceRecord::whereIn('enrollment_id', $enrollmentIds)->count(),
                'interventions' => (int) $interventionIds->count(),
                'intervention_tasks' => (int) InterventionTask::whereIn('intervention_id', $interventionIds)->count(),
                'student_notifications' => (int) StudentNotification::whereIn('intervention_id', $interventionIds)->count(),
            ],
            'created_at' => now()->toIso8601String(),
        ];

        $safeSchoolYear = str_replace('-', '_', $oldSY);
        $archiveKey = 'school_year_archive_snapshot_' . $safeSchoolYear . '_' . now()->format('YmdHis') . '_' . Str::lower(Str::random(6));

        SystemSetting::create([
            'key' => $archiveKey,
            'value' => json_encode($snapshot),
            'type' => 'json',
            'group' => 'academic',
            'description' => "Archive snapshot for {$oldSY} before rollover to {$newSY}",
            'updated_by' => $userId,
        ]);

        cache()->forget("system_setting_{$archiveKey}");

        return $archiveKey;
    }

    /**
     * Return stats for any school year as JSON (archive viewer).
     */
    public function archiveStats(Request $request): JsonResponse
    {
        $sy = $request->query('sy', '');
        return response()->json($this->buildSyStats($sy));
    }

    private function buildSyStats(string $schoolYear, ?int $semester = null): array
    {
        $classQuery = SchoolClass::where('school_year', $schoolYear);
        $semQuery   = $semester ? (clone $classQuery)->where('semester', $semester) : clone $classQuery;
        $classIds   = $semQuery->pluck('id');

        $students = Enrollment::whereIn('class_id', $classIds)
            ->distinct('user_id')->count('user_id');

        $teachers = SchoolClass::where('school_year', $schoolYear)
            ->distinct('teacher_id')->count('teacher_id');

        $departments = Department::withCount([
            'users as admins_count' => fn($q) => $q->whereHas('roles', fn($r) => $r->where('name', 'admin')),
        ])->get()->map(fn($d) => [
            'id'          => $d->id,
            'name'        => $d->department_name,
            'code'        => $d->department_code,
            'is_active'   => (bool) $d->is_active,
            'admins_count' => (int) $d->admins_count,
        ])->values();

        return [
            'school_year'      => $schoolYear,
            'semester'         => $semester,
            'students'         => $students,
            'active_classes'   => $semQuery->count(),
            'teachers'         => $teachers,
            'departments'      => $departments->count(),
            'departments_list' => $departments,
            'admins'           => User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->count(),
        ];
    }

    /**
     * Update all settings at once.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_school_year' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'current_semester' => ['required', 'in:1,2'],
            'enrollment_open' => ['boolean'],
            'grade_submission_open' => ['boolean'],
            'school_name' => ['nullable', 'string', 'max:255'],
            'school_address' => ['nullable', 'string', 'max:500'],
        ]);

        $userId = Auth::id();

        // Academic settings
        SystemSetting::updateOrCreate(
            ['key' => 'current_school_year'],
            [
                'value' => $validated['current_school_year'],
                'type' => 'string',
                'group' => 'academic',
                'description' => 'Current school year',
                'updated_by' => $userId,
            ]
        );

        SystemSetting::updateOrCreate(
            ['key' => 'current_semester'],
            [
                'value' => $validated['current_semester'],
                'type' => 'integer',
                'group' => 'academic',
                'description' => 'Current semester (1 or 2)',
                'updated_by' => $userId,
            ]
        );

        // Enrollment settings
        SystemSetting::updateOrCreate(
            ['key' => 'enrollment_open'],
            [
                'value' => ($validated['enrollment_open'] ?? false) ? 'true' : 'false',
                'type' => 'boolean',
                'group' => 'academic',
                'description' => 'Whether enrollment is currently open',
                'updated_by' => $userId,
            ]
        );

        // Grading settings
        SystemSetting::updateOrCreate(
            ['key' => 'grade_submission_open'],
            [
                'value' => ($validated['grade_submission_open'] ?? false) ? 'true' : 'false',
                'type' => 'boolean',
                'group' => 'academic',
                'description' => 'Whether grade submission is open',
                'updated_by' => $userId,
            ]
        );

        // School info
        SystemSetting::updateOrCreate(
            ['key' => 'school_name'],
            [
                'value' => $validated['school_name'] ?? '',
                'type' => 'string',
                'group' => 'general',
                'description' => 'School name',
                'updated_by' => $userId,
            ]
        );

        SystemSetting::updateOrCreate(
            ['key' => 'school_address'],
            [
                'value' => $validated['school_address'] ?? '',
                'type' => 'string',
                'group' => 'general',
                'description' => 'School address',
                'updated_by' => $userId,
            ]
        );

        // Clear all related cache
        cache()->forget('system_setting_current_school_year');
        cache()->forget('system_setting_current_semester');
        cache()->forget('system_setting_enrollment_open');
        cache()->forget('system_setting_grade_submission_open');
        cache()->forget('system_setting_school_name');
        cache()->forget('system_setting_school_address');

        return back()->with('success', 'Settings updated successfully.');
    }
}

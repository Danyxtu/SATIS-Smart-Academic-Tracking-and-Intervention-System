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

        if ($providedArchiveKey && !SystemSetting::where('key', $providedArchiveKey)->exists()) {
            return back()->withErrors([
                'new_school_year' => 'Archive creation step was not completed. Please try again.',
            ]);
        }

        DB::transaction(function () use ($newSY, $userId, $providedArchiveKey) {
            $oldSY   = SystemSetting::getCurrentSchoolYear();
            $oldSem  = SystemSetting::getCurrentSemester();
            $lockKey = "grades_locked_{$oldSY}_{$oldSem}";

            if (!$providedArchiveKey) {
                $this->createArchiveSnapshot($oldSY, $newSY, $userId);
            }

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
        });

        return back()->with('success', "Rolled over to {$newSY}. Previous data is archived.");
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

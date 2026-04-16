<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\SchoolPersonnel;
use App\Models\Section;
use App\Models\Student;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\SuperAdmin\SchoolYearArchiveSnapshotService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
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

        $schoolPersonnel = SchoolPersonnel::query()
            ->orderByRaw("CASE position WHEN 'Principal' THEN 1 WHEN 'Guidance Counselor' THEN 2 ELSE 3 END")
            ->orderBy('last_name')
            ->get([
                'id',
                'position',
                'first_name',
                'middle_name',
                'last_name',
                'email',
                'phone_number',
            ])
            ->map(fn(SchoolPersonnel $person) => [
                'id' => (int) $person->id,
                'position' => (string) $person->position,
                'first_name' => (string) $person->first_name,
                'middle_name' => $person->middle_name,
                'last_name' => (string) $person->last_name,
                'email' => $person->email,
                'phone_number' => $person->phone_number,
            ])
            ->values();

        // Generate school year options (current year - 2 to current year + 2)
        $currentYear = (int) date('Y');
        $schoolYearOptions = [];
        for ($i = $currentYear - 2; $i <= $currentYear + 2; $i++) {
            $schoolYearOptions[] = "{$i}-" . ($i + 1);
        }

        $currentSY  = $settings['current_school_year'] ?? date('Y') . '-' . (date('Y') + 1);
        $currentSem = (int) ($settings['current_semester'] ?? 1);
        $syStats    = $this->buildSyStats($currentSY, $currentSem);

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
            'schoolPersonnel' => $schoolPersonnel,
            'schoolYears' => $schoolYearOptions,
            'syStats'     => $syStats,
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
     * Store school personnel.
     */
    public function storeSchoolPersonnel(Request $request): RedirectResponse
    {
        $validated = $this->validateSchoolPersonnelPayload($request);

        SchoolPersonnel::query()->create($validated);

        return back()->with('success', 'School personnel added successfully.');
    }

    /**
     * Update school personnel.
     */
    public function updateSchoolPersonnel(Request $request, SchoolPersonnel $schoolPersonnel): RedirectResponse
    {
        $validated = $this->validateSchoolPersonnelPayload($request, (int) $schoolPersonnel->id);

        $schoolPersonnel->update($validated);

        return back()->with('success', 'School personnel updated successfully.');
    }

    /**
     * Delete school personnel.
     */
    public function destroySchoolPersonnel(SchoolPersonnel $schoolPersonnel): RedirectResponse
    {
        $schoolPersonnel->delete();

        return back()->with('success', 'School personnel removed successfully.');
    }

    /**
     * End current school year and roll over to a new one.
     * All existing data remains preserved by school year.
     */
    public function rollover(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'new_school_year' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
        ]);

        $newSY = $validated['new_school_year'];
        $userId = Auth::id();
        $snapshotService = app(SchoolYearArchiveSnapshotService::class);

        $rolloverSummary = DB::transaction(function () use ($newSY, $userId, $snapshotService) {
            $oldSY   = SystemSetting::getCurrentSchoolYear();
            $oldSem  = SystemSetting::getCurrentSemester();
            $lockKey = "grades_locked_{$oldSY}_{$oldSem}";

            $archive = $snapshotService->capture($oldSY, $newSY, $userId);

            $grade11Sections = Section::query()
                ->where('school_year', $oldSY)
                ->where('grade_level', '11')
                ->get();

            $grade11Templates = $grade11Sections
                ->map(fn(Section $section) => [
                    'department_id' => (int) $section->department_id,
                    'section_name' => satis_extract_section_base_name($section->section_name) ?? $section->section_name,
                    'section_code' => $section->section_code,
                    'strand' => $section->strand,
                    'track' => $section->track,
                    'description' => $section->description,
                ])
                ->values()
                ->all();

            $promotedSectionMap = [];
            $promotedSectionsCount = 0;
            $departmentCodesById = Department::query()
                ->pluck('department_code', 'id');

            foreach ($grade11Sections as $grade11Section) {
                $sectionName = satis_extract_section_base_name($grade11Section->section_name)
                    ?? $grade11Section->section_name;
                $sectionSpecialization = satis_normalize_whitespace($grade11Section->strand)
                    ?? satis_normalize_whitespace((string) $departmentCodesById->get((int) $grade11Section->department_id));
                $baseSectionCode = satis_generate_section_code(
                    '12',
                    $sectionSpecialization,
                    $sectionName,
                );

                $promotedSection = Section::query()
                    ->where('department_id', (int) $grade11Section->department_id)
                    ->where('school_year', $newSY)
                    ->where('grade_level', '12')
                    ->where(function ($query) use ($grade11Section, $sectionName): void {
                        $query
                            ->whereRaw('UPPER(section_name) = ?', [strtoupper((string) $sectionName)])
                            ->orWhere('section_code', $grade11Section->section_code);
                    })
                    ->first();

                if ($promotedSection) {
                    $sectionCode = $this->ensureUniqueSectionCode(
                        (int) $grade11Section->department_id,
                        $newSY,
                        $baseSectionCode,
                        (int) $promotedSection->id,
                    );

                    $promotedSection->update([
                        'advisor_teacher_id' => $grade11Section->advisor_teacher_id,
                        'section_name' => $sectionName,
                        'section_code' => $sectionCode,
                        'grade_level' => '12',
                        'strand' => $sectionSpecialization,
                        'track' => $grade11Section->track,
                        'school_year' => $newSY,
                        'description' => $grade11Section->description,
                        'is_active' => true,
                    ]);
                } else {
                    $sectionCode = $this->ensureUniqueSectionCode(
                        (int) $grade11Section->department_id,
                        $newSY,
                        $baseSectionCode,
                    );

                    $promotedSection = Section::query()->create([
                        'department_id' => (int) $grade11Section->department_id,
                        'advisor_teacher_id' => $grade11Section->advisor_teacher_id,
                        'created_by' => $userId,
                        'section_name' => $sectionName,
                        'section_code' => $sectionCode,
                        'grade_level' => '12',
                        'strand' => $sectionSpecialization,
                        'track' => $grade11Section->track,
                        'school_year' => $newSY,
                        'description' => $grade11Section->description,
                        'is_active' => true,
                    ]);

                    $promotedSectionsCount++;
                }

                $promotedSectionMap[(int) $grade11Section->id] = (int) $promotedSection->id;
            }

            $promotedStudentsCount = 0;

            if ($promotedSectionMap !== []) {
                $grade11Students = Student::query()
                    ->whereIn('section_id', array_keys($promotedSectionMap))
                    ->get();

                foreach ($grade11Students as $student) {
                    $newSectionId = $promotedSectionMap[(int) $student->section_id] ?? null;

                    if (! $newSectionId) {
                        continue;
                    }

                    $student->update([
                        'grade_level' => '12',
                        'section_id' => $newSectionId,
                    ]);

                    $promotedStudentsCount++;
                }
            }

            $grade12SectionIds = Section::query()
                ->where('school_year', $oldSY)
                ->where('grade_level', '12')
                ->pluck('id');

            $grade12Students = Student::query()
                ->when(
                    $grade12SectionIds->isNotEmpty(),
                    fn($query) => $query->whereIn('section_id', $grade12SectionIds),
                    fn($query) => $query->whereRaw('1 = 0'),
                )
                ->get(['id', 'user_id']);

            $grade12UserIds = $grade12Students
                ->pluck('user_id')
                ->filter()
                ->map(fn($id) => (int) $id)
                ->unique()
                ->values();

            $enrolledGrade12UserIds = collect();
            $failedGrade12UserIds = collect();

            if ($grade12UserIds->isNotEmpty()) {
                $enrolledGrade12UserIds = Enrollment::query()
                    ->whereIn('user_id', $grade12UserIds)
                    ->whereHas('schoolClass', function ($query) use ($oldSY) {
                        $query->where('school_year', $oldSY);
                    })
                    ->pluck('user_id')
                    ->map(fn($id) => (int) $id)
                    ->unique()
                    ->values();

                $failedGrade12UserIds = Enrollment::query()
                    ->whereIn('user_id', $grade12UserIds)
                    ->whereHas('schoolClass', function ($query) use ($oldSY) {
                        $query->where('school_year', $oldSY);
                    })
                    ->where(function ($query) {
                        $query
                            ->whereRaw("LOWER(COALESCE(remarks, '')) = ?", ['failed'])
                            ->orWhere('final_grade', '<', 75);
                    })
                    ->pluck('user_id')
                    ->map(fn($id) => (int) $id)
                    ->unique()
                    ->values();
            }

            $graduatedUserIds = $enrolledGrade12UserIds->diff($failedGrade12UserIds)->values();
            $graduatedStudentsCount = $graduatedUserIds->count();
            $failedStudentsCount = $failedGrade12UserIds->count();

            if ($graduatedUserIds->isNotEmpty()) {
                User::query()
                    ->whereIn('id', $graduatedUserIds)
                    ->update(['status' => 'inactive']);
            }

            if ($grade12Students->isNotEmpty()) {
                Student::query()
                    ->whereIn('id', $grade12Students->pluck('id'))
                    ->update([
                        'section_id' => null,
                        'section' => null,
                    ]);
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

            SystemSetting::updateOrCreate(
                ['key' => 'rollover_last_transition'],
                [
                    'value' => json_encode([
                        'old_school_year' => $oldSY,
                        'new_school_year' => $newSY,
                        'promoted_sections_count' => $promotedSectionsCount,
                        'promoted_students_count' => $promotedStudentsCount,
                        'graduated_students_count' => $graduatedStudentsCount,
                        'failed_students_count' => $failedStudentsCount,
                        'grade11_templates' => $grade11Templates,
                    ]),
                    'type' => 'json',
                    'group' => 'academic',
                    'description' => 'Latest school year rollover summary and grade 11 template source.',
                    'updated_by' => $userId,
                ]
            );
            cache()->forget('system_setting_rollover_last_transition');

            return [
                'archive_key' => $archive->archive_key,
                'promoted_sections_count' => $promotedSectionsCount,
                'promoted_students_count' => $promotedStudentsCount,
                'graduated_students_count' => $graduatedStudentsCount,
                'failed_students_count' => $failedStudentsCount,
            ];
        });

        return back()
            ->with('success', "Rolled over to {$newSY} successfully.")
            ->with('rollover_summary', $rolloverSummary);
    }

    private function ensureUniqueSectionCode(
        int $departmentId,
        string $schoolYear,
        string $baseCode,
        ?int $ignoreSectionId = null,
    ): string {
        $counter = 1;
        $candidate = $baseCode;

        while (true) {
            $query = Section::query()
                ->where('department_id', $departmentId)
                ->where('school_year', $schoolYear)
                ->where('section_code', $candidate);

            if ($ignoreSectionId !== null) {
                $query->where('id', '!=', $ignoreSectionId);
            }

            if (! $query->exists()) {
                break;
            }

            $counter++;
            $candidate = $baseCode . '-' . $counter;
        }

        return $candidate;
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

    private function validateSchoolPersonnelPayload(Request $request, ?int $ignoreId = null): array
    {
        $position = trim((string) $request->input('position', ''));
        $firstName = trim((string) $request->input('first_name', ''));
        $middleName = trim((string) $request->input('middle_name', ''));
        $lastName = trim((string) $request->input('last_name', ''));
        $email = trim((string) $request->input('email', ''));
        $phoneNumber = trim((string) $request->input('phone_number', ''));

        $request->merge([
            'position' => $position,
            'first_name' => $firstName,
            'middle_name' => $middleName !== '' ? $middleName : null,
            'last_name' => $lastName,
            'email' => $email !== '' ? $email : null,
            'phone_number' => $phoneNumber !== '' ? $phoneNumber : null,
        ]);

        $emailUniqueRule = Rule::unique('school_personnels', 'email');
        if ($ignoreId !== null) {
            $emailUniqueRule = $emailUniqueRule->ignore($ignoreId);
        }

        return $request->validate([
            'position' => ['required', 'string', 'max:100'],
            'first_name' => ['required', 'string', 'max:120'],
            'middle_name' => ['nullable', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:255', $emailUniqueRule],
            'phone_number' => ['nullable', 'string', 'max:30'],
        ]);
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

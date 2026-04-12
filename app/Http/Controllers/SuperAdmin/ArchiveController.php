<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ArchiveClass;
use App\Models\ArchiveDepartment;
use App\Models\ArchiveEnrollment;
use App\Models\ArchiveGradeItem;
use App\Models\ArchiveSection;
use App\Models\ArchiveUser;
use App\Models\AuditLog;
use App\Models\SchoolYearArchive;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ArchiveController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'archive' => ['nullable', 'string', 'max:96'],
            'tab' => ['nullable', 'string', 'in:students,teachers,super-admins,departments,classes,activity-logs'],
            'semester' => ['nullable', 'string', 'in:all,1,2'],
            'search' => ['nullable', 'string', 'max:120'],
            'grade_level' => ['nullable', 'string', 'in:11,12'],
            'section' => ['nullable', 'string', 'max:120'],
            'strand' => ['nullable', 'string', 'max:120'],
            'department' => ['nullable', 'string', 'max:120'],
            'track' => ['nullable', 'string', 'in:Academic,TVL'],
            'class_grade_level' => ['nullable', 'string', 'in:11,12'],
            'audit_role' => ['nullable', 'string', 'in:super_admin,admin,teacher,student'],
        ]);

        $tab = (string) ($validated['tab'] ?? 'students');
        $semester = (string) ($validated['semester'] ?? 'all');
        $semesterInt = $semester === 'all' ? null : (int) $semester;

        $archives = SchoolYearArchive::query()
            ->orderByDesc('school_year')
            ->get([
                'id',
                'archive_key',
                'school_year',
                'next_school_year',
                'captured_at',
            ]);

        $requestedArchiveKey = (string) ($validated['archive'] ?? '');
        $selectedArchive = null;

        if ($requestedArchiveKey !== '' && $archives->isNotEmpty()) {
            $matchedArchive = $archives->firstWhere('archive_key', $requestedArchiveKey);

            if ($matchedArchive) {
                $selectedArchive = SchoolYearArchive::query()
                    ->where('archive_key', $matchedArchive->archive_key)
                    ->first();
            }
        }

        $panelData = [
            'rows' => null,
        ];

        $summary = [
            'students' => 0,
            'teachers' => 0,
            'super_admins' => 0,
            'departments' => 0,
            'classes' => 0,
            'audit_logs' => 0,
        ];

        $options = [
            'student_filters' => [
                'grade_levels' => [],
                'sections_by_grade' => [],
                'strands_by_grade_section' => [],
            ],
            'department_codes' => [],
            'tracks' => [],
        ];

        if ($selectedArchive) {
            $summary = $this->buildSummary($selectedArchive, $semesterInt);
            $options = $this->buildOptions($selectedArchive, $semesterInt);

            $panelData = match ($tab) {
                'students' => $this->studentsPanel($selectedArchive, $validated, $semesterInt),
                'teachers' => $this->teachersPanel($selectedArchive, $validated, $semesterInt),
                'super-admins' => $this->superAdminsPanel($selectedArchive, $validated),
                'departments' => $this->departmentsPanel($selectedArchive, $validated),
                'classes' => $this->classesPanel($selectedArchive, $validated, $semesterInt),
                'activity-logs' => $this->auditLogsPanel($selectedArchive, $validated, $semesterInt),
                default => $this->studentsPanel($selectedArchive, $validated, $semesterInt),
            };
        }

        return Inertia::render('SuperAdmin/Archive/Index', [
            'archives' => $archives,
            'selectedArchive' => $selectedArchive ? [
                'archive_key' => $selectedArchive->archive_key,
                'school_year' => $selectedArchive->school_year,
                'next_school_year' => $selectedArchive->next_school_year,
                'captured_at' => $selectedArchive->captured_at,
            ] : null,
            'summary' => $summary,
            'options' => $options,
            'panelData' => $panelData,
            'filters' => [
                'archive' => $selectedArchive?->archive_key ?? '',
                'tab' => $tab,
                'semester' => $semester,
                'search' => (string) ($validated['search'] ?? ''),
                'grade_level' => (string) ($validated['grade_level'] ?? ''),
                'section' => (string) ($validated['section'] ?? ''),
                'strand' => (string) ($validated['strand'] ?? ''),
                'department' => (string) ($validated['department'] ?? ''),
                'track' => (string) ($validated['track'] ?? ''),
                'class_grade_level' => (string) ($validated['class_grade_level'] ?? ''),
                'audit_role' => (string) ($validated['audit_role'] ?? ''),
            ],
        ]);
    }

    public function studentShow(Request $request, SchoolYearArchive $archive, int $studentUserId): JsonResponse
    {
        $validated = $request->validate([
            'semester' => ['nullable', 'string', 'in:all,1,2'],
        ]);

        $semester = (string) ($validated['semester'] ?? 'all');

        $semesterInt = $semester === 'all' ? null : (int) $semester;

        $query = ArchiveEnrollment::query()
            ->where('school_year_archive_id', $archive->id)
            ->where('student_user_id', $studentUserId)
            ->with('archiveClass');

        if ($semesterInt !== null) {
            $query->whereHas('archiveClass', fn($builder) => $builder->where('semester', $semesterInt));
        }

        $enrollments = $query->orderBy('student_name')->get();

        if ($enrollments->isEmpty()) {
            return response()->json(['message' => 'Archived student not found.'], 404);
        }

        $student = ArchiveUser::query()
            ->where('school_year_archive_id', $archive->id)
            ->where('original_user_id', $studentUserId)
            ->first();

        $classes = $enrollments
            ->map(function (ArchiveEnrollment $enrollment): array {
                $archiveClass = $enrollment->archiveClass;

                return [
                    'id' => $archiveClass?->id,
                    'subject_name' => $archiveClass?->subject_name,
                    'subject_code' => $archiveClass?->subject_code,
                    'teacher_name' => $archiveClass?->teacher_name,
                    'section_name' => $archiveClass?->section_name,
                    'strand' => $archiveClass?->strand,
                    'track' => $archiveClass?->track,
                    'semester' => $archiveClass?->semester,
                    'q1_grade' => $enrollment->q1_grade,
                    'q2_grade' => $enrollment->q2_grade,
                    'final_grade' => $enrollment->final_grade,
                    'remarks' => $enrollment->remarks,
                ];
            })
            ->values();

        return response()->json([
            'student' => [
                'user_id' => $studentUserId,
                'name' => $student?->name ?? $enrollments->first()->student_name,
                'username' => $student?->username ?? $enrollments->first()->student_username,
                'personal_email' => $student?->personal_email,
                'roles' => $student?->roles_json ?? ['student'],
                'grade_level' => $enrollments->first()->grade_level,
                'section_name' => $enrollments->first()->section_name,
                'strand' => $enrollments->first()->strand,
                'track' => $enrollments->first()->track,
                'lrn' => $enrollments->first()->student_lrn,
            ],
            'classes' => $classes,
        ]);
    }

    public function studentClassShow(SchoolYearArchive $archive, int $studentUserId, ArchiveClass $archiveClass): JsonResponse
    {
        if ((int) $archiveClass->school_year_archive_id !== (int) $archive->id) {
            abort(404);
        }

        $enrollment = ArchiveEnrollment::query()
            ->where('school_year_archive_id', $archive->id)
            ->where('archive_class_id', $archiveClass->id)
            ->where('student_user_id', $studentUserId)
            ->first();

        if (! $enrollment) {
            return response()->json(['message' => 'Archived student class data not found.'], 404);
        }

        return response()->json([
            'class' => [
                'id' => $archiveClass->id,
                'subject_name' => $archiveClass->subject_name,
                'subject_code' => $archiveClass->subject_code,
                'teacher_name' => $archiveClass->teacher_name,
                'section_name' => $archiveClass->section_name,
                'strand' => $archiveClass->strand,
                'track' => $archiveClass->track,
                'semester' => $archiveClass->semester,
            ],
            'grades' => $this->buildEnrollmentBreakdown($enrollment),
        ]);
    }

    public function teacherShow(Request $request, SchoolYearArchive $archive, int $teacherUserId): JsonResponse
    {
        $validated = $request->validate([
            'semester' => ['nullable', 'string', 'in:all,1,2'],
        ]);

        $semester = (string) ($validated['semester'] ?? 'all');

        $semesterInt = $semester === 'all' ? null : (int) $semester;

        $classQuery = ArchiveClass::query()
            ->where('school_year_archive_id', $archive->id)
            ->where('teacher_user_id', $teacherUserId);

        if ($semesterInt !== null) {
            $classQuery->where('semester', $semesterInt);
        }

        $classes = $classQuery->orderBy('subject_name')->get();

        if ($classes->isEmpty()) {
            return response()->json(['message' => 'Archived teacher not found.'], 404);
        }

        $teacher = ArchiveUser::query()
            ->where('school_year_archive_id', $archive->id)
            ->where('original_user_id', $teacherUserId)
            ->first();

        $classIds = $classes->pluck('id');

        $enrollmentsByClass = ArchiveEnrollment::query()
            ->where('school_year_archive_id', $archive->id)
            ->whereIn('archive_class_id', $classIds)
            ->get()
            ->groupBy('archive_class_id');

        $classRows = $classes->map(function (ArchiveClass $archiveClass) use ($enrollmentsByClass): array {
            $rows = $enrollmentsByClass->get($archiveClass->id, collect());
            $passed = $rows->where('passed', true)->count();
            $failed = $rows->where('passed', false)->count();

            return [
                'id' => $archiveClass->id,
                'subject_name' => $archiveClass->subject_name,
                'subject_code' => $archiveClass->subject_code,
                'section_name' => $archiveClass->section_name,
                'grade_level' => $archiveClass->grade_level,
                'strand' => $archiveClass->strand,
                'track' => $archiveClass->track,
                'semester' => $archiveClass->semester,
                'students_total' => $rows->count(),
                'passed_count' => $passed,
                'failed_count' => $failed,
            ];
        })->values();

        return response()->json([
            'teacher' => [
                'user_id' => $teacherUserId,
                'name' => $teacher?->name ?? $classes->first()->teacher_name,
                'username' => $teacher?->username,
                'personal_email' => $teacher?->personal_email,
                'roles' => $teacher?->roles_json ?? ['teacher'],
                'department_code' => $teacher?->department_code ?? $classes->first()->teacher_department_code,
                'department_name' => $teacher?->department_name ?? $classes->first()->teacher_department_name,
            ],
            'classes' => $classRows,
        ]);
    }

    public function teacherClassShow(SchoolYearArchive $archive, int $teacherUserId, ArchiveClass $archiveClass): JsonResponse
    {
        if ((int) $archiveClass->school_year_archive_id !== (int) $archive->id) {
            abort(404);
        }

        if ((int) $archiveClass->teacher_user_id !== (int) $teacherUserId) {
            abort(404);
        }

        return $this->buildArchiveClassDetailsResponse($archiveClass, $archive->id);
    }

    public function departmentShow(SchoolYearArchive $archive, ArchiveDepartment $archiveDepartment): JsonResponse
    {
        if ((int) $archiveDepartment->school_year_archive_id !== (int) $archive->id) {
            abort(404);
        }

        $sections = ArchiveSection::query()
            ->where('school_year_archive_id', $archive->id)
            ->where('department_code', $archiveDepartment->department_code)
            ->orderBy('grade_level')
            ->orderBy('section_name')
            ->get([
                'id',
                'section_name',
                'section_code',
                'grade_level',
                'strand',
                'track',
                'advisor_name',
            ]);

        $classesCount = ArchiveClass::query()
            ->where('school_year_archive_id', $archive->id)
            ->where(function ($builder) use ($archiveDepartment): void {
                $builder
                    ->where('teacher_department_code', $archiveDepartment->department_code)
                    ->orWhere('track', $archiveDepartment->track);
            })
            ->count();

        return response()->json([
            'department' => [
                'id' => $archiveDepartment->id,
                'name' => $archiveDepartment->department_name,
                'code' => $archiveDepartment->department_code,
                'track' => $archiveDepartment->track,
                'description' => $archiveDepartment->description,
                'is_active' => (bool) $archiveDepartment->is_active,
                'specializations' => $archiveDepartment->specializations_json ?? [],
                'admins' => $archiveDepartment->admins_json ?? [],
                'teachers' => $archiveDepartment->teachers_json ?? [],
                'classes_count' => $classesCount,
            ],
            'sections' => $sections,
        ]);
    }

    public function classShow(SchoolYearArchive $archive, ArchiveClass $archiveClass): JsonResponse
    {
        if ((int) $archiveClass->school_year_archive_id !== (int) $archive->id) {
            abort(404);
        }

        return $this->buildArchiveClassDetailsResponse($archiveClass, $archive->id);
    }

    private function studentsPanel(SchoolYearArchive $archive, array $filters, ?int $semester): array
    {
        $query = ArchiveEnrollment::query()
            ->where('school_year_archive_id', $archive->id);

        if ($semester !== null) {
            $query->whereHas('archiveClass', fn($builder) => $builder->where('semester', $semester));
        }

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('student_name', 'like', "%{$search}%")
                    ->orWhere('student_username', 'like', "%{$search}%")
                    ->orWhere('student_lrn', 'like', "%{$search}%")
                    ->orWhere('section_name', 'like', "%{$search}%")
                    ->orWhere('strand', 'like', "%{$search}%");
            });
        }

        if (($filters['grade_level'] ?? '') !== '') {
            $query->where('grade_level', $filters['grade_level']);
        }

        if (($filters['section'] ?? '') !== '') {
            $query->where('section_name', $filters['section']);
        }

        if (($filters['strand'] ?? '') !== '') {
            $query->where('strand', $filters['strand']);
        }

        $rows = $query
            ->selectRaw('student_user_id, student_name, student_username, student_lrn, grade_level, section_name, strand, track, COUNT(*) as classes_count, AVG(final_grade) as average_grade')
            ->groupBy([
                'student_user_id',
                'student_name',
                'student_username',
                'student_lrn',
                'grade_level',
                'section_name',
                'strand',
                'track',
            ])
            ->orderBy('grade_level')
            ->orderBy('section_name')
            ->orderBy('student_name')
            ->paginate(15)
            ->withQueryString();

        $semesterLabelsByStudent = [];

        if ($semester !== null) {
            $fixedLabel = $this->semesterLabel($semester);

            foreach ($rows->getCollection() as $row) {
                $semesterLabelsByStudent[(int) $row->student_user_id] = $fixedLabel;
            }
        } else {
            $studentUserIds = $rows->getCollection()
                ->pluck('student_user_id')
                ->map(fn($value): int => (int) $value)
                ->filter(fn(int $value): bool => $value > 0)
                ->unique()
                ->values();

            if ($studentUserIds->isNotEmpty()) {
                $semesterMap = ArchiveEnrollment::query()
                    ->where('school_year_archive_id', $archive->id)
                    ->whereIn('student_user_id', $studentUserIds)
                    ->with('archiveClass:id,semester')
                    ->get()
                    ->groupBy('student_user_id')
                    ->map(function (Collection $group): string {
                        $semesters = $group
                            ->map(fn(ArchiveEnrollment $enrollment): ?int => $enrollment->archiveClass?->semester)
                            ->filter(fn($value): bool => in_array((int) $value, [1, 2], true))
                            ->map(fn($value): int => (int) $value)
                            ->unique()
                            ->sort()
                            ->values()
                            ->all();

                        return $this->semesterListLabel($semesters);
                    });

                $semesterLabelsByStudent = $semesterMap
                    ->mapWithKeys(fn(string $label, $studentUserId): array => [(int) $studentUserId => $label])
                    ->all();
            }
        }

        $rows->setCollection($rows->getCollection()->map(function ($row) use ($semesterLabelsByStudent): array {
            $studentUserId = (int) $row->student_user_id;

            return [
                'student_user_id' => $studentUserId,
                'student_name' => $row->student_name,
                'student_username' => $row->student_username,
                'student_lrn' => $row->student_lrn,
                'grade_level' => $row->grade_level,
                'section_name' => $row->section_name,
                'strand' => $row->strand,
                'track' => $row->track,
                'semester_label' => $semesterLabelsByStudent[$studentUserId] ?? '-',
                'classes_count' => (int) $row->classes_count,
                'average_grade' => $row->average_grade !== null ? (int) round((float) $row->average_grade) : null,
            ];
        }));

        return ['rows' => $rows];
    }

    private function teachersPanel(SchoolYearArchive $archive, array $filters, ?int $semester): array
    {
        $classStatsQuery = ArchiveClass::query()
            ->where('school_year_archive_id', $archive->id)
            ->whereNotNull('teacher_user_id');

        if ($semester !== null) {
            $classStatsQuery->where('semester', $semester);
        }

        $classStatsQuery = $classStatsQuery
            ->selectRaw('teacher_user_id, COUNT(*) as classes_count, COALESCE(SUM(students_total), 0) as students_total')
            ->groupBy('teacher_user_id');

        $query = ArchiveUser::query()
            ->where('archive_users.school_year_archive_id', $archive->id)
            ->where(function ($builder): void {
                $builder
                    ->where('archive_users.primary_role', 'teacher')
                    ->orWhereJsonContains('archive_users.roles_json', 'teacher');
            })
            ->leftJoinSub($classStatsQuery, 'teacher_class_stats', function ($join): void {
                $join->on('archive_users.original_user_id', '=', 'teacher_class_stats.teacher_user_id');
            });

        if (($filters['department'] ?? '') !== '') {
            $query->where('archive_users.department_code', $filters['department']);
        }

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('archive_users.first_name', 'like', "%{$search}%")
                    ->orWhere('archive_users.middle_name', 'like', "%{$search}%")
                    ->orWhere('archive_users.last_name', 'like', "%{$search}%")
                    ->orWhere('archive_users.username', 'like', "%{$search}%")
                    ->orWhere('archive_users.personal_email', 'like', "%{$search}%")
                    ->orWhere('archive_users.department_name', 'like', "%{$search}%")
                    ->orWhere('archive_users.department_code', 'like', "%{$search}%");
            });
        }

        $rows = $query
            ->selectRaw('archive_users.original_user_id as teacher_user_id, archive_users.first_name, archive_users.middle_name, archive_users.last_name, archive_users.username, archive_users.department_name as teacher_department_name, archive_users.department_code as teacher_department_code, COALESCE(teacher_class_stats.classes_count, 0) as classes_count, COALESCE(teacher_class_stats.students_total, 0) as students_total')
            ->orderBy('archive_users.last_name')
            ->orderBy('archive_users.first_name')
            ->paginate(15)
            ->withQueryString();

        $rows->setCollection($rows->getCollection()->map(function ($row): array {
            $name = trim(implode(' ', array_filter([
                $row->first_name,
                $row->middle_name,
                $row->last_name,
            ])));

            return [
                'teacher_user_id' => $row->teacher_user_id,
                'teacher_name' => $name !== '' ? $name : ($row->username ?? 'Unknown Teacher'),
                'teacher_department_name' => $row->teacher_department_name,
                'teacher_department_code' => $row->teacher_department_code,
                'classes_count' => (int) $row->classes_count,
                'students_total' => (int) $row->students_total,
            ];
        }));

        return ['rows' => $rows];
    }

    private function superAdminsPanel(SchoolYearArchive $archive, array $filters): array
    {
        $query = ArchiveUser::query()
            ->where('school_year_archive_id', $archive->id)
            ->where(function ($builder): void {
                $builder
                    ->where('primary_role', 'super_admin')
                    ->orWhereJsonContains('roles_json', 'super_admin');
            });

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('personal_email', 'like', "%{$search}%");
            });
        }

        $rows = $query
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(15)
            ->withQueryString();

        $rows->setCollection($rows->getCollection()->map(fn(ArchiveUser $archiveUser) => [
            'user_id' => $archiveUser->original_user_id,
            'name' => $archiveUser->name,
            'username' => $archiveUser->username,
            'personal_email' => $archiveUser->personal_email,
            'roles' => $archiveUser->roles_json ?? [],
        ]));

        return ['rows' => $rows];
    }

    private function departmentsPanel(SchoolYearArchive $archive, array $filters): array
    {
        $query = ArchiveDepartment::query()
            ->where('school_year_archive_id', $archive->id);

        if (($filters['track'] ?? '') !== '') {
            $query->where('track', $filters['track']);
        }

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('department_name', 'like', "%{$search}%")
                    ->orWhere('department_code', 'like', "%{$search}%");
            });
        }

        $rows = $query
            ->orderBy('department_name')
            ->paginate(15)
            ->withQueryString();

        $rows->setCollection($rows->getCollection()->map(fn(ArchiveDepartment $archiveDepartment) => [
            'id' => $archiveDepartment->id,
            'department_name' => $archiveDepartment->department_name,
            'department_code' => $archiveDepartment->department_code,
            'track' => $archiveDepartment->track,
            'specializations_count' => count($archiveDepartment->specializations_json ?? []),
            'admins_count' => count($archiveDepartment->admins_json ?? []),
            'teachers_count' => count($archiveDepartment->teachers_json ?? []),
        ]));

        return ['rows' => $rows];
    }

    private function classesPanel(SchoolYearArchive $archive, array $filters, ?int $semester): array
    {
        $query = ArchiveClass::query()
            ->where('school_year_archive_id', $archive->id);

        if ($semester !== null) {
            $query->where('semester', $semester);
        }

        if (($filters['track'] ?? '') !== '') {
            $query->where('track', $filters['track']);
        }

        if (($filters['class_grade_level'] ?? '') !== '') {
            $query->where('grade_level', $filters['class_grade_level']);
        }

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('subject_name', 'like', "%{$search}%")
                    ->orWhere('subject_code', 'like', "%{$search}%")
                    ->orWhere('teacher_name', 'like', "%{$search}%")
                    ->orWhere('section_name', 'like', "%{$search}%")
                    ->orWhere('strand', 'like', "%{$search}%");
            });
        }

        $rows = $query
            ->orderBy('grade_level')
            ->orderBy('section_name')
            ->orderBy('subject_name')
            ->paginate(15)
            ->withQueryString();

        $rows->setCollection($rows->getCollection()->map(fn(ArchiveClass $archiveClass) => [
            'id' => $archiveClass->id,
            'subject_name' => $archiveClass->subject_name,
            'subject_code' => $archiveClass->subject_code,
            'teacher_name' => $archiveClass->teacher_name,
            'grade_level' => $archiveClass->grade_level,
            'section_name' => $archiveClass->section_name,
            'strand' => $archiveClass->strand,
            'track' => $archiveClass->track,
            'semester' => $archiveClass->semester,
            'students_total' => $archiveClass->students_total,
        ]));

        return ['rows' => $rows];
    }

    private function auditLogsPanel(SchoolYearArchive $archive, array $filters, ?int $semester): array
    {
        $query = AuditLog::query()
            ->where('school_year', $archive->school_year);

        if ($semester !== null) {
            $query->where('semester', $semester);
        }

        if (($filters['audit_role'] ?? '') !== '') {
            $role = $filters['audit_role'];
            $query->where(function ($builder) use ($role): void {
                $builder
                    ->where('user_role', $role)
                    ->orWhereJsonContains('user_roles', $role);
            });
        }

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('user_name', 'like', "%{$search}%")
                    ->orWhere('task', 'like', "%{$search}%")
                    ->orWhere('module', 'like', "%{$search}%")
                    ->orWhere('path', 'like', "%{$search}%")
                    ->orWhere('route_name', 'like', "%{$search}%");
            });
        }

        $rows = $query
            ->orderBy('task')
            ->orderByDesc('logged_at')
            ->paginate(20)
            ->withQueryString();

        $rows->setCollection($rows->getCollection()->map(function (AuditLog $log): array {
            return [
                'id' => $log->id,
                'logged_at' => $log->logged_at?->toIso8601String(),
                'user_name' => $log->user_name,
                'user_role' => $log->user_role,
                'user_roles' => $log->user_roles ?? ($log->user_role ? [$log->user_role] : []),
                'semester' => $log->semester,
                'module' => $log->module,
                'task' => $log->task,
                'action' => $log->action,
                'method' => $log->method,
                'status_code' => $log->status_code,
                'is_success' => (bool) $log->is_success,
                'path' => $log->path,
            ];
        }));

        return ['rows' => $rows];
    }

    private function buildSummary(SchoolYearArchive $archive, ?int $semester): array
    {
        $classesQuery = ArchiveClass::query()->where('school_year_archive_id', $archive->id);

        if ($semester !== null) {
            $classesQuery->where('semester', $semester);
        }

        $classIds = (clone $classesQuery)->pluck('id');

        $studentsQuery = ArchiveEnrollment::query()
            ->where('school_year_archive_id', $archive->id)
            ->whereIn('archive_class_id', $classIds);

        $teachersCount = ArchiveUser::query()
            ->where('school_year_archive_id', $archive->id)
            ->where(function ($builder): void {
                $builder
                    ->where('primary_role', 'teacher')
                    ->orWhereJsonContains('roles_json', 'teacher');
            })
            ->count();

        $auditLogsQuery = AuditLog::query()->where('school_year', $archive->school_year);
        if ($semester !== null) {
            $auditLogsQuery->where('semester', $semester);
        }

        return [
            'students' => (clone $studentsQuery)->distinct('student_user_id')->count('student_user_id'),
            'teachers' => $teachersCount,
            'super_admins' => ArchiveUser::query()
                ->where('school_year_archive_id', $archive->id)
                ->where(function ($builder): void {
                    $builder
                        ->where('primary_role', 'super_admin')
                        ->orWhereJsonContains('roles_json', 'super_admin');
                })
                ->count(),
            'departments' => ArchiveDepartment::query()->where('school_year_archive_id', $archive->id)->count(),
            'classes' => (clone $classesQuery)->count(),
            'audit_logs' => $auditLogsQuery->count(),
        ];
    }

    private function buildOptions(SchoolYearArchive $archive, ?int $semester): array
    {
        $enrollmentsQuery = ArchiveEnrollment::query()
            ->where('school_year_archive_id', $archive->id);

        $classesQuery = ArchiveClass::query()
            ->where('school_year_archive_id', $archive->id);

        if ($semester !== null) {
            $enrollmentsQuery->whereHas('archiveClass', fn($builder) => $builder->where('semester', $semester));
            $classesQuery->where('semester', $semester);
        }

        $enrollments = $enrollmentsQuery
            ->get(['grade_level', 'section_name', 'strand'])
            ->filter(fn(ArchiveEnrollment $enrollment) => $enrollment->grade_level !== null && $enrollment->section_name !== null)
            ->values();

        $sectionsByGrade = [];
        $strandsByGradeSection = [];

        foreach ($enrollments as $enrollment) {
            $gradeLevel = (string) $enrollment->grade_level;
            $section = (string) $enrollment->section_name;
            $strand = (string) ($enrollment->strand ?? '');

            if ($gradeLevel === '' || $section === '') {
                continue;
            }

            if (! isset($sectionsByGrade[$gradeLevel])) {
                $sectionsByGrade[$gradeLevel] = [];
            }

            if (! in_array($section, $sectionsByGrade[$gradeLevel], true)) {
                $sectionsByGrade[$gradeLevel][] = $section;
            }

            $compositeKey = $gradeLevel . '::' . $section;

            if (! isset($strandsByGradeSection[$compositeKey])) {
                $strandsByGradeSection[$compositeKey] = [];
            }

            if ($strand !== '' && ! in_array($strand, $strandsByGradeSection[$compositeKey], true)) {
                $strandsByGradeSection[$compositeKey][] = $strand;
            }
        }

        foreach ($sectionsByGrade as $grade => $sections) {
            sort($sections, SORT_NATURAL | SORT_FLAG_CASE);
            $sectionsByGrade[$grade] = array_values($sections);
        }

        foreach ($strandsByGradeSection as $key => $strands) {
            sort($strands, SORT_NATURAL | SORT_FLAG_CASE);
            $strandsByGradeSection[$key] = array_values($strands);
        }

        $studentGradeLevels = array_values(array_keys($sectionsByGrade));
        $studentGradeLevels = $this->sortGradeLevels($studentGradeLevels);

        $classGradeLevels = $classesQuery
            ->whereNotNull('grade_level')
            ->distinct()
            ->pluck('grade_level')
            ->map(fn($value): string => trim((string) $value))
            ->filter(fn(string $value): bool => $value !== '')
            ->values()
            ->all();

        $classGradeLevels = $this->sortGradeLevels($classGradeLevels);

        $tracks = ArchiveDepartment::query()
            ->where('school_year_archive_id', $archive->id)
            ->whereNotNull('track')
            ->distinct()
            ->pluck('track')
            ->filter()
            ->values()
            ->all();

        sort($tracks, SORT_NATURAL | SORT_FLAG_CASE);

        $departmentCodes = ArchiveDepartment::query()
            ->where('school_year_archive_id', $archive->id)
            ->orderBy('department_name')
            ->get(['department_code', 'department_name'])
            ->map(fn(ArchiveDepartment $archiveDepartment) => [
                'code' => $archiveDepartment->department_code,
                'name' => $archiveDepartment->department_name,
            ])
            ->values()
            ->all();

        return [
            'student_filters' => [
                'grade_levels' => $studentGradeLevels,
                'sections_by_grade' => $sectionsByGrade,
                'strands_by_grade_section' => $strandsByGradeSection,
            ],
            'class_filters' => [
                'grade_levels' => $classGradeLevels,
            ],
            'department_codes' => $departmentCodes,
            'tracks' => $tracks,
        ];
    }

    /**
     * @param  array<int, string>  $gradeLevels
     * @return array<int, string>
     */
    private function sortGradeLevels(array $gradeLevels): array
    {
        $normalized = collect($gradeLevels)
            ->map(fn($value): string => trim((string) $value))
            ->filter(fn(string $value): bool => $value !== '')
            ->unique()
            ->values()
            ->all();

        usort($normalized, static function (string $left, string $right): int {
            $leftNumeric = preg_match('/\d+/', $left, $leftMatch) === 1 ? (int) $leftMatch[0] : null;
            $rightNumeric = preg_match('/\d+/', $right, $rightMatch) === 1 ? (int) $rightMatch[0] : null;

            if ($leftNumeric !== null && $rightNumeric !== null && $leftNumeric !== $rightNumeric) {
                return $leftNumeric <=> $rightNumeric;
            }

            return strnatcasecmp($left, $right);
        });

        return array_values($normalized);
    }

    private function semesterLabel(?int $semester): string
    {
        return match ((int) $semester) {
            1 => '1st Semester',
            2 => '2nd Semester',
            default => '-',
        };
    }

    /**
     * @param array<int, int> $semesters
     */
    private function semesterListLabel(array $semesters): string
    {
        $normalized = collect($semesters)
            ->map(fn($value): int => (int) $value)
            ->filter(fn(int $value): bool => in_array($value, [1, 2], true))
            ->unique()
            ->sort()
            ->values()
            ->all();

        if ($normalized === [1, 2]) {
            return '1st Semester & 2nd Semester';
        }

        if ($normalized === [1]) {
            return '1st Semester';
        }

        if ($normalized === [2]) {
            return '2nd Semester';
        }

        return '-';
    }

    private function buildArchiveClassDetailsResponse(ArchiveClass $archiveClass, int $archiveId): JsonResponse
    {
        $enrollments = ArchiveEnrollment::query()
            ->where('school_year_archive_id', $archiveId)
            ->where('archive_class_id', $archiveClass->id)
            ->orderBy('student_name')
            ->get();

        $students = $enrollments->map(function (ArchiveEnrollment $enrollment): array {
            return [
                'enrollment_id' => $enrollment->id,
                'student_user_id' => $enrollment->student_user_id,
                'student_name' => $enrollment->student_name,
                'student_username' => $enrollment->student_username,
                'student_lrn' => $enrollment->student_lrn,
                'q1_grade' => $enrollment->q1_grade,
                'q2_grade' => $enrollment->q2_grade,
                'final_grade' => $enrollment->final_grade,
                'remarks' => $enrollment->remarks,
                'passed' => $enrollment->passed,
                'breakdown' => $this->buildEnrollmentBreakdown($enrollment),
            ];
        })->values();

        return response()->json([
            'class' => [
                'id' => $archiveClass->id,
                'subject_name' => $archiveClass->subject_name,
                'subject_code' => $archiveClass->subject_code,
                'teacher_name' => $archiveClass->teacher_name,
                'teacher_department_name' => $archiveClass->teacher_department_name,
                'teacher_department_code' => $archiveClass->teacher_department_code,
                'grade_level' => $archiveClass->grade_level,
                'section_name' => $archiveClass->section_name,
                'strand' => $archiveClass->strand,
                'track' => $archiveClass->track,
                'school_year' => $archiveClass->school_year,
                'semester' => $archiveClass->semester,
                'students_total' => $archiveClass->students_total,
            ],
            'students' => $students,
        ]);
    }

    private function buildEnrollmentBreakdown(ArchiveEnrollment $enrollment): array
    {
        $items = ArchiveGradeItem::query()
            ->where('archive_enrollment_id', $enrollment->id)
            ->orderBy('quarter')
            ->orderBy('category_label')
            ->orderBy('task_label')
            ->get();

        $quarters = [];

        foreach ([1, 2] as $quarter) {
            $quarterItems = $items->where('quarter', $quarter)->values();

            $categoryGroups = $quarterItems
                ->groupBy(function (ArchiveGradeItem $item): string {
                    if ($item->category_label) {
                        return (string) $item->category_label;
                    }

                    if ($item->task_label) {
                        return 'Uncategorized: ' . $item->task_label;
                    }

                    return 'Uncategorized';
                })
                ->map(function (Collection $group, string $label): array {
                    $first = $group->first();

                    return [
                        'category_id' => $first?->category_id,
                        'category_label' => $label,
                        'category_weight' => $first?->category_weight,
                        'tasks' => $group->map(fn(ArchiveGradeItem $item) => [
                            'task_id' => $item->task_id,
                            'task_label' => $item->task_label ?: $item->assignment_name,
                            'assignment_name' => $item->assignment_name,
                            'score' => $item->score,
                            'total_score' => $item->total_score,
                            'percentage' => $item->percentage,
                        ])->values()->all(),
                    ];
                })
                ->values()
                ->all();

            $quarters[] = [
                'quarter' => $quarter,
                'label' => $quarter === 1 ? '1st Quarter (Midterm)' : '2nd Quarter (Final)',
                'transmuted_grade' => $quarter === 1 ? $enrollment->q1_grade : $enrollment->q2_grade,
                'initial_grade' => $quarter === 1 ? $enrollment->initial_grade_q1 : $enrollment->initial_grade_q2,
                'expected_grade' => $quarter === 1 ? $enrollment->expected_grade_q1 : $enrollment->expected_grade_q2,
                'categories' => $categoryGroups,
            ];
        }

        return [
            'student' => [
                'student_name' => $enrollment->student_name,
                'student_username' => $enrollment->student_username,
                'student_lrn' => $enrollment->student_lrn,
            ],
            'summary' => [
                'q1_grade' => $enrollment->q1_grade,
                'q2_grade' => $enrollment->q2_grade,
                'final_grade' => $enrollment->final_grade,
                'remarks' => $enrollment->remarks,
                'passed' => $enrollment->passed,
            ],
            'quarters' => $quarters,
        ];
    }
}

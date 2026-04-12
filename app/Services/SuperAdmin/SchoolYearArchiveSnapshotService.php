<?php

namespace App\Services\SuperAdmin;

use App\Models\ArchiveClass;
use App\Models\ArchiveDepartment;
use App\Models\ArchiveEnrollment;
use App\Models\ArchiveGradeItem;
use App\Models\ArchiveSection;
use App\Models\ArchiveUser;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\SchoolYearArchive;
use App\Models\Section;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SchoolYearArchiveSnapshotService
{
    public function capture(string $schoolYear, ?string $nextSchoolYear = null, ?int $createdBy = null): SchoolYearArchive
    {
        return DB::transaction(function () use ($schoolYear, $nextSchoolYear, $createdBy): SchoolYearArchive {
            $existing = SchoolYearArchive::query()
                ->where('school_year', $schoolYear)
                ->first();

            if ($existing) {
                // Backfill missing archived users from earlier snapshot versions.
                $this->snapshotUsers($existing, $schoolYear);
                return $existing;
            }

            $archive = SchoolYearArchive::query()->create([
                'archive_key' => $this->generateArchiveKey($schoolYear),
                'school_year' => $schoolYear,
                'next_school_year' => $nextSchoolYear,
                'captured_at' => now(),
                'created_by' => $createdBy,
            ]);

            $this->snapshotUsers($archive, $schoolYear);
            $this->snapshotDepartments($archive);
            $sectionIdMap = $this->snapshotSections($archive, $schoolYear);
            $this->snapshotClassesAndGrades($archive, $schoolYear, $sectionIdMap);

            return $archive->fresh();
        });
    }

    private function snapshotUsers(SchoolYearArchive $archive, string $schoolYear): void
    {
        $capturedAt = $archive->captured_at ?? now();

        $classTeacherIds = SchoolClass::query()
            ->where('school_year', $schoolYear)
            ->pluck('teacher_id');

        $classIds = SchoolClass::query()
            ->where('school_year', $schoolYear)
            ->pluck('id');

        $enrolledStudentIds = Enrollment::query()
            ->whereIn('class_id', $classIds)
            ->pluck('user_id');

        $teacherIds = User::query()
            ->whereHas('roles', fn($query) => $query->where('name', 'teacher'))
            ->where('created_at', '<=', $capturedAt)
            ->pluck('id');

        $adminIds = User::query()
            ->whereHas('roles', fn($query) => $query->whereIn('name', ['super_admin', 'admin']))
            ->where('created_at', '<=', $capturedAt)
            ->pluck('id');

        $snapshotUserIds = $classTeacherIds
            ->merge($enrolledStudentIds)
            ->merge($teacherIds)
            ->merge($adminIds)
            ->filter()
            ->map(fn($value) => (int) $value)
            ->unique()
            ->values();

        if ($snapshotUserIds->isNotEmpty()) {
            $existingSnapshotUserIds = ArchiveUser::query()
                ->where('school_year_archive_id', $archive->id)
                ->pluck('original_user_id')
                ->filter()
                ->map(fn($value) => (int) $value)
                ->unique();

            $snapshotUserIds = $snapshotUserIds
                ->diff($existingSnapshotUserIds)
                ->values();
        }

        if ($snapshotUserIds->isEmpty()) {
            return;
        }

        $users = User::query()
            ->whereIn('id', $snapshotUserIds)
            ->with([
                'roles:id,name',
                'department:id,department_name,department_code,track',
            ])
            ->get();

        $rows = $users->map(function (User $user) use ($archive): array {
            $roles = $user->roles->pluck('name')->values()->all();

            return [
                'school_year_archive_id' => $archive->id,
                'original_user_id' => $user->id,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'username' => $user->username,
                'personal_email' => $user->personal_email,
                'status' => $user->status,
                'primary_role' => $this->resolvePrimaryRole($roles),
                'roles_json' => $this->encodeJsonValue($roles),
                'department_name' => $user->department?->department_name,
                'department_code' => $user->department?->department_code,
                'department_track' => $user->department?->track,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->all();

        if ($rows !== []) {
            ArchiveUser::query()->insert($rows);
        }
    }

    private function snapshotDepartments(SchoolYearArchive $archive): void
    {
        $snapshotUsers = ArchiveUser::query()
            ->where('school_year_archive_id', $archive->id)
            ->get();

        $departments = Department::query()
            ->with('specializations:id,specialization_name')
            ->orderBy('department_name')
            ->get();

        $rows = $departments->map(function (Department $department) use ($archive, $snapshotUsers): array {
            $usersInDepartment = $snapshotUsers
                ->where('department_code', $department->department_code)
                ->values();

            $admins = $usersInDepartment
                ->filter(function (ArchiveUser $archiveUser): bool {
                    $roles = $archiveUser->roles_json ?? [];
                    return in_array('admin', $roles, true) || in_array('super_admin', $roles, true);
                })
                ->map(fn(ArchiveUser $archiveUser) => [
                    'id' => $archiveUser->original_user_id,
                    'name' => $archiveUser->name,
                    'username' => $archiveUser->username,
                    'roles' => $archiveUser->roles_json ?? [],
                ])
                ->values()
                ->all();

            $teachers = $usersInDepartment
                ->filter(fn(ArchiveUser $archiveUser) => in_array('teacher', $archiveUser->roles_json ?? [], true))
                ->map(fn(ArchiveUser $archiveUser) => [
                    'id' => $archiveUser->original_user_id,
                    'name' => $archiveUser->name,
                    'username' => $archiveUser->username,
                    'roles' => $archiveUser->roles_json ?? [],
                ])
                ->values()
                ->all();

            return [
                'school_year_archive_id' => $archive->id,
                'original_department_id' => $department->id,
                'department_name' => $department->department_name,
                'department_code' => $department->department_code,
                'track' => $department->track,
                'description' => $department->description,
                'is_active' => (bool) $department->is_active,
                'specializations_json' => $this->encodeJsonValue(
                    $department->specializations
                        ->pluck('specialization_name')
                        ->values()
                        ->all(),
                ),
                'admins_json' => $this->encodeJsonValue($admins),
                'teachers_json' => $this->encodeJsonValue($teachers),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->all();

        if ($rows !== []) {
            ArchiveDepartment::query()->insert($rows);
        }
    }

    /**
     * @return array<int, int>
     */
    private function snapshotSections(SchoolYearArchive $archive, string $schoolYear): array
    {
        $sections = Section::query()
            ->where('school_year', $schoolYear)
            ->with([
                'department:id,department_name,department_code',
                'advisorTeacher:id,first_name,middle_name,last_name',
            ])
            ->orderBy('id')
            ->get();

        $sectionIdMap = [];

        foreach ($sections as $section) {
            $archiveSection = ArchiveSection::query()->create([
                'school_year_archive_id' => $archive->id,
                'original_section_id' => $section->id,
                'original_department_id' => $section->department_id,
                'section_name' => $section->section_name,
                'section_code' => $section->section_code,
                'cohort' => $section->cohort,
                'grade_level' => $section->grade_level,
                'strand' => $section->strand,
                'track' => $section->track,
                'school_year' => $section->school_year,
                'advisor_name' => $section->advisorTeacher?->name,
                'department_name' => $section->department?->department_name,
                'department_code' => $section->department?->department_code,
            ]);

            $sectionIdMap[(int) $section->id] = (int) $archiveSection->id;
        }

        return $sectionIdMap;
    }

    /**
     * @param  array<int, int>  $sectionIdMap
     */
    private function snapshotClassesAndGrades(SchoolYearArchive $archive, string $schoolYear, array $sectionIdMap): void
    {
        $classes = SchoolClass::query()
            ->where('school_year', $schoolYear)
            ->with([
                'subject:id,subject_name,subject_code',
                'teacher:id,first_name,middle_name,last_name,department_id',
                'teacher.department:id,department_name,department_code',
                'sectionRecord:id,section_name,section_code,department_id,grade_level,strand,track',
                'sectionRecord.department:id,department_name,department_code',
            ])
            ->orderBy('id')
            ->get();

        if ($classes->isEmpty()) {
            return;
        }

        $classIds = $classes->pluck('id')->values();

        $enrollments = Enrollment::query()
            ->whereIn('class_id', $classIds)
            ->with([
                'user:id,first_name,middle_name,last_name,username,personal_email,department_id',
                'user.department:id,department_name,department_code',
                // Keep default columns here because Enrollment::student uses a through relation.
                // Narrow column selection can generate ambiguous "id" SQL in joined queries.
                'student',
                'grades:id,enrollment_id,assignment_key,assignment_name,score,total_score,quarter',
            ])
            ->orderBy('id')
            ->get();

        $enrollmentsByClassId = $enrollments->groupBy('class_id');

        $archiveClassMap = [];

        foreach ($classes as $class) {
            $archiveClass = ArchiveClass::query()->create([
                'school_year_archive_id' => $archive->id,
                'original_class_id' => $class->id,
                'original_subject_id' => $class->subject_id,
                'archive_section_id' => $class->section_id ? ($sectionIdMap[(int) $class->section_id] ?? null) : null,
                'teacher_user_id' => $class->teacher_id,
                'subject_name' => $class->subject?->subject_name,
                'subject_code' => $class->subject?->subject_code,
                'grade_level' => $class->grade_level,
                'section_name' => $class->sectionRecord?->section_name ?? $class->section,
                'section_code' => $class->sectionRecord?->section_code,
                'strand' => $class->strand ?? $class->sectionRecord?->strand,
                'track' => $class->track ?? $class->sectionRecord?->track,
                'school_year' => $class->school_year,
                'semester' => is_numeric($class->semester) ? (int) $class->semester : null,
                'current_quarter' => $class->current_quarter,
                'color' => $class->color,
                'teacher_name' => $class->teacher?->name,
                'teacher_department_name' => $class->teacher?->department?->department_name,
                'teacher_department_code' => $class->teacher?->department?->department_code,
                'grade_categories' => $class->grade_categories ?? [],
                'students_total' => (int) $enrollmentsByClassId->get((int) $class->id, collect())->count(),
            ]);

            $archiveClassMap[(int) $class->id] = $archiveClass;
        }

        foreach ($enrollments as $enrollment) {
            $archiveClass = $archiveClassMap[(int) $enrollment->class_id] ?? null;

            if (! $archiveClass) {
                continue;
            }

            $studentProfile = $enrollment->student;
            $studentName = $studentProfile?->student_name ?: ($enrollment->user?->name ?? 'Unknown Student');

            $archiveEnrollment = ArchiveEnrollment::query()->create([
                'school_year_archive_id' => $archive->id,
                'archive_class_id' => $archiveClass->id,
                'original_enrollment_id' => $enrollment->id,
                'student_user_id' => $enrollment->user_id,
                'student_name' => $studentName,
                'student_username' => $enrollment->user?->username,
                'student_lrn' => $studentProfile?->lrn,
                'grade_level' => $studentProfile?->grade_level ?? $archiveClass->grade_level,
                'section_name' => $studentProfile?->section ?? $archiveClass->section_name,
                'strand' => $studentProfile?->strand ?? $archiveClass->strand,
                'track' => $studentProfile?->track ?? $archiveClass->track,
                'initial_grade_q1' => $enrollment->initial_grade_q1,
                'expected_grade_q1' => $enrollment->expected_grade_q1,
                'q1_grade' => $enrollment->q1_grade,
                'initial_grade_q2' => $enrollment->initial_grade_q2,
                'expected_grade_q2' => $enrollment->expected_grade_q2,
                'q2_grade' => $enrollment->q2_grade,
                'final_grade' => $enrollment->final_grade,
                'remarks' => $enrollment->remarks,
                'passed' => $enrollment->final_grade !== null ? (int) $enrollment->final_grade >= 75 : null,
            ]);

            $this->snapshotGradeItems($archive, $archiveClass, $archiveEnrollment, $enrollment);
        }
    }

    private function snapshotGradeItems(
        SchoolYearArchive $archive,
        ArchiveClass $archiveClass,
        ArchiveEnrollment $archiveEnrollment,
        Enrollment $enrollment,
    ): void {
        $taskLookup = $this->buildTaskLookup((array) ($archiveClass->grade_categories ?? []));

        $gradesByQuarter = [
            1 => [],
            2 => [],
        ];

        foreach ($enrollment->grades as $grade) {
            $quarter = (int) $grade->quarter;
            if (! in_array($quarter, [1, 2], true)) {
                continue;
            }

            $key = trim((string) ($grade->assignment_key ?: Str::slug((string) $grade->assignment_name, '_')));
            if ($key === '') {
                $key = 'grade_' . $grade->id;
            }

            $gradesByQuarter[$quarter][$key] = $grade;
        }

        $rows = [];

        foreach ([1, 2] as $quarter) {
            $seenKeys = [];

            foreach (($taskLookup[$quarter] ?? []) as $taskId => $meta) {
                $grade = $gradesByQuarter[$quarter][$taskId] ?? null;

                $score = $grade?->score;
                $totalScore = $meta['total'] ?? $grade?->total_score;

                $rows[] = [
                    'school_year_archive_id' => $archive->id,
                    'archive_class_id' => $archiveClass->id,
                    'archive_enrollment_id' => $archiveEnrollment->id,
                    'quarter' => $quarter,
                    'category_id' => $meta['category_id'],
                    'category_label' => $meta['category_label'],
                    'category_weight' => $meta['weight'],
                    'task_id' => $taskId,
                    'task_label' => $meta['task_label'],
                    'assignment_key' => $taskId,
                    'assignment_name' => $grade?->assignment_name ?: $meta['task_label'],
                    'score' => $score,
                    'total_score' => $totalScore,
                    'percentage' => $this->computePercentage($score, $totalScore),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $seenKeys[$taskId] = true;
            }

            foreach ($gradesByQuarter[$quarter] as $assignmentKey => $grade) {
                if (isset($seenKeys[$assignmentKey])) {
                    continue;
                }

                $rows[] = [
                    'school_year_archive_id' => $archive->id,
                    'archive_class_id' => $archiveClass->id,
                    'archive_enrollment_id' => $archiveEnrollment->id,
                    'quarter' => $quarter,
                    'category_id' => null,
                    'category_label' => null,
                    'category_weight' => null,
                    'task_id' => $assignmentKey,
                    'task_label' => $grade->assignment_name,
                    'assignment_key' => $grade->assignment_key,
                    'assignment_name' => $grade->assignment_name,
                    'score' => $grade->score,
                    'total_score' => $grade->total_score,
                    'percentage' => $this->computePercentage($grade->score, $grade->total_score),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        if ($rows !== []) {
            ArchiveGradeItem::query()->insert($rows);
        }
    }

    /**
     * @param  array<int|string, mixed>  $gradeCategories
     * @return array<int, array<string, array<string, mixed>>>
     */
    private function buildTaskLookup(array $gradeCategories): array
    {
        $lookup = [
            1 => [],
            2 => [],
        ];

        foreach ([1, 2] as $quarter) {
            $categories = $this->resolveQuarterCategories($gradeCategories, $quarter);

            foreach ($categories as $category) {
                if (! is_array($category)) {
                    continue;
                }

                $categoryId = trim((string) ($category['id'] ?? ''));
                $categoryLabel = trim((string) ($category['label'] ?? 'Category'));
                $weight = is_numeric($category['weight'] ?? null) ? (float) $category['weight'] : null;

                $tasks = $category['tasks'] ?? [];
                if (! is_array($tasks)) {
                    continue;
                }

                foreach ($tasks as $task) {
                    if (! is_array($task)) {
                        continue;
                    }

                    $taskId = trim((string) ($task['id'] ?? ''));
                    if ($taskId === '') {
                        continue;
                    }

                    $taskLabel = trim((string) ($task['label'] ?? $taskId));
                    $total = is_numeric($task['total'] ?? null) ? (float) $task['total'] : null;

                    $lookup[$quarter][$taskId] = [
                        'category_id' => $categoryId !== '' ? $categoryId : null,
                        'category_label' => $categoryLabel,
                        'weight' => $weight,
                        'task_label' => $taskLabel,
                        'total' => $total,
                    ];
                }
            }
        }

        return $lookup;
    }

    /**
     * @param  array<int|string, mixed>  $storedCategories
     * @return array<int, mixed>
     */
    private function resolveQuarterCategories(array $storedCategories, int $quarter): array
    {
        $firstQuarter = $storedCategories['1'] ?? $storedCategories[1] ?? null;

        $isPerQuarter = is_array($firstQuarter)
            && ! array_key_exists('id', $firstQuarter)
            && ! array_key_exists('label', $firstQuarter);

        if ($isPerQuarter) {
            $resolved = $storedCategories[$quarter] ?? $storedCategories[(string) $quarter] ?? [];
            return is_array($resolved) ? $resolved : [];
        }

        return $storedCategories;
    }

    private function computePercentage(mixed $score, mixed $totalScore): ?float
    {
        if (! is_numeric($score) || ! is_numeric($totalScore)) {
            return null;
        }

        $total = (float) $totalScore;
        if ($total <= 0) {
            return null;
        }

        return round((((float) $score) / $total) * 100, 2);
    }

    /**
     * @param  array<int, string>  $roles
     */
    private function resolvePrimaryRole(array $roles): ?string
    {
        foreach (['super_admin', 'admin', 'teacher', 'student'] as $role) {
            if (in_array($role, $roles, true)) {
                return $role;
            }
        }

        return $roles[0] ?? null;
    }

    private function generateArchiveKey(string $schoolYear): string
    {
        $normalizedSchoolYear = str_replace('-', '_', trim($schoolYear));
        $base = 'school_year_archive_' . $normalizedSchoolYear . '_' . now()->format('Ymd_His');
        $key = $base;

        while (SchoolYearArchive::query()->where('archive_key', $key)->exists()) {
            $key = $base . '_' . Str::lower(Str::random(4));
        }

        return $key;
    }

    private function encodeJsonValue(array $value): string
    {
        $encoded = json_encode($value);

        return $encoded === false ? '[]' : $encoded;
    }
}

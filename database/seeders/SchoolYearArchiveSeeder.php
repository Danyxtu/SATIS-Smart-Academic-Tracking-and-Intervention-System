<?php

namespace Database\Seeders;

use App\Models\ArchiveClass;
use App\Models\ArchiveDepartment;
use App\Models\ArchiveEnrollment;
use App\Models\ArchiveGradeItem;
use App\Models\ArchiveSection;
use App\Models\ArchiveUser;
use App\Models\Department;
use App\Models\SchoolYearArchive;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class SchoolYearArchiveSeeder extends Seeder
{
    public function run(): void
    {
        $departmentMap = Department::query()
            ->get(['department_name', 'department_code', 'track'])
            ->keyBy('department_code');

        foreach ($this->archiveDefinitions() as $definition) {
            $this->seedArchiveYear($definition, $departmentMap);
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function archiveDefinitions(): array
    {
        return [
            [
                'school_year' => '2024-2025',
                'next_school_year' => '2025-2026',
                'captured_at' => '2025-03-31 17:30:00',
            ],
            [
                'school_year' => '2025-2026',
                'next_school_year' => '2026-2027',
                'captured_at' => '2026-03-31 17:30:00',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $definition
     */
    private function seedArchiveYear(array $definition, Collection $departmentMap): void
    {
        $schoolYear = (string) $definition['school_year'];
        $nextSchoolYear = (string) $definition['next_school_year'];
        $capturedAt = (string) $definition['captured_at'];

        $archive = SchoolYearArchive::query()->updateOrCreate(
            ['school_year' => $schoolYear],
            [
                'archive_key' => $this->archiveKeyForSchoolYear($schoolYear),
                'next_school_year' => $nextSchoolYear,
                'captured_at' => $capturedAt,
                'created_by' => null,
            ],
        );

        $this->truncateArchiveData($archive);

        $seededUsers = $this->seedUsers($archive, $schoolYear);
        $seededDepartments = $this->seedDepartments($archive, $departmentMap, $seededUsers);
        $seededSections = $this->seedSections($archive, $schoolYear, $seededDepartments, $seededUsers);
        $seededClasses = $this->seedClasses($archive, $schoolYear, $seededSections, $seededUsers);
        $this->seedEnrollments($archive, $seededClasses, $seededUsers);
    }

    private function archiveKeyForSchoolYear(string $schoolYear): string
    {
        return 'school_year_archive_' . str_replace('-', '_', $schoolYear) . '_seed';
    }

    private function truncateArchiveData(SchoolYearArchive $archive): void
    {
        ArchiveGradeItem::query()
            ->where('school_year_archive_id', $archive->id)
            ->delete();

        ArchiveEnrollment::query()
            ->where('school_year_archive_id', $archive->id)
            ->delete();

        ArchiveClass::query()
            ->where('school_year_archive_id', $archive->id)
            ->delete();

        ArchiveSection::query()
            ->where('school_year_archive_id', $archive->id)
            ->delete();

        ArchiveDepartment::query()
            ->where('school_year_archive_id', $archive->id)
            ->delete();

        ArchiveUser::query()
            ->where('school_year_archive_id', $archive->id)
            ->delete();
    }

    /**
     * @return array<string, mixed>
     */
    private function seedUsers(SchoolYearArchive $archive, string $schoolYear): array
    {
        $yearCode = (int) substr($schoolYear, 2, 2);
        $userSeed = $yearCode * 100000;

        $superAdmin = ArchiveUser::query()->create([
            'school_year_archive_id' => $archive->id,
            'original_user_id' => $userSeed + 1,
            'first_name' => 'Archive',
            'middle_name' => null,
            'last_name' => 'Super Admin',
            'username' => 'archive.superadmin.' . $yearCode,
            'personal_email' => 'archive.superadmin.' . $yearCode . '@example.test',
            'status' => 'approved',
            'primary_role' => 'super_admin',
            'roles_json' => ['super_admin'],
            'department_name' => 'Accountancy Business and Management',
            'department_code' => 'ABM',
            'department_track' => 'Academic',
        ]);

        $admins = [
            ArchiveUser::query()->create([
                'school_year_archive_id' => $archive->id,
                'original_user_id' => $userSeed + 2,
                'first_name' => 'Academic',
                'middle_name' => null,
                'last_name' => 'Admin',
                'username' => 'archive.admin.acad.' . $yearCode,
                'personal_email' => 'archive.admin.acad.' . $yearCode . '@example.test',
                'status' => 'approved',
                'primary_role' => 'admin',
                'roles_json' => ['admin'],
                'department_name' => 'Science Technology Engineering and Mathematics',
                'department_code' => 'STEM',
                'department_track' => 'Academic',
            ]),
            ArchiveUser::query()->create([
                'school_year_archive_id' => $archive->id,
                'original_user_id' => $userSeed + 3,
                'first_name' => 'TVL',
                'middle_name' => null,
                'last_name' => 'Admin',
                'username' => 'archive.admin.tvl.' . $yearCode,
                'personal_email' => 'archive.admin.tvl.' . $yearCode . '@example.test',
                'status' => 'approved',
                'primary_role' => 'admin',
                'roles_json' => ['admin'],
                'department_name' => 'Information and Communications Technology',
                'department_code' => 'ICT',
                'department_track' => 'TVL',
            ]),
        ];

        $teacherBlueprints = [
            ['first' => 'Elena', 'last' => 'Santos', 'dept_code' => 'STEM'],
            ['first' => 'Miguel', 'last' => 'Reyes', 'dept_code' => 'ABM'],
            ['first' => 'Josefina', 'last' => 'Cruz', 'dept_code' => 'HUMMS'],
            ['first' => 'Marco', 'last' => 'Delos Reyes', 'dept_code' => 'GAS'],
            ['first' => 'Irene', 'last' => 'Domingo', 'dept_code' => 'ICT'],
            ['first' => 'Paolo', 'last' => 'Mendoza', 'dept_code' => 'IA'],
            ['first' => 'Rhea', 'last' => 'Villanueva', 'dept_code' => 'HE'],
            ['first' => 'Jason', 'last' => 'Abad', 'dept_code' => 'AFA'],
        ];

        $teachers = [];

        foreach ($teacherBlueprints as $index => $teacherBlueprint) {
            $departmentCode = $teacherBlueprint['dept_code'];
            $departmentName = $this->departmentName($departmentCode);
            $departmentTrack = $this->departmentTrack($departmentCode);

            $teacher = ArchiveUser::query()->create([
                'school_year_archive_id' => $archive->id,
                'original_user_id' => $userSeed + 100 + $index,
                'first_name' => $teacherBlueprint['first'],
                'middle_name' => null,
                'last_name' => $teacherBlueprint['last'],
                'username' => 'archive.teacher.' . ($index + 1) . '.' . $yearCode,
                'personal_email' => 'archive.teacher.' . ($index + 1) . '.' . $yearCode . '@example.test',
                'status' => 'approved',
                'primary_role' => 'teacher',
                'roles_json' => ['teacher'],
                'department_name' => $departmentName,
                'department_code' => $departmentCode,
                'department_track' => $departmentTrack,
            ]);

            $teachers[] = $teacher;
        }

        $studentSections = [
            ['grade_level' => '11', 'section_name' => 'STEM-A', 'strand' => 'STEM', 'track' => 'Academic'],
            ['grade_level' => '11', 'section_name' => 'ABM-A', 'strand' => 'ABM', 'track' => 'Academic'],
            ['grade_level' => '12', 'section_name' => 'STEM-B', 'strand' => 'STEM', 'track' => 'Academic'],
            ['grade_level' => '12', 'section_name' => 'ABM-B', 'strand' => 'ABM', 'track' => 'Academic'],
        ];

        $students = [];

        foreach ($studentSections as $sectionIndex => $sectionData) {
            for ($studentNumber = 1; $studentNumber <= 6; $studentNumber++) {
                $studentOrdinal = ($sectionIndex * 6) + $studentNumber;

                $student = ArchiveUser::query()->create([
                    'school_year_archive_id' => $archive->id,
                    'original_user_id' => $userSeed + 1000 + $studentOrdinal,
                    'first_name' => 'Student' . $studentOrdinal,
                    'middle_name' => null,
                    'last_name' => 'Archive',
                    'username' => 'archive.student.' . $studentOrdinal . '.' . $yearCode,
                    'personal_email' => 'archive.student.' . $studentOrdinal . '.' . $yearCode . '@example.test',
                    'status' => 'approved',
                    'primary_role' => 'student',
                    'roles_json' => ['student'],
                    'department_name' => null,
                    'department_code' => null,
                    'department_track' => $sectionData['track'],
                ]);

                $students[] = [
                    'user' => $student,
                    'grade_level' => $sectionData['grade_level'],
                    'section_name' => $sectionData['section_name'],
                    'strand' => $sectionData['strand'],
                    'track' => $sectionData['track'],
                    'lrn' => 'LRN' . $yearCode . str_pad((string) $studentOrdinal, 4, '0', STR_PAD_LEFT),
                ];
            }
        }

        return [
            'super_admin' => $superAdmin,
            'admins' => $admins,
            'teachers' => $teachers,
            'students' => $students,
        ];
    }

    /**
     * @param  array<string, mixed>  $seededUsers
     * @return array<string, ArchiveDepartment>
     */
    private function seedDepartments(SchoolYearArchive $archive, Collection $departmentMap, array $seededUsers): array
    {
        $teacherGroups = collect($seededUsers['teachers'])
            ->groupBy(fn(ArchiveUser $teacher): string => (string) $teacher->department_code);

        $adminGroups = collect($seededUsers['admins'])
            ->groupBy(fn(ArchiveUser $admin): string => (string) $admin->department_code);

        $departmentCodes = collect(['ABM', 'GAS', 'HUMMS', 'STEM', 'AFA', 'HE', 'IA', 'ICT']);

        $seededDepartments = [];

        foreach ($departmentCodes as $departmentCode) {
            $department = $departmentMap->get($departmentCode);

            if (! $department) {
                continue;
            }

            $admins = $adminGroups->get($departmentCode, collect())
                ->map(fn(ArchiveUser $admin): array => [
                    'id' => $admin->original_user_id,
                    'name' => $admin->name,
                    'username' => $admin->username,
                    'roles' => $admin->roles_json ?? ['admin'],
                ])
                ->values()
                ->all();

            $teachers = $teacherGroups->get($departmentCode, collect())
                ->map(fn(ArchiveUser $teacher): array => [
                    'id' => $teacher->original_user_id,
                    'name' => $teacher->name,
                    'username' => $teacher->username,
                    'roles' => $teacher->roles_json ?? ['teacher'],
                ])
                ->values()
                ->all();

            $seededDepartment = ArchiveDepartment::query()->create([
                'school_year_archive_id' => $archive->id,
                'original_department_id' => null,
                'department_name' => $department->department_name,
                'department_code' => $departmentCode,
                'track' => $department->track,
                'description' => 'Historical archive snapshot for ' . $department->department_name,
                'is_active' => true,
                'specializations_json' => [$departmentCode . ' Specialization'],
                'admins_json' => $admins,
                'teachers_json' => $teachers,
            ]);

            $seededDepartments[$departmentCode] = $seededDepartment;
        }

        return $seededDepartments;
    }

    /**
     * @param  array<string, ArchiveDepartment>  $seededDepartments
     * @param  array<string, mixed>  $seededUsers
     * @return array<string, ArchiveSection>
     */
    private function seedSections(
        SchoolYearArchive $archive,
        string $schoolYear,
        array $seededDepartments,
        array $seededUsers,
    ): array {
        $teacherByCode = collect($seededUsers['teachers'])
            ->keyBy(fn(ArchiveUser $teacher): string => (string) $teacher->department_code);

        $sections = [
            [
                'section_name' => 'STEM-A',
                'section_code' => 'STEMA-' . substr($schoolYear, 2, 2),
                'grade_level' => '11',
                'strand' => 'STEM',
                'track' => 'Academic',
                'department_code' => 'STEM',
            ],
            [
                'section_name' => 'ABM-A',
                'section_code' => 'ABMA-' . substr($schoolYear, 2, 2),
                'grade_level' => '11',
                'strand' => 'ABM',
                'track' => 'Academic',
                'department_code' => 'ABM',
            ],
            [
                'section_name' => 'STEM-B',
                'section_code' => 'STEMB-' . substr($schoolYear, 2, 2),
                'grade_level' => '12',
                'strand' => 'STEM',
                'track' => 'Academic',
                'department_code' => 'STEM',
            ],
            [
                'section_name' => 'ABM-B',
                'section_code' => 'ABMB-' . substr($schoolYear, 2, 2),
                'grade_level' => '12',
                'strand' => 'ABM',
                'track' => 'Academic',
                'department_code' => 'ABM',
            ],
        ];

        $seededSections = [];

        foreach ($sections as $section) {
            $departmentCode = $section['department_code'];
            $department = $seededDepartments[$departmentCode] ?? null;
            $advisor = $teacherByCode->get($departmentCode);

            $seededSection = ArchiveSection::query()->create([
                'school_year_archive_id' => $archive->id,
                'original_section_id' => null,
                'original_department_id' => null,
                'section_name' => $section['section_name'],
                'section_code' => $section['section_code'],
                'grade_level' => $section['grade_level'],
                'strand' => $section['strand'],
                'track' => $section['track'],
                'school_year' => $schoolYear,
                'advisor_name' => $advisor?->name,
                'department_name' => $department?->department_name,
                'department_code' => $departmentCode,
            ]);

            $seededSections[$section['section_name']] = $seededSection;
        }

        return $seededSections;
    }

    /**
     * @param  array<string, ArchiveSection>  $seededSections
     * @param  array<string, mixed>  $seededUsers
     * @return array<int, array<string, mixed>>
     */
    private function seedClasses(
        SchoolYearArchive $archive,
        string $schoolYear,
        array $seededSections,
        array $seededUsers,
    ): array {
        $teachers = collect($seededUsers['teachers'])->values();

        $blueprints = [
            [
                'subject_name' => 'General Mathematics',
                'subject_code' => 'GENMATH',
                'section_name' => 'STEM-A',
                'semester' => 1,
                'teacher_index' => 0,
            ],
            [
                'subject_name' => 'Business Mathematics',
                'subject_code' => 'BUSMATH',
                'section_name' => 'ABM-A',
                'semester' => 1,
                'teacher_index' => 1,
            ],
            [
                'subject_name' => 'Physical Science',
                'subject_code' => 'PHYSCI',
                'section_name' => 'STEM-B',
                'semester' => 2,
                'teacher_index' => 2,
            ],
            [
                'subject_name' => 'Applied Economics',
                'subject_code' => 'APECON',
                'section_name' => 'ABM-B',
                'semester' => 2,
                'teacher_index' => 3,
            ],
        ];

        $seededClasses = [];

        foreach ($blueprints as $index => $blueprint) {
            $section = $seededSections[$blueprint['section_name']] ?? null;
            if (! $section) {
                continue;
            }

            $teacher = $teachers->get($blueprint['teacher_index']);

            $seededClass = ArchiveClass::query()->create([
                'school_year_archive_id' => $archive->id,
                'original_class_id' => null,
                'original_subject_id' => null,
                'archive_section_id' => $section->id,
                'teacher_user_id' => $teacher?->original_user_id,
                'subject_name' => $blueprint['subject_name'],
                'subject_code' => $blueprint['subject_code'],
                'grade_level' => $section->grade_level,
                'section_name' => $section->section_name,
                'section_code' => $section->section_code,
                'strand' => $section->strand,
                'track' => $section->track,
                'school_year' => $schoolYear,
                'semester' => $blueprint['semester'],
                'current_quarter' => 2,
                'color' => ['indigo', 'blue', 'emerald', 'rose'][$index % 4],
                'teacher_name' => $teacher?->name,
                'teacher_department_name' => $teacher?->department_name,
                'teacher_department_code' => $teacher?->department_code,
                'grade_categories' => [
                    [
                        'id' => 'written_works',
                        'label' => 'Written Works',
                        'weight' => 40,
                        'tasks' => [
                            ['id' => 'ww_1', 'label' => 'WW1', 'total' => 100],
                            ['id' => 'ww_2', 'label' => 'WW2', 'total' => 100],
                        ],
                    ],
                    [
                        'id' => 'performance_tasks',
                        'label' => 'Performance Tasks',
                        'weight' => 40,
                        'tasks' => [
                            ['id' => 'pt_1', 'label' => 'PT1', 'total' => 100],
                        ],
                    ],
                    [
                        'id' => 'quarterly_exam',
                        'label' => 'Quarterly Exam',
                        'weight' => 20,
                        'tasks' => [
                            ['id' => 'qe_1', 'label' => 'Quarterly Exam', 'total' => 100],
                        ],
                    ],
                ],
                'students_total' => 0,
            ]);

            $seededClasses[] = [
                'model' => $seededClass,
                'section_name' => $section->section_name,
                'grade_level' => (string) $section->grade_level,
                'strand' => $section->strand,
                'track' => $section->track,
                'class_ordinal' => $index + 1,
            ];
        }

        return $seededClasses;
    }

    /**
     * @param  array<int, array<string, mixed>>  $seededClasses
     * @param  array<string, mixed>  $seededUsers
     */
    private function seedEnrollments(SchoolYearArchive $archive, array $seededClasses, array $seededUsers): void
    {
        $studentPool = collect($seededUsers['students']);

        foreach ($seededClasses as $classData) {
            /** @var ArchiveClass $class */
            $class = $classData['model'];
            $gradeLevel = (string) $classData['grade_level'];
            $sectionName = (string) $classData['section_name'];
            $classOrdinal = (int) $classData['class_ordinal'];

            $students = $studentPool
                ->where('grade_level', $gradeLevel)
                ->where('section_name', $sectionName)
                ->values()
                ->all();

            $studentsTotal = 0;

            foreach ($students as $studentIndex => $studentData) {
                /** @var ArchiveUser $studentUser */
                $studentUser = $studentData['user'];

                $q1 = 78 + (($studentIndex + $classOrdinal) % 12);
                $q2 = min(98, $q1 + (($studentIndex + 2) % 4));
                $final = (int) round(($q1 + $q2) / 2);
                $passed = $final >= 75;

                ArchiveEnrollment::query()->create([
                    'school_year_archive_id' => $archive->id,
                    'archive_class_id' => $class->id,
                    'original_enrollment_id' => null,
                    'student_user_id' => $studentUser->original_user_id,
                    'student_name' => $studentUser->name,
                    'student_username' => $studentUser->username,
                    'student_lrn' => $studentData['lrn'],
                    'grade_level' => $studentData['grade_level'],
                    'section_name' => $studentData['section_name'],
                    'strand' => $studentData['strand'],
                    'track' => $studentData['track'],
                    'initial_grade_q1' => $q1 - 2,
                    'expected_grade_q1' => $q1,
                    'q1_grade' => $q1,
                    'initial_grade_q2' => $q2 - 2,
                    'expected_grade_q2' => $q2,
                    'q2_grade' => $q2,
                    'final_grade' => $final,
                    'remarks' => $passed ? 'Passed' : 'Failed',
                    'passed' => $passed,
                ]);

                $studentsTotal++;
            }

            $class->update(['students_total' => $studentsTotal]);
        }
    }

    private function departmentName(string $departmentCode): string
    {
        return match ($departmentCode) {
            'ABM' => 'Accountancy Business and Management',
            'GAS' => 'General Academic Strand',
            'HUMMS' => 'Humanities and Social Sciences',
            'STEM' => 'Science Technology Engineering and Mathematics',
            'AFA' => 'Agri-Fishery Arts',
            'HE' => 'Home Economics',
            'IA' => 'Industrial Arts',
            'ICT' => 'Information and Communications Technology',
            default => $departmentCode,
        };
    }

    private function departmentTrack(string $departmentCode): string
    {
        return in_array($departmentCode, ['ABM', 'GAS', 'HUMMS', 'STEM'], true)
            ? 'Academic'
            : 'TVL';
    }
}

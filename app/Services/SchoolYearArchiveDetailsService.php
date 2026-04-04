<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\User;

class SchoolYearArchiveDetailsService
{
    /**
     * Build detailed school-year relationships for archive rendering.
     *
     * @return array{teachers: array<int, array<string, mixed>>, departments: array<int, array<string, mixed>>}
     */
    public function build(string $schoolYear): array
    {
        $classes = SchoolClass::query()
            ->where('school_year', $schoolYear)
            ->with([
                'subject:id,subject_name,subject_code',
                'teacher:id,first_name,middle_name,last_name,personal_email,department_id',
                'teacher.department:id,department_name,department_code,is_active',
                'enrollments:id,user_id,class_id',
                'enrollments.user:id,first_name,middle_name,last_name,personal_email,department_id',
                'enrollments.user.department:id,department_name,department_code,is_active',
            ])
            ->orderBy('semester')
            ->orderBy('grade_level')
            ->orderBy('section')
            ->get([
                'id',
                'subject_id',
                'teacher_id',
                'grade_level',
                'section',
                'strand',
                'track',
                'school_year',
                'semester',
            ]);

        $teachers = [];
        $schoolYearTeacherIds = [];
        $schoolYearDepartmentIds = [];

        foreach ($classes as $class) {
            $teacher = $class->teacher;
            if (!$teacher) {
                continue;
            }

            $schoolYearTeacherIds[$teacher->id] = true;
            if ($teacher->department_id) {
                $schoolYearDepartmentIds[$teacher->department_id] = true;
            }

            if (!isset($teachers[$teacher->id])) {
                $teachers[$teacher->id] = [
                    ...$this->formatUser($teacher),
                    'department' => $this->formatDepartment($teacher->department),
                    'classes' => [],
                    'classes_count' => 0,
                    'students_count' => 0,
                ];
            }

            $students = $class->enrollments
                ->map(function (Enrollment $enrollment): ?array {
                    $student = $enrollment->user;

                    if (!$student) {
                        return null;
                    }

                    return [
                        ...$this->formatUser($student),
                        'department' => $this->formatDepartment($student->department),
                    ];
                })
                ->filter()
                ->values()
                ->all();

            $teachers[$teacher->id]['classes'][] = [
                'id' => $class->id,
                'semester' => (string) $class->semester,
                'school_year' => (string) $class->school_year,
                'grade_level' => $class->grade_level,
                'section' => $class->section,
                'strand' => $class->strand,
                'track' => $class->track,
                'subject' => [
                    'id' => $class->subject?->id,
                    'name' => $class->subject?->subject_name,
                    'code' => $class->subject?->subject_code,
                ],
                'students_count' => count($students),
                'students' => $students,
            ];

            $teachers[$teacher->id]['classes_count']++;
            $teachers[$teacher->id]['students_count'] += count($students);
        }

        $teacherDirectory = collect($teachers)
            ->values()
            ->map(function (array $teacher): array {
                $teacher['classes'] = collect($teacher['classes'])
                    ->sortBy(function (array $class): string {
                        $subjectName = (string) data_get($class, 'subject.name', '');
                        $gradeLevel = (string) ($class['grade_level'] ?? '');
                        $section = (string) ($class['section'] ?? '');

                        return strtolower($subjectName . '|' . $gradeLevel . '|' . $section);
                    })
                    ->values()
                    ->all();

                return $teacher;
            })
            ->sortBy(fn(array $teacher): string => strtolower((string) ($teacher['name'] ?? '')))
            ->values()
            ->all();

        $departmentQuery = Department::query()
            ->with([
                'admins:id,first_name,middle_name,last_name,personal_email,department_id',
                'teachers:id,first_name,middle_name,last_name,personal_email,department_id',
            ])
            ->orderBy('department_name');

        if (!empty($schoolYearDepartmentIds)) {
            $departmentQuery->whereIn('id', array_keys($schoolYearDepartmentIds));
        } else {
            $departmentQuery->whereRaw('1 = 0');
        }

        $departments = $departmentQuery
            ->get(['id', 'department_name', 'department_code', 'is_active'])
            ->map(function (Department $department) use ($schoolYearTeacherIds): array {
                $admins = $department->admins
                    ->map(fn(User $admin): array => $this->formatUser($admin))
                    ->sortBy(fn(array $admin): string => strtolower($admin['name']))
                    ->values()
                    ->all();

                $teachers = $department->teachers
                    ->filter(fn(User $teacher): bool => isset($schoolYearTeacherIds[$teacher->id]))
                    ->map(fn(User $teacher): array => $this->formatUser($teacher))
                    ->sortBy(fn(array $teacher): string => strtolower($teacher['name']))
                    ->values()
                    ->all();

                return [
                    'id' => $department->id,
                    'name' => $department->department_name,
                    'code' => $department->department_code,
                    'is_active' => (bool) $department->is_active,
                    'admins_count' => count($admins),
                    'teachers_count' => count($teachers),
                    'admins' => $admins,
                    'teachers' => $teachers,
                ];
            })
            ->values()
            ->all();

        return [
            'teachers' => $teacherDirectory,
            'departments' => $departments,
        ];
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'department_id' => $user->department_id,
        ];
    }

    private function formatDepartment(?Department $department): ?array
    {
        if (!$department) {
            return null;
        }

        return [
            'id' => $department->id,
            'name' => $department->department_name,
            'code' => $department->department_code,
            'is_active' => (bool) $department->is_active,
        ];
    }
}

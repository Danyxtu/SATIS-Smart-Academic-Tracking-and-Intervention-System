<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\Department;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SystemSetting;
use App\Models\User;
use Tests\TestCase;

class SchoolYearRolloverFlowTest extends TestCase
{
    private function seedAcademicSettings(string $schoolYear, string $semester = '2'): void
    {
        SystemSetting::updateOrCreate(
            ['key' => 'current_school_year'],
            ['value' => $schoolYear, 'type' => 'string', 'group' => 'academic']
        );

        SystemSetting::updateOrCreate(
            ['key' => 'current_semester'],
            ['value' => $semester, 'type' => 'integer', 'group' => 'academic']
        );

        SystemSetting::updateOrCreate(
            ['key' => 'enrollment_open'],
            ['value' => 'true', 'type' => 'boolean', 'group' => 'academic']
        );

        SystemSetting::updateOrCreate(
            ['key' => 'grade_submission_open'],
            ['value' => 'true', 'type' => 'boolean', 'group' => 'academic']
        );
    }

    public function test_rollover_promotes_grade11_and_processes_grade12_statuses(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');

        $oldSchoolYear = '2025-2026';
        $newSchoolYear = '2026-2027';
        $this->seedAcademicSettings($oldSchoolYear, '2');

        $department = Department::create([
            'department_name' => 'Science, Technology, Engineering and Mathematics',
            'department_code' => 'STEM',
            'track' => 'Academic',
            'is_active' => true,
        ]);

        /** @var User $grade11Adviser */
        $grade11Adviser = $this->createUserWithRole('teacher', [
            'department_id' => $department->id,
        ]);

        /** @var User $grade12Teacher */
        $grade12Teacher = $this->createUserWithRole('teacher', [
            'department_id' => $department->id,
        ]);

        $grade11Section = Section::create([
            'department_id' => $department->id,
            'advisor_teacher_id' => $grade11Adviser->id,
            'created_by' => $superAdmin->id,
            'section_name' => 'Einstein',
            'section_code' => satis_generate_section_code('11', 'STEM', 'Einstein'),
            'cohort' => '2025',
            'grade_level' => '11',
            'strand' => 'STEM',
            'track' => 'Academic',
            'school_year' => $oldSchoolYear,
            'is_active' => true,
        ]);

        $grade12Section = Section::create([
            'department_id' => $department->id,
            'advisor_teacher_id' => null,
            'created_by' => $superAdmin->id,
            'section_name' => 'Newton',
            'section_code' => satis_generate_section_code('12', 'STEM', 'Newton'),
            'cohort' => '2025',
            'grade_level' => '12',
            'strand' => 'STEM',
            'track' => 'Academic',
            'school_year' => $oldSchoolYear,
            'is_active' => true,
        ]);

        /** @var User $grade11StudentUser */
        $grade11StudentUser = $this->createUserWithRole('student', [
            'department_id' => $department->id,
        ]);

        /** @var User $grade12PassedUser */
        $grade12PassedUser = $this->createUserWithRole('student', [
            'department_id' => $department->id,
        ]);

        /** @var User $grade12FailedUser */
        $grade12FailedUser = $this->createUserWithRole('student', [
            'department_id' => $department->id,
        ]);

        /** @var User $grade12NoEnrollmentUser */
        $grade12NoEnrollmentUser = $this->createUserWithRole('student', [
            'department_id' => $department->id,
        ]);

        $grade11Student = Student::create([
            'user_id' => $grade11StudentUser->id,
            'student_name' => 'Grade11 Student',
            'lrn' => '100000000001',
            'grade_level' => '11',
            'section' => $grade11Section->section_name,
            'section_id' => $grade11Section->id,
            'strand' => 'STEM',
            'track' => 'Academic',
        ]);

        $grade12PassedStudent = Student::create([
            'user_id' => $grade12PassedUser->id,
            'student_name' => 'Grade12 Passed',
            'lrn' => '100000000002',
            'grade_level' => '12',
            'section' => $grade12Section->section_name,
            'section_id' => $grade12Section->id,
            'strand' => 'STEM',
            'track' => 'Academic',
        ]);

        $grade12FailedStudent = Student::create([
            'user_id' => $grade12FailedUser->id,
            'student_name' => 'Grade12 Failed',
            'lrn' => '100000000003',
            'grade_level' => '12',
            'section' => $grade12Section->section_name,
            'section_id' => $grade12Section->id,
            'strand' => 'STEM',
            'track' => 'Academic',
        ]);

        $grade12NoEnrollmentStudent = Student::create([
            'user_id' => $grade12NoEnrollmentUser->id,
            'student_name' => 'Grade12 No Enrollment',
            'lrn' => '100000000004',
            'grade_level' => '12',
            'section' => $grade12Section->section_name,
            'section_id' => $grade12Section->id,
            'strand' => 'STEM',
            'track' => 'Academic',
        ]);

        $subject = Subject::create([
            'subject_name' => 'General Biology 2',
            'subject_code' => 'BIO2',
        ]);

        $grade12Class = SchoolClass::create([
            'subject_id' => $subject->id,
            'section_id' => $grade12Section->id,
            'teacher_id' => $grade12Teacher->id,
            'school_year' => $oldSchoolYear,
            'grade_level' => '12',
            'section' => $grade12Section->section_name,
            'strand' => 'STEM',
            'track' => 'Academic',
            'color' => 'indigo',
            'semester' => '2',
        ]);

        Enrollment::create([
            'user_id' => $grade12PassedUser->id,
            'class_id' => $grade12Class->id,
            'final_grade' => 90,
            'remarks' => 'passed',
        ]);

        Enrollment::create([
            'user_id' => $grade12FailedUser->id,
            'class_id' => $grade12Class->id,
            'final_grade' => 70,
            'remarks' => 'failed',
        ]);

        $response = $this->actingAs($superAdmin)
            ->post(route('superadmin.settings.rollover'), [
                'new_school_year' => $newSchoolYear,
            ]);

        $response->assertSessionHas('success');

        $promotedSection = Section::query()
            ->where('school_year', $newSchoolYear)
            ->where('grade_level', '12')
            ->where('section_code', satis_generate_section_code('12', 'STEM', 'Einstein'))
            ->first();

        $this->assertNotNull($promotedSection);

        $grade11Student->refresh();
        $this->assertSame('12', $grade11Student->grade_level);
        $this->assertSame((int) $promotedSection->id, (int) $grade11Student->section_id);

        $grade12PassedUser->refresh();
        $this->assertSame('inactive', $grade12PassedUser->status);

        $grade12FailedUser->refresh();
        $this->assertSame('active', $grade12FailedUser->status);

        $grade12NoEnrollmentUser->refresh();
        $this->assertSame('active', $grade12NoEnrollmentUser->status);

        $grade12PassedStudent->refresh();
        $this->assertNull($grade12PassedStudent->section_id);

        $grade12FailedStudent->refresh();
        $this->assertNull($grade12FailedStudent->section_id);

        $grade12NoEnrollmentStudent->refresh();
        $this->assertNull($grade12NoEnrollmentStudent->section_id);

        $sectionsIndexResponse = $this->actingAs($superAdmin)
            ->get(route('superadmin.academic-management.index', ['tab' => 'sections']));

        $sectionsIndexResponse->assertOk();
        $sectionsIndexResponse->assertInertia(
            fn($page) => $page
                ->component('SuperAdmin/AcademicManagement/Index')
                ->has('sections.data', 1)
                ->where('sections.data.0.school_year', $newSchoolYear)
                ->where('sections.data.0.grade_level', '12')
                ->where('sections.data.0.section_code', satis_generate_section_code('12', 'STEM', 'Einstein'))
        );
    }

    public function test_recreate_grade11_sections_uses_rollover_templates_with_unassigned_adviser(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');

        $currentSchoolYear = '2026-2027';
        $this->seedAcademicSettings($currentSchoolYear, '1');

        $department = Department::create([
            'department_name' => 'Accountancy, Business and Management',
            'department_code' => 'ABM',
            'track' => 'Academic',
            'is_active' => true,
        ]);

        SystemSetting::updateOrCreate(
            ['key' => 'rollover_last_transition'],
            [
                'value' => json_encode([
                    'old_school_year' => '2025-2026',
                    'new_school_year' => $currentSchoolYear,
                    'promoted_sections_count' => 1,
                    'promoted_students_count' => 1,
                    'graduated_students_count' => 1,
                    'failed_students_count' => 0,
                    'grade11_templates' => [
                        [
                            'department_id' => $department->id,
                            'section_name' => 'Rizal',
                            'section_code' => 'ABM-11-RIZ',
                            'strand' => 'ABM',
                            'track' => 'Academic',
                            'description' => null,
                        ],
                    ],
                ]),
                'type' => 'json',
                'group' => 'academic',
                'updated_by' => $superAdmin->id,
            ]
        );

        $response = $this->actingAs($superAdmin)
            ->post(route('superadmin.academic-management.sections.recreate-grade11'));

        $response->assertRedirect(route('superadmin.academic-management.index', ['tab' => 'sections']));

        $this->assertDatabaseHas('sections', [
            'department_id' => $department->id,
            'section_name' => 'Rizal',
            'section_code' => satis_generate_section_code('11', 'ABM', 'Rizal'),
            'grade_level' => '11',
            'school_year' => $currentSchoolYear,
            'advisor_teacher_id' => null,
        ]);
    }

    public function test_assign_adviser_to_unassigned_grade11_sections_for_current_school_year(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');

        $currentSchoolYear = '2026-2027';
        $this->seedAcademicSettings($currentSchoolYear, '1');

        $department = Department::create([
            'department_name' => 'Humanities and Social Sciences',
            'department_code' => 'HUMSS',
            'track' => 'Academic',
            'is_active' => true,
        ]);

        /** @var User $teacher */
        $teacher = $this->createUserWithRole('teacher', [
            'department_id' => $department->id,
        ]);

        $section = Section::create([
            'department_id' => $department->id,
            'advisor_teacher_id' => null,
            'created_by' => $superAdmin->id,
            'section_name' => 'Mabini',
            'section_code' => satis_generate_section_code('11', 'HUMSS', 'Mabini'),
            'cohort' => '2026',
            'grade_level' => '11',
            'strand' => 'HUMSS',
            'track' => 'Academic',
            'school_year' => $currentSchoolYear,
            'is_active' => true,
        ]);

        $response = $this->actingAs($superAdmin)
            ->post(route('superadmin.academic-management.sections.assign-adviser'), [
                'teacher_id' => $teacher->id,
                'section_ids' => [$section->id],
            ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('sections', [
            'id' => $section->id,
            'advisor_teacher_id' => $teacher->id,
        ]);
    }
}

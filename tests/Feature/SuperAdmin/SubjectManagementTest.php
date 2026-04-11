<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\Subject;
use App\Models\SubjectTeacher;
use App\Models\SubjectType;
use App\Models\User;
use Tests\TestCase;

class SubjectManagementTest extends TestCase
{
    public function test_super_admin_can_view_subject_management_page(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');

        Subject::create([
            'subject_name' => 'General Mathematics',
            'subject_code' => 'GEN-MATH',
        ]);

        $response = $this->actingAs($superAdmin)
            ->get(route('superadmin.subjects.index'));

        $response->assertOk();
        $response->assertInertia(
            fn($page) => $page
                ->component('SuperAdmin/Subjects/Index')
                ->has('subjects')
        );
    }

    public function test_super_admin_can_create_subject(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');

        $response = $this->actingAs($superAdmin)
            ->post(route('superadmin.subjects.store'), [
                'subject_name' => 'Earth and Life Science',
                'subject_code' => 'ELS',
                'semester' => '1',
                'grade_level' => '11',
            ]);

        $response->assertRedirect(route('superadmin.subjects.index'));

        $this->assertDatabaseHas('subjects', [
            'subject_name' => 'Earth and Life Science',
            'subject_code' => 'ELS',
            'semester' => '1',
            'grade_level' => '11',
        ]);
    }

    public function test_super_admin_can_create_subject_queue_with_type_and_hours(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');

        $response = $this->actingAs($superAdmin)
            ->post(route('superadmin.subjects.store'), [
                'type_key' => SubjectType::SPECIALIZED_TVL,
                'semester' => '2',
                'grade_level' => '12',
                'subjects' => [
                    [
                        'subject_name' => 'Computer Systems Servicing',
                        'subject_code' => 'ICT-CSS',
                        'total_hours' => 160,
                    ],
                    [
                        'subject_name' => 'Cookery NC II',
                        'subject_code' => 'TVL-COOKERY',
                        'total_hours' => 160,
                    ],
                ],
            ]);

        $response->assertRedirect(route('superadmin.subjects.index'));

        $this->assertDatabaseHas('subjects', [
            'subject_name' => 'Computer Systems Servicing',
            'subject_code' => 'ICT-CSS',
            'total_hours' => 160,
            'semester' => '2',
            'grade_level' => '12',
        ]);

        $this->assertDatabaseHas('subjects', [
            'subject_name' => 'Cookery NC II',
            'subject_code' => 'TVL-COOKERY',
            'total_hours' => 160,
            'semester' => '2',
            'grade_level' => '12',
        ]);

        $tvlType = SubjectType::query()
            ->where('type_key', SubjectType::SPECIALIZED_TVL)
            ->firstOrFail();

        $cssSubject = Subject::query()
            ->where('subject_code', 'ICT-CSS')
            ->firstOrFail();

        $this->assertDatabaseHas('subject_subject_type', [
            'subject_id' => $cssSubject->id,
            'subject_type_id' => $tvlType->id,
        ]);
    }

    public function test_super_admin_can_update_subject(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');

        $subject = Subject::create([
            'subject_name' => 'Physical Science',
            'subject_code' => 'PS',
        ]);

        $response = $this->actingAs($superAdmin)
            ->put(route('superadmin.subjects.update', $subject), [
                'subject_name' => 'Advanced Physical Science',
                'subject_code' => 'APS',
                'semester' => '2',
                'grade_level' => '12',
            ]);

        $response->assertRedirect(route('superadmin.subjects.index'));

        $this->assertDatabaseHas('subjects', [
            'id' => $subject->id,
            'subject_name' => 'Advanced Physical Science',
            'subject_code' => 'APS',
            'semester' => '2',
            'grade_level' => '12',
        ]);
    }

    public function test_super_admin_can_delete_unused_subject(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');

        $subject = Subject::create([
            'subject_name' => 'Media and Information Literacy',
            'subject_code' => 'MIL',
        ]);

        $response = $this->actingAs($superAdmin)
            ->delete(route('superadmin.subjects.destroy', $subject));

        $response->assertRedirect(route('superadmin.subjects.index'));

        $this->assertDatabaseMissing('subjects', [
            'id' => $subject->id,
        ]);
    }

    public function test_super_admin_cannot_delete_subject_with_assigned_classes(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');
        /** @var User $teacher */
        $teacher = $this->createUserWithRole('teacher');

        $subject = Subject::create([
            'subject_name' => 'Statistics and Probability',
            'subject_code' => 'STAT-PROB',
        ]);

        SubjectTeacher::create([
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'grade_level' => '11',
            'section' => 'STEM-A',
            'color' => 'indigo',
            'strand' => 'STEM',
            'track' => 'Academic',
            'school_year' => '2025-2026',
            'current_quarter' => 1,
            'grade_categories' => [],
            'semester' => '1',
        ]);

        $response = $this->actingAs($superAdmin)
            ->delete(route('superadmin.subjects.destroy', $subject));

        $response->assertSessionHas('error');

        $this->assertDatabaseHas('subjects', [
            'id' => $subject->id,
        ]);
    }

    public function test_non_super_admin_cannot_access_subject_management(): void
    {
        /** @var User $admin */
        $admin = $this->createUserWithRole('admin');

        $response = $this->actingAs($admin)
            ->get(route('superadmin.subjects.index'));

        $response->assertForbidden();
    }

    public function test_super_admin_can_filter_subjects_by_subject_type(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');

        $coreType = SubjectType::query()
            ->where('type_key', SubjectType::CORE)
            ->firstOrFail();

        $tvlType = SubjectType::query()
            ->where('type_key', SubjectType::SPECIALIZED_TVL)
            ->firstOrFail();

        $coreSubject = Subject::create([
            'subject_name' => 'Core Subject Sample',
            'subject_code' => 'CORE-SAMPLE',
        ]);
        $coreSubject->subjectTypes()->sync([$coreType->id]);

        $tvlSubject = Subject::create([
            'subject_name' => 'TVL Subject Sample',
            'subject_code' => 'TVL-SAMPLE',
            'total_hours' => 160,
        ]);
        $tvlSubject->subjectTypes()->sync([$tvlType->id]);

        $response = $this->actingAs($superAdmin)
            ->get(route('superadmin.subjects.index', [
                'type' => SubjectType::SPECIALIZED_TVL,
            ]));

        $response->assertOk();
        $response->assertInertia(
            fn($page) => $page
                ->component('SuperAdmin/Subjects/Index')
                ->where('filters.type', SubjectType::SPECIALIZED_TVL)
                ->has('subjects.data', 1)
                ->where('subjects.data.0.subject_code', 'TVL-SAMPLE')
        );
    }

    public function test_super_admin_can_filter_subjects_by_grade_level(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');

        Subject::create([
            'subject_name' => 'Earth Science Grade 11',
            'subject_code' => 'EARTH-11',
            'grade_level' => '11',
        ]);

        Subject::create([
            'subject_name' => 'Earth Science Grade 12',
            'subject_code' => 'EARTH-12',
            'grade_level' => '12',
        ]);

        $response = $this->actingAs($superAdmin)
            ->get(route('superadmin.subjects.index', [
                'grade_level' => '12',
            ]));

        $response->assertOk();
        $response->assertInertia(
            fn($page) => $page
                ->component('SuperAdmin/Subjects/Index')
                ->where('filters.grade_level', '12')
                ->has('subjects.data', 1)
                ->where('subjects.data.0.subject_code', 'EARTH-12')
        );
    }

    public function test_super_admin_can_filter_subjects_by_semester(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');

        Subject::create([
            'subject_name' => 'Reading and Writing 1st',
            'subject_code' => 'READ-1',
            'semester' => '1',
            'grade_level' => '11',
        ]);

        Subject::create([
            'subject_name' => 'Reading and Writing 2nd',
            'subject_code' => 'READ-2',
            'semester' => '2',
            'grade_level' => '11',
        ]);

        $response = $this->actingAs($superAdmin)
            ->get(route('superadmin.subjects.index', [
                'semester' => '2',
            ]));

        $response->assertOk();
        $response->assertInertia(
            fn($page) => $page
                ->component('SuperAdmin/Subjects/Index')
                ->where('filters.semester', '2')
                ->has('subjects.data', 1)
                ->where('subjects.data.0.subject_code', 'READ-2')
        );
    }
}

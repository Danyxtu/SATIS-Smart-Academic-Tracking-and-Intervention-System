<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\Subject;
use App\Models\SubjectTeacher;
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
            ]);

        $response->assertRedirect(route('superadmin.subjects.index'));

        $this->assertDatabaseHas('subjects', [
            'subject_name' => 'Earth and Life Science',
            'subject_code' => 'ELS',
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
            ]);

        $response->assertRedirect(route('superadmin.subjects.index'));

        $this->assertDatabaseHas('subjects', [
            'id' => $subject->id,
            'subject_name' => 'Advanced Physical Science',
            'subject_code' => 'APS',
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
            'grade_level' => 'Grade 11',
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
}

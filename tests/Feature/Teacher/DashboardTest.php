<?php

namespace Tests\Feature\Teacher;

use App\Models\User;
use App\Models\Subject;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    /**
     * Test teacher can access dashboard
     */
    public function test_teacher_can_access_dashboard(): void
    {
        /** @var User $teacher */
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->get('/teacher/dashboard');

        $response->assertOk();
        $response->assertInertia(
            fn($page) =>
            $page->component('Teacher/Dashboard')
        );
    }

    /**
     * Test unauthenticated user cannot access teacher dashboard
     */
    public function test_unauthenticated_user_cannot_access_teacher_dashboard(): void
    {
        $response = $this->get('/teacher/dashboard');

        $response->assertRedirect('/login');
    }
    /**
     * Test student cannot access teacher dashboard
     */
    public function test_student_cannot_access_teacher_dashboard(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)->get('/teacher/dashboard');

        $response->assertForbidden();
    }

    /**
     * Test pending teacher sees pending approval page
     */
    public function test_pending_teacher_sees_pending_approval_page(): void
    {
        /** @var User $teacher */
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->get('/teacher/pending-approval');

        $response->assertOk();
        $response->assertInertia(
            fn($page) =>
            $page->component('Teacher/PendingApproval')
        );
    }
}

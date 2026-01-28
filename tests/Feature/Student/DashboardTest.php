<?php

namespace Tests\Feature\Student;

use App\Models\User;
use App\Models\Enrollment;
use App\Models\Subject;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    /**
     * Test student can access dashboard
     */
    public function test_student_can_access_dashboard(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)->get('/dashboard');

        $response->assertOk();
        $response->assertInertia(
            fn($page) =>
            $page->component('Student/Dashboard')
        );
    }

    /**
     * Test unauthenticated user cannot access student dashboard
     */
    public function test_unauthenticated_user_cannot_access_student_dashboard(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }
    /**
     * Test teacher cannot access student dashboard
     */
    public function test_teacher_cannot_access_student_dashboard(): void
    {
        /** @var User $teacher */
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->get('/dashboard');

        $response->assertForbidden();
    }

    /**
     * Test dashboard displays enrolled subjects
     */
    public function test_dashboard_displays_enrolled_subjects(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);
        $subject = Subject::factory()->create();
        Enrollment::factory()->for($student)->for($subject)->create();

        $response = $this->actingAs($student)->get('/dashboard');

        $response->assertInertia(
            fn($page) =>
            $page->has('enrollments', 1)
        );
    }

    /**
     * Test student can mark notification as read
     */
    public function test_student_can_mark_notification_as_read(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);
        $notification = \App\Models\StudentNotification::factory()
            ->for($student)
            ->create(['read_at' => null]);

        $response = $this->actingAs($student);
        $response = $this->actingAs($student)
            ->post("/notifications/{$notification->id}/read");

        $response->assertRedirect();
    }

    /**
     * Test student can view analytics
     */
    public function test_student_can_view_analytics(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);
        $subject = Subject::factory()->create();
        $enrollment = Enrollment::factory()->for($student)->for($subject)->create();

        $response = $this->actingAs($student)
            ->get("/analytics/{$enrollment->id}");

        $response->assertOk();
        $response->assertInertia(
            fn($page) =>
            $page->has('enrollment')
        );
    }
}

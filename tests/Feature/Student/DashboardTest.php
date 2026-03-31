<?php

namespace Tests\Feature\Student;

use App\Models\User;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Models\SubjectTeacher;
use App\Models\SystemSetting;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    /**
     * Test student can access dashboard
     */
    public function test_student_can_access_dashboard(): void
    {
        /** @var User $student */
        $student = $this->createUserWithRole('student');

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
        $teacher = $this->createUserWithRole('teacher');

        $response = $this->actingAs($teacher)->get('/dashboard');

        $response->assertForbidden();
    }

    /**
     * Test dashboard displays enrolled subjects
     */
    public function test_dashboard_displays_enrolled_subjects(): void
    {
        /** @var User $student */
        $student = $this->createUserWithRole('student');
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
        $student = $this->createUserWithRole('student');
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
        $student = $this->createUserWithRole('student');
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

    public function test_student_dashboard_is_scoped_to_current_school_year(): void
    {
        /** @var User $student */
        $student = $this->createUserWithRole('student');
        /** @var User $teacher */
        $teacher = $this->createUserWithRole('teacher');

        SystemSetting::set('current_school_year', '2026-2027', $teacher->id);
        SystemSetting::set('current_semester', 1, $teacher->id);

        $currentSubject = Subject::create([
            'subject_name' => 'Current Year Subject',
            'subject_code' => 'STU-CURR-' . uniqid(),
        ]);
        $endedSubject = Subject::create([
            'subject_name' => 'Ended Year Subject',
            'subject_code' => 'STU-END-' . uniqid(),
        ]);

        $currentClass = SubjectTeacher::create([
            'subject_id' => $currentSubject->id,
            'teacher_id' => $teacher->id,
            'school_year' => '2026-2027',
            'semester' => '1',
        ]);
        $endedClass = SubjectTeacher::create([
            'subject_id' => $endedSubject->id,
            'teacher_id' => $teacher->id,
            'school_year' => '2025-2026',
            'semester' => '1',
        ]);

        Enrollment::create([
            'user_id' => $student->id,
            'subject_teachers_id' => $currentClass->id,
        ]);
        Enrollment::create([
            'user_id' => $student->id,
            'subject_teachers_id' => $endedClass->id,
        ]);

        $response = $this->actingAs($student)->get('/dashboard');

        $response->assertOk();
        $response->assertInertia(fn(Assert $page) => $page
            ->component('Student/Dashboard')
            ->where('semesters.schoolYear', '2026-2027')
            ->where('stats.totalSubjects', 1)
            ->where('semesters.semester1Count', 1)
            ->where('semesters.semester2Count', 0));
    }
}

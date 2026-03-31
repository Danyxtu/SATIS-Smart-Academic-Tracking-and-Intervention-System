<?php

namespace Tests\Feature\Teacher;

use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Student;
use App\Models\User;
use App\Models\Subject;
use App\Models\SubjectTeacher;
use App\Models\SystemSetting;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    /**
     * Test teacher can access dashboard
     */
    public function test_teacher_can_access_dashboard(): void
    {
        /** @var User $teacher */
        $teacher = $this->createUserWithRole('teacher');

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
        $student = $this->createUserWithRole('student');

        $response = $this->actingAs($student)->get('/teacher/dashboard');

        $response->assertForbidden();
    }

    /**
     * Test pending teacher sees pending approval page
     */
    public function test_pending_teacher_sees_pending_approval_page(): void
    {
        /** @var User $teacher */
        $teacher = $this->createUserWithRole('teacher');

        $response = $this->actingAs($teacher)->get('/teacher/pending-approval');

        $response->assertOk();
        $response->assertInertia(
            fn($page) =>
            $page->component('Teacher/PendingApproval')
        );
    }

    public function test_teacher_dashboard_stats_are_scoped_to_current_school_year(): void
    {
        /** @var User $teacher */
        $teacher = $this->createUserWithRole('teacher');
        /** @var User $student */
        $student = $this->createUserWithRole('student');

        Student::create([
            'student_name' => 'Dashboard Student',
            'lrn' => 'LRN-' . uniqid(),
            'user_id' => $student->id,
        ]);

        SystemSetting::set('current_school_year', '2026-2027', $teacher->id);
        SystemSetting::set('current_semester', 1, $teacher->id);

        $currentSubject = Subject::create([
            'subject_name' => 'Current Year Subject',
            'subject_code' => 'CURR-' . uniqid(),
        ]);
        $endedSubject = Subject::create([
            'subject_name' => 'Ended Year Subject',
            'subject_code' => 'END-' . uniqid(),
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

        $currentEnrollment = Enrollment::create([
            'user_id' => $student->id,
            'subject_teachers_id' => $currentClass->id,
        ]);
        $endedEnrollment = Enrollment::create([
            'user_id' => $student->id,
            'subject_teachers_id' => $endedClass->id,
        ]);

        Grade::create([
            'enrollment_id' => $currentEnrollment->id,
            'assignment_key' => 'current-q1',
            'assignment_name' => 'Current Quiz',
            'score' => 90,
            'total_score' => 100,
            'quarter' => 1,
        ]);
        Grade::create([
            'enrollment_id' => $endedEnrollment->id,
            'assignment_key' => 'ended-q1',
            'assignment_name' => 'Ended Quiz',
            'score' => 60,
            'total_score' => 100,
            'quarter' => 1,
        ]);

        $response = $this->actingAs($teacher)->get('/teacher/dashboard');

        $response->assertOk();
        $response->assertInertia(fn(Assert $page) => $page
            ->component('Teacher/Dashboard')
            ->where('academicPeriod.schoolYear', '2026-2027')
            ->where('stats.totalStudents', 1)
            ->where('stats.studentsAtRisk', 0)
            ->where('stats.studentsWithGrades', 1));
    }
}

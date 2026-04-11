<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PdfExportRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_priority_students_pdf_export_returns_pdf(): void
    {
        $context = $this->seedPdfExportContext();

        $response = $this->actingAs($context['teacher'])
            ->get(route('teacher.dashboard.priority-students.pdf'));

        $response->assertOk();
        $this->assertPdfResponse($response);
    }

    public function test_teacher_attendance_pdf_export_returns_pdf(): void
    {
        $context = $this->seedPdfExportContext();

        $response = $this->actingAs($context['teacher'])
            ->get(route('teacher.attendance.log.export.pdf', [
                'subjectTeacher' => $context['class']->id,
            ]));

        $response->assertOk();
        $this->assertPdfResponse($response);
    }

    public function test_student_analytics_pdf_export_returns_pdf(): void
    {
        $context = $this->seedPdfExportContext();

        $response = $this->actingAs($context['studentUser'])
            ->get(route('analytics.show.pdf', [
                'enrollment' => $context['enrollment']->id,
            ]));

        $response->assertOk();
        $this->assertPdfResponse($response);
    }

    public function test_student_api_analytics_pdf_export_returns_pdf(): void
    {
        $context = $this->seedPdfExportContext();

        Sanctum::actingAs($context['studentUser']);

        $response = $this->get('/api/student/performance/' . $context['enrollment']->id . '/export/pdf');

        $response->assertOk();
        $this->assertPdfResponse($response);
    }

    private function seedPdfExportContext(): array
    {
        /** @var User $teacher */
        $teacher = $this->createUserWithRole('teacher', ['status' => 'approved']);

        /** @var User $studentUser */
        $studentUser = $this->createUserWithRole('student');

        Student::create([
            'student_name' => 'PDF Export Student',
            'lrn' => 'LRN-' . uniqid(),
            'grade_level' => 'Grade 11',
            'section' => 'A',
            'strand' => 'STEM',
            'track' => 'Academic',
            'user_id' => $studentUser->id,
        ]);

        $schoolYear = '2026-2027';
        SystemSetting::set('current_school_year', $schoolYear, $teacher->id);
        SystemSetting::set('current_semester', 1, $teacher->id);

        $subject = Subject::factory()->create([
            'subject_name' => 'Mathematics',
            'subject_code' => 'MATH-PDF',
        ]);

        $class = SchoolClass::factory()->create([
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'grade_level' => 'Grade 11',
            'section' => 'A',
            'school_year' => $schoolYear,
            'semester' => '1',
            'current_quarter' => 1,
        ]);

        $enrollment = Enrollment::create([
            'user_id' => $studentUser->id,
            'class_id' => $class->id,
        ]);

        Grade::create([
            'enrollment_id' => $enrollment->id,
            'assignment_key' => 'quiz-1',
            'assignment_name' => 'Quiz 1',
            'score' => 60,
            'total_score' => 100,
            'quarter' => 1,
        ]);

        AttendanceRecord::create([
            'enrollment_id' => $enrollment->id,
            'date' => now()->subDay()->toDateString(),
            'status' => 'present',
        ]);

        AttendanceRecord::create([
            'enrollment_id' => $enrollment->id,
            'date' => now()->toDateString(),
            'status' => 'absent',
        ]);

        return [
            'teacher' => $teacher,
            'studentUser' => $studentUser,
            'class' => $class,
            'enrollment' => $enrollment,
        ];
    }

    private function assertPdfResponse(TestResponse $response): void
    {
        $contentType = (string) $response->headers->get('content-type');
        $contentDisposition = (string) $response->headers->get('content-disposition');

        $this->assertStringContainsString('application/pdf', $contentType);
        $this->assertStringContainsString('.pdf', $contentDisposition);

        $content = $response->getContent();
        $this->assertIsString($content);
        $this->assertNotSame('', $content);
        $this->assertStringStartsWith('%PDF', $content);
    }
}

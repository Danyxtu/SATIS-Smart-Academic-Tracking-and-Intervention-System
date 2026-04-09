<?php

use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\getJson;

function createStudentUserForAttendance(): User
{
    $student = User::factory()->create();
    $student->syncRolesByName(['student']);

    return $student;
}

function createEnrollmentWithAttendance(User $student, string $subjectName, array $statuses): Enrollment
{
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    $subject = Subject::factory()->create([
        'subject_name' => $subjectName,
    ]);

    $class = SchoolClass::factory()->create([
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'semester' => '1',
    ]);

    $enrollment = Enrollment::create([
        'user_id' => $student->id,
        'class_id' => $class->id,
    ]);

    foreach ($statuses as $index => $status) {
        AttendanceRecord::create([
            'enrollment_id' => $enrollment->id,
            'date' => Carbon::parse('2026-01-01')->addDays($index)->toDateString(),
            'status' => $status,
        ]);
    }

    return $enrollment;
}

test('student attendance index returns subjects with enrollment id and effective attendance stats', function () {
    $student = createStudentUserForAttendance();
    $enrollment = createEnrollmentWithAttendance($student, 'Mathematics', ['present', 'late', 'excused']);

    Sanctum::actingAs($student);

    $response = getJson('/api/student/attendance');

    $response->assertOk()
        ->assertJsonPath('subjects.0.id', $enrollment->id)
        ->assertJsonPath('subjects.0.enrollmentId', $enrollment->id)
        ->assertJsonPath('subjects.0.name', 'Mathematics')
        ->assertJsonPath('stats.daysPresent', 1)
        ->assertJsonPath('stats.daysExcused', 1)
        ->assertJsonPath('stats.tardiness', 1)
        ->assertJsonPath('stats.overallAttendance', 83);
});

test('student can fetch attendance detail for own enrollment', function () {
    $student = createStudentUserForAttendance();
    $enrollment = createEnrollmentWithAttendance($student, 'Science', ['present', 'absent', 'late', 'excused']);

    Sanctum::actingAs($student);

    $response = getJson("/api/student/attendance/{$enrollment->id}");

    $response->assertOk()
        ->assertJsonPath('subject.enrollmentId', $enrollment->id)
        ->assertJsonPath('subject.name', 'Science')
        ->assertJsonPath('hasStarted', true)
        ->assertJsonPath('summary.total', 4)
        ->assertJsonPath('summary.present', 1)
        ->assertJsonPath('summary.absent', 1)
        ->assertJsonPath('summary.late', 1)
        ->assertJsonPath('summary.excused', 1)
        ->assertJsonPath('summary.rate', 63)
        ->assertJsonCount(4, 'records');
});

test('student cannot fetch attendance detail for another student enrollment', function () {
    $student = createStudentUserForAttendance();
    $otherStudent = createStudentUserForAttendance();

    $otherEnrollment = createEnrollmentWithAttendance($otherStudent, 'History', ['present']);

    Sanctum::actingAs($student);

    $response = getJson("/api/student/attendance/{$otherEnrollment->id}");

    $response->assertNotFound();
});

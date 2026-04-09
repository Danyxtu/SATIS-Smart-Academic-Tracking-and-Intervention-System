<?php

use App\Models\PasswordResetRequest;
use App\Models\Student;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

function createStudentUserWithProfile(array $userOverrides = [], array $studentOverrides = []): User
{
    $studentUser = User::factory()->create(array_merge([
        'first_name' => 'Juan',
        'middle_name' => 'D',
        'last_name' => 'Cruz',
        'personal_email' => 'juan@example.test',
    ], $userOverrides));

    $studentUser->syncRolesByName(['student']);

    Student::create(array_merge([
        'student_name' => 'Juan D Cruz',
        'lrn' => '123456789012',
        'grade_level' => '11',
        'section' => 'STEM-A',
        'strand' => 'STEM',
        'track' => 'Academic',
        'user_id' => $studentUser->id,
    ], $studentOverrides));

    return $studentUser;
}

function createTeacherUser(): User
{
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    return $teacher;
}

test('student can fetch profile from api', function () {
    $studentUser = createStudentUserWithProfile();
    Sanctum::actingAs($studentUser);

    $response = getJson('/api/student/profile');

    $response->assertOk()
        ->assertJsonPath('user.name', 'Juan D Cruz')
        ->assertJsonPath('user.email', 'juan@example.test')
        ->assertJsonPath('student.firstName', 'Juan')
        ->assertJsonPath('student.lastName', 'Cruz')
        ->assertJsonPath('student.lrn', '123456789012')
        ->assertJsonPath('pendingPasswordReset', null);
});

test('student can update profile from api', function () {
    $studentUser = createStudentUserWithProfile();
    Sanctum::actingAs($studentUser);

    $response = putJson('/api/student/profile', [
        'first_name' => 'Maria',
        'middle_name' => 'S',
        'last_name' => 'Santos',
        'email' => 'maria@example.test',
        'student_name' => 'Maria S Santos',
        'lrn' => '987654321098',
        'grade_level' => '12',
        'section' => 'STEM-B',
        'strand' => 'STEM',
        'track' => 'Academic',
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Profile updated successfully.')
        ->assertJsonPath('user.firstName', 'Maria')
        ->assertJsonPath('user.lastName', 'Santos')
        ->assertJsonPath('user.email', 'maria@example.test')
        ->assertJsonPath('student.studentName', 'Maria S Santos')
        ->assertJsonPath('student.gradeLevel', '12')
        ->assertJsonPath('student.section', 'STEM-B');

    assertDatabaseHas('users', [
        'id' => $studentUser->id,
        'first_name' => 'Maria',
        'middle_name' => 'S',
        'last_name' => 'Santos',
        'personal_email' => 'maria@example.test',
    ]);

    assertDatabaseHas('students', [
        'user_id' => $studentUser->id,
        'student_name' => 'Maria S Santos',
        'lrn' => '987654321098',
        'grade_level' => '12',
        'section' => 'STEM-B',
    ]);
});

test('student can request password reset from api', function () {
    $studentUser = createStudentUserWithProfile();
    Sanctum::actingAs($studentUser);

    $response = postJson('/api/student/profile/request-password-reset', [
        'reason' => 'I forgot my password and cannot sign in on my other device.',
    ]);

    $response->assertCreated()
        ->assertJsonPath('pendingPasswordReset.status', 'pending');

    assertDatabaseHas('password_reset_requests', [
        'user_id' => $studentUser->id,
        'status' => PasswordResetRequest::STATUS_PENDING,
        'reason' => 'I forgot my password and cannot sign in on my other device.',
    ]);
});

test('student cannot request duplicate pending password reset', function () {
    $studentUser = createStudentUserWithProfile();
    Sanctum::actingAs($studentUser);

    PasswordResetRequest::create([
        'user_id' => $studentUser->id,
        'reason' => 'Existing request',
        'status' => PasswordResetRequest::STATUS_PENDING,
    ]);

    $response = postJson('/api/student/profile/request-password-reset', [
        'reason' => 'Another request',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('message', 'You already have a pending password reset request.');
});

test('student can cancel pending password reset request from api', function () {
    $studentUser = createStudentUserWithProfile();
    Sanctum::actingAs($studentUser);

    $request = PasswordResetRequest::create([
        'user_id' => $studentUser->id,
        'reason' => 'Need reset',
        'status' => PasswordResetRequest::STATUS_PENDING,
    ]);

    $response = deleteJson('/api/student/profile/cancel-password-reset');

    $response->assertOk()
        ->assertJsonPath('message', 'Your password reset request has been cancelled.');

    assertDatabaseMissing('password_reset_requests', [
        'id' => $request->id,
    ]);
});

test('student can delete own account with current password via api', function () {
    $studentUser = createStudentUserWithProfile();
    Sanctum::actingAs($studentUser);

    $response = deleteJson('/api/student/profile', [
        'password' => 'password',
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Account deleted successfully.');

    assertDatabaseMissing('users', [
        'id' => $studentUser->id,
    ]);
});

test('non student cannot access student profile api endpoints', function () {
    $teacher = createTeacherUser();
    Sanctum::actingAs($teacher);

    $response = getJson('/api/student/profile');

    $response->assertForbidden();
});

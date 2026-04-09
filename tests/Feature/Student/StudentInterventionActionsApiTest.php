<?php

use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

function createStudentUser(): User
{
    $studentUser = User::factory()->create();
    $studentUser->syncRolesByName(['student']);

    return $studentUser;
}

function createStudentIntervention(User $studentUser, array $interventionOverrides = []): array
{
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    $subject = Subject::factory()->create();

    $schoolClass = SchoolClass::factory()->create([
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'semester' => '1',
    ]);

    $enrollment = Enrollment::create([
        'user_id' => $studentUser->id,
        'class_id' => $schoolClass->id,
    ]);

    $intervention = Intervention::create(array_merge([
        'enrollment_id' => $enrollment->id,
        'status' => 'active',
        'type' => 'counselor_referral',
        'notes' => 'Needs monitoring.',
    ], $interventionOverrides));

    return [$intervention, $teacher];
}

test('student can request completion review for eligible intervention', function () {
    $studentUser = createStudentUser();
    Sanctum::actingAs($studentUser);

    [$intervention, $teacher] = createStudentIntervention($studentUser);

    $response = postJson("/api/student/interventions/{$intervention->id}/request-completion", [
        'notes' => 'I completed all required tasks.',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Completion request submitted! Your teacher will review it.');

    $intervention->refresh();

    expect($intervention->completion_requested_at)->not()->toBeNull();
    expect($intervention->completion_request_notes)->toBe('I completed all required tasks.');

    assertDatabaseHas('student_notifications', [
        'user_id' => $teacher->id,
        'sender_id' => $studentUser->id,
        'intervention_id' => $intervention->id,
        'type' => 'alert',
        'title' => 'Completion Request',
    ]);
});

test('student cannot request completion for ineligible intervention type', function () {
    $studentUser = createStudentUser();
    Sanctum::actingAs($studentUser);

    [$intervention] = createStudentIntervention($studentUser, [
        'type' => 'task_list',
    ]);

    $response = postJson("/api/student/interventions/{$intervention->id}/request-completion", [
        'notes' => 'Please review this intervention.',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Cannot request completion for this intervention.');

    $intervention->refresh();
    expect($intervention->completion_requested_at)->toBeNull();
});

test('student cannot request completion for another student intervention', function () {
    $studentUser = createStudentUser();
    Sanctum::actingAs($studentUser);

    $otherStudent = createStudentUser();

    [$otherIntervention] = createStudentIntervention($otherStudent);

    $response = postJson("/api/student/interventions/{$otherIntervention->id}/request-completion", [
        'notes' => 'Unauthorized access attempt.',
    ]);

    $response->assertNotFound();
});

test('interventions index returns completion request metadata for timeline ui', function () {
    $studentUser = createStudentUser();
    Sanctum::actingAs($studentUser);

    [$intervention] = createStudentIntervention($studentUser, [
        'completion_requested_at' => now(),
        'completion_request_notes' => 'I completed all checkpoints this week.',
    ]);

    $response = getJson('/api/student/interventions');

    $response->assertOk()
        ->assertJsonPath('interventions.0.id', $intervention->id)
        ->assertJsonPath('interventions.0.isTier3', true)
        ->assertJsonPath('interventions.0.hasCompletionRequest', true)
        ->assertJsonPath('interventions.0.isPendingApproval', true)
        ->assertJsonPath('interventions.0.completionRequestNotes', 'I completed all checkpoints this week.');
});

test('interventions index returns rejection metadata for retry messaging', function () {
    $studentUser = createStudentUser();
    Sanctum::actingAs($studentUser);

    [$intervention] = createStudentIntervention($studentUser, [
        'completion_requested_at' => null,
        'rejected_at' => now()->subDay(),
        'rejection_reason' => 'Please complete the remaining documentation tasks.',
    ]);

    $response = getJson('/api/student/interventions');

    $response->assertOk()
        ->assertJsonPath('interventions.0.id', $intervention->id)
        ->assertJsonPath('interventions.0.hasCompletionRequest', false)
        ->assertJsonPath('interventions.0.rejectionReason', 'Please complete the remaining documentation tasks.')
        ->assertJsonPath('interventions.0.canRequestCompletion', true);
});

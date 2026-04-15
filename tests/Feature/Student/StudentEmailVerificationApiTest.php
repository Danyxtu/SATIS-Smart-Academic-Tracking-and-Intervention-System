<?php

use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\postJson;

it('requires student personal email and verification after api login', function () {
    $student = $this->createUserWithRole('student', [
        'personal_email' => null,
        'email_verified_at' => null,
    ]);

    $response = postJson('/api/login', [
        'login' => $student->username,
        'password' => 'password',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('requires_personal_email', true)
        ->assertJsonPath('requires_email_verification', true)
        ->assertJsonPath('email_verified', false);
});

it('throttles student api verification resend for three minutes', function () {
    $student = $this->createUserWithRole('student', [
        'personal_email' => 'student.cooldown.api@example.test',
        'email_verified_at' => null,
    ]);

    Sanctum::actingAs($student);

    $firstResponse = postJson('/api/student/email-verification/send', [
        'email' => $student->personal_email,
    ]);

    $firstResponse
        ->assertOk()
        ->assertJsonPath('resend_cooldown_seconds', 180)
        ->assertJsonPath('requires_email_verification', true)
        ->assertJson(fn($json) => $json->where('retry_after_seconds', fn($value) => is_int($value) && $value > 0 && $value <= 180)->etc());

    $secondResponse = postJson('/api/student/email-verification/send', [
        'email' => $student->personal_email,
    ]);

    $secondResponse
        ->assertStatus(429)
        ->assertJsonPath('resend_cooldown_seconds', 180)
        ->assertJson(fn($json) => $json
            ->where('retry_after_seconds', fn($value) => is_int($value) && $value > 0 && $value <= 180)
            ->where('requires_email_verification', true)
            ->etc());
});

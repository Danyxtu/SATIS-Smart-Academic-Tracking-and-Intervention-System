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

it('throttles student api OTP resend for three minutes', function () {
    $student = $this->createUserWithRole('student', [
        'personal_email' => 'student.cooldown.api@example.test',
        'email_verified_at' => null,
    ]);

    Sanctum::actingAs($student);

    $firstResponse = postJson('/api/email-otp/send', [
        'email' => $student->personal_email,
    ]);

    $firstResponse
        ->assertOk()
        ->assertJsonPath('cooldown_seconds', 180)
        ->assertJson(fn($json) => $json->where('resend_in', fn($value) => is_numeric($value) && (int) $value > 0 && (int) $value <= 180)->etc());

    $secondResponse = postJson('/api/email-otp/send', [
        'email' => $student->personal_email,
    ]);

    $secondResponse
        ->assertStatus(429)
        ->assertJsonPath('cooldown_seconds', 180)
        ->assertJson(fn($json) => $json
            ->where('resend_in', fn($value) => is_numeric($value) && (int) $value > 0 && (int) $value <= 180)
            ->etc());
});

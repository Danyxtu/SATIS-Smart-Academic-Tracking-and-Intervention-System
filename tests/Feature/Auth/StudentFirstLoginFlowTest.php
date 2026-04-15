<?php

test('student login redirects to verification setup when personal email is missing', function () {
    $student = $this->createUserWithRole('student', [
        'personal_email' => null,
        'email_verified_at' => null,
    ]);

    $response = $this->post(route('login', absolute: false), [
        'email' => $student->username,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('verification.notice', absolute: false));
});

test('student dashboard is blocked until email is verified', function () {
    $student = $this->createUserWithRole('student', [
        'personal_email' => 'student.needs.verify@example.test',
        'email_verified_at' => null,
    ]);

    $this->actingAs($student)
        ->get(route('dashboard', absolute: false))
        ->assertRedirect(route('verification.notice', absolute: false));
});

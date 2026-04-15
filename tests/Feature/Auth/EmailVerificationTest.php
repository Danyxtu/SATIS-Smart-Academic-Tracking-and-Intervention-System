<?php

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

test('email verification screen can be rendered', function () {
    $user = $this->createUserWithRole('student', [
        'email_verified_at' => null,
    ]);

    $response = $this->actingAs($user)->get('/verify-email');

    $response->assertStatus(200);
});

test('email can be verified', function () {
    $user = $this->createUserWithRole('student', [
        'email_verified_at' => null,
    ]);

    Event::fake();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)]
    );

    $response = $this->actingAs($user)->get($verificationUrl);

    Event::assertDispatched(Verified::class);
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    $response->assertRedirect(route('redirect-after-login', absolute: false) . '?verified=1');
});

test('email is not verified with invalid hash', function () {
    $user = $this->createUserWithRole('student', [
        'email_verified_at' => null,
    ]);

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1('wrong-email')]
    );

    $this->actingAs($user)->get($verificationUrl);

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('verification link clicked while logged out is resumed after login', function () {
    $user = $this->createUserWithRole('student', [
        'email_verified_at' => null,
    ]);

    Event::fake();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)]
    );

    $this->get($verificationUrl)
        ->assertRedirect(route('login', absolute: false));

    $this->post(route('login', absolute: false), [
        'email' => $user->personal_email,
        'password' => 'password',
    ])->assertRedirect($verificationUrl);

    $this->get($verificationUrl)
        ->assertRedirect(route('redirect-after-login', absolute: false) . '?verified=1');

    Event::assertDispatched(Verified::class);
    expect($user->fresh()->email_verified_at)->not->toBeNull();
});

test('verification resend is throttled for three minutes', function () {
    Notification::fake();

    $user = $this->createUserWithRole('student', [
        'personal_email' => 'student.cooldown.web@example.test',
        'email_verified_at' => null,
    ]);

    $this->actingAs($user)
        ->post(route('verification.send', absolute: false), [
            'email' => $user->personal_email,
        ])
        ->assertRedirect();

    Notification::assertSentTo($user, VerifyEmail::class);

    $cooldownResponse = $this->actingAs($user)
        ->post(route('verification.send', absolute: false), [
            'email' => $user->personal_email,
        ]);

    $cooldownResponse
        ->assertRedirect()
        ->assertSessionHasErrors(['email'])
        ->assertSessionHas('status', 'verification-resend-cooldown')
        ->assertSessionHas('retryAfterSeconds', fn($value) => is_int($value) && $value > 0 && $value <= 180)
        ->assertSessionHas('cooldownSeconds', 180);
});

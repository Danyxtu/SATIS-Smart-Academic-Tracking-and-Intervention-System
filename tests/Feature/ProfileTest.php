<?php

use App\Models\User;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertGuest;
use function Pest\Laravel\delete;
use function Pest\Laravel\from;
use function Pest\Laravel\get;
use function Pest\Laravel\patch;

test('profile page is displayed', function () {
    /** @var User $user */
    $user = User::factory()->create();

    actingAs($user);
    $response = get('/profile');

    $response->assertOk();
});

test('profile information can be updated', function () {
    /** @var User $user */
    $user = User::factory()->create();

    actingAs($user);
    $response = patch('/profile', [
        'first_name' => 'Test',
        'middle_name' => 'M',
        'last_name' => 'User',
        'email' => 'test@example.com',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $user->refresh();

    $this->assertSame('Test', $user->first_name);
    $this->assertSame('M', $user->middle_name);
    $this->assertSame('User', $user->last_name);
    $this->assertSame('test@example.com', $user->email);
    $this->assertNull($user->email_verified_at);
});

test('email verification status is unchanged when the email address is unchanged', function () {
    /** @var User $user */
    $user = User::factory()->create();

    actingAs($user);
    $response = patch('/profile', [
        'first_name' => 'Test',
        'middle_name' => 'M',
        'last_name' => 'User',
        'email' => $user->email,
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $this->assertNotNull($user->refresh()->email_verified_at);
});

test('user can delete their account', function () {
    /** @var User $user */
    $user = User::factory()->create();

    actingAs($user);
    $response = delete('/profile', [
        'password' => 'password',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    assertGuest();
    $this->assertNull($user->fresh());
});

test('correct password must be provided to delete account', function () {
    /** @var User $user */
    $user = User::factory()->create();

    actingAs($user);
    $response = from('/profile')->delete('/profile', [
        'password' => 'wrong-password',
    ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/profile');

    $this->assertNotNull($user->fresh());
});

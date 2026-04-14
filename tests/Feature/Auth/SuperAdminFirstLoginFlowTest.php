<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertAuthenticated;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

function makeSuperAdmin(array $attributes = []): User
{
    Role::firstOrCreate(
        ['name' => 'super_admin'],
        ['label' => 'Super Admin']
    );

    $defaults = [
        'username' => 'superadmin',
        'personal_email' => null,
        'password' => Hash::make('TempPass123!'),
        'temporary_password' => 'TempPass123!',
        'must_change_password' => true,
        'email_verified_at' => null,
        'password_changed_at' => null,
    ];

    $user = User::factory()->create(array_merge($defaults, $attributes));
    $user->syncRolesByName(['super_admin']);

    return $user->fresh();
}

test('superadmin login with temporary password is redirected to force change password', function () {
    $user = makeSuperAdmin();

    $response = post('/login', [
        'email' => $user->username,
        'password' => 'TempPass123!',
    ]);

    assertAuthenticated();
    $response->assertRedirect(route('password.force-change', absolute: false));
});

test('superadmin is redirected to verify email after forced password change', function () {
    $user = makeSuperAdmin();

    actingAs($user);

    $response = post('/force-change-password', [
        'password' => 'NewSecure123!',
        'password_confirmation' => 'NewSecure123!',
    ]);

    $user->refresh();

    expect($user->must_change_password)->toBeFalse();
    expect($user->temporary_password)->toBeNull();
    expect($user->password_changed_at)->not->toBeNull();
    expect($user->personal_email)->toBeNull();

    $response->assertRedirect(route('verification.notice', absolute: false));
    $response->assertSessionHas('status', 'verification-email-required');
});

test('superadmin without verified personal email cannot access dashboard', function () {
    $user = makeSuperAdmin([
        'personal_email' => null,
        'must_change_password' => false,
        'email_verified_at' => null,
    ]);

    actingAs($user);
    $response = get('/superadmin/dashboard');

    $response->assertRedirect(route('verification.notice', absolute: false));
});

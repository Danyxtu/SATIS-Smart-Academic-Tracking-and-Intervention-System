<?php

use App\Models\User;

it('generates usernames using two letters, year, and five-digit sequence', function () {
    $username = User::generateUniqueUsername('Hazel Zamora', 2025);

    expect($username)->toBe('hz202500001');
});

it('increments username sequence for the same prefix and year', function () {
    User::factory()->create([
        'first_name' => 'Hazel',
        'last_name' => 'Zamora',
        'username' => 'hz202500001',
    ]);

    $username = User::generateUniqueUsername('Hazel Zamora', 2025);

    expect($username)->toBe('hz202500002');
});

it('auto-generates student-style usernames on create when username is missing', function () {
    $year = (int) now()->format('Y');

    $first = User::factory()->create([
        'first_name' => 'Hazel',
        'last_name' => 'Zamora',
        'username' => null,
    ]);

    $second = User::factory()->create([
        'first_name' => 'Hazel',
        'last_name' => 'Zamora',
        'username' => null,
    ]);

    expect($first->username)->toMatch('/^hz' . $year . '\\d{5}$/');
    expect($first->username)->toBe(sprintf('hz%d%05d', $year, 1));
    expect($second->username)->toBe(sprintf('hz%d%05d', $year, 2));
});

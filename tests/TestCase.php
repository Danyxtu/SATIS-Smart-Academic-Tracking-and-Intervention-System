<?php

namespace Tests;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedDefaultRoles();
    }

    /**
     * Ensure baseline roles are always available in tests.
     */
    protected function seedDefaultRoles(): void
    {
        foreach (['teacher', 'admin', 'super_admin', 'student'] as $roleName) {
            Role::firstOrCreate(
                ['name' => $roleName],
                ['label' => str_replace('_', ' ', ucwords($roleName, '_'))]
            );
        }
    }

    protected function createUserWithRole(string $role, array $attributes = []): User
    {
        return $this->createUserWithRoles([$role], $attributes);
    }

    /**
     * @param  array<int, string>  $roles
     */
    protected function createUserWithRoles(array $roles, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $user->syncRolesByName($roles);

        return $user->fresh();
    }
}

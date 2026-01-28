<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\User;
use App\Models\Department;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    /**
     * Test super admin can access dashboard
     */
    public function test_super_admin_can_access_dashboard(): void
    {
        /** @var User $superAdmin */
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin)->get('/superadmin/dashboard');

        $response->assertOk();
        $response->assertInertia(
            fn($page) =>
            $page->component('SuperAdmin/Dashboard')
        );
    }

    /**
     * Test unauthenticated user cannot access super admin dashboard
     */
    public function test_unauthenticated_user_cannot_access_super_admin_dashboard(): void
    {
        $response = $this->get('/superadmin/dashboard');

        $response->assertRedirect('/login');
    }
    /**
     * Test admin cannot access super admin dashboard
     */
    public function test_admin_cannot_access_super_admin_dashboard(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/superadmin/dashboard');

        $response->assertForbidden();
    }

    /**
     * Test super admin can view departments
     */
    public function test_super_admin_can_view_departments(): void
    {
        /** @var User $superAdmin */
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        Department::factory()->count(3)->create();

        $response = $this->actingAs($superAdmin)->get('/superadmin/departments');

        $response->assertOk();
        $response->assertInertia(
            fn($page) =>
            $page->has('departments')
        );
    }
}

<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    /**
     * Test admin can access dashboard
     */
    public function test_admin_can_access_dashboard(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertOk();
        $response->assertInertia(
            fn($page) =>
            $page->component('Admin/Dashboard')
        );
    }

    /**
     * Test unauthenticated user cannot access admin dashboard
     */
    public function test_unauthenticated_user_cannot_access_admin_dashboard(): void
    {
        $response = $this->get('/admin/dashboard');

        $response->assertRedirect('/login');
    }

    /**
     * Test student cannot access admin dashboard
     */
    public function test_student_cannot_access_admin_dashboard(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)->get('/admin/dashboard');

        $response->assertForbidden();
    }
}

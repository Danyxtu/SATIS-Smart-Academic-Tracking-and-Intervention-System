<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\PasswordResetRequest;
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
        $superAdmin = $this->createUserWithRole('super_admin');

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
        $admin = $this->createUserWithRole('admin');

        $response = $this->actingAs($admin)->get('/superadmin/dashboard');

        $response->assertForbidden();
    }

    /**
     * Test super admin can view departments
     */
    public function test_super_admin_can_view_departments(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');
        Department::factory()->count(3)->create();

        $response = $this->actingAs($superAdmin)->get('/superadmin/departments');

        $response->assertOk();
        $response->assertInertia(
            fn($page) =>
            $page->has('departments')
        );
    }

    public function test_dashboard_includes_pending_password_request_count(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');
        /** @var User $teacher */
        $teacher = $this->createUserWithRole('teacher');
        /** @var User $student */
        $student = $this->createUserWithRole('student');
        /** @var User $admin */
        $admin = $this->createUserWithRole('admin');

        PasswordResetRequest::create([
            'user_id' => $teacher->id,
            'reason' => 'Teacher pending request',
            'status' => PasswordResetRequest::STATUS_PENDING,
        ]);

        PasswordResetRequest::create([
            'user_id' => $student->id,
            'reason' => 'Student pending request',
            'status' => PasswordResetRequest::STATUS_PENDING,
        ]);

        PasswordResetRequest::create([
            'user_id' => $admin->id,
            'reason' => 'Admin pending request',
            'status' => PasswordResetRequest::STATUS_PENDING,
        ]);

        PasswordResetRequest::create([
            'user_id' => $teacher->id,
            'reason' => 'Teacher approved request',
            'status' => PasswordResetRequest::STATUS_APPROVED,
        ]);

        $response = $this->actingAs($superAdmin)->get('/superadmin/dashboard');

        $response->assertOk();
        $response->assertInertia(
            fn($page) => $page->where('stats.pending_password_reset_requests', 2)
        );
    }
}

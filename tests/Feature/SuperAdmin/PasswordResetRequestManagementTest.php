<?php

namespace Tests\Feature\SuperAdmin;

use App\Mail\TemporaryCredentials;
use App\Models\PasswordResetRequest;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetRequestManagementTest extends TestCase
{
    public function test_super_admin_can_view_teacher_and_student_password_reset_requests(): void
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
            'reason' => 'Teacher reset request',
            'status' => PasswordResetRequest::STATUS_PENDING,
        ]);

        PasswordResetRequest::create([
            'user_id' => $student->id,
            'reason' => 'Student reset request',
            'status' => PasswordResetRequest::STATUS_PENDING,
        ]);

        PasswordResetRequest::create([
            'user_id' => $admin->id,
            'reason' => 'Admin reset request',
            'status' => PasswordResetRequest::STATUS_PENDING,
        ]);

        $response = $this->actingAs($superAdmin)
            ->get(route('superadmin.password-reset-requests'));

        $response->assertOk();
        $response->assertInertia(
            fn($page) => $page
                ->component('SuperAdmin/PasswordResetRequests')
                ->where('counts.pending', 2)
                ->where('counts.all', 2)
                ->has('requests.data', 2)
        );
    }

    public function test_super_admin_can_approve_teacher_password_reset_request(): void
    {
        Mail::fake();

        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');
        /** @var User $teacher */
        $teacher = $this->createUserWithRole('teacher');

        $previousHashedPassword = $teacher->password;

        $passwordResetRequest = PasswordResetRequest::create([
            'user_id' => $teacher->id,
            'reason' => 'Forgot password',
            'status' => PasswordResetRequest::STATUS_PENDING,
        ]);

        $response = $this->actingAs($superAdmin)
            ->from(route('superadmin.password-reset-requests'))
            ->post(route('superadmin.password-reset-requests.approve', $passwordResetRequest), [
                'admin_notes' => 'Verified identity in office.',
            ]);

        $response->assertRedirect(route('superadmin.password-reset-requests'));
        $response->assertSessionHas('success');

        $teacher->refresh();

        $this->assertNotSame($previousHashedPassword, $teacher->password);
        $this->assertTrue($teacher->must_change_password);
        $this->assertNull($teacher->password_changed_at);

        $this->assertDatabaseHas('password_reset_requests', [
            'id' => $passwordResetRequest->id,
            'status' => PasswordResetRequest::STATUS_APPROVED,
            'admin_notes' => 'Verified identity in office.',
            'processed_by' => $superAdmin->id,
        ]);

        Mail::assertQueued(TemporaryCredentials::class, function (TemporaryCredentials $mail) use ($teacher) {
            return $mail->user->is($teacher)
                && $mail->context === 'password reset';
        });
    }

    public function test_super_admin_can_reject_student_password_reset_request(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');
        /** @var User $student */
        $student = $this->createUserWithRole('student');

        $passwordResetRequest = PasswordResetRequest::create([
            'user_id' => $student->id,
            'reason' => 'Lost password',
            'status' => PasswordResetRequest::STATUS_PENDING,
        ]);

        $response = $this->actingAs($superAdmin)
            ->from(route('superadmin.password-reset-requests'))
            ->post(route('superadmin.password-reset-requests.reject', $passwordResetRequest), [
                'admin_notes' => 'Identity verification failed.',
            ]);

        $response->assertRedirect(route('superadmin.password-reset-requests'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('password_reset_requests', [
            'id' => $passwordResetRequest->id,
            'status' => PasswordResetRequest::STATUS_REJECTED,
            'admin_notes' => 'Identity verification failed.',
            'processed_by' => $superAdmin->id,
        ]);
    }

    public function test_admin_cannot_access_super_admin_password_reset_requests_page(): void
    {
        /** @var User $admin */
        $admin = $this->createUserWithRole('admin');

        $response = $this->actingAs($admin)
            ->get(route('superadmin.password-reset-requests'));

        $response->assertForbidden();
    }

    public function test_super_admin_cannot_process_admin_password_reset_request(): void
    {
        /** @var User $superAdmin */
        $superAdmin = $this->createUserWithRole('super_admin');
        /** @var User $admin */
        $admin = $this->createUserWithRole('admin');

        $passwordResetRequest = PasswordResetRequest::create([
            'user_id' => $admin->id,
            'reason' => 'Admin request should stay out of scope',
            'status' => PasswordResetRequest::STATUS_PENDING,
        ]);

        $response = $this->actingAs($superAdmin)
            ->post(route('superadmin.password-reset-requests.approve', $passwordResetRequest));

        $response->assertForbidden();

        $this->assertDatabaseHas('password_reset_requests', [
            'id' => $passwordResetRequest->id,
            'status' => PasswordResetRequest::STATUS_PENDING,
            'processed_by' => null,
        ]);
    }
}

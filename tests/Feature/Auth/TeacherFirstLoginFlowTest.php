<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TeacherFirstLoginFlowTest extends TestCase
{
    private function makeTeacher(array $attributes = []): User
    {
        $defaults = [
            'username' => 'teach' . random_int(1000, 9999),
            'personal_email' => 'teacher' . random_int(1000, 9999) . '@example.com',
            'password' => Hash::make('TempPass123!'),
            'temporary_password' => 'TempPass123!',
            'must_change_password' => true,
            'email_verified_at' => null,
            'password_changed_at' => null,
        ];

        return $this->createUserWithRole('teacher', array_merge($defaults, $attributes))->fresh();
    }

    public function test_teacher_login_with_temporary_password_redirects_to_force_change_password(): void
    {
        $teacher = $this->makeTeacher();

        $response = $this->post('/login', [
            'email' => (string) $teacher->personal_email,
            'password' => 'TempPass123!',
        ]);

        $response->assertRedirect(route('password.force-change', absolute: false));
    }

    public function test_teacher_is_redirected_to_verify_email_after_forced_password_change(): void
    {
        $teacher = $this->makeTeacher();

        $response = $this->actingAs($teacher)->post('/force-change-password', [
            'password' => 'NewSecure123!',
            'password_confirmation' => 'NewSecure123!',
        ]);

        $teacher->refresh();

        $this->assertFalse($teacher->must_change_password);
        $this->assertNull($teacher->temporary_password);
        $this->assertNotNull($teacher->password_changed_at);

        $response->assertRedirect(route('verification.notice', absolute: false));
        $response->assertSessionHas('status', 'verification-email-required');
    }

    public function test_unverified_teacher_cannot_access_teacher_dashboard(): void
    {
        $teacher = $this->makeTeacher([
            'must_change_password' => false,
            'email_verified_at' => null,
        ]);

        $response = $this->actingAs($teacher)->get('/teacher/dashboard');

        $response->assertRedirect(route('verification.notice', absolute: false));
    }
}

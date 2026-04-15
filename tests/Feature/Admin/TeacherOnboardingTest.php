<?php

namespace Tests\Feature\Admin;

use App\Mail\TeacherCredentials;
use App\Models\Department;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TeacherOnboardingTest extends TestCase
{
    public function test_admin_creates_teacher_with_auto_generated_credentials_and_email(): void
    {
        Mail::fake();

        $department = Department::create([
            'department_name' => 'Science Department',
            'department_code' => 'SCI',
            'is_active' => true,
        ]);

        $admin = $this->createUserWithRole('admin', [
            'department_id' => $department->id,
        ]);

        $response = $this->actingAs($admin)->post(route('admin.users.store'), [
            'first_name' => 'Aira',
            'middle_name' => 'Mae',
            'last_name' => 'Santos',
            'email' => 'aira.santos@example.com',
            'role' => 'teacher',
        ]);

        $response->assertRedirect(route('admin.users.index'));
        $response->assertSessionHas('success');

        $teacher = User::query()->where('personal_email', 'aira.santos@example.com')->firstOrFail();

        $this->assertTrue($teacher->hasRole('teacher'));
        $this->assertSame($department->id, $teacher->department_id);
        $this->assertTrue($teacher->must_change_password);
        $this->assertNull($teacher->email_verified_at);
        $this->assertNotNull($teacher->temporary_password);
        $this->assertNotEmpty($teacher->username);
        $this->assertTrue(Hash::check((string) $teacher->temporary_password, (string) $teacher->getRawOriginal('password')));

        Mail::assertQueued(TeacherCredentials::class, function (TeacherCredentials $mail) use ($teacher, $admin) {
            return $mail->teacher->is($teacher)
                && $mail->issuedBy?->is($admin)
                && $mail->plainPassword !== '';
        });
    }
}

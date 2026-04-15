<?php

namespace Tests\Feature\SuperAdmin;

use App\Mail\TeacherCredentials;
use App\Models\Department;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TeacherOnboardingTest extends TestCase
{
    public function test_super_admin_user_management_creates_teacher_with_generated_credentials(): void
    {
        Mail::fake();

        $department = Department::create([
            'department_name' => 'Mathematics Department',
            'department_code' => 'MATH',
            'is_active' => true,
        ]);

        $superAdmin = $this->createUserWithRole('super_admin');

        $response = $this->actingAs($superAdmin)->post(route('superadmin.users.store'), [
            'first_name' => 'Luna',
            'middle_name' => 'Reyes',
            'last_name' => 'Dela Cruz',
            'email' => 'luna.delacruz@example.com',
            'role' => 'teacher',
            'teacher_mode' => 'single',
            'department_id' => $department->id,
        ]);

        $response->assertRedirect(route('superadmin.users.index'));
        $response->assertSessionHas('success');

        $teacher = User::query()->where('personal_email', 'luna.delacruz@example.com')->firstOrFail();

        $this->assertTrue($teacher->hasRole('teacher'));
        $this->assertSame($department->id, $teacher->department_id);
        $this->assertTrue($teacher->must_change_password);
        $this->assertNull($teacher->email_verified_at);
        $this->assertNotNull($teacher->temporary_password);
        $this->assertNotEmpty($teacher->username);
        $this->assertTrue(Hash::check((string) $teacher->temporary_password, (string) $teacher->getRawOriginal('password')));

        Mail::assertQueued(TeacherCredentials::class, function (TeacherCredentials $mail) use ($teacher, $superAdmin) {
            return $mail->teacher->is($teacher)
                && $mail->issuedBy?->is($superAdmin)
                && $mail->plainPassword !== '';
        });
    }

    public function test_super_admin_department_teacher_creation_sends_credentials_email(): void
    {
        Mail::fake();

        $department = Department::create([
            'department_name' => 'English Department',
            'department_code' => 'ENG',
            'is_active' => true,
        ]);

        $superAdmin = $this->createUserWithRole('super_admin');

        $response = $this->actingAs($superAdmin)->postJson(
            route('superadmin.departments.teachers.store', $department),
            [
                'first_name' => 'Jade',
                'middle_name' => 'Anne',
                'last_name' => 'Mendoza',
                'email' => 'jade.mendoza@example.com',
            ]
        );

        $response->assertStatus(201);

        $teacher = User::query()->where('personal_email', 'jade.mendoza@example.com')->firstOrFail();

        $this->assertTrue($teacher->hasRole('teacher'));
        $this->assertSame($department->id, $teacher->department_id);
        $this->assertTrue($teacher->must_change_password);
        $this->assertNull($teacher->email_verified_at);
        $this->assertNotNull($teacher->temporary_password);
        $this->assertNotEmpty($teacher->username);
        $this->assertTrue(Hash::check((string) $teacher->temporary_password, (string) $teacher->getRawOriginal('password')));

        Mail::assertQueued(TeacherCredentials::class, function (TeacherCredentials $mail) use ($teacher, $superAdmin) {
            return $mail->teacher->is($teacher)
                && $mail->issuedBy?->is($superAdmin)
                && $mail->plainPassword !== '';
        });
    }
}

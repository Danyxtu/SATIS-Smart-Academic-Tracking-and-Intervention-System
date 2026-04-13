<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SuperAdminProductionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $username = 'superadmin.prod';
        $temporaryPassword = $this->generateTemporaryPassword();

        $user = User::query()->updateOrCreate(
            ['username' => $username],
            [
                'first_name' => 'Production',
                'last_name' => 'Super Admin',
                'middle_name' => null,
                'personal_email' => null,
                'temporary_password' => $temporaryPassword,
                'password' => Hash::make($temporaryPassword),
                'must_change_password' => true,
                'password_changed_at' => null,
                'status' => 'active',
                'department_id' => null,
                'email_verified_at' => null,
            ]
        );

        Role::firstOrCreate(
            ['name' => 'teacher'],
            ['label' => 'Teacher']
        );

        Role::firstOrCreate(
            ['name' => 'super_admin'],
            ['label' => 'Super Admin']
        );

        $user->syncRolesByName(['teacher', 'super_admin']);

        $this->command?->warn('Store these credentials securely.');
        $this->outputCredentialsTable($username, $temporaryPassword);
        $this->command?->info('Personal email is intentionally empty for this seeded account.');
        $this->command?->info('This account is forced to set a new password on first login.');
    }

    private function generateTemporaryPassword(): string
    {
        return Str::lower(Str::random(4)) . Str::upper(Str::random(4)) . random_int(100, 999) . '@Satis';
    }

    private function outputCredentialsTable(string $username, string $temporaryPassword): void
    {
        $this->command?->table(
            ['Username', 'Password'],
            [[
                $username,
                $temporaryPassword,
            ]]
        );
    }
}

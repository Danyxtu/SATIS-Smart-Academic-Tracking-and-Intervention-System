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
        $username = 'superadmin';
        $temporaryPassword = $this->generateTemporaryPassword();

        $user = User::query()->updateOrCreate(
            ['username' => $username],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
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
            ['name' => 'super_admin'],
            ['label' => 'Super Admin']
        );

        $user->syncRolesByName(['super_admin']);

        $this->outputCredentialsTable($username, $temporaryPassword);
    }

    private function generateTemporaryPassword(): string
    {
        return Str::lower(Str::random(4)) . Str::upper(Str::random(4)) . random_int(100, 999) . '@Satis';
    }

    private function outputCredentialsTable(string $username, string $temporaryPassword): void
    {
        $this->command?->table(
            ['Username', 'Temporary Password'],
            [[
                $username,
                $temporaryPassword,
            ]]
        );
    }
}

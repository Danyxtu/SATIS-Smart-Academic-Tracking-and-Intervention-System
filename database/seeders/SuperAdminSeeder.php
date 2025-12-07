<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the super admin user
        User::updateOrCreate(
            ['email' => 'superadmin@satis.edu'],
            [
                'name' => 'Super Admin',
                'password' => 'superadmin123',
                'temp_password' => 'superadmin123',
                'must_change_password' => true,
                'role' => 'super_admin',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Super Admin created successfully!');
        $this->command->table(
            ['Email', 'Password'],
            [['superadmin@satis.edu', 'superadmin123']]
        );
    }
}

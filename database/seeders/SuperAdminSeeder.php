<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdmin = User::updateOrCreate(
            ['email' => 'superadmin@satis.edu'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'password' => Hash::make('superadmin123'),
                'temp_password' => 'superadmin123',
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]
        );

        $role = Role::firstOrCreate(
            ['name' => 'super_admin'],
            ['label' => 'Super Admin']
        );

        $superAdmin->roles()->syncWithoutDetaching([$role->id]);

        $this->command->info('Super Admin created successfully!');
        $this->command->table(
            ['Email', 'Password'],
            [['superadmin@satis.edu', 'superadmin123']]
        );
    }
}

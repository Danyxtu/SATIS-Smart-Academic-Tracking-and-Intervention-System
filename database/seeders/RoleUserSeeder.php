<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class RoleUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure roles exist
        $roles = [
            ['name' => 'teacher',     'label' => 'Teacher'],
            ['name' => 'admin',       'label' => 'Admin'],
            ['name' => 'super_admin', 'label' => 'Super Admin'],
            ['name' => 'student',     'label' => 'Student'],
        ];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }

        // Create a main superadmin user
        $superadmin = User::updateOrCreate(
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
        $superadminRole = Role::where('name', 'super_admin')->first();
        $superadmin->roles()->sync([$superadminRole->id]);

        // Create a user with both teacher and superadmin roles
        $teacherSuperadmin = User::updateOrCreate(
            ['email' => 'teachsa@satis.edu'],
            [
                'first_name' => 'Teach',
                'last_name' => 'SA',
                'password' => Hash::make('teachsa123'),
                'temp_password' => 'teachsa123',
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]
        );
        $teacherRole = Role::where('name', 'teacher')->first();
        $teacherSuperadmin->roles()->sync([$teacherRole->id, $superadminRole->id]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TeacherSuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teacherSuperAdmin = User::updateOrCreate(
            ['personal_email' => 'teachsa@satis.edu'],
            [
                'first_name' => 'Teach',
                'last_name' => 'SA',
                'username' => 'teachsa',
                'password' => Hash::make('teachsa123'),
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]
        );

        $teacherRole = Role::firstOrCreate(
            ['name' => 'teacher'],
            ['label' => 'Teacher']
        );

        $superAdminRole = Role::firstOrCreate(
            ['name' => 'super_admin'],
            ['label' => 'Super Admin']
        );

        $teacherSuperAdmin->roles()->syncWithoutDetaching([
            $teacherRole->id,
            $superAdminRole->id,
        ]);

        $this->command->info('Teacher + Super Admin created successfully!');
        $this->command->table(
            ['Email', 'Password', 'Roles'],
            [['teachsa@satis.edu', 'teachsa123', 'teacher, super_admin']]
        );
    }
}

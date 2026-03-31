<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // First, create a default department if it doesn't exist
        $department = Department::firstOrCreate(
            ['department_code' => 'DEFAULT'],
            [
                'department_name' => 'Default Department',
                'description' => 'Default department for testing',
                'is_active' => true,
            ]
        );

        // Create the admin user
        $admin = User::updateOrCreate(
            ['personal_email' => 'admin@satis.edu'],
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'username' => 'admin',
                'password' => bcrypt('admin123'),
                'temp_password' => 'admin123',
                'must_change_password' => true,
                'department_id' => $department->id,
                'email_verified_at' => now(),
            ]
        );

        $admin->syncRolesByName(['admin']);

        $this->command->info('Admin user created successfully!');
        $this->command->table(
            ['Email', 'Password', 'Department'],
            [['admin@satis.edu', 'admin123', $department->department_name]]
        );
    }
}

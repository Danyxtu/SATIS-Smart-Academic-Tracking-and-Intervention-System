<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

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
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use PHPUnit\Metadata\Test;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            DepartmentSeeder::class,
            SubjectSeeder::class,
            RoleUserSeeder::class,
            SuperAdminSeeder::class,
            TeacherSuperAdminSeeder::class,
            TestUserSeeder::class,
        ]);
    }
}

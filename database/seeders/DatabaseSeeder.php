<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // Core production bootstrap seeders (keep enabled).
            RoleUserSeeder::class,
            SuperAdminProductionSeeder::class,

            // Keep archive seeding enabled for production readiness.
            SchoolYearArchiveSeeder::class,

            // Optional subject/department/teacher/student data seeders. Comment in/out as needed.
            // DepartmentSeeder::class,
            // SubjectTypeSeeder::class,
            // SubjectSeeder::class,
            // TeacherSuperAdminSeeder::class,
            // TestUserSeeder::class,
        ]);
    }
}

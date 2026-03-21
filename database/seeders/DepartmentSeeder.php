<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            [
                'department_name' => 'Information and Communications Technology',
                'department_code' => 'ICT',
                'description' => 'Focuses on computer science, programming, and IT.',
                'is_active' => true,
            ],
            [
                'department_name' => 'Science, Technology, Engineering, and Mathematics',
                'department_code' => 'STEM',
                'description' => 'Emphasizes science and math education.',
                'is_active' => true,
            ],
            [
                'department_name' => 'Accountancy, Business, and Management',
                'department_code' => 'ABM',
                'description' => 'Business, finance, and management studies.',
                'is_active' => true,
            ],
            [
                'department_name' => 'Humanities and Social Sciences',
                'department_code' => 'HUMSS',
                'description' => 'Covers humanities, social sciences, and communication.',
                'is_active' => true,
            ],
            [
                'department_name' => 'General Academic Strand',
                'department_code' => 'GAS',
                'description' => 'General academic curriculum for undecided students.',
                'is_active' => true,
            ],
            [
                'department_name' => 'Technical-Vocational-Livelihood',
                'department_code' => 'TVL',
                'description' => 'Technical and vocational skills training.',
                'is_active' => true,
            ],
            [
                'department_name' => 'Sports Track',
                'department_code' => 'SPORTS',
                'description' => 'Focuses on sports and physical education.',
                'is_active' => true,
            ],
            [
                'department_name' => 'Arts and Design Track',
                'department_code' => 'ARTS',
                'description' => 'Covers visual arts, music, and design.',
                'is_active' => true,
            ],
            [
                'department_name' => 'Maritime',
                'department_code' => 'MARITIME',
                'description' => 'Maritime studies and training.',
                'is_active' => true,
            ],
            [
                'department_name' => 'Health Allied',
                'department_code' => 'HEALTH',
                'description' => 'Health sciences and allied health programs.',
                'is_active' => true,
            ],
        ];

        foreach ($departments as $dept) {
            Department::create($dept);
        }
    }
}

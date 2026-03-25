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
                'department_name' => 'STEM',
                'department_code' => 'STEM',
                'description' => 'Science, Technology, Engineering, and Mathematics strand.',
                'is_active' => true,
            ],
            [
                'department_name' => 'ABM',
                'department_code' => 'ABM',
                'description' => 'Accountancy, Business, and Management strand.',
                'is_active' => true,
            ],
            [
                'department_name' => 'HUMMS',
                'department_code' => 'HUMMS',
                'description' => 'Humanities and Social Sciences strand.',
                'is_active' => true,
            ],
            [
                'department_name' => 'ICT-CSS',
                'department_code' => 'ICT-CSS',
                'description' => 'Information and Communications Technology - Computer Systems Servicing.',
                'is_active' => true,
            ],
            [
                'department_name' => 'ICT-CHS',
                'department_code' => 'ICT-CHS',
                'description' => 'Information and Communications Technology - Computer Hardware Servicing.',
                'is_active' => true,
            ],
            [
                'department_name' => 'ICT-Technical Drafting',
                'department_code' => 'ICT-TD',
                'description' => 'Information and Communications Technology - Technical Drafting.',
                'is_active' => true,
            ],
            [
                'department_name' => 'Cookery',
                'department_code' => 'COOKERY',
                'description' => 'Technical-vocational strand focused on cookery skills.',
                'is_active' => true,
            ],
            [
                'department_name' => 'Embroidery',
                'department_code' => 'EMBROIDERY',
                'description' => 'Technical-vocational strand focused on embroidery skills.',
                'is_active' => true,
            ],
        ];

        foreach ($departments as $dept) {
            Department::updateOrCreate(
                ['department_code' => $dept['department_code']],
                $dept
            );
        }
    }
}

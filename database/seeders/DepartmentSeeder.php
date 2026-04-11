<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Specialization;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            [
                'department_name' => 'Accountancy Business and Management',
                'department_code' => 'ABM',
                'track' => 'Academic',
                'description' => 'Accountancy, Business, and Management under the Academic track.',
                'is_active' => true,
                'specializations' => [
                    'Accountancy Business and Management (ABM)',
                ],
            ],
            [
                'department_name' => 'General Academic Strand',
                'department_code' => 'GAS',
                'track' => 'Academic',
                'description' => 'General Academic Strand under the Academic track.',
                'is_active' => true,
                'specializations' => [
                    'General Academic Strand (GAS)',
                ],
            ],
            [
                'department_name' => 'Humanities and Social Sciences',
                'department_code' => 'HUMMS',
                'track' => 'Academic',
                'description' => 'Humanities and Social Sciences under the Academic track.',
                'is_active' => true,
                'specializations' => [
                    'Humanities and Social Sciences (HUMMS)',
                ],
            ],
            [
                'department_name' => 'Science Technology Engineering and Mathematics',
                'department_code' => 'STEM',
                'track' => 'Academic',
                'description' => 'Science, Technology, Engineering, and Mathematics under the Academic track.',
                'is_active' => true,
                'specializations' => [
                    'Science Technology Engineering and Mathematics (STEM)',
                ],
            ],
            [
                'department_name' => 'Agri-Fishery Arts',
                'department_code' => 'AFA',
                'track' => 'TVL',
                'description' => 'Agri-Fishery Arts under the TVL track.',
                'is_active' => true,
                'specializations' => [
                    'Crop Production',
                    'Animal Production',
                    'Food Processing',
                ],
            ],
            [
                'department_name' => 'Home Economics',
                'department_code' => 'HE',
                'track' => 'TVL',
                'description' => 'Home Economics under the TVL track.',
                'is_active' => true,
                'specializations' => [
                    'Cookery',
                    'Bread and Pastry Production',
                    'Food and Beverage Services',
                ],
            ],
            [
                'department_name' => 'Industrial Arts',
                'department_code' => 'IA',
                'track' => 'TVL',
                'description' => 'Industrial Arts under the TVL track.',
                'is_active' => true,
                'specializations' => [
                    'Electrical Installation and Maintenance',
                    'Shielded Metal Arc Welding',
                    'Automotive Servicing',
                ],
            ],
            [
                'department_name' => 'Information and Communications Technology',
                'department_code' => 'ICT',
                'track' => 'TVL',
                'description' => 'Information and Communications Technology under the TVL track.',
                'is_active' => true,
                'specializations' => [
                    'Computer Systems Servicing',
                    'Technical Drafting',
                    'Computer Hardware Servicing',
                ],
            ],
        ];

        $targetDepartmentCodes = collect($departments)
            ->pluck('department_code')
            ->values()
            ->all();

        Department::query()
            ->whereNotIn('department_code', $targetDepartmentCodes)
            ->get()
            ->each(function (Department $department): void {
                $department->specializations()->detach();
                $department->delete();
            });

        foreach ($departments as $dept) {
            $specializationNames = $dept['specializations'] ?? [];
            unset($dept['specializations']);

            $department = Department::updateOrCreate(
                ['department_code' => $dept['department_code']],
                $dept
            );

            $specializationIds = collect($specializationNames)
                ->map(fn(string $name) => Specialization::firstOrCreate([
                    'specialization_name' => trim($name),
                ])->id)
                ->all();

            $department->specializations()->sync($specializationIds);
        }

        Specialization::query()
            ->whereDoesntHave('departments')
            ->delete();
    }
}

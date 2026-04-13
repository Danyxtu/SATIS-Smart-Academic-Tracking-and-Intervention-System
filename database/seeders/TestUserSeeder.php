<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::firstOrCreate(
            ['name' => 'teacher'],
            ['label' => 'Teacher']
        );

        Role::firstOrCreate(
            ['name' => 'admin'],
            ['label' => 'Admin']
        );

        Role::firstOrCreate(
            ['name' => 'super_admin'],
            ['label' => 'Super Admin']
        );

        $departmentCodeOrder = ['ABM', 'GAS', 'HUMMS', 'STEM', 'AFA', 'HE', 'IA', 'ICT'];

        $departmentIdByCode = Department::query()
            ->whereIn('department_code', $departmentCodeOrder)
            ->get(['id', 'department_code'])
            ->pluck('id', 'department_code');

        $testerUsers = [
            [
                'personal_email' => 'sheena@test.com',
                'first_name' => 'Sheena',
                'last_name' => 'DeGuzman',
                'username' => 'sheena.test',
                'department_code' => 'GAS',
            ],
            [
                'personal_email' => 'danny@test.com',
                'first_name' => 'Danny',
                'last_name' => 'Dinglasa',
                'username' => 'danny.test',
                'department_code' => 'ABM',
            ],
            [
                'personal_email' => 'benedict@test.com',
                'first_name' => 'Benedict',
                'last_name' => 'Jambre',
                'username' => 'benedict.test',
                'department_code' => 'ICT',
            ],
            [
                'personal_email' => 'sabtal@test.com',
                'first_name' => 'Ameer',
                'last_name' => 'Sabtal',
                'username' => 'sabtal.test',
                'department_code' => 'STEM',
            ],
            [
                'personal_email' => 'charles@test.com',
                'first_name' => 'Charles',
                'last_name' => 'Gumondas',
                'username' => 'charles.test',
                'department_code' => 'HUMMS',
            ],
        ];

        $teacherUsers = collect(range(1, 10))
            ->map(function (int $index) use ($departmentCodeOrder): array {
                $departmentCode = $departmentCodeOrder[($index - 1) % count($departmentCodeOrder)];

                return [
                    'personal_email' => "teach{$index}@test.com",
                    'first_name' => "Teach{$index}",
                    'last_name' => 'User',
                    'username' => "teach{$index}",
                    'department_code' => $departmentCode,
                ];
            })
            ->values()
            ->all();

        $seededRows = [];

        foreach ($testerUsers as $testUser) {
            $departmentId = $departmentIdByCode->get($testUser['department_code']);

            $user = User::updateOrCreate(
                ['personal_email' => $testUser['personal_email']],
                [
                    'first_name' => $testUser['first_name'],
                    'last_name' => $testUser['last_name'],
                    'username' => $testUser['username'],
                    'department_id' => $departmentId,
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );

            $user->syncRolesByName(['teacher', 'admin']);

            $seededRows[] = [
                $testUser['personal_email'],
                'password',
                'teacher, admin',
                $testUser['department_code'],
            ];
        }

        foreach ($teacherUsers as $teacherUser) {
            $departmentId = $departmentIdByCode->get($teacherUser['department_code']);

            $user = User::updateOrCreate(
                ['personal_email' => $teacherUser['personal_email']],
                [
                    'first_name' => $teacherUser['first_name'],
                    'last_name' => $teacherUser['last_name'],
                    'username' => $teacherUser['username'],
                    'department_id' => $departmentId,
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );

            $user->syncRolesByName(['teacher']);

            $seededRows[] = [
                $teacherUser['personal_email'],
                'password',
                'teacher',
                $teacherUser['department_code'],
            ];
        }

        $superAdminDepartmentCode = 'ABM';
        $superAdminDepartmentId = $departmentIdByCode->get($superAdminDepartmentCode);

        $superAdminUser = User::updateOrCreate(
            ['personal_email' => 'superadmin@test.com'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'username' => 'superadmin.test',
                'department_id' => $superAdminDepartmentId,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $superAdminUser->syncRolesByName(['teacher', 'super_admin']);

        $seededRows[] = [
            'superadmin@test.com',
            'password',
            'teacher, super_admin',
            $superAdminDepartmentCode,
        ];

        $this->command->info('Teacher users and tester admin-teacher users created successfully!');
        $this->command->table(
            ['Email', 'Password', 'Roles', 'Department'],
            $seededRows
        );

        $this->command->info('Total seeded users from TestUserSeeder: ' . count($seededRows));
    }
}

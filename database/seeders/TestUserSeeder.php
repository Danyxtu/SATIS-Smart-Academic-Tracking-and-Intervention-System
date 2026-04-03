<?php

namespace Database\Seeders;

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
            ['name' => 'super_admin'],
            ['label' => 'Super Admin']
        );

        Role::firstOrCreate(
            ['name' => 'teacher'],
            ['label' => 'Teacher']
        );

        $testUsers = [
            [
                'personal_email' => 'sheena@test.com',
                'first_name' => 'Sheena',
                'last_name' => 'DeGuzman',
                'username' => 'sheena.test',
                'roles' => ['super_admin', 'teacher'],
            ],
            [
                'personal_email' => 'danny@test.com',
                'first_name' => 'Danny',
                'last_name' => 'Dinglasa',
                'username' => 'danny.test',
                'roles' => ['super_admin', 'teacher'],
            ],
            [
                'personal_email' => 'benedict@test.com',
                'first_name' => 'Benedict',
                'last_name' => 'Jambre',
                'username' => 'benedict.test',
                'roles' => ['super_admin', 'teacher'],
            ],
            [
                'personal_email' => 'ameer@test.com',
                'first_name' => 'Ameer',
                'last_name' => 'Sabtal',
                'username' => 'ameer.test',
                'roles' => ['super_admin', 'teacher'],
            ],
            [
                'personal_email' => 'charles@test.com',
                'first_name' => 'Charles',
                'last_name' => 'Gumondas',
                'username' => 'charles.test',
                'roles' => ['super_admin', 'teacher'],
            ],
        ];

        $seededRows = [];

        foreach ($testUsers as $testUser) {
            $user = User::updateOrCreate(
                ['personal_email' => $testUser['personal_email']],
                [
                    'first_name' => $testUser['first_name'],
                    'last_name' => $testUser['last_name'],
                    'username' => $testUser['username'],
                    'password' => Hash::make('password'),
                ]
            );

            $user->syncRolesByName($testUser['roles']);

            $seededRows[] = [
                $testUser['personal_email'],
                'password',
                implode(', ', $testUser['roles']),
            ];
        }

        $this->command->info('Test users created successfully!');
        $this->command->table(
            ['Email', 'Password', 'Roles'],
            $seededRows
        );
    }
}

<?php

namespace Database\Seeders;

use App\Models\SchoolPersonnel;
use Illuminate\Database\Seeder;

class SchoolPersonnelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $personnel = [
            [
                'position' => 'Principal',
                'first_name' => 'Elena',
                'middle_name' => 'Santos',
                'last_name' => 'Test',
                'email' => 'principal@satis.local',
                'phone_number' => '09171234567',
            ],
            [
                'position' => 'Guidance Counselor',
                'first_name' => 'Paolo',
                'middle_name' => 'Dela Cruz',
                'last_name' => 'Test',
                'email' => 'guidance@satis.local',
                'phone_number' => '09179876543',
            ],
        ];

        foreach ($personnel as $record) {
            SchoolPersonnel::updateOrCreate(
                ['position' => $record['position']],
                $record,
            );
        }
    }
}

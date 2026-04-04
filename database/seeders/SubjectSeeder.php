<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subjects = [
            [
                'subject_name' => 'Oral Communication',
                'subject_code' => 'ORAL-COMM',
            ],
            [
                'subject_name' => 'Reading and Writing',
                'subject_code' => 'READ-WRITE',
            ],
            [
                'subject_name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',
                'subject_code' => 'KOM-PAN',
            ],
            [
                'subject_name' => 'General Mathematics',
                'subject_code' => 'GEN-MATH',
            ],
            [
                'subject_name' => 'Statistics and Probability',
                'subject_code' => 'STAT-PROB',
            ],
            [
                'subject_name' => 'Earth and Life Science',
                'subject_code' => 'EARTH-LIFE',
            ],
            [
                'subject_name' => 'Physical Science',
                'subject_code' => 'PHYS-SCI',
            ],
            [
                'subject_name' => 'Personal Development',
                'subject_code' => 'PERDEV',
            ],
            [
                'subject_name' => 'Understanding Culture, Society and Politics',
                'subject_code' => 'UCSP',
            ],
            [
                'subject_name' => '21st Century Literature from the Philippines and the World',
                'subject_code' => '21CLPW',
            ],
            [
                'subject_name' => 'Contemporary Philippine Arts from the Regions',
                'subject_code' => 'CPAR',
            ],
            [
                'subject_name' => 'Media and Information Literacy',
                'subject_code' => 'MIL',
            ],
            [
                'subject_name' => 'Earth Science',
                'subject_code' => 'EARTH-SCI',
            ],
        ];

        foreach ($subjects as $subject) {
            Subject::updateOrCreate(
                ['subject_code' => $subject['subject_code']],
                ['subject_name' => $subject['subject_name']]
            );
        }
    }
}

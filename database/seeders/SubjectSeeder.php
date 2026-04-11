<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\SubjectType;
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
                'total_hours' => 80,
                'grade_level' => 'Grade 11',
                'type_key' => SubjectType::CORE,
            ],
            [
                'subject_name' => 'Reading and Writing',
                'subject_code' => 'READ-WRITE',
                'total_hours' => 80,
                'grade_level' => 'Grade 11',
                'type_key' => SubjectType::CORE,
            ],
            [
                'subject_name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',
                'subject_code' => 'KOM-PAN',
                'total_hours' => 80,
                'grade_level' => 'Grade 11',
                'type_key' => SubjectType::CORE,
            ],
            [
                'subject_name' => 'General Mathematics',
                'subject_code' => 'GEN-MATH',
                'total_hours' => 80,
                'grade_level' => 'Grade 11',
                'type_key' => SubjectType::CORE,
            ],
            [
                'subject_name' => 'Statistics and Probability',
                'subject_code' => 'STAT-PROB',
                'total_hours' => 80,
                'grade_level' => 'Grade 11',
                'type_key' => SubjectType::CORE,
            ],
            [
                'subject_name' => 'Earth and Life Science',
                'subject_code' => 'EARTH-LIFE',
                'total_hours' => 80,
                'grade_level' => 'Grade 11',
                'type_key' => SubjectType::CORE,
            ],
            [
                'subject_name' => 'Physical Science',
                'subject_code' => 'PHYS-SCI',
                'total_hours' => 80,
                'grade_level' => 'Grade 11',
                'type_key' => SubjectType::CORE,
            ],
            [
                'subject_name' => 'Personal Development',
                'subject_code' => 'PERDEV',
                'total_hours' => 80,
                'grade_level' => 'Grade 11',
                'type_key' => SubjectType::CORE,
            ],
            [
                'subject_name' => 'Understanding Culture, Society and Politics',
                'subject_code' => 'UCSP',
                'total_hours' => 80,
                'grade_level' => 'Grade 11',
                'type_key' => SubjectType::CORE,
            ],
            [
                'subject_name' => '21st Century Literature from the Philippines and the World',
                'subject_code' => '21CLPW',
                'total_hours' => 80,
                'grade_level' => 'Grade 12',
                'type_key' => SubjectType::APPLIED,
            ],
            [
                'subject_name' => 'Contemporary Philippine Arts from the Regions',
                'subject_code' => 'CPAR',
                'total_hours' => 80,
                'grade_level' => 'Grade 12',
                'type_key' => SubjectType::APPLIED,
            ],
            [
                'subject_name' => 'Media and Information Literacy',
                'subject_code' => 'MIL',
                'total_hours' => 80,
                'grade_level' => 'Grade 12',
                'type_key' => SubjectType::APPLIED,
            ],
            [
                'subject_name' => 'Earth Science',
                'subject_code' => 'EARTH-SCI',
                'total_hours' => 80,
                'grade_level' => 'Grade 11',
                'type_key' => SubjectType::SPECIALIZED_ACADEMIC,
            ],
            [
                'subject_name' => 'Pre-Calculus',
                'subject_code' => 'PRE-CALC',
                'total_hours' => 80,
                'grade_level' => 'Grade 11',
                'type_key' => SubjectType::SPECIALIZED_ACADEMIC,
            ],
            [
                'subject_name' => 'Computer Systems Servicing',
                'subject_code' => 'ICT-CSS',
                'total_hours' => 160,
                'grade_level' => 'Grade 12',
                'type_key' => SubjectType::SPECIALIZED_TVL,
            ],
        ];

        $typeMap = SubjectType::query()
            ->pluck('id', 'type_key');

        foreach ($subjects as $subject) {
            $typeId = $typeMap->get($subject['type_key']);

            $savedSubject = Subject::updateOrCreate(
                ['subject_code' => $subject['subject_code']],
                [
                    'subject_name' => $subject['subject_name'],
                    'total_hours' => $subject['total_hours'],
                    'grade_level' => $subject['grade_level'],
                ]
            );

            if ($typeId !== null) {
                $savedSubject->subjectTypes()->sync([$typeId]);
            }
        }
    }
}

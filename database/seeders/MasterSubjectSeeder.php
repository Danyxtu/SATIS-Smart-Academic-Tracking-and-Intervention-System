<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\MasterSubject;
use Illuminate\Support\Facades\DB;

class MasterSubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Core Subjects (Grade 11 - First Semester)
        $subjects = [
            // CORE SUBJECTS - Grade 11, Semester 1
            [
                'code' => 'CORE-OC11',
                'name' => 'Oral Communication',
                'description' => 'Development of listening and speaking skills for effective oral communication.',
                'grade_level' => 'Grade 11',
                'strand' => null,
                'track' => 'Academic',
                'semester' => '1',
                'units' => 3.0,
                'is_active' => true,
            ],
            [
                'code' => 'CORE-GENMATH11',
                'name' => 'General Mathematics',
                'description' => 'Study of functions, rational equations, logarithms, and basic business mathematics.',
                'grade_level' => 'Grade 11',
                'strand' => null,
                'track' => 'Academic',
                'semester' => '1',
                'units' => 3.0,
                'is_active' => true,
            ],
            [
                'code' => 'CORE-EARTHSCI11',
                'name' => 'Earth and Life Science',
                'description' => 'Introduction to earth science and basic principles of life science.',
                'grade_level' => 'Grade 11',
                'strand' => null,
                'track' => 'Academic',
                'semester' => '1',
                'units' => 3.0,
                'is_active' => true,
            ],
            [
                'code' => 'CORE-PERDEV11',
                'name' => 'Personal Development',
                'description' => 'Study of self-development and personal growth for adolescents.',
                'grade_level' => 'Grade 11',
                'strand' => null,
                'track' => 'Academic',
                'semester' => '1',
                'units' => 2.0,
                'is_active' => true,
            ],
            [
                'code' => 'CORE-UCSP11',
                'name' => 'Understanding Culture, Society & Politics',
                'description' => 'Analysis of cultural, social, and political institutions and dynamics.',
                'grade_level' => 'Grade 11',
                'strand' => null,
                'track' => 'Academic',
                'semester' => '1',
                'units' => 3.0,
                'is_active' => true,
            ],

            // CORE SUBJECTS - Grade 11, Semester 2
            [
                'code' => 'CORE-RWS11',
                'name' => 'Reading and Writing Skills',
                'description' => 'Development of critical reading and academic writing skills.',
                'grade_level' => 'Grade 11',
                'strand' => null,
                'track' => 'Academic',
                'semester' => '2',
                'units' => 3.0,
                'is_active' => true,
            ],
            [
                'code' => 'CORE-STATS11',
                'name' => 'Statistics and Probability',
                'description' => 'Study of data analysis, probability concepts, and statistical inference.',
                'grade_level' => 'Grade 11',
                'strand' => null,
                'track' => 'Academic',
                'semester' => '2',
                'units' => 3.0,
                'is_active' => true,
            ],
            [
                'code' => 'CORE-PHYSCI11',
                'name' => 'Physical Science',
                'description' => 'Introduction to physics and chemistry concepts.',
                'grade_level' => 'Grade 11',
                'strand' => null,
                'track' => 'Academic',
                'semester' => '2',
                'units' => 3.0,
                'is_active' => true,
            ],

            // STEM SPECIALIZED SUBJECTS
            [
                'code' => 'STEM-PRECAL11',
                'name' => 'Pre-Calculus',
                'description' => 'Study of conic sections, trigonometry, and mathematical induction.',
                'grade_level' => 'Grade 11',
                'strand' => 'STEM',
                'track' => 'Academic',
                'semester' => '1',
                'units' => 4.0,
                'is_active' => true,
            ],
            [
                'code' => 'STEM-BASCAL11',
                'name' => 'Basic Calculus',
                'description' => 'Introduction to limits, derivatives, and integrals.',
                'grade_level' => 'Grade 11',
                'strand' => 'STEM',
                'track' => 'Academic',
                'semester' => '2',
                'units' => 4.0,
                'is_active' => true,
            ],
            [
                'code' => 'STEM-GENPHY1',
                'name' => 'General Physics 1',
                'description' => 'Study of mechanics, thermodynamics, and periodic motion.',
                'grade_level' => 'Grade 12',
                'strand' => 'STEM',
                'track' => 'Academic',
                'semester' => '1',
                'units' => 4.0,
                'is_active' => true,
            ],
            [
                'code' => 'STEM-GENPHY2',
                'name' => 'General Physics 2',
                'description' => 'Study of electricity, magnetism, optics, and modern physics.',
                'grade_level' => 'Grade 12',
                'strand' => 'STEM',
                'track' => 'Academic',
                'semester' => '2',
                'units' => 4.0,
                'is_active' => true,
            ],
            [
                'code' => 'STEM-GENCHEM1',
                'name' => 'General Chemistry 1',
                'description' => 'Study of matter, atomic structure, and chemical bonding.',
                'grade_level' => 'Grade 11',
                'strand' => 'STEM',
                'track' => 'Academic',
                'semester' => '1',
                'units' => 4.0,
                'is_active' => true,
            ],
            [
                'code' => 'STEM-GENCHEM2',
                'name' => 'General Chemistry 2',
                'description' => 'Study of solutions, thermochemistry, and chemical kinetics.',
                'grade_level' => 'Grade 11',
                'strand' => 'STEM',
                'track' => 'Academic',
                'semester' => '2',
                'units' => 4.0,
                'is_active' => true,
            ],

            // ABM SPECIALIZED SUBJECTS
            [
                'code' => 'ABM-FABM1',
                'name' => 'Fundamentals of ABM 1',
                'description' => 'Introduction to accounting principles and business operations.',
                'grade_level' => 'Grade 11',
                'strand' => 'ABM',
                'track' => 'Academic',
                'semester' => '1',
                'units' => 3.0,
                'is_active' => true,
            ],
            [
                'code' => 'ABM-FABM2',
                'name' => 'Fundamentals of ABM 2',
                'description' => 'Advanced accounting concepts and financial statement analysis.',
                'grade_level' => 'Grade 11',
                'strand' => 'ABM',
                'track' => 'Academic',
                'semester' => '2',
                'units' => 3.0,
                'is_active' => true,
            ],
            [
                'code' => 'ABM-BUSMATH11',
                'name' => 'Business Mathematics',
                'description' => 'Mathematical concepts applied to business and finance.',
                'grade_level' => 'Grade 11',
                'strand' => 'ABM',
                'track' => 'Academic',
                'semester' => '1',
                'units' => 3.0,
                'is_active' => true,
            ],
            [
                'code' => 'ABM-BUSFIN12',
                'name' => 'Business Finance',
                'description' => 'Study of financial management and investment decisions.',
                'grade_level' => 'Grade 12',
                'strand' => 'ABM',
                'track' => 'Academic',
                'semester' => '1',
                'units' => 3.0,
                'is_active' => true,
            ],

            // HUMSS SPECIALIZED SUBJECTS
            [
                'code' => 'HUMSS-CREATW11',
                'name' => 'Creative Writing',
                'description' => 'Development of creative writing skills in various genres.',
                'grade_level' => 'Grade 11',
                'strand' => 'HUMSS',
                'track' => 'Academic',
                'semester' => '1',
                'units' => 3.0,
                'is_active' => true,
            ],
            [
                'code' => 'HUMSS-PHILIT11',
                'name' => '21st Century Literature from Philippines',
                'description' => 'Study of contemporary Philippine literary works.',
                'grade_level' => 'Grade 11',
                'strand' => 'HUMSS',
                'track' => 'Academic',
                'semester' => '2',
                'units' => 3.0,
                'is_active' => true,
            ],
        ];

        // Create all subjects
        foreach ($subjects as $subject) {
            MasterSubject::create($subject);
        }

        // Define prerequisites (subject_code => [prerequisite_codes])
        $prerequisites = [
            // Basic Calculus requires Pre-Calculus
            'STEM-BASCAL11' => [
                ['code' => 'STEM-PRECAL11', 'min_grade' => 75],
            ],
            // General Physics 2 requires General Physics 1
            'STEM-GENPHY2' => [
                ['code' => 'STEM-GENPHY1', 'min_grade' => 75],
            ],
            // General Chemistry 2 requires General Chemistry 1
            'STEM-GENCHEM2' => [
                ['code' => 'STEM-GENCHEM1', 'min_grade' => 75],
            ],
            // Fundamentals of ABM 2 requires Fundamentals of ABM 1
            'ABM-FABM2' => [
                ['code' => 'ABM-FABM1', 'min_grade' => 75],
            ],
            // Statistics requires General Mathematics
            'CORE-STATS11' => [
                ['code' => 'CORE-GENMATH11', 'min_grade' => 75],
            ],
        ];

        // Create prerequisite relationships
        foreach ($prerequisites as $subjectCode => $prereqs) {
            $subject = MasterSubject::where('code', $subjectCode)->first();

            if ($subject) {
                foreach ($prereqs as $prereq) {
                    $prerequisite = MasterSubject::where('code', $prereq['code'])->first();

                    if ($prerequisite) {
                        DB::table('master_subject_prerequisites')->insert([
                            'master_subject_id' => $subject->id,
                            'prerequisite_id' => $prerequisite->id,
                            'minimum_grade' => $prereq['min_grade'],
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }
    }
}

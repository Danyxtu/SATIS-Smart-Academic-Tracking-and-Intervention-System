<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Student;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create an admin
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // Create a teacher
        User::factory()->create([
            'name' => 'Teacher User',
            'email' => 'teacher@gmail.com',
            'password' => bcrypt('password'),
            'role' => 'teacher',
        ]);

        // Create 60 students (20 per class) with unique emails
        $this->createStudentsForClass('STEM-A', 'Grade 12', 'STEM', 'Academic', 20);
        $this->createStudentsForClass('ABM-B', 'Grade 11', 'ABM', 'Academic', 20);
        $this->createStudentsForClass('HUMSS-A', 'Grade 11', 'HUMSS', 'Academic', 20);

        $this->call([
            SubjectSeeder::class,
            EnrollmentSeeder::class,
            GradeSeeder::class,
            AttendanceSeeder::class,
            InterventionSeeder::class,
        ]);
    }

    /**
     * Create students for a specific class/section
     */
    private function createStudentsForClass(string $section, string $gradeLevel, string $strand, string $track, int $count): void
    {
        $firstNames = [
            'Juan',
            'Maria',
            'Jose',
            'Ana',
            'Carlos',
            'Sofia',
            'Miguel',
            'Isabella',
            'Antonio',
            'Gabriela',
            'Francisco',
            'Valentina',
            'Luis',
            'Camila',
            'Rafael',
            'Lucia',
            'Diego',
            'Martina',
            'Andres',
            'Paula',
            'Gabriel',
            'Elena',
            'Daniel',
            'Carmen',
            'Alejandro',
            'Rosa',
            'Fernando',
            'Teresa',
            'Ricardo',
            'Beatriz',
            'Eduardo',
            'Patricia',
            'Jorge',
            'Laura',
            'Roberto',
            'Angela',
            'Manuel',
            'Diana',
            'Arturo',
            'Claudia',
            'Enrique',
            'Monica',
            'Oscar',
            'Veronica',
            'Raul',
            'Sandra',
            'Sergio',
            'Cristina',
            'Alberto',
            'Adriana',
            'Pablo',
            'Mariana',
            'Hector',
            'Alejandra',
            'Mario',
            'Fernanda',
            'Victor',
            'Daniela',
            'Cesar',
            'Natalia'
        ];

        $lastNames = [
            'Dela Cruz',
            'Santos',
            'Reyes',
            'Garcia',
            'Mendoza',
            'Torres',
            'Flores',
            'Rivera',
            'Gonzales',
            'Ramos',
            'Cruz',
            'Bautista',
            'Villanueva',
            'Fernandez',
            'Aquino',
            'Castro',
            'Domingo',
            'Pascual',
            'Salvador',
            'Lopez'
        ];

        $sectionCode = strtolower(str_replace('-', '', $section));

        for ($i = 1; $i <= $count; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $middleName = $lastNames[array_rand($lastNames)];

            // Create unique email: firstname.lastname.section.number@student.edu.ph
            $email = strtolower(
                str_replace(' ', '', $firstName) . '.' .
                    str_replace(' ', '', $lastName) . '.' .
                    $sectionCode . $i . '@student.edu.ph'
            );

            $user = User::factory()->create([
                'name' => "{$firstName} {$middleName} {$lastName}",
                'email' => $email,
                'password' => bcrypt('password'),
                'role' => 'student',
            ]);

            Student::factory()->create([
                'user_id' => $user->id,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'middle_name' => $middleName,
                'grade_level' => $gradeLevel,
                'section' => $section,
                'strand' => $strand,
                'track' => $track,
            ]);
        }
    }
}

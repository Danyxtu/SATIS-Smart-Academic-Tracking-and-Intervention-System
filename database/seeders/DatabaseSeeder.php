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
        // Create a teacher
        // User::factory()->create([
        //     'name' => 'Teacher User',
        //     'email' => 'teacher@gmail.com',
        //     'password' => bcrypt('password'),
        //     'role' => 'teacher',
        // ]);
        // User::factory()->create([
        //     'name' => 'Student User',
        //     'email' => 'student@gmail.com',
        //     'password' => bcrypt('password'),
        //     'role' => 'student',
        // ]);

        // Create students
        User::factory(20)->create(['role' => 'student'])->each(function ($user) {
            Student::factory()->create(['user_id' => $user->id]);
        });
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Student;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create an admin with random password
        $adminPassword = Str::random(10);
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@gmail.com',
            'password' => bcrypt($adminPassword),
            'role' => 'admin',
        ]);

        // $teacherPassword = Str::random(10);
        User::factory()->create([
            'name' => 'Teacher User',
            'email' => 'teacher@gmail.com',
            'password' => bcrypt('password'),
            'role' => 'teacher',
        ]);
    }
}

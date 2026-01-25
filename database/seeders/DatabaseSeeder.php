<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create an admin with random password
        User::factory()->create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // $teacherPassword = Str::random(10);
        User::factory()->create([
            'first_name' => 'Teacher',
            'last_name' => 'User',
            'email' => 'teacher@gmail.com',
            'password' => bcrypt('password'),
            'role' => 'teacher',
        ]);

        // Seed master subjects with prerequisites
        $this->call(MasterSubjectSeeder::class);
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\InterventionTask;
use App\Models\Subject;
use Illuminate\Support\Facades\DB;

class InterventionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $enrollments = DB::table('enrollments')->inRandomOrder()->limit(5)->get();

        $types = [
            'academic_quiz',
            'automated_nudge',
            'task_list',
            'extension_grant',
            'parent_contact',
            'counselor_referral'
        ];

        foreach ($enrollments as $enrollment) {
            $intervention = Intervention::create([
                'enrollment_id' => $enrollment->id,
                'status' => 'active',
                'type' => $types[array_rand($types)],
                'notes' => 'This is a sample intervention.',
            ]);

            InterventionTask::create([
                'intervention_id' => $intervention->id,
                'description' => 'Schedule a meeting with the student',
                'is_completed' => false,
            ]);

            InterventionTask::create([
                'intervention_id' => $intervention->id,
                'description' => 'Review progress with the student',
                'is_completed' => true,
            ]);
        }
    }
}
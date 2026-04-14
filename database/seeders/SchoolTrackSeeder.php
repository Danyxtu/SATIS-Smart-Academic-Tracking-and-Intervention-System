<?php

namespace Database\Seeders;

use App\Models\SchoolTrack;
use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SchoolTrackSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $schoolYear = SystemSetting::getCurrentSchoolYear();

        $tracks = [
            [
                'track_name' => 'Academic',
                'track_code' => 'ACADEMIC',
                'school_year' => $schoolYear,
                'description' => 'Academic track for college-preparatory strands.',
            ],
            [
                'track_name' => 'TVL',
                'track_code' => 'TVL',
                'school_year' => $schoolYear,
                'description' => 'Technical-Vocational-Livelihood track.',
            ],
            [
                'track_name' => 'Sports',
                'track_code' => 'SPORTS',
                'school_year' => $schoolYear,
                'description' => 'Sports track for athletics-focused learners.',
            ],
            [
                'track_name' => 'Arts and Design Track',
                'track_code' => 'ARTS_DESIGN',
                'school_year' => $schoolYear,
                'description' => 'Arts and Design track for creative disciplines.',
            ],
        ];

        foreach ($tracks as $track) {
            SchoolTrack::updateOrCreate(
                ['track_code' => $track['track_code']],
                $track,
            );
        }
    }
}

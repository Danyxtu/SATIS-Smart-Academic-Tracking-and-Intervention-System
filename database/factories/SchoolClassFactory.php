<?php

namespace Database\Factories;

use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SchoolClass>
 */
class SchoolClassFactory extends Factory
{
    protected $model = SchoolClass::class;

    public function definition(): array
    {
        return [
            'subject_id' => Subject::factory(),
            'teacher_id' => User::factory(),
            'grade_level' => 'Grade 11',
            'section' => 'A',
            'color' => 'indigo',
            'strand' => null,
            'track' => null,
            'school_year' => now()->year . '-' . (now()->year + 1),
            'current_quarter' => 1,
            'grade_categories' => null,
            'semester' => '1',
        ];
    }
}

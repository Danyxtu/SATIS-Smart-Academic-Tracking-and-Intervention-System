<?php

namespace Database\Factories;

use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subject>
 */
class SubjectFactory extends Factory
{
    protected $model = Subject::class;

    public function definition(): array
    {
        $name = ucfirst($this->faker->unique()->words(2, true));

        return [
            'subject_name' => $name,
            'subject_code' => 'SUB-' . Str::upper(Str::random(6)),
            'total_hours' => $this->faker->randomElement([80, 120, 160]),
            'semester' => $this->faker->randomElement(['1', '2']),
            'grade_level' => $this->faker->randomElement(['Grade 11', 'Grade 12']),
        ];
    }
}

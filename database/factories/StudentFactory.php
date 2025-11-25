<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'middle_name' => 'C.',
            'subject' => fake()->randomElement(['Physics', 'Mathematics', 'English']),
            'grade' => fake()->numberBetween(60, 90),
            'trend' => fake()->randomElement(['Declining', 'Stable', 'Improving']),
            'avatar' => 'https://placehold.co/40x40/E9D5FF/4C1D95?text=SD',
        ];
    }
}

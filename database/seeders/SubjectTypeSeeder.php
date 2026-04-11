<?php

namespace Database\Seeders;

use App\Models\SubjectType;
use Illuminate\Database\Seeder;

class SubjectTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (SubjectType::defaultTypeDefinitions() as $type) {
            SubjectType::updateOrCreate(
                ['type_key' => $type['type_key']],
                [
                    'name' => $type['name'],
                    'specialization_track' => $type['specialization_track'],
                ]
            );
        }
    }
}

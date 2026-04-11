<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->unsignedSmallInteger('total_hours')->nullable()->after('subject_code');
        });

        Schema::create('subject_types', function (Blueprint $table) {
            $table->id();
            $table->string('type_key')->unique();
            $table->string('name');
            $table->string('specialization_track')->nullable();
            $table->timestamps();
        });

        Schema::create('subject_subject_type', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_type_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['subject_id', 'subject_type_id']);
        });

        $now = now();

        $coreTypeKey = 'core';

        $typeRows = [
            [
                'type_key' => $coreTypeKey,
                'name' => 'Core Subjects',
                'specialization_track' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'type_key' => 'applied',
                'name' => 'Applied Subjects',
                'specialization_track' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'type_key' => 'specialized_academic',
                'name' => 'Academic Track Specialized Subjects',
                'specialization_track' => 'academic',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'type_key' => 'specialized_tvl',
                'name' => 'TVL Track Specialized Subjects',
                'specialization_track' => 'tvl',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('subject_types')->upsert(
            $typeRows,
            ['type_key'],
            ['name', 'specialization_track', 'updated_at']
        );

        $coreTypeId = DB::table('subject_types')
            ->where('type_key', $coreTypeKey)
            ->value('id');

        if ($coreTypeId === null) {
            return;
        }

        $existingSubjects = DB::table('subjects')->pluck('id');

        if ($existingSubjects->isEmpty()) {
            return;
        }

        $pivotRows = $existingSubjects
            ->map(static fn(int $subjectId): array => [
                'subject_id' => $subjectId,
                'subject_type_id' => $coreTypeId,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        DB::table('subject_subject_type')->upsert(
            $pivotRows,
            ['subject_id', 'subject_type_id'],
            ['updated_at']
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_subject_type');
        Schema::dropIfExists('subject_types');

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('total_hours');
        });
    }
};

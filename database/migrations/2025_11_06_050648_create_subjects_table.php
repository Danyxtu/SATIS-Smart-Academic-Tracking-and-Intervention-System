<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // The Teacher
            $table->string('name'); // e.g., "G12-STEM Physics"
            $table->string('room_number')->nullable();
            $table->string('grade_level')->default('Grade 12')->after('name');
            $table->string('section')->default('Section A')->after('grade_level');
            $table->string('color')->default('indigo')->after('section');
            $table->string('strand')->nullable()->after('section');
            $table->string('track')->nullable()->after('strand');
            $table->string('school_year');
            $table->unsignedTinyInteger('current_quarter')->default(1)->after('school_year');
            if (! Schema::hasColumn('subjects', 'grade_categories')) {
                $table->json('grade_categories')->nullable()->after('color');
            }
            $table->string('semester', 10)->default('1')->after('school_year');

            $table->timestamps();
        });
        $defaultCategories = [
            [
                'id' => 'written_works',
                'label' => 'Written Works',
                'weight' => 0.30,
                'tasks' => [],
            ],
            [
                'id' => 'performance_task',
                'label' => 'Performance Task',
                'weight' => 0.40,
                'tasks' => [],
            ],
            [
                'id' => 'quarterly_exam',
                'label' => 'Quarterly Exam',
                'weight' => 0.30,
                'tasks' => [],
            ],
        ];

        DB::table('subjects')
            ->whereNull('grade_categories')
            ->update(['grade_categories' => json_encode($defaultCategories)]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};

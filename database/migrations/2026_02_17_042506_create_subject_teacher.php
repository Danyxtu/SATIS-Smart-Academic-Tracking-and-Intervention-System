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
        /**
         * This pivot table represents the many-to-many relationship between subjects and teachers.
         * A subject can be taught by multiple teachers, and a teacher can teach multiple subjects.
         * 
         */
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
        Schema::create('subject_teacher', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->string('grade_level')->default('Grade 12');
            $table->string('color')->default('indigo');
            $table->string('strand')->nullable();
            $table->string('track')->nullable();
            $table->string('school_year');
            $table->unsignedTinyInteger('current_quarter')->default(1);
            $table->json('grade_categories')->nullable();
            $table->string('semester', 10)->default('1');

            $table->timestamps();
        });

        DB::table('subject_teacher')
            ->whereNull('grade_categories')
            ->update(['grade_categories' => json_encode($defaultCategories)]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_teacher');
    }
};

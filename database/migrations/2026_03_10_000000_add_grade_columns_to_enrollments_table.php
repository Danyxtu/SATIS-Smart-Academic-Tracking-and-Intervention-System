<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            // Quarter 1 grades
            $table->float('initial_grade_q1')->nullable()->after('current_attendance_rate');
            $table->float('expected_grade_q1')->nullable()->after('initial_grade_q1');
            $table->integer('q1_grade')->nullable()->after('expected_grade_q1'); // Transmuted

            // Quarter 2 grades
            $table->float('initial_grade_q2')->nullable()->after('q1_grade');
            $table->float('expected_grade_q2')->nullable()->after('initial_grade_q2');
            $table->integer('q2_grade')->nullable()->after('expected_grade_q2'); // Transmuted

            // Final grade (average of transmuted Q1 + Q2)
            $table->integer('final_grade')->nullable()->after('q2_grade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn([
                'initial_grade_q1',
                'expected_grade_q1',
                'q1_grade',
                'initial_grade_q2',
                'expected_grade_q2',
                'q2_grade',
                'final_grade',
            ]);
        });
    }
};

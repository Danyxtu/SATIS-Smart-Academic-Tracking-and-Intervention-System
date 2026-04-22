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
        Schema::table('interventions', function (Blueprint $table) {
            $table->tinyInteger('quarter')->default(1)->after('school_year')->comment('The academic quarter this intervention applies to');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->float('q1_intervention_bonus')->nullable()->after('initial_grade_q1')->comment('Bonus points added to raw Q1 grade from completed interventions');
            $table->float('q2_intervention_bonus')->nullable()->after('initial_grade_q2')->comment('Bonus points added to raw Q2 grade from completed interventions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dropColumn('quarter');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn(['q1_intervention_bonus', 'q2_intervention_bonus']);
        });
    }
};

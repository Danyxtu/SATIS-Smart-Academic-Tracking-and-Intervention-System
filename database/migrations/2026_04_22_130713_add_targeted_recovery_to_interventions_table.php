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
            $table->string('target_task_id')->nullable()->after('quarter')->comment('The ID of the grade task to be boosted');
            $table->string('target_task_name')->nullable()->after('target_task_id')->comment('Name of the grade task for reference');
            $table->string('target_category_id')->nullable()->after('target_task_name')->comment('Category ID of the target task');
            $table->float('reward_score')->nullable()->after('target_category_id')->comment('The score to be awarded upon completion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dropColumn(['target_task_id', 'target_task_name', 'target_category_id', 'reward_score']);
        });
    }
};

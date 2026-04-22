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
            $table->enum('agreement_type', ['recovery', 'bonus'])->default('recovery')->after('reward_score')->comment('Type of academic agreement');
            $table->string('target_category_name')->nullable()->after('agreement_type')->comment('Name for new bonus category if agreement_type is bonus');
            $table->float('target_category_weight')->nullable()->after('target_category_name')->comment('Weight/Percentage for new bonus category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dropColumn(['agreement_type', 'target_category_name', 'target_category_weight']);
        });
    }
};

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
        Schema::table('intervention_tasks', function (Blueprint $table) {
            $table->string('task_name')->nullable()->after('intervention_id');
            $table->string('delivery_mode')->nullable()->after('description');
            $table->timestamp('completed_at')->nullable()->after('is_completed');
            $table->timestamp('approved_by_teacher_at')->nullable()->after('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('intervention_tasks', function (Blueprint $table) {
            $table->dropColumn([
                'task_name',
                'delivery_mode',
                'completed_at',
                'approved_by_teacher_at',
            ]);
        });
    }
};

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
            // Track completion request from student
            $table->timestamp('completion_requested_at')->nullable();
            $table->text('completion_request_notes')->nullable();
            // Track teacher approval
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('approval_notes')->nullable();
            // Track rejection if any
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn([
                'completion_requested_at',
                'completion_request_notes',
                'approved_at',
                'approved_by',
                'approval_notes',
                'rejected_at',
                'rejection_reason',
            ]);
        });
    }
};

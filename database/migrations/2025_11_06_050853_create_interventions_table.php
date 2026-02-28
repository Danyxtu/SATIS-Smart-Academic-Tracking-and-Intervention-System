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
        Schema::create('interventions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->enum('type', [
                'academic_quiz',      // Tier 1
                'automated_nudge',    // Tier 1
                'task_list',          // Tier 2
                'extension_grant',    // Tier 2
                'parent_contact',     // Tier 2
                'counselor_referral'  // Tier 3
            ])->default('parent_contact')->after('enrollment_id');

            $table->text('notes')->nullable()->after('type'); // Add a nullable notes column

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
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interventions');
    }
};

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
            $table->string('proof_path')->nullable()->after('approved_by_teacher_at');
            $table->text('proof_notes')->nullable()->after('proof_path');
            $table->timestamp('submitted_at')->nullable()->after('proof_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('intervention_tasks', function (Blueprint $table) {
            $table->dropColumn(['proof_path', 'proof_notes', 'submitted_at']);
        });
    }
};

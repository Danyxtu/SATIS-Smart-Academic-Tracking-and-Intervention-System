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
        // Add status field to users table for approval workflow
        Schema::table('users', function (Blueprint $table) {
            $table->enum('status', ['active', 'pending_approval'])->default('active')->after('role');
        });

        // Create teacher_registrations table for pending applications
        Schema::create('teacher_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->string('password'); // Will be hashed
            $table->string('document_path')->nullable(); // Path to uploaded document
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_registrations');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};

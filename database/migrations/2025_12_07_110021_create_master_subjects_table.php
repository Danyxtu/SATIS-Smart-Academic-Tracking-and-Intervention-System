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
        Schema::create('master_subjects', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g., "MATH101", "PHYS101"
            $table->string('name'); // e.g., "General Mathematics", "General Physics 1"
            $table->text('description')->nullable();
            $table->string('grade_level')->nullable(); // e.g., "Grade 11", "Grade 12"
            $table->string('strand')->nullable(); // e.g., "STEM", "ABM", "HUMSS", "GAS"
            $table->string('track')->nullable(); // e.g., "Academic", "TVL"
            $table->enum('semester', ['1', '2', 'full_year'])->default('full_year');
            $table->decimal('units', 3, 1)->default(1.0);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_subjects');
    }
};

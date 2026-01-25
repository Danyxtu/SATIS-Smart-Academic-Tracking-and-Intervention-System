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
        Schema::create('master_subject_prerequisites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('master_subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('prerequisite_id')->constrained('master_subjects')->onDelete('cascade');
            $table->integer('minimum_grade')->default(75); // Minimum passing grade required
            $table->timestamps();
            $table->unique(['master_subject_id', 'prerequisite_id'], 'subject_prerequisite_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_subject_prerequisites');
    }
};

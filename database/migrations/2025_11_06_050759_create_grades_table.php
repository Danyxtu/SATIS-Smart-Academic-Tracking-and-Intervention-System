<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->onDelete('cascade');
            $table->string('assignment_key')->nullable();
            $table->string('assignment_name'); // e.g., "Quiz 1", "Midterm"
            $table->float('score');
            $table->float('total_score');
            $table->integer('quarter');
            $table->unique(['enrollment_id', 'assignment_key', 'quarter'], 'grades_assignment_unique');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};

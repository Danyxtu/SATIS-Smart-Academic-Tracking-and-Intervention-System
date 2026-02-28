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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_name');
            $table->string('lrn')->nullable()->unique();
            $table->string('grade_level')->nullable();
            $table->string('section')->nullable();
            $table->string('strand')->nullable();
            $table->string('track')->nullable();
            $table->string('subject');
            $table->integer('grade');
            $table->string('trend');
            $table->string('avatar')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};

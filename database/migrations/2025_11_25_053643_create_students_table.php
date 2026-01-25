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
            // Student Details -> Danny
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('lrn')->nullable()->after('middle_name');
            $table->string('grade_level')->nullable()->after('trend');
            $table->string('section')->nullable()->after('grade_level');
            $table->string('strand')->nullable()->after('section');
            $table->string('track')->nullable()->after('strand');
            $table->string('subject');
            $table->integer('grade');
            $table->string('trend');
            $table->string('avatar')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps(); // Created at Updated at (Logs)
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

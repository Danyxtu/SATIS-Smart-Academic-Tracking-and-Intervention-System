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
        if (!Schema::hasTable('classes')) {
            Schema::create('classes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('subject_id')->constrained()->onDelete('cascade');
                $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
                $table->string('school_year');
                $table->string('grade_level')->default('Grade 12');
                $table->string('section')->nullable();
                $table->unsignedBigInteger('section_id')->nullable();
                $table->string('color')->default('indigo');
                $table->string('strand')->nullable();
                $table->string('track')->nullable();
                $table->unsignedTinyInteger('current_quarter')->default(1);
                $table->json('grade_categories')->nullable();
                $table->string('semester', 10)->default('1');
                $table->timestamps();
            });
        }

        if (Schema::hasTable('classes') && !Schema::hasColumn('classes', 'section_id')) {
            Schema::table('classes', function (Blueprint $table) {
                $table->unsignedBigInteger('section_id')->nullable()->after('section');
            });
        }

        if (Schema::hasTable('classes') && Schema::hasTable('sections')) {
            Schema::table('classes', function (Blueprint $table) {
                $table
                    ->foreign('section_id', 'classes_section_id_foreign')
                    ->references('id')
                    ->on('sections')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('classes')) {
            Schema::table('classes', function (Blueprint $table) {
                $table->dropForeign('classes_section_id_foreign');
            });
        }
    }
};

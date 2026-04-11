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
        Schema::table('departments', function (Blueprint $table) {
            $table->string('track', 30)->default('Academic')->after('department_code');
            $table->index('track');
        });

        Schema::create('specializations', function (Blueprint $table) {
            $table->id();
            $table->string('specialization_name')->unique();
            $table->timestamps();
        });

        Schema::create('department_specialization', function (Blueprint $table) {
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialization_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['department_id', 'specialization_id'], 'dept_specialization_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_specialization');
        Schema::dropIfExists('specializations');

        Schema::table('departments', function (Blueprint $table) {
            $table->dropIndex(['track']);
            $table->dropColumn('track');
        });
    }
};

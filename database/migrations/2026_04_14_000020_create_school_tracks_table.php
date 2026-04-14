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
        Schema::create('school_tracks', function (Blueprint $table) {
            $table->id();
            $table->string('track_name')->unique();
            $table->string('track_code', 30)->unique();
            $table->string('school_year', 20);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('school_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_tracks');
    }
};

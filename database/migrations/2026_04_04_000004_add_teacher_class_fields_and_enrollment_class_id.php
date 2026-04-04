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
        // No-op: classes and enrollments now define class-based schema in earlier migrations.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op rollback.
    }
};

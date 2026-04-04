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
        if (Schema::hasTable('classes') && !Schema::hasColumn('classes', 'section')) {
            Schema::table('classes', function (Blueprint $table) {
                $table->string('section')->nullable()->after('grade_level');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('classes') && Schema::hasColumn('classes', 'section')) {
            Schema::table('classes', function (Blueprint $table) {
                $table->dropColumn('section');
            });
        }
    }
};

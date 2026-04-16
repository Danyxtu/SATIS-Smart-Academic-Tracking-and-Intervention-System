<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            if (! Schema::hasColumn('interventions', 'school_year')) {
                $table->string('school_year', 20)
                    ->nullable()
                    ->after('enrollment_id')
                    ->index();
            }
        });

        $currentSchoolYear = DB::table('system_settings')
            ->where('key', 'current_school_year')
            ->value('value');

        if (! is_string($currentSchoolYear) || trim($currentSchoolYear) === '') {
            $currentYear = (int) date('Y');
            $currentSchoolYear = $currentYear . '-' . ($currentYear + 1);
        }

        DB::table('interventions')
            ->where(function ($query) {
                $query->whereNull('school_year')
                    ->orWhere('school_year', '');
            })
            ->update(['school_year' => trim((string) $currentSchoolYear)]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('interventions', 'school_year')) {
            return;
        }

        Schema::table('interventions', function (Blueprint $table) {
            $table->dropIndex(['school_year']);
            $table->dropColumn('school_year');
        });
    }
};

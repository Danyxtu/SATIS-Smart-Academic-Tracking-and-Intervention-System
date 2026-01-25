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
        // Only run this migration on PostgreSQL
        if (DB::getDriverName() === 'pgsql') {
            // For PostgreSQL, we need to modify the enum type
            // First, drop the old constraint and add a new one with all types
            DB::statement("ALTER TABLE interventions DROP CONSTRAINT IF EXISTS interventions_type_check");

            DB::statement("ALTER TABLE interventions ADD CONSTRAINT interventions_type_check CHECK (type::text = ANY (ARRAY[
                'academic_quiz'::text,
                'automated_nudge'::text,
                'task_list'::text,
                'extension_grant'::text,
                'parent_contact'::text,
                'counselor_referral'::text,
                'academic_agreement'::text,
                'one_on_one_meeting'::text
            ]))");
        }

        // For MySQL/SQLite, the enum constraint is already handled in the initial interventions migration
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original constraint
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE interventions DROP CONSTRAINT IF EXISTS interventions_type_check");

            DB::statement("ALTER TABLE interventions ADD CONSTRAINT interventions_type_check CHECK (type::text = ANY (ARRAY[
                'academic_quiz'::text,
                'automated_nudge'::text,
                'task_list'::text,
                'extension_grant'::text,
                'parent_contact'::text,
                'counselor_referral'::text
            ]))");
        }
    }
};

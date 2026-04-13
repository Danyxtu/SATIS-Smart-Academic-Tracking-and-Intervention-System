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
        $hasLegacyTempPassword = Schema::hasColumn('users', 'temp_password');
        $hasTemporaryPassword = Schema::hasColumn('users', 'temporary_password');

        if (! $hasTemporaryPassword) {
            Schema::table('users', function (Blueprint $table) {
                // Placed before the hashed password column for credential flow clarity.
                $table->string('temporary_password')->nullable()->after('email_verified_at');
            });
        }

        if ($hasLegacyTempPassword) {
            DB::table('users')
                ->whereNotNull('temp_password')
                ->update([
                    'temporary_password' => DB::raw('temp_password'),
                ]);

            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('temp_password');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'temporary_password')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('temporary_password');
            });
        }
    }
};

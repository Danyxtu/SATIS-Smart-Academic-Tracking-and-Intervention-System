<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'temporary_password')) {
            return;
        }

        $driver = DB::getDriverName();

        if (! in_array($driver, ['mysql', 'mariadb'], true)) {
            return;
        }

        DB::statement(
            'ALTER TABLE users MODIFY COLUMN temporary_password VARCHAR(255) NULL AFTER email_verified_at'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('users', 'temporary_password')) {
            return;
        }

        $driver = DB::getDriverName();

        if (! in_array($driver, ['mysql', 'mariadb'], true)) {
            return;
        }

        DB::statement(
            'ALTER TABLE users MODIFY COLUMN temporary_password VARCHAR(255) NULL AFTER password'
        );
    }
};

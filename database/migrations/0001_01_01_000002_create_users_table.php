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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            // Basic user information
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('email')->unique();
            $table->string('personal_email')->nullable()->unique();
            $table->string('role'); // e.g., "admin", "teacher", "student", "superadmin"
            $table->timestamp('email_verified_at')->nullable();
            // Password management fields
            $table->string('password');
            $table->string('temp_password')->nullable()->after('password');
            $table->boolean('must_change_password')->default(false)->after('temp_password');
            $table->timestamp('password_changed_at')->nullable()->after('must_change_password');

            $table->foreignId('department_id')->nullable()->after('role')->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->after('department_id')->constrained('users')->nullOnDelete();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};

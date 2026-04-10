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
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->timestamp('logged_at')->index();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('user_name')->nullable()->index();
            $table->string('user_role', 50)->nullable()->index();
            $table->string('school_year', 32)->nullable()->index();

            $table->string('module', 100)->nullable()->index();
            $table->string('task');
            $table->string('action', 50)->index();

            $table->string('target_type', 120)->nullable();
            $table->string('target_id', 120)->nullable();

            $table->string('route_name')->nullable()->index();
            $table->string('method', 10);
            $table->string('path');

            $table->unsignedSmallInteger('status_code')->nullable()->index();
            $table->boolean('is_success')->default(true)->index();

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->json('query_params')->nullable();
            $table->json('request_payload')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};

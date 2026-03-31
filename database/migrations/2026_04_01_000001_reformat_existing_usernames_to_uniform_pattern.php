<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'username')) {
            return;
        }

        $users = DB::table('users')
            ->select('id', 'first_name', 'last_name', 'created_at')
            ->orderByRaw('CASE WHEN created_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        if ($users->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($users): void {
            // Temporary placeholders avoid unique-collision issues during rewrites.
            foreach ($users as $user) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'username' => sprintf('tmpuser%05d', $user->id),
                    ]);
            }

            foreach ($users as $user) {
                $seed = trim((string) (($user->first_name ?? '') . ' ' . ($user->last_name ?? '')));
                $year = $this->resolveYear($user->created_at);
                $username = User::generateUniqueUsername($seed, $year);

                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['username' => $username]);
            }
        });
    }

    public function down(): void
    {
        // Irreversible data migration: previous usernames are not recoverable.
    }

    private function resolveYear(mixed $createdAt): int
    {
        if ($createdAt === null) {
            return (int) now()->format('Y');
        }

        $timestamp = strtotime((string) $createdAt);

        if ($timestamp === false) {
            return (int) now()->format('Y');
        }

        return (int) date('Y', $timestamp);
    }
};

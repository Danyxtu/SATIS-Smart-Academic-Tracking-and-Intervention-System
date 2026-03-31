<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $hasEmailColumn = Schema::hasColumn('users', 'email');

        if (! Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('username')->nullable()->after('middle_name');
            });
        }

        $selectColumns = ['id', 'first_name', 'last_name', 'username', 'personal_email', 'created_at'];

        if ($hasEmailColumn) {
            $selectColumns[] = 'email';
        }

        DB::table('users')
            ->select($selectColumns)
            ->orderBy('id')
            ->chunkById(200, function ($users) use ($hasEmailColumn): void {
                foreach ($users as $user) {
                    $updates = [];

                    if ($hasEmailColumn && empty($user->personal_email) && ! empty($user->email ?? null)) {
                        $updates['personal_email'] = Str::lower((string) $user->email);
                    }

                    if (empty($user->username)) {
                        $updates['username'] = $this->generateUniqueUsername(
                            firstName: $user->first_name,
                            lastName: $user->last_name,
                            personalEmail: $updates['personal_email']
                                ?? $user->personal_email
                                ?? ($hasEmailColumn ? ($user->email ?? null) : null),
                            createdAt: $user->created_at ?? null,
                        );
                    }

                    if ($updates !== []) {
                        DB::table('users')
                            ->where('id', $user->id)
                            ->update($updates);
                    }
                }
            });

        if (Schema::hasColumn('users', 'email')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('email');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'email')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('email')->nullable()->after('middle_name');
            });

            DB::table('users')
                ->whereNull('email')
                ->whereNotNull('personal_email')
                ->update([
                    'email' => DB::raw('personal_email'),
                ]);
        }

        if (Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('username');
            });
        }
    }

    private function generateUniqueUsername(
        ?string $firstName,
        ?string $lastName,
        ?string $personalEmail,
        mixed $createdAt = null,
    ): string {
        $first = Str::lower(Str::substr(Str::ascii((string) $firstName), 0, 1));
        $last = Str::lower(Str::substr(Str::ascii((string) $lastName), 0, 1));

        if ($first !== '' && $last !== '') {
            $prefix = $first . $last;
        } elseif ($first !== '') {
            $prefix = $first . Str::lower(Str::substr(Str::ascii((string) $firstName), 1, 1));
        } elseif ($last !== '') {
            $prefix = $last . Str::lower(Str::substr(Str::ascii((string) $lastName), 1, 1));
        } else {
            $emailBase = $personalEmail
                ? Str::of($personalEmail)->before('@')->ascii()->lower()->replaceMatches('/[^a-z0-9]/', '')->value()
                : '';
            $prefix = Str::substr($emailBase, 0, 2);
        }

        $prefix = strtolower(preg_replace('/[^a-z0-9]/', 'x', $prefix) ?: 'xx');
        $prefix = substr($prefix . 'xx', 0, 2);

        $year = now()->format('Y');

        if ($createdAt !== null) {
            $timestamp = strtotime((string) $createdAt);
            if ($timestamp !== false) {
                $year = date('Y', $timestamp);
            }
        }

        $usernamePrefix = $prefix . $year;
        $pattern = '/^' . preg_quote($usernamePrefix, '/') . '\\d{5}$/';

        $latestMatching = DB::table('users')
            ->where('username', 'like', $usernamePrefix . '%')
            ->orderByDesc('username')
            ->pluck('username')
            ->first(function ($value) use ($pattern) {
                return is_string($value) && preg_match($pattern, $value) === 1;
            });

        $nextSequence = 1;
        if (is_string($latestMatching) && preg_match('/(\d{5})$/', $latestMatching, $matches) === 1) {
            $nextSequence = ((int) $matches[1]) + 1;
        }

        $candidate = sprintf('%s%05d', $usernamePrefix, $nextSequence);

        while (DB::table('users')->where('username', $candidate)->exists()) {
            $nextSequence++;
            $candidate = sprintf('%s%05d', $usernamePrefix, $nextSequence);
        }

        return $candidate;
    }
};

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
        Schema::table('departments', function (Blueprint $table) {
            $table->foreignId('school_track_id')
                ->nullable()
                ->after('track')
                ->constrained('school_tracks')
                ->nullOnDelete();
        });

        $schoolYear = DB::table('system_settings')
            ->where('key', 'current_school_year')
            ->value('value');

        if (!is_string($schoolYear) || trim($schoolYear) === '') {
            $currentYear = (int) date('Y');
            $schoolYear = $currentYear . '-' . ($currentYear + 1);
        }

        $existingTracks = DB::table('departments')
            ->whereNotNull('track')
            ->where('track', '!=', '')
            ->select('track')
            ->distinct()
            ->pluck('track');

        $trackIdsByName = [];

        foreach ($existingTracks as $trackNameValue) {
            $trackName = trim((string) $trackNameValue);

            if ($trackName === '') {
                continue;
            }

            $lookupKey = strtolower($trackName);

            if (array_key_exists($lookupKey, $trackIdsByName)) {
                continue;
            }

            $existing = DB::table('school_tracks')
                ->whereRaw('LOWER(track_name) = ?', [$lookupKey])
                ->first();

            if ($existing) {
                $trackIdsByName[$lookupKey] = (int) $existing->id;
                continue;
            }

            $codeBase = strtoupper(preg_replace('/[^A-Za-z0-9]+/', '_', $trackName) ?? '');
            $codeBase = trim($codeBase, '_');
            if ($codeBase === '') {
                $codeBase = 'TRACK';
            }

            $trackCode = $codeBase;
            $suffix = 2;

            while (DB::table('school_tracks')->where('track_code', $trackCode)->exists()) {
                $trackCode = $codeBase . '_' . $suffix;
                $suffix++;
            }

            $trackId = DB::table('school_tracks')->insertGetId([
                'track_name' => $trackName,
                'track_code' => $trackCode,
                'school_year' => $schoolYear,
                'description' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $trackIdsByName[$lookupKey] = (int) $trackId;
        }

        DB::table('departments')
            ->whereNotNull('track')
            ->where('track', '!=', '')
            ->orderBy('id')
            ->select('id', 'track')
            ->chunkById(100, function ($departments) use ($trackIdsByName): void {
                foreach ($departments as $department) {
                    $lookupKey = strtolower(trim((string) $department->track));
                    $trackId = $trackIdsByName[$lookupKey] ?? null;

                    if ($trackId === null) {
                        continue;
                    }

                    DB::table('departments')
                        ->where('id', $department->id)
                        ->update(['school_track_id' => $trackId]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('school_track_id');
        });
    }
};

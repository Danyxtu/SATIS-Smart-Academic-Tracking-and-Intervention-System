<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description',
        'updated_by',
    ];

    /**
     * Get the user who last updated this setting.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = Cache::remember("system_setting_{$key}", 3600, function () use ($key) {
            return static::where('key', $key)->first();
        });

        if (!$setting) {
            return $default;
        }

        return static::castValue($setting->value, $setting->type);
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, mixed $value, ?int $updatedBy = null): void
    {
        $setting = static::updateOrCreate(
            ['key' => $key],
            [
                'value' => is_array($value) ? json_encode($value) : (string) $value,
                'updated_by' => $updatedBy,
            ]
        );

        Cache::forget("system_setting_{$key}");
    }

    /**
     * Cast value based on type.
     */
    protected static function castValue(mixed $value, string $type): mixed
    {
        return match ($type) {
            'integer' => (int) $value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($value, true),
            'array' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Get current school year.
     */
    public static function getCurrentSchoolYear(): string
    {
        return static::get('current_school_year', date('Y') . '-' . (date('Y') + 1));
    }

    /**
     * Get current semester.
     */
    public static function getCurrentSemester(): int
    {
        return (int) static::get('current_semester', 1);
    }

    /**
     * Check if grades are locked for a specific semester.
     */
    public static function areGradesLocked(?string $schoolYear = null, ?int $semester = null): bool
    {
        $schoolYear = $schoolYear ?? static::getCurrentSchoolYear();
        $semester = $semester ?? static::getCurrentSemester();

        return (bool) static::get("grades_locked_{$schoolYear}_{$semester}", false);
    }
}

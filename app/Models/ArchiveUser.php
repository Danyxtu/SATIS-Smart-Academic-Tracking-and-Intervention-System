<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArchiveUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year_archive_id',
        'original_user_id',
        'first_name',
        'middle_name',
        'last_name',
        'username',
        'personal_email',
        'status',
        'primary_role',
        'roles_json',
        'department_name',
        'department_code',
        'department_track',
    ];

    protected function casts(): array
    {
        return [
            'roles_json' => 'array',
        ];
    }

    public function archive(): BelongsTo
    {
        return $this->belongsTo(SchoolYearArchive::class, 'school_year_archive_id');
    }

    public function getNameAttribute(): string
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ]);

        return implode(' ', $parts) ?: ((string) ($this->username ?? 'Unknown'));
    }
}

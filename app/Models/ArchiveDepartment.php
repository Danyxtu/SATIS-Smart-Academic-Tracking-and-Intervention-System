<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArchiveDepartment extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year_archive_id',
        'original_department_id',
        'department_name',
        'department_code',
        'track',
        'description',
        'is_active',
        'specializations_json',
        'admins_json',
        'teachers_json',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'specializations_json' => 'array',
            'admins_json' => 'array',
            'teachers_json' => 'array',
        ];
    }

    public function archive(): BelongsTo
    {
        return $this->belongsTo(SchoolYearArchive::class, 'school_year_archive_id');
    }
}

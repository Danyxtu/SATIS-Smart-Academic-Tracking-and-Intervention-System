<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArchiveSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year_archive_id',
        'original_section_id',
        'original_department_id',
        'section_name',
        'section_code',
        'cohort',
        'grade_level',
        'strand',
        'track',
        'school_year',
        'advisor_name',
        'department_name',
        'department_code',
    ];

    public function archive(): BelongsTo
    {
        return $this->belongsTo(SchoolYearArchive::class, 'school_year_archive_id');
    }
}

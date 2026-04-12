<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArchiveGradeItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year_archive_id',
        'archive_class_id',
        'archive_enrollment_id',
        'quarter',
        'category_id',
        'category_label',
        'category_weight',
        'task_id',
        'task_label',
        'assignment_key',
        'assignment_name',
        'score',
        'total_score',
        'percentage',
    ];

    protected function casts(): array
    {
        return [
            'quarter' => 'integer',
            'category_weight' => 'float',
            'score' => 'float',
            'total_score' => 'float',
            'percentage' => 'float',
        ];
    }

    public function archive(): BelongsTo
    {
        return $this->belongsTo(SchoolYearArchive::class, 'school_year_archive_id');
    }

    public function archiveClass(): BelongsTo
    {
        return $this->belongsTo(ArchiveClass::class, 'archive_class_id');
    }

    public function archiveEnrollment(): BelongsTo
    {
        return $this->belongsTo(ArchiveEnrollment::class, 'archive_enrollment_id');
    }
}

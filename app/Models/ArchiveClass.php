<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ArchiveClass extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year_archive_id',
        'original_class_id',
        'original_subject_id',
        'archive_section_id',
        'teacher_user_id',
        'subject_name',
        'subject_code',
        'grade_level',
        'section_name',
        'section_code',
        'strand',
        'track',
        'school_year',
        'semester',
        'current_quarter',
        'color',
        'teacher_name',
        'teacher_department_name',
        'teacher_department_code',
        'grade_categories',
        'students_total',
    ];

    protected function casts(): array
    {
        return [
            'grade_categories' => 'array',
            'semester' => 'integer',
            'current_quarter' => 'integer',
            'students_total' => 'integer',
        ];
    }

    public function archive(): BelongsTo
    {
        return $this->belongsTo(SchoolYearArchive::class, 'school_year_archive_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(ArchiveEnrollment::class, 'archive_class_id');
    }

    public function gradeItems(): HasMany
    {
        return $this->hasMany(ArchiveGradeItem::class, 'archive_class_id');
    }
}

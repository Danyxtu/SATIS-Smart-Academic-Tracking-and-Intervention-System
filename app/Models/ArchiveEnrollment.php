<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ArchiveEnrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year_archive_id',
        'archive_class_id',
        'original_enrollment_id',
        'student_user_id',
        'student_name',
        'student_username',
        'student_lrn',
        'grade_level',
        'section_name',
        'strand',
        'track',
        'initial_grade_q1',
        'expected_grade_q1',
        'q1_grade',
        'initial_grade_q2',
        'expected_grade_q2',
        'q2_grade',
        'final_grade',
        'remarks',
        'passed',
    ];

    protected function casts(): array
    {
        return [
            'initial_grade_q1' => 'float',
            'expected_grade_q1' => 'float',
            'q1_grade' => 'integer',
            'initial_grade_q2' => 'float',
            'expected_grade_q2' => 'float',
            'q2_grade' => 'integer',
            'final_grade' => 'integer',
            'passed' => 'boolean',
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

    public function gradeItems(): HasMany
    {
        return $this->hasMany(ArchiveGradeItem::class, 'archive_enrollment_id');
    }
}

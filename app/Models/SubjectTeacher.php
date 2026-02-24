<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubjectTeacher extends Model
{
    protected $fillable = [
        'subject_id',
        'teacher_id',
        'grade_level',
        'section',
        'color',
        'strand',
        'track',
        'school_year',
        'current_quarter',
        'grade_categories',
        'semester',
    ];

    protected $casts = [
        'grade_categories' => 'array',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'subject_teachers_id');
    }

    /**
     * Get the subject name through the subject relationship.
     */
    public function getNameAttribute(): ?string
    {
        return $this->subject?->subject_name;
    }
}

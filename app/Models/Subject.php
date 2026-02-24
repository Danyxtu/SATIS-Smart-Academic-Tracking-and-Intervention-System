<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_name',
        'subject_code',
    ];

    /**
     * Get the subject teachers relationship.
     */
    public function subjectTeachers(): HasMany
    {
        return $this->hasMany(SubjectTeacher::class);
    }

    /**
     * Get enrollments for this subject through SubjectTeacher.
     */
    public function enrollments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Enrollment::class,
            SubjectTeacher::class,
            'subject_id',         // Foreign key on SubjectTeacher table
            'subject_teachers_id', // Foreign key on Enrollment table
            'id',                 // Local key on Subject table
            'id'                  // Local key on SubjectTeacher table
        );
    }

    /**
     * Get students through enrollments.
     */
    public function students(): HasManyThrough
    {
        return $this->hasManyThrough(
            User::class,
            Enrollment::class,
            'subject_teachers_id', // Foreign key on Enrollment table - but this won't work directly
            'id',                  // Foreign key on User table
            'id',                  // Local key on Subject table
            'user_id'              // Local key on Enrollment table
        );
    }
}

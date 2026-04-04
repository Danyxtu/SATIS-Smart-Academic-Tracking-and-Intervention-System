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
        return $this->hasMany(SchoolClass::class, 'subject_id');
    }

    /**
     * Get enrollments for this subject through SubjectTeacher.
     */
    public function enrollments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Enrollment::class,
            SchoolClass::class,
            'subject_id', // Foreign key on classes table
            'class_id',   // Foreign key on enrollments table
            'id',
            'id'
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
            'class_id', // Foreign key on Enrollment table
            'id',
            'id',
            'user_id'
        );
    }
}

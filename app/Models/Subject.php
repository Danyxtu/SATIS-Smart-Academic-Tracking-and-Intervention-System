<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_name',
        'subject_code',
        'total_hours',
        'semester',
        'grade_level',
    ];

    protected static function booted(): void
    {
        static::created(function (Subject $subject): void {
            if ($subject->subjectTypes()->exists()) {
                return;
            }

            $defaultTypeId = SubjectType::query()
                ->where('type_key', SubjectType::CORE)
                ->value('id');

            if ($defaultTypeId !== null) {
                $subject->subjectTypes()->syncWithoutDetaching([$defaultTypeId]);
            }
        });
    }

    /**
     * Get the subject teachers relationship.
     */
    public function subjectTeachers(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'subject_id');
    }

    /**
     * Get classification tags attached to the subject.
     */
    public function subjectTypes(): BelongsToMany
    {
        return $this->belongsToMany(SubjectType::class)->withTimestamps();
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

    public function primarySubjectType(): ?SubjectType
    {
        $subjectTypes = $this->relationLoaded('subjectTypes')
            ? $this->subjectTypes
            : $this->subjectTypes()->get();

        if ($subjectTypes->isEmpty()) {
            return null;
        }

        $priorityMap = array_flip(SubjectType::priorityOrder());

        return $subjectTypes
            ->sortBy(static fn(SubjectType $type): int => $priorityMap[$type->type_key] ?? PHP_INT_MAX)
            ->first();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'master_subject_id',
        'name',
        'room_number',
        'school_year',
        'grade_level',
        'section',
        'strand',
        'track',
        'color',
        'grade_categories',
    ];

    protected $casts = [
        'grade_categories' => 'array',
    ];

    /**
     * Get the teacher (user) who owns this subject.
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Alias for teacher relationship.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the master subject this class is linked to.
     */
    public function masterSubject(): BelongsTo
    {
        return $this->belongsTo(MasterSubject::class);
    }

    /**
     * Get enrollments for this subject.
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Get students through enrollments.
     */
    public function students(): HasManyThrough
    {
        return $this->hasManyThrough(Student::class, Enrollment::class, 'subject_id', 'user_id', 'id', 'user_id');
    }

    /**
     * Check prerequisites for a student before enrollment.
     */
    public function checkPrerequisitesForStudent(User $student): array
    {
        if (!$this->master_subject_id) {
            return ['can_enroll' => true, 'missing' => [], 'completed' => []];
        }

        return $this->masterSubject->checkPrerequisites($student);
    }
}

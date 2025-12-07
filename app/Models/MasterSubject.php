<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'grade_level',
        'strand',
        'track',
        'semester',
        'units',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'units' => 'decimal:1',
        'is_active' => 'boolean',
    ];

    /**
     * Get the user who created this master subject.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the prerequisites for this subject.
     */
    public function prerequisites(): BelongsToMany
    {
        return $this->belongsToMany(
            MasterSubject::class,
            'master_subject_prerequisites',
            'master_subject_id',
            'prerequisite_id'
        )->withPivot('minimum_grade')->withTimestamps();
    }

    /**
     * Get subjects that require this subject as a prerequisite.
     */
    public function requiredFor(): BelongsToMany
    {
        return $this->belongsToMany(
            MasterSubject::class,
            'master_subject_prerequisites',
            'prerequisite_id',
            'master_subject_id'
        )->withPivot('minimum_grade')->withTimestamps();
    }

    /**
     * Get teacher classes that are linked to this master subject.
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    /**
     * Check if a student has completed all prerequisites.
     */
    public function checkPrerequisites(User $student): array
    {
        $results = [
            'can_enroll' => true,
            'missing' => [],
            'completed' => [],
        ];

        foreach ($this->prerequisites as $prereq) {
            // Find enrollment in any class linked to this master subject
            $enrollment = Enrollment::whereHas('subject', function ($query) use ($prereq) {
                $query->where('master_subject_id', $prereq->id);
            })
                ->where('user_id', $student->id)
                ->first();

            $minGrade = $prereq->pivot->minimum_grade ?? 75;

            // Calculate final grade if enrollment exists
            $finalGrade = null;
            if ($enrollment) {
                // You may need to calculate this based on your grading system
                $finalGrade = $enrollment->final_grade ?? null;
            }

            if (!$enrollment || ($finalGrade ?? 0) < $minGrade) {
                $results['can_enroll'] = false;
                $results['missing'][] = [
                    'id' => $prereq->id,
                    'code' => $prereq->code,
                    'name' => $prereq->name,
                    'required_grade' => $minGrade,
                    'student_grade' => $finalGrade,
                ];
            } else {
                $results['completed'][] = [
                    'id' => $prereq->id,
                    'code' => $prereq->code,
                    'name' => $prereq->name,
                    'grade' => $finalGrade,
                ];
            }
        }

        return $results;
    }

    /**
     * Scope to get only active master subjects.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by strand.
     */
    public function scopeForStrand($query, string $strand)
    {
        return $query->where(function ($q) use ($strand) {
            $q->where('strand', $strand)
                ->orWhereNull('strand');
        });
    }

    /**
     * Scope to filter by grade level.
     */
    public function scopeForGradeLevel($query, string $gradeLevel)
    {
        return $query->where(function ($q) use ($gradeLevel) {
            $q->where('grade_level', $gradeLevel)
                ->orWhereNull('grade_level');
        });
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_name',
        'department_code',
        'track',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the user who created this department.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all users (admins, teachers, students) in this department.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get all admins in this department.
     */
    public function admins(): HasMany
    {
        return $this->hasMany(User::class)
            ->whereHas('roles', function ($query) {
                $query->where('name', 'admin');
            });
    }

    /**
     * Get all teachers in this department.
     */
    public function teachers(): HasMany
    {
        return $this->hasMany(User::class)
            ->whereHas('roles', function ($query) {
                $query->where('name', 'teacher');
            });
    }

    /**
     * Get all students in this department.
     */
    public function students(): HasMany
    {
        return $this->hasMany(User::class)
            ->whereHas('roles', function ($query) {
                $query->where('name', 'student');
            });
    }

    /**
     * Get all sections created under this department.
     */
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    /**
     * Get all specializations assigned to this department.
     */
    public function specializations(): BelongsToMany
    {
        return $this->belongsToMany(Specialization::class, 'department_specialization')
            ->withTimestamps();
    }

    /**
     * Scope to get only active departments.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolYearArchive extends Model
{
    use HasFactory;

    protected $fillable = [
        'archive_key',
        'school_year',
        'next_school_year',
        'captured_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'captured_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'archive_key';
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users(): HasMany
    {
        return $this->hasMany(ArchiveUser::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(ArchiveDepartment::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(ArchiveSection::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(ArchiveClass::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(ArchiveEnrollment::class);
    }

    public function gradeItems(): HasMany
    {
        return $this->hasMany(ArchiveGradeItem::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolTrack extends Model
{
    use HasFactory;

    protected $fillable = [
        'track_name',
        'track_code',
        'school_year',
        'description',
    ];

    /**
     * Get departments assigned to this school track.
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }
}

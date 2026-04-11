<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Specialization extends Model
{
    use HasFactory;

    protected $fillable = [
        'specialization_name',
    ];

    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'department_specialization')
            ->withTimestamps();
    }
}

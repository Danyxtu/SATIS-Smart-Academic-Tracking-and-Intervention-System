<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    /** @use HasFactory<\Database\Factories\StudentFactory> */
    use HasFactory;

    protected $fillable = [
        'student_name',
        'lrn',
        'subject',
        'grade',
        'trend',
        'avatar',
        'user_id',
        'grade_level',
        'section',
        'strand',
        'track',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

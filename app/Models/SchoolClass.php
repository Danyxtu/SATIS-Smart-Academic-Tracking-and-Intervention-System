<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'subject_id',
        'section_id',
        'teacher_id',
        'school_year',
        'grade_level',
        'section',
        'strand',
        'track',
        'color',
        'current_quarter',
        'grade_categories',
        'seating_layout',
        'semester',
    ];

    protected $casts = [
        'grade_categories' => 'array',
        'seating_layout' => 'array',
        'current_quarter' => 'integer',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function sectionRecord()
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'class_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'subject_teachers_id',
        'risk_status',
        'current_grade',
        'current_attendance_rate',
        'initial_grade_q1',
        'expected_grade_q1',
        'q1_grade',
        'initial_grade_q2',
        'expected_grade_q2',
        'q2_grade',
        'final_grade',
    ];

    protected $casts = [
        'initial_grade_q1' => 'float',
        'expected_grade_q1' => 'float',
        'q1_grade' => 'integer',
        'initial_grade_q2' => 'float',
        'expected_grade_q2' => 'float',
        'q2_grade' => 'integer',
        'final_grade' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function student()
    {
        return $this->hasOneThrough(Student::class, User::class, 'id', 'user_id', 'user_id', 'id');
    }

    public function subjectTeacher()
    {
        return $this->belongsTo(SubjectTeacher::class, 'subject_teachers_id');
    }

    public function subject()
    {
        return $this->hasOneThrough(
            Subject::class,
            SubjectTeacher::class,
            'id',              // Foreign key on SubjectTeacher table
            'id',              // Foreign key on Subject table
            'subject_teachers_id', // Local key on Enrollment table
            'subject_id'       // Local key on SubjectTeacher table
        );
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function intervention()
    {
        return $this->hasOne(Intervention::class);
    }
}

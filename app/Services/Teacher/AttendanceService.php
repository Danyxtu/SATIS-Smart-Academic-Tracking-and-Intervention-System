<?php

namespace App\Services\Teacher;

use App\Models\SubjectTeacher;

class AttendanceService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function index($teacher): array
    {
        $subjectTeachers = SubjectTeacher::with(['subject', 'enrollments.user.student'])
            ->where('teacher_id', $teacher->id)
            ->orderBy('grade_level')
            ->get();

        $attendanceRecords = [];

        if ($subjectTeachers->isNotEmpty()) {
            $attendanceRecords = ['subjectTeachers' => $subjectTeachers];
        }
        return $attendanceRecords;
    }
}

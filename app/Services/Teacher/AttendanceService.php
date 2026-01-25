<?php

namespace App\Services\Teacher;

use App\Models\Subject;

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
        $subjects = Subject::with(['enrollments.user.student'])
            ->where('user_id', $teacher->id)
            ->orderBy('grade_level')
            ->get();

        $attendanceRecords = [];

        if ($subjects->isNotEmpty()) {
            $attendanceRecords = ['subjects' => $subjects];
        }
        return $attendanceRecords;
    }
}

<?php

namespace App\Services\Teacher;

use App\Models\SubjectTeacher;
use App\Models\AttendanceRecord;

class AttendanceServices
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


        $rosters = $subjectTeachers->mapWithKeys(fn($st) => [
            $st->id => $st->enrollments->map(function ($enrollment) {
                $user = $enrollment->user;
                $studentProfile = $user?->student;
                $fullName = $studentProfile?->student_name ?? $user?->name ?? 'Student';

                return [
                    'id' => $enrollment->id,
                    'name' => $fullName,
                    'avatar' => $studentProfile?->avatar ?? $this->avatarFor($fullName),
                    'email' => $user?->email,
                    'status' => 'present',
                ];
            })->values(),
        ])->all();

        $classes =  $subjectTeachers->map(fn($st) => [
            'id' => $st->id,
            'label' => sprintf(
                '%s - %s (%s)',
                $st->grade_level,
                $st->section,
                $st->subject?->subject_name ?? $st->name
            ),
            'grade_level' => $st->grade_level,
            'section' => $st->section,
            'subject' => $st->subject?->subject_name ?? $st->name,
        ])->values()->all();

        return [
            'classes' => $classes,
            'rosters' => $rosters,
        ];
    }
    public function attendanceLogsGroupedBySection($teacher)
    {
        // Get all subject-teacher assignments belonging to this teacher
        $subjectTeachers = SubjectTeacher::with([
            'subject',
            'enrollments.user.student',
            'enrollments.attendanceRecords',
        ])
            ->where('teacher_id', $teacher->id)
            ->orderBy('grade_level')
            ->orderBy('section')
            ->get();

        // Build sections list with attendance summary
        $results = $subjectTeachers->map(function ($st) {
            $allRecords = $st->enrollments->flatMap(fn($enrollment) => $enrollment->attendanceRecords);

            // Get unique dates
            $dates = $allRecords->pluck('date')->unique()->sort()->values();

            // Calculate overall stats
            $totalRecords = $allRecords->count();
            $presentCount = $allRecords->where('status', 'present')->count();
            $absentCount = $allRecords->where('status', 'absent')->count();
            $lateCount = $allRecords->where('status', 'late')->count();

            return [
                'id' => $st->id,
                'name' => $st->subject?->subject_name ?? $st->name,
                'grade_level' => $st->grade_level,
                'section' => $st->section,
                'label' => sprintf('%s - %s (%s)', $st->grade_level, $st->section, $st->subject?->subject_name ?? $st->name),
                'student_count' => $st->enrollments->count(),
                'total_days' => $dates->count(),
                'stats' => [
                    'present' => $presentCount,
                    'absent' => $absentCount,
                    'late' => $lateCount,
                ],
                'color' => $st->color ?? 'indigo',
            ];
        });

        return $results;
    }
    public function attendanceLogsOfSpecificSection($teacher, $subjectTeacher)
    {
        // Ensure teacher owns this subject-teacher assignment
        if ($subjectTeacher->teacher_id !== $teacher->id) {
            abort(403, 'You are not authorized to view this attendance.');
        }

        // Load enrollments with attendance records
        $subjectTeacher->load(['subject', 'enrollments.user.student', 'enrollments.attendanceRecords']);

        // Get all unique dates from attendance records, sorted
        $allDates = $subjectTeacher->enrollments
            ->flatMap(fn($e) => $e->attendanceRecords->pluck('date'))
            ->unique()
            ->sort()
            ->values()
            ->map(fn($date) => $date->format('Y-m-d'))
            ->toArray();

        // Build student attendance data - sorted alphabetically by name
        $students = $subjectTeacher->enrollments
            ->map(function ($enrollment) use ($allDates) {
                $user = $enrollment->user;
                $student = $user?->student;
                $fullName = $student?->student_name ?? $user?->name ?? 'Student';

                // Build attendance map for each date
                $attendance = [];
                foreach ($allDates as $date) {
                    $record = $enrollment->attendanceRecords->first(
                        fn($r) => $r->date->format('Y-m-d') === $date
                    );
                    $attendance[$date] = $record?->status ?? null;
                }

                // Calculate stats
                $records = $enrollment->attendanceRecords;
                $totalDays = $records->count();
                $presentDays = $records->where('status', 'present')->count();
                $absentDays = $records->where('status', 'absent')->count();
                $lateDays = $records->where('status', 'late')->count();

                return [
                    'id' => $enrollment->id,
                    'name' => $fullName,
                    'lrn' => $student?->lrn,
                    'attendance' => $attendance,
                    'stats' => [
                        'total' => $totalDays,
                        'present' => $presentDays,
                        'absent' => $absentDays,
                        'late' => $lateDays,
                        'rate' => $totalDays > 0 ? round(($presentDays / $totalDays) * 100, 1) : 0,
                    ],
                ];
            })
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->toArray();

        $subjectName = $subjectTeacher->subject?->subject_name ?? 'N/A';
        return [
            'section' => [
                'id' => $subjectTeacher->id,
                'subject_name' => $subjectName,
                'grade_level' => $subjectTeacher->grade_level,
                'section' => $subjectTeacher->section,
                'label' => sprintf('%s - %s (%s)', $subjectTeacher->grade_level, $subjectTeacher->section, $subjectName),
            ],
            'dates' => $allDates,
            'students' => $students,
        ];
    }

    public function createAttendance($data, $teacher)
    {
        $subjectTeacher = SubjectTeacher::with('enrollments')->findOrFail($data['classId']);

        // Ensure the teacher owns this subject-teacher assignment
        if ($subjectTeacher->teacher_id !== $teacher->id) {
            return response()->json(['message' => 'Unauthorized to modify attendance for this class.'], 403);
        }

        $date = $data['date'];
        $dateObj = new \DateTime($date);

        // Check if the date is a Sunday (0 = Sunday in PHP)
        if ((int)$dateObj->format('w') === 0) {
            return response()->json([
                'message' => 'Cannot take attendance on Sunday. Classes are not held on Sundays.',
                'is_sunday' => true
            ], 422);
        }

        // Check if attendance already exists for this class on this date
        $existingAttendance = AttendanceRecord::where('date', $date)
            ->whereHas('enrollment', function ($query) use ($subjectTeacher) {
                $query->where('subject_teachers_id', $subjectTeacher->id);
            })->exists();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Attendance has already been recorded for this class on ' . $date . '. You can only save attendance once per day.',
                'already_saved' => true
            ], 422);
        }

        foreach ($data['students'] as $s) {
            $enrollment = $subjectTeacher->enrollments->firstWhere('id', $s['id']);

            // If the enrollment does not belong to this subject-teacher, skip it
            if (!$enrollment) {
                continue;
            }

            AttendanceRecord::create([
                'enrollment_id' => $enrollment->id,
                'date' => $date,
                'status' => $s['status'],
            ]);
        }

        return [
            'message' => 'Attendance saved successfully!',
        ];
    }

    /**
     * Private Functions
     */

    private function avatarFor(string $fullName): string
    {
        $name = trim($fullName);

        if ($name === '') {
            $name = 'Student';
        }

        return 'https://ui-avatars.com/api/?background=4c1d95&color=fff&name=' . urlencode($name);
    }
}

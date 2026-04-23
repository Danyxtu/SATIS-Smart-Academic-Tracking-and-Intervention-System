<?php

namespace App\Services\Teacher;

use App\Models\AttendanceRecord;
use App\Models\SchoolClass;

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
        $classes = SchoolClass::with([
            'subject',
            'enrollments.user.student',
            'enrollments.attendanceRecords',
        ])
            ->where('teacher_id', $teacher->id)
            ->orderBy('grade_level')
            ->get();

        $today = now()->toDateString();


        $rosters = $classes->mapWithKeys(fn($class) => [
            $class->id => $class->enrollments
                ->map(function ($enrollment) {
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
                })
                ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
                ->values(),
        ])->all();

        $classes = $classes->map(function ($class) use ($today) {
            $allRecords = $class->enrollments
                ->flatMap(fn($enrollment) => $enrollment->attendanceRecords);

            $todayRecords = $allRecords->filter(
                fn($record) => $record->date && $record->date->format('Y-m-d') === $today
            );

            $lastRecordedDate = $allRecords
                ->pluck('date')
                ->filter()
                ->sortDesc()
                ->first();

            $daysRecorded = $allRecords
                ->pluck('date')
                ->filter()
                ->map(fn($date) => $date->format('Y-m-d'))
                ->unique()
                ->count();

            return [
                'id' => $class->id,
                'label' => sprintf(
                    '%s - %s (%s)',
                    $class->grade_level,
                    $class->section,
                    $class->subject?->subject_name ?? 'N/A'
                ),
                'grade_level' => $class->grade_level,
                'section' => $class->section,
                'subject' => $class->subject?->subject_name ?? 'N/A',
                'color' => $class->color ?? 'indigo',
                'seating_layout' => $class->seating_layout,
                'student_count' => $class->enrollments->count(),
                'attendance_summary' => [
                    'days_recorded' => $daysRecorded,
                    'total_records' => $allRecords->count(),
                    'present' => $allRecords->where('status', 'present')->count(),
                    'absent' => $allRecords->where('status', 'absent')->count(),
                    'late' => $allRecords->where('status', 'late')->count(),
                    'last_recorded_date' => $lastRecordedDate?->format('Y-m-d'),
                    'today' => [
                        'is_recorded' => $todayRecords->isNotEmpty(),
                        'present' => $todayRecords->where('status', 'present')->count(),
                        'absent' => $todayRecords->where('status', 'absent')->count(),
                        'late' => $todayRecords->where('status', 'late')->count(),
                    ],
                ],
            ];
        })->values()->all();

        return [
            'classes' => $classes,
            'rosters' => $rosters,
        ];
    }

    public function attendanceLogsOfSpecificSection($teacher, $subjectTeacher)
    {
        // Ensure teacher owns this class assignment
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
                'name' => $subjectName,
                'subject_name' => $subjectName,
                'grade_level' => $subjectTeacher->grade_level,
                'section' => $subjectTeacher->section,
                'label' => sprintf('%s - %s (%s)', $subjectTeacher->grade_level, $subjectTeacher->section, $subjectName),
            ],
            'dates' => $allDates,
            'students' => $students,
        ];
    }

    /**
     * Persist attendance rows for a class and date.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function createAttendance(array $data, $teacher): array
    {
        $subjectTeacher = SchoolClass::with('enrollments')->findOrFail($data['classId']);

        // Ensure the teacher owns this class assignment
        if ($subjectTeacher->teacher_id !== $teacher->id) {
            return [
                'status' => 403,
                'message' => 'Unauthorized to modify attendance for this class.',
            ];
        }

        // Save seating layout if provided
        if (isset($data['seatLayout'])) {
            $subjectTeacher->update([
                'seating_layout' => $data['seatLayout'],
            ]);
        }

        $date = $data['date'];
        $dateObj = new \DateTime($date);

        // Check if the date is a Sunday (0 = Sunday in PHP)
        if ((int)$dateObj->format('w') === 0) {
            return [
                'status' => 422,
                'message' => 'Cannot take attendance on Sunday. Classes are not held on Sundays.',
                'is_sunday' => true,
            ];
        }

        // Check if attendance already exists for this class on this date
        $existingAttendance = AttendanceRecord::where('date', $date)
            ->whereHas('enrollment', function ($query) use ($subjectTeacher) {
                $query->where('class_id', $subjectTeacher->id);
            })->exists();

        if ($existingAttendance) {
            return [
                'status' => 422,
                'message' => 'Attendance has already been recorded for this class on ' . $date . '. You can only save attendance once per day.',
                'already_saved' => true,
            ];
        }

        foreach ($data['students'] as $s) {
            $enrollment = $subjectTeacher->enrollments->firstWhere('id', $s['id']);

            // If the enrollment does not belong to this class, skip it
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
            'status' => 200,
            'message' => 'Attendance saved successfully!',
        ];
    }

    /**
     * Update the seating layout for a class.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function updateLayout(array $data, $teacher): array
    {
        $subjectTeacher = SchoolClass::findOrFail($data['classId']);

        // Ensure the teacher owns this class assignment
        if ($subjectTeacher->teacher_id !== $teacher->id) {
            return [
                'status' => 403,
                'message' => 'Unauthorized to modify layout for this class.',
            ];
        }

        $subjectTeacher->update([
            'seating_layout' => $data['seatLayout'],
        ]);

        return [
            'status' => 200,
            'message' => 'Seating layout saved successfully!',
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

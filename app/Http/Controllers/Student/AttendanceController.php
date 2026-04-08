<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * Display the student's attendance page with real data.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get all enrollments for this student with attendance and subject data
        $enrollments = Enrollment::with([
            'subjectTeacher.subject',
            'subjectTeacher.teacher',
            'schoolClass.subject',
            'schoolClass.teacher',
            'subject',
            'attendanceRecords',
        ])
            ->where('user_id', $user->id)
            ->get();

        // Collect all attendance records
        $allAttendance = $enrollments->flatMap(fn($e) => $e->attendanceRecords);

        // Calculate overall summary statistics
        $totalDays = $allAttendance->count();
        $presentDays = $allAttendance->whereIn('status', ['present'])->count();
        $absentDays = $allAttendance->where('status', 'absent')->count();
        $lateDays = $allAttendance->where('status', 'late')->count();
        $excusedDays = $allAttendance->where('status', 'excused')->count();

        // Calculate overall attendance rate (present + excused + late counts partially)
        $effectivePresent = $presentDays + $excusedDays + ($lateDays * 0.5);
        $overallRate = $totalDays > 0 ? round(($effectivePresent / $totalDays) * 100) : 100;

        $summaryStats = [
            'overallRate' => $overallRate,
            'totalDays' => $totalDays,
            'presentDays' => $presentDays,
            'absentDays' => $absentDays,
            'lateDays' => $lateDays,
            'excusedDays' => $excusedDays,
        ];

        // Build subject-wise attendance breakdown
        $subjectAttendance = $enrollments->map(function ($enrollment) {
            $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
            $subject = $class?->subject ?? $enrollment->subject;
            $teacher = $class?->teacher;

            $records = $enrollment->attendanceRecords;
            $total = $records->count();
            $present = $records->where('status', 'present')->count();
            $absent = $records->where('status', 'absent')->count();
            $late = $records->where('status', 'late')->count();
            $excused = $records->where('status', 'excused')->count();

            // Calculate rate
            $effectivePresent = $present + $excused + ($late * 0.5);
            $rate = $total > 0 ? round(($effectivePresent / $total) * 100) : 100;

            return [
                'id' => $enrollment->id,
                'subjectId' => $class?->subject_id ?? $subject?->id,
                'subject' => $subject?->subject_name ?? 'Unknown Subject',
                'instructor' => $teacher?->name ?? 'N/A',
                'rate' => $rate,
                'total' => $total,
                'present' => $present,
                'absences' => $absent,
                'lates' => $late,
                'excused' => $excused,
            ];
        })->sortByDesc('rate')->values();

        // Build recent attendance log (last 20 records across all subjects)
        $attendanceLog = $allAttendance
            ->map(function ($record) use ($enrollments) {
                $enrollment = $enrollments->firstWhere('id', $record->enrollment_id);
                $class = $enrollment?->subjectTeacher ?? $enrollment?->schoolClass;
                $subject = $class?->subject ?? $enrollment?->subject;

                return [
                    'id' => $record->id,
                    'date' => $record->date->format('M d, Y'),
                    'dateRaw' => $record->date->format('Y-m-d'),
                    'time' => $record->created_at->format('h:i A'),
                    'subject' => $subject?->subject_name ?? 'Unknown Subject',
                    'subjectId' => $class?->subject_id ?? $subject?->id,
                    'status' => ucfirst($record->status),
                    'statusRaw' => $record->status,
                ];
            })
            ->sortByDesc('dateRaw')
            ->take(20)
            ->values();

        // Build calendar data (dates with statuses for marking)
        $calendarData = $allAttendance
            ->groupBy(fn($r) => $r->date->format('Y-m-d'))
            ->map(function ($dayRecords) {
                // If any record on this day is absent, mark as absent
                // If any is late (but none absent), mark as late
                // Otherwise mark as present/excused
                $statuses = $dayRecords->pluck('status')->unique();

                if ($statuses->contains('absent')) {
                    return 'absent';
                } elseif ($statuses->contains('late')) {
                    return 'late';
                } elseif ($statuses->contains('excused')) {
                    return 'excused';
                }
                return 'present';
            })
            ->toArray();

        return Inertia::render('Student/Attendance', [
            'summaryStats' => $summaryStats,
            'subjectAttendance' => $subjectAttendance,
            'attendanceLog' => $attendanceLog,
            'calendarData' => $calendarData,
        ]);
    }

    /**
     * Display attendance summary for a specific enrolled subject.
     */
    public function show(Request $request, Enrollment $enrollment): Response
    {
        $enrollment = Enrollment::with([
            'subjectTeacher.subject',
            'subjectTeacher.teacher',
            'schoolClass.subject',
            'schoolClass.teacher',
            'subject',
            'attendanceRecords',
        ])
            ->whereKey($enrollment->id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
        $subject = $class?->subject ?? $enrollment->subject;
        $teacher = $class?->teacher;

        $records = $enrollment->attendanceRecords
            ->sortByDesc(fn($record) => $record->date?->toDateString())
            ->values();

        $total = $records->count();
        $present = $records->where('status', 'present')->count();
        $absent = $records->where('status', 'absent')->count();
        $late = $records->where('status', 'late')->count();
        $excused = $records->where('status', 'excused')->count();

        $effectivePresent = $present + $excused + ($late * 0.5);
        $rate = $total > 0 ? round(($effectivePresent / $total) * 100) : null;

        return Inertia::render('Student/AttendanceSummary', [
            'subject' => [
                'enrollmentId' => $enrollment->id,
                'name' => $subject?->subject_name ?? 'Unknown Subject',
                'instructor' => $teacher?->name ?? 'N/A',
            ],
            'hasStarted' => $total > 0,
            'summary' => [
                'rate' => $rate,
                'total' => $total,
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'excused' => $excused,
            ],
            'records' => $records->map(function ($record) {
                return [
                    'id' => $record->id,
                    'date' => $record->date->format('M d, Y'),
                    'dateRaw' => $record->date->toDateString(),
                    'status' => ucfirst($record->status),
                    'statusRaw' => $record->status,
                    'recordedAt' => $record->created_at?->format('h:i A'),
                ];
            })->values(),
        ]);
    }
}

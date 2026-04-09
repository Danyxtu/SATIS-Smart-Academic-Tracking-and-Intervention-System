<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class StudentAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

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

        // Aggregate totals across all subjects
        $totalDaysAll = 0;
        $presentDaysAll = 0;
        $absentDaysAll = 0;
        $lateDaysAll = 0;
        $excusedDaysAll = 0;

        $colorPalette = ['#fb7185', '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
        $colorIndex = 0;

        $subjects = $enrollments->map(function ($enrollment) use (&$totalDaysAll, &$presentDaysAll, &$absentDaysAll, &$lateDaysAll, &$excusedDaysAll, &$colorIndex, $colorPalette) {
            $class = $this->resolveClass($enrollment);
            $subject = $this->resolveSubject($enrollment, $class);
            $teacher = $class?->teacher;

            $attendance = $enrollment->attendanceRecords;
            $totalDays = $attendance->count();
            $presentDays = $attendance->where('status', 'present')->count();
            $absentDays = $attendance->where('status', 'absent')->count();
            $lateDays = $attendance->where('status', 'late')->count();
            $excusedDays = $attendance->where('status', 'excused')->count();

            $totalDaysAll += $totalDays;
            $presentDaysAll += $presentDays;
            $absentDaysAll += $absentDays;
            $lateDaysAll += $lateDays;
            $excusedDaysAll += $excusedDays;

            $effectivePresent = $presentDays + $excusedDays + ($lateDays * 0.5);
            $attendanceRate = $totalDays > 0 ? round(($effectivePresent / $totalDays) * 100) : 100;

            // Determine latest status for "recent activity" (last record)
            $latestRecord = $attendance->sortByDesc(fn($record) => $record->date?->toDateString())->first();
            $latestStatus = $latestRecord?->status ?? 'present';
            $statusLabel = match ($latestStatus) {
                'present' => 'Present',
                'absent' => 'Absent',
                'late' => 'Late',
                'excused' => 'Excused',
                default => 'Present',
            };

            $color = $colorPalette[$colorIndex % count($colorPalette)];
            $colorIndex++;

            return [
                'id' => $enrollment->id,
                'enrollmentId' => $enrollment->id,
                'name' => $subject?->subject_name ?? 'Unknown Subject',
                'instructor' => $teacher?->name ?? 'N/A',
                'attended' => $presentDays,
                'total' => $totalDays,
                'absent' => $absentDays,
                'late' => $lateDays,
                'excused' => $excusedDays,
                'attendanceRate' => $attendanceRate,
                'status' => $statusLabel,
                'color' => $color,
            ];
        })->values();

        $effectivePresentAll = $presentDaysAll + $excusedDaysAll + ($lateDaysAll * 0.5);
        $overallAttendance = $totalDaysAll > 0
            ? round(($effectivePresentAll / $totalDaysAll) * 100)
            : 100;

        // Stats for the overview cards
        $stats = [
            'overallAttendance' => $overallAttendance,
            'daysPresent' => $presentDaysAll,
            'totalDays' => $totalDaysAll,
            'daysAbsent' => $absentDaysAll,
            'tardiness' => $lateDaysAll,
            'daysExcused' => $excusedDaysAll,
        ];

        $attendanceLog = $enrollments
            ->flatMap(function ($enrollment) {
                $class = $this->resolveClass($enrollment);
                $subject = $this->resolveSubject($enrollment, $class);

                return $enrollment->attendanceRecords->map(function ($record) use ($subject) {
                    return [
                        'id' => $record->id,
                        'date' => $record->date->format('M d, Y'),
                        'dateRaw' => $record->date->format('Y-m-d'),
                        'time' => $record->created_at?->format('h:i A') ?? '-',
                        'subject' => $subject?->subject_name ?? 'Unknown Subject',
                        'status' => ucfirst($record->status),
                        'statusRaw' => $record->status,
                    ];
                });
            })
            ->sortByDesc('dateRaw')
            ->take(20)
            ->values();

        // Calendar events: build from attendance records (date => list of records)
        $events = [];
        foreach ($enrollments as $enrollment) {
            $class = $this->resolveClass($enrollment);
            $subject = $this->resolveSubject($enrollment, $class);

            foreach ($enrollment->attendanceRecords as $record) {
                $dateKey = $record->date instanceof \DateTimeInterface
                    ? $record->date->format('Y-n-j')
                    : date('Y-n-j', strtotime($record->date));

                $isCompleted = in_array($record->status, ['present', 'excused'], true);

                $events[$dateKey][] = [
                    'type' => 'attendance',
                    'title' => ($subject?->subject_name ?? 'Class') . ' - ' . ucfirst($record->status),
                    'statusRaw' => $record->status,
                    'status' => $isCompleted ? 'completed' : 'pending',
                ];
            }
        }

        return response()->json([
            'stats' => $stats,
            'subjects' => $subjects,
            'attendanceLog' => $attendanceLog,
            'events' => $events,
        ]);
    }

    public function show(Request $request, $enrollmentId)
    {
        $enrollment = Enrollment::with([
            'subjectTeacher.subject',
            'subjectTeacher.teacher',
            'schoolClass.subject',
            'schoolClass.teacher',
            'subject',
            'attendanceRecords',
        ])
            ->whereKey($enrollmentId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $class = $this->resolveClass($enrollment);
        $subject = $this->resolveSubject($enrollment, $class);
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

        return response()->json([
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

    private function resolveClass(Enrollment $enrollment)
    {
        return $enrollment->schoolClass ?? $enrollment->subjectTeacher;
    }

    private function resolveSubject(Enrollment $enrollment, $class)
    {
        return $class?->subject ?? $enrollment->subject;
    }
}

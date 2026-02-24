<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\StudentNotification;
use Illuminate\Http\Request;

class StudentAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $enrollments = Enrollment::with(['subjectTeacher.subject', 'attendanceRecords'])
            ->where('user_id', $user->id)
            ->get();

        // Aggregate totals across all subjects
        $totalDaysAll = 0;
        $presentDaysAll = 0;
        $absentDaysAll = 0;
        $lateDaysAll = 0;

        $subjects = $enrollments->map(function ($enrollment) use (&$totalDaysAll, &$presentDaysAll, &$absentDaysAll, &$lateDaysAll) {
            $attendance = $enrollment->attendanceRecords;
            $totalDays = $attendance->count();
            $presentDays = $attendance->where('status', 'present')->count();
            $absentDays = $attendance->where('status', 'absent')->count();
            $lateDays = $attendance->where('status', 'late')->count();

            $totalDaysAll += $totalDays;
            $presentDaysAll += $presentDays;
            $absentDaysAll += $absentDays;
            $lateDaysAll += $lateDays;

            $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

            // Determine latest status for "recent activity" (last record)
            $latestRecord = $attendance->sortByDesc('date')->first();
            $latestStatus = $latestRecord?->status ?? 'present';
            $statusLabel = match ($latestStatus) {
                'present' => 'Present',
                'absent' => 'Absent',
                'late' => 'Late',
                default => 'Present',
            };

            // Pick a color for visual variety (mobile UI uses these)
            static $colors = ['#fb7185', '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
            static $colorIndex = 0;
            $color = $colors[$colorIndex % count($colors)];
            $colorIndex++;

            return [
                'id' => $enrollment->id,
                'name' => $enrollment->subjectTeacher?->subject?->name ?? 'Unknown',
                'attended' => $presentDays,
                'total' => $totalDays,
                'attendanceRate' => $attendanceRate,
                'status' => $statusLabel,
                'color' => $color,
            ];
        })->values();

        $overallAttendance = $totalDaysAll > 0
            ? round(($presentDaysAll / $totalDaysAll) * 100)
            : 100;

        // Stats for the overview cards
        $stats = [
            'overallAttendance' => $overallAttendance,
            'daysPresent' => $presentDaysAll,
            'totalDays' => $totalDaysAll,
            'daysAbsent' => $absentDaysAll,
            'tardiness' => $lateDaysAll,
        ];

        // Calendar events: build from attendance records (date => list of records)
        $events = [];
        foreach ($enrollments as $enrollment) {
            foreach ($enrollment->attendanceRecords as $record) {
                $dateKey = $record->date instanceof \DateTimeInterface
                    ? $record->date->format('Y-n-j')
                    : date('Y-n-j', strtotime($record->date));
                $events[$dateKey][] = [
                    'type' => 'attendance',
                    'title' => ($enrollment->subjectTeacher?->subject?->name ?? 'Class') . ' - ' . ucfirst($record->status),
                    'status' => $record->status === 'present' ? 'completed' : 'pending',
                ];
            }
        }

        return response()->json([
            'stats' => $stats,
            'subjects' => $subjects,
            'events' => $events,
        ]);
    }
}

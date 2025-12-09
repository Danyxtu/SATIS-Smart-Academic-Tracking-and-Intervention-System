<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $teacher = $request->user();

        $subjects = Subject::with(['enrollments.user.student'])
            ->where('user_id', $teacher->id)
            ->orderBy('grade_level')
            ->get();

        return Inertia::render('Teacher/Attendance', [
            'classes' => $subjects->map(fn($subject) => [
                'id' => $subject->id,
                'label' => sprintf(
                    '%s - %s (%s)',
                    $subject->grade_level,
                    $subject->section,
                    $subject->name
                ),
                'grade_level' => $subject->grade_level,
                'section' => $subject->section,
                'subject' => $subject->name,
            ])->values(),
            'rosters' => $subjects->mapWithKeys(fn($subject) => [
                $subject->id => $subject->enrollments->map(function ($enrollment) {
                    $user = $enrollment->user;
                    $studentProfile = $user?->student;
                    $fullName = $user?->name ?? trim(
                        ($studentProfile->first_name ?? '') . ' ' . ($studentProfile->last_name ?? '')
                    );

                    return [
                        'id' => $enrollment->id,
                        'name' => $fullName ?: 'Student',
                        'avatar' => $studentProfile?->avatar ?? $this->avatarFor($fullName),
                        'email' => $user?->email,
                        'status' => 'present',
                    ];
                })->values(),
            ])->all(),
        ]);
    }

    /**
     * Display the attendance log grouped by sections.
     */
    public function log(Request $request): Response
    {
        $teacher = $request->user();

        // Get all subjects belonging to this teacher
        $subjects = Subject::with([
            'enrollments.user.student',
            'enrollments.attendanceRecords',
        ])
            ->where('user_id', $teacher->id)
            ->orderBy('grade_level')
            ->orderBy('section')
            ->get();

        // Build sections list with attendance summary
        $sections = $subjects->map(function ($subject) {
            $allRecords = $subject->enrollments->flatMap(fn($e) => $e->attendanceRecords);

            // Get unique dates
            $dates = $allRecords->pluck('date')->unique()->sort()->values();

            // Calculate overall stats
            $totalRecords = $allRecords->count();
            $presentCount = $allRecords->where('status', 'present')->count();
            $absentCount = $allRecords->where('status', 'absent')->count();
            $lateCount = $allRecords->where('status', 'late')->count();

            return [
                'id' => $subject->id,
                'name' => $subject->name,
                'grade_level' => $subject->grade_level,
                'section' => $subject->section,
                'label' => sprintf('%s - %s (%s)', $subject->grade_level, $subject->section, $subject->name),
                'student_count' => $subject->enrollments->count(),
                'total_days' => $dates->count(),
                'stats' => [
                    'present' => $presentCount,
                    'absent' => $absentCount,
                    'late' => $lateCount,
                ],
                'color' => $subject->color ?? 'indigo',
            ];
        });

        return Inertia::render('Teacher/AttendanceLog', [
            'sections' => $sections->toArray(),
        ]);
    }

    /**
     * Get detailed attendance data for a specific section.
     */
    public function show(Request $request, Subject $subject): Response
    {
        $teacher = $request->user();

        // Ensure teacher owns this subject
        if ($subject->user_id !== $teacher->id) {
            abort(403, 'You are not authorized to view this attendance.');
        }

        // Load enrollments with attendance records
        $subject->load(['enrollments.user.student', 'enrollments.attendanceRecords']);

        // Get all unique dates from attendance records, sorted
        $allDates = $subject->enrollments
            ->flatMap(fn($e) => $e->attendanceRecords->pluck('date'))
            ->unique()
            ->sort()
            ->values()
            ->map(fn($date) => $date->format('Y-m-d'))
            ->toArray();

        // Build student attendance data - sorted alphabetically by name
        $students = $subject->enrollments
            ->map(function ($enrollment) use ($allDates) {
                $user = $enrollment->user;
                $student = $user?->student;
                $fullName = $user?->name ?? trim(
                    ($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')
                );

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
                    'name' => $fullName ?: 'Student',
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

        return Inertia::render('Teacher/AttendanceLogDetail', [
            'section' => [
                'id' => $subject->id,
                'name' => $subject->name,
                'grade_level' => $subject->grade_level,
                'section' => $subject->section,
                'label' => sprintf('%s - %s (%s)', $subject->grade_level, $subject->section, $subject->name),
            ],
            'dates' => $allDates,
            'students' => $students,
        ]);
    }

    /**
     * Export attendance data as CSV.
     */
    public function export(Request $request, Subject $subject)
    {
        $teacher = $request->user();

        // Ensure teacher owns this subject
        if ($subject->user_id !== $teacher->id) {
            abort(403, 'You are not authorized to export this attendance.');
        }

        // Load enrollments with attendance records
        $subject->load(['enrollments.user.student', 'enrollments.attendanceRecords']);

        // Get all unique dates
        $allDates = $subject->enrollments
            ->flatMap(fn($e) => $e->attendanceRecords->pluck('date'))
            ->unique()
            ->sort()
            ->values()
            ->map(fn($date) => $date->format('Y-m-d'))
            ->toArray();

        // Build CSV content
        $headers = array_merge(['Name', 'LRN'], $allDates, ['Present', 'Absent', 'Late', 'Rate (%)']);

        $rows = $subject->enrollments
            ->map(function ($enrollment) use ($allDates) {
                $user = $enrollment->user;
                $student = $user?->student;
                $fullName = $user?->name ?? trim(
                    ($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')
                );

                $row = [
                    $fullName ?: 'Student',
                    $student?->lrn ?? '',
                ];

                // Add attendance for each date
                foreach ($allDates as $date) {
                    $record = $enrollment->attendanceRecords->first(
                        fn($r) => $r->date->format('Y-m-d') === $date
                    );
                    $status = $record?->status ?? '';
                    // Convert to short form for CSV
                    $row[] = match ($status) {
                        'present' => 'P',
                        'absent' => 'A',
                        'late' => 'L',
                        'excused' => 'E',
                        default => '-',
                    };
                }

                // Add stats
                $records = $enrollment->attendanceRecords;
                $totalDays = $records->count();
                $presentDays = $records->where('status', 'present')->count();
                $absentDays = $records->where('status', 'absent')->count();
                $lateDays = $records->where('status', 'late')->count();
                $rate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100, 1) : 0;

                $row[] = $presentDays;
                $row[] = $absentDays;
                $row[] = $lateDays;
                $row[] = $rate;

                return $row;
            })
            ->sortBy(fn($row) => $row[0], SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->toArray();

        // Generate CSV
        $filename = sprintf(
            'attendance_%s_%s_%s.csv',
            str_replace(' ', '_', $subject->grade_level),
            str_replace(' ', '_', $subject->section),
            now()->format('Y-m-d')
        );

        $callback = function () use ($headers, $rows) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($rows as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Export attendance data as a PDF using dompdf.
     */
    public function exportPdf(Request $request, Subject $subject)
    {
        $teacher = $request->user();

        if ($subject->user_id !== $teacher->id) {
            abort(403, 'You are not authorized to export this attendance.');
        }

        // Try to use Dompdf via barryvdh/laravel-dompdf (use string to avoid static analysis error when package is not installed)
        if (! class_exists('Barryvdh\\DomPDF\\Facade\\Pdf')) {
            // Return a 501 Not Implemented with instructions
            return response()->json([
                'message' => 'PDF export not available. Please install barryvdh/laravel-dompdf via Composer: composer require barryvdh/laravel-dompdf',
            ], 501);
        }

        // Same data preparation as export() function
        $subject->load(['enrollments.user.student', 'enrollments.attendanceRecords']);

        $allDates = $subject->enrollments
            ->flatMap(fn($e) => $e->attendanceRecords->pluck('date'))
            ->unique()
            ->sort()
            ->values()
            ->map(fn($date) => $date->format('Y-m-d'))
            ->toArray();

        $students = $subject->enrollments
            ->map(function ($enrollment) use ($allDates) {
                $user = $enrollment->user;
                $student = $user?->student;
                $fullName = $user?->name ?? trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? ''));

                $attendance = [];
                foreach ($allDates as $date) {
                    $record = $enrollment->attendanceRecords->first(fn($r) => $r->date->format('Y-m-d') === $date);
                    $attendance[$date] = $record?->status ?? null;
                }

                $records = $enrollment->attendanceRecords;
                $totalDays = $records->count();
                $presentDays = $records->where('status', 'present')->count();
                $absentDays = $records->where('status', 'absent')->count();
                $lateDays = $records->where('status', 'late')->count();

                return [
                    'id' => $enrollment->id,
                    'name' => $fullName ?: 'Student',
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

        // Prepare view data
        $viewData = [
            'section' => [
                'id' => $subject->id,
                'name' => $subject->name,
                'grade_level' => $subject->grade_level,
                'section' => $subject->section,
                'label' => sprintf('%s - %s (%s)', $subject->grade_level, $subject->section, $subject->name),
            ],
            'dates' => $allDates,
            'students' => $students,
        ];

        /** @var \Barryvdh\DomPDF\PDF $pdf */
        $pdf = app('dompdf.wrapper')->loadView('pdf.attendance', $viewData);
        $filename = sprintf(
            'attendance_%s_%s_%s.pdf',
            str_replace(' ', '_', $subject->grade_level),
            str_replace(' ', '_', $subject->section),
            now()->format('Y-m-d')
        );

        return $pdf->download($filename);
    }

    /**
     * Check if attendance already exists for a class on a given date.
     */
    public function checkExists(Request $request)
    {
        $data = $request->validate([
            'classId' => ['required', 'integer', 'exists:subjects,id'],
            'date' => ['required', 'date'],
        ]);

        $subject = Subject::findOrFail($data['classId']);

        $exists = AttendanceRecord::whereHas('enrollment', function ($query) use ($subject) {
            $query->where('subject_id', $subject->id);
        })->where('date', $data['date'])->exists();

        return response()->json(['exists' => $exists]);
    }

    /**
     * Persist attendance records for a class on a given date.
     * Attendance can only be saved once per day per class.
     * Cannot take attendance on Sundays.
     */
    public function store(Request $request)
    {
        $teacher = $request->user();

        $data = $request->validate([
            'classId' => ['required', 'integer', 'exists:subjects,id'],
            'date' => ['required', 'date'],
            'students' => ['required', 'array'],
            'students.*.id' => ['required', 'integer', 'exists:enrollments,id'],
            'students.*.status' => ['required', 'string'],
        ]);

        $subject = Subject::findOrFail($data['classId']);

        // Ensure the teacher owns this subject
        if ($subject->user_id !== $teacher->id) {
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
        $existingAttendance = AttendanceRecord::whereHas('enrollment', function ($query) use ($subject) {
            $query->where('subject_id', $subject->id);
        })->where('date', $date)->exists();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Attendance has already been recorded for this class on ' . $date . '. You can only save attendance once per day.',
                'already_saved' => true
            ], 422);
        }

        foreach ($data['students'] as $s) {
            $enrollment = $subject->enrollments->firstWhere('id', $s['id']);

            // If the enrollment does not belong to this subject, skip it
            if (!$enrollment) {
                continue;
            }

            AttendanceRecord::create([
                'enrollment_id' => $enrollment->id,
                'date' => $date,
                'status' => $s['status'],
            ]);
        }

        return response()->json(['message' => 'Attendance saved successfully!'], 200);
    }

    private function avatarFor(string $fullName): string
    {
        $name = trim($fullName);

        if ($name === '') {
            $name = 'Student';
        }

        return 'https://ui-avatars.com/api/?background=4c1d95&color=fff&name=' . urlencode($name);
    }
}

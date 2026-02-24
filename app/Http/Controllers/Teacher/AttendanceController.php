<?php

namespace App\Http\Controllers\Teacher;

use App\Services\Teacher\AttendanceService;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Subject;
use App\Models\SubjectTeacher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class AttendanceController extends Controller
{
    protected $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    // Render the attendance taking interface
    public function index(Request $request): Response
    {
        $teacher = $request->user();

        $results = $this->attendanceService->index($teacher);

        $subjectTeachers = SubjectTeacher::with(['subject', 'enrollments.user.student'])
            ->where('teacher_id', $teacher->id)
            ->orderBy('grade_level')
            ->get();

        return Inertia::render('Teacher/Attendance', [
            // This is for the class selection dropdown
            'classes' => $subjectTeachers->map(fn($st) => [
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
            ])->values(),
            // This is for the rosters
            'rosters' => $subjectTeachers->mapWithKeys(fn($st) => [
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
            ])->all(),
        ]);
    }

    /**
     * Display the attendance log grouped by sections.
     */
    public function log(Request $request): Response
    {
        $teacher = $request->user();

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
        $sections = $subjectTeachers->map(function ($st) {
            $allRecords = $st->enrollments->flatMap(fn($e) => $e->attendanceRecords);

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

        return Inertia::render('Teacher/AttendanceLog', [
            'sections' => $sections->toArray(),
        ]);
    }

    /**
     * Get detailed attendance data for a specific section.
     */
    public function show(Request $request, SubjectTeacher $subjectTeacher): Response
    {
        $teacher = $request->user();

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

        return Inertia::render('Teacher/AttendanceLogDetail', [
            'section' => [
                'id' => $subjectTeacher->id,
                'subject_name' => $subjectName,
                'grade_level' => $subjectTeacher->grade_level,
                'section' => $subjectTeacher->section,
                'label' => sprintf('%s - %s (%s)', $subjectTeacher->grade_level, $subjectTeacher->section, $subjectName),
            ],
            'dates' => $allDates,
            'students' => $students,
        ]);
    }

    /**
     * Export attendance data as CSV.
     */
    public function export(Request $request, SubjectTeacher $subjectTeacher)
    {
        $teacher = $request->user();

        // Ensure teacher owns this subject-teacher assignment
        if ($subjectTeacher->teacher_id !== $teacher->id) {
            abort(403, 'You are not authorized to export this attendance.');
        }

        // Load enrollments with attendance records
        $subjectTeacher->load(['subject', 'enrollments.user.student', 'enrollments.attendanceRecords']);

        // Get all unique dates
        $allDates = $subjectTeacher->enrollments
            ->flatMap(fn($e) => $e->attendanceRecords->pluck('date'))
            ->unique()
            ->sort()
            ->values()
            ->map(fn($date) => $date->format('Y-m-d'))
            ->toArray();

        // Build CSV content
        $headers = array_merge(['Name', 'LRN'], $allDates, ['Present', 'Absent', 'Late', 'Rate (%)']);

        $rows = $subjectTeacher->enrollments
            ->map(function ($enrollment) use ($allDates) {
                $user = $enrollment->user;
                $student = $user?->student;
                $fullName = $student?->student_name ?? $user?->name ?? 'Student';

                $row = [
                    $fullName,
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
            str_replace(' ', '_', $subjectTeacher->grade_level),
            str_replace(' ', '_', $subjectTeacher->section ?? 'section'),
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
    public function exportPdf(Request $request, SubjectTeacher $subjectTeacher)
    {
        $teacher = $request->user();

        if ($subjectTeacher->teacher_id !== $teacher->id) {
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
        $subjectTeacher->load(['subject', 'enrollments.user.student', 'enrollments.attendanceRecords']);

        $allDates = $subjectTeacher->enrollments
            ->flatMap(fn($e) => $e->attendanceRecords->pluck('date'))
            ->unique()
            ->sort()
            ->values()
            ->map(fn($date) => $date->format('Y-m-d'))
            ->toArray();

        $students = $subjectTeacher->enrollments
            ->map(function ($enrollment) use ($allDates) {
                $user = $enrollment->user;
                $student = $user?->student;
                $fullName = $student?->student_name ?? $user?->name ?? 'Student';

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

        // Prepare view data
        $viewData = [
            'section' => [
                'id' => $subjectTeacher->id,
                'subject_name' => $subjectName,
                'grade_level' => $subjectTeacher->grade_level,
                'section' => $subjectTeacher->section,
                'label' => sprintf('%s - %s (%s)', $subjectTeacher->grade_level, $subjectTeacher->section ?? 'section', $subjectName),
            ],
            'dates' => $allDates,
            'students' => $students,
        ];

        /** @var \Barryvdh\DomPDF\PDF $pdf */
        $pdf = app('dompdf.wrapper')->loadView('pdf.attendance', $viewData);
        $filename = sprintf(
            'attendance_%s_%s_%s.pdf',
            str_replace(' ', '_', $subjectTeacher->grade_level),
            str_replace(' ', '_', $subjectTeacher->section ?? 'section'),
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
            'classId' => ['required', 'integer', 'exists:subject_teachers,id'],
            'date' => ['required', 'date'],
        ]);

        $subjectTeacher = SubjectTeacher::findOrFail($data['classId']);

        $exists = AttendanceRecord::where('date', $data['date'])
            ->whereHas('enrollment', function ($query) use ($subjectTeacher) {
                $query->where('subject_teachers_id', $subjectTeacher->id);
            })->exists();

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
            'classId' => ['required', 'integer', 'exists:subject_teachers,id'],
            'date' => ['required', 'date'],
            'students' => ['required', 'array'],
            'students.*.id' => ['required', 'integer', 'exists:enrollments,id'],
            'students.*.status' => ['required', 'string'],
        ]);

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

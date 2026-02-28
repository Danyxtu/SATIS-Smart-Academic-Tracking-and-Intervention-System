<?php

namespace App\Services\Teacher;

use App\Models\SubjectTeacher;

class AttendanceExportServices
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function exportCSV(SubjectTeacher $subjectTeacher)
    {
        // Load relationships
        $subjectTeacher->load([
            'subject',
            'enrollments.user.student',
            'enrollments.attendanceRecords'
        ]);

        $allDates = $this->getAllDates($subjectTeacher);

        $headers = array_merge(
            ['Name', 'LRN'],
            $allDates,
            ['Present', 'Absent', 'Late', 'Rate (%)']
        );

        $rows = $this->buildRows($subjectTeacher, $allDates);

        $filename = $this->generateFilename($subjectTeacher);

        return $this->streamCsv($headers, $rows, $filename);
    }

    public function exportPDF(SubjectTeacher $subjectTeacher)
    {
        // Try to use Dompdf via barryvdh/laravel-dompdf (use string to avoid static analysis error when package is not installed)
        if (! class_exists('Barryvdh\\DomPDF\\Facade\\Pdf')) {
            // Return a 501 Not Implemented with instructions
            return response()->json([
                'message' => 'PDF export not available. Please install barryvdh/laravel-dompdf via Composer: composer require barryvdh/laravel-dompdf',
            ], 501);
        }

        // Same data preparation as export() function
        $subjectTeacher->load(['subject', 'enrollments.user.student', 'enrollments.attendanceRecords']);
        $allDates = $this->getAllDates($subjectTeacher);

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
     * Private functions
     */
    private function getAllDates(SubjectTeacher $subjectTeacher): array
    {
        return $subjectTeacher->enrollments
            ->flatMap(fn($e) => $e->attendanceRecords->pluck('date'))
            ->unique()
            ->sort()
            ->values()
            ->map(fn($date) => $date->format('Y-m-d'))
            ->toArray();
    }

    private function buildRows(SubjectTeacher $subjectTeacher, array $allDates): array
    {
        return $subjectTeacher->enrollments
            ->map(function ($enrollment) use ($allDates) {

                $user = $enrollment->user;
                $student = $user?->student;
                $fullName = $student?->student_name ?? $user?->name ?? 'Student';

                $row = [
                    $fullName,
                    $student?->lrn ?? '',
                ];

                foreach ($allDates as $date) {
                    $record = $enrollment->attendanceRecords->first(
                        fn($r) => $r->date->format('Y-m-d') === $date
                    );

                    $status = $record?->status ?? '';

                    $row[] = match ($status) {
                        'present' => 'P',
                        'absent' => 'A',
                        'late' => 'L',
                        'excused' => 'E',
                        default => '-',
                    };
                }

                $records = $enrollment->attendanceRecords;
                $totalDays = $records->count();
                $presentDays = $records->where('status', 'present')->count();
                $absentDays = $records->where('status', 'absent')->count();
                $lateDays = $records->where('status', 'late')->count();
                $rate = $totalDays > 0
                    ? round(($presentDays / $totalDays) * 100, 1)
                    : 0;

                $row[] = $presentDays;
                $row[] = $absentDays;
                $row[] = $lateDays;
                $row[] = $rate;

                return $row;
            })
            ->sortBy(fn($row) => $row[0], SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->toArray();
    }

    private function generateFilename(SubjectTeacher $subjectTeacher): string
    {
        return sprintf(
            'attendance_%s_%s_%s.csv',
            str_replace(' ', '_', $subjectTeacher->grade_level),
            str_replace(' ', '_', $subjectTeacher->section ?? 'section'),
            now()->format('Y-m-d')
        );
    }

    private function streamCsv(array $headers, array $rows, string $filename)
    {
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
}

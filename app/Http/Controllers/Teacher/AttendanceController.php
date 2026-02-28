<?php

namespace App\Http\Controllers\Teacher;

use App\Services\Teacher\AttendanceServices;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\SubjectTeacher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\Teacher\AttendanceExportServices;


class AttendanceController extends Controller
{
    protected $attendanceService;
    protected $attendanceExportService;

    public function __construct(AttendanceServices $attendanceService, AttendanceExportServices $attendanceExportService)
    {
        $this->attendanceService = $attendanceService;
        $this->attendanceExportService = $attendanceExportService;
    }

    // Render the attendance taking interface
    public function index(Request $request): Response
    {
        $teacher = $request->user();

        $results = $this->attendanceService->index($teacher);

        $classes = $results['classes'];
        $rosters = $results['rosters'];

        return Inertia::render('Teacher/Attendance', compact(
            'classes',
            'rosters'
        ));
    }

    /**
     * Display the attendance log grouped by sections.
     */
    public function attendanceLogsGroupedBySection(Request $request): Response
    {
        $teacher = $request->user();

        $sections = $this->attendanceService->attendanceLogsGroupedBySection($teacher);

        return Inertia::render('Teacher/AttendanceLog', [
            'sections' => $sections->toArray(),
        ]);
    }

    /**
     * Get detailed attendance data for a specific section.
     */
    public function attendanceLogOfSpecificSection(Request $request, SubjectTeacher $subjectTeacher): Response
    {
        $teacher = $request->user();

        $attendanceData = $this->attendanceService->attendanceLogsOfSpecificSection($teacher, $subjectTeacher);

        /**
         * Attendance Data 
         */

        $section = $attendanceData['section'];
        $dates = $attendanceData['dates'];
        $students = $attendanceData['students'];

        return Inertia::render('Teacher/AttendanceLogDetail', compact(
            'section',
            'dates',
            'students',
        ));
    }

    /**
     * Export attendance data as CSV.
     */
    public function exportCSV(Request $request, SubjectTeacher $subjectTeacher)
    {
        $teacher = $request->user();

        // Authorization stays in controller (or move to Policy)
        if ($subjectTeacher->teacher_id !== $teacher->id) {
            abort(403, 'You are not authorized to export this attendance.');
        }

        return $this->attendanceExportService->exportCSV($subjectTeacher);
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

        return $this->attendanceExportService->exportPDF($subjectTeacher);
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
    public function createAttendance(Request $request)
    {
        $teacher = $request->user();

        $data = $request->validate([
            'classId' => ['required', 'integer', 'exists:subject_teachers,id'],
            'date' => ['required', 'date'],
            'students' => ['required', 'array'],
            'students.*.id' => ['required', 'integer', 'exists:enrollments,id'],
            'students.*.status' => ['required', 'string'],
        ]);

        $result = $this->attendanceService->createAttendance($data, $teacher);

        $resultMessage = $result['message'] ?? 'Attendance saved successfully!';
        return response()->json(['message' => $resultMessage], 200);
    }
}

<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\SystemSetting;
use Inertia\Inertia;
use App\Services\Teacher\DashboardServices;

class DashboardController extends Controller
{
    protected $dashboardServices;

    public function __construct(DashboardServices $dashboardServices)
    {
        $this->dashboardServices = $dashboardServices;
    }
    public function Dashboard()
    {

        $dashboardData = $this->dashboardServices->getDashboardData();
        /**
         * The Dashboard Data
         */

        // School Year and Semester from System Settings
        $academicPeriod = [
            'schoolYear' => $dashboardData['currentSchoolYear'],
            'semester' => $dashboardData['currentSemester'],
        ];

        // Priority Students sorted with critical, warning, and under watchlists
        $priorityStudents = [
            'critical' => $dashboardData['criticalStudents'],
            'warning' => $dashboardData['warningStudents'],
            'watchlist' => $dashboardData['watchlistsStudents'],
        ];

        // Dashboard Stats
        $stats = [
            'studentsAtRisk' => $dashboardData['studentsAtRisk'],
            'needsAttention' => $dashboardData['needsAttention'],
            'recentDeclines' => $dashboardData['recentDeclines'],
            'totalStudents' => $dashboardData['totalStudents'],
            'studentsWithGrades' => $dashboardData['studentsWithGrades'],
        ];

        // Grade Distribution
        $gradeDistribution = $dashboardData['gradeDistribution'];

        // Recent Activity
        $recentActivity = $dashboardData['recentActivity'];

        // Department Data under Logged in teacher
        $department = $dashboardData['department'];

        return Inertia::render('Teacher/Dashboard', compact(
            'stats',
            'priorityStudents',
            'gradeDistribution',
            'recentActivity',
            'academicPeriod',
            'department',
        ));
    }

    /**
     * Export priority students report as PDF.
     */
    public function exportPriorityStudentsPdf(Request $request)
    {
        $teacher = Auth::user();
        $teacher->load('department');

        // Check if dompdf is available
        if (! class_exists('Barryvdh\\DomPDF\\Facade\\Pdf')) {
            return response()->json([
                'message' => 'PDF export not available. Please install barryvdh/laravel-dompdf via Composer: composer require barryvdh/laravel-dompdf',
            ], 501);
        }

        // Get filter options from request
        $includeCritical = $request->boolean('critical', true);
        $includeWarning = $request->boolean('warning', true);
        $includeWatchlist = $request->boolean('watchlist', true);

        // Get current academic period
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();
        $currentSemester = SystemSetting::getCurrentSemester();

        // Get all enrollments for the teacher's subjects
        $enrollments = Enrollment::whereHas('subjectTeacher', function ($query) use ($teacher) {
            $query->where('teacher_id', $teacher->id);
        })->with([
            'user',
            'grades',
            'student',
            'subjectTeacher.subject',
            'attendanceRecords',
            'intervention',
        ])->get();

        $students = $enrollments->map(function ($enrollment) {
            $grades = $enrollment->grades;
            $hasGrades = $grades->isNotEmpty();
            $averageGrade = $hasGrades ? $grades->avg('score') : null;
            $studentProfile = $enrollment->student;

            return [
                'id' => $studentProfile?->id ?? $enrollment->user->id,
                'student_name' => $studentProfile?->student_name ?? $enrollment->user?->name ?? 'Student',
                'name' => $studentProfile?->student_name ?? $enrollment->user?->name ?? 'Student',
                'avatar' => $studentProfile?->avatar,
                'subject' => $enrollment->subjectTeacher?->subject?->name,
                'grade' => $hasGrades ? round($averageGrade) : null,
                'has_grades' => $hasGrades,
                'trend' => $studentProfile?->trend,
                'enrollment_id' => $enrollment->id,
                'intervention' => $enrollment->intervention ? [
                    'id' => $enrollment->intervention->id,
                    'type' => $enrollment->intervention->type,
                    'status' => $enrollment->intervention->status,
                    'notes' => $enrollment->intervention->notes,
                ] : null,
            ];
        });

        // Only consider students WITH grades for risk calculations
        $studentsWithGrades = $students->filter(fn($s) => $s['has_grades'] === true);

        // Priority Students categories
        $criticalStudents = $studentsWithGrades->filter(fn($s) => $s['grade'] < 70)->values()->toArray();
        $warningStudents = $studentsWithGrades->filter(fn($s) => $s['grade'] >= 70 && $s['grade'] < 75)->values()->toArray();
        $watchlistStudents = $studentsWithGrades->filter(fn($s) => $s['grade'] >= 75 && $s['grade'] < 80 && $s['trend'] === 'Declining')->values()->toArray();

        // Prepare view data
        $viewData = [
            'teacher' => [
                'name' => $teacher->name,
            ],
            'department' => $teacher->department ? [
                'id' => $teacher->department->id,
                'name' => $teacher->department->name,
                'code' => $teacher->department->code,
            ] : null,
            'academicPeriod' => [
                'schoolYear' => $currentSchoolYear,
                'semester' => $currentSemester,
            ],
            'criticalStudents' => $criticalStudents,
            'warningStudents' => $warningStudents,
            'watchlistStudents' => $watchlistStudents,
            'includeCritical' => $includeCritical,
            'includeWarning' => $includeWarning,
            'includeWatchlist' => $includeWatchlist,
        ];

        /** @var \Barryvdh\DomPDF\PDF $pdf */
        $pdf = app('dompdf.wrapper')->loadView('pdf.priority_students', $viewData);
        $filename = sprintf(
            'priority_students_report_%s.pdf',
            now()->format('Y-m-d_His')
        );

        return $pdf->download($filename);
    }
}

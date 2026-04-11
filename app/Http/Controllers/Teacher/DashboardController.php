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

        $allSubjects = $dashboardData['allSubjects'];
        $attentionStudents = $dashboardData['attentionStudents'];
        $watchlistRuleConfig = $dashboardData['watchlistRuleConfig'] ?? [];
        $watchlistObservedCategories = $dashboardData['watchlistObservedCategories'] ?? [];

        return Inertia::render('Teacher/Dashboard', compact(
            'stats',
            'priorityStudents',
            'gradeDistribution',
            'recentActivity',
            'academicPeriod',
            'department',
            'allSubjects',
            'attentionStudents',
            'watchlistRuleConfig',
            'watchlistObservedCategories',
        ));
    }

    /**
     * Export priority students report as PDF.
     */
    public function exportPriorityStudentsPdf(Request $request)
    {
        $teacher = Auth::user();
        $teacher->load('department');

        if (! app()->bound('dompdf.wrapper')) {
            return response()->json([
                'message' => 'PDF export not available. Please install barryvdh/laravel-dompdf via Composer: composer require barryvdh/laravel-dompdf',
            ], 501);
        }

        // Get filter options from request (supports legacy params for backward compatibility)
        $includeAtRisk = $request->boolean('at_risk', $request->boolean('critical', true));
        $includeNeedsAttention = $request->boolean('needs_attention', $request->boolean('warning', true));
        $includeRecentDecline = $request->boolean('recent_decline', $request->boolean('watchlist', true));

        // Reuse dashboard service data so export stays aligned with dashboard logic.
        $dashboardData = $this->dashboardServices->getDashboardData();
        $attentionStudents = collect($dashboardData['attentionStudents'] ?? []);

        // Three real categories used in the teacher dashboard.
        $atRiskStudents = $attentionStudents
            ->filter(fn($student) => !empty($student['at_risk']))
            ->values()
            ->toArray();

        $needsAttentionStudents = $attentionStudents
            ->filter(fn($student) => !empty($student['needs_attention']))
            ->values()
            ->toArray();

        $recentDeclineStudents = $attentionStudents
            ->filter(fn($student) => !empty($student['recent_decline']))
            ->values()
            ->toArray();

        // Prepare view data
        $viewData = [
            'teacher' => [
                'name' => $teacher->name,
            ],
            'department' => $teacher->department ? [
                'id' => $teacher->department->id,
                'name' => $teacher->department->department_name,
                'code' => $teacher->department->department_code,
            ] : null,
            'academicPeriod' => [
                'schoolYear' => $dashboardData['currentSchoolYear'] ?? SystemSetting::getCurrentSchoolYear(),
                'semester' => $dashboardData['currentSemester'] ?? SystemSetting::getCurrentSemester(),
            ],
            'atRiskStudents' => $atRiskStudents,
            'needsAttentionStudents' => $needsAttentionStudents,
            'recentDeclineStudents' => $recentDeclineStudents,
            'includeAtRisk' => $includeAtRisk,
            'includeNeedsAttention' => $includeNeedsAttention,
            'includeRecentDecline' => $includeRecentDecline,
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

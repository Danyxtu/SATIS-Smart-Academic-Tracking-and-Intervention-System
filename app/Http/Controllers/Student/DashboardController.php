<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\StudentNotification;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the student dashboard with comprehensive data.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $student = $user->student;

        // Get current and selected semester
        $currentSemester = SystemSetting::getCurrentSemester();
        $selectedSemester = $request->query('semester', $currentSemester);
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        // Get all enrollments for this student with related data
        $allEnrollments = Enrollment::with([
            'subjectTeacher.subject',
            'subjectTeacher.teacher',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
        ])
            ->where('user_id', $user->id)
            ->get();

        // Filter enrollments by semester
        $enrollments = $allEnrollments->filter(function ($enrollment) use ($selectedSemester) {
            $subjectSemester = $enrollment->subjectTeacher?->semester;
            // If subject has semester field, use it; otherwise default to 1
            return $subjectSemester == $selectedSemester;
        });

        // Count enrollments per semester for navigation
        $semester1Count = $allEnrollments->filter(fn($e) => ($e->subjectTeacher?->semester ?? '1') == '1')->count();
        $semester2Count = $allEnrollments->filter(fn($e) => ($e->subjectTeacher?->semester ?? '1') == '2')->count();

        // Calculate overall statistics
        $totalSubjects = $enrollments->count();

        // Calculate overall GPA/Grade
        $subjectGrades = $enrollments->map(function ($enrollment) {
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            return $totalPossible > 0 ? ($totalScore / $totalPossible) * 100 : null;
        })->filter()->values();

        $overallGrade = $subjectGrades->count() > 0
            ? round($subjectGrades->avg(), 1)
            : null;

        // Calculate overall attendance
        $allAttendance = $enrollments->flatMap(fn($e) => $e->attendanceRecords);
        $totalDays = $allAttendance->count();
        $presentDays = $allAttendance->where('status', 'present')->count();
        $overallAttendance = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

        // Count subjects at risk (grade < 75%)
        $subjectsAtRisk = $enrollments->filter(function ($enrollment) {
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            $percentage = $totalPossible > 0 ? ($totalScore / $totalPossible) * 100 : null;
            return $percentage !== null && $percentage < 75;
        })->count();

        // Get active interventions with tasks
        $activeInterventions = $enrollments
            ->filter(fn($e) => $e->intervention && $e->intervention->status === 'active')
            ->map(fn($e) => $e->intervention)
            ->values();

        // Count completed tasks
        $completedTasks = $activeInterventions
            ->flatMap(fn($i) => $i->tasks ?? collect())
            ->where('is_completed', true)
            ->count();

        $totalTasks = $activeInterventions
            ->flatMap(fn($i) => $i->tasks ?? collect())
            ->count();

        // Get unread notifications
        $notifications = StudentNotification::where('user_id', $user->id)
            ->with('sender')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'message' => $n->message,
                'sender' => $n->sender?->name ?? 'System',
                'isRead' => $n->is_read,
                'createdAt' => $n->created_at->diffForHumans(),
                'createdAtFull' => $n->created_at->format('M d, Y h:i A'),
            ]);

        $unreadCount = StudentNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        // Build subject performance data
        $subjectPerformance = $enrollments->map(function ($enrollment) {
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            $percentage = $totalPossible > 0 ? round(($totalScore / $totalPossible) * 100) : null;

            $attendance = $enrollment->attendanceRecords;
            $totalDays = $attendance->count();
            $presentDays = $attendance->where('status', 'present')->count();
            $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

            // Determine status
            $status = 'good';
            if ($percentage !== null && $percentage < 70) {
                $status = 'critical';
            } elseif ($percentage !== null && $percentage < 75) {
                $status = 'warning';
            }

            return [
                'id' => $enrollment->id,
                'subjectId' => $enrollment->subjectTeacher?->subject_id,
                'name' => $enrollment->subject?->subject_name ?? 'Unknown Subject',
                'section' => $enrollment->subject?->section,
                'teacher' => $enrollment->subjectTeacher?->teacher
                    ? $enrollment->subjectTeacher->teacher->first_name . ' ' . $enrollment->subjectTeacher->teacher->last_name
                    : 'N/A',
                'grade' => $percentage,
                'gradeDisplay' => $percentage !== null ? "{$percentage}%" : 'N/A',
                'attendance' => $attendanceRate,
                'status' => $status,
                'hasIntervention' => $enrollment->intervention !== null,
                'interventionType' => $enrollment->intervention?->type,
            ];
        })->sortBy('grade')->values();

        // Build upcoming tasks from interventions
        $upcomingTasks = $activeInterventions
            ->flatMap(function ($intervention) use ($enrollments) {
                $enrollment = $enrollments->firstWhere('id', $intervention->enrollment_id);
                return ($intervention->tasks ?? collect())->map(fn($task) => [
                    'id' => $task->id,
                    'description' => $task->description,
                    'isCompleted' => $task->is_completed,
                    'subject' => $enrollment?->subject?->name ?? 'Unknown',
                    'interventionId' => $intervention->id,
                ]);
            })
            ->where('isCompleted', false)
            ->take(5)
            ->values();

        // Build grade trend (last 4 weeks simulation based on recent grades)
        $recentGrades = $enrollments
            ->flatMap(fn($e) => $e->grades)
            ->sortByDesc('created_at')
            ->take(20)
            ->groupBy(fn($g) => $g->created_at->format('W'))
            ->take(4)
            ->map(function ($weekGrades) {
                $total = $weekGrades->sum('score');
                $possible = $weekGrades->sum('total_score');
                return $possible > 0 ? round(($total / $possible) * 100) : null;
            })
            ->filter()
            ->reverse()
            ->values()
            ->toArray();

        return Inertia::render('Student/Dashboard', [
            'student' => [
                'id' => $student?->id,
                'firstName' => $user->name ? explode(' ', $user->name)[0] : 'Student',
                'lastName' => $user->name ? (explode(' ', $user->name)[1] ?? '') : '',
                'fullName' => $user->name,
                'email' => $user->email,
                'gradeLevel' => $student?->grade_level,
                'section' => $student?->section,
                'lrn' => $student?->lrn,
            ],
            'stats' => [
                'overallGrade' => $overallGrade,
                'overallAttendance' => $overallAttendance,
                'totalSubjects' => $totalSubjects,
                'subjectsAtRisk' => $subjectsAtRisk,
                'completedTasks' => $completedTasks,
                'totalTasks' => $totalTasks,
                'activeInterventions' => $activeInterventions->count(),
            ],
            'subjectPerformance' => $subjectPerformance,
            'notifications' => $notifications,
            'unreadNotificationCount' => $unreadCount,
            'upcomingTasks' => $upcomingTasks,
            'gradeTrend' => $recentGrades,
            'semesters' => [
                'current' => (int) $currentSemester,
                'selected' => (int) $selectedSemester,
                'schoolYear' => $currentSchoolYear,
                'semester1Count' => $semester1Count,
                'semester2Count' => $semester2Count,
            ],
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markNotificationRead(Request $request, $notificationId)
    {
        $notification = StudentNotification::where('id', $notificationId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->markAsRead();

        return back()->with('success', 'Notification marked as read.');
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllNotificationsRead(Request $request)
    {
        StudentNotification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return back()->with('success', 'All notifications marked as read.');
    }
}

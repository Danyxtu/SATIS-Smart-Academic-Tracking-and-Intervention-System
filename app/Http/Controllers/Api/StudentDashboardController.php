<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\StudentNotification;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    /**
     * Return JSON dashboard data for the authenticated student.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        $enrollments = Enrollment::with([
            'subject',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
        ])
            ->where('user_id', $user->id)
            ->get();

        $totalSubjects = $enrollments->count();

        $subjectGrades = $enrollments->map(function ($enrollment) {
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            return $totalPossible > 0 ? ($totalScore / $totalPossible) * 100 : null;
        })->filter()->values();

        $overallGrade = $subjectGrades->count() > 0
            ? round($subjectGrades->avg(), 1)
            : null;

        $allAttendance = $enrollments->flatMap(fn($e) => $e->attendanceRecords);
        $totalDays = $allAttendance->count();
        $presentDays = $allAttendance->where('status', 'present')->count();
        $overallAttendance = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

        $subjectsAtRisk = $enrollments->filter(function ($enrollment) {
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            $percentage = $totalPossible > 0 ? ($totalScore / $totalPossible) * 100 : null;
            return $percentage !== null && $percentage < 75;
        })->count();

        $activeInterventions = $enrollments
            ->filter(fn($e) => $e->intervention && $e->intervention->status === 'active')
            ->map(fn($e) => $e->intervention)
            ->values();

        $completedTasks = $activeInterventions
            ->flatMap(fn($i) => $i->tasks ?? collect())
            ->where('is_completed', true)
            ->count();

        $totalTasks = $activeInterventions
            ->flatMap(fn($i) => $i->tasks ?? collect())
            ->count();

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

        $subjectPerformance = $enrollments->map(function ($enrollment) {
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            $percentage = $totalPossible > 0 ? round(($totalScore / $totalPossible) * 100) : null;

            $attendance = $enrollment->attendanceRecords;
            $totalDays = $attendance->count();
            $presentDays = $attendance->where('status', 'present')->count();
            $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

            $status = 'good';
            if ($percentage !== null && $percentage < 70) {
                $status = 'critical';
            } elseif ($percentage !== null && $percentage < 75) {
                $status = 'warning';
            }

            return [
                'id' => $enrollment->id,
                'subjectId' => $enrollment->subject_id,
                'name' => $enrollment->subject?->name ?? 'Unknown Subject',
                'section' => $enrollment->subject?->section,
                'teacher' => $enrollment->subject?->user?->name ?? 'N/A',
                'grade' => $percentage,
                'gradeDisplay' => $percentage !== null ? "{$percentage}%" : 'N/A',
                'attendance' => $attendanceRate,
                'status' => $status,
                'hasIntervention' => $enrollment->intervention !== null,
                'interventionType' => $enrollment->intervention?->type,
            ];
        })->sortBy('grade')->values();

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

        return response()->json([
            'student' => [
                'id' => $student?->id,
                'firstName' => $student?->first_name ?? (explode(' ', $user->name)[0] ?? 'Student'),
                'lastName' => $student?->last_name ?? (explode(' ', $user->name)[1] ?? ''),
                'fullName' => $user->name,
                'email' => $user->email,
                'gradeLevel' => $student?->grade_level,
                'section' => $student?->section,
                'strand' => $student?->strand,
                'track' => $student?->track,
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
        ]);
    }
}

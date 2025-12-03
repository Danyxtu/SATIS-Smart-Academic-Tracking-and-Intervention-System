<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\StudentNotification;
use Illuminate\Http\Request;

class StudentInterventionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $enrollments = Enrollment::with([
            'subject.user',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
        ])
            ->where('user_id', $user->id)
            ->get();

        $interventions = $enrollments
            ->filter(fn($e) => $e->intervention !== null)
            ->map(function ($enrollment) {
                $intervention = $enrollment->intervention;
                $subject = $enrollment->subject;
                $teacher = $subject?->user;

                $grades = $enrollment->grades;
                $totalScore = $grades->sum('score');
                $totalPossible = $grades->sum('total_score');
                $currentGrade = $totalPossible > 0
                    ? round(($totalScore / $totalPossible) * 100)
                    : null;

                $attendance = $enrollment->attendanceRecords;
                $totalDays = $attendance->count();
                $presentDays = $attendance->where('status', 'present')->count();
                $attendanceRate = $totalDays > 0
                    ? round(($presentDays / $totalDays) * 100)
                    : 100;

                $missingWork = $grades->where('score', 0)->count();

                $priority = 'Low';
                if ($currentGrade !== null) {
                    if ($currentGrade < 70) $priority = 'High';
                    elseif ($currentGrade < 75) $priority = 'Medium';
                }

                $tasks = ($intervention->tasks ?? collect())->map(fn($task) => [
                    'id' => $task->id,
                    'text' => $task->description,
                    'completed' => $task->is_completed,
                ]);

                $completedTasks = $tasks->where('completed', true)->count();
                $totalTasks = $tasks->count();

                return [
                    'id' => $intervention->id,
                    'enrollmentId' => $enrollment->id,
                    'subjectName' => $subject?->name ?? 'Unknown Subject',
                    'subjectSection' => $subject?->section,
                    'teacherName' => $teacher?->name ?? 'N/A',
                    'type' => $intervention->type,
                    'typeLabel' => Intervention::getTypes()[$intervention->type] ?? $intervention->type,
                    'status' => $intervention->status,
                    'notes' => $intervention->notes,
                    'priority' => $priority,
                    'currentGrade' => $currentGrade,
                    'attendanceRate' => $attendanceRate,
                    'missingWork' => $missingWork,
                    'tasks' => $tasks->values(),
                    'completedTasks' => $completedTasks,
                    'totalTasks' => $totalTasks,
                    'startDate' => $intervention->created_at->diffForHumans(),
                    'startDateFull' => $intervention->created_at->format('M d, Y'),
                    'createdAt' => $intervention->created_at,
                ];
            })
            ->sortByDesc('createdAt')
            ->values();

        $activeInterventions = $interventions->where('status', 'active')->count();
        $completedInterventions = $interventions->where('status', 'completed')->count();
        $totalInterventions = $interventions->count();

        $allCompletedTasks = $interventions->sum('completedTasks');
        $allTotalTasks = $interventions->sum('totalTasks');
        $taskSuccessRate = $allTotalTasks > 0
            ? round(($allCompletedTasks / $allTotalTasks) * 100)
            : 0;

        $recentFeedback = StudentNotification::where('user_id', $user->id)
            ->with(['sender', 'intervention.enrollment.subject'])
            ->whereIn('type', ['feedback', 'nudge', 'task', 'alert'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($notification) => [
                'id' => $notification->id,
                'type' => $notification->type,
                'typeLabel' => StudentNotification::getTypes()[$notification->type] ?? $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'senderName' => $notification->sender?->name ?? 'System',
                'subjectName' => $notification->intervention?->enrollment?->subject?->name ?? null,
                'isRead' => $notification->is_read,
                'time' => $notification->created_at->diffForHumans(),
                'timeFull' => $notification->created_at->format('M d, Y h:i A'),
            ]);

        $unreadFeedbackCount = StudentNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'interventions' => $interventions,
            'stats' => [
                'activeInterventions' => $activeInterventions,
                'completedInterventions' => $completedInterventions,
                'totalFeedback' => $recentFeedback->count(),
                'taskSuccessRate' => $taskSuccessRate,
                'unreadCount' => $unreadFeedbackCount,
            ],
            'recentFeedback' => $recentFeedback,
        ]);
    }
}

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
            'subjectTeacher.subject',
            'subjectTeacher.teacher',
            'schoolClass.subject',
            'schoolClass.teacher',
            'subject',
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
                $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
                $subject = $class?->subject ?? $enrollment->subject;
                $teacher = $class?->teacher;

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
                    'text' => $task->task_name ?: $task->description,
                    'description' => $task->description,
                    'delivery_mode' => $task->delivery_mode,
                    'completed' => $task->is_completed,
                ]);

                $completedTasks = $tasks->where('completed', true)->count();
                $totalTasks = $tasks->count();

                return [
                    'id' => $intervention->id,
                    'enrollmentId' => $enrollment->id,
                    'subjectName' => $subject?->subject_name ?? 'Unknown Subject',
                    'subjectSection' => $class?->section ?? $subject?->section,
                    'teacherName' => $teacher?->name ?? 'N/A',
                    'type' => $intervention->type,
                    'typeLabel' => Intervention::getTypes()[$intervention->type] ?? $intervention->type,
                    'status' => $intervention->status,
                    'isTier3' => $intervention->isTier3(),
                    'canRequestCompletion' => $intervention->canRequestCompletion(),
                    'hasCompletionRequest' => $intervention->hasCompletionRequest(),
                    'isPendingApproval' => $intervention->isPendingApproval(),
                    'isPendingCompletionApproval' => $intervention->isPendingApproval(),
                    'completionRequestedAt' => $intervention->completion_requested_at?->toIso8601String(),
                    'completionRequestedAtLabel' => $intervention->completion_requested_at?->format('M d, Y h:i A'),
                    'completionRequestNotes' => $intervention->completion_request_notes,
                    'approvedAt' => $intervention->approved_at?->format('M d, Y'),
                    'rejectedAt' => $intervention->rejected_at?->format('M d, Y'),
                    'rejectionReason' => $intervention->rejection_reason,
                    'notes' => $intervention->notes,
                    'deadlineAt' => $intervention->deadline_at?->toIso8601String(),
                    'deadlineLabel' => $intervention->deadline_at?->format('M d, Y h:i A'),
                    'isDeadlineOverdue' => $intervention->status === 'active' && $intervention->deadline_at
                        ? now()->gt($intervention->deadline_at)
                        : false,
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
            ->with([
                'sender',
                'intervention.enrollment.subjectTeacher.subject',
                'intervention.enrollment.schoolClass.subject',
                'intervention.enrollment.subject',
            ])
            ->whereIn('type', ['feedback', 'nudge', 'task', 'alert', 'extension'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($notification) {
                $feedbackEnrollment = $notification->intervention?->enrollment;
                $feedbackClass = $feedbackEnrollment?->subjectTeacher ?? $feedbackEnrollment?->schoolClass;
                $feedbackSubject = $feedbackClass?->subject ?? $feedbackEnrollment?->subject;

                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'typeLabel' => StudentNotification::getTypes()[$notification->type] ?? $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'senderName' => $notification->sender?->name ?? 'System',
                    'subjectName' => $feedbackSubject?->subject_name,
                    'deadlineLabel' => $notification->intervention?->deadline_at?->format('M d, Y h:i A'),
                    'isRead' => $notification->is_read,
                    'time' => $notification->created_at->diffForHumans(),
                    'timeFull' => $notification->created_at->format('M d, Y h:i A'),
                ];
            });

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

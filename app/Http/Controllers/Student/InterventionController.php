<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\InterventionTask;
use App\Models\StudentNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InterventionController extends Controller
{
    /**
     * Display the student's interventions and feedback.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get all enrollments for this student with interventions
        $enrollments = Enrollment::with([
            'subject.user', // Teacher
            'grades',
            'attendanceRecords',
            'intervention.tasks',
        ])
            ->where('user_id', $user->id)
            ->get();

        // Get interventions with full details
        $interventions = $enrollments
            ->filter(fn($e) => $e->intervention !== null)
            ->map(function ($enrollment) {
                $intervention = $enrollment->intervention;
                $subject = $enrollment->subject;
                $teacher = $subject?->user;

                // Calculate current grade
                $grades = $enrollment->grades;
                $totalScore = $grades->sum('score');
                $totalPossible = $grades->sum('total_score');
                $currentGrade = $totalPossible > 0
                    ? round(($totalScore / $totalPossible) * 100)
                    : null;

                // Calculate attendance
                $attendance = $enrollment->attendanceRecords;
                $totalDays = $attendance->count();
                $presentDays = $attendance->where('status', 'present')->count();
                $attendanceRate = $totalDays > 0
                    ? round(($presentDays / $totalDays) * 100)
                    : 100;

                // Count missing work (grades with 0 score)
                $missingWork = $grades->where('score', 0)->count();

                // Determine priority based on grade
                $priority = 'Low';
                if ($currentGrade !== null) {
                    if ($currentGrade < 70) {
                        $priority = 'High';
                    } elseif ($currentGrade < 75) {
                        $priority = 'Medium';
                    }
                }

                // Get tasks
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
                    // Tier 3 completion request fields
                    'isTier3' => $intervention->isTier3(),
                    'canRequestCompletion' => $intervention->canRequestCompletion(),
                    'completionRequestedAt' => $intervention->completion_requested_at?->format('M d, Y'),
                    'completionRequestNotes' => $intervention->completion_request_notes,
                    'isPendingApproval' => $intervention->isPendingApproval(),
                    'approvedAt' => $intervention->approved_at?->format('M d, Y'),
                    'rejectedAt' => $intervention->rejected_at?->format('M d, Y'),
                    'rejectionReason' => $intervention->rejection_reason,
                ];
            })
            ->sortByDesc('createdAt')
            ->values();

        // Calculate summary stats
        $activeInterventions = $interventions->where('status', 'active')->count();
        $completedInterventions = $interventions->where('status', 'completed')->count();
        $totalInterventions = $interventions->count();

        // Calculate overall task progress
        $allCompletedTasks = $interventions->sum('completedTasks');
        $allTotalTasks = $interventions->sum('totalTasks');
        $taskSuccessRate = $allTotalTasks > 0
            ? round(($allCompletedTasks / $allTotalTasks) * 100)
            : 0;

        // Get recent feedback/notifications from teachers
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

        return Inertia::render('Student/InterventionFeedback', [
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

    /**
     * Mark a task as completed.
     */
    public function completeTask(Request $request, InterventionTask $task)
    {
        // Verify the task belongs to this student's intervention
        $intervention = $task->intervention;
        $enrollment = $intervention->enrollment;

        if ($enrollment->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $task->update(['is_completed' => true]);

        // Check if all tasks are completed
        $allCompleted = $intervention->tasks()->where('is_completed', false)->count() === 0;

        if ($allCompleted && $intervention->tasks()->count() > 0) {
            $intervention->update(['status' => 'completed']);
        }

        return back()->with('success', 'Task marked as completed!');
    }

    /**
     * Mark a notification/feedback as read.
     */
    public function markFeedbackRead(Request $request, StudentNotification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $notification->markAsRead();

        return back()->with('success', 'Marked as read.');
    }

    /**
     * Request completion of a Tier 3 intervention.
     */
    public function requestCompletion(Request $request, Intervention $intervention)
    {
        // Verify the intervention belongs to this student
        $enrollment = $intervention->enrollment;

        if ($enrollment->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        // Check if completion can be requested
        if (!$intervention->canRequestCompletion()) {
            return back()->with('error', 'Cannot request completion for this intervention.');
        }

        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $intervention->update([
            'completion_requested_at' => now(),
            'completion_request_notes' => $request->input('notes'),
            // Reset any previous rejection
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);

        // Create notification for the teacher
        $teacher = $enrollment->subject?->user;
        if ($teacher) {
            StudentNotification::create([
                'user_id' => $teacher->id,
                'sender_id' => $request->user()->id,
                'intervention_id' => $intervention->id,
                'type' => 'alert',
                'title' => 'Completion Request',
                'message' => $request->user()->name . ' has requested to mark their intervention as complete.',
            ]);
        }

        return back()->with('success', 'Completion request submitted! Your teacher will review it.');
    }
}

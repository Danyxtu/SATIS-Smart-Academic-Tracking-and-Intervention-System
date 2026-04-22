<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\StudentNotification;
use App\Models\InterventionTask;
use Illuminate\Http\Request;

class StudentActionsController extends Controller
{
    public function markNotificationRead(Request $request, $notificationId)
    {
        $notification = StudentNotification::where('id', $notificationId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    public function markAllNotificationsRead(Request $request)
    {
        StudentNotification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function completeInterventionTask(Request $request, $taskId)
    {
        $schoolYear = Intervention::resolveCurrentSchoolYear();

        $task = InterventionTask::query()
            ->whereHas('intervention.enrollment', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->whereHas('intervention', function ($query) use ($schoolYear) {
                $query->forSchoolYear($schoolYear);
            })
            ->with('intervention.tasks')
            ->findOrFail($taskId);

        $intervention = $task->intervention;

        if ($task->is_completed) {
            return response()->json(['success' => false, 'message' => 'Task is already completed.'], 422);
        }

        if ($task->delivery_mode === 'remote') {
            if ($task->submitted_at !== null) {
                return response()->json(['success' => false, 'message' => 'Proof has already been submitted.'], 422);
            }

            $request->validate([
                'proof' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'notes' => 'nullable|string|max:500',
            ]);

            if ($request->hasFile('proof')) {
                $path = $request->file('proof')->store('interventions/proofs', 'local');

                $task->update([
                    'proof_path' => $path,
                    'proof_notes' => $request->input('notes'),
                    'submitted_at' => now(),
                ]);

                // Create notification for the teacher
                $enrollment = $intervention->enrollment;
                $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
                $teacher = $class?->teacher;
                if ($teacher) {
                    StudentNotification::create([
                        'user_id' => $teacher->id,
                        'sender_id' => $request->user()->id,
                        'intervention_id' => $intervention->id,
                        'type' => 'alert',
                        'title' => 'Proof Submitted',
                        'message' => $request->user()->name . " has submitted proof for the task: \"{$task->task_name}\".",
                    ]);
                }

                return response()->json(['success' => true, 'message' => 'Proof submitted successfully!']);
            }
        }

        $task->update([
            'is_completed' => true,
            'completed_at' => now(),
        ]);

        // If all tasks completed, mark intervention completed
        $remaining = $intervention->tasks()->where('is_completed', false)->count();
        if ($remaining === 0 && $intervention->tasks()->count() > 0) {
            $intervention->update(['status' => 'completed']);
        }

        return response()->json(['success' => true, 'message' => 'Task marked as completed!']);
    }

    public function markFeedbackRead(Request $request, $notificationId)
    {
        $notification = StudentNotification::where('id', $notificationId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    public function requestInterventionCompletion(Request $request, $interventionId)
    {
        $schoolYear = Intervention::resolveCurrentSchoolYear();

        $intervention = Intervention::query()
            ->forSchoolYear($schoolYear)
            ->whereHas('enrollment', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->with('enrollment.subjectTeacher.teacher')
            ->findOrFail($interventionId);

        if (! $intervention->canRequestCompletion()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot request completion for this intervention.',
            ], 422);
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $intervention->update([
            'completion_requested_at' => now(),
            'completion_request_notes' => $validated['notes'] ?? null,
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);

        $enrollment = $intervention->enrollment;
        $class = $enrollment?->subjectTeacher ?? $enrollment?->schoolClass;
        $teacher = $class?->teacher;

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

        return response()->json([
            'success' => true,
            'message' => 'Completion request submitted! Your teacher will review it.',
        ]);
    }
}

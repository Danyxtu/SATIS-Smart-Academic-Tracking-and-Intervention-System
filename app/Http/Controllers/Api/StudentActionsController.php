<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        $task = InterventionTask::findOrFail($taskId);

        // Ensure the task belongs to an intervention for this student
        $intervention = $task->intervention;
        $enrollment = $intervention->enrollment;

        if ($enrollment->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $task->update(['is_completed' => true]);

        // If all tasks completed, mark intervention completed
        $remaining = $intervention->tasks()->where('is_completed', false)->count();
        if ($remaining === 0 && $intervention->tasks()->count() > 0) {
            $intervention->update(['status' => 'completed']);
        }

        return response()->json(['success' => true]);
    }

    public function markFeedbackRead(Request $request, $notificationId)
    {
        $notification = StudentNotification::where('id', $notificationId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }
}

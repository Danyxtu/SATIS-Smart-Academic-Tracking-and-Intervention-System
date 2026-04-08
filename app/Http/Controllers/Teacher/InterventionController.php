<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Mail\InterventionNotification;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\InterventionTask;
use App\Models\StudentNotification;
use App\Services\WatchlistRuleService;
use App\Support\StudentNameFormatter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InterventionController extends Controller
{
    protected WatchlistRuleService $watchlistRuleService;

    public function __construct(WatchlistRuleService $watchlistRuleService)
    {
        $this->watchlistRuleService = $watchlistRuleService;
    }

    /**
     * Display the intervention dashboard with students needing intervention.
     */
    public function index(Request $request): Response
    {
        $teacher = $request->user();

        // Get enrollments with students who might need intervention
        // Include their grades, attendance, and any existing interventions
        $enrollments = Enrollment::with([
            'user.student',
            'schoolClass.subject',
            'subjectTeacher.subject',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
        ])
            ->where(function ($query) use ($teacher) {
                $query
                    ->whereHas('schoolClass', function ($classQuery) use ($teacher) {
                        $classQuery->where('teacher_id', $teacher->id);
                    })
                    ->orWhereHas('subjectTeacher', function ($legacyQuery) use ($teacher) {
                        $legacyQuery->where('teacher_id', $teacher->id);
                    });
            })
            ->get();

        // Build the student watchlist based on risk factors
        $watchlist = $enrollments->map(function ($enrollment) {
            $user = $enrollment->user;
            $student = $user?->student;
            $displayName = StudentNameFormatter::format($user, $student);
            $sortKey = StudentNameFormatter::sortKey($user, $student);
            $classAssignment = $enrollment->schoolClass ?? $enrollment->subjectTeacher;
            $subject = $classAssignment?->subject;
            $subjectName = $subject?->subject_name ?? 'N/A';
            $classSection = $classAssignment?->section;

            $risk = $this->watchlistRuleService->evaluateEnrollment($enrollment);
            $metrics = $risk['metrics'] ?? [];

            // Calculate current grade percentage
            $gradePercentage = data_get($metrics, 'current_grade');

            // Calculate attendance rate
            $attendanceRecords = $enrollment->attendanceRecords;
            $totalDays = $attendanceRecords->count();
            $presentDays = $attendanceRecords->where('status', 'present')->count();
            $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

            $failingActivities = (int) data_get($metrics, 'failing_activities_total', 0);
            $alertReasons = $risk['reasons'] ?? [];

            // Get existing intervention info
            $intervention = $enrollment->intervention;
            $lastInterventionDate = $intervention?->updated_at?->format('Y-m-d');

            // Get prediction data
            $prediction = [
                'predicted_grade' => data_get($metrics, 'predicted_grade'),
                'trend' => data_get($metrics, 'trend', 'Stable'),
                'trend_direction' => (int) data_get($metrics, 'trend_direction', 0),
            ];

            return [
                'id' => $enrollment->id,
                'student_id' => $student?->id,
                'user_id' => $user?->id,
                'name' => $displayName,
                'sort_key' => $sortKey,
                'lrn' => $student?->lrn,
                'email' => $user?->email,
                'avatar' => $student?->avatar,
                'subject' => trim($subjectName . ' - ' . ($classSection ?? 'N/A')),
                'subject_id' => $classAssignment?->subject_id,
                'grade_level' => $student?->grade_level ?? $classAssignment?->grade_level,
                'section' => $student?->section ?? $classSection,
                'currentGrade' => $gradePercentage !== null ? "{$gradePercentage}%" : 'N/A',
                'gradeNumeric' => $gradePercentage,
                'attendanceRate' => $attendanceRate,
                'attendanceSummary' => $this->buildAttendanceSummary($enrollment->attendanceRecords),
                'missingAssignmentCount' => $failingActivities,
                'failingActivityCount' => $failingActivities,
                // New risk category format
                'riskCategory' => $risk['risk_key'] ?? 'on_track',
                'riskLabel' => $risk['risk_label'] ?? 'On Track',
                'riskColor' => $risk['risk_color'] ?? 'green',
                // Keep legacy priority for backwards compatibility
                'priority' => $risk['priority'] ?? 'Low',
                'watchLevel' => $risk['watch_level'] ?? 'none',
                'alertReason' => !empty($alertReasons) ? implode(' ', $alertReasons) : 'Under Observation',
                'lastInterventionDate' => $lastInterventionDate ?? 'Never',
                'hasActiveIntervention' => $intervention && $intervention->status === 'active',
                // Prediction data
                'predictedGrade' => $prediction['predicted_grade'],
                'gradeTrend' => $prediction['trend'],
                'trendDirection' => $prediction['trend_direction'],
                'intervention' => $intervention ? $this->serializeIntervention($intervention) : null,
                // Flag for pending completion requests (for easy filtering)
                'hasPendingCompletionRequest' => $intervention?->isPendingApproval() ?? false,
            ];
        })
            // Only include students who are NOT on_track or have active intervention
            ->filter(fn($s) => $s['riskCategory'] !== 'on_track' || $s['hasActiveIntervention'])
            ->sortBy('sort_key', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        // Build detailed student data for the profile view
        $studentDetails = $enrollments->mapWithKeys(function ($enrollment) {
            $user = $enrollment->user;
            $student = $user?->student;
            $displayName = StudentNameFormatter::format($user, $student);
            $grades = $enrollment->grades;

            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            $gradePercentage = $totalPossible > 0 ? round(($totalScore / $totalPossible) * 100) : null;

            // Build grade trend (last 4 grade entries)
            $gradeTrend = $grades->sortBy('created_at')
                ->take(-4)
                ->map(fn($g) => $g->total_score > 0 ? round(($g->score / $g->total_score) * 100) : 0)
                ->values()
                ->toArray();

            // Get missing assignments
            $missingAssignments = $grades->filter(fn($g) => $g->score === null || $g->score == 0)
                ->map(fn($g) => [
                    'id' => $g->id,
                    'title' => $g->assignment_name ?? 'Unnamed Assignment',
                ])->values()->toArray();

            // Get intervention log
            $intervention = $enrollment->intervention;
            $interventionLog = [];
            if ($intervention) {
                $interventionLog[] = [
                    'id' => $intervention->id,
                    'date' => $intervention->created_at?->format('Y-m-d'),
                    'action' => Intervention::getTypes()[$intervention->type] ?? $intervention->type,
                    'notes' => $intervention->notes,
                    'followUp' => null,
                ];
            }

            // Use shared global watchlist rules for profile priority as well.
            $risk = $this->watchlistRuleService->evaluateEnrollment($enrollment);
            $priority = $risk['priority'] ?? 'Low';

            // Build pending completion request data
            $pendingCompletionRequest = null;
            if ($intervention && $intervention->isPendingApproval()) {
                $pendingCompletionRequest = [
                    'interventionId' => $intervention->id,
                    'type' => $intervention->type,
                    'typeLabel' => Intervention::getTypes()[$intervention->type] ?? $intervention->type,
                    'requestedAt' => $intervention->completion_requested_at?->format('M d, Y'),
                    'requestNotes' => $intervention->completion_request_notes,
                ];
            }

            return [
                $enrollment->id => [
                    'id' => $enrollment->id,
                    'name' => $displayName,
                    'currentGrade' => $gradePercentage !== null ? "{$gradePercentage}%" : 'N/A',
                    'gradeTrend' => $gradeTrend,
                    'specialPrograms' => [],
                    'parentContact' => $user?->email ?? 'N/A',
                    'counselor' => 'Guidance Office',
                    'attendanceSummary' => $this->buildAttendanceSummary($enrollment->attendanceRecords),
                    'missingAssignments' => $missingAssignments,
                    'behaviorLog' => [],
                    'interventionLog' => $interventionLog,
                    'priority' => $priority,
                    'pendingCompletionRequest' => $pendingCompletionRequest,
                    'activeIntervention' => $intervention ? $this->serializeIntervention($intervention) : null,
                ],
            ];
        })->toArray();

        return Inertia::render('Teacher/Interventions', [
            'watchlist' => $watchlist->toArray(),
            'studentDetails' => $studentDetails,
        ]);
    }

    /**
     * Build attendance summary string.
     */
    private function buildAttendanceSummary($attendanceRecords): string
    {
        $absences = $attendanceRecords->where('status', 'absent')->count();
        $tardies = $attendanceRecords->where('status', 'late')->count();

        return "{$absences} Absences, {$tardies} Tardy";
    }

    /**
     * Store a new intervention.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
            'type' => 'required|string',
            'notes' => 'nullable|string',
            'deadline_at' => 'nullable|date|after:now',
            'tasks' => 'nullable|array',
            'send_email' => 'nullable|boolean',
        ]);

        $deadlineAt = $this->normalizeDeadlineForType(
            $validated['type'],
            $validated['deadline_at'] ?? null,
        );

        $enrollment = Enrollment::with(['schoolClass.subject', 'subjectTeacher.subject', 'user'])->findOrFail($validated['enrollment_id']);

        if (! $this->enrollmentOwnedByTeacher($enrollment, (int) $request->user()->id)) {
            abort(403, 'You are not authorized to start an intervention for this student.');
        }

        $intervention = Intervention::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'status' => 'active',
            ],
            [
                'type' => $validated['type'],
                'notes' => $validated['notes'] ?? '',
                'deadline_at' => $deadlineAt,
            ]
        );

        $sendEmail = $validated['send_email'] ?? true;

        // Handle different intervention types
        $this->processIntervention($enrollment, $intervention, $validated, $request->user(), $sendEmail);

        $successMessage = sprintf(
            'Intervention for %s is now active.',
            optional($enrollment->user)->name ?? 'the student'
        );

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $successMessage,
                'intervention' => [
                    'id' => $intervention->id,
                    'type' => $intervention->type,
                    'status' => $intervention->status,
                ],
            ]);
        }

        return Redirect::back()->with('success', $successMessage);
    }

    /**
     * Store interventions for multiple students at once.
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'enrollment_ids' => 'required|array|min:1',
            'enrollment_ids.*' => 'exists:enrollments,id',
            'type' => 'required|string',
            'notes' => 'nullable|string',
            'deadline_at' => 'nullable|date|after:now',
            'tasks' => 'nullable|array',
            'send_email' => 'nullable|boolean',
        ]);

        $deadlineAt = $this->normalizeDeadlineForType(
            $validated['type'],
            $validated['deadline_at'] ?? null,
        );

        $teacher = $request->user();
        $sendEmail = $validated['send_email'] ?? true;
        $successCount = 0;
        $failedCount = 0;

        foreach ($validated['enrollment_ids'] as $enrollmentId) {
            $enrollment = Enrollment::with(['schoolClass.subject', 'subjectTeacher.subject', 'user'])->find($enrollmentId);

            // Skip if enrollment not found or teacher doesn't own the subject
            if (!$enrollment || ! $this->enrollmentOwnedByTeacher($enrollment, (int) $teacher->id)) {
                $failedCount++;
                continue;
            }

            $intervention = Intervention::updateOrCreate(
                [
                    'enrollment_id' => $enrollment->id,
                    'status' => 'active',
                ],
                [
                    'type' => $validated['type'],
                    'notes' => $validated['notes'] ?? '',
                    'deadline_at' => $deadlineAt,
                ]
            );

            $this->processIntervention($enrollment, $intervention, $validated, $teacher, $sendEmail);
            $successCount++;
        }

        $message = "Bulk intervention completed: {$successCount} student(s) processed.";
        if ($failedCount > 0) {
            $message .= " {$failedCount} failed.";
        }

        return Redirect::back()->with('success', $message);
    }

    /**
     * Update an intervention record from the teacher management modal.
     */
    public function update(Request $request, Intervention $intervention)
    {
        $teacher = $request->user();
        $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);

        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(array_keys(Intervention::getTypes()))],
            'notes' => 'nullable|string|max:5000',
            'deadline_at' => 'nullable|date|after:now',
        ]);

        $deadlineValue = array_key_exists('deadline_at', $validated)
            ? $validated['deadline_at']
            : $intervention->deadline_at?->toDateTimeString();

        $intervention->update([
            'type' => $validated['type'],
            'notes' => $validated['notes'] ?? '',
            'deadline_at' => $this->normalizeDeadlineForType($validated['type'], $deadlineValue),
        ]);

        return Redirect::back()->with('success', 'Intervention updated successfully.');
    }

    /**
     * Delete an intervention and all related tasks.
     */
    public function destroy(Request $request, Intervention $intervention)
    {
        $teacher = $request->user();
        $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);

        $intervention->delete();

        return Redirect::back()->with('success', 'Intervention deleted successfully.');
    }

    /**
     * Add one task to an intervention.
     */
    public function storeTask(Request $request, Intervention $intervention)
    {
        $teacher = $request->user();
        $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);

        $validated = $request->validate([
            'task_name' => 'required|string|max:150',
            'description' => 'nullable|string|max:255',
            'delivery_mode' => ['nullable', 'string', Rule::in(['remote', 'face_to_face'])],
            'is_completed' => 'nullable|boolean',
        ]);

        $isCompleted = (bool) ($validated['is_completed'] ?? false);

        $intervention->tasks()->create([
            'task_name' => trim($validated['task_name']),
            'description' => trim((string) ($validated['description'] ?? $validated['task_name'])),
            'delivery_mode' => $validated['delivery_mode'] ?? null,
            'is_completed' => $isCompleted,
            'completed_at' => $isCompleted ? now() : null,
            'approved_by_teacher_at' => $isCompleted ? now() : null,
        ]);

        return Redirect::back()->with('success', 'Task added to intervention.');
    }

    /**
     * Update one task for an intervention.
     */
    public function updateTask(Request $request, Intervention $intervention, InterventionTask $task)
    {
        $teacher = $request->user();
        $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);
        $this->ensureTaskBelongsToIntervention($intervention, $task);

        $validated = $request->validate([
            'task_name' => 'required|string|max:150',
            'description' => 'nullable|string|max:255',
            'delivery_mode' => ['nullable', 'string', Rule::in(['remote', 'face_to_face'])],
            'is_completed' => 'nullable|boolean',
        ]);

        $isCompleted = array_key_exists('is_completed', $validated)
            ? (bool) $validated['is_completed']
            : (bool) $task->is_completed;

        $task->update([
            'task_name' => trim($validated['task_name']),
            'description' => trim((string) ($validated['description'] ?? $validated['task_name'])),
            'delivery_mode' => $validated['delivery_mode'] ?? null,
            'is_completed' => $isCompleted,
            'completed_at' => $isCompleted ? ($task->completed_at ?? now()) : null,
            'approved_by_teacher_at' => $isCompleted ? now() : null,
        ]);

        return Redirect::back()->with('success', 'Task updated successfully.');
    }

    /**
     * Toggle task completion progress from the teacher modal.
     */
    public function toggleTaskCompletion(Request $request, Intervention $intervention, InterventionTask $task)
    {
        $teacher = $request->user();
        $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);
        $this->ensureTaskBelongsToIntervention($intervention, $task);

        $validated = $request->validate([
            'is_completed' => 'required|boolean',
        ]);

        $isCompleted = (bool) $validated['is_completed'];

        $task->update([
            'is_completed' => $isCompleted,
            'completed_at' => $isCompleted ? now() : null,
            'approved_by_teacher_at' => $isCompleted ? now() : null,
        ]);

        return Redirect::back()->with(
            'success',
            $isCompleted ? 'Task marked as done.' : 'Task marked as pending.'
        );
    }

    /**
     * Delete one task from an intervention.
     */
    public function destroyTask(Request $request, Intervention $intervention, InterventionTask $task)
    {
        $teacher = $request->user();
        $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);
        $this->ensureTaskBelongsToIntervention($intervention, $task);

        $task->delete();

        return Redirect::back()->with('success', 'Task deleted successfully.');
    }

    /**
     * Allow teachers to directly approve completion for Tier 3 interventions.
     */
    public function completeWithoutRequest(Request $request, Intervention $intervention)
    {
        $teacher = $request->user();
        $enrollment = $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);

        if (! $intervention->isTier3()) {
            return Redirect::back()->with('error', 'Only Tier 3 interventions can be directly approved.');
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $intervention->tasks()
            ->where('is_completed', false)
            ->update([
                'is_completed' => true,
                'completed_at' => now(),
                'approved_by_teacher_at' => now(),
            ]);

        $intervention->update([
            'status' => 'completed',
            'approved_at' => now(),
            'approved_by' => $teacher->id,
            'approval_notes' => $validated['notes'] ?? null,
            'completion_requested_at' => $intervention->completion_requested_at ?? now(),
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);

        StudentNotification::create([
            'user_id' => $enrollment->user_id,
            'intervention_id' => $intervention->id,
            'sender_id' => $teacher->id,
            'type' => 'feedback',
            'title' => '✅ Intervention Completed by Teacher',
            'message' => 'Your teacher marked your intervention as complete. ' .
                ($validated['notes'] ?? null
                    ? "Teacher notes: {$validated['notes']}"
                    : 'Please keep up the progress in this class.'),
        ]);

        return Redirect::back()->with('success', 'Intervention approved and completed.');
    }

    /**
     * Process intervention based on type.
     */
    private function processIntervention(Enrollment $enrollment, Intervention $intervention, array $validated, $teacher, bool $sendEmail)
    {
        $notificationType = $this->getNotificationType($validated['type']);

        // Create in-app notification
        $this->createNotification($enrollment, $intervention, $teacher, $notificationType);

        // Academic agreement and checklist-based interventions share a task flow.
        if (in_array($validated['type'], ['task_list', 'academic_agreement'], true) && !empty($validated['tasks'])) {
            $this->createTasks($intervention, $validated['tasks']);
        }

        // Send email if enabled and student has an email
        if ($sendEmail && $enrollment->user?->email) {
            $this->sendEmailNotification($enrollment, $intervention, $teacher, $notificationType);
        }
    }

    /**
     * Get notification type based on intervention type.
     */
    private function getNotificationType(string $interventionType): string
    {
        return match ($interventionType) {
            'automated_nudge' => 'nudge',
            'task_list' => 'task',
            'extension_grant' => 'extension',
            'academic_agreement' => 'agreement',
            'one_on_one_meeting' => 'meeting',
            default => 'general',
        };
    }

    /**
     * Create in-app notification for the student.
     */
    private function createNotification(Enrollment $enrollment, Intervention $intervention, $teacher, string $notificationType)
    {
        $studentName = $enrollment->user?->name ?? 'Student';
        $subjectName = $enrollment->schoolClass?->subject?->subject_name
            ?? $enrollment->subjectTeacher?->subject?->subject_name
            ?? 'your class';
        $teacherName = $teacher->name ?? 'Your Teacher';
        $deadlineSuffix = $intervention->deadline_at
            ? ' Deadline: ' . $intervention->deadline_at->format('M d, Y h:i A') . '.'
            : '';

        $titles = [
            'nudge' => '📚 Reminder from ' . $teacherName,
            'task' => '📋 New Goals Assigned by ' . $teacherName,
            'extension' => '⏰ Deadline Extension Granted',
            'agreement' => '📄 Academic Agreement Recorded',
            'meeting' => '💬 Intervention Meeting Logged',
            'general' => 'Notice from ' . $teacherName,
        ];

        $messages = [
            'nudge' => "Hi {$studentName}! This is a friendly reminder to stay on track with your academic goals in {$subjectName}. " .
                ($intervention->notes ? "Note: {$intervention->notes}" : "Keep up the great work!"),
            'task' => "Hi {$studentName}! Your teacher has assigned you goals for {$subjectName}. Please check your dashboard to view and complete them. " .
                ($intervention->notes ? "Note: {$intervention->notes}" : "") . $deadlineSuffix,
            'extension' => "Hi {$studentName}! You've been granted a deadline extension for {$subjectName}. " .
                ($intervention->notes ? "Details: {$intervention->notes}" : "Please use this time wisely.") . $deadlineSuffix,
            'agreement' => "Hi {$studentName}! An academic agreement has been recorded for {$subjectName}. " .
                ($intervention->notes ? "Details: {$intervention->notes}" : "Please fulfill the agreed terms.") . $deadlineSuffix,
            'meeting' => "Hi {$studentName}! A one-on-one intervention meeting has been logged for {$subjectName}. " .
                ($intervention->notes ? "Notes: {$intervention->notes}" : "Please follow up as discussed.") . $deadlineSuffix,
            'general' => "Hi {$studentName}! You have a notification regarding {$subjectName}. " .
                ($intervention->notes ? $intervention->notes : "Please check with your teacher.") . $deadlineSuffix,
        ];

        StudentNotification::create([
            'user_id' => $enrollment->user_id,
            'intervention_id' => $intervention->id,
            'sender_id' => $teacher->id,
            'type' => $notificationType,
            'title' => $titles[$notificationType] ?? $titles['general'],
            'message' => $messages[$notificationType] ?? $messages['general'],
        ]);
    }

    /**
     * Create intervention tasks from either legacy string lists or rich task objects.
     */
    private function createTasks(Intervention $intervention, array $tasks, bool $replaceExisting = true): void
    {
        if ($replaceExisting) {
            $intervention->tasks()->delete();
        }

        foreach ($tasks as $taskPayload) {
            $normalizedTask = $this->normalizeTaskPayload($taskPayload);

            InterventionTask::create([
                'intervention_id' => $intervention->id,
                'task_name' => $normalizedTask['task_name'],
                'description' => $normalizedTask['description'],
                'delivery_mode' => $normalizedTask['delivery_mode'],
                'is_completed' => $normalizedTask['is_completed'],
                'completed_at' => $normalizedTask['is_completed'] ? now() : null,
                'approved_by_teacher_at' => null,
            ]);
        }

        $intervention->load('tasks');
    }

    /**
     * Normalize task payload from legacy strings or object-based task forms.
     */
    private function normalizeTaskPayload(mixed $taskPayload): array
    {
        if (is_string($taskPayload)) {
            $taskName = trim($taskPayload);

            if ($taskName === '') {
                throw ValidationException::withMessages([
                    'tasks' => 'Task names cannot be empty.',
                ]);
            }

            return [
                'task_name' => $taskName,
                'description' => $taskName,
                'delivery_mode' => null,
                'is_completed' => false,
            ];
        }

        if (!is_array($taskPayload)) {
            throw ValidationException::withMessages([
                'tasks' => 'Each task must be a string or task object.',
            ]);
        }

        $taskName = trim((string) (
            $taskPayload['task_name']
            ?? $taskPayload['name']
            ?? $taskPayload['title']
            ?? ''
        ));

        if ($taskName === '') {
            throw ValidationException::withMessages([
                'tasks' => 'Each task object must include a task name.',
            ]);
        }

        if (mb_strlen($taskName) > 150) {
            throw ValidationException::withMessages([
                'tasks' => 'Task name may not be greater than 150 characters.',
            ]);
        }

        $description = trim((string) ($taskPayload['description'] ?? $taskName));
        if ($description === '') {
            $description = $taskName;
        }

        if (mb_strlen($description) > 255) {
            throw ValidationException::withMessages([
                'tasks' => 'Task description may not be greater than 255 characters.',
            ]);
        }

        $deliveryMode = $taskPayload['delivery_mode'] ?? null;
        if ($deliveryMode !== null && !in_array($deliveryMode, ['remote', 'face_to_face'], true)) {
            throw ValidationException::withMessages([
                'tasks' => 'Task delivery mode must be either remote or face_to_face.',
            ]);
        }

        return [
            'task_name' => $taskName,
            'description' => $description,
            'delivery_mode' => $deliveryMode,
            'is_completed' => (bool) ($taskPayload['is_completed'] ?? false),
        ];
    }

    /**
     * Send email notification to the student.
     */
    private function sendEmailNotification(Enrollment $enrollment, Intervention $intervention, $teacher, string $notificationType)
    {
        try {
            $subjectName = $enrollment->schoolClass?->subject?->subject_name
                ?? $enrollment->subjectTeacher?->subject?->subject_name
                ?? 'your class';

            Mail::to($enrollment->user->email)->queue(
                new InterventionNotification(
                    $intervention,
                    $enrollment->user,
                    $teacher,
                    $subjectName,
                    $notificationType
                )
            );
        } catch (\Exception $e) {
            // Log the error but don't fail the intervention creation
            Log::error('Failed to send intervention email: ' . $e->getMessage());
        }
    }

    /**
     * Create a nudge notification for the student.
     * @deprecated Use createNotification instead
     */
    private function createNudgeNotification(Enrollment $enrollment, Intervention $intervention, $teacher)
    {
        $this->createNotification($enrollment, $intervention, $teacher, 'nudge');
    }

    /**
     * Create task list items for the student.
     * @deprecated Use createTasks and createNotification instead
     */
    private function createTaskList(Enrollment $enrollment, Intervention $intervention, array $tasks, $teacher)
    {
        $this->createTasks($intervention, $tasks);
        $this->createNotification($enrollment, $intervention, $teacher, 'task');
    }

    /**
     * Approve a student's completion request for a Tier 3 intervention.
     */
    public function approveCompletion(Request $request, Intervention $intervention)
    {
        $teacher = $request->user();
        $enrollment = $intervention->enrollment;

        // Verify the intervention belongs to this teacher's subject
        if (! $this->enrollmentOwnedByTeacher($enrollment, (int) $teacher->id)) {
            abort(403, 'Unauthorized');
        }

        // Check if there's a pending completion request
        if (!$intervention->isPendingApproval()) {
            return back()->with('error', 'No pending completion request for this intervention.');
        }

        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $intervention->tasks()
            ->where('is_completed', false)
            ->update([
                'is_completed' => true,
                'completed_at' => now(),
                'approved_by_teacher_at' => now(),
            ]);

        $intervention->update([
            'status' => 'completed',
            'approved_at' => now(),
            'approved_by' => $teacher->id,
            'approval_notes' => $request->input('notes'),
        ]);

        // Notify the student
        StudentNotification::create([
            'user_id' => $enrollment->user_id,
            'intervention_id' => $intervention->id,
            'sender_id' => $teacher->id,
            'type' => 'feedback',
            'title' => '✅ Intervention Completed!',
            'message' => 'Congratulations! Your teacher has approved your intervention completion request. ' .
                ($request->input('notes') ? "Teacher notes: {$request->input('notes')}" : 'Great job on completing your intervention!'),
        ]);

        return back()->with('success', 'Intervention completion approved successfully!');
    }

    /**
     * Reject a student's completion request for a Tier 3 intervention.
     */
    public function rejectCompletion(Request $request, Intervention $intervention)
    {
        $teacher = $request->user();
        $enrollment = $intervention->enrollment;

        // Verify the intervention belongs to this teacher's subject
        if (! $this->enrollmentOwnedByTeacher($enrollment, (int) $teacher->id)) {
            abort(403, 'Unauthorized');
        }

        // Check if there's a pending completion request
        if (!$intervention->isPendingApproval()) {
            return back()->with('error', 'No pending completion request for this intervention.');
        }

        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $intervention->update([
            'rejected_at' => now(),
            'rejection_reason' => $request->input('reason'),
            // Clear the completion request so student can try again
            'completion_requested_at' => null,
            'completion_request_notes' => null,
        ]);

        // Notify the student
        StudentNotification::create([
            'user_id' => $enrollment->user_id,
            'intervention_id' => $intervention->id,
            'sender_id' => $teacher->id,
            'type' => 'alert',
            'title' => '⚠️ Completion Request Not Approved',
            'message' => "Your intervention completion request was not approved. Reason: {$request->input('reason')}. Please continue working on the intervention requirements and submit again when ready.",
        ]);

        return back()->with('success', 'Completion request rejected. Student has been notified.');
    }

    private function authorizeInterventionForTeacher(Intervention $intervention, int $teacherId): Enrollment
    {
        $enrollment = $intervention->enrollment;

        if (! $enrollment || ! $this->enrollmentOwnedByTeacher($enrollment, $teacherId)) {
            abort(403, 'Unauthorized');
        }

        return $enrollment;
    }

    private function ensureTaskBelongsToIntervention(Intervention $intervention, InterventionTask $task): void
    {
        if ((int) $task->intervention_id !== (int) $intervention->id) {
            abort(404, 'Task not found for this intervention.');
        }
    }

    private function serializeIntervention(Intervention $intervention): array
    {
        $tasks = $intervention->tasks
            ->map(fn(InterventionTask $task) => $this->serializeInterventionTask($task))
            ->values();

        $completedTasks = $tasks->where('is_completed', true)->count();
        $totalTasks = $tasks->count();

        return [
            'id' => $intervention->id,
            'type' => $intervention->type,
            'typeLabel' => Intervention::getTypes()[$intervention->type] ?? $intervention->type,
            'status' => $intervention->status,
            'notes' => $intervention->notes,
            'deadlineAt' => $intervention->deadline_at?->toIso8601String(),
            'deadlineLabel' => $intervention->deadline_at?->format('M d, Y h:i A'),
            'isDeadlineOverdue' => $intervention->deadline_at
                ? now()->gt($intervention->deadline_at) && $intervention->status === 'active'
                : false,
            'created_at' => $intervention->created_at?->format('Y-m-d'),
            'tasks' => $tasks->toArray(),
            'completedTasks' => $completedTasks,
            'totalTasks' => $totalTasks,
            'progressPercent' => $totalTasks > 0
                ? (int) round(($completedTasks / $totalTasks) * 100)
                : 0,
            'isTier3' => $intervention->isTier3(),
            'isPendingApproval' => $intervention->isPendingApproval(),
            'completionRequestedAt' => $intervention->completion_requested_at?->format('M d, Y'),
            'completionRequestNotes' => $intervention->completion_request_notes,
        ];
    }

    private function serializeInterventionTask(InterventionTask $task): array
    {
        $taskName = trim((string) ($task->task_name ?: $task->description));

        return [
            'id' => $task->id,
            'task_name' => $taskName,
            'description' => $task->description,
            'delivery_mode' => $task->delivery_mode,
            'delivery_mode_label' => match ($task->delivery_mode) {
                'remote' => 'Remote',
                'face_to_face' => 'Face-to-Face',
                default => null,
            },
            'is_completed' => (bool) $task->is_completed,
            'completed_at' => $task->completed_at?->toIso8601String(),
            'approved_by_teacher_at' => $task->approved_by_teacher_at?->toIso8601String(),
        ];
    }

    private function enrollmentOwnedByTeacher(Enrollment $enrollment, int $teacherId): bool
    {
        $classTeacherId = $enrollment->schoolClass?->teacher_id
            ?? $enrollment->subjectTeacher?->teacher_id;

        return (int) $classTeacherId === $teacherId;
    }

    private function typeRequiresDeadline(string $type): bool
    {
        return in_array($type, [
            'task_list',
            'extension_grant',
            'parent_contact',
            'academic_agreement',
            'one_on_one_meeting',
            'counselor_referral',
        ], true);
    }

    private function normalizeDeadlineForType(string $type, ?string $deadlineAt): ?string
    {
        if (! $this->typeRequiresDeadline($type)) {
            return null;
        }

        if (blank($deadlineAt)) {
            throw ValidationException::withMessages([
                'deadline_at' => 'Deadline date and time is required for Tier 2 and Tier 3 interventions.',
            ]);
        }

        return $deadlineAt;
    }
}

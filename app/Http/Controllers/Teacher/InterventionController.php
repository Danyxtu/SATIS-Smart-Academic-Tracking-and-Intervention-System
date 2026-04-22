<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Mail\InterventionNotification;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\InterventionTask;
use App\Models\SchoolPersonnel;
use App\Models\StudentNotification;
use App\Services\Messaging\TwilioSmsService;
use App\Services\Teacher\WatchlistSettingsService;
use App\Services\WatchlistRuleService;
use App\Support\StudentNameFormatter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InterventionController extends Controller
{
    protected WatchlistRuleService $watchlistRuleService;
    protected WatchlistSettingsService $watchlistSettingsService;
    protected TwilioSmsService $twilioSmsService;

    public function __construct(
        WatchlistRuleService $watchlistRuleService,
        WatchlistSettingsService $watchlistSettingsService,
        TwilioSmsService $twilioSmsService,
    ) {
        $this->watchlistRuleService = $watchlistRuleService;
        $this->watchlistSettingsService = $watchlistSettingsService;
        $this->twilioSmsService = $twilioSmsService;
    }

    /**
     * Display the intervention dashboard with students needing intervention.
     */
    public function index(Request $request): Response
    {
        $teacher = $request->user();
        $currentSchoolYear = $this->resolveInterventionSchoolYear();
        $watchlistRules = $this->watchlistSettingsService->getEvaluationRulesForTeacher($teacher);
        $observedCategories = $this->watchlistSettingsService->getObservedCategoriesForTeacher($teacher);

        // Get enrollments with students who might need intervention
        // Include their grades, attendance, and any existing interventions
        $enrollments = Enrollment::with([
            'user.student',
            'schoolClass.subject',
            'subjectTeacher.subject',
            'grades',
            'attendanceRecords',
            'interventions.tasks',
        ])
            ->where(function ($query) use ($teacher, $currentSchoolYear) {
                $query
                    ->whereHas('schoolClass', function ($classQuery) use ($teacher, $currentSchoolYear) {
                        $classQuery->where('teacher_id', $teacher->id);
                        $classQuery->where('school_year', $currentSchoolYear);
                    })
                    ->orWhereHas('subjectTeacher', function ($legacyQuery) use ($teacher, $currentSchoolYear) {
                        $legacyQuery->where('teacher_id', $teacher->id);
                        $legacyQuery->where('school_year', $currentSchoolYear);
                    });
            })
            ->get();

        // Build the student watchlist based on risk factors
        $watchlist = $enrollments->map(function ($enrollment) use ($watchlistRules) {
            $user = $enrollment->user;
            $student = $user?->student;
            $displayName = StudentNameFormatter::format($user, $student);
            $sortKey = StudentNameFormatter::sortKey($user, $student);
            $classAssignment = $enrollment->schoolClass ?? $enrollment->subjectTeacher;
            $subject = $classAssignment?->subject;
            $subjectName = $subject?->subject_name ?? 'N/A';
            $classSection = $classAssignment?->section;

            $risk = $this->watchlistRuleService->evaluateEnrollment($enrollment, $watchlistRules);
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
            $interventions = $enrollment->interventions;
            $activeInterventions = $interventions->where('status', 'active');
            $latestIntervention = $interventions->sortByDesc('updated_at')->first();
            $lastInterventionDate = $latestIntervention?->updated_at?->format('Y-m-d');

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
                'parentContact' => $student?->parent_contact_number,
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
                'hasActiveIntervention' => $activeInterventions->isNotEmpty(),
                'activeInterventionsCount' => $activeInterventions->count(),
                // Prediction data
                'predictedGrade' => $prediction['predicted_grade'],
                'gradeTrend' => $prediction['trend'],
                'trendDirection' => $prediction['trend_direction'],
                'interventions' => $interventions->map(fn($i) => $this->serializeIntervention($i))->toArray(),
                // Legacy support
                'intervention' => $latestIntervention ? $this->serializeIntervention($latestIntervention) : null,
                // Flag for pending completion requests (for easy filtering)
                'hasPendingCompletionRequest' => $activeInterventions->contains(fn($i) => $i->isPendingApproval()),
            ];
        })
            // Only include students who are NOT on_track or have active intervention
            ->filter(function ($student) use ($observedCategories) {
                if (!empty($student['hasActiveIntervention'])) {
                    return true;
                }

                $riskCategory = (string) ($student['riskCategory'] ?? 'on_track');

                return $this->isRiskCategoryObserved($riskCategory, $observedCategories);
            })
            ->sortBy('sort_key', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        // Build detailed student data for the profile view
        $studentDetails = $enrollments->mapWithKeys(function ($enrollment) use ($watchlistRules) {
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
            $interventions = $enrollment->interventions;
            $interventionLog = $interventions->map(fn($i) => [
                'id' => $i->id,
                'date' => $i->created_at?->format('Y-m-d'),
                'action' => Intervention::getTypes()[$i->type] ?? $i->type,
                'notes' => $i->notes,
                'followUp' => null,
                'status' => $i->status,
                'completed_at' => $i->completed_at?->format('Y-m-d'),
            ])->values()->toArray();

            // Use shared global watchlist rules for profile priority as well.
            $risk = $this->watchlistRuleService->evaluateEnrollment($enrollment, $watchlistRules);
            $priority = $risk['priority'] ?? 'Low';
            $riskReasons = array_values(array_filter((array) ($risk['reasons'] ?? []), function ($reason) {
                return is_string($reason) && trim($reason) !== '';
            }));
            $priorityReason = !empty($riskReasons)
                ? implode(' ', $riskReasons)
                : 'Under Observation';

            // Build pending completion request data
            $activeInterventions = $interventions->where('status', 'active');
            $pendingReqIntervention = $activeInterventions->first(fn($i) => $i->isPendingApproval());
            
            $pendingCompletionRequest = null;
            if ($pendingReqIntervention) {
                $pendingCompletionRequest = [
                    'interventionId' => $pendingReqIntervention->id,
                    'type' => $pendingReqIntervention->type,
                    'typeLabel' => Intervention::getTypes()[$pendingReqIntervention->type] ?? $pendingReqIntervention->type,
                    'requestedAt' => $pendingReqIntervention->completion_requested_at?->format('M d, Y'),
                    'requestNotes' => $pendingReqIntervention->completion_request_notes,
                ];
            }

            $latestActiveIntervention = $activeInterventions->sortByDesc('updated_at')->first();

            return [
                $enrollment->id => [
                    'id' => $enrollment->id,
                    'name' => $displayName,
                    'currentGrade' => $gradePercentage !== null ? "{$gradePercentage}%" : 'N/A',
                    'gradeTrend' => $gradeTrend,
                    'specialPrograms' => [],
                    'parentContact' => $student?->parent_contact_number,
                    'counselor' => 'Guidance Office',
                    'attendanceSummary' => $this->buildAttendanceSummary($enrollment->attendanceRecords),
                    'missingAssignments' => $missingAssignments,
                    'behaviorLog' => [],
                    'interventionLog' => $interventionLog,
                    'interventions' => $interventions->map(fn($i) => $this->serializeIntervention($i))->toArray(),
                    'priority' => $priority,
                    'priorityReason' => $priorityReason,
                    'pendingCompletionRequest' => $pendingCompletionRequest,
                    'activeIntervention' => $latestActiveIntervention ? $this->serializeIntervention($latestActiveIntervention) : null,
                ],
            ];
        })->toArray();

        return Inertia::render('Teacher/Interventions', [
            'watchlist' => $watchlist->toArray(),
            'studentDetails' => $studentDetails,
            'watchlistObservedCategories' => $observedCategories,
        ]);
    }

    private function isRiskCategoryObserved(string $riskCategory, array $observedCategories): bool
    {
        return match ($riskCategory) {
            'at_risk' => (bool) data_get($observedCategories, 'at_risk', true),
            'needs_attention' => (bool) data_get($observedCategories, 'needs_attention', true),
            'recent_decline' => (bool) data_get($observedCategories, 'recent_decline', true),
            default => false,
        };
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
            'send_sms' => 'nullable|boolean',
            'sms_recipients' => 'nullable|array',
            'sms_recipients.*' => 'nullable|string|max:40',
            'parent_phone' => 'nullable|string|max:40',
            'sms_custom_message' => 'nullable|string|max:1000|required_if:type,parent_contact',
        ]);

        $deadlineAt = $this->normalizeDeadlineForType(
            $validated['type'],
            $validated['deadline_at'] ?? null,
        );

        $enrollment = Enrollment::with(['schoolClass.subject', 'subjectTeacher.subject', 'user'])->findOrFail($validated['enrollment_id']);
        $schoolYear = $this->resolveInterventionSchoolYear();

        if (! $this->enrollmentOwnedByTeacher($enrollment, (int) $request->user()->id)) {
            abort(403, 'You are not authorized to start an intervention for this student.');
        }

        $intervention = Intervention::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'status' => 'active',
                'school_year' => $schoolYear,
            ],
            [
                'type' => $validated['type'],
                'notes' => $validated['notes'] ?? '',
                'deadline_at' => $deadlineAt,
                'school_year' => $schoolYear,
            ]
        );

        $sendEmail = $validated['send_email'] ?? true;
        $sendSms = array_key_exists('send_sms', $validated)
            ? (bool) $validated['send_sms']
            : (bool) config('services.twilio.interventions_enabled', false);
        $smsRecipients = $this->resolveRequestedSmsRecipients($validated);

        // Handle different intervention types
        $this->processIntervention(
            $enrollment,
            $intervention,
            $validated,
            $request->user(),
            $sendEmail,
            $sendSms,
            $smsRecipients,
        );

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
            'send_sms' => 'nullable|boolean',
            'sms_recipients' => 'nullable|array',
            'sms_recipients.*' => 'nullable|string|max:40',
            'parent_phone' => 'nullable|string|max:40',
            'sms_custom_message' => 'nullable|string|max:1000|required_if:type,parent_contact',
        ]);

        $deadlineAt = $this->normalizeDeadlineForType(
            $validated['type'],
            $validated['deadline_at'] ?? null,
        );

        $teacher = $request->user();
        $schoolYear = $this->resolveInterventionSchoolYear();
        $sendEmail = $validated['send_email'] ?? true;
        $sendSms = array_key_exists('send_sms', $validated)
            ? (bool) $validated['send_sms']
            : (bool) config('services.twilio.interventions_enabled', false);
        $smsRecipients = $this->resolveRequestedSmsRecipients($validated);
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
                    'school_year' => $schoolYear,
                ],
                [
                    'type' => $validated['type'],
                    'notes' => $validated['notes'] ?? '',
                    'deadline_at' => $deadlineAt,
                    'school_year' => $schoolYear,
                ]
            );

            $this->processIntervention(
                $enrollment,
                $intervention,
                $validated,
                $teacher,
                $sendEmail,
                $sendSms,
                $smsRecipients,
            );
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
        $enrollment = $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);
        $this->ensureTaskBelongsToIntervention($intervention, $task);

        $validated = $request->validate([
            'is_completed' => 'required|boolean',
        ]);

        $isCompleted = (bool) $validated['is_completed'];
        $wasPendingReview = $task->isPendingReview();

        $task->update([
            'is_completed' => $isCompleted,
            'completed_at' => $isCompleted ? ($task->completed_at ?? now()) : null,
            'approved_by_teacher_at' => $isCompleted ? now() : null,
        ]);

        // If all tasks are completed, mark intervention as completed
        if ($isCompleted) {
            $allCompleted = $intervention->tasks()->where('is_completed', false)->count() === 0;
            if ($allCompleted && $intervention->tasks()->count() > 0) {
                $intervention->update(['status' => 'completed']);
            }

            if ($wasPendingReview) {
                // Notify student of approval
                StudentNotification::create([
                    'user_id' => $enrollment->user_id,
                    'intervention_id' => $intervention->id,
                    'sender_id' => $teacher->id,
                    'type' => 'feedback',
                    'title' => '✅ Task Proof Approved',
                    'message' => "Your teacher approved your proof for \"{$task->task_name}\".",
                ]);
            }
        } else {
            // If any task is uncompleted, mark intervention as active again if it was completed
            if ($intervention->status === 'completed') {
                $intervention->update(['status' => 'active']);
            }
        }

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
    private function processIntervention(
        Enrollment $enrollment,
        Intervention $intervention,
        array $validated,
        $teacher,
        bool $sendEmail,
        bool $sendSms,
        array $smsRecipients,
    ) {
        $notificationType = $this->getNotificationType($validated['type']);
        $smsCustomMessage = isset($validated['sms_custom_message'])
            ? trim((string) $validated['sms_custom_message'])
            : null;

        if ($smsCustomMessage === '') {
            $smsCustomMessage = null;
        }

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

        // Send SMS to parent/guidance recipients when enabled.
        if ($sendSms) {
            $this->sendSmsNotification(
                $enrollment,
                $intervention,
                $teacher,
                $smsRecipients,
                $smsCustomMessage,
            );
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

    private function sendSmsNotification(
        Enrollment $enrollment,
        Intervention $intervention,
        $teacher,
        array $requestedRecipients,
        ?string $customMessage = null,
    ): void {
        if (! $this->twilioSmsService->isEnabled()) {
            return;
        }

        if (! $this->twilioSmsService->isConfigured()) {
            Log::warning('Intervention SMS skipped because Twilio is not fully configured.');

            return;
        }

        $recipients = array_merge(
            $requestedRecipients,
            $this->resolveEnrollmentParentSmsRecipients($enrollment),
        );

        if (in_array($intervention->type, ['academic_agreement', 'one_on_one_meeting', 'counselor_referral'], true)) {
            $recipients = array_merge($recipients, $this->resolveGuidanceCounselorSmsRecipients());
        }

        $recipients = array_values(array_unique($recipients));

        if (empty($recipients)) {
            Log::info('Intervention SMS skipped because no SMS recipients are available.', [
                'intervention_id' => $intervention->id,
                'type' => $intervention->type,
            ]);

            return;
        }

        $message = $this->buildInterventionSmsMessage(
            $enrollment,
            $intervention,
            $teacher,
            $customMessage,
        );

        foreach ($recipients as $recipient) {
            $this->twilioSmsService->send($recipient, $message);
        }
    }

    private function resolveEnrollmentParentSmsRecipients(Enrollment $enrollment): array
    {
        $parentContact = $enrollment->user?->student?->parent_contact_number;

        if (! is_string($parentContact) || trim($parentContact) === '') {
            return [];
        }

        $normalized = $this->normalizeSmsPhoneNumber($parentContact);

        return $normalized ? [$normalized] : [];
    }

    private function buildInterventionSmsMessage(
        Enrollment $enrollment,
        Intervention $intervention,
        $teacher,
        ?string $customMessage = null,
    ): string {
        $studentName = $enrollment->user?->name ?? 'Student';
        $subjectName = $enrollment->schoolClass?->subject?->subject_name
            ?? $enrollment->subjectTeacher?->subject?->subject_name
            ?? 'your class';
        $teacherName = $teacher->name ?? 'Teacher';
        $typeLabel = Intervention::getTypes()[$intervention->type] ?? 'Intervention';

        $segments = [
            "SATIS: {$typeLabel} for {$studentName} in {$subjectName} by {$teacherName}.",
        ];

        if ($intervention->type === 'parent_contact') {
            $resolvedCustomMessage = filled($customMessage)
                ? trim((string) $customMessage)
                : null;

            if ($resolvedCustomMessage === null && filled($intervention->notes)) {
                $resolvedCustomMessage = trim((string) $intervention->notes);
            }

            if ($resolvedCustomMessage === null || $resolvedCustomMessage === '') {
                $resolvedCustomMessage = "Please coordinate with {$teacherName} regarding {$studentName}'s progress in {$subjectName}.";
            }

            $message = "SATIS Parent Contact for {$studentName}: {$resolvedCustomMessage}";

            if (mb_strlen($message) > 320) {
                return mb_substr($message, 0, 317) . '...';
            }

            return $message;
        }

        if (filled($intervention->notes)) {
            $segments[] = 'Notes: ' . mb_substr(trim((string) $intervention->notes), 0, 120) . '.';
        }

        if ($intervention->deadline_at) {
            $segments[] = 'Deadline: ' . $intervention->deadline_at->format('M d, Y h:i A') . '.';
        }

        $message = trim(implode(' ', $segments));

        if (mb_strlen($message) > 320) {
            return mb_substr($message, 0, 317) . '...';
        }

        return $message;
    }

    private function resolveRequestedSmsRecipients(array $validated): array
    {
        $rawRecipients = [];

        $recipientList = $validated['sms_recipients'] ?? [];
        if (is_array($recipientList)) {
            $rawRecipients = array_merge($rawRecipients, $recipientList);
        }

        $parentPhone = $validated['parent_phone'] ?? null;
        if (is_string($parentPhone) && trim($parentPhone) !== '') {
            $rawRecipients[] = $parentPhone;
        }

        $normalized = [];

        foreach ($rawRecipients as $value) {
            if (! is_string($value)) {
                continue;
            }

            $tokens = preg_split('/[;,\n\r]+/', $value) ?: [];
            foreach ($tokens as $token) {
                $phone = $this->normalizeSmsPhoneNumber($token);

                if ($phone !== null) {
                    $normalized[] = $phone;
                }
            }
        }

        return array_values(array_unique($normalized));
    }

    private function resolveGuidanceCounselorSmsRecipients(): array
    {
        return SchoolPersonnel::query()
            ->where('position', 'Guidance Counselor')
            ->pluck('phone_number')
            ->map(fn($phone) => $this->normalizeSmsPhoneNumber(is_string($phone) ? $phone : null))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function normalizeSmsPhoneNumber(?string $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $phone = trim($value);

        if ($phone === '') {
            return null;
        }

        $phone = preg_replace('/[^\d+]/', '', $phone) ?? '';

        if ($phone === '') {
            return null;
        }

        if (str_starts_with($phone, '00')) {
            $phone = '+' . substr($phone, 2);
        }

        if (! str_starts_with($phone, '+')) {
            if (str_starts_with($phone, '09') && strlen($phone) === 11) {
                $phone = '+63' . substr($phone, 1);
            } elseif (str_starts_with($phone, '9') && strlen($phone) === 10) {
                $phone = '+63' . $phone;
            } else {
                $phone = '+' . ltrim($phone, '0');
            }
        }

        if (preg_match('/^\+[1-9]\d{7,14}$/', $phone) !== 1) {
            return null;
        }

        return $phone;
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
        $enrollment = $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);

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
        $enrollment = $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);

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

    /**
     * Download or view a student's task proof.
     */
    public function downloadProof(Request $request, Intervention $intervention, InterventionTask $task)
    {
        $teacher = $request->user();
        $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);
        $this->ensureTaskBelongsToIntervention($intervention, $task);

        if (!$task->proof_path || !Storage::disk('local')->exists($task->proof_path)) {
            abort(404, 'Proof file not found.');
        }

        return Storage::disk('local')->download($task->proof_path);
    }

    /**
     * Reject a student's submitted proof for a task.
     */
    public function rejectTaskProof(Request $request, Intervention $intervention, InterventionTask $task)
    {
        $teacher = $request->user();
        $enrollment = $this->authorizeInterventionForTeacher($intervention, (int) $teacher->id);
        $this->ensureTaskBelongsToIntervention($intervention, $task);

        if (!$task->isPendingReview()) {
            return back()->with('error', 'Task is not pending review.');
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        // Delete the file
        if ($task->proof_path) {
            Storage::disk('local')->delete($task->proof_path);
        }

        $task->update([
            'proof_path' => null,
            'proof_notes' => null,
            'submitted_at' => null,
        ]);

        // Notify student
        StudentNotification::create([
            'user_id' => $enrollment->user_id,
            'intervention_id' => $intervention->id,
            'sender_id' => $teacher->id,
            'type' => 'alert',
            'title' => '❌ Task Proof Rejected',
            'message' => "Your proof for \"{$task->task_name}\" was rejected. Reason: {$request->input('reason')}. Please resubmit with the correct proof.",
        ]);

        return back()->with('success', 'Task proof rejected. Student has been notified.');
    }

    private function authorizeInterventionForTeacher(Intervention $intervention, int $teacherId): Enrollment
    {
        $enrollment = $intervention->enrollment;
        $currentSchoolYear = $this->resolveInterventionSchoolYear();

        if (! $enrollment || ! $this->enrollmentOwnedByTeacher($enrollment, $teacherId)) {
            abort(403, 'Unauthorized');
        }

        if ((string) ($intervention->school_year ?? '') !== $currentSchoolYear) {
            abort(403, 'Unauthorized for this school year.');
        }

        return $enrollment;
    }

    private function resolveInterventionSchoolYear(): string
    {
        $schoolYear = Intervention::resolveCurrentSchoolYear();

        if ($schoolYear !== null) {
            return $schoolYear;
        }

        $currentYear = (int) date('Y');

        return $currentYear . '-' . ($currentYear + 1);
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
            'completed_at' => $intervention->completed_at?->toIso8601String(),
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
            'proof_path' => $task->proof_path,
            'proof_notes' => $task->proof_notes,
            'submitted_at' => $task->submitted_at?->toIso8601String(),
            'is_pending_review' => $task->isPendingReview(),
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
                'deadline_at' => 'Deadline date and time is required for this intervention type.',
            ]);
        }

        return $deadlineAt;
    }
}

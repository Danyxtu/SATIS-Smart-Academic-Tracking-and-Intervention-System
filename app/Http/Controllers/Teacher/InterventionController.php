<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Mail\InterventionNotification;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\InterventionTask;
use App\Models\StudentNotification;
use App\Models\Subject;
use App\Services\PredictionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class InterventionController extends Controller
{
    protected PredictionService $predictionService;

    public function __construct(PredictionService $predictionService)
    {
        $this->predictionService = $predictionService;
    }

    /**
     * Display the intervention dashboard with students needing intervention.
     */
    public function index(Request $request): Response
    {
        $teacher = $request->user();

        // Get all subjects belonging to this teacher
        $subjectIds = Subject::where('user_id', $teacher->id)->pluck('id');

        // Get enrollments with students who might need intervention
        // Include their grades, attendance, and any existing interventions
        $enrollments = Enrollment::with([
            'user.student',
            'subject',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
        ])
            ->whereIn('subject_id', $subjectIds)
            ->get();

        // Build the student watchlist based on risk factors
        $watchlist = $enrollments->map(function ($enrollment) {
            $user = $enrollment->user;
            $student = $user?->student;
            $subject = $enrollment->subject;

            // Calculate current grade percentage
            $grades = $enrollment->grades;
            $totalScore = $grades->sum('score');
            $totalPossible = $grades->sum('total_score');
            $gradePercentage = $totalPossible > 0 ? round(($totalScore / $totalPossible) * 100) : null;

            // Calculate attendance rate
            $attendanceRecords = $enrollment->attendanceRecords;
            $totalDays = $attendanceRecords->count();
            $presentDays = $attendanceRecords->where('status', 'present')->count();
            $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;

            // Count missing assignments (scores that are 0 or null)
            $missingAssignments = $grades->filter(fn($g) => $g->score === null || $g->score == 0)->count();

            // Use PredictionService for risk category
            $riskCategory = $this->predictionService->determineRiskCategory(
                $gradePercentage,
                $missingAssignments,
                $attendanceRate
            );
            $riskKey = $this->predictionService->getRiskCategoryKey(
                $gradePercentage,
                $missingAssignments,
                $attendanceRate
            );

            // Build alert reasons
            $alertReasons = [];
            if ($gradePercentage !== null && $gradePercentage < 75) {
                $alertReasons[] = "Grade: {$gradePercentage}%";
            }
            if ($missingAssignments >= 2) {
                $alertReasons[] = "{$missingAssignments} Missing";
            }
            if ($attendanceRate < 90) {
                $alertReasons[] = "Attendance: {$attendanceRate}%";
            }

            // Get existing intervention info
            $intervention = $enrollment->intervention;
            $lastInterventionDate = $intervention?->updated_at?->format('Y-m-d');

            // Get prediction data
            $prediction = $this->predictionService->predictFinalGrade($enrollment);

            return [
                'id' => $enrollment->id,
                'student_id' => $student?->id,
                'user_id' => $user?->id,
                'name' => $user?->name ?? trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')),
                'lrn' => $student?->lrn,
                'email' => $user?->email,
                'avatar' => $student?->avatar,
                'subject' => $subject?->name . ' - ' . $subject?->section,
                'subject_id' => $subject?->id,
                'grade_level' => $student?->grade_level ?? $subject?->grade_level,
                'section' => $student?->section ?? $subject?->section,
                'currentGrade' => $gradePercentage !== null ? "{$gradePercentage}%" : 'N/A',
                'gradeNumeric' => $gradePercentage,
                'attendanceRate' => $attendanceRate,
                'attendanceSummary' => $this->buildAttendanceSummary($enrollment->attendanceRecords),
                'missingAssignmentCount' => $missingAssignments,
                // New risk category format
                'riskCategory' => $riskKey,
                'riskLabel' => $riskCategory['label'],
                'riskColor' => $riskCategory['color'],
                // Keep legacy priority for backwards compatibility
                'priority' => match ($riskKey) {
                    'critical' => 'High',
                    'at_risk' => 'High',
                    'needs_attention' => 'Medium',
                    default => 'Low',
                },
                'alertReason' => !empty($alertReasons) ? implode(', ', $alertReasons) : 'Under Observation',
                'lastInterventionDate' => $lastInterventionDate ?? 'Never',
                'hasActiveIntervention' => $intervention && $intervention->status === 'active',
                // Prediction data
                'predictedGrade' => $prediction['predicted_grade'],
                'gradeTrend' => $prediction['trend'],
                'trendDirection' => $prediction['trend_direction'],
                'intervention' => $intervention ? [
                    'id' => $intervention->id,
                    'type' => $intervention->type,
                    'status' => $intervention->status,
                    'notes' => $intervention->notes,
                    'created_at' => $intervention->created_at?->format('Y-m-d'),
                    'tasks' => $intervention->tasks->map(fn($task) => [
                        'id' => $task->id,
                        'description' => $task->description,
                        'is_completed' => $task->is_completed,
                    ])->toArray(),
                ] : null,
            ];
        })
            // Only include students who are NOT on_track or have active intervention
            ->filter(fn($s) => $s['riskCategory'] !== 'on_track' || $s['hasActiveIntervention'])
            ->sortByDesc(fn($s) => match ($s['riskCategory']) {
                'critical' => 4,
                'at_risk' => 3,
                'needs_attention' => 2,
                default => 1,
            })
            ->values();

        // Build detailed student data for the profile view
        $studentDetails = $enrollments->mapWithKeys(function ($enrollment) {
            $user = $enrollment->user;
            $student = $user?->student;
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

            return [
                $enrollment->id => [
                    'id' => $enrollment->id,
                    'name' => $user?->name ?? trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')),
                    'currentGrade' => $gradePercentage !== null ? "{$gradePercentage}%" : 'N/A',
                    'gradeTrend' => $gradeTrend,
                    'specialPrograms' => [],
                    'parentContact' => $user?->email ?? 'N/A',
                    'counselor' => 'Guidance Office',
                    'attendanceSummary' => $this->buildAttendanceSummary($enrollment->attendanceRecords),
                    'missingAssignments' => $missingAssignments,
                    'behaviorLog' => [],
                    'interventionLog' => $interventionLog,
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
            'tasks' => 'nullable|array',
            'tasks.*' => 'string|max:500',
            'send_email' => 'nullable|boolean',
        ]);

        $enrollment = Enrollment::with(['subject', 'user'])->findOrFail($validated['enrollment_id']);

        if (optional($enrollment->subject)->user_id !== $request->user()->id) {
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
            ]
        );

        $sendEmail = $validated['send_email'] ?? true;

        // Handle different intervention types
        $this->processIntervention($enrollment, $intervention, $validated, $request->user(), $sendEmail);

        return Redirect::back()->with(
            'success',
            sprintf('Intervention for %s is now active.', optional($enrollment->user)->name ?? 'the student')
        );
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
            'tasks' => 'nullable|array',
            'tasks.*' => 'string|max:500',
            'send_email' => 'nullable|boolean',
        ]);

        $teacher = $request->user();
        $sendEmail = $validated['send_email'] ?? true;
        $successCount = 0;
        $failedCount = 0;

        foreach ($validated['enrollment_ids'] as $enrollmentId) {
            $enrollment = Enrollment::with(['subject', 'user'])->find($enrollmentId);

            // Skip if enrollment not found or teacher doesn't own the subject
            if (!$enrollment || optional($enrollment->subject)->user_id !== $teacher->id) {
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
     * Process intervention based on type.
     */
    private function processIntervention(Enrollment $enrollment, Intervention $intervention, array $validated, $teacher, bool $sendEmail)
    {
        $notificationType = $this->getNotificationType($validated['type']);

        // Create in-app notification
        $this->createNotification($enrollment, $intervention, $teacher, $notificationType);

        // If this is a task list, create the tasks
        if ($validated['type'] === 'task_list' && !empty($validated['tasks'])) {
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
        $studentName = optional($enrollment->user)->name ?? 'Student';
        $subjectName = optional($enrollment->subject)->name ?? 'your class';
        $teacherName = $teacher->name ?? 'Your Teacher';

        $titles = [
            'nudge' => '📚 Reminder from ' . $teacherName,
            'task' => '📋 New Goals Assigned by ' . $teacherName,
            'extension' => '⏰ Deadline Extension Granted',
            'agreement' => '📄 Academic Agreement Recorded',
            'meeting' => '💬 Intervention Meeting Logged',
            'general' => '� Notice from ' . $teacherName,
        ];

        $messages = [
            'nudge' => "Hi {$studentName}! This is a friendly reminder to stay on track with your academic goals in {$subjectName}. " .
                ($intervention->notes ? "Note: {$intervention->notes}" : "Keep up the great work!"),
            'task' => "Hi {$studentName}! Your teacher has assigned you goals for {$subjectName}. Please check your dashboard to view and complete them. " .
                ($intervention->notes ? "Note: {$intervention->notes}" : ""),
            'extension' => "Hi {$studentName}! You've been granted a deadline extension for {$subjectName}. " .
                ($intervention->notes ? "Details: {$intervention->notes}" : "Please use this time wisely."),
            'agreement' => "Hi {$studentName}! An academic agreement has been recorded for {$subjectName}. " .
                ($intervention->notes ? "Details: {$intervention->notes}" : "Please fulfill the agreed terms."),
            'meeting' => "Hi {$studentName}! A one-on-one intervention meeting has been logged for {$subjectName}. " .
                ($intervention->notes ? "Notes: {$intervention->notes}" : "Please follow up as discussed."),
            'general' => "Hi {$studentName}! You have a notification regarding {$subjectName}. " .
                ($intervention->notes ? $intervention->notes : "Please check with your teacher."),
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
     * Create task list items for the intervention.
     */
    private function createTasks(Intervention $intervention, array $tasks)
    {
        // Delete existing tasks for this intervention (in case of update)
        $intervention->tasks()->delete();

        // Create new tasks
        foreach ($tasks as $taskDescription) {
            InterventionTask::create([
                'intervention_id' => $intervention->id,
                'description' => $taskDescription,
                'is_completed' => false,
            ]);
        }

        // Reload tasks for email
        $intervention->load('tasks');
    }

    /**
     * Send email notification to the student.
     */
    private function sendEmailNotification(Enrollment $enrollment, Intervention $intervention, $teacher, string $notificationType)
    {
        try {
            $subjectName = optional($enrollment->subject)->name ?? 'your class';

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
}

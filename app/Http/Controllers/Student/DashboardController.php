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
            'schoolClass.subject',
            'schoolClass.teacher',
            'subject',
            'grades',
            'attendanceRecords',
            'intervention.tasks',
        ])
            ->where('user_id', $user->id)
            ->whereHas('subjectTeacher', function ($query) use ($currentSchoolYear) {
                $query->where('school_year', $currentSchoolYear);
            })
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
            ->with(['sender', 'intervention'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'message' => $n->message,
                'sender' => $n->sender?->name ?? 'System',
                'deadlineLabel' => $n->intervention?->deadline_at?->format('M d, Y h:i A'),
                'isRead' => $n->is_read,
                'createdAt' => $n->created_at->diffForHumans(),
                'createdAtFull' => $n->created_at->format('M d, Y h:i A'),
            ]);

        $unreadCount = StudentNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        // Build subject performance data
        $subjectPerformance = $enrollments->map(function ($enrollment) {
            $class = $enrollment->subjectTeacher ?? $enrollment->schoolClass;
            $subject = $class?->subject ?? $enrollment->subject;
            $teacher = $class?->teacher;

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
                'subjectId' => $class?->subject_id ?? $subject?->id,
                'name' => $subject?->subject_name ?? 'Unknown Subject',
                'section' => $class?->section ?? $subject?->section,
                'teacher' => $teacher?->name ?? 'N/A',
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
                $class = $enrollment?->subjectTeacher ?? $enrollment?->schoolClass;
                $subject = $class?->subject ?? $enrollment?->subject;

                return ($intervention->tasks ?? collect())->map(fn($task) => [
                    'id' => $task->id,
                    'description' => $task->description,
                    'isCompleted' => $task->is_completed,
                    'subject' => $subject?->subject_name ?? 'Unknown Subject',
                    'interventionId' => $intervention->id,
                ]);
            })
            ->where('isCompleted', false)
            ->take(5)
            ->values();

        // Build grade trend: use the last-updated subject's individual grade items
        // grouped by category, each converted to a percentage for accurate plotting
        $lastUpdatedEnrollment = $enrollments
            ->filter(fn($e) => $e->grades->isNotEmpty())
            ->sortByDesc(fn($e) => $e->grades->max('updated_at'))
            ->first();

        $gradeTrendData = [
            'subjectName' => null,
            'items' => [],
        ];

        if ($lastUpdatedEnrollment) {
            $trendClass = $lastUpdatedEnrollment->subjectTeacher ?? $lastUpdatedEnrollment->schoolClass;
            $trendSubject = $trendClass?->subject ?? $lastUpdatedEnrollment->subject;
            $gradeTrendData['subjectName'] = $trendSubject?->subject_name ?? 'Unknown Subject';

            $gradeTrendData['items'] = $lastUpdatedEnrollment->grades
                ->sortBy('created_at')
                ->values()
                ->map(function ($grade) {
                    $percentage = $grade->total_score > 0
                        ? round(($grade->score / $grade->total_score) * 100)
                        : null;
                    return [
                        'id' => $grade->id,
                        'name' => $grade->assignment_name,
                        'key' => $grade->assignment_key,
                        'score' => $grade->score,
                        'totalScore' => $grade->total_score,
                        'percentage' => $percentage,
                        'quarter' => $grade->quarter,
                    ];
                })
                ->toArray();
        }

        return Inertia::render('Student/Dashboard', [
            'student' => [
                'id' => $student?->id,
                'firstName' => $user->first_name ?: ($student?->student_name ? explode(' ', trim($student->student_name))[0] : 'Student'),
                'lastName' => $user->last_name ?: '',
                'fullName' => $user->name ?: ($student?->student_name ?? null),
                'displayName' => $student?->student_name ?: $user->name,
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
            'gradeTrend' => $gradeTrendData,
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

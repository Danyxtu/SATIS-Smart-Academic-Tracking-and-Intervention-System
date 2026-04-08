<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Intervention;
use App\Models\StudentNotification;
use App\Models\SystemSetting;
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

        // Get current and selected semester
        $currentSemester = SystemSetting::getCurrentSemester();
        $selectedSemester = $request->query('semester', $currentSemester);
        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();

        // Get all enrollments for this student with related data
        $allEnrollments = Enrollment::with([
            'subjectTeacher.subject',
            'subjectTeacher.teacher',
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
            $subjectSemester = $enrollment->subjectTeacher?->subject?->semester;
            return $subjectSemester == $selectedSemester;
        });

        // Count enrollments per semester for navigation
        $semester1Count = $allEnrollments->filter(fn($e) => ($e->subjectTeacher?->subject?->semester ?? '1') == '1')->count();
        $semester2Count = $allEnrollments->filter(fn($e) => ($e->subjectTeacher?->subject?->semester ?? '1') == '2')->count();

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
                'subjectId' => $enrollment->subjectTeacher?->subject_id,
                // Keep existing `subject_name` but also provide `name` to match mobile/front-end expectations
                'subject_name' => $enrollment->subjectTeacher?->subject?->subject_name ?? 'Unknown Subject',
                'name' => $enrollment->subjectTeacher?->subject?->subject_name ?? 'Unknown Subject',
                'section' => $enrollment->subjectTeacher?->subject?->section,
                'teacher_name' => $enrollment->subjectTeacher?->teacher
                    ? $enrollment->subjectTeacher->teacher->first_name . ' ' . $enrollment->subjectTeacher->teacher->last_name
                    : 'N/A',
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
                    'subject' => $enrollment?->subjectTeacher?->subject?->subject_name ?? 'Unknown',
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
            $trendSubject = $lastUpdatedEnrollment->subjectTeacher?->subject;
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
}

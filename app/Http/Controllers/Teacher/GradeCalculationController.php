<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SubjectTeacher;
use App\Services\GradeCalculationService;
use App\Support\Concerns\HasDefaultAssignments;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeCalculationController extends Controller
{
    use HasDefaultAssignments;

    protected GradeCalculationService $gradeCalculationService;

    public function __construct(GradeCalculationService $gradeCalculationService)
    {
        $this->gradeCalculationService = $gradeCalculationService;
    }

    /**
     * Calculate grades for a specific class
     */
    public function calculateClassGrades(Request $request, SubjectTeacher $subjectTeacher): JsonResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        // Load necessary relationships
        $subjectTeacher->load([
            'enrollments.user.student',
            'enrollments.grades',
        ]);

        // Build grade structure
        $gradeStructure = $this->buildGradeStructure($subjectTeacher->grade_categories);

        // Calculate grades for all students
        $calculatedGrades = $this->gradeCalculationService->calculateClassGrades(
            $subjectTeacher->enrollments,
            $gradeStructure
        );

        return response()->json([
            'success' => true,
            'data' => [
                'class_id' => $subjectTeacher->id,
                'class_name' => $subjectTeacher->grade_level . ' - ' . $subjectTeacher->section,
                'subject' => $subjectTeacher->subject->subject_name ?? 'N/A',
                'grade_structure' => $gradeStructure,
                'calculated_grades' => $calculatedGrades,
                'updated_at' => now()->toISOString(),
            ]
        ]);
    }

    /**
     * Calculate grades for a specific student
     */
    public function calculateStudentGrades(Request $request, SubjectTeacher $subjectTeacher, int $enrollmentId): JsonResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        // Find the specific enrollment
        $enrollment = $subjectTeacher->enrollments()
            ->with(['user.student', 'grades'])
            ->findOrFail($enrollmentId);

        // Build grade structure
        $gradeStructure = $this->buildGradeStructure($subjectTeacher->grade_categories);

        // Calculate grades for this student
        $calculatedGrades = $this->gradeCalculationService->calculateStudentGrades($enrollment, $gradeStructure);

        return response()->json([
            'success' => true,
            'data' => [
                'enrollment_id' => $enrollment->id,
                'student' => $enrollment->user->student,
                'calculated_grades' => $calculatedGrades,
                'updated_at' => now()->toISOString(),
            ]
        ]);
    }

    /**
     * Recalculate grades after bulk update
     */
    public function recalculateAfterUpdate(Request $request, SubjectTeacher $subjectTeacher): JsonResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $data = $request->validate([
            'enrollment_ids' => 'sometimes|array',
            'enrollment_ids.*' => 'integer|exists:enrollments,id',
        ]);

        // Load relationships
        $query = $subjectTeacher->enrollments()->with(['user.student', 'grades']);

        // If specific enrollment IDs provided, filter by them
        if (isset($data['enrollment_ids'])) {
            $query->whereIn('id', $data['enrollment_ids']);
        }

        $enrollments = $query->get();

        // Build grade structure
        $gradeStructure = $this->buildGradeStructure($subjectTeacher->grade_categories);

        // Calculate grades
        $calculatedGrades = $this->gradeCalculationService->calculateClassGrades($enrollments, $gradeStructure);

        return response()->json([
            'success' => true,
            'message' => 'Grades recalculated successfully',
            'data' => [
                'calculated_grades' => $calculatedGrades,
                'updated_at' => now()->toISOString(),
            ]
        ]);
    }
}

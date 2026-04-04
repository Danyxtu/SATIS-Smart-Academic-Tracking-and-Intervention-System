<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
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
     * Build per-quarter grade structure from the stored categories.
     */
    private function perQuarterGradeStructure(SchoolClass $subjectTeacher): array
    {
        $stored = $subjectTeacher->grade_categories ?? [];
        return [
            '1' => $this->buildGradeStructure($this->resolveQuarterCategories($stored, 1)),
            '2' => $this->buildGradeStructure($this->resolveQuarterCategories($stored, 2)),
        ];
    }

    /**
     * Calculate grades for a specific class
     */
    public function calculateClassGrades(Request $request, SchoolClass $subjectTeacher): JsonResponse
    {
        $this->ensureTeacherOwnsClass($request->user()->id, $subjectTeacher);

        // Load necessary relationships
        $subjectTeacher->load([
            'subject',
            'enrollments.user.student',
            'enrollments.grades',
        ]);

        // Build per-quarter grade structure
        $gradeStructure = $this->perQuarterGradeStructure($subjectTeacher);

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
    public function calculateStudentGrades(Request $request, SchoolClass $subjectTeacher, int $enrollmentId): JsonResponse
    {
        $this->ensureTeacherOwnsClass($request->user()->id, $subjectTeacher);

        // Find the specific enrollment
        $enrollment = $subjectTeacher->enrollments()
            ->with(['user.student', 'grades'])
            ->findOrFail($enrollmentId);

        // Build per-quarter grade structure
        $gradeStructure = $this->perQuarterGradeStructure($subjectTeacher);

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
    public function recalculateAfterUpdate(Request $request, SchoolClass $subjectTeacher): JsonResponse
    {
        $this->ensureTeacherOwnsClass($request->user()->id, $subjectTeacher);

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

        // Build per-quarter grade structure
        $gradeStructure = $this->perQuarterGradeStructure($subjectTeacher);

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

    private function ensureTeacherOwnsClass(int $teacherId, SchoolClass $schoolClass): void
    {
        if ((int) $schoolClass->teacher_id !== (int) $teacherId) {
            abort(403, 'You are not allowed to modify this class.');
        }
    }
}

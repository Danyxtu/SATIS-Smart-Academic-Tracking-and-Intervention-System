<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\SubjectTeacher;
use App\Support\Concerns\HasDefaultAssignments;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use RuntimeException;

class GradeController extends Controller
{
    use HasDefaultAssignments;

    private const STUDENT_COLUMN_ALIASES = [
        'name' => ['name', 'student_name', 'student name', 'full_name', 'full name'],
        'lrn' => ['lrn', 'student_lrn', 'student lrn', 'learner_reference_number', 'learner reference number'],
    ];

    public function bulkStore(Request $request, SubjectTeacher $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $structure = $this->buildGradeStructure($subjectTeacher->grade_categories);
        $assignments = collect($structure['assignments'])->keyBy('id');

        if ($assignments->isEmpty()) {
            return back()->withErrors([
                'grades' => 'Add at least one grading activity before saving scores.',
            ]);
        }

        $normalizedGrades = collect($request->input('grades', []))
            ->map(function ($grade) {
                if (array_key_exists('score', $grade) && $grade['score'] === '') {
                    $grade['score'] = null;
                }

                return $grade;
            })
            ->values()
            ->all();

        $request->merge(['grades' => $normalizedGrades]);

        $data = $request->validate([
            'grades' => 'required|array|min:1',
            'grades.*.enrollment_id' => 'required|integer',
            'grades.*.assignment_id' => 'required|string',
            'grades.*.score' => 'nullable|numeric|min:0',
            'grades.*.quarter' => 'nullable|integer|min:1|max:4',
        ]);

        $enrollmentIds = collect($data['grades'])->pluck('enrollment_id')->unique()->values();

        $enrollments = Enrollment::where('subject_teachers_id', $subjectTeacher->id)
            ->whereIn('id', $enrollmentIds)
            ->get()
            ->keyBy('id');

        $summary = [
            'updated' => 0,
            'cleared' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        foreach ($data['grades'] as $index => $gradePayload) {
            $enrollmentId = (int) $gradePayload['enrollment_id'];
            $assignmentId = (string) $gradePayload['assignment_id'];
            $assignment = $assignments->get($assignmentId);

            if (! $assignment) {
                $summary['skipped']++;
                $summary['errors'][] = "Row #" . ($index + 1) . ": Unknown assignment {$assignmentId}.";
                continue;
            }

            $enrollment = $enrollments->get($enrollmentId);

            if (! $enrollment) {
                $summary['skipped']++;
                $summary['errors'][] = "Row #" . ($index + 1) . ": Enrollment {$enrollmentId} does not belong to this section.";
                continue;
            }

            $quarter = $gradePayload['quarter'] ?? 1;
            $score = $gradePayload['score'];

            if ($score !== null && $score > $assignment['total']) {
                $summary['skipped']++;
                $summary['errors'][] = "Row #" . ($index + 1) . ": Score {$score} exceeds total {$assignment['total']} for {$assignment['label']}.";
                continue;
            }

            $gradeAttributes = [
                'enrollment_id' => $enrollment->id,
                'assignment_key' => $assignmentId,
                'quarter' => $quarter,
            ];

            if ($score === null || $score === '') {
                Grade::where($gradeAttributes)->delete();
                $summary['cleared']++;
                continue;
            }

            Grade::updateOrCreate(
                $gradeAttributes,
                [
                    'assignment_name' => $assignment['label'],
                    'score' => $score,
                    'total_score' => $assignment['total'],
                ]
            );

            $summary['updated']++;
        }

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', 'Grades updated successfully.')
            ->with('grade_update_summary', $summary);
    }

    public function import(Request $request, SubjectTeacher $subjectTeacher): RedirectResponse
    {
        $this->ensureTeacherOwnsSubjectTeacher($request->user()->id, $subjectTeacher);

        $request->validate([
            'grades_file' => 'required|file|mimes:csv,txt|max:4096',
        ]);

        $structure = $this->buildGradeStructure($subjectTeacher->grade_categories);
        $assignments = collect($structure['assignments']);

        if ($assignments->isEmpty()) {
            return back()->withErrors([
                'grades_file' => 'Add at least one grading activity before uploading scores.',
            ]);
        }

        try {
            $summary = $this->importGradesFromCsv($subjectTeacher, $request->file('grades_file'), $structure);
        } catch (RuntimeException $exception) {
            return back()->withErrors(['grades_file' => $exception->getMessage()]);
        }

        return redirect()
            ->route('teacher.classes.index')
            ->with('success', 'Grades uploaded successfully.')
            ->with('grade_import_summary', $summary);
    }

    private function importGradesFromCsv(SubjectTeacher $subjectTeacher, UploadedFile $file, array $structure): array
    {
        $rows = $this->readSpreadsheetRows($file);

        if (count($rows) === 0) {
            throw new RuntimeException('The uploaded grades file is empty.');
        }

        $headerRow = array_shift($rows);
        $assignments = collect($structure['assignments']);
        $assignmentsByLabel = $assignments->keyBy(function ($assignment) {
            return $this->normalizeHeaderValue($assignment['label']);
        });
        $assignmentsById = $assignments->keyBy('id');

        $columnMap = $this->buildGradeColumnMap($headerRow, $assignmentsByLabel->all(), $assignmentsById->all());

        if (! isset($columnMap['lrn'])) {
            throw new RuntimeException('Missing required column: LRN');
        }

        $summary = [
            'updated' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        foreach ($rows as $index => $row) {
            if ($this->rowIsEmpty($row)) {
                continue;
            }

            $rowNumber = $index + 2;
            $lrn = $this->sanitizeLrn($row[$columnMap['lrn']] ?? null);
            $name = isset($columnMap['name']) ? trim((string) ($row[$columnMap['name']] ?? '')) : null;

            $enrollment = $this->locateEnrollment($subjectTeacher, $lrn, $name);

            if (! $enrollment) {
                $summary['skipped']++;
                $summary['errors'][] = "Row {$rowNumber}: Unable to match student by LRN or Name.";
                continue;
            }

            foreach ($columnMap['assignments'] as $assignmentId => $colIndex) {
                $rawValue = $row[$colIndex] ?? null;

                if ($rawValue === null || $rawValue === '') {
                    continue;
                }

                if (! is_numeric($rawValue)) {
                    $summary['skipped']++;
                    $summary['errors'][] = "Row {$rowNumber}: Non-numeric grade for {$assignmentId}.";
                    continue;
                }

                $assignment = $assignmentsById->get($assignmentId);

                if (! $assignment) {
                    $summary['skipped']++;
                    $summary['errors'][] = "Row {$rowNumber}: Unknown assignment {$assignmentId}.";
                    continue;
                }

                $score = (float) $rawValue;

                if ($score > $assignment['total']) {
                    $summary['skipped']++;
                    $summary['errors'][] = "Row {$rowNumber}: Score {$score} exceeds total {$assignment['total']} for {$assignment['label']}.";
                    continue;
                }

                Grade::updateOrCreate(
                    [
                        'enrollment_id' => $enrollment->id,
                        'assignment_key' => $assignmentId,
                        'quarter' => 1,
                    ],
                    [
                        'assignment_name' => $assignment['label'],
                        'score' => $score,
                        'total_score' => $assignment['total'],
                    ]
                );

                $summary['updated']++;
            }
        }

        return $summary;
    }

    private function buildGradeColumnMap(array $headerRow, $assignmentsByLabel, $assignmentsById): array
    {
        $map = [
            'assignments' => [],
        ];

        foreach ($headerRow as $index => $value) {
            $normalized = $this->normalizeHeaderValue($value);
            $originalValue = trim((string) $value);

            // Check for student column aliases (name, lrn)
            foreach (self::STUDENT_COLUMN_ALIASES as $key => $aliases) {
                if (in_array($normalized, $aliases, true)) {
                    $map[$key] = $index;
                }
            }

            // Match assignments by normalized label
            foreach ($assignmentsByLabel as $normalizedLabel => $assignment) {
                if ($normalized === $normalizedLabel) {
                    $map['assignments'][$assignment['id']] = $index;
                    break;
                }
            }

            // If not matched yet, try matching by assignment ID directly
            if (!isset($map['assignments'][$normalized])) {
                foreach ($assignmentsById as $assignmentId => $assignment) {
                    if ($normalized === $this->normalizeHeaderValue($assignmentId)) {
                        $map['assignments'][$assignmentId] = $index;
                        break;
                    }
                }
            }

            // Additional fallback: match by original label (case-insensitive)
            if (empty(array_filter($map['assignments'], fn($colIdx) => $colIdx === $index))) {
                foreach ($assignmentsById as $assignmentId => $assignment) {
                    $assignmentLabel = strtolower(trim($assignment['label']));
                    $headerLabel = strtolower($originalValue);

                    if ($assignmentLabel === $headerLabel) {
                        $map['assignments'][$assignmentId] = $index;
                        break;
                    }
                }
            }
        }

        if (empty($map['assignments'])) {
            $availableAssignments = collect($assignmentsById)->pluck('label')->implode(', ');
            $csvHeaders = implode(', ', array_map('trim', $headerRow));
            throw new RuntimeException("No assignment columns detected. CSV headers: [{$csvHeaders}]. Expected assignments: [{$availableAssignments}]. Make sure your CSV column names match your assignment/task names.");
        }

        return $map;
    }

    private function locateEnrollment(SubjectTeacher $subjectTeacher, ?string $lrn, ?string $name): ?Enrollment
    {
        $query = Enrollment::with(['user.student'])
            ->where('subject_teachers_id', $subjectTeacher->id);

        if ($lrn) {
            return (clone $query)
                ->whereHas('user.student', fn($q) => $q->where('lrn', $lrn))
                ->first();
        }

        if ($name) {
            $normalized = Str::lower(preg_replace('/\s+/', ' ', trim($name)));

            return (clone $query)
                ->where(function ($builder) use ($normalized) {
                    $builder
                        ->whereHas('user', function ($q) use ($normalized) {
                            $q->whereRaw('LOWER(TRIM(name)) = ?', [$normalized]);
                        })
                        ->orWhereHas('user.student', function ($q) use ($normalized) {
                            $q->whereRaw('LOWER(TRIM(CONCAT(first_name, \' \', last_name))) = ?', [$normalized]);
                        });
                })
                ->first();
        }

        return null;
    }

    private function readSpreadsheetRows(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension() ?? '');

        if (in_array($extension, ['xlsx', 'xls'], true)) {
            throw new RuntimeException('Excel uploads require PHP ext-zip and ext-gd. Convert the sheet to CSV or enable the extensions before retrying.');
        }

        $handle = fopen($file->getRealPath(), 'r');

        if (! $handle) {
            throw new RuntimeException('Unable to read the uploaded file.');
        }

        $rows = [];

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            $rows[] = array_map(fn($value) => is_string($value) ? trim($value) : $value, $row);
        }

        fclose($handle);

        return $rows;
    }

    private function normalizeHeaderValue(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        return Str::snake(strtolower(trim($value)));
    }

    private function sanitizeLrn(?string $lrn): ?string
    {
        if ($lrn === null) {
            return null;
        }

        $digits = preg_replace('/[^0-9]/', '', $lrn);

        return $digits !== '' ? $digits : null;
    }

    private function rowIsEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function ensureTeacherOwnsSubjectTeacher(int $teacherId, SubjectTeacher $subjectTeacher): void
    {
        if ($subjectTeacher->teacher_id !== $teacherId) {
            abort(403, 'You are not allowed to modify this class.');
        }
    }
}

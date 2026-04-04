<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    /**
     * Display a listing of subjects.
     */
    public function index(Request $request): Response
    {
        $this->authorize('manage-subjects');

        $query = Subject::query()->withCount('subjectTeachers');

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));

            $query->where(function ($builder) use ($search) {
                $builder->where('subject_name', 'like', "%{$search}%")
                    ->orWhere('subject_code', 'like', "%{$search}%");
            });
        }

        $subjects = $query
            ->orderBy('subject_name')
            ->paginate(10)
            ->withQueryString();

        $subjects->setCollection(
            $subjects->getCollection()->map(function (Subject $subject) {
                return [
                    'id' => $subject->id,
                    'subject_name' => $subject->subject_name,
                    'subject_code' => $subject->subject_code,
                    'classes_count' => (int) ($subject->subject_teachers_count ?? 0),
                    'created_at' => $subject->created_at?->toIso8601String(),
                    'updated_at' => $subject->updated_at?->toIso8601String(),
                ];
            })
        );

        return Inertia::render('SuperAdmin/Subjects/Index', [
            'subjects' => $subjects,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created subject.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create-subject');

        $validated = $request->validate($this->validationRules());

        $subject = Subject::create([
            'subject_name' => $this->normalizeText($validated['subject_name']),
            'subject_code' => strtoupper($this->normalizeText($validated['subject_code'])),
        ]);

        return redirect()
            ->route('superadmin.subjects.index')
            ->with('success', "Subject {$subject->subject_name} created successfully.");
    }

    /**
     * Update the specified subject.
     */
    public function update(Request $request, Subject $subject): RedirectResponse
    {
        $this->authorize('update-subject');

        $validated = $request->validate($this->validationRules($subject));

        $subject->update([
            'subject_name' => $this->normalizeText($validated['subject_name']),
            'subject_code' => strtoupper($this->normalizeText($validated['subject_code'])),
        ]);

        return redirect()
            ->route('superadmin.subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    /**
     * Remove the specified subject.
     */
    public function destroy(Subject $subject): RedirectResponse
    {
        $this->authorize('delete-subject');

        if ($subject->subjectTeachers()->exists()) {
            return back()->with('error', 'Cannot delete subject assigned to active classes.');
        }

        $subject->delete();

        return redirect()
            ->route('superadmin.subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }

    /**
     * Build validation rules for create and update actions.
     *
     * @return array<string, array<int, \Illuminate\Contracts\Validation\ValidationRule|string>>
     */
    private function validationRules(?Subject $subject = null): array
    {
        $subjectNameUniqueRule = Rule::unique('subjects', 'subject_name');
        $subjectCodeUniqueRule = Rule::unique('subjects', 'subject_code');

        if ($subject !== null) {
            $subjectNameUniqueRule->ignore($subject->id);
            $subjectCodeUniqueRule->ignore($subject->id);
        }

        return [
            'subject_name' => [
                'required',
                'string',
                'max:255',
                $subjectNameUniqueRule,
            ],
            'subject_code' => [
                'required',
                'string',
                'max:100',
                'regex:/^[A-Za-z0-9\s\-]+$/',
                $subjectCodeUniqueRule,
            ],
        ];
    }

    /**
     * Normalize whitespace in plain text inputs.
     */
    private function normalizeText(string $value): string
    {
        return preg_replace('/\s+/', ' ', trim($value)) ?? trim($value);
    }
}

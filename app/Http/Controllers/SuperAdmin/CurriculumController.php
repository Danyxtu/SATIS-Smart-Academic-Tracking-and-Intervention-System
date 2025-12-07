<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\MasterSubject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CurriculumController extends Controller
{
    /**
     * Display a listing of master subjects.
     */
    public function index(Request $request): Response
    {
        $query = MasterSubject::with(['prerequisites:id,code,name', 'creator:id,name'])
            ->withCount('subjects');

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Filter by strand
        if ($request->filled('strand')) {
            $query->where('strand', $request->input('strand'));
        }

        // Filter by grade level
        if ($request->filled('grade_level')) {
            $query->where('grade_level', $request->input('grade_level'));
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('is_active', $request->input('status') === 'active');
        }

        $subjects = $query->orderBy('grade_level')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Get unique strands and grade levels for filters
        $strands = MasterSubject::distinct()->pluck('strand')->filter()->values();
        $gradeLevels = MasterSubject::distinct()->pluck('grade_level')->filter()->values();

        return Inertia::render('SuperAdmin/Curriculum/Index', [
            'subjects' => $subjects,
            'strands' => $strands,
            'gradeLevels' => $gradeLevels,
            'filters' => $request->only(['search', 'strand', 'grade_level', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new master subject.
     */
    public function create(): Response
    {
        $availablePrerequisites = MasterSubject::active()
            ->select('id', 'code', 'name', 'grade_level', 'strand')
            ->orderBy('grade_level')
            ->orderBy('name')
            ->get();

        return Inertia::render('SuperAdmin/Curriculum/Create', [
            'availablePrerequisites' => $availablePrerequisites,
            'strandOptions' => ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL-ICT', 'TVL-HE', 'TVL-IA', 'TVL-AFA'],
            'trackOptions' => ['Academic', 'TVL'],
            'gradeLevelOptions' => ['Grade 11', 'Grade 12'],
            'semesterOptions' => [
                ['value' => '1', 'label' => '1st Semester'],
                ['value' => '2', 'label' => '2nd Semester'],
                ['value' => 'full_year', 'label' => 'Full Year'],
            ],
        ]);
    }

    /**
     * Store a newly created master subject.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:master_subjects,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'grade_level' => ['nullable', 'string', 'max:50'],
            'strand' => ['nullable', 'string', 'max:50'],
            'track' => ['nullable', 'string', 'max:50'],
            'semester' => ['required', 'in:1,2,full_year'],
            'units' => ['required', 'numeric', 'min:0.5', 'max:10'],
            'is_active' => ['boolean'],
            'prerequisites' => ['nullable', 'array'],
            'prerequisites.*.id' => ['required', 'exists:master_subjects,id'],
            'prerequisites.*.minimum_grade' => ['required', 'integer', 'min:50', 'max:100'],
        ]);

        $subject = MasterSubject::create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'grade_level' => $validated['grade_level'] ?? null,
            'strand' => $validated['strand'] ?? null,
            'track' => $validated['track'] ?? null,
            'semester' => $validated['semester'],
            'units' => $validated['units'],
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => Auth::id(),
        ]);

        // Attach prerequisites
        if (!empty($validated['prerequisites'])) {
            foreach ($validated['prerequisites'] as $prereq) {
                $subject->prerequisites()->attach($prereq['id'], [
                    'minimum_grade' => $prereq['minimum_grade'],
                ]);
            }
        }

        return redirect()
            ->route('superadmin.curriculum.index')
            ->with('success', 'Subject created successfully.');
    }

    /**
     * Display the specified master subject.
     */
    public function show(MasterSubject $curriculum): Response
    {
        $curriculum->load([
            'prerequisites:id,code,name,grade_level',
            'requiredFor:id,code,name,grade_level',
            'creator:id,name',
        ]);
        $curriculum->loadCount('subjects');

        return Inertia::render('SuperAdmin/Curriculum/Show', [
            'subject' => [
                'id' => $curriculum->id,
                'code' => $curriculum->code,
                'name' => $curriculum->name,
                'description' => $curriculum->description,
                'grade_level' => $curriculum->grade_level,
                'strand' => $curriculum->strand,
                'track' => $curriculum->track,
                'semester' => $curriculum->semester,
                'units' => $curriculum->units,
                'is_active' => $curriculum->is_active,
                'created_by' => $curriculum->creator?->name ?? 'System',
                'created_at' => $curriculum->created_at->format('M d, Y'),
                'subjects_count' => $curriculum->subjects_count,
                'prerequisites' => $curriculum->prerequisites->map(fn($p) => [
                    'id' => $p->id,
                    'code' => $p->code,
                    'name' => $p->name,
                    'grade_level' => $p->grade_level,
                    'minimum_grade' => $p->pivot->minimum_grade,
                ]),
                'required_for' => $curriculum->requiredFor->map(fn($r) => [
                    'id' => $r->id,
                    'code' => $r->code,
                    'name' => $r->name,
                    'grade_level' => $r->grade_level,
                ]),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified master subject.
     */
    public function edit(MasterSubject $curriculum): Response
    {
        $curriculum->load('prerequisites:id,code,name');

        $availablePrerequisites = MasterSubject::active()
            ->where('id', '!=', $curriculum->id)
            ->select('id', 'code', 'name', 'grade_level', 'strand')
            ->orderBy('grade_level')
            ->orderBy('name')
            ->get();

        return Inertia::render('SuperAdmin/Curriculum/Edit', [
            'subject' => [
                'id' => $curriculum->id,
                'code' => $curriculum->code,
                'name' => $curriculum->name,
                'description' => $curriculum->description,
                'grade_level' => $curriculum->grade_level,
                'strand' => $curriculum->strand,
                'track' => $curriculum->track,
                'semester' => $curriculum->semester,
                'units' => $curriculum->units,
                'is_active' => $curriculum->is_active,
                'prerequisites' => $curriculum->prerequisites->map(fn($p) => [
                    'id' => $p->id,
                    'minimum_grade' => $p->pivot->minimum_grade,
                ]),
            ],
            'availablePrerequisites' => $availablePrerequisites,
            'strandOptions' => ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL-ICT', 'TVL-HE', 'TVL-IA', 'TVL-AFA'],
            'trackOptions' => ['Academic', 'TVL'],
            'gradeLevelOptions' => ['Grade 11', 'Grade 12'],
            'semesterOptions' => [
                ['value' => '1', 'label' => '1st Semester'],
                ['value' => '2', 'label' => '2nd Semester'],
                ['value' => 'full_year', 'label' => 'Full Year'],
            ],
        ]);
    }

    /**
     * Update the specified master subject.
     */
    public function update(Request $request, MasterSubject $curriculum): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('master_subjects')->ignore($curriculum->id)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'grade_level' => ['nullable', 'string', 'max:50'],
            'strand' => ['nullable', 'string', 'max:50'],
            'track' => ['nullable', 'string', 'max:50'],
            'semester' => ['required', 'in:1,2,full_year'],
            'units' => ['required', 'numeric', 'min:0.5', 'max:10'],
            'is_active' => ['boolean'],
            'prerequisites' => ['nullable', 'array'],
            'prerequisites.*.id' => ['required', 'exists:master_subjects,id'],
            'prerequisites.*.minimum_grade' => ['required', 'integer', 'min:50', 'max:100'],
        ]);

        $curriculum->update([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'grade_level' => $validated['grade_level'] ?? null,
            'strand' => $validated['strand'] ?? null,
            'track' => $validated['track'] ?? null,
            'semester' => $validated['semester'],
            'units' => $validated['units'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Sync prerequisites
        $prerequisites = [];
        if (!empty($validated['prerequisites'])) {
            foreach ($validated['prerequisites'] as $prereq) {
                $prerequisites[$prereq['id']] = ['minimum_grade' => $prereq['minimum_grade']];
            }
        }
        $curriculum->prerequisites()->sync($prerequisites);

        return redirect()
            ->route('superadmin.curriculum.index')
            ->with('success', 'Subject updated successfully.');
    }

    /**
     * Remove the specified master subject.
     */
    public function destroy(MasterSubject $curriculum): RedirectResponse
    {
        // Check if subject is linked to any classes
        if ($curriculum->subjects()->count() > 0) {
            return back()->with('error', 'Cannot delete subject that is linked to teacher classes.');
        }

        // Check if subject is a prerequisite for others
        if ($curriculum->requiredFor()->count() > 0) {
            return back()->with('error', 'Cannot delete subject that is a prerequisite for other subjects.');
        }

        $curriculum->delete();

        return redirect()
            ->route('superadmin.curriculum.index')
            ->with('success', 'Subject deleted successfully.');
    }

    /**
     * Toggle subject active status.
     */
    public function toggleStatus(MasterSubject $curriculum): RedirectResponse
    {
        $curriculum->update(['is_active' => !$curriculum->is_active]);

        $status = $curriculum->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Subject {$status} successfully.");
    }
}

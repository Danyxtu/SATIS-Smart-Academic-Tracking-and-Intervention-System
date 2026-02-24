<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Intervention;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class InterventionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
            'type' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $enrollment = Enrollment::with(['subjectTeacher', 'user'])->findOrFail($validated['enrollment_id']);

        if (optional($enrollment->subjectTeacher)->teacher_id !== $request->user()->id) {
            abort(403, 'You are not authorized to start an intervention for this student.');
        }

        Intervention::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'status' => 'active',
            ],
            [
                'type' => $validated['type'],
                'notes' => $validated['notes'] ?? '',
            ]
        );

        return Redirect::back()->with(
            'success',
            sprintf('Intervention for %s is now active.', optional($enrollment->user)->name ?? 'the student')
        );
    }
}

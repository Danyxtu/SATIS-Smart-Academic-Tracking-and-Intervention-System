<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SchoolTrack;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SchoolTrackController extends Controller
{
    /**
     * Display a listing of school tracks.
     */
    public function index(Request $request): Response
    {
        $this->authorize('manage-departments');

        $search = trim((string) $request->input('search', ''));
        $schoolYear = trim((string) $request->input('school_year', ''));

        $query = SchoolTrack::query()
            ->withCount('departments')
            ->with([
                'departments' => function ($builder) {
                    $builder
                        ->select([
                            'id',
                            'department_name',
                            'department_code',
                            'description',
                            'is_active',
                            'school_track_id',
                        ])
                        ->withCount(['admins', 'teachers', 'students'])
                        ->orderBy('department_name');
                },
            ]);

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('track_name', 'like', "%{$search}%")
                    ->orWhere('track_code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($schoolYear !== '') {
            $query->where('school_year', $schoolYear);
        }

        $schoolTracks = $query
            ->orderBy('track_name')
            ->paginate(10)
            ->withQueryString();

        $schoolTracks->setCollection(
            $schoolTracks->getCollection()->map(function (SchoolTrack $track): array {
                return [
                    'id' => $track->id,
                    'track_name' => $track->track_name,
                    'track_code' => $track->track_code,
                    'school_year' => $track->school_year,
                    'description' => $track->description,
                    'departments_count' => (int) ($track->departments_count ?? 0),
                    'departments' => $track->departments->map(function ($department): array {
                        return [
                            'id' => $department->id,
                            'department_name' => $department->department_name,
                            'department_code' => $department->department_code,
                            'description' => $department->description,
                            'is_active' => (bool) $department->is_active,
                            'admins_count' => (int) ($department->admins_count ?? 0),
                            'teachers_count' => (int) ($department->teachers_count ?? 0),
                            'students_count' => (int) ($department->students_count ?? 0),
                        ];
                    })->values()->all(),
                    'created_at' => $track->created_at?->toIso8601String(),
                    'updated_at' => $track->updated_at?->toIso8601String(),
                ];
            })
        );

        $schoolYears = SchoolTrack::query()
            ->select('school_year')
            ->whereNotNull('school_year')
            ->where('school_year', '!=', '')
            ->distinct()
            ->orderByDesc('school_year')
            ->pluck('school_year')
            ->values();

        return Inertia::render('SuperAdmin/SchoolTracks/Index', [
            'schoolTracks' => $schoolTracks,
            'schoolYears' => $schoolYears,
            'filters' => [
                'search' => $search,
                'school_year' => $schoolYear,
            ],
            'currentSchoolYear' => SystemSetting::getCurrentSchoolYear(),
        ]);
    }

    /**
     * Store a newly created school track.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create-department');

        $validated = $request->validate([
            'track_name' => ['required', 'string', 'max:255', 'unique:school_tracks,track_name'],
            'track_code' => ['required', 'string', 'max:30', 'regex:/^[A-Za-z0-9_\-]+$/', 'unique:school_tracks,track_code'],
            'school_year' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        SchoolTrack::create([
            'track_name' => trim($validated['track_name']),
            'track_code' => strtoupper(trim($validated['track_code'])),
            'school_year' => trim((string) ($validated['school_year'] ?? SystemSetting::getCurrentSchoolYear())),
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('superadmin.school-tracks.index')
            ->with('success', 'School track created successfully.');
    }

    /**
     * Update the specified school track.
     */
    public function update(Request $request, SchoolTrack $schoolTrack): RedirectResponse
    {
        $this->authorize('update-department');

        $validated = $request->validate([
            'track_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('school_tracks', 'track_name')->ignore($schoolTrack->id),
            ],
            'track_code' => [
                'required',
                'string',
                'max:30',
                'regex:/^[A-Za-z0-9_\-]+$/',
                Rule::unique('school_tracks', 'track_code')->ignore($schoolTrack->id),
            ],
            'school_year' => ['required', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $schoolTrack->update([
            'track_name' => trim($validated['track_name']),
            'track_code' => strtoupper(trim($validated['track_code'])),
            'school_year' => trim($validated['school_year']),
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('superadmin.school-tracks.index')
            ->with('success', 'School track updated successfully.');
    }

    /**
     * Remove the specified school track.
     */
    public function destroy(SchoolTrack $schoolTrack): RedirectResponse
    {
        $this->authorize('delete-department');

        $departmentsWithClassesCount = $schoolTrack->departments()
            ->whereHas('sections.classes')
            ->count();

        if ($departmentsWithClassesCount > 0) {
            return back()->with(
                'error',
                'Cannot delete this school track because it is already used by department classes.',
            );
        }

        $schoolTrack->delete();

        return redirect()
            ->route('superadmin.school-tracks.index')
            ->with('success', 'School track deleted successfully.');
    }
}

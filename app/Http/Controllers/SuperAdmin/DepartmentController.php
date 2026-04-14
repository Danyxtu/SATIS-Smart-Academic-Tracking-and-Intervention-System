<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Mail\TemporaryCredentials;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\SchoolClass;
use App\Models\SchoolTrack;
use App\Models\Section;
use App\Models\Specialization;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    /**
     * Display a listing of departments.
     */
    public function index(Request $request): Response
    {
        $this->authorize('manage-departments');

        $trackOptions = SchoolTrack::query()
            ->orderBy('id')
            ->get(['id', 'track_name', 'track_code']);

        $trackFilter = trim((string) $request->input('track', 'all'));
        $validTrackIds = $trackOptions
            ->pluck('id')
            ->map(fn($id) => (string) $id)
            ->all();

        $resolvedTrackFilter = in_array($trackFilter, $validTrackIds, true)
            ? $trackFilter
            : 'all';

        $query = Department::withCount(['admins', 'teachers', 'students'])
            ->with([
                'admins:id,first_name,middle_name,last_name,personal_email,department_id',
                'admins.roles:id,name',
                'teachers:id,first_name,middle_name,last_name,personal_email,department_id',
                'teachers.roles:id,name',
                'specializations:id,specialization_name',
                'schoolTrack:id,track_name,track_code',
            ]);

        if ($resolvedTrackFilter !== 'all') {
            $query->where('school_track_id', (int) $resolvedTrackFilter);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('department_name', 'like', "%{$search}%")
                    ->orWhere('department_code', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('is_active', $request->input('status') === 'active');
        }

        if ($resolvedTrackFilter === 'all') {
            $query->orderByRaw('school_track_id IS NULL')->orderBy('school_track_id')->orderBy('department_name');
        } else {
            $query->orderBy('department_name');
        }

        $departments = $query->paginate(10)->withQueryString();

        $departments->setCollection(
            $departments->getCollection()->map(function (Department $department) {
                $primaryAdmin = $department->admins->first();

                $department->setAttribute('department_admin', $primaryAdmin ? [
                    'id' => $primaryAdmin->id,
                    'name' => $primaryAdmin->name,
                    'email' => $primaryAdmin->email,
                    'roles' => $primaryAdmin->roles->pluck('name')->values(),
                    'is_superadmin' => $primaryAdmin->roles->contains('name', 'super_admin'),
                ] : null);

                $department->setAttribute('track', $department->schoolTrack?->track_name ?: ($department->track ?: null));
                $department->setAttribute('school_track_id', $department->school_track_id);
                $department->setAttribute('school_track', $department->schoolTrack ? [
                    'id' => $department->schoolTrack->id,
                    'track_name' => $department->schoolTrack->track_name,
                    'track_code' => $department->schoolTrack->track_code,
                ] : null);

                $department->setAttribute('department_admins', $department->admins->map(fn($admin) => [
                    'id' => $admin->id,
                    'first_name' => $admin->first_name,
                    'middle_name' => $admin->middle_name,
                    'last_name' => $admin->last_name,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'roles' => $admin->roles->pluck('name')->values(),
                    'is_superadmin' => $admin->roles->contains('name', 'super_admin'),
                ])->values());

                $department->setAttribute('department_teachers', $department->teachers->map(fn($t) => [
                    'id'          => $t->id,
                    'first_name'  => $t->first_name,
                    'middle_name' => $t->middle_name,
                    'last_name'   => $t->last_name,
                    'email'       => $t->email,
                    'is_admin'    => $department->admins->contains('id', $t->id),
                    'roles'       => $t->roles->pluck('name')->values(),
                    'is_superadmin' => $t->roles->contains('name', 'super_admin'),
                ])->values());

                $department->setAttribute('specializations', $department->specializations->map(fn(Specialization $specialization) => [
                    'id' => (int) $specialization->id,
                    'specialization_name' => $specialization->specialization_name,
                ])->values());

                return $department;
            })
        );

        return Inertia::render('SuperAdmin/Departments/Index', [
            'departments' => $departments,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
                'track' => $resolvedTrackFilter,
            ],
            'trackOptions' => $trackOptions->map(fn(SchoolTrack $track) => [
                'value' => (string) $track->id,
                'label' => $track->track_name,
                'track_code' => $track->track_code,
            ])->values(),
        ]);
    }

    /**
     * Return teachers with no department assigned.
     */
    public function unassignedTeachers(): JsonResponse
    {
        $teachers = User::whereNull('department_id')
            ->whereHas('roles', fn($q) => $q->where('name', 'teacher'))
            ->with('roles:id,name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'personal_email'])
            ->map(fn(User $teacher) => [
                'id' => (int) $teacher->id,
                'first_name' => $teacher->first_name,
                'middle_name' => $teacher->middle_name,
                'last_name' => $teacher->last_name,
                'email' => $teacher->email,
                'personal_email' => $teacher->personal_email,
                'roles' => $teacher->roles->pluck('name')->values(),
                'is_superadmin' => $teacher->roles->contains('name', 'super_admin'),
            ])
            ->values();

        return response()->json($teachers);
    }

    /**
     * Store a newly created department.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create-department');
        $validated = $request->validate([
            'department_name' => ['required', 'string', 'max:255'],
            'department_code' => ['required', 'string', 'max:50', 'unique:departments,department_code'],
            'school_track_id' => ['required', 'integer', Rule::exists('school_tracks', 'id')],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
            'teacher_ids'   => ['nullable', 'array'],
            'teacher_ids.*' => ['exists:users,id'],
            'admin_id'      => ['nullable', 'exists:users,id'],
            'specialization_names' => ['nullable', 'array'],
            'specialization_names.*' => ['required', 'string', 'max:120'],
        ]);

        $schoolTrack = SchoolTrack::findOrFail($validated['school_track_id']);

        $department = Department::create([
            'department_name' => $validated['department_name'],
            'department_code' => $validated['department_code'],
            'track' => $schoolTrack->track_name,
            'school_track_id' => $schoolTrack->id,
            'description'     => $validated['description'] ?? null,
            'is_active'       => $validated['is_active'] ?? true,
        ]);

        $teacherIds = $validated['teacher_ids'] ?? [];
        if (!empty($teacherIds)) {
            User::whereIn('id', $teacherIds)
                ->update(['department_id' => $department->id]);
        }

        if (!empty($validated['admin_id'])) {
            $adminUser = User::find($validated['admin_id']);
            if ($adminUser) {
                $adminUser->update(['department_id' => $department->id]);
                $adminUser->syncRolesByName(['teacher', 'admin']);
            }
        }

        $this->syncDepartmentSpecializations(
            $department,
            $validated['specialization_names'] ?? [],
        );

        return redirect()
            ->route('superadmin.departments.index', [
                'track' => (string) $schoolTrack->id,
            ])
            ->with('success', 'Department created successfully.');
    }

    /**
     * Display the specified department.
     */
    // public function show(Department $department): Response
    // {
    //     $this->authorize('manage-departments');

    //     $department->loadCount(['admins', 'teachers', 'students']);

    //     $admins = $department->admins()
    //         ->latest()
    //         ->get()
    //         ->map(fn($user) => [
    //             'id' => $user->id,
    //             'name' => $user->first_name . ' ' . $user->last_name,
    //             'email' => $user->email,
    //             'created_at' => $user->created_at->format('M d, Y'),
    //         ]);

    //     $teacherCount = $department->teachers()->count();
    //     $studentCount = $department->students()->count();

    //     return Inertia::render('SuperAdmin/Departments/Show', [
    //         'department' => [
    //             'id' => $department->id,
    //             'name' => $department->department_name,
    //             'code' => $department->department_code,
    //             'description' => $department->description,
    //             'is_active' => $department->is_active,
    //             'created_at' => $department->created_at->format('M d, Y'),
    //             'admins_count' => $department->admins_count,
    //             'teachers_count' => $teacherCount,
    //             'students_count' => $studentCount,
    //         ],
    //         'admins' => $admins,
    //     ]);
    // }

    /**
     * Show the form for editing the specified department.
     */
    public function edit(Department $department): Response
    {
        $this->authorize('update-department');

        $department->loadCount(['admins', 'teachers', 'students'])
            ->load('specializations:id,specialization_name');

        return Inertia::render('SuperAdmin/Departments/Edit', [
            'department' => [
                'id' => $department->id,
                'name' => $department->department_name,
                'code' => $department->department_code,
                'track' => $department->track,
                'school_track_id' => $department->school_track_id,
                'description' => $department->description,
                'is_active' => $department->is_active,
                'admins_count' => $department->admins_count,
                'teachers_count' => $department->teachers_count,
                'students_count' => $department->students_count,
                'specializations' => $department->specializations->map(fn(Specialization $specialization) => [
                    'id' => (int) $specialization->id,
                    'specialization_name' => $specialization->specialization_name,
                ])->values(),
            ],
        ]);
    }

    /**
     * Return teachers belonging to a department + unassigned teachers (for edit modal).
     */
    public function departmentTeachers(Department $department): JsonResponse
    {
        $teachers = User::where(function ($q) use ($department) {
            $q->where('department_id', $department->id)
                ->orWhereNull('department_id');
        })
            ->whereHas('roles', fn($q) => $q->where('name', 'teacher'))
            ->with('roles:id,name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'personal_email', 'department_id'])
            ->map(fn(User $teacher) => [
                'id' => (int) $teacher->id,
                'first_name' => $teacher->first_name,
                'middle_name' => $teacher->middle_name,
                'last_name' => $teacher->last_name,
                'email' => $teacher->email,
                'personal_email' => $teacher->personal_email,
                'department_id' => $teacher->department_id,
                'roles' => $teacher->roles->pluck('name')->values(),
                'is_superadmin' => $teacher->roles->contains('name', 'super_admin'),
            ])
            ->values();

        $adminId = User::where('department_id', $department->id)
            ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
            ->value('id');

        return response()->json([
            'teachers' => $teachers,
            'admin_id' => $adminId,
        ]);
    }

    /**
     * Create a teacher account directly under a department.
     */
    public function storeDepartmentTeacher(Request $request, Department $department): JsonResponse
    {
        $this->authorize('update-department');

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,personal_email'],
        ]);

        $tempPassword = Str::random(12);

        $teacher = User::create([
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'personal_email' => $validated['email'],
            'temporary_password' => $tempPassword,
            'password' => Hash::make($tempPassword),
            'department_id' => $department->id,
            'must_change_password' => true,
            'status' => 'active',
            'created_by' => $request->user()?->id,
            'username' => null,
        ]);

        $teacher->syncRolesByName(['teacher']);

        try {
            Mail::to($teacher->email)->send(new TemporaryCredentials(
                user: $teacher,
                plainPassword: $tempPassword,
                issuedBy: $request->user(),
                context: 'new teacher account',
            ));
        } catch (\Throwable $exception) {
            report($exception);

            $teacher->roles()->detach();
            $teacher->delete();

            return response()->json([
                'message' => 'Unable to send temporary credentials email. Please try again.',
            ], 500);
        }

        return response()->json([
            'message' => 'Teacher created successfully. Temporary credentials were sent via email.',
            'teacher' => [
                'id' => (int) $teacher->id,
                'first_name' => $teacher->first_name,
                'middle_name' => $teacher->middle_name,
                'last_name' => $teacher->last_name,
                'name' => $teacher->name,
                'email' => $teacher->email,
                'personal_email' => $teacher->personal_email,
                'department_id' => (int) $teacher->department_id,
                'roles' => ['teacher'],
                'is_superadmin' => false,
            ],
        ], 201);
    }

    /**
     * Update the specified department.
     */
    public function update(Request $request, Department $department): RedirectResponse
    {
        $this->authorize('update-department');

        $validated = $request->validate([
            'department_name' => ['required', 'string', 'max:255'],
            'department_code' => ['required', 'string', 'max:50', Rule::unique('departments')->ignore($department->id)],
            'school_track_id' => ['nullable', 'integer', Rule::exists('school_tracks', 'id')],
            'description'     => ['nullable', 'string', 'max:1000'],
            'is_active'       => ['boolean'],
            'teacher_ids'     => ['nullable', 'array'],
            'teacher_ids.*'   => ['exists:users,id'],
            'admin_id'        => ['nullable', 'exists:users,id'],
            'reassign_teacher_department_ids' => ['nullable', 'array'],
            'reassign_teacher_department_ids.*' => ['nullable', 'exists:departments,id'],
            'specialization_names' => ['nullable', 'array'],
            'specialization_names.*' => ['required', 'string', 'max:120'],
        ]);

        $selectedTrackId = $validated['school_track_id'] ?? $department->school_track_id;
        $schoolTrack = $selectedTrackId
            ? SchoolTrack::find($selectedTrackId)
            : null;

        if (! $schoolTrack) {
            $schoolTrack = SchoolTrack::query()->orderBy('id')->first();
        }

        if (! $schoolTrack) {
            return back()->withErrors([
                'school_track_id' => 'Please create at least one school track before updating departments.',
            ]);
        }

        $department->update([
            'department_name' => $validated['department_name'],
            'department_code' => $validated['department_code'],
            'track' => $schoolTrack->track_name,
            'school_track_id' => $schoolTrack->id,
            'description'     => $validated['description'] ?? null,
            'is_active'       => $validated['is_active'] ?? true,
        ]);

        $currentDepartmentTeacherIds = User::where('department_id', $department->id)
            ->whereHas('roles', fn($q) => $q->where('name', 'teacher'))
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->values();

        $reassignmentMap = collect($validated['reassign_teacher_department_ids'] ?? [])
            ->mapWithKeys(function ($targetDepartmentId, $teacherId) {
                return [(int) $teacherId => (int) $targetDepartmentId];
            })
            ->filter(function ($targetDepartmentId, $teacherId) use ($department, $currentDepartmentTeacherIds) {
                return $teacherId > 0
                    && $targetDepartmentId > 0
                    && (int) $targetDepartmentId !== (int) $department->id
                    && $currentDepartmentTeacherIds->contains((int) $teacherId);
            });

        // Unassign all current teachers from this department first
        User::where('department_id', $department->id)
            ->whereHas('roles', fn($q) => $q->where('name', 'teacher'))
            ->update(['department_id' => null]);

        // Re-assign selected teachers
        $teacherIds = collect($validated['teacher_ids'] ?? [])
            ->map(fn($id) => (int) $id)
            ->filter()
            ->reject(fn($id) => $reassignmentMap->has((int) $id))
            ->values()
            ->all();

        if (!empty($teacherIds)) {
            User::whereIn('id', $teacherIds)->update(['department_id' => $department->id]);
        }

        if ($reassignmentMap->isNotEmpty()) {
            foreach ($reassignmentMap as $teacherId => $targetDepartmentId) {
                User::whereKey((int) $teacherId)->update([
                    'department_id' => (int) $targetDepartmentId,
                ]);
            }
        }

        // Strip admin role from any existing admin in this department
        $currentAdmins = User::where('department_id', $department->id)
            ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
            ->get();
        foreach ($currentAdmins as $oldAdmin) {
            $oldAdmin->syncRolesByName(['teacher']);
        }

        // Assign new admin (must be one of the selected teachers)
        if (!empty($validated['admin_id']) && in_array((int) $validated['admin_id'], array_map('intval', $teacherIds))) {
            $adminUser = User::find($validated['admin_id']);
            $adminUser?->syncRolesByName(['teacher', 'admin']);
        }

        $this->syncDepartmentSpecializations(
            $department,
            $validated['specialization_names'] ?? [],
        );

        return redirect()
            ->route('superadmin.departments.index', [
                'track' => (string) $schoolTrack->id,
            ])
            ->with('success', 'Department updated successfully.');
    }

    /**
     * Remove the specified department.
     */
    public function destroy(Department $department): RedirectResponse
    {
        $this->authorize('delete-department');

        $assignedAdminCount = $department->admins()->count();
        $assignedTeacherCount = $department->teachers()->count();

        if ($assignedAdminCount > 0 || $assignedTeacherCount > 0) {
            return back()->with('error', 'Cannot delete department with assigned admins or teachers. Reassign them first.');
        }

        $specializationTokens = $department->specializations()
            ->pluck('specialization_name')
            ->map(fn($name) => Str::lower(trim((string) $name)))
            ->filter()
            ->unique()
            ->values();

        if ($specializationTokens->isNotEmpty()) {
            $departmentSectionIds = Section::query()
                ->where('department_id', $department->id)
                ->pluck('id');

            $sectionSpecializationTokens = Section::query()
                ->where('department_id', $department->id)
                ->whereNotNull('strand')
                ->pluck('strand')
                ->map(fn($strand) => Str::lower(trim((string) $strand)))
                ->filter()
                ->unique();

            if ($sectionSpecializationTokens->intersect($specializationTokens)->isNotEmpty()) {
                return back()->with('error', 'Cannot delete department while its strand/specialization is used by sections.');
            }

            if ($departmentSectionIds->isNotEmpty()) {
                $classSpecializationTokens = SchoolClass::query()
                    ->whereIn('section_id', $departmentSectionIds)
                    ->whereNotNull('strand')
                    ->pluck('strand')
                    ->map(fn($strand) => Str::lower(trim((string) $strand)))
                    ->filter()
                    ->unique();

                if ($classSpecializationTokens->intersect($specializationTokens)->isNotEmpty()) {
                    return back()->with('error', 'Cannot delete department while its strand/specialization is used by classes.');
                }
            }
        }

        if ($department->users()->exists()) {
            return back()->with('error', 'Cannot delete department with assigned users.');
        }

        $department->delete();

        return back()->with('success', 'Department deleted successfully.');
    }

    /**
     * Toggle department active status.
     */
    public function toggleStatus(Department $department): RedirectResponse
    {
        $this->authorize('update-department');

        $department->update(['is_active' => !$department->is_active]);

        $status = $department->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Department {$status} successfully.");
    }

    /**
     * @param  array<int, string>  $specializationNames
     */
    private function syncDepartmentSpecializations(Department $department, array $specializationNames): void
    {
        $normalizedNames = collect($specializationNames)
            ->map(function ($value) {
                $normalized = preg_replace('/\s+/', ' ', trim((string) $value));

                return $normalized !== '' ? $normalized : null;
            })
            ->filter()
            ->unique(fn(string $value) => Str::lower($value))
            ->values();

        if ($normalizedNames->isEmpty()) {
            $department->specializations()->sync([]);

            return;
        }

        $specializationIds = $normalizedNames
            ->map(function (string $name) {
                return Specialization::firstOrCreate([
                    'specialization_name' => $name,
                ])->id;
            })
            ->values()
            ->all();

        $department->specializations()->sync($specializationIds);
    }
}

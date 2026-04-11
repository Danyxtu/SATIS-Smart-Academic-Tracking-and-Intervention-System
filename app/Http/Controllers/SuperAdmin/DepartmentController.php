<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $query = Department::withCount(['admins', 'teachers', 'students'])
            ->with([
                'admins:id,first_name,middle_name,last_name,personal_email,department_id',
                'teachers:id,first_name,middle_name,last_name,personal_email,department_id',
            ]);

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

        $departments = $query->latest()->paginate(10)->withQueryString();

        $departments->setCollection(
            $departments->getCollection()->map(function (Department $department) {
                $primaryAdmin = $department->admins->first();

                $department->setAttribute('department_admin', $primaryAdmin ? [
                    'id' => $primaryAdmin->id,
                    'name' => $primaryAdmin->name,
                    'email' => $primaryAdmin->email,
                ] : null);

                $department->setAttribute('department_admins', $department->admins->map(fn($admin) => [
                    'id' => $admin->id,
                    'first_name' => $admin->first_name,
                    'middle_name' => $admin->middle_name,
                    'last_name' => $admin->last_name,
                    'name' => $admin->name,
                    'email' => $admin->email,
                ])->values());

                $department->setAttribute('department_teachers', $department->teachers->map(fn($t) => [
                    'id'          => $t->id,
                    'first_name'  => $t->first_name,
                    'middle_name' => $t->middle_name,
                    'last_name'   => $t->last_name,
                    'email'       => $t->email,
                    'is_admin'    => $department->admins->contains('id', $t->id),
                ])->values());

                return $department;
            })
        );

        return Inertia::render('SuperAdmin/Departments/Index', [
            'departments' => $departments,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Return teachers with no department assigned.
     */
    public function unassignedTeachers(): JsonResponse
    {
        $teachers = User::whereNull('department_id')
            ->whereHas('roles', fn($q) => $q->where('name', 'teacher'))
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'personal_email']);

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
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
            'teacher_ids'   => ['nullable', 'array'],
            'teacher_ids.*' => ['exists:users,id'],
            'admin_id'      => ['nullable', 'exists:users,id'],
        ]);

        $department = Department::create([
            'department_name' => $validated['department_name'],
            'department_code' => $validated['department_code'],
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

        return redirect()
            ->route('superadmin.departments.index')
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

        $department->loadCount(['admins', 'teachers', 'students']);

        return Inertia::render('SuperAdmin/Departments/Edit', [
            'department' => [
                'id' => $department->id,
                'name' => $department->department_name,
                'code' => $department->department_code,
                'description' => $department->description,
                'is_active' => $department->is_active,
                'admins_count' => $department->admins_count,
                'teachers_count' => $department->teachers_count,
                'students_count' => $department->students_count,
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
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'personal_email', 'department_id']);

        $adminId = User::where('department_id', $department->id)
            ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
            ->value('id');

        return response()->json([
            'teachers' => $teachers,
            'admin_id' => $adminId,
        ]);
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
            'description'     => ['nullable', 'string', 'max:1000'],
            'is_active'       => ['boolean'],
            'teacher_ids'     => ['nullable', 'array'],
            'teacher_ids.*'   => ['exists:users,id'],
            'admin_id'        => ['nullable', 'exists:users,id'],
        ]);

        $department->update([
            'department_name' => $validated['department_name'],
            'department_code' => $validated['department_code'],
            'description'     => $validated['description'] ?? null,
            'is_active'       => $validated['is_active'] ?? true,
        ]);

        // Unassign all current teachers from this department first
        User::where('department_id', $department->id)
            ->whereHas('roles', fn($q) => $q->where('name', 'teacher'))
            ->update(['department_id' => null]);

        // Re-assign selected teachers
        $teacherIds = $validated['teacher_ids'] ?? [];
        if (!empty($teacherIds)) {
            User::whereIn('id', $teacherIds)->update(['department_id' => $department->id]);
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

        return redirect()
            ->route('superadmin.departments.index')
            ->with('success', 'Department updated successfully.');
    }

    /**
     * Remove the specified department.
     */
    public function destroy(Department $department): RedirectResponse
    {
        $this->authorize('delete-department');

        // Check if department has users
        if ($department->users()->count() > 0) {
            return back()->with('error', 'Cannot delete department with assigned users.');
        }

        $department->delete();

        return redirect()
            ->route('superadmin.departments.index')
            ->with('success', 'Department deleted successfully.');
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
}

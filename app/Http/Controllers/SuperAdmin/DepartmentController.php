<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
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

        // $query = Department::withCount(['admins', 'teachers', 'students']);
        $query = Department::query();

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

        return Inertia::render('SuperAdmin/Departments/Index', [
            'departments' => $departments,
            'filters' => $request->only(['search', 'status']),
        ]);
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
        ]);

        Department::create($validated);

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
     * Update the specified department.
     */
    public function update(Request $request, Department $department): RedirectResponse
    {
        $this->authorize('update-department');

        $validated = $request->validate([
            'department_name' => ['required', 'string', 'max:255'],
            'department_code' => ['required', 'string', 'max:50', Rule::unique('departments')->ignore($department->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        $department->update($validated);

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

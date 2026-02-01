<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Mail\AdminCredentials;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Display a listing of admins.
     */
    public function index(Request $request): Response
    {
        $query = User::role('admin')->with('department:id,name,code');

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by department
        if ($request->filled('department')) {
            $query->where('department_id', $request->input('department'));
        }

        $admins = $query->latest()->paginate(10)->withQueryString();

        $departments = Department::active()
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return Inertia::render('SuperAdmin/Admins/Index', [
            'admins' => $admins,
            'departments' => $departments,
            'filters' => $request->only(['search', 'department']),
        ]);
    }

    /**
     * Show the form for creating a new admin.
     */
    public function create(): Response
    {
        $departments = Department::active()
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return Inertia::render('SuperAdmin/Admins/Create', [
            'departments' => $departments,
        ]);
    }

    /**
     * Store a newly created admin.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'department_id' => ['required', 'exists:departments,id'],
            'password' => ['nullable', Rules\Password::defaults()],
        ]);

        // Generate password if not provided
        $plainPassword = $validated['password'] ?? Str::random(12);

        $admin = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'email' => $validated['email'],
            'password' => $plainPassword, // Will be hashed on first login
            'temp_password' => $plainPassword,
            'must_change_password' => true,
            'role' => 'admin',
            'department_id' => $validated['department_id'],
            'created_by' => Auth::id(),
        ]);

        // Load the department relationship for the email
        $admin->load('department');

        // Send credentials email to the new admin
        Mail::to($admin->email)->send(new AdminCredentials(
            admin: $admin,
            plainPassword: $plainPassword,
            createdBy: Auth::user()
        ));

        return redirect()
            ->route('superadmin.admins.index')
            ->with('success', 'Admin created successfully.')
            ->with('new_admin_password', [
                'first_name' => $admin->first_name,
                'last_name' => $admin->last_name,
                'middle_name' => $admin->middle_name,
                'email' => $admin->email,
                'password' => $plainPassword,
            ]);
    }

    /**
     * Display the specified admin.
     */
    public function show(User $admin): Response
    {
        if ($admin->role !== 'admin') {
            abort(404);
        }

        $admin->load('department:id,name,code');

        // Get stats for this admin's department
        $departmentStats = [];
        if ($admin->department) {
            $departmentStats = [
                'teachers_count' => $admin->department->teachers()->count(),
                'students_count' => $admin->department->students()->count(),
            ];
        }

        return Inertia::render('SuperAdmin/Admins/Show', [
            'admin' => [
                'id' => $admin->id,
                'first_name' => $admin->first_name,
                'last_name' => $admin->last_name,
                'middle_name' => $admin->middle_name,
                'email' => $admin->email,
                'department' => $admin->department ? [
                    'id' => $admin->department->id,
                    'name' => $admin->department->name,
                    'code' => $admin->department->code,
                ] : null,
                'temp_password' => $admin->temp_password,
                'must_change_password' => $admin->must_change_password,
                'created_at' => $admin->created_at->format('M d, Y'),
                'password_changed_at' => $admin->password_changed_at?->format('M d, Y'),
            ],
            'departmentStats' => $departmentStats,
        ]);
    }

    /**
     * Show the form for editing the specified admin.
     */
    public function edit(User $admin): Response
    {
        if ($admin->role !== 'admin') {
            abort(404);
        }

        $departments = Department::active()
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return Inertia::render('SuperAdmin/Admins/Edit', [
            'admin' => [
                'id' => $admin->id,
                'first_name' => $admin->first_name,
                'last_name' => $admin->last_name,
                'middle_name' => $admin->middle_name,
                'email' => $admin->email,
                'department_id' => $admin->department_id,
                'created_at' => $admin->created_at->toISOString(),
                'updated_at' => $admin->updated_at->toISOString(),
            ],
            'departments' => $departments,
        ]);
    }

    /**
     * Update the specified admin.
     */
    public function update(Request $request, User $admin): RedirectResponse
    {
        if ($admin->role !== 'admin') {
            abort(404);
        }

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($admin->id)],
            'department_id' => ['required', 'exists:departments,id'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $updateData = [
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'middle_name' => $validated['middle_name'],
            'email' => $validated['email'],
            'department_id' => $validated['department_id'],
        ];

        // If password was provided, update it and require change on next login
        if (!empty($validated['password'])) {
            $updateData['password'] = $validated['password'];
            $updateData['temp_password'] = $validated['password'];
            $updateData['must_change_password'] = true;
            $updateData['password_changed_at'] = null;
        }

        $admin->update($updateData);

        return redirect()
            ->route('superadmin.admins.index')
            ->with('success', 'Admin updated successfully.');
    }

    /**
     * Remove the specified admin.
     */
    public function destroy(Request $request, User $admin): RedirectResponse
    {
        if ($admin->role !== 'admin') {
            abort(404);
        }

        // Validate the super admin's password
        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        // Check if the password matches the current super admin's password
        if (!Hash::check($validated['password'], $request->user()->password)) {
            return back()->withErrors(['password' => 'The password is incorrect.']);
        }

        $admin->delete();

        return redirect()
            ->route('superadmin.admins.index')
            ->with('success', 'Admin deleted successfully.');
    }

    /**
     * Reset admin's password.
     */
    public function resetPassword(User $admin): RedirectResponse
    {
        if ($admin->role !== 'admin') {
            abort(404);
        }

        $plainPassword = Str::random(12);

        $admin->update([
            'password' => $plainPassword,
            'temp_password' => $plainPassword,
            'must_change_password' => true,
            'password_changed_at' => null,
        ]);

        return back()
            ->with('success', 'Password reset successfully.')
            ->with('new_admin_password', [
                'first_name' => $admin->first_name,
                'last_name' => $admin->last_name,
                'middle_name' => $admin->middle_name,
                'email' => $admin->email,
                'password' => $plainPassword,
            ]);
    }

    /**
     * Resend credentials email to admin.
     */
    public function resendCredentials(User $admin): RedirectResponse
    {
        if ($admin->role !== 'admin') {
            abort(404);
        }

        // If no temp_password exists, generate a new one
        $plainPassword = $admin->temp_password;

        if (!$plainPassword) {
            $plainPassword = Str::random(12);
            $admin->update([
                'password' => $plainPassword,
                'temp_password' => $plainPassword,
                'must_change_password' => true,
                'password_changed_at' => null,
            ]);
        }

        // Load the department relationship for the email
        $admin->load('department');

        // Send credentials email
        Mail::to($admin->email)->send(new AdminCredentials(
            admin: $admin,
            plainPassword: $plainPassword,
            createdBy: Auth::user()
        ));

        return back()->with('success', 'Credentials email has been resent to ' . $admin->email);
    }
}

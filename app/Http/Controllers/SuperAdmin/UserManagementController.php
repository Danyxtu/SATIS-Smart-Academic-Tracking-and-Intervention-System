<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name',  'like', "%{$search}%")
                    ->orWhere('email',      'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $departments = \App\Models\Department::orderBy('department_name')->get();

        return Inertia::render('SuperAdmin/UserManagement/Index', [
            'users'       => $users,
            'departments' => $departments,
            'filters'     => $request->only('search', 'role'),
        ]);
    }

    public function store(Request $request)
    {
        $superAdmin = Auth::user();
        $validated = $request->validate([
            'first_name'    => ['required', 'string', 'max:100'],
            'last_name'     => ['required', 'string', 'max:100'],
            'middle_name'   => ['nullable', 'string', 'max:100'],
            'email'         => ['required', 'email', 'unique:users,email'],
            'password'      => ['required', Password::min(8)],
            'role'          => ['required', 'in:teacher,student'],
            'department_id' => ['nullable', 'exists:departments,id'],
        ]);

        // Teachers must have a department
        if ($validated['role'] === 'teacher') {
            $request->validate([
                'department_id' => ['required', 'exists:departments,id'],
            ]);
        }

        User::create([
            'first_name'           => $validated['first_name'],
            'last_name'            => $validated['last_name'],
            'middle_name'          => $validated['middle_name'] ?? null,
            'email'                => $validated['email'],
            'password'             => Hash::make($validated['password']),
            'role'                 => $validated['role'],
            'department_id'        => $validated['role'] === 'teacher'
                ? $validated['department_id']
                : null,
            'must_change_password' => true,
            'status'               => 'active',
            'created_by'           => $superAdmin->id,
        ]);

        return redirect()->route('superadmin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function destroy(Request $request, User $user)
    {
        $superAdminId = Auth::user();
        $request->validate([
            'password' => ['required'],
        ]);

        if (! Hash::check($request->password, $superAdminId->password)) {
            return back()->withErrors(['password' => 'Incorrect password.']);
        }

        $user->delete();

        return redirect()->route('superadmin.users.index')
            ->with('success', 'User deleted successfully.');
    }
}

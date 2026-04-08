<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with('roles:id,name', 'department:id,department_name,department_code');
        $countQuery = User::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name',  'like', "%{$search}%")
                    ->orWhere('username',   'like', "%{$search}%")
                    ->orWhere('personal_email', 'like', "%{$search}%");
            });

            $countQuery->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name',  'like', "%{$search}%")
                    ->orWhere('username',   'like', "%{$search}%")
                    ->orWhere('personal_email', 'like', "%{$search}%");
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

        $users->getCollection()->transform(function (User $user) {
            $roleNames = $user->roles->pluck('name')->values()->all();
            $payload = $user->toArray();
            $payload['role'] = $roleNames[0] ?? null;
            $payload['roles_list'] = $roleNames;

            return $payload;
        });

        $roleCounts = [
            'super_admin' => 0,
            'admin' => 0,
            'teacher' => 0,
            'student' => 0,
        ];

        $roleCountRows = $countQuery
            ->join('role_user', 'users.id', '=', 'role_user.user_id')
            ->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->select('roles.name', DB::raw('COUNT(DISTINCT users.id) as total'))
            ->groupBy('roles.name')
            ->pluck('total', 'name')
            ->toArray();

        foreach ($roleCountRows as $roleName => $total) {
            if (array_key_exists($roleName, $roleCounts)) {
                $roleCounts[$roleName] = (int) $total;
            }
        }

        $departments = \App\Models\Department::query()
            ->withCount([
                'users as admin_count' => function ($query) {
                    $query->whereHas('roles', function ($roleQuery) {
                        $roleQuery->where('name', 'admin');
                    });
                },
            ])
            ->with([
                'admins:id,first_name,middle_name,last_name,personal_email,department_id',
            ])
            ->orderBy('department_name')
            ->get()
            ->map(function (\App\Models\Department $department) {
                $primaryAdmin = $department->admins->first();

                $department->setAttribute('department_admin', $primaryAdmin ? [
                    'id' => $primaryAdmin->id,
                    'first_name' => $primaryAdmin->first_name,
                    'last_name' => $primaryAdmin->last_name,
                    'name' => $primaryAdmin->name,
                    'email' => $primaryAdmin->email,
                ] : null);

                return $department;
            });

        return Inertia::render('SuperAdmin/UserManagement/Index', [
            'users'       => $users,
            'departments' => $departments,
            'filters'     => $request->only('search', 'role'),
            'roleCounts'  => $roleCounts,
        ]);
    }

    public function store(Request $request)
    {
        $superAdmin = Auth::user();
        $validated = $request->validate([
            'first_name'    => ['required', 'string', 'max:100'],
            'last_name'     => ['required', 'string', 'max:100'],
            'middle_name'   => ['nullable', 'string', 'max:100'],
            'email'         => ['nullable', 'email', 'unique:users,personal_email'],
            'password'      => ['required', Password::min(8)],
            'role'          => ['required', 'in:teacher,student'],
            'assign_as_admin' => ['nullable', 'boolean'],
            'department_id' => ['nullable', 'exists:departments,id'],
        ]);

        if ($validated['role'] === 'teacher' && empty($validated['department_id'])) {
            return back()->withErrors([
                'department_id' => 'Department is required for teachers.',
            ]);
        }

        if (
            $validated['role'] === 'teacher'
            && !empty($validated['assign_as_admin'])
            && !empty($validated['department_id'])
        ) {
            $departmentAlreadyHasAdmin = \App\Models\Department::query()
                ->whereKey($validated['department_id'])
                ->whereHas('admins')
                ->exists();

            if ($departmentAlreadyHasAdmin) {
                return back()->withErrors([
                    'assign_as_admin' => 'This department already has an assigned admin.',
                ]);
            }
        }

        if ($validated['role'] === 'teacher') {
            $assignedRoles = ['teacher'];

            if (!empty($validated['assign_as_admin'])) {
                $assignedRoles[] = 'admin';
            }
        } else {
            $assignedRoles = ['student'];
        }

        $user = User::create([
            'first_name'           => $validated['first_name'],
            'last_name'            => $validated['last_name'],
            'middle_name'          => $validated['middle_name'] ?? null,
            'personal_email'       => $validated['email'] ?? null,
            'password'             => Hash::make($validated['password']),
            'department_id'        => $validated['role'] === 'teacher'
                ? $validated['department_id']
                : null,
            'must_change_password' => true,
            'status'               => 'active',
            'created_by'           => $superAdmin->id,
            'username'             => $validated['role'] === 'student'
                ? User::generateUniqueUsername(trim(($validated['first_name'] ?? '') . ' ' . ($validated['last_name'] ?? '')))
                : null,
        ]);

        $roleIds = Role::whereIn('name', $assignedRoles)->pluck('id')->all();
        if (!empty($roleIds)) {
            $user->roles()->sync($roleIds);
        }

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

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', Rule::unique('users', 'personal_email')->ignore($user->id)],
            'password' => ['nullable', Password::min(8)],
            'role' => ['required', 'in:super_admin,admin,teacher,student'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $currentRoles = $user->roles()->pluck('name');

        if ($currentRoles->contains('teacher') && $validated['role'] === 'student') {
            return back()->withErrors([
                'role' => 'Teachers cannot be changed to students.',
            ]);
        }

        if ($currentRoles->contains('student') && $validated['role'] === 'teacher') {
            return back()->withErrors([
                'role' => 'Students cannot be changed to teachers.',
            ]);
        }

        // Teachers must always be assigned to a department.
        if ($validated['role'] === 'teacher' && empty($validated['department_id'])) {
            return back()->withErrors([
                'department_id' => 'Department is required for teachers.',
            ]);
        }

        $user->first_name = $validated['first_name'];
        $user->last_name = $validated['last_name'];
        $user->middle_name = $validated['middle_name'] ?? null;
        $user->personal_email = $validated['email'] ?? null;
        $user->status = $validated['status'];
        $user->department_id = $validated['role'] === 'teacher'
            ? $validated['department_id']
            : null;

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
            $user->must_change_password = true;
        }

        $user->save();

        $roleId = Role::where('name', $validated['role'])->value('id');
        if ($roleId) {
            $user->roles()->sync([$roleId]);
        }

        return redirect()->route('superadmin.users.index')
            ->with('success', 'User updated successfully.');
    }
}

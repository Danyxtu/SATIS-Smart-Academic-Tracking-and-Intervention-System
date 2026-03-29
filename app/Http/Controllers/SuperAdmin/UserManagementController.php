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
                    ->orWhere('email',      'like', "%{$search}%");
            });

            $countQuery->where(function ($q) use ($search) {
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
            ->orderBy('department_name')
            ->get();

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
            'email'         => ['required', 'email', 'unique:users,email'],
            'password'      => ['required', Password::min(8)],
            'role'          => ['required', 'in:teacher,student'],
            'assign_as_admin' => ['nullable', 'boolean'],
            'department_id' => ['nullable', 'exists:departments,id'],
        ]);

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
            'email'                => $validated['email'],
            'password'             => Hash::make($validated['password']),
            'department_id'        => $validated['role'] === 'teacher'
                ? $validated['department_id']
                : null,
            'must_change_password' => true,
            'status'               => 'active',
            'created_by'           => $superAdmin->id,
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
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', Password::min(8)],
            'role' => ['required', 'in:super_admin,admin,teacher,student'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        // Teachers must always be assigned to a department.
        if ($validated['role'] === 'teacher' && empty($validated['department_id'])) {
            return back()->withErrors([
                'department_id' => 'Department is required for teachers.',
            ]);
        }

        $user->first_name = $validated['first_name'];
        $user->last_name = $validated['last_name'];
        $user->middle_name = $validated['middle_name'] ?? null;
        $user->email = $validated['email'];
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

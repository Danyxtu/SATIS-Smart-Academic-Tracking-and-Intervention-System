<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Mail\TemporaryCredentials;
use App\Models\PasswordResetRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

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

        $studentCreationBaseCount = User::query()
            ->whereHas('roles', function ($query) {
                $query->where('name', 'student');
            })
            ->count();

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
            'studentCreationBaseCount' => $studentCreationBaseCount,
        ]);
    }

    public function store(Request $request)
    {
        $superAdmin = Auth::user();

        $role = (string) $request->input('role', '');
        $teacherMode = (string) $request->input('teacher_mode', 'single');
        $studentMode = (string) $request->input('student_mode', 'single');

        if ($role === 'teacher' && $teacherMode === 'multiple') {
            $validated = $request->validate([
                'role' => ['required', 'in:teacher'],
                'teacher_mode' => ['required', 'in:multiple'],
                'password' => ['required', Password::min(8)],
                'teacher_queue' => ['required', 'array', 'min:1'],
                'teacher_queue.*.first_name' => ['required', 'string', 'max:100'],
                'teacher_queue.*.last_name' => ['required', 'string', 'max:100'],
                'teacher_queue.*.middle_name' => ['nullable', 'string', 'max:100'],
                'teacher_queue.*.email' => ['required', 'email', 'max:255', 'distinct', 'unique:users,personal_email'],
                'teacher_queue.*.department_id' => ['required', 'exists:departments,id'],
                'teacher_queue.*.assign_as_admin' => ['nullable', 'boolean'],
            ]);

            $departmentIds = collect($validated['teacher_queue'])
                ->pluck('department_id')
                ->filter()
                ->unique()
                ->values();

            $departments = \App\Models\Department::query()
                ->whereIn('id', $departmentIds)
                ->withCount('admins')
                ->get()
                ->keyBy('id');

            $pendingAdminDepartmentIds = [];

            foreach ($validated['teacher_queue'] as $index => $teacherPayload) {
                $wantsAdmin = (bool) ($teacherPayload['assign_as_admin'] ?? false);

                if (! $wantsAdmin) {
                    continue;
                }

                $departmentId = (int) $teacherPayload['department_id'];
                $existingAdminCount = (int) ($departments[$departmentId]->admins_count ?? 0);

                if ($existingAdminCount > 0 || in_array($departmentId, $pendingAdminDepartmentIds, true)) {
                    return back()->withErrors([
                        "teacher_queue.{$index}.assign_as_admin" => 'This department already has an assigned admin.',
                    ]);
                }

                $pendingAdminDepartmentIds[] = $departmentId;
            }

            DB::transaction(function () use ($validated, $superAdmin) {
                foreach ($validated['teacher_queue'] as $teacherPayload) {
                    $assignedRoles = ['teacher'];

                    if (!empty($teacherPayload['assign_as_admin'])) {
                        $assignedRoles[] = 'admin';
                    }

                    $teacher = User::create([
                        'first_name' => $teacherPayload['first_name'],
                        'last_name' => $teacherPayload['last_name'],
                        'middle_name' => $teacherPayload['middle_name'] ?? null,
                        'personal_email' => $teacherPayload['email'] ?? null,
                        'password' => Hash::make($validated['password']),
                        'department_id' => $teacherPayload['department_id'],
                        'must_change_password' => true,
                        'status' => 'active',
                        'created_by' => $superAdmin->id,
                        'username' => null,
                    ]);

                    $roleIds = Role::whereIn('name', $assignedRoles)->pluck('id')->all();
                    if (!empty($roleIds)) {
                        $teacher->roles()->sync($roleIds);
                    }
                }
            });

            $createdCount = count($validated['teacher_queue']);
            $label = $createdCount === 1 ? 'teacher' : 'teachers';

            return redirect()->route('superadmin.users.index')
                ->with('success', "{$createdCount} {$label} created successfully.");
        }

        if ($role === 'student' && in_array($studentMode, ['multiple', 'csv'], true)) {
            $validated = $request->validate([
                'role' => ['required', 'in:student'],
                'student_mode' => ['required', 'in:multiple,csv'],
                'password' => ['required', Password::min(8)],
                'student_queue' => ['required', 'array', 'min:1'],
                'student_queue.*.first_name' => ['required', 'string', 'max:100'],
                'student_queue.*.last_name' => ['required', 'string', 'max:100'],
                'student_queue.*.middle_name' => ['nullable', 'string', 'max:100'],
                'student_queue.*.email' => ['nullable', 'email', 'max:255', 'distinct', 'unique:users,personal_email'],
                'student_queue.*.username' => ['required', 'string', 'regex:/^[a-z]{2}\d{4}\d{5}$/', 'distinct', 'unique:users,username'],
            ]);

            foreach ($validated['student_queue'] as $index => $studentPayload) {
                $isUsernameValidForPayload = $this->isValidStudentUsernameForName(
                    (string) ($studentPayload['username'] ?? ''),
                    (string) ($studentPayload['first_name'] ?? ''),
                    (string) ($studentPayload['last_name'] ?? ''),
                );

                if (! $isUsernameValidForPayload) {
                    return back()->withErrors([
                        "student_queue.{$index}.username" => 'Username format must follow initials + current year + 5-digit number (example: dd202300100).',
                    ]);
                }
            }

            DB::transaction(function () use ($validated, $superAdmin) {
                foreach ($validated['student_queue'] as $studentPayload) {
                    $student = User::create([
                        'first_name' => $studentPayload['first_name'],
                        'last_name' => $studentPayload['last_name'],
                        'middle_name' => $studentPayload['middle_name'] ?? null,
                        'personal_email' => $studentPayload['email'] ?? null,
                        'username' => $studentPayload['username'],
                        'password' => Hash::make($validated['password']),
                        'department_id' => null,
                        'must_change_password' => true,
                        'status' => 'active',
                        'created_by' => $superAdmin->id,
                    ]);

                    $roleIds = Role::whereIn('name', ['student'])->pluck('id')->all();
                    if (! empty($roleIds)) {
                        $student->roles()->sync($roleIds);
                    }
                }
            });

            $createdCount = count($validated['student_queue']);
            $label = $createdCount === 1 ? 'student' : 'students';

            return redirect()->route('superadmin.users.index')
                ->with('success', "{$createdCount} {$label} created successfully.");
        }

        $validated = $request->validate([
            'first_name'    => ['required', 'string', 'max:100'],
            'last_name'     => ['required', 'string', 'max:100'],
            'middle_name'   => ['nullable', 'string', 'max:100'],
            'email'         => ['nullable', 'email', 'unique:users,personal_email'],
            'username'      => ['nullable', 'string', 'regex:/^[a-z]{2}\d{4}\d{5}$/', 'unique:users,username'],
            'password'      => ['required', Password::min(8)],
            'role'          => ['required', 'in:teacher,student'],
            'teacher_mode'  => ['nullable', 'in:single,multiple'],
            'student_mode'  => ['nullable', 'in:single,multiple,csv'],
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

        if ($validated['role'] === 'student') {
            if (($validated['student_mode'] ?? 'single') !== 'single') {
                return back()->withErrors([
                    'student_mode' => 'Invalid student mode for single student creation.',
                ]);
            }

            if (empty($validated['email'])) {
                return back()->withErrors([
                    'email' => 'Email address is required for single student creation.',
                ]);
            }

            if (empty($validated['username'])) {
                return back()->withErrors([
                    'username' => 'Username is required for single student creation.',
                ]);
            }

            $isValidUsername = $this->isValidStudentUsernameForName(
                (string) $validated['username'],
                (string) ($validated['first_name'] ?? ''),
                (string) ($validated['last_name'] ?? ''),
            );

            if (! $isValidUsername) {
                return back()->withErrors([
                    'username' => 'Username format must follow initials + current year + 5-digit number (example: dd202300100).',
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
                ? (string) ($validated['username'] ?? '')
                : null,
        ]);

        $roleIds = Role::whereIn('name', $assignedRoles)->pluck('id')->all();
        if (!empty($roleIds)) {
            $user->roles()->sync($roleIds);
        }

        return redirect()->route('superadmin.users.index')
            ->with('success', 'User created successfully.');
    }

    private function isValidStudentUsernameForName(string $username, string $firstName, string $lastName): bool
    {
        if (preg_match('/^[a-z]{2}\d{4}\d{5}$/', $username) !== 1) {
            return false;
        }

        $expectedPrefix = $this->buildStudentUsernamePrefix($firstName, $lastName);
        $expectedYear = now()->format('Y');

        return str_starts_with($username, $expectedPrefix . $expectedYear);
    }

    private function buildStudentUsernamePrefix(string $firstName, string $lastName): string
    {
        $firstToken = $this->normalizeStudentUsernameToken($firstName, 'first');
        $lastToken = $this->normalizeStudentUsernameToken($lastName, 'last');

        $firstInitial = $firstToken !== '' ? substr($firstToken, 0, 1) : 'x';
        $lastInitial = $lastToken !== '' ? substr($lastToken, 0, 1) : 'x';

        return strtolower($firstInitial . $lastInitial);
    }

    private function normalizeStudentUsernameToken(string $value, string $mode = 'first'): string
    {
        $normalized = strtolower(trim(preg_replace('/[^a-z0-9\s]/i', ' ', $value) ?? ''));

        if ($normalized === '') {
            return '';
        }

        $tokens = preg_split('/\s+/', $normalized);

        if (! is_array($tokens) || empty($tokens)) {
            return '';
        }

        if ($mode === 'last') {
            return (string) ($tokens[count($tokens) - 1] ?? '');
        }

        return (string) ($tokens[0] ?? '');
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

    /**
     * Display teacher and student password reset requests.
     */
    public function passwordResetRequests(Request $request)
    {
        $status = $request->input('status', PasswordResetRequest::STATUS_PENDING);
        $allowedStatuses = [
            PasswordResetRequest::STATUS_PENDING,
            PasswordResetRequest::STATUS_APPROVED,
            PasswordResetRequest::STATUS_REJECTED,
            'all',
        ];

        if (!in_array($status, $allowedStatuses, true)) {
            $status = PasswordResetRequest::STATUS_PENDING;
        }

        $requestsQuery = $this->teacherAndStudentPasswordResetRequestsQuery()->with([
            'user.roles:id,name',
            'user.department:id,department_name',
            'processedBy',
        ]);

        if ($status !== 'all') {
            $requestsQuery->where('status', $status);
        }

        $requests = $requestsQuery
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $requests->getCollection()->transform(function (PasswordResetRequest $passwordResetRequest) {
            if ($passwordResetRequest->relationLoaded('user') && $passwordResetRequest->user) {
                $passwordResetRequest->user->setAttribute(
                    'role',
                    $passwordResetRequest->user->roles->pluck('name')->first()
                );
            }

            return $passwordResetRequest;
        });

        $counts = [
            'pending' => (clone $this->teacherAndStudentPasswordResetRequestsQuery())
                ->where('status', PasswordResetRequest::STATUS_PENDING)
                ->count(),
            'approved' => (clone $this->teacherAndStudentPasswordResetRequestsQuery())
                ->where('status', PasswordResetRequest::STATUS_APPROVED)
                ->count(),
            'rejected' => (clone $this->teacherAndStudentPasswordResetRequestsQuery())
                ->where('status', PasswordResetRequest::STATUS_REJECTED)
                ->count(),
            'all' => (clone $this->teacherAndStudentPasswordResetRequestsQuery())->count(),
        ];

        return Inertia::render('SuperAdmin/PasswordResetRequests', [
            'requests' => $requests,
            'counts' => $counts,
            'currentStatus' => $status,
        ]);
    }

    /**
     * Approve a teacher/student password reset request.
     */
    public function approvePasswordResetRequest(Request $request, PasswordResetRequest $passwordResetRequest)
    {
        if (!$this->canManagePasswordResetRequest($passwordResetRequest)) {
            abort(403, 'This password reset request is outside your allowed scope.');
        }

        if (!$passwordResetRequest->isPending()) {
            return back()->withErrors([
                'request' => 'This password reset request has already been processed.',
            ]);
        }

        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        if (blank($passwordResetRequest->user->email)) {
            return back()->withErrors([
                'email' => 'Cannot approve this reset request because the user has no email on file.',
            ]);
        }

        // Generate a random 8-character password.
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        $tempPassword = '';
        for ($i = 0; $i < 8; $i++) {
            $tempPassword .= $chars[random_int(0, strlen($chars) - 1)];
        }

        $passwordResetRequest->user->update([
            'password' => Hash::make($tempPassword),
            'must_change_password' => true,
            'password_changed_at' => null,
        ]);

        $passwordResetRequest->update([
            'status' => PasswordResetRequest::STATUS_APPROVED,
            'admin_notes' => $validated['admin_notes'] ?? null,
            'processed_by' => Auth::id(),
            'processed_at' => now(),
        ]);

        Mail::to($passwordResetRequest->user->email)->send(new TemporaryCredentials(
            user: $passwordResetRequest->user,
            plainPassword: $tempPassword,
            issuedBy: Auth::user(),
            context: 'password reset',
        ));

        return back()->with('success', 'Password reset approved. Temporary credentials were sent via email.');
    }

    /**
     * Reject a teacher/student password reset request.
     */
    public function rejectPasswordResetRequest(Request $request, PasswordResetRequest $passwordResetRequest)
    {
        if (!$this->canManagePasswordResetRequest($passwordResetRequest)) {
            abort(403, 'This password reset request is outside your allowed scope.');
        }

        if (!$passwordResetRequest->isPending()) {
            return back()->withErrors([
                'request' => 'This password reset request has already been processed.',
            ]);
        }

        $validated = $request->validate([
            'admin_notes' => ['required', 'string', 'max:500'],
        ]);

        $passwordResetRequest->update([
            'status' => PasswordResetRequest::STATUS_REJECTED,
            'admin_notes' => $validated['admin_notes'],
            'processed_by' => Auth::id(),
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Password reset request rejected.');
    }

    private function teacherAndStudentPasswordResetRequestsQuery()
    {
        return PasswordResetRequest::query()
            ->whereHas('user.roles', function ($roleQuery) {
                $roleQuery->whereIn('name', ['teacher', 'student']);
            });
    }

    private function canManagePasswordResetRequest(PasswordResetRequest $passwordResetRequest): bool
    {
        return $passwordResetRequest->user()
            ->whereHas('roles', function ($roleQuery) {
                $roleQuery->whereIn('name', ['teacher', 'student']);
            })
            ->exists();
    }
}

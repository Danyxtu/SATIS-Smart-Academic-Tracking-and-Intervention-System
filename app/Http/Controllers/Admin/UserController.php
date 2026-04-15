<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\TeacherCredentials;
use App\Mail\TemporaryCredentials;
use App\Models\User;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Enrollment;
use App\Models\PasswordResetRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display the admin dashboard with overview stats.
     */
    public function dashboard()
    {
        $admin = Auth::user();
        $departmentId = $admin->department_id;

        // Base query for department-scoped stats
        $departmentUsersQuery = User::query();
        if ($departmentId) {
            $departmentUsersQuery->where('department_id', $departmentId);
        }

        $stats = [
            'totalUsers' => (clone $departmentUsersQuery)->count(),
            'totalStudents' => (clone $departmentUsersQuery)
                ->whereHas('roles', fn($q) => $q->where('name', 'student'))
                ->count(),
            'totalTeachers' => (clone $departmentUsersQuery)
                ->whereHas('roles', fn($q) => $q->where('name', 'teacher'))
                ->count(),
            'totalAdmins' => (clone $departmentUsersQuery)
                ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
                ->count(),
            'recentUsers' => (clone $departmentUsersQuery)
                ->with('roles:id,name')
                ->latest()
                ->take(5)
                ->get(['id', 'first_name', 'last_name', 'personal_email', 'created_at'])
                ->map(fn($user) => [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . $user->last_name),
                    'email' => $user->email,
                    'role' => $user->roles->pluck('name')->first(),
                    'created_at' => $user->created_at,
                ]),
        ];

        // Get user creation trends (last 7 days) scoped to department
        $userTrends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $trendQuery = User::whereDate('created_at', $date);
            if ($departmentId) {
                $trendQuery->where('department_id', $departmentId);
            }
            $userTrends[] = [
                'date' => now()->subDays($i)->format('M d'),
                'count' => $trendQuery->count(),
            ];
        }

        // Get admin's department info
        $department = $admin->department;

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'userTrends' => $userTrends,
            'department' => $department ? [
                'id' => $department->id,
                'name' => $department->department_name,
                'code' => $department->department_code,
            ] : null,
        ]);
    }

    /**
     * Display a listing of all users with search, filter, and sort.
     */
    public function index(Request $request)
    {
        $admin = Auth::user();
        $departmentId = $admin->department_id;

        $query = User::query()->with('roles:id,name');

        // Scope to admin's department (teachers and students only)
        if ($departmentId) {
            $query->where(function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId)
                    ->orWhereHas('roles', function ($roleQuery) {
                        $roleQuery->where('name', 'student');
                    }); // Students may not have department
            });
        }

        // Search by name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('personal_email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role') && $request->role !== 'all') {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        // Filter by section (for students)
        if ($request->filled('section') && $request->section !== 'all') {
            $query->whereHas('roles', function ($q) {
                $q->where('name', 'student');
            })
                ->whereHas('student', function ($q) use ($request) {
                    $q->where('section', $request->section);
                });
        }

        // Sort
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        // Validate sort field
        $allowedSortFields = ['name', 'email', 'created_at'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        if ($sortField === 'name') {
            $query->orderBy('first_name', $sortDirection === 'asc' ? 'asc' : 'desc');
        } elseif ($sortField === 'email') {
            $query->orderBy('personal_email', $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        // Eager load student profile data for list rendering.
        $query->with('student');

        // Paginate results
        $users = $query->paginate(15)->withQueryString();

        $studentUserIds = $users->getCollection()
            ->filter(fn($user) => $user->hasRole('student') && $user->student)
            ->pluck('id')
            ->values();

        $enrollmentsByUserId = $studentUserIds->isNotEmpty()
            ? Enrollment::query()
            ->whereIn('user_id', $studentUserIds)
            ->with(['subjectTeacher.subject', 'subjectTeacher.teacher'])
            ->get()
            ->groupBy('user_id')
            : collect();

        // Transform users to include section and teacher info
        $users->getCollection()->transform(function ($user) use ($enrollmentsByUserId) {
            $payload = $user->toArray();
            $payload['role'] = $user->roles->pluck('name')->first();

            if ($user->hasRole('student') && $user->student) {
                $payload['section'] = $user->student->section;
                $payload['grade_level'] = $user->student->grade_level;
                $payload['strand'] = $user->student->strand;

                $enrollments = $enrollmentsByUserId->get($user->id, collect());

                $payload['subjects'] = $enrollments->map(function ($enrollment) {
                    return [
                        'name' => $enrollment->subjectTeacher?->subject?->subject_name ?? 'N/A',
                        'teacher' => $enrollment->subjectTeacher?->teacher?->name ?? 'N/A',
                    ];
                });
            }

            return $payload;
        });

        // Get role counts for filter badges (scoped to department)
        $roleCountsQuery = User::query();
        if ($departmentId) {
            $roleCountsQuery->where(function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId)
                    ->orWhereHas('roles', function ($roleQuery) {
                        $roleQuery->where('name', 'student');
                    });
            });
        }

        $roleCounts = [
            'all' => (clone $roleCountsQuery)->count(),
            'student' => (clone $roleCountsQuery)->whereHas('roles', fn($q) => $q->where('name', 'student'))->count(),
            'teacher' => (clone $roleCountsQuery)->whereHas('roles', fn($q) => $q->where('name', 'teacher'))->count(),
            'admin' => (clone $roleCountsQuery)->whereHas('roles', fn($q) => $q->where('name', 'admin'))->count(),
        ];

        // Get unique sections for filter
        $sections = Student::distinct()->pluck('section')->filter()->sort()->values();

        // Get admin's department info
        $department = $admin->department;

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $request->search ?? '',
                'role' => $request->role ?? 'all',
                'section' => $request->section ?? 'all',
                'sort' => $sortField,
                'direction' => $sortDirection,
            ],
            'roleCounts' => $roleCounts,
            'sections' => $sections,
            'department' => $department ? [
                'id' => $department->id,
                'name' => $department->department_name,
                'code' => $department->department_code,
            ] : null,
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $admin = Auth::user();
        $departmentId = $admin->department_id;

        // Admin can only create teachers (not other admins)
        // Different validation rules based on role
        $rules = [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'role' => 'required|in:student,teacher', // Admin cannot create other admins
        ];

        if ($request->role === 'student') {
            $rules['email'] = 'required|string|email|max:255|unique:users,personal_email';
        } else {
            $rules['email'] = 'required|string|email|max:255|unique:users,personal_email';
        }

        // Require LRN for student role
        if ($request->role === 'student') {
            $rules['lrn'] = 'required|string|size:12|unique:students,lrn';
        }

        $validated = $request->validate($rules);

        $tempPassword = $validated['role'] === 'teacher'
            ? Str::random(12)
            : Str::random(10);

        // Create user with department assignment for teachers
        $userData = [
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'personal_email' => $validated['email'] ?? null,
            'password' => Hash::make($tempPassword),
            'created_by' => $admin->id,
            'email_verified_at' => null,
        ];

        if ($validated['role'] === 'student') {
            $seed = trim(($validated['first_name'] ?? '') . ' ' . ($validated['last_name'] ?? ''));
            $userData['username'] = User::generateUniqueUsername($seed);
        }

        $userData['temporary_password'] = $tempPassword;
        $userData['must_change_password'] = true;

        // Assign department for teachers
        if ($validated['role'] === 'teacher' && $departmentId) {
            $userData['department_id'] = $departmentId;
        }

        $user = User::create($userData);
        $user->syncRolesByName([$validated['role']]);

        // If creating a student, also create the student profile
        if ($validated['role'] === 'student') {
            $middleName = $validated['middle_name'] ?? null;
            $studentName = trim($validated['first_name'] . ' ' . ($middleName ? $middleName . ' ' : '') . $validated['last_name']);

            Student::create([
                'user_id' => $user->id,
                'student_name' => $studentName,
                'lrn' => $validated['lrn'],
            ]);

            Mail::to($user->email)->send(new TemporaryCredentials(
                user: $user,
                plainPassword: (string) $tempPassword,
                issuedBy: $admin,
                context: 'new student account',
            ));

            return redirect()->route('admin.users.index')
                ->with('success', 'Student created successfully. Temporary credentials were sent via email.');
        }

        try {
            Mail::to($user->email)->send(new TeacherCredentials(
                teacher: $user,
                plainPassword: (string) $tempPassword,
                issuedBy: $admin,
            ));
        } catch (\Throwable $exception) {
            report($exception);

            $user->roles()->detach();
            $user->delete();

            return back()->withErrors([
                'email' => 'Unable to send login credentials email. Please try again.',
            ])->withInput();
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'Teacher created successfully. Login credentials were sent via email.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        $admin = Auth::user();
        $department = $admin->department;

        // Admin can only edit users in their department (teachers) or students
        if ($user->hasRole('teacher') && $user->department_id !== $admin->department_id) {
            return redirect()->route('admin.users.index')
                ->with('error', 'You can only edit teachers in your department.');
        }

        return Inertia::render('Admin/Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->pluck('name')->first(),
                'department_id' => $user->department_id,
                'created_at' => $user->created_at->format('M d, Y'),
            ],
            'department' => $department ? [
                'id' => $department->id,
                'name' => $department->department_name,
                'code' => $department->department_code,
            ] : null,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        $admin = Auth::user();

        // Admin can only edit users in their department (teachers) or students
        if ($user->hasRole('teacher') && $user->department_id !== $admin->department_id) {
            return redirect()->route('admin.users.index')
                ->with('error', 'You can only edit teachers in your department.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique('users', 'personal_email')->ignore($user->id)],
            'role' => 'required|in:student,teacher', // Admin cannot change role to admin
        ]);

        $oldRole = $user->roles->pluck('name')->first();

        // Prepare update data
        $updateData = [
            'name' => $validated['name'],
            'personal_email' => $validated['email'] ?? null,
        ];

        // If changing to teacher, assign department
        if ($validated['role'] === 'teacher' && $admin->department_id) {
            $updateData['department_id'] = $admin->department_id;
        }

        $user->update($updateData);
        $user->syncRolesByName([$validated['role']]);

        // Handle role change from non-student to student
        if ($oldRole !== 'student' && $validated['role'] === 'student') {
            Student::firstOrCreate(
                ['user_id' => $user->id],
                ['student_id' => 'STU-' . str_pad($user->id, 6, '0', STR_PAD_LEFT)]
            );
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        $admin = Auth::user();

        // Admin can only delete users in their department (teachers) or students
        if ($user->hasRole('teacher') && $user->department_id !== $admin->department_id) {
            return redirect()->route('admin.users.index')
                ->with('error', 'You can only delete teachers in your department.');
        }

        // Prevent admin from deleting themselves
        if ($user->id === Auth::id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        // Delete associated student record if exists
        if ($user->student) {
            $user->student->delete();
        }

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }

    /**
     * Reset password for a user.
     */
    public function resetPassword(Request $request, User $user)
    {
        $validated = $request->validate([
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Password reset successfully.');
    }

    /**
     * Bulk delete users.
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id',
            'password' => 'required|string',
        ]);

        // Verify the admin's password
        $currentUser = Auth::user();
        if (!Hash::check($validated['password'], $currentUser->password)) {
            return back()->withErrors(['password' => 'The password you entered is incorrect.']);
        }

        // Filter out the current admin user
        $currentUserId = Auth::id();
        $idsToDelete = collect($validated['ids'])
            ->map(fn($id) => (int) $id)
            ->filter(fn($id) => $id !== $currentUserId)
            ->unique()
            ->values();

        if ($idsToDelete->isEmpty()) {
            return back()->withErrors(['ids' => 'No eligible users selected for deletion.']);
        }

        // Restrict bulk delete scope to students and teachers within admin permissions.
        $scopedIds = User::query()
            ->whereIn('id', $idsToDelete)
            ->where(function ($query) use ($currentUser) {
                $query->whereHas('roles', function ($roleQuery) {
                    $roleQuery->where('name', 'student');
                });

                if ($currentUser->department_id) {
                    $query->orWhere(function ($departmentQuery) use ($currentUser) {
                        $departmentQuery->where('department_id', $currentUser->department_id)
                            ->whereHas('roles', function ($roleQuery) {
                                $roleQuery->where('name', 'teacher');
                            });
                    });
                } else {
                    $query->orWhereHas('roles', function ($roleQuery) {
                        $roleQuery->where('name', 'teacher');
                    });
                }
            })
            ->pluck('id');

        if ($scopedIds->count() !== $idsToDelete->count()) {
            return back()->withErrors([
                'ids' => 'One or more selected users are outside your allowed scope.',
            ]);
        }

        // Delete associated student records
        Student::whereIn('user_id', $scopedIds)->delete();

        // Delete users
        User::whereIn('id', $scopedIds)->delete();

        return back()->with('success', $scopedIds->count() . ' user(s) deleted successfully.');
    }

    /**
     * Display password reset requests.
     */
    public function passwordResetRequests(Request $request)
    {
        $admin = Auth::user();
        $status = $request->input('status', 'pending');

        // Build query
        $query = PasswordResetRequest::with(['user', 'processedBy']);

        // Scope to admin's department (teachers) + all students
        if ($admin->department_id) {
            $query->whereHas('user', function ($q) use ($admin) {
                $q->where(function ($q2) use ($admin) {
                    $q2->where('department_id', $admin->department_id)
                        ->orWhereHas('roles', function ($roleQuery) {
                            $roleQuery->where('name', 'student');
                        });
                });
            });
        }

        // Filter by status
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $requests = $query->latest()->paginate(15);

        // Get counts for each status
        $countsQuery = PasswordResetRequest::query();
        if ($admin->department_id) {
            $countsQuery->whereHas('user', function ($q) use ($admin) {
                $q->where(function ($q2) use ($admin) {
                    $q2->where('department_id', $admin->department_id)
                        ->orWhereHas('roles', function ($roleQuery) {
                            $roleQuery->where('name', 'student');
                        });
                });
            });
        }

        $counts = [
            'pending' => (clone $countsQuery)->where('status', 'pending')->count(),
            'approved' => (clone $countsQuery)->where('status', 'approved')->count(),
            'rejected' => (clone $countsQuery)->where('status', 'rejected')->count(),
            'all' => (clone $countsQuery)->count(),
        ];

        return Inertia::render('Admin/PasswordResetRequests', [
            'requests' => $requests,
            'counts' => $counts,
            'currentStatus' => $status,
        ]);
    }

    /**
     * Approve a password reset request.
     * Generates an 8-character temporary password for F2F reset.
     * The user must change this password on next login.
     */
    public function approvePasswordResetRequest(Request $request, PasswordResetRequest $passwordResetRequest)
    {
        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        if (blank($passwordResetRequest->user->email)) {
            return back()->withErrors([
                'email' => 'Cannot approve this reset request because the user has no email on file.',
            ]);
        }

        // Generate a random 8-character password
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        $tempPassword = '';
        for ($i = 0; $i < 8; $i++) {
            $tempPassword .= $chars[random_int(0, strlen($chars) - 1)];
        }

        // Update user's password and flag for forced change
        $passwordResetRequest->user->update([
            'password' => Hash::make($tempPassword),
            'must_change_password' => true,
            'password_changed_at' => null,
            'temporary_password' => $passwordResetRequest->user->hasRole('student')
                ? $tempPassword
                : null,
        ]);

        // Update request status
        $passwordResetRequest->update([
            'status' => PasswordResetRequest::STATUS_APPROVED,
            'admin_notes' => $validated['admin_notes'],
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
     * Reject a password reset request.
     */
    public function rejectPasswordResetRequest(Request $request, PasswordResetRequest $passwordResetRequest)
    {
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
}

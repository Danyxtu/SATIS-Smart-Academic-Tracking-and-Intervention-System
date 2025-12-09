<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Enrollment;
use App\Models\PasswordResetRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
            'totalStudents' => (clone $departmentUsersQuery)->where('role', 'student')->count(),
            'totalTeachers' => (clone $departmentUsersQuery)->where('role', 'teacher')->count(),
            'totalAdmins' => (clone $departmentUsersQuery)->where('role', 'admin')->count(),
            'recentUsers' => (clone $departmentUsersQuery)->latest()->take(5)->get(['id', 'name', 'email', 'role', 'created_at']),
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
                'name' => $department->name,
                'code' => $department->code,
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

        $query = User::query();

        // Scope to admin's department (teachers and students only)
        if ($departmentId) {
            $query->where(function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId)
                    ->orWhere('role', 'student'); // Students may not have department
            });
        }

        // Search by name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Filter by section (for students)
        if ($request->filled('section') && $request->section !== 'all') {
            $query->where('role', 'student')
                ->whereHas('student', function ($q) use ($request) {
                    $q->where('section', $request->section);
                });
        }

        // Sort
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        // Validate sort field
        $allowedSortFields = ['name', 'email', 'role', 'created_at'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');

        // Eager load student data with enrollments and subjects
        $query->with(['student.user', 'student']);

        // Paginate results
        $users = $query->paginate(15)->withQueryString();

        // Transform users to include section and teacher info
        $users->getCollection()->transform(function ($user) {
            if ($user->role === 'student' && $user->student) {
                $user->section = $user->student->section;
                $user->grade_level = $user->student->grade_level;
                $user->strand = $user->student->strand;

                // Get teachers for this student's subjects
                $enrollments = Enrollment::where('user_id', $user->id)
                    ->with(['subject.teacher'])
                    ->get();

                $user->subjects = $enrollments->map(function ($enrollment) {
                    return [
                        'name' => $enrollment->subject->name ?? 'N/A',
                        'teacher' => $enrollment->subject->teacher->name ?? 'N/A',
                    ];
                });
            }
            return $user;
        });

        // Get role counts for filter badges (scoped to department)
        $roleCountsQuery = User::query();
        if ($departmentId) {
            $roleCountsQuery->where(function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId)
                    ->orWhere('role', 'student');
            });
        }

        $roleCounts = [
            'all' => (clone $roleCountsQuery)->count(),
            'student' => (clone $roleCountsQuery)->where('role', 'student')->count(),
            'teacher' => (clone $roleCountsQuery)->where('role', 'teacher')->count(),
            'admin' => (clone $roleCountsQuery)->where('role', 'admin')->count(),
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
                'name' => $department->name,
                'code' => $department->code,
            ] : null,
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        $admin = Auth::user();
        $department = $admin->department;

        return Inertia::render('Admin/Users/Create', [
            'department' => $department ? [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
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
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|in:student,teacher', // Admin cannot create other admins
        ];

        // Only require password for non-student roles
        if ($request->role !== 'student') {
            $rules['password'] = ['required', 'confirmed', Rules\Password::defaults()];
        }

        $validated = $request->validate($rules);

        // Generate random password for students, use provided password for others
        $tempPassword = null;
        if ($validated['role'] === 'student') {
            $tempPassword = Str::random(10);
            $password = $tempPassword;
        } else {
            $password = $validated['password'];
        }

        // Create user with department assignment for teachers
        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($password),
            'role' => $validated['role'],
            'created_by' => $admin->id,
        ];

        // Assign department for teachers
        if ($validated['role'] === 'teacher' && $departmentId) {
            $userData['department_id'] = $departmentId;
        }

        $user = User::create($userData);

        // If creating a student, also create the student profile
        if ($validated['role'] === 'student') {
            Student::create([
                'user_id' => $user->id,
                'student_id' => 'STU-' . str_pad($user->id, 6, '0', STR_PAD_LEFT),
            ]);

            // Return with temporary password for student
            return redirect()->route('admin.users.index')
                ->with('success', 'Student created successfully.')
                ->with('tempPassword', $tempPassword)
                ->with('createdUser', [
                    'name' => $user->name,
                    'email' => $user->email,
                ]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'Teacher created successfully and assigned to your department.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        $admin = Auth::user();
        $department = $admin->department;

        // Admin can only edit users in their department (teachers) or students
        if ($user->role === 'teacher' && $user->department_id !== $admin->department_id) {
            return redirect()->route('admin.users.index')
                ->with('error', 'You can only edit teachers in your department.');
        }

        return Inertia::render('Admin/Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'department_id' => $user->department_id,
                'created_at' => $user->created_at->format('M d, Y'),
            ],
            'department' => $department ? [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
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
        if ($user->role === 'teacher' && $user->department_id !== $admin->department_id) {
            return redirect()->route('admin.users.index')
                ->with('error', 'You can only edit teachers in your department.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => 'required|in:student,teacher', // Admin cannot change role to admin
        ]);

        $oldRole = $user->role;

        // Prepare update data
        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ];

        // If changing to teacher, assign department
        if ($validated['role'] === 'teacher' && $admin->department_id) {
            $updateData['department_id'] = $admin->department_id;
        }

        $user->update($updateData);

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
        if ($user->role === 'teacher' && $user->department_id !== $admin->department_id) {
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
        ]);

        // Filter out the current admin user
        $currentUserId = Auth::id();
        $idsToDelete = array_filter($validated['ids'], fn($id) => $id !== $currentUserId);

        // Delete associated student records
        Student::whereIn('user_id', $idsToDelete)->delete();

        // Delete users
        User::whereIn('id', $idsToDelete)->delete();

        return back()->with('success', count($idsToDelete) . ' user(s) deleted successfully.');
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

        // Scope to admin's department if applicable
        if ($admin->department_id) {
            $query->whereHas('user', function ($q) use ($admin) {
                $q->where('department_id', $admin->department_id);
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
                $q->where('department_id', $admin->department_id);
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
     */
    public function approvePasswordResetRequest(Request $request, PasswordResetRequest $passwordResetRequest)
    {
        $validated = $request->validate([
            'new_password' => ['required', Rules\Password::defaults()],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        // Update user's password
        $passwordResetRequest->user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        // Update request status
        $passwordResetRequest->update([
            'status' => PasswordResetRequest::STATUS_APPROVED,
            'admin_notes' => $validated['admin_notes'],
            'processed_by' => Auth::id(),
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Password reset request approved. User password has been changed.');
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

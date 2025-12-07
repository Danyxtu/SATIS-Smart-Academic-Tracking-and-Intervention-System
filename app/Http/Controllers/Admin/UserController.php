<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Enrollment;
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
        $stats = [
            'totalUsers' => User::count(),
            'totalStudents' => User::where('role', 'student')->count(),
            'totalTeachers' => User::where('role', 'teacher')->count(),
            'totalAdmins' => User::where('role', 'admin')->count(),
            'recentUsers' => User::latest()->take(5)->get(['id', 'name', 'email', 'role', 'created_at']),
        ];

        // Get user creation trends (last 7 days)
        $userTrends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $userTrends[] = [
                'date' => now()->subDays($i)->format('M d'),
                'count' => User::whereDate('created_at', $date)->count(),
            ];
        }

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'userTrends' => $userTrends,
        ]);
    }

    /**
     * Display a listing of all users with search, filter, and sort.
     */
    public function index(Request $request)
    {
        $query = User::query();

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

        // Get role counts for filter badges
        $roleCounts = [
            'all' => User::count(),
            'student' => User::where('role', 'student')->count(),
            'teacher' => User::where('role', 'teacher')->count(),
            'admin' => User::where('role', 'admin')->count(),
        ];

        // Get unique sections for filter
        $sections = Student::distinct()->pluck('section')->filter()->sort()->values();

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
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        return Inertia::render('Admin/Users/Create');
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        // Different validation rules based on role
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|in:student,teacher,admin',
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

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($password),
            'role' => $validated['role'],
        ]);

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
            ->with('success', 'User created successfully.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at->format('M d, Y'),
            ],
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => 'required|in:student,teacher,admin',
        ]);

        $oldRole = $user->role;

        $user->update($validated);

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
}

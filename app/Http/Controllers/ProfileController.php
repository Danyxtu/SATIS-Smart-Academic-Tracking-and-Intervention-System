<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\PasswordResetRequest;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function editStudent(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user->hasRole('student'), 403);

        $student = Student::where('user_id', $user->id)->first();

        // Get pending password reset request if any
        $pendingPasswordReset = PasswordResetRequest::where('user_id', $user->id)
            ->pending()
            ->first();

        return Inertia::render('Student/ProfileSettings', [
            'status' => session('status'),
            'student' => $student ? [
                'id' => $student->id,
                'student_name' => $student->student_name,
                'lrn' => $student->lrn,
                'grade_level' => $student->grade_level,
                'section' => $student->section,
                'strand' => $student->strand,
                'track' => $student->track,
                'avatar' => $student->avatar,
            ] : null,
            'pendingPasswordReset' => $pendingPasswordReset ? [
                'id' => $pendingPasswordReset->id,
                'reason' => $pendingPasswordReset->reason,
                'status' => $pendingPasswordReset->status,
                'created_at' => $pendingPasswordReset->created_at->diffForHumans(),
            ] : null,
        ]);
    }

    /**
     * Display the school staff profile form.
     */
    public function editSchoolStaff(Request $request): Response
    {
        $user = $request->user();

        abort_unless(
            $user->hasRole('teacher') || $user->hasRole('admin') || $user->hasRole('super_admin'),
            403
        );

        $pendingPasswordReset = PasswordResetRequest::where('user_id', $user->id)
            ->pending()
            ->first();

        return Inertia::render('SchoolStaff/ProfileSchoolStaff', [
            'status' => session('status'),
            'pendingPasswordReset' => $pendingPasswordReset ? [
                'id' => $pendingPasswordReset->id,
                'reason' => $pendingPasswordReset->reason,
                'status' => $pendingPasswordReset->status,
                'created_at' => $pendingPasswordReset->created_at->diffForHumans(),
            ] : null,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Update user
        $user->fill([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'personal_email' => $validated['email'],
        ]);

        if ($user->isDirty('personal_email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Update student profile if user is a student
        if ($user->hasRole('student')) {
            $student = Student::where('user_id', $user->id)->first();

            if ($student) {
                $student->update([
                    'student_name' => $validated['student_name'] ?? $student->student_name,
                    'lrn' => $validated['lrn'] ?? $student->lrn,
                    'grade_level' => $validated['grade_level'] ?? $student->grade_level,
                    'section' => $validated['section'] ?? $student->section,
                    'strand' => $validated['strand'] ?? $student->strand,
                    'track' => $validated['track'] ?? $student->track,
                ]);
            }
        }

        return Redirect::route($this->resolveEditRouteName($user))->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Submit a password reset request to admin.
     */
    public function requestPasswordReset(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Check if there's already a pending request
        $existingRequest = PasswordResetRequest::where('user_id', $user->id)
            ->pending()
            ->first();

        if ($existingRequest) {
            return back()->with('error', 'You already have a pending password reset request.');
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        PasswordResetRequest::create([
            'user_id' => $user->id,
            'reason' => $validated['reason'] ?? 'Password reset requested by user.',
            'status' => 'pending',
        ]);

        return back()->with('success', 'Your password reset request has been submitted. An admin or super admin will review it shortly.');
    }

    /**
     * Cancel a pending password reset request.
     */
    public function cancelPasswordResetRequest(Request $request): RedirectResponse
    {
        $user = $request->user();

        $pendingRequest = PasswordResetRequest::where('user_id', $user->id)
            ->pending()
            ->first();

        if (!$pendingRequest) {
            return back()->with('error', 'No pending password reset request found.');
        }

        $pendingRequest->delete();

        return back()->with('success', 'Your password reset request has been cancelled.');
    }

    /**
     * Resolve the profile edit route name based on user role.
     */
    private function resolveEditRouteName($user): string
    {
        return $user->hasRole('student')
            ? 'student.profile.edit'
            : 'schoolstaff.profile.edit';
    }
}

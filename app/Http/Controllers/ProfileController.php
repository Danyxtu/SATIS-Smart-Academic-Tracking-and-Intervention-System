<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\PasswordResetRequest;
use App\Models\Student;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $student = null;

        // If user is a student, get their student profile data
        if ($user->role === 'student') {
            $student = Student::where('user_id', $user->id)->first();
        }

        // Get pending password reset request if any
        $pendingPasswordReset = PasswordResetRequest::where('user_id', $user->id)
            ->pending()
            ->first();

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
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
     * Update the user's profile information.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Validate user fields
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            // Student-specific fields (optional)
            'student_name' => ['nullable', 'string', 'max:255'],
            'lrn' => ['nullable', 'string', 'max:20'],
            'grade_level' => ['nullable', 'string', 'max:50'],
            'section' => ['nullable', 'string', 'max:50'],
            'strand' => ['nullable', 'string', 'max:100'],
            'track' => ['nullable', 'string', 'max:100'],
        ]);

        // Update user
        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Update student profile if user is a student
        if ($user->role === 'student') {
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

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
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

        return back()->with('success', 'Your password reset request has been submitted. An admin will review it shortly.');
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
}

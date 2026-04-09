<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetRequest;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StudentProfileController extends Controller
{
    /**
     * Get the authenticated student's profile data.
     */
    public function index(Request $request)
    {
        $this->ensureStudentAccess($request);

        $user = $request->user();
        $student = $user->student;
        $pendingPasswordReset = PasswordResetRequest::where('user_id', $user->id)
            ->pending()
            ->latest('id')
            ->first();

        return response()->json($this->formatProfilePayload($user, $student, $pendingPasswordReset));
    }

    /**
     * Update authenticated student profile details.
     */
    public function update(Request $request)
    {
        $this->ensureStudentAccess($request);

        $user = $request->user();
        $student = $user->student;

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class, 'personal_email')->ignore($user->id),
            ],
            'student_name' => ['nullable', 'string', 'max:255'],
            'lrn' => ['nullable', 'string', 'max:20'],
            'grade_level' => ['nullable', 'string', 'max:50'],
            'section' => ['nullable', 'string', 'max:50'],
            'strand' => ['nullable', 'string', 'max:100'],
            'track' => ['nullable', 'string', 'max:100'],
        ]);

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

        $pendingPasswordReset = PasswordResetRequest::where('user_id', $user->id)
            ->pending()
            ->latest('id')
            ->first();

        return response()->json([
            'message' => 'Profile updated successfully.',
            ...$this->formatProfilePayload($user->fresh(), $student?->fresh(), $pendingPasswordReset),
        ]);
    }

    /**
     * Update the student's password.
     */
    public function updatePassword(Request $request)
    {
        $this->ensureStudentAccess($request);

        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    /**
     * Create a password reset request for the authenticated student.
     */
    public function requestPasswordReset(Request $request)
    {
        $this->ensureStudentAccess($request);

        $user = $request->user();
        $existingRequest = PasswordResetRequest::where('user_id', $user->id)
            ->pending()
            ->first();

        if ($existingRequest) {
            return response()->json([
                'message' => 'You already have a pending password reset request.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $passwordReset = PasswordResetRequest::create([
            'user_id' => $user->id,
            'reason' => $validated['reason'] ?? 'Password reset requested by user.',
            'status' => PasswordResetRequest::STATUS_PENDING,
        ]);

        return response()->json([
            'message' => 'Your password reset request has been submitted. An admin will review it shortly.',
            'pendingPasswordReset' => [
                'id' => $passwordReset->id,
                'reason' => $passwordReset->reason,
                'status' => $passwordReset->status,
                'createdAt' => $passwordReset->created_at->toISOString(),
                'createdAtHuman' => $passwordReset->created_at->diffForHumans(),
            ],
        ], 201);
    }

    /**
     * Cancel an existing pending password reset request.
     */
    public function cancelPasswordResetRequest(Request $request)
    {
        $this->ensureStudentAccess($request);

        $user = $request->user();
        $pendingRequest = PasswordResetRequest::where('user_id', $user->id)
            ->pending()
            ->first();

        if (! $pendingRequest) {
            return response()->json([
                'message' => 'No pending password reset request found.',
            ], 404);
        }

        $pendingRequest->delete();

        return response()->json([
            'message' => 'Your password reset request has been cancelled.',
        ]);
    }

    /**
     * Delete the authenticated student's account.
     */
    public function destroy(Request $request)
    {
        $this->ensureStudentAccess($request);

        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => 'Account deleted successfully.',
        ]);
    }

    /**
     * Ensure these API actions are accessible to students only.
     */
    private function ensureStudentAccess(Request $request): void
    {
        abort_unless($request->user()?->hasRole('student'), 403, 'Student access only.');
    }

    /**
     * Shape profile payload for mobile and web parity.
     */
    private function formatProfilePayload(User $user, ?Student $student, ?PasswordResetRequest $pendingPasswordReset = null): array
    {
        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'middleName' => $user->middle_name,
            ],
            'student' => [
                'id' => $student?->id,
                'studentName' => $student?->student_name,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'middleName' => $user->middle_name,
                'lrn' => $student?->lrn,
                'gradeLevel' => $student?->grade_level,
                'section' => $student?->section,
                'strand' => $student?->strand,
                'track' => $student?->track,
                'avatar' => $student?->avatar,
            ],
            'pendingPasswordReset' => $pendingPasswordReset ? [
                'id' => $pendingPasswordReset->id,
                'reason' => $pendingPasswordReset->reason,
                'status' => $pendingPasswordReset->status,
                'createdAt' => $pendingPasswordReset->created_at?->toISOString(),
                'createdAtHuman' => $pendingPasswordReset->created_at?->diffForHumans(),
            ] : null,
        ];
    }
}

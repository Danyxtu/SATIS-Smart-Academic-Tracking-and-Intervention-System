<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'nullable|string|max:255|required_without:email',
            'email' => 'nullable|string|max:255|required_without:login',
            'password' => 'required',
        ]);

        $identifier = Str::lower(trim((string) ($request->input('login') ?? $request->input('email'))));

        $query = User::query()->where('username', $identifier);

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $query->orWhere('personal_email', $identifier);
        }

        $user = $query->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $validPassword = Hash::check($request->password, $user->password);

        if (! $validPassword) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Issue Sanctum token
        $token = $user->createToken('mobile-app')->plainTextToken;

        $verificationState = $this->buildStudentVerificationState($user);

        return response()->json([
            'token' => $token,
            'user' => $user,
            'must_change_password' => $user->must_change_password ?? false,
            ...$verificationState,
        ]);
    }

    /**
     * Force change password for new accounts.
     */
    public function forceChangePassword(Request $request)
    {
        $request->validate([
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'temporary_password' => null,
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);

        $freshUser = $user->fresh();
        $verificationState = $this->buildStudentVerificationState($freshUser);

        return response()->json([
            'message' => 'Password changed successfully.',
            'user' => $freshUser,
            ...$verificationState,
        ]);
    }

    /**
     * Return mobile-friendly student email verification status.
     */
    public function studentEmailVerificationStatus(Request $request)
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('student')) {
            return response()->json([
                'message' => 'Student access only.',
            ], 403);
        }

        $verificationState = $this->buildStudentVerificationState($user);

        return response()->json([
            'user' => $user,
            ...$verificationState,
            'verification_expire_minutes' => (int) config('auth.verification.expire', 30),
        ]);
    }

    /**
     * Set/update personal email and send (or resend) verification email.
     */
    public function sendStudentEmailVerification(Request $request)
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('student')) {
            return response()->json([
                'message' => 'Student access only.',
            ], 403);
        }

        $validated = $request->validate([
            'email' => [
                'nullable',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class, 'personal_email')->ignore($user->id),
            ],
        ]);

        $submittedEmail = isset($validated['email'])
            ? Str::lower(trim((string) $validated['email']))
            : null;

        if (filled($submittedEmail) && $submittedEmail !== $user->personal_email) {
            $user->forceFill([
                'personal_email' => $submittedEmail,
                'email_verified_at' => null,
            ])->save();

            $user->refresh();
        }

        if (! filled((string) $user->personal_email)) {
            return response()->json([
                'message' => 'Please enter a personal email before requesting verification.',
                'errors' => [
                    'email' => ['Personal email is required.'],
                ],
            ], 422);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        $verificationState = $this->buildStudentVerificationState($user->fresh());

        return response()->json([
            'message' => $verificationState['requires_email_verification']
                ? 'Verification email sent. Please verify within 30 minutes.'
                : 'Email is already verified.',
            'user' => $user->fresh(),
            ...$verificationState,
            'verification_expire_minutes' => (int) config('auth.verification.expire', 30),
        ]);
    }

    /**
     * Logout and revoke the current access token.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken|null $token */
        $token = $request->user()?->currentAccessToken();
        $token?->delete();

        return response()->json(['message' => 'Logged out']);
    }

    /**
     * Build account-readiness flags for student-first mobile auth flow.
     *
     * @return array<string, bool>
     */
    private function buildStudentVerificationState(User $user): array
    {
        $isStudent = $user->hasRole('student');
        $hasPersonalEmail = filled((string) $user->personal_email);
        $isEmailVerified = $hasPersonalEmail && $user->hasVerifiedEmail();

        return [
            'has_personal_email' => $hasPersonalEmail,
            'email_verified' => $isEmailVerified,
            'requires_personal_email' => $isStudent && ! $hasPersonalEmail,
            'requires_email_verification' => $isStudent && ! $isEmailVerified,
        ];
    }
}

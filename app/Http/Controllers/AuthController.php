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

        // Email verification is disabled; always treat as verified
        return response()->json([
            'token' => $token,
            'user' => $user,
            'must_change_password' => $user->must_change_password ?? false,
            'has_personal_email' => filled((string) $user->personal_email),
            'email_verified' => true,
            'requires_personal_email' => false,
            'requires_email_verification' => false,
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
        // Email verification is disabled; always treat as verified
        return response()->json([
            'message' => 'Password changed successfully.',
            'user' => $freshUser,
            'has_personal_email' => filled((string) $freshUser->personal_email),
            'email_verified' => true,
            'requires_personal_email' => false,
            'requires_email_verification' => false,
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

        // Email verification is disabled; always treat as verified
        return response()->json([
            'user' => $user,
            'has_personal_email' => filled((string) $user->personal_email),
            'email_verified' => true,
            'requires_personal_email' => false,
            'requires_email_verification' => false,
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
                'email_verified_at' => now(),
            ])->save();

            $user->refresh();
        }

        // Email verification is disabled; always treat as verified
        return response()->json([
            'message' => 'Email verification is not required. You may proceed.',
            'user' => $user->fresh(),
            'has_personal_email' => filled((string) $user->personal_email),
            'email_verified' => true,
            'requires_personal_email' => false,
            'requires_email_verification' => false,
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
    // Email verification is disabled; this method is no longer used.
}

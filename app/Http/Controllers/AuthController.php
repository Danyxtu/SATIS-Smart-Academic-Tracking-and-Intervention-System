<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

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

        $accountReadiness = $this->accountReadinessFlags($user);

        return response()->json([
            'token' => $token,
            'user' => $user,
            'must_change_password' => $user->must_change_password ?? false,
            ...$accountReadiness,
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
        $accountReadiness = $this->accountReadinessFlags($freshUser);

        return response()->json([
            'message' => 'Password changed successfully.',
            'user' => $freshUser,
            ...$accountReadiness,
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

        $freshUser = $user->fresh();
        $accountReadiness = $this->accountReadinessFlags($freshUser);

        return response()->json([
            'user' => $freshUser,
            ...$accountReadiness,
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

        $freshUser = $user->fresh();

        if (! filled((string) $freshUser->personal_email)) {
            return response()->json([
                'message' => 'A personal email is required before requesting verification.',
                'user' => $freshUser,
                ...$this->accountReadinessFlags($freshUser),
                'verification_expire_minutes' => (int) config('auth.verification.expire', 30),
            ], 422);
        }

        if (! $freshUser->hasVerifiedEmail()) {
            try {
                $freshUser->sendEmailVerificationNotification();
            } catch (Throwable $exception) {
                Log::error('Student verification email send failed (API).', [
                    'user_id' => $freshUser->id,
                    'personal_email' => $freshUser->personal_email,
                    'mailer' => config('mail.default'),
                    'message' => $exception->getMessage(),
                ]);

                return response()->json([
                    'message' => 'Verification email could not be sent right now. Please try again later.',
                    'user' => $freshUser,
                    ...$this->accountReadinessFlags($freshUser),
                    'verification_expire_minutes' => (int) config('auth.verification.expire', 30),
                ], 503);
            }
        }

        return response()->json([
            'message' => $freshUser->hasVerifiedEmail()
                ? 'Email is already verified. You may proceed.'
                : 'A verification link has been sent to your personal email.',
            'user' => $freshUser,
            ...$this->accountReadinessFlags($freshUser),
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
     * Build account-readiness flags used by mobile auth responses.
     *
     * @return array<string, bool>
     */
    private function accountReadinessFlags(User $user): array
    {
        $requiresVerification = $user->hasRole('student')
            || $user->hasRole('super_admin')
            || $user->hasRole('teacher');
        $hasPersonalEmail = filled((string) $user->personal_email);
        $isEmailVerified = $requiresVerification
            ? ($hasPersonalEmail && $user->hasVerifiedEmail())
            : true;

        return [
            'has_personal_email' => $hasPersonalEmail,
            'email_verified' => $isEmailVerified,
            'requires_personal_email' => $requiresVerification && ! $hasPersonalEmail,
            'requires_email_verification' => $requiresVerification && $hasPersonalEmail && ! $isEmailVerified,
        ];
    }
}

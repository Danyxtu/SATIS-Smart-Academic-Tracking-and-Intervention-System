<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EmailVerificationOtp;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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
        $retryAfterSeconds = 0;

        if (! $freshUser->hasVerifiedEmail()) {
            $latestOtp = EmailVerificationOtp::query()
                ->where('user_id', $freshUser->id)
                ->latest('updated_at')
                ->first();

            if ($latestOtp && now()->lt($latestOtp->resend_available_at)) {
                $retryAfterSeconds = now()->diffInSeconds($latestOtp->resend_available_at);
            }
        }

        return response()->json([
            'user' => $freshUser,
            ...$accountReadiness,
            'verification_expire_minutes' => 6,
            'resend_cooldown_seconds' => 180,
            'retry_after_seconds' => $retryAfterSeconds,
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
            'requires_email_verification' => $requiresVerification && ! $isEmailVerified,
        ];
    }
}

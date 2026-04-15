<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Models\EmailVerificationOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EmailOtpVerificationController extends Controller
{
    private const OTP_LENGTH = 6;
    private const OTP_EXPIRY_MINUTES = 6;
    private const RESEND_COOLDOWN_SECONDS = 180;

    public function send(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'lowercase',
                Rule::unique(User::class, 'personal_email')->ignore($user->id),
            ],
        ]);

        $email = Str::lower(trim((string) $validated['email']));
        $now = now();

        $latestOtp = EmailVerificationOtp::query()
            ->where('user_id', $user->id)
            ->latest('updated_at')
            ->first();

        if ($latestOtp && $now->lt($latestOtp->resend_available_at)) {
            $retryAfterSeconds = $now->diffInSeconds($latestOtp->resend_available_at);

            return response()->json([
                'message' => 'Please wait before resending another OTP.',
                'resend_in' => $retryAfterSeconds,
                'cooldown_seconds' => self::RESEND_COOLDOWN_SECONDS,
            ], 429);
        }

        $otp = str_pad((string) random_int(0, 999999), self::OTP_LENGTH, '0', STR_PAD_LEFT);

        EmailVerificationOtp::query()->where('user_id', $user->id)->delete();

        EmailVerificationOtp::query()->create([
            'user_id' => $user->id,
            'email' => $email,
            'otp' => $otp,
            'expires_at' => $now->copy()->addMinutes(self::OTP_EXPIRY_MINUTES),
            'resend_available_at' => $now->copy()->addSeconds(self::RESEND_COOLDOWN_SECONDS),
        ]);

        Mail::to($email)->send(new OtpMail($otp, self::OTP_EXPIRY_MINUTES));

        return response()->json([
            'message' => 'OTP sent successfully.',
            'resend_in' => self::RESEND_COOLDOWN_SECONDS,
            'cooldown_seconds' => self::RESEND_COOLDOWN_SECONDS,
            'expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'lowercase',
                Rule::unique(User::class, 'personal_email')->ignore($user->id),
            ],
            'otp' => ['required', 'digits:6'],
        ]);

        $email = Str::lower(trim((string) $validated['email']));
        $submittedOtp = trim((string) $validated['otp']);
        $now = now();

        $record = EmailVerificationOtp::query()
            ->where('user_id', $user->id)
            ->where('email', $email)
            ->where('otp', $submittedOtp)
            ->latest('updated_at')
            ->first();

        if (! $record) {
            return response()->json([
                'message' => 'Invalid OTP for this email address.',
            ], 422);
        }

        if ($now->greaterThan($record->expires_at)) {
            $record->delete();

            return response()->json([
                'message' => 'OTP expired. Please request a new code.',
            ], 422);
        }

        $user->forceFill([
            'personal_email' => $email,
            'email_verified_at' => $now,
        ])->save();

        EmailVerificationOtp::query()->where('user_id', $user->id)->delete();

        $redirectPath = Route::has('redirect-after-login')
            ? route('redirect-after-login', absolute: false)
            : '/';

        return response()->json([
            'message' => 'Email verified successfully.',
            'redirect_to' => $redirectPath,
            'user' => $user->fresh(),
            'has_personal_email' => true,
            'email_verified' => true,
            'requires_personal_email' => false,
            'requires_email_verification' => false,
        ]);
    }
}

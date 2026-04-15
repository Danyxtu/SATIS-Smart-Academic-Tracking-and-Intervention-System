<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\EmailVerificationOtp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class EmailOtpPromptController extends Controller
{
    private const OTP_EXPIRY_MINUTES = 6;
    private const RESEND_COOLDOWN_SECONDS = 180;

    /**
     * Display the OTP verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        $user = $request->user();

        $redirectPath = Route::has('redirect-after-login')
            ? route('redirect-after-login', absolute: false)
            : '/';

        if ($user->hasVerifiedEmail() && filled((string) $user->personal_email)) {
            return redirect()->intended($redirectPath);
        }

        $retryAfterSeconds = 0;

        $latestOtp = EmailVerificationOtp::query()
            ->where('user_id', $user->id)
            ->latest('updated_at')
            ->first();

        if ($latestOtp && now()->lt($latestOtp->resend_available_at)) {
            $retryAfterSeconds = now()->diffInSeconds($latestOtp->resend_available_at);
        }

        return Inertia::render('Auth/EmailOtpVerification', [
            'status' => session('status'),
            'currentEmail' => $user->personal_email,
            'requiresEmailInput' => ! filled((string) $user->personal_email),
            'expiresInMinutes' => self::OTP_EXPIRY_MINUTES,
            'retryAfterSeconds' => $retryAfterSeconds,
            'cooldownSeconds' => self::RESEND_COOLDOWN_SECONDS,
        ]);
    }
}

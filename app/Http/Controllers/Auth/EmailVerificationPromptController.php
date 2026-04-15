<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\EmailVerificationResendLimiter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        $user = $request->user();
        $redirectPath = Route::has('redirect-after-login')
            ? route('redirect-after-login', absolute: false)
            : '/';
        $retryAfterSeconds = $user->hasVerifiedEmail()
            ? 0
            : EmailVerificationResendLimiter::retryAfter($user);

        if ($user->hasVerifiedEmail() && filled((string) $user->personal_email)) {
            return redirect()->intended($redirectPath);
        }

        return Inertia::render('Auth/VerifyEmail', [
            'status' => session('status'),
            'currentEmail' => $user->personal_email,
            'requiresEmailInput' => ! filled((string) $user->personal_email),
            'expiresInMinutes' => (int) config('auth.verification.expire', 30),
            'retryAfterSeconds' => max(
                $retryAfterSeconds,
                max(0, (int) session('retryAfterSeconds', 0))
            ),
            'cooldownSeconds' => max(1, (int) session('cooldownSeconds', EmailVerificationResendLimiter::cooldownSeconds())),
        ]);
    }
}

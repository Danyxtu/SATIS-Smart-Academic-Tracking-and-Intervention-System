<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        if ($user->hasVerifiedEmail() && filled((string) $user->personal_email)) {
            return redirect()->intended(route('redirect-after-login', absolute: false));
        }

        return Inertia::render('Auth/VerifyEmail', [
            'status' => session('status'),
            'currentEmail' => $user->personal_email,
            'requiresEmailInput' => ! filled((string) $user->personal_email),
            'expiresInMinutes' => (int) config('auth.verification.expire', 30),
        ]);
    }
}

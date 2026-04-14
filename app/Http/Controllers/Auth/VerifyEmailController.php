<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Throwable;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        $redirectPath = Route::has('redirect-after-login')
            ? route('redirect-after-login', absolute: false)
            : '/';

        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended($redirectPath . '?verified=1');
        }

        try {
            if ($request->user()->markEmailAsVerified()) {
                event(new Verified($request->user()));
            }
        } catch (Throwable $exception) {
            Log::error('Email verification finalization failed.', [
                'user_id' => $request->user()?->id,
                'message' => $exception->getMessage(),
            ]);

            return redirect()->route('verification.notice')->withErrors([
                'email' => 'We could not complete email verification right now. Please try again.',
            ]);
        }

        return redirect()->intended($redirectPath . '?verified=1');
    }
}

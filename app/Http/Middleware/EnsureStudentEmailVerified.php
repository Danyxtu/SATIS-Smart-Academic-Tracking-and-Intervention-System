<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStudentEmailVerified
{
    /**
     * Redirect students to verification flow until they have a personal email
     * and a verified email address.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('student')) {
            return $next($request);
        }

        if ($user->must_change_password) {
            return redirect()->route('password.force-change');
        }

        if (! filled((string) $user->personal_email)) {
            return redirect()
                ->route('verification.notice')
                ->with('status', 'verification-email-required');
        }

        if (! $user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        return $next($request);
    }
}

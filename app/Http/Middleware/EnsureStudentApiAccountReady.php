<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStudentApiAccountReady
{
    /**
     * Block student API data access until first-login requirements are complete.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('student')) {
            return response()->json([
                'message' => 'Student access only.',
                'code' => 'student_only',
            ], 403);
        }

        if ($user->must_change_password) {
            return response()->json([
                'message' => 'Password change is required before continuing.',
                'code' => 'password_change_required',
            ], 403);
        }

        if (! filled((string) $user->personal_email)) {
            return response()->json([
                'message' => 'A personal email is required before continuing.',
                'code' => 'personal_email_required',
            ], 403);
        }

        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Please verify your personal email before continuing.',
                'code' => 'email_verification_required',
            ], 403);
        }

        return $next($request);
    }
}

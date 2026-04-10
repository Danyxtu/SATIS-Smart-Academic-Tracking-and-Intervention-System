<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // We will send the password reset link to this user. Once we have attempted
        // to send the link, we will examine the response then see the message we
        // need to show to the user. Finally, we'll send out a proper response.
        $status = Password::sendResetLink(
            ['personal_email' => Str::lower($request->email)]
        );

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }

    /**
     * Handle an incoming admin password reset request from a teacher.
     */
    public function requestAdminReset(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
            'reason' => 'required|string|max:500',
        ]);

        // Find the user by email
        $user = User::where('personal_email', Str::lower($request->email))->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['We could not find an account with that email address.'],
            ]);
        }

        // Only teachers and students can request admin password reset
        if (!$user->hasRole('teacher') && !$user->hasRole('student')) {
            throw ValidationException::withMessages([
                'email' => ['Admin password reset is only available for teacher and student accounts.'],
            ]);
        }

        // Check if user already has a pending request
        $existingRequest = PasswordResetRequest::where('user_id', $user->id)
            ->where('status', PasswordResetRequest::STATUS_PENDING)
            ->first();

        if ($existingRequest) {
            return back()->with('status', 'You already have a pending password reset request. Please wait for an administrator to process it.');
        }

        // Create the password reset request
        PasswordResetRequest::create([
            'user_id' => $user->id,
            'reason' => $request->reason,
            'status' => PasswordResetRequest::STATUS_PENDING,
        ]);

        return back()->with('status', 'Your password reset request has been sent for administrator review. Please coordinate in person with your school administrator to receive your new password.');
    }
}

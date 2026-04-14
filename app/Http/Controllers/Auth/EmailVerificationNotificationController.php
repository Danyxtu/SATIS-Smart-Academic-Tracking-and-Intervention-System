<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

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

        if (! filled((string) $user->personal_email)) {
            return back()
                ->withErrors([
                    'email' => 'Please enter a personal email before requesting verification.',
                ])
                ->withInput();
        }

        if ($user->hasVerifiedEmail()) {
            $redirectPath = Route::has('redirect-after-login')
                ? route('redirect-after-login', absolute: false)
                : '/';

            return redirect()->intended($redirectPath);
        }

        try {
            $user->sendEmailVerificationNotification();
        } catch (Throwable $exception) {
            Log::error('Failed to send verification email.', [
                'user_id' => $user->id,
                'personal_email' => $user->personal_email,
                'mailer' => config('mail.default'),
                'message' => $exception->getMessage(),
            ]);

            return back()
                ->withErrors([
                    'email' => 'We could not send the verification email right now. Please try again in a moment.',
                ])
                ->withInput();
        }

        return back()->with('status', 'verification-link-sent');
    }
}

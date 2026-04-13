<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
            return redirect()->intended(route('redirect-after-login', absolute: false));
        }

        $user->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }
}

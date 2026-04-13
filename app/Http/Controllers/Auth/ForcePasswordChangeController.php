<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class ForcePasswordChangeController extends Controller
{
    /**
     * Display the force password change view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForceChangePassword', [
            'user' => Auth::user()->only(['first_name', 'last_name', 'email']),
        ]);
    }

    /**
     * Handle the password change request.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = Auth::user();

        // Update password and clear first-login requirement.
        $user->update([
            'password' => Hash::make($request->password),
            'temporary_password' => null,
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);

        // Refresh the user model to ensure the session has updated data
        $user->refresh();

        // Super admins must provide and verify personal email before portal access.
        if (
            $user->isSuperAdmin() &&
            (! filled((string) $user->personal_email) || ! $user->hasVerifiedEmail())
        ) {
            return redirect()->route('verification.notice')->with(
                'status',
                'verification-email-required'
            );
        }

        // Redirect based on role priority for multi-role users.
        // Teacher should always land on teacher dashboard when present.
        if ($user->isTeacher()) {
            return redirect()->route('teacher.dashboard')->with('success', 'Password changed successfully!');
        }
        if ($user->isSuperAdmin()) {
            return redirect()->route('superadmin.dashboard')->with('success', 'Password changed successfully!');
        }
        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard')->with('success', 'Password changed successfully!');
        }
        if ($user->isStudent()) {
            if (! filled((string) $user->personal_email) || ! $user->hasVerifiedEmail()) {
                return redirect()->route('verification.notice')->with(
                    'status',
                    'verification-email-required'
                );
            }

            return redirect()->route('dashboard')->with('success', 'Password changed successfully! Welcome to SATIS.');
        }

        return redirect('/')->with('success', 'Password changed successfully!');
    }
}

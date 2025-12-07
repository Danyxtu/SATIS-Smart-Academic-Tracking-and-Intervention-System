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
            'user' => Auth::user()->only(['name', 'email']),
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

        // Update password with hash and clear the temporary password
        $user->update([
            'password' => Hash::make($request->password),
            'temp_password' => null,
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);

        // Refresh the user model to ensure the session has updated data
        $user->refresh();

        // Redirect based on user role
        if ($user->role === 'student') {
            return redirect()->route('dashboard')->with('success', 'Password changed successfully! Welcome to SATIS.');
        }

        if ($user->role === 'teacher') {
            return redirect()->route('teacher.dashboard')->with('success', 'Password changed successfully!');
        }

        return redirect()->route('admin.dashboard')->with('success', 'Password changed successfully!');
    }
}

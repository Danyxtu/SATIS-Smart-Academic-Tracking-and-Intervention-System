<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Issue Sanctum token
        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'must_change_password' => $user->must_change_password ?? false,
        ]);
    }

    /**
     * Force change password for new accounts.
     */
    public function forceChangePassword(Request $request)
    {
        $request->validate([
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'temp_password' => null,
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Password changed successfully.',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Logout and revoke the current access token.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken|null $token */
        $token = $request->user()?->currentAccessToken();
        $token?->delete();

        return response()->json(['message' => 'Logged out']);
    }
}

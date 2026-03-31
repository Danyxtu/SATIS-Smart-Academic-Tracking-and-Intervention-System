<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'nullable|string|max:255|required_without:email',
            'email' => 'nullable|string|max:255|required_without:login',
            'password' => 'required',
        ]);

        $identifier = Str::lower(trim((string) ($request->input('login') ?? $request->input('email'))));

        $query = User::query()->where('username', $identifier);

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $query->orWhere('personal_email', $identifier);
        }

        $user = $query->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $validPassword = $user->must_change_password
            ? $request->password === $user->password
            : Hash::check($request->password, $user->password);

        if (! $validPassword) {
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

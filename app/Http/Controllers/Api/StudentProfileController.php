<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class StudentProfileController extends Controller
{
    /**
     * Get the authenticated student's profile data.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'student' => [
                'id' => $student?->id,
                'firstName' => $student?->first_name ?? explode(' ', $user->name)[0] ?? '',
                'lastName' => $student?->last_name ?? (explode(' ', $user->name)[1] ?? ''),
                'middleName' => $student?->middle_name ?? '',
                'lrn' => $student?->lrn ?? 'N/A',
                'gradeLevel' => $student?->grade_level ?? 'N/A',
                'section' => $student?->section ?? 'N/A',
                'strand' => $student?->strand ?? 'N/A',
                'track' => $student?->track ?? 'N/A',
                'avatar' => $student?->avatar,
            ],
        ]);
    }

    /**
     * Update the student's password.
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\EmailVerificationOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class EmailOtpVerificationController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);
        $user = $request->user();
        $now = now();
        $otp = random_int(100000, 999999);
        $expiresAt = $now->copy()->addMinutes(6);
        $resendAvailableAt = $now->copy()->addMinutes(3);

        $record = EmailVerificationOtp::updateOrCreate(
            [
                'user_id' => $user->id,
                'email' => $request->email,
            ],
            [
                'otp' => $otp,
                'expires_at' => $expiresAt,
                'resend_available_at' => $resendAvailableAt,
            ]
        );

        if ($record->wasRecentlyCreated || $now->greaterThanOrEqualTo($record->resend_available_at)) {
            Mail::to($request->email)->send(new \App\Mail\OtpMail($otp));
        } else {
            $seconds = $record->resend_available_at->diffInSeconds($now);
            return response()->json(['message' => 'Please wait before resending.', 'resend_in' => $seconds], 429);
        }

        return response()->json(['message' => 'OTP sent.', 'resend_in' => 180]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6',
        ]);
        $user = $request->user();
        $now = now();
        $record = EmailVerificationOtp::where('user_id', $user->id)
            ->where('email', $request->email)
            ->where('otp', $request->otp)
            ->first();
        if (!$record || $now->greaterThan($record->expires_at)) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 422);
        }
        // Mark user as verified (implement logic for all user types)
        $user->email_verified_at = $now;
        $user->save();
        $record->delete();
        return response()->json(['message' => 'Email verified.']);
    }
}

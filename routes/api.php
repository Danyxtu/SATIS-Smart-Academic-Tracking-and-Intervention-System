<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/test', function () {
    return response()->json([
        'message' => 'Hello from Laravel!',
        'status' => 'success'
    ]);
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'time' => now(),
    ]);
});

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    // Universal OTP endpoints for all users
    Route::post('email-otp/send', [\App\Http\Controllers\Auth\EmailOtpVerificationController::class, 'send']);
    Route::post('email-otp/verify', [\App\Http\Controllers\Auth\EmailOtpVerificationController::class, 'verify']);
    // Force password change for new accounts
    Route::post('force-change-password', [AuthController::class, 'forceChangePassword']);
    Route::post('logout', [AuthController::class, 'logout']);

    // Student verification setup endpoints (accessible before email verification)
    Route::middleware('student')->group(function () {
        Route::get('student/email-verification/status', [AuthController::class, 'studentEmailVerificationStatus']);
        Route::post('student/email-verification/send', [AuthController::class, 'sendStudentEmailVerification']);

        // Profile endpoints
        Route::get('student/profile', [\App\Http\Controllers\Api\StudentProfileController::class, 'index']);
        Route::put('student/profile', [\App\Http\Controllers\Api\StudentProfileController::class, 'update']);
        Route::delete('student/profile', [\App\Http\Controllers\Api\StudentProfileController::class, 'destroy']);
        Route::post('student/profile/request-password-reset', [\App\Http\Controllers\Api\StudentProfileController::class, 'requestPasswordReset']);
        Route::delete('student/profile/cancel-password-reset', [\App\Http\Controllers\Api\StudentProfileController::class, 'cancelPasswordResetRequest']);
        Route::put('student/password', [\App\Http\Controllers\Api\StudentProfileController::class, 'updatePassword']);
    });

    // Student data endpoints blocked until password/email requirements are complete.
    Route::middleware('student.account.ready')->group(function () {
        Route::get('student/dashboard', [\App\Http\Controllers\Api\StudentDashboardController::class, 'index']);
        Route::get('student/performance', [\App\Http\Controllers\Api\StudentPerformanceController::class, 'index']);
        Route::get('student/performance/{enrollment}', [\App\Http\Controllers\Api\StudentPerformanceController::class, 'show']);
        Route::get('student/interventions', [\App\Http\Controllers\Api\StudentInterventionController::class, 'index']);
        Route::get('student/attendance', [\App\Http\Controllers\Api\StudentAttendanceController::class, 'index']);
        Route::get('student/attendance/{enrollment}', [\App\Http\Controllers\Api\StudentAttendanceController::class, 'show']);
        Route::get('student/subjects-at-risk', [\App\Http\Controllers\Api\StudentSubjectRiskController::class, 'index']);

        // Action endpoints used by mobile app for interactivity
        Route::post('student/notifications/{notification}/read', [\App\Http\Controllers\Api\StudentActionsController::class, 'markNotificationRead']);
        Route::post('student/notifications/read-all', [\App\Http\Controllers\Api\StudentActionsController::class, 'markAllNotificationsRead']);
        Route::post('student/interventions/tasks/{task}/complete', [\App\Http\Controllers\Api\StudentActionsController::class, 'completeInterventionTask']);
        Route::post('student/interventions/{intervention}/request-completion', [\App\Http\Controllers\Api\StudentActionsController::class, 'requestInterventionCompletion']);
        Route::post('student/feedback/{notification}/read', [\App\Http\Controllers\Api\StudentActionsController::class, 'markFeedbackRead']);

        // Export PDF endpoint for mobile app
        Route::get('student/performance/{enrollment}/export/pdf', [\App\Http\Controllers\Api\StudentPerformanceController::class, 'exportPdf']);
    });

    Route::get('user', function (Request $request) {
        $user = $request->user();
        $isStudent = $user ? $user->hasRole('student') : false;
        $hasPersonalEmail = filled((string) ($user?->personal_email ?? ''));
        $isEmailVerified = $hasPersonalEmail && (bool) $user?->email_verified_at;

        return [
            ...$user->toArray(),
            'has_personal_email' => $hasPersonalEmail,
            'email_verified' => $isEmailVerified,
            'requires_personal_email' => $isStudent && ! $hasPersonalEmail,
            'requires_email_verification' => $isStudent && ! $isEmailVerified,
        ];
    });
});

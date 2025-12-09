<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

use function Pest\Laravel\json;

Route::get('/test', function () {
    return response()->json([
        'message' => 'Hello from Laravel!',
        'status' => 'success'
    ]);
});


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'time' => now(),
    ]);
});

Route::post('login', [AuthController::class, 'login']);

// Force password change for new accounts
Route::middleware('auth:sanctum')->post('force-change-password', [AuthController::class, 'forceChangePassword']);

Route::middleware('auth:sanctum')->get('student/dashboard', [\App\Http\Controllers\Api\StudentDashboardController::class, 'index']);
Route::middleware('auth:sanctum')->get('student/performance', [\App\Http\Controllers\Api\StudentPerformanceController::class, 'index']);
Route::middleware('auth:sanctum')->get('student/performance/{enrollment}', [\App\Http\Controllers\Api\StudentPerformanceController::class, 'show']);
Route::middleware('auth:sanctum')->get('student/interventions', [\App\Http\Controllers\Api\StudentInterventionController::class, 'index']);
Route::middleware('auth:sanctum')->get('student/attendance', [\App\Http\Controllers\Api\StudentAttendanceController::class, 'index']);
Route::middleware('auth:sanctum')->get('student/subjects-at-risk', [\App\Http\Controllers\Api\StudentSubjectRiskController::class, 'index']);

// Action endpoints used by mobile app for interactivity
Route::middleware('auth:sanctum')->post('student/notifications/{notification}/read', [\App\Http\Controllers\Api\StudentActionsController::class, 'markNotificationRead']);
Route::middleware('auth:sanctum')->post('student/notifications/read-all', [\App\Http\Controllers\Api\StudentActionsController::class, 'markAllNotificationsRead']);
Route::middleware('auth:sanctum')->post('student/interventions/tasks/{task}/complete', [\App\Http\Controllers\Api\StudentActionsController::class, 'completeInterventionTask']);
Route::middleware('auth:sanctum')->post('student/feedback/{notification}/read', [\App\Http\Controllers\Api\StudentActionsController::class, 'markFeedbackRead']);

// Profile endpoints
Route::middleware('auth:sanctum')->get('student/profile', [\App\Http\Controllers\Api\StudentProfileController::class, 'index']);
Route::middleware('auth:sanctum')->put('student/password', [\App\Http\Controllers\Api\StudentProfileController::class, 'updatePassword']);

Route::middleware('auth:sanctum')->get('user', function (Request $req) {
    return $req->user();
});

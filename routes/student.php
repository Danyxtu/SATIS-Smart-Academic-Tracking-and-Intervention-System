<?php

use App\Http\Controllers\Student\DashboardController as StudentDashboardController;
use App\Http\Controllers\Student\InterventionController as StudentInterventionController;
use App\Http\Controllers\Student\AttendanceController as StudentAttendanceController;
use App\Http\Controllers\Student\AnalyticsController as StudentAnalyticsController;
use App\Http\Controllers\ProfileController;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified', 'can:access-student-portal'])->group(function () {

    Route::get('/dashboard', [StudentDashboardController::class, 'index'])
        ->name('dashboard');

    Route::post('/notifications/{notification}/read', [StudentDashboardController::class, 'markNotificationRead'])
        ->name('notifications.read');

    Route::post('/notifications/read-all', [StudentDashboardController::class, 'markAllNotificationsRead'])
        ->name('notifications.read-all');

    Route::get('/interventions-feed', [StudentInterventionController::class, 'index'])
        ->name('interventions-feed');

    Route::post('/interventions/tasks/{task}/complete', [StudentInterventionController::class, 'completeTask'])
        ->name('interventions.tasks.complete');

    Route::post('/interventions/{intervention}/request-completion', [StudentInterventionController::class, 'requestCompletion'])
        ->name('interventions.request-completion');

    Route::post('/feedback/{notification}/read', [StudentInterventionController::class, 'markFeedbackRead'])
        ->name('feedback.read');

    Route::get('/subject-at-risk', function () {
        return redirect()->route('analytics.index', ['risk' => 'at-risk']);
    })->name('subject-at-risk');

    Route::get('/learn-more', function () {
        return Inertia::render('Student/LearnMore');
    })->name('learn-more');

    Route::get('/profile', [ProfileController::class, 'editStudent'])
        ->name('student.profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('student.profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->name('student.profile.destroy');
    Route::post('/profile/request-password-reset', [ProfileController::class, 'requestPasswordReset'])
        ->name('student.profile.request-password-reset');
    Route::delete('/profile/cancel-password-reset', [ProfileController::class, 'cancelPasswordResetRequest'])
        ->name('student.profile.cancel-password-reset');

    Route::get('/attendance', [StudentAttendanceController::class, 'index'])
        ->name('attendance');

    Route::get('/attendance/{enrollment}', [StudentAttendanceController::class, 'show'])
        ->name('attendance.show');

    Route::get('/analytics', [StudentAnalyticsController::class, 'index'])
        ->name('analytics.index');

    Route::get('/analytics/{enrollment}/quarter/{quarter}', [StudentAnalyticsController::class, 'showQuarter'])
        ->name('analytics.quarter.show');

    Route::get('/analytics/{enrollment}', [StudentAnalyticsController::class, 'show'])
        ->name('analytics.show');
    Route::get('/analytics/{enrollment}/export/pdf', [StudentAnalyticsController::class, 'exportPdf'])
        ->name('analytics.show.pdf');
});

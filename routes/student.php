<?php

use App\Http\Controllers\Student\DashboardController as StudentDashboardController;
use App\Http\Controllers\Student\InterventionController as StudentInterventionController;
use App\Http\Controllers\Student\SubjectRiskController as StudentSubjectRiskController;
use App\Http\Controllers\Student\AttendanceController as StudentAttendanceController;
use App\Http\Controllers\Student\AnalyticsController as StudentAnalyticsController;

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

    Route::get('/subject-at-risk', [StudentSubjectRiskController::class, 'index'])
        ->name('subject-at-risk');

    Route::get('/learn-more', function () {
        return Inertia::render('Student/LearnMore');
    })->name('learn-more');

    Route::get('/attendance', [StudentAttendanceController::class, 'index'])
        ->name('attendance');

    Route::get('/analytics', [StudentAnalyticsController::class, 'index'])
        ->name('analytics.index');

    Route::get('/analytics/{enrollment}', [StudentAnalyticsController::class, 'show'])
        ->name('analytics.show');
    Route::get('/analytics/{enrollment}/export/pdf', [StudentAnalyticsController::class, 'exportPdf'])
        ->name('analytics.show.pdf');
});

<?php

// Teacher Controllers
use App\Http\Controllers\Teacher\AttendanceController;
use App\Http\Controllers\Teacher\ClassController;
use App\Http\Controllers\Teacher\GradeController;
use App\Http\Controllers\Teacher\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Teacher Portal Routes
|--------------------------------------------------------------------------
|
| These routes are only for users with the 'teacher' role.
|
*/

// Pending Approval Route (accessible to pending teachers)
Route::middleware(['auth'])
    ->prefix('teacher')
    ->name('teacher.')
    ->group(function () {
        Route::get('/pending-approval', function () {
            return Inertia::render('Teacher/PendingApproval');
        })->name('pending-approval');
    });

// All routes in this group are protected by the 'can:access-teacher-portal' gate
Route::middleware(['auth', 'verified', 'can:access-teacher-portal'])
    ->prefix('teacher') // All URLs will start with /teacher
    ->name('teacher.')  // All route names will start with teacher.
    ->group(function () {

        // Teacher Dashboard
        // URL: /teacher/dashboard
        // Name: route('teacher.dashboard')
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // --- (NEW) ATTENDANCE ROUTE ---
        // URL: /teacher/attendance
        // Name: route('teacher.attendance.index')
        Route::get('/attendance', [AttendanceController::class, 'index'])
            ->name('attendance.index');

        // --- ATTENDANCE LOG ROUTES ---
        Route::get('/attendance/log', [AttendanceController::class, 'log'])
            ->name('attendance.log');
        Route::get('/attendance/log/{subject}', [AttendanceController::class, 'show'])
            ->name('attendance.log.show');
        Route::get('/attendance/log/{subject}/export', [AttendanceController::class, 'export'])
            ->name('attendance.log.export');
        // Server-side PDF export (requires barryvdh/laravel-dompdf package)
        Route::get('/attendance/log/{subject}/export/pdf', [AttendanceController::class, 'exportPdf'])
            ->name('attendance.log.export.pdf');
        // Check if attendance exists for a class on a date
        Route::get('/attendance/check', [AttendanceController::class, 'checkExists'])
            ->name('attendance.check');
        // Save attendance (persist records)
        Route::post('/attendance', [AttendanceController::class, 'store'])
            ->name('attendance.store');

        // --- (NEW) MY CLASSES ROUTE ---
        // URL: /teacher/classes
        // Name: route('teacher.classes.index')
        Route::get('/classes', [ClassController::class, 'index'])->name('classes.index');
        Route::post('/classes', [ClassController::class, 'store'])->name('classes.store');
        Route::post('/classes/{subject}/students', [ClassController::class, 'enrollStudent'])
            ->name('classes.students.store');
        Route::post('/classes/{subject}/classlist', [ClassController::class, 'uploadClasslist'])
            ->name('classes.classlist.store');
        Route::post('/classes/{subject}/quarter', [ClassController::class, 'startQuarter'])
            ->name('classes.quarter.start');
        Route::post('/classes/{subject}/grades/bulk', [GradeController::class, 'bulkStore'])
            ->name('classes.grades.bulk');
        Route::post('/classes/{subject}/grades/import', [GradeController::class, 'import'])
            ->name('classes.grades.import');
        Route::post('/classes/{subject}/grade-structure', [ClassController::class, 'updateGradeStructure'])
            ->name('classes.grade-structure.update');
        Route::post('/classes/{subject}/nudge', [ClassController::class, 'sendNudge'])
            ->name('classes.nudge');

        // --- (NEW) INTERVENTIONS ROUTE ---
        // URL: /teacher/interventions
        // Name: route('teacher.interventions.index')
        Route::get('/interventions', [App\Http\Controllers\Teacher\InterventionController::class, 'index'])
            ->name('interventions.index');

        // routes/web.php inside the 'teacher' group
        Route::post('/interventions', [App\Http\Controllers\Teacher\InterventionController::class, 'store'])
            ->name('interventions.store');

        // Bulk intervention for multiple students
        Route::post('/interventions/bulk', [App\Http\Controllers\Teacher\InterventionController::class, 'bulkStore'])
            ->name('interventions.bulk');

        // Approve/Reject completion requests for Tier 3 interventions
        Route::post('/interventions/{intervention}/approve', [App\Http\Controllers\Teacher\InterventionController::class, 'approveCompletion'])
            ->name('interventions.approve');
        Route::post('/interventions/{intervention}/reject', [App\Http\Controllers\Teacher\InterventionController::class, 'rejectCompletion'])
            ->name('interventions.reject');
    });

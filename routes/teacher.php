<?php

// Teacher Controllers
use App\Http\Controllers\Teacher\AttendanceController;
use App\Http\Controllers\Teacher\ClassController;
use App\Http\Controllers\Teacher\GradeController;
use App\Http\Controllers\Teacher\GradeCalculationController;
use App\Http\Controllers\Teacher\DashboardController;
use App\Http\Controllers\Teacher\InterventionController;
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
    ->prefix('teacher')
    ->name('teacher.')
    ->group(function () {
        /**
         * Dashboard Route
         */
        Route::get('/dashboard', [DashboardController::class, 'Dashboard'])->name('dashboard');
        // --- PRIORITY STUDENTS REPORT PDF EXPORT ---
        // URL: /teacher/dashboard/priority-students/export/pdf
        // Name: route('teacher.dashboard.priority-students.pdf')
        Route::get('/dashboard/priority-students/export/pdf', [DashboardController::class, 'exportPriorityStudentsPdf'])
            ->name('dashboard.priority-students.pdf');

        /**
         * My Classes Route
         */
        Route::get('/classes', [ClassController::class, 'goToMyClasses'])->name('classes.index');
        Route::get('/classes/{subjectTeacher}', [ClassController::class, 'myClass'])->name('class');
        Route::post('/classes', [ClassController::class, 'createAClass'])->name('classes.store');
        Route::post('/classes/{subjectTeacher}/students', [ClassController::class, 'enrollStudent'])
            ->name('classes.students.store');
        Route::post('/classes/{subjectTeacher}/classlist', [ClassController::class, 'uploadClasslist'])
            ->name('classes.classlist.store');
        Route::post('/classes/{subjectTeacher}/quarter', [ClassController::class, 'startQuarter'])
            ->name('classes.quarter.start');
        Route::post('/classes/{subjectTeacher}/grades/bulk', [GradeController::class, 'bulkStore'])
            ->name('classes.grades.bulk');
        Route::post('/classes/{subjectTeacher}/grades/import', [GradeController::class, 'import'])
            ->name('classes.grades.import');
        Route::post('/classes/{subjectTeacher}/grade-structure', [ClassController::class, 'updateGradeStructure'])
            ->name('classes.grade-structure.update');
        Route::post('/classes/{subjectTeacher}/nudge', [ClassController::class, 'sendNudge'])
            ->name('classes.nudge');

        /**
         * Grade Calculation Routes
         */
        Route::get('/classes/{subjectTeacher}/calculate-grades', [GradeCalculationController::class, 'calculateClassGrades'])
            ->name('classes.calculate-grades');
        Route::get('/classes/{subjectTeacher}/students/{enrollment}/calculate-grades', [GradeCalculationController::class, 'calculateStudentGrades'])
            ->name('classes.students.calculate-grades');
        Route::post('/classes/{subjectTeacher}/recalculate-grades', [GradeCalculationController::class, 'recalculateAfterUpdate'])
            ->name('classes.recalculate-grades');

        /**
         * Attendance Routes
         */
        Route::get('/attendance', [AttendanceController::class, 'index'])
            ->name('attendance.index');
        Route::get('/attendance/log', [AttendanceController::class, 'attendanceLogsGroupedBySection'])
            ->name('attendance.log');
        Route::get('/attendance/log/{subjectTeacher}', [AttendanceController::class, 'attendanceLogOfSpecificSection'])
            ->name('attendance.log.show');
        Route::get('/attendance/log/{subjectTeacher}/export', [AttendanceController::class, 'exportCSV'])
            ->name('attendance.log.export');
        Route::get('/attendance/log/{subjectTeacher}/export/pdf', [AttendanceController::class, 'exportPdf'])
            ->name('attendance.log.export.pdf');
        Route::get('/attendance/check', [AttendanceController::class, 'checkExists'])
            ->name('attendance.check');
        Route::post('/attendance', [AttendanceController::class, 'createAttendance'])
            ->name('attendance.create');


        /**
         * Intervention Routes
         */
        Route::get('/interventions', [InterventionController::class, 'index'])
            ->name('interventions.index');
        Route::post('/interventions', [InterventionController::class, 'store'])
            ->name('interventions.store');
        Route::post('/interventions/bulk', [InterventionController::class, 'bulkStore'])
            ->name('interventions.bulk');
        Route::post('/interventions/{intervention}/approve', [InterventionController::class, 'approveCompletion'])
            ->name('interventions.approve');
        Route::post('/interventions/{intervention}/reject', [InterventionController::class, 'rejectCompletion'])
            ->name('interventions.reject');
    });

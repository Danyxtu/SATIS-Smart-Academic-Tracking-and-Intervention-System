<?php

// Teacher Controllers
use App\Http\Controllers\Teacher\AttendanceController; // Start -> In progress
use App\Http\Controllers\Teacher\ClassController;
use App\Http\Controllers\Teacher\GradeController;
use App\Http\Controllers\Teacher\DashboardController;

// Admin Controllers
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\TeacherRegistrationController as AdminTeacherRegistrationController;

// Super Admin Controllers
use App\Http\Controllers\SuperAdmin\DashboardController as SuperAdminDashboardController;
use App\Http\Controllers\SuperAdmin\DepartmentController;
use App\Http\Controllers\SuperAdmin\AdminController as SuperAdminAdminController;
use App\Http\Controllers\SuperAdmin\SettingsController;
use App\Http\Controllers\SuperAdmin\CurriculumController;

// Student Controller
use App\Http\Controllers\Student\DashboardController as StudentDashboardController;
use App\Http\Controllers\Student\InterventionController as StudentInterventionController;
use App\Http\Controllers\Student\SubjectRiskController as StudentSubjectRiskController;
use App\Http\Controllers\Student\AttendanceController as StudentAttendanceController;
use App\Http\Controllers\Student\AnalyticsController as StudentAnalyticsController;


// Profile 
use App\Http\Controllers\ProfileController;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
|
| This route is accessible to everyone.
|
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

/*
|--------------------------------------------------------------------------
| Student Portal Routes
|--------------------------------------------------------------------------
|
| These routes are only for users with the 'student' role.
|
*/

// All routes in this group are protected by the 'can:access-student-portal' gate
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

/*
|--------------------------------------------------------------------------
| Super Admin Portal Routes
|--------------------------------------------------------------------------
|
| These routes are only for users with the 'super_admin' role.
| Super Admin manages departments, admins, curriculum, and system settings.
|
*/

Route::middleware(['auth', 'verified', 'can:access-super-admin-portal'])
    ->prefix('superadmin')
    ->name('superadmin.')
    ->group(function () {

        // Super Admin Dashboard
        Route::get('/dashboard', [SuperAdminDashboardController::class, 'index'])
            ->name('dashboard');

        // Department Management
        Route::resource('departments', DepartmentController::class);
        Route::post('/departments/{department}/toggle-status', [DepartmentController::class, 'toggleStatus'])
            ->name('departments.toggle-status');

        // Admin Management
        Route::resource('admins', SuperAdminAdminController::class);
        Route::post('/admins/{admin}/reset-password', [SuperAdminAdminController::class, 'resetPassword'])
            ->name('admins.reset-password');
        Route::post('/admins/{admin}/resend-credentials', [SuperAdminAdminController::class, 'resendCredentials'])
            ->name('admins.resend-credentials');

        // Curriculum Management (Master Subjects & Prerequisites)
        Route::resource('curriculum', CurriculumController::class);
        Route::post('/curriculum/{curriculum}/toggle-status', [CurriculumController::class, 'toggleStatus'])
            ->name('curriculum.toggle-status');

        // System Settings
        Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
        Route::put('/settings/academic', [SettingsController::class, 'updateAcademic'])->name('settings.academic');
        Route::put('/settings/enrollment', [SettingsController::class, 'updateEnrollment'])->name('settings.enrollment');
        Route::put('/settings/grading', [SettingsController::class, 'updateGrading'])->name('settings.grading');
        Route::put('/settings/school-info', [SettingsController::class, 'updateSchoolInfo'])->name('settings.school-info');
    });

/*
|--------------------------------------------------------------------------
| Admin Portal Routes
|--------------------------------------------------------------------------
|
| These routes are only for users with the 'admin' role.
| Admin users manage user accounts (students and teachers).
|
*/

Route::middleware(['auth', 'verified', 'can:access-admin-portal'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // Admin Dashboard
        Route::get('/dashboard', [AdminUserController::class, 'dashboard'])
            ->name('dashboard');

        // User Management
        Route::get('/users', [AdminUserController::class, 'index'])
            ->name('users.index');
        Route::get('/users/create', [AdminUserController::class, 'create'])
            ->name('users.create');
        Route::post('/users', [AdminUserController::class, 'store'])
            ->name('users.store');
        Route::get('/users/{user}/edit', [AdminUserController::class, 'edit'])
            ->name('users.edit');
        Route::put('/users/{user}', [AdminUserController::class, 'update'])
            ->name('users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])
            ->name('users.destroy');

        // Password Reset
        Route::post('/users/{user}/reset-password', [AdminUserController::class, 'resetPassword'])
            ->name('users.reset-password');

        // Bulk Actions
        Route::post('/users/bulk-destroy', [AdminUserController::class, 'bulkDestroy'])
            ->name('users.bulk-destroy');

        // Password Reset Requests Management
        Route::get('/password-reset-requests', [AdminUserController::class, 'passwordResetRequests'])
            ->name('password-reset-requests');
        Route::post('/password-reset-requests/{passwordResetRequest}/approve', [AdminUserController::class, 'approvePasswordResetRequest'])
            ->name('password-reset-requests.approve');
        Route::post('/password-reset-requests/{passwordResetRequest}/reject', [AdminUserController::class, 'rejectPasswordResetRequest'])
            ->name('password-reset-requests.reject');

        // Teacher Registration Management
        Route::get('/teacher-registrations', [AdminTeacherRegistrationController::class, 'index'])
            ->name('teacher-registrations.index');
        Route::post('/teacher-registrations/{registration}/approve', [AdminTeacherRegistrationController::class, 'approve'])
            ->name('teacher-registrations.approve');
        Route::post('/teacher-registrations/{registration}/reject', [AdminTeacherRegistrationController::class, 'reject'])
            ->name('teacher-registrations.reject');
        Route::get('/teacher-registrations/{registration}/document', [AdminTeacherRegistrationController::class, 'downloadDocument'])
            ->name('teacher-registrations.document');
    });

/*
|--------------------------------------------------------------------------
| Universal Authenticated Routes
|--------------------------------------------------------------------------
|
| These routes are for *all* logged-in users (students and teachers).
|
*/

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Password Reset Request (for teachers)
    Route::post('/profile/request-password-reset', [ProfileController::class, 'requestPasswordReset'])
        ->name('profile.request-password-reset');
    Route::delete('/profile/cancel-password-reset', [ProfileController::class, 'cancelPasswordResetRequest'])
        ->name('profile.cancel-password-reset');
});

/*
|--------------------------------------------------------------------------
| Post-Login Redirect Handler (NEW)
|--------------------------------------------------------------------------
|
| This is the "sorting" route that sends users to the correct dashboard
| after they log in, based on their role.
|
*/
Route::get('/redirect-after-login', function () {
    $user = Auth::user();

    if ($user->role === 'super_admin') {
        return redirect()->route('superadmin.dashboard');
    }

    if ($user->role === 'admin') {
        return redirect()->route('admin.dashboard');
    }

    if ($user->role === 'teacher') {
        return redirect()->route('teacher.dashboard');
    }

    if ($user->role === 'student') {
        return redirect()->route('dashboard');
    }

    // A fallback just in case
    return redirect('/');
})->middleware(['auth']);


/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
|
| This file (from Breeze) contains login, register, password reset, etc.
|
*/

require __DIR__ . '/auth.php';

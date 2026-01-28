<?php

// Super Admin Controllers
use App\Http\Controllers\SuperAdmin\DashboardController as SuperAdminDashboardController;
use App\Http\Controllers\SuperAdmin\DepartmentController;
use App\Http\Controllers\SuperAdmin\AdminController as SuperAdminAdminController;
use App\Http\Controllers\SuperAdmin\SettingsController;
use App\Http\Controllers\SuperAdmin\CurriculumController;
use Illuminate\Support\Facades\Route;

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

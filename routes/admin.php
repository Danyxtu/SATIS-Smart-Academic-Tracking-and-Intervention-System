<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\TeacherRegistrationController as AdminTeacherRegistrationController;
use Illuminate\Support\Facades\Route;

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

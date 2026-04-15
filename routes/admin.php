<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\SectionController as AdminSectionController;
use App\Http\Controllers\Admin\ClassController as AdminClassController;
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

Route::middleware(['auth', 'verified', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // Admin Dashboard
        Route::get('/dashboard', [AdminUserController::class, 'dashboard'])
            ->name('dashboard');

        // User Management
        Route::get('/users', [AdminUserController::class, 'index'])
            ->name('users.index');
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

        // Section Management
        Route::get('/sections', [AdminSectionController::class, 'index'])
            ->name('sections.index');
        Route::post('/sections', [AdminSectionController::class, 'store'])
            ->name('sections.store');
        Route::put('/sections/{section}', [AdminSectionController::class, 'update'])
            ->name('sections.update');

        // Class Management
        Route::get('/classes', [AdminClassController::class, 'index'])
            ->name('classes.index');
        Route::post('/classes', [AdminClassController::class, 'store'])
            ->name('classes.store');
        Route::put('/classes/{schoolClass}', [AdminClassController::class, 'update'])
            ->name('classes.update');
        Route::delete('/classes/{schoolClass}', [AdminClassController::class, 'destroy'])
            ->name('classes.destroy');

        // Password Reset Requests Management
        Route::get('/password-reset-requests', [AdminUserController::class, 'passwordResetRequests'])
            ->name('password-reset-requests');
        Route::post('/password-reset-requests/{passwordResetRequest}/approve', [AdminUserController::class, 'approvePasswordResetRequest'])
            ->name('password-reset-requests.approve');
        Route::post('/password-reset-requests/{passwordResetRequest}/reject', [AdminUserController::class, 'rejectPasswordResetRequest'])
            ->name('password-reset-requests.reject');
    });

<?php

// Super Admin Controllers
use App\Http\Controllers\SuperAdmin\DashboardController as SuperAdminDashboardController;
use App\Http\Controllers\SuperAdmin\DepartmentController;
use App\Http\Controllers\SuperAdmin\AdminController as SuperAdminAdminController;
use App\Http\Controllers\SuperAdmin\NewSchoolYearController;
use App\Http\Controllers\SuperAdmin\SettingsController;
use App\Http\Controllers\SuperAdmin\SubjectController;
use App\Http\Controllers\SuperAdmin\AcademicManagementController;
use App\Http\Controllers\SuperAdmin\AuditLogController;
use App\Http\Controllers\SuperAdmin\ArchiveController;
use App\Http\Controllers\SuperAdmin\UserManagementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Super Admin Portal Routes
|--------------------------------------------------------------------------
|
| These routes are only for users with the 'super_admin' role.
| Super Admin manages departments, admins, and system settings.
|
*/

Route::middleware(['auth', 'verified', 'can:access-super-admin-portal', 'superadmin'])
    ->prefix('superadmin')
    ->name('superadmin.')
    ->group(function () {

        // Super Admin Dashboard
        Route::get('/dashboard', [SuperAdminDashboardController::class, 'index'])
            ->name('dashboard');

        // Activity Logs
        Route::get('/activity-logs', [AuditLogController::class, 'index'])
            ->name('activity-logs.index');

        // School Year Archive
        Route::get('/archive', [ArchiveController::class, 'index'])
            ->name('archive.index');
        Route::get('/archive/{archive}/students/{studentUserId}', [ArchiveController::class, 'studentShow'])
            ->name('archive.students.show');
        Route::get('/archive/{archive}/students/{studentUserId}/classes/{archiveClass}', [ArchiveController::class, 'studentClassShow'])
            ->name('archive.students.classes.show');
        Route::get('/archive/{archive}/teachers/{teacherUserId}', [ArchiveController::class, 'teacherShow'])
            ->name('archive.teachers.show');
        Route::get('/archive/{archive}/teachers/{teacherUserId}/classes/{archiveClass}', [ArchiveController::class, 'teacherClassShow'])
            ->name('archive.teachers.classes.show');
        Route::get('/archive/{archive}/departments/{archiveDepartment}', [ArchiveController::class, 'departmentShow'])
            ->name('archive.departments.show');
        Route::get('/archive/{archive}/classes/{archiveClass}', [ArchiveController::class, 'classShow'])
            ->name('archive.classes.show');

        // Department Management
        Route::get('/departments', [DepartmentController::class, 'index'])
            ->name('departments.index');
        Route::get('/departments/unassigned-teachers', [DepartmentController::class, 'unassignedTeachers'])
            ->name('departments.unassigned-teachers');
        Route::get('/departments/{department}/teachers', [DepartmentController::class, 'departmentTeachers'])
            ->name('departments.teachers');
        Route::post('/departments', [DepartmentController::class, 'store'])
            ->name('departments.store');
        Route::get('/departments/{department}', [DepartmentController::class, 'show'])
            ->name('departments.show');
        Route::get('/departments/{department}/edit', [DepartmentController::class, 'edit'])
            ->name('departments.edit');
        Route::put('/departments/{department}', [DepartmentController::class, 'update'])
            ->name('departments.update');
        Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])
            ->name('departments.destroy');
        Route::post('/departments/{department}/toggle-status', [DepartmentController::class, 'toggleStatus'])
            ->name('departments.toggle-status');

        // Subject Management
        Route::resource('subjects', SubjectController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        // Section & Class Management
        Route::get('/academic-management', [AcademicManagementController::class, 'index'])
            ->name('academic-management.index');
        Route::post('/academic-management/sections', [AcademicManagementController::class, 'storeSection'])
            ->name('academic-management.sections.store');
        Route::post('/academic-management/sections/recreate-grade11', [AcademicManagementController::class, 'recreateGrade11Sections'])
            ->name('academic-management.sections.recreate-grade11');
        Route::post('/academic-management/sections/assign-adviser', [AcademicManagementController::class, 'assignAdviserToSections'])
            ->name('academic-management.sections.assign-adviser');
        Route::put('/academic-management/sections/{section}', [AcademicManagementController::class, 'updateSection'])
            ->name('academic-management.sections.update');
        Route::delete('/academic-management/sections/{section}', [AcademicManagementController::class, 'destroySection'])
            ->name('academic-management.sections.destroy');
        Route::post('/academic-management/classes', [AcademicManagementController::class, 'storeClass'])
            ->name('academic-management.classes.store');
        Route::put('/academic-management/classes/{schoolClass}', [AcademicManagementController::class, 'updateClass'])
            ->name('academic-management.classes.update');
        Route::delete('/academic-management/classes/{schoolClass}', [AcademicManagementController::class, 'destroyClass'])
            ->name('academic-management.classes.destroy');

        // User Management
        Route::resource('users', UserManagementController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        // Password Reset Requests Management (Teacher + Student)
        Route::get('/password-reset-requests', [UserManagementController::class, 'passwordResetRequests'])
            ->name('password-reset-requests');
        Route::post('/password-reset-requests/reset-student-by-lrn', [UserManagementController::class, 'resetStudentPasswordByLrn'])
            ->name('password-reset-requests.reset-student-by-lrn');
        Route::post('/password-reset-requests/{passwordResetRequest}/approve', [UserManagementController::class, 'approvePasswordResetRequest'])
            ->name('password-reset-requests.approve');
        Route::post('/password-reset-requests/{passwordResetRequest}/reject', [UserManagementController::class, 'rejectPasswordResetRequest'])
            ->name('password-reset-requests.reject');

        // Admin Management (legacy)
        Route::get('/admins', function () {
            return redirect()->route('superadmin.users.index', [
                'role' => 'admin',
            ]);
        })->name('admins.index');
        Route::resource('admins', SuperAdminAdminController::class)
            ->except(['index', 'create']);
        Route::post('/admins/{admin}/reset-password', [SuperAdminAdminController::class, 'resetPassword'])
            ->name('admins.reset-password');
        Route::post('/admins/{admin}/resend-credentials', [SuperAdminAdminController::class, 'resendCredentials'])
            ->name('admins.resend-credentials');

        // New School Year
        Route::post('/new-school-year', [NewSchoolYearController::class, 'start'])->name('new-school-year.start');

        // System Settings
        Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
        Route::put('/settings/academic', [SettingsController::class, 'updateAcademic'])->name('settings.academic');
        Route::put('/settings/enrollment', [SettingsController::class, 'updateEnrollment'])->name('settings.enrollment');
        Route::put('/settings/grading', [SettingsController::class, 'updateGrading'])->name('settings.grading');
        Route::put('/settings/school-info', [SettingsController::class, 'updateSchoolInfo'])->name('settings.school-info');
        Route::post('/settings/rollover', [SettingsController::class, 'rollover'])->name('settings.rollover');
    });

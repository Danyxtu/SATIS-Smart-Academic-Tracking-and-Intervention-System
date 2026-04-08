<?php

// Profile 
use App\Http\Controllers\ProfileController;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();
        // Always prioritize teacher dashboard if user has teacher role
        if ($user->hasRole('teacher')) {
            return redirect()->route('teacher.dashboard');
        }
        if ($user->hasRole('super_admin')) {
            return redirect()->route('superadmin.dashboard');
        }
        if ($user->hasRole('admin')) {
            return redirect()->route('admin.dashboard');
        }
        if ($user->hasRole('student')) {
            return redirect()->route('dashboard');
        }
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

/*
|--------------------------------------------------------------------------
| Include Portal Routes
|--------------------------------------------------------------------------
|
| Each portal has its own routes file for better organization
|
*/

require __DIR__ . '/student.php';
require __DIR__ . '/teacher.php';
require __DIR__ . '/admin.php';
require __DIR__ . '/superadmin.php';

/*
|--------------------------------------------------------------------------
| Universal Authenticated Routes
|--------------------------------------------------------------------------
|
| These routes are for *all* logged-in users (students and teachers).
|
*/

Route::middleware('auth')->group(function () {
    Route::middleware(['verified', 'can:access-school-staff-portal'])->group(function () {
        Route::get('/staff/profile', [ProfileController::class, 'editSchoolStaff'])
            ->name('schoolstaff.profile.edit');
        Route::patch('/staff/profile', [ProfileController::class, 'update'])
            ->name('schoolstaff.profile.update');
        Route::delete('/staff/profile', [ProfileController::class, 'destroy'])
            ->name('schoolstaff.profile.destroy');

        Route::post('/staff/profile/request-password-reset', [ProfileController::class, 'requestPasswordReset'])
            ->name('schoolstaff.profile.request-password-reset');
        Route::delete('/staff/profile/cancel-password-reset', [ProfileController::class, 'cancelPasswordResetRequest'])
            ->name('schoolstaff.profile.cancel-password-reset');
    });
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
    // Always prioritize teacher dashboard if user has teacher role
    if ($user->hasRole('teacher')) {
        return redirect()->route('teacher.dashboard');
    }
    if ($user->hasRole('super_admin')) {
        return redirect()->route('superadmin.dashboard');
    }
    if ($user->hasRole('admin')) {
        return redirect()->route('admin.dashboard');
    }
    if ($user->hasRole('student')) {
        return redirect()->route('dashboard');
    }
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

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

    $redirect = match ($user->role) {
        'super_admin' => 'superadmin.dashboard',
        'admin' => 'admin.dashboard',
        'teacher' => 'teacher.dashboard',
        'student' => 'dashboard',
        default => '/',
    };
    return redirect()->route($redirect);
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

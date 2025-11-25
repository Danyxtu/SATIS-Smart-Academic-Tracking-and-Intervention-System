<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TeacherController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;

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
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
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

    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/interventions-feed', function () {
        return Inertia::render('InterventionFeedback');
    })->name('interventions-feed');

    Route::get('/subject-at-risk', function () {
        return Inertia::render('SubjectRisk');
    })->name('subject-at-risk');

    Route::get('/learn-more', function () {
        return Inertia::render('LearnMore');
    })->name('learn-more');

    Route::get('/attendance', function () {
        return Inertia::render('Attendance');
    })->name('attendance');

    Route::get('/analytics', function () {
        return Inertia::render('Analytics/Index');
    })->name('analytics.index');

    Route::get('/analytics/{subject_id}', function ($subject_id) {
        return Inertia::render('Analytics/Show', [
            'subject_id' => $subject_id,
        ]);
    })->name('analytics.show');
});

/*
|--------------------------------------------------------------------------
| Teacher Portal Routes
|--------------------------------------------------------------------------
|
| These routes are only for users with the 'teacher' role.
|
*/

// All routes in this group are protected by the 'can:access-teacher-portal' gate
Route::middleware(['auth', 'verified', 'can:access-teacher-portal'])
    ->prefix('teacher') // All URLs will start with /teacher
    ->name('teacher.')  // All route names will start with teacher.
    ->group(function () {

        // Teacher Dashboard
        // URL: /teacher/dashboard
        // Name: route('teacher.dashboard')
        Route::get('/dashboard', [TeacherController::class, 'showDashboard'])->name('dashboard');

        // --- (NEW) ATTENDANCE ROUTE ---
        // URL: /teacher/attendance
        // Name: route('teacher.attendance.index')
        Route::get('/attendance', function () {
            // This route renders the Attendance.jsx component you just created
            return Inertia::render('Teacher/Attendance');
        })->name('attendance.index');

        // --- (NEW) ATTENDANCE LOG ROUTE ---
        Route::get('/attendance/log', function () {
            // This route renders the Attendance.jsx component you just created
            return Inertia::render('Teacher/AttendanceLog');
        })->name('attendance.log');

        // --- (NEW) MY CLASSES ROUTE ---
        // URL: /teacher/classes
        // Name: route('teacher.classes.index')
        Route::get('/classes', function () {
            // You'll need to create a 'Teacher/MyClasses.jsx' component for this
            return Inertia::render('Teacher/MyClasses');
        })->name('classes.index');

        // --- (NEW) INTERVENTIONS ROUTE ---
        // URL: /teacher/interventions
        // Name: route('teacher.interventions.index')
        Route::get('/interventions', function () {
            // You'll need to create a 'Teacher/Interventions.jsx' component for this
            return Inertia::render('Teacher/Interventions');
        })->name('interventions.index');
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

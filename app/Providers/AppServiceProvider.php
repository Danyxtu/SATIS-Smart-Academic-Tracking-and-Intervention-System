<?php

namespace App\Providers;

use App\Models\User; // <-- Add this
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Gate::define('access-super-admin-portal', function (User $user) {
            return $user->role === 'super_admin';
        });
        Gate::define('access-teacher-portal', function (User $user) {
            return $user->role === 'teacher';
        });
        Gate::define('access-student-portal', function (User $user) {
            return $user->role === 'student';
        });
        Gate::define('access-admin-portal', function (User $user) {
            return $user->role === 'admin';
        });
    }
}

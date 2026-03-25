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
            return $user->hasRole('super_admin');
        });

        // Department management gates (super_admin only)
        Gate::define('manage-departments', function (User $user) {
            return $user->hasRole('super_admin');
        });
        Gate::define('create-department', function (User $user) {
            return $user->hasRole('super_admin');
        });
        Gate::define('update-department', function (User $user) {
            return $user->hasRole('super_admin');
        });
        Gate::define('delete-department', function (User $user) {
            return $user->hasRole('super_admin');
        });

        Gate::define('access-teacher-portal', function (User $user) {
            return $user->hasRole('teacher');
        });
        Gate::define('access-student-portal', function (User $user) {
            return $user->hasRole('student');
        });
        Gate::define('access-admin-portal', function (User $user) {
            return $user->hasRole('admin');
        });
    }
}

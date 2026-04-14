<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
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

        VerifyEmail::toMailUsing(function ($notifiable, string $url): MailMessage {
            $portalLabel = 'School Staff Portal';

            if (method_exists($notifiable, 'hasRole') && $notifiable->hasRole('student')) {
                $portalLabel = 'Student Portal';
            }

            return (new MailMessage)
                ->subject('Verify Your Email Address - SATIS-FACTION')
                ->view('emails.EmailVerificationMailTemplate', [
                    'userName' => $notifiable->name ?? 'User',
                    'verificationUrl' => $url,
                    'expiresInMinutes' => (int) config('auth.verification.expire', 30),
                    'portalLabel' => $portalLabel,
                    'logoUrl' => url('/images/satis-logo.png'),
                ]);
        });

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

        // Subject management gates (super_admin only)
        Gate::define('manage-subjects', function (User $user) {
            return $user->hasRole('super_admin');
        });
        Gate::define('create-subject', function (User $user) {
            return $user->hasRole('super_admin');
        });
        Gate::define('update-subject', function (User $user) {
            return $user->hasRole('super_admin');
        });
        Gate::define('delete-subject', function (User $user) {
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

        Gate::define('access-school-staff-portal', function (User $user) {
            return $user->hasRole('teacher')
                || $user->hasRole('admin')
                || $user->hasRole('super_admin');
        });
    }
}

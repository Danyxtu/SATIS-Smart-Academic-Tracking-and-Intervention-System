<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {

                // Get the authenticated user and redirect to their dashboard
                $user = Auth::user();

                return match ($user->role) {
                    'super_admin' => redirect(route('superadmin.dashboard')),
                    'admin'       => redirect(route('admin.dashboard')),
                    'teacher'     => redirect(route('teacher.dashboard')),
                    'student'     => redirect(route('dashboard')),
                    default       => redirect('/'),
                };
            }
        }

        return $next($request);
    }
}

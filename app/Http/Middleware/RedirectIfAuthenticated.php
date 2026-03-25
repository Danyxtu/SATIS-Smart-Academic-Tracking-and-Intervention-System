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
                // Always prioritize teacher dashboard if user has teacher role
                if ($user->isTeacher()) {
                    return redirect(route('teacher.dashboard'));
                }
                if ($user->isSuperAdmin()) {
                    return redirect(route('superadmin.dashboard'));
                }
                if ($user->isAdmin()) {
                    return redirect(route('admin.dashboard'));
                }
                if ($user->isStudent()) {
                    return redirect(route('dashboard'));
                }
                return redirect('/');
            }
        }

        return $next($request);
    }
}

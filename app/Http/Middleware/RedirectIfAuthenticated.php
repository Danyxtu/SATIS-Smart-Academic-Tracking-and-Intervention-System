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
                
                // --- THIS IS THE MODIFIED PART ---

                // Get the authenticated user
                $user = Auth::user();

                // Check their role and redirect them
                if ($user->role === 'teacher') {
                    return redirect(route('teacher.dashboard'));
                }
        
                if ($user->role === 'student') {
                    return redirect(route('dashboard'));
                }
                
                // Fallback (this should match the one in your controller)
                return redirect('/');
            }
        }

        return $next($request);
    }
}
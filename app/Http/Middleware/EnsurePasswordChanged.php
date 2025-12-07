<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Routes that should be excluded from the password change check.
     */
    protected array $except = [
        'password.force-change',
        'password.force-change.update',
        'logout',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Skip if not authenticated
        if (!$user) {
            return $next($request);
        }

        // Skip if on excluded routes
        $currentRoute = $request->route()?->getName();
        if (in_array($currentRoute, $this->except)) {
            return $next($request);
        }

        // Refresh user to get latest data from database
        $user->refresh();

        // Redirect to password change if required
        if ($user->must_change_password) {
            return redirect()->route('password.force-change');
        }

        return $next($request);
    }
}

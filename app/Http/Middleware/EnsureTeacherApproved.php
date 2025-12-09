<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureTeacherApproved
{
    /**
     * Routes that should be excluded from the approval check.
     */
    protected array $except = [
        'teacher.pending-approval',
        'logout',
        'password.force-change',
        'password.force-change.update',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Skip if not authenticated
        if (!$user) {
            return $next($request);
        }

        // Only apply to teachers
        if (!$user->isTeacher()) {
            return $next($request);
        }

        // Skip if on excluded routes
        $currentRoute = $request->route()?->getName();
        if (in_array($currentRoute, $this->except)) {
            return $next($request);
        }

        // Refresh user to get latest data from database
        $user->refresh();

        // Redirect to pending approval page if not approved
        if ($user->status === 'pending_approval') {
            return redirect()->route('teacher.pending-approval');
        }

        return $next($request);
    }
}

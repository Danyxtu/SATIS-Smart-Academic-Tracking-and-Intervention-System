<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use App\Http\Middleware\AuditUserActivity;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Middleware\EnsureTeacherApproved;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsureStaff;
use App\Http\Middleware\EnsureStudent;
use App\Http\Middleware\EnsureStudentApiAccountReady;
use App\Http\Middleware\EnsureStudentEmailVerified;
use App\Http\Middleware\EnsureTeacher;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            EnsurePasswordChanged::class,
            EnsureTeacherApproved::class,
            AuditUserActivity::class,
        ]);

        $middleware->api(append: [
            AuditUserActivity::class,
        ]);

        $middleware->alias(
            [
                'staff'      => EnsureStaff::class,
                'admin'      => EnsureAdmin::class,
                'superadmin' => EnsureSuperAdmin::class,
                'student'    => EnsureStudent::class,
                'student.account.ready' => EnsureStudentApiAccountReady::class,
                'student.email.verified' => EnsureStudentEmailVerified::class,
                'teacher'    => EnsureTeacher::class,
            ]
        );

        // Login redirection is handled in RedirectIfAuthenticated middleware
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, \Throwable $exception, Request $request) {
            $status = $response->getStatusCode();

            if ($request->expectsJson()) {
                return $response;
            }

            if (in_array($status, [403, 404, 500, 503], true)) {
                return Inertia::render('Errors/Status', [
                    'status' => $status,
                ])->toResponse($request)->setStatusCode($status);
            }

            return $response;
        });
    })->create();

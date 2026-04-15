<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;

class EmailVerificationResendLimiter
{
    private const DEFAULT_COOLDOWN_SECONDS = 180;

    public static function cooldownSeconds(): int
    {
        $configuredSeconds = (int) config(
            'auth.verification.resend_cooldown_seconds',
            self::DEFAULT_COOLDOWN_SECONDS
        );

        return $configuredSeconds > 0
            ? $configuredSeconds
            : self::DEFAULT_COOLDOWN_SECONDS;
    }

    public static function retryAfter(User $user): int
    {
        return max(0, RateLimiter::availableIn(self::key($user)));
    }

    public static function start(User $user): int
    {
        $cooldownSeconds = self::cooldownSeconds();

        RateLimiter::hit(self::key($user), $cooldownSeconds);

        return $cooldownSeconds;
    }

    public static function clear(User $user): void
    {
        RateLimiter::clear(self::key($user));
    }

    public static function formatRetryAfter(int $retryAfterSeconds): string
    {
        $minutes = intdiv(max(0, $retryAfterSeconds), 60);
        $seconds = max(0, $retryAfterSeconds % 60);

        if ($minutes > 0) {
            return sprintf('%d:%02d', $minutes, $seconds);
        }

        return sprintf('0:%02d', $seconds);
    }

    private static function key(User $user): string
    {
        return 'email-verification-resend:' . $user->getKey();
    }
}

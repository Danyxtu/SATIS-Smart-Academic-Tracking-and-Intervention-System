<?php

namespace App\Support;

use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Str;

class StudentNameFormatter
{
    public static function format(?User $user, ?Student $studentProfile): string
    {
        $lastName = trim((string) ($user?->last_name ?? ''));
        $firstName = trim((string) ($user?->first_name ?? ''));
        $middleName = trim((string) ($user?->middle_name ?? ''));

        if ($lastName !== '' || $firstName !== '' || $middleName !== '') {
            $middleInitial = $middleName !== ''
                ? Str::upper(Str::substr($middleName, 0, 1)) . '.'
                : '';

            $firstAndMiddle = trim($firstName . ($middleInitial !== '' ? ' ' . $middleInitial : ''));

            if ($lastName !== '' && $firstAndMiddle !== '') {
                return $lastName . ', ' . $firstAndMiddle;
            }

            if ($lastName !== '') {
                return $lastName;
            }

            return $firstAndMiddle;
        }

        $fallbackName = preg_replace(
            '/\s+/',
            ' ',
            trim((string) ($studentProfile?->student_name ?? $user?->name ?? 'Student')),
        );

        return is_string($fallbackName) && trim($fallbackName) !== ''
            ? trim($fallbackName)
            : 'Student';
    }

    public static function sortKey(?User $user, ?Student $studentProfile): string
    {
        $lastName = Str::lower(trim((string) ($user?->last_name ?? '')));
        $firstName = Str::lower(trim((string) ($user?->first_name ?? '')));
        $middleName = Str::lower(trim((string) ($user?->middle_name ?? '')));

        if ($lastName !== '' || $firstName !== '' || $middleName !== '') {
            return trim($lastName . ' ' . $firstName . ' ' . $middleName);
        }

        return Str::lower(self::format($user, $studentProfile));
    }
}

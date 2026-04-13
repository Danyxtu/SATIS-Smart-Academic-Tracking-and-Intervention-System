<?php

namespace App\Models;

use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
implements MustVerifyEmailContract
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, MustVerifyEmail;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'middle_name',
        'username',
        'email',
        'personal_email',
        'temporary_password',
        'password',
        'status',
        'department_id',
        'created_by',
        'must_change_password',
        'password_changed_at',
    ];

    /**
     * Append virtual attributes when serializing to arrays/JSON.
     *
     * @var list<string>
     */
    protected $appends = [
        'email',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'temporary_password',
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'temporary_password' => 'encrypted',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'password_changed_at' => 'datetime',
        ];
    }

    /**
     * Get the user's full name.
     */
    public function getNameAttribute(): string
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ]);
        return implode(' ', $parts) ?: ($this->username ?? $this->personal_email ?? 'User');
    }

    /**
     * Backward-compatible alias so existing code that reads `$user->email`
     * transparently uses the `personal_email` column.
     */
    public function getEmailAttribute(): ?string
    {
        return $this->attributes['personal_email']
            ?? $this->attributes['email']
            ?? null;
    }

    /**
     * Backward-compatible alias so existing code that writes `$user->email`
     * stores the value in `personal_email`.
     */
    public function setEmailAttribute(?string $value): void
    {
        $this->attributes['personal_email'] = $value !== null
            ? Str::lower(trim($value))
            : null;
    }

    /**
     * Password broker should resolve users by personal email.
     */
    public function getEmailForPasswordReset(): string
    {
        return (string) ($this->personal_email ?? '');
    }

    protected static function booted(): void
    {
        static::creating(function (self $user): void {
            if (! filled($user->username)) {
                $base = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));

                if ($base === '' && filled($user->personal_email)) {
                    $base = Str::before((string) $user->personal_email, '@');
                }

                $user->username = self::generateUniqueUsername($base);
            }
        });
    }

    public static function generateUniqueUsername(?string $seed = null, ?int $year = null): string
    {
        $normalizedSeed = Str::of((string) $seed)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9\s]+/', ' ')
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->value();

        $tokens = $normalizedSeed !== '' ? preg_split('/\s+/', $normalizedSeed) : [];

        if (is_array($tokens) && count($tokens) >= 2) {
            $firstToken = (string) ($tokens[0] ?? '');
            $lastToken = (string) ($tokens[count($tokens) - 1] ?? '');
            $prefix = Str::substr($firstToken, 0, 1) . Str::substr($lastToken, 0, 1);
        } elseif (is_array($tokens) && count($tokens) === 1) {
            $token = (string) ($tokens[0] ?? '');
            $prefix = Str::substr($token, 0, 2);
        } else {
            $prefix = 'xx';
        }

        $prefix = strtolower(preg_replace('/[^a-z0-9]/', 'x', $prefix) ?: 'xx');
        $prefix = substr($prefix . 'xx', 0, 2);

        $resolvedYear = $year ?: (int) now()->format('Y');
        $yearPart = str_pad((string) $resolvedYear, 4, '0', STR_PAD_LEFT);
        $usernamePrefix = $prefix . $yearPart;

        $usernamePattern = '/^' . preg_quote($usernamePrefix, '/') . '\\d{5}$/';

        $latestMatching = self::query()
            ->where('username', 'like', $usernamePrefix . '%')
            ->orderByDesc('username')
            ->pluck('username')
            ->first(function ($value) use ($usernamePattern) {
                return is_string($value) && preg_match($usernamePattern, $value) === 1;
            });

        $nextSequence = 1;

        if (is_string($latestMatching) && preg_match('/(\d{5})$/', $latestMatching, $matches) === 1) {
            $nextSequence = ((int) $matches[1]) + 1;
        }

        $candidate = sprintf('%s%05d', $usernamePrefix, $nextSequence);

        while (self::query()->where('username', $candidate)->exists()) {
            $nextSequence++;
            $candidate = sprintf('%s%05d', $usernamePrefix, $nextSequence);
        }

        return $candidate;
    }

    /**
     * Get the student profile.
     */
    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    /**
     * Get the department this user belongs to.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the user who created this user.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get users created by this user.
     */
    public function createdUsers(): HasMany
    {
        return $this->hasMany(User::class, 'created_by');
    }

    /**
     * Get class enrollments for this user.
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }


    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function hasRole(string $role): bool
    {
        return $this->roles->contains('name', $role);
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isTeacher(): bool
    {
        return $this->hasRole('teacher');
    }

    public function isStudent(): bool
    {
        return $this->hasRole('student');
    }

    public function isStaff(): bool
    {
        return !$this->isStudent();
    }

    /**
     * Enforce email verification for students while allowing existing
     * non-student portal behavior to remain unchanged.
     */
    public function hasVerifiedEmail(): bool
    {
        if (! $this->isStudent()) {
            return true;
        }

        return ! is_null($this->email_verified_at);
    }

    /**
     * Normalize role names with business rules.
     * Rule: a super_admin cannot also be an admin.
     *
     * @param  array<int, string>  $roleNames
     * @return array<int, string>
     */
    public static function normalizeRoleNames(array $roleNames): array
    {
        $unique = collect($roleNames)
            ->filter(fn($name) => is_string($name) && trim($name) !== '')
            ->map(fn($name) => trim($name))
            ->unique()
            ->values();

        if ($unique->contains('super_admin')) {
            $unique = $unique->reject(fn($name) => $name === 'admin')->values();
        }

        return $unique->all();
    }

    /**
     * Sync roles by role names while enforcing role business rules.
     *
     * @param  array<int, string>  $roleNames
     */
    public function syncRolesByName(array $roleNames, bool $detaching = true): void
    {
        $normalized = self::normalizeRoleNames($roleNames);

        if ($normalized === []) {
            if ($detaching) {
                $this->roles()->detach();
            }
            return;
        }

        $roleIds = Role::query()
            ->whereIn('name', $normalized)
            ->pluck('id')
            ->all();

        if ($detaching) {
            $this->roles()->sync($roleIds);
            return;
        }

        $this->roles()->syncWithoutDetaching($roleIds);
    }

    /**
     * Scope to get users by role.
     */
    public function scopeRole($query, string $role)
    {
        return $query->whereHas('roles', fn($q) => $q->where('name', $role));
    }

    /**
     * Scope to get users in a department.
     */
    public function scopeInDepartment($query, int $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }
}

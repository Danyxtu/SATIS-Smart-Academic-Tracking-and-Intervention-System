<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'middle_name',
        'email',
        'personal_email',
        'password',
        'status',
        'department_id',
        'created_by',
        'temp_password',
        'must_change_password',
        'password_changed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'temp_password',
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
        return implode(' ', $parts) ?: $this->email;
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
        return $query->where('role', $role);
    }

    /**
     * Scope to get users in a department.
     */
    public function scopeInDepartment($query, int $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }
}

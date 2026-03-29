# Role Authorization Standardization

## Overview
This update standardizes all role and authorization logic to use the `role_user` pivot table exclusively, removing the legacy `role` column from the `users` table.

## Changes Made

### 1. Database Migrations
- **2026_03_18_235959_migrate_role_column_to_pivot.php**: Migrates existing role column data to the pivot table
- **2026_03_19_000000_remove_role_column_from_users.php**: Removes the legacy `role` column from users table

### 2. Models
- **User.php**: Updated `scopeRole()` to query pivot table instead of role column

### 3. Controllers Updated
- **SuperAdmin/AdminController.php**: 
  - Uses `syncRolesByName(['admin'])` when creating admins
  - Uses `hasRole('admin')` for authorization checks
  
- **Admin/UserController.php**:
  - Uses `syncRolesByName()` when creating/updating users
  - Uses `hasRole()` for all role checks
  - Retrieves roles via `$user->roles->pluck('name')->first()`
  
- **ProfileController.php**:
  - Uses `hasRole('student')` instead of `$user->role === 'student'`
  
- **Auth/PasswordResetLinkController.php**:
  - Uses `hasRole()` for role validation

### 4. Seeders Updated
- **AdminSeeder.php**: Uses `syncRolesByName(['admin'])` after user creation

### 5. Middleware (Already Correct)
All middleware already use pivot table methods:
- EnsureAdmin: `hasRole('admin')`
- EnsureSuperAdmin: `hasRole('super_admin')`
- EnsureTeacher: `isTeacher()`
- EnsureStudent: `hasRole('student')`
- EnsureStaff: `isStaff()`

## Migration Instructions

### Running the Migrations
```bash
# 1. First, ensure roles are seeded
php artisan db:seed --class=RoleUserSeeder

# 2. Run the data migration to sync existing role data
php artisan migrate --path=database/migrations/2026_03_18_235959_migrate_role_column_to_pivot.php

# 3. Drop the legacy role column
php artisan migrate --path=database/migrations/2026_03_19_000000_remove_role_column_from_users.php
```

### Or run all pending migrations at once:
```bash
php artisan migrate
```

## API for Role Management

### Assigning Roles
```php
// Single role
$user->syncRolesByName(['teacher']);

// Multiple roles (e.g., teacher + admin)
$user->syncRolesByName(['teacher', 'admin']);

// Note: super_admin and admin are mutually exclusive (enforced by normalizeRoleNames)
```

### Checking Roles
```php
// Check specific role
$user->hasRole('admin');
$user->isAdmin();
$user->isTeacher();
$user->isStudent();
$user->isSuperAdmin();

// Check if staff (not student)
$user->isStaff();

// Get user's roles
$roles = $user->roles; // Collection of Role models
$roleNames = $user->roles->pluck('name'); // ['teacher', 'admin']
```

### Querying by Role
```php
// Using scope
User::role('teacher')->get();

// Using whereHas
User::whereHas('roles', fn($q) => $q->where('name', 'teacher'))->get();
```

## Benefits

1. **Consistency**: Single source of truth for role data
2. **Flexibility**: Users can have multiple roles (e.g., teacher + admin)
3. **Security**: No risk of role column and pivot table being out of sync
4. **Maintainability**: All role logic uses the same methods
5. **Scalability**: Easy to add new roles without schema changes

## Breaking Changes

### Code that will break:
```php
// ❌ Direct column access (will fail after migration)
$user->role
$user->where('role', 'admin')
User::create(['role' => 'admin'])

// ✅ Use these instead:
$user->roles->pluck('name')->first()
User::role('admin') // or whereHas('roles', ...)
$user = User::create([...]); $user->syncRolesByName(['admin']);
```

## Rollback

If you need to rollback:
```bash
php artisan migrate:rollback --step=2
```

This will:
1. Restore the `role` column
2. Populate it with data from the pivot table

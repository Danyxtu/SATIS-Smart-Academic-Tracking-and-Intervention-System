# Role Authorization Standardization - Summary of Changes

## Problem
The system had split role logic between:
1. Legacy `role` column in `users` table
2. Modern `role_user` pivot table

This created:
- Inconsistent authorization checks
- Risk of data sync issues
- Potential security vulnerabilities
- Maintenance complexity

## Solution
Standardized all role logic to use ONLY the `role_user` pivot table.

## Files Modified

### 1. Database Migrations (2 new files)
- `database/migrations/2026_03_18_235959_migrate_role_column_to_pivot.php`
  - Migrates existing role column data to pivot table
  - Ensures no data loss during transition

- `database/migrations/2026_03_19_000000_remove_role_column_from_users.php`
  - Removes the legacy `role` column from users table

### 2. Models (1 file)
- `app/Models/User.php`
  - Updated `scopeRole()` method to query pivot table instead of column
  - Changed: `where('role', $role)` → `whereHas('roles', fn($q) => $q->where('name', $role))`

### 3. Controllers (4 files)

#### `app/Http/Controllers/SuperAdmin/AdminController.php`
- Line 99: Added `$admin->syncRolesByName(['admin'])` after user creation
- Lines 131, 143, 155, 167, 179, 191: Changed `$admin->role !== 'admin'` → `!$admin->hasRole('admin')`

#### `app/Http/Controllers/Admin/UserController.php`
- Line 287: Removed `'role' => $validated['role']` from user creation
- Line 298: Added `$user->syncRolesByName([$validated['role']])` after user creation
- Line 343: Changed to get role from pivot: `$user->roles->pluck('name')->first()`
- Line 371: Removed role from update data
- Line 380: Added `$user->syncRolesByName([$validated['role']])` after update
- Line 391: Changed `$oldRole = $user->role` → `$oldRole = $user->roles->pluck('name')->first()`
- Lines 336, 374, 407: Changed `$user->role === 'teacher'` → `$user->hasRole('teacher')`

#### `app/Http/Controllers/ProfileController.php`
- Line 28: Changed `$user->role === 'student'` → `$user->hasRole('student')`
- Lines 67-71: Updated to use first_name, last_name, middle_name instead of name field

#### `app/Http/Controllers/Auth/PasswordResetLinkController.php`
- Line 74: Changed `!in_array($user->role, ['teacher', 'student'])` → `!$user->hasRole('teacher') && !$user->hasRole('student')`

### 4. Seeders (1 file)
- `database/seeders/AdminSeeder.php`
  - Removed `'role' => 'admin'` from user creation
  - Added `$admin->syncRolesByName(['admin'])` after user creation

### 5. Documentation (2 new files)
- `ROLE_STANDARDIZATION.md` - Comprehensive documentation
- `ROLE_STANDARDIZATION_SUMMARY.md` - This file

## Files Already Correct (No Changes Needed)

### Middleware
All middleware already use pivot table methods:
- `app/Http/Middleware/EnsureAdmin.php` - Uses `hasRole('admin')`
- `app/Http/Middleware/EnsureSuperAdmin.php` - Uses `hasRole('super_admin')`
- `app/Http/Middleware/EnsureTeacher.php` - Uses `isTeacher()`
- `app/Http/Middleware/EnsureStudent.php` - Uses `hasRole('student')`
- `app/Http/Middleware/EnsureStaff.php` - Uses `isStaff()`

### Other Controllers
- `app/Http/Controllers/SuperAdmin/UserManagementController.php` - Already using pivot correctly

### Frontend
- `app/Http/Middleware/HandleInertiaRequests.php` - Already loads and passes roles correctly
- All Vue/JSX components - Already access `user.roles` array

## Testing Checklist

After running migrations, verify:

- [ ] Super admin can log in
- [ ] Admin can log in
- [ ] Teacher can log in
- [ ] Student can log in
- [ ] Super admin can create admins
- [ ] Admin can create teachers
- [ ] Admin can create students
- [ ] Role-based middleware works correctly
- [ ] User list shows correct roles
- [ ] Role filtering works in user management
- [ ] Password reset requests work
- [ ] Profile updates work for all user types

## Rollback Plan

If issues occur:
```bash
php artisan migrate:rollback --step=2
```

This will:
1. Restore the `role` column
2. Populate it with data from pivot table
3. Revert all code changes (manual git revert needed)

## Next Steps

1. Run migrations in development environment
2. Test all functionality
3. Run migrations in staging
4. Test again
5. Deploy to production with maintenance window
6. Monitor for issues

## Benefits Achieved

✅ Single source of truth for roles
✅ Consistent authorization logic
✅ No risk of data sync issues
✅ Support for multiple roles per user
✅ Easier to maintain and extend
✅ Better security posture

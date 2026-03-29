# Role Standardization Migration Guide

## ⚠️ Important: Read Before Proceeding

This migration removes the legacy `role` column from the `users` table and standardizes all role logic to use the `role_user` pivot table. This is a **breaking change** that requires careful execution.

## Prerequisites

1. ✅ Backup your database
2. ✅ Ensure all team members have pulled the latest code
3. ✅ Test in development environment first
4. ✅ Schedule maintenance window for production

## Step-by-Step Migration

### Step 1: Backup Database
```bash
# Create a backup before proceeding
php artisan db:backup
# Or manually backup your database
```

### Step 2: Ensure Roles Exist
```bash
# Seed the roles table if not already done
php artisan db:seed --class=RoleUserSeeder
```

### Step 3: Run Data Migration
```bash
# This migrates existing role column data to pivot table
php artisan migrate --path=database/migrations/2026_03_18_235959_migrate_role_column_to_pivot.php
```

**What this does:**
- Reads all users with a `role` column value
- Creates corresponding entries in `role_user` pivot table
- Does NOT delete the role column yet

### Step 4: Verify Data Migration
```bash
# Check that all users have roles in pivot table
php artisan tinker
```

In Tinker:
```php
use App\Models\User;

// Check users without roles
$usersWithoutRoles = User::doesntHave('roles')->count();
echo "Users without roles: $usersWithoutRoles\n";

// Should be 0. If not, investigate before proceeding!

// Check role distribution
use App\Models\Role;
Role::withCount('users')->get()->each(function($role) {
    echo "{$role->label}: {$role->users_count} users\n";
});

exit
```

### Step 5: Remove Role Column
```bash
# Only proceed if Step 4 verification passed!
php artisan migrate --path=database/migrations/2026_03_19_000000_remove_role_column_from_users.php
```

**What this does:**
- Drops the `role` column from `users` table
- This is irreversible without rollback!

### Step 6: Run Verification Script
```bash
./verify-roles.sh
```

This script will:
- ✅ Confirm role column is removed
- ✅ Verify all users have roles
- ✅ Test role methods
- ✅ Test role scope
- ✅ Show role distribution

### Step 7: Manual Testing

Test these critical flows:

#### Authentication
- [ ] Super admin login
- [ ] Admin login
- [ ] Teacher login
- [ ] Student login

#### User Management
- [ ] Super admin creates admin
- [ ] Admin creates teacher
- [ ] Admin creates student
- [ ] View user list with role filters
- [ ] Edit user and change role
- [ ] Delete user

#### Authorization
- [ ] Super admin can access super admin routes
- [ ] Admin can access admin routes
- [ ] Teacher can access teacher routes
- [ ] Student can access student routes
- [ ] Users cannot access unauthorized routes

#### Password Reset
- [ ] Teacher requests password reset
- [ ] Student requests password reset
- [ ] Admin approves password reset

### Step 8: Clear Caches
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

## Rollback Procedure

If something goes wrong:

```bash
# Rollback both migrations
php artisan migrate:rollback --step=2
```

This will:
1. Restore the `role` column
2. Populate it with data from pivot table
3. Remove the data migration

**Note:** You'll also need to revert the code changes via git:
```bash
git revert <commit-hash>
```

## Common Issues & Solutions

### Issue: Users without roles after migration
**Solution:**
```php
// In tinker
use App\Models\User;
use App\Models\Role;

$usersWithoutRoles = User::doesntHave('roles')->get();
foreach ($usersWithoutRoles as $user) {
    // Assign default role based on department or other criteria
    $user->syncRolesByName(['student']); // or appropriate role
}
```

### Issue: Multiple roles assigned incorrectly
**Solution:**
```php
// In tinker
use App\Models\User;

$user = User::find($userId);
$user->syncRolesByName(['correct_role']); // This replaces all roles
```

### Issue: Super admin also has admin role
**Solution:**
This is automatically handled by `normalizeRoleNames()` method. If you see this:
```php
use App\Models\User;

$superAdmin = User::find($userId);
$superAdmin->syncRolesByName(['super_admin']); // Will remove admin role
```

## Production Deployment Checklist

- [ ] Backup database
- [ ] Notify users of maintenance window
- [ ] Pull latest code
- [ ] Run migrations
- [ ] Run verification script
- [ ] Perform manual testing
- [ ] Monitor error logs
- [ ] Clear all caches
- [ ] Notify users system is back online

## Support

If you encounter issues:
1. Check the error logs: `storage/logs/laravel.log`
2. Run the verification script: `./verify-roles.sh`
3. Review the documentation: `ROLE_STANDARDIZATION.md`
4. Contact the development team

## Timeline Estimate

- Development environment: 15-30 minutes
- Staging environment: 30-45 minutes
- Production environment: 45-60 minutes (including testing)

## Success Criteria

✅ All migrations completed successfully
✅ Verification script passes all tests
✅ Manual testing checklist completed
✅ No errors in logs
✅ All users can log in
✅ Role-based access control works correctly

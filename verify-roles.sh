#!/bin/bash

# Role Standardization Verification Script
# Run this after migrations to verify everything works

echo "🔍 Role Standardization Verification"
echo "===================================="
echo ""

# Check if migrations are pending
echo "1. Checking migration status..."
php artisan migrate:status | grep -E "(migrate_role_column_to_pivot|remove_role_column_from_users)"
echo ""

# Check if role column exists (should not exist after migration)
echo "2. Checking if role column exists in users table..."
php artisan tinker --execute="
use Illuminate\Support\Facades\Schema;
if (Schema::hasColumn('users', 'role')) {
    echo '❌ FAIL: role column still exists\n';
} else {
    echo '✅ PASS: role column removed\n';
}
"
echo ""

# Check if all users have roles in pivot table
echo "3. Checking if all users have roles..."
php artisan tinker --execute="
use App\Models\User;
\$usersWithoutRoles = User::doesntHave('roles')->count();
if (\$usersWithoutRoles > 0) {
    echo '❌ FAIL: ' . \$usersWithoutRoles . ' users without roles\n';
} else {
    echo '✅ PASS: All users have roles\n';
}
"
echo ""

# Test role methods
echo "4. Testing role methods..."
php artisan tinker --execute="
use App\Models\User;
\$admin = User::whereHas('roles', fn(\$q) => \$q->where('name', 'admin'))->first();
if (\$admin && \$admin->hasRole('admin') && \$admin->isAdmin()) {
    echo '✅ PASS: Admin role methods work\n';
} else {
    echo '❌ FAIL: Admin role methods not working\n';
}
"
echo ""

# Test scope
echo "5. Testing role scope..."
php artisan tinker --execute="
use App\Models\User;
\$count = User::role('admin')->count();
echo '✅ PASS: Found ' . \$count . ' admin(s) using scope\n';
"
echo ""

# Check role counts
echo "6. Role distribution..."
php artisan tinker --execute="
use App\Models\Role;
use Illuminate\Support\Facades\DB;
\$roles = Role::withCount('users')->get();
foreach (\$roles as \$role) {
    echo '  ' . \$role->label . ': ' . \$role->users_count . ' users\n';
}
"
echo ""

echo "===================================="
echo "✅ Verification complete!"
echo ""
echo "If all tests passed, the role standardization is successful."
echo "If any tests failed, check the error messages above."

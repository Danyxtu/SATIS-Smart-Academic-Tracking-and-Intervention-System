# Quick Start - Testing Your SATIS System

## 🚀 Before You Start

Make sure you have:
1. PHP installed
2. Laravel project dependencies installed
3. Database configured (can use SQLite for testing)

## 📋 Step 1: Setup Testing Environment

```bash
# Navigate to your project
cd "/home/danyxtu021/Desktop/Sofware Engineering/SATIS-Smart-Academic-Tracking-and-Intervention-System"

# Install PHP dependencies (if not already done)
composer install

# Run migrations for testing database (creates :memory: SQLite)
php artisan migrate --env=testing
```

## 🧪 Step 2: Run Tests

### Run ALL Tests
```bash
php artisan test
```

### Run Specific Feature Tests
```bash
# Test authentication
php artisan test tests/Feature/Auth/

# Test student features
php artisan test tests/Feature/Student/

# Test teacher features
php artisan test tests/Feature/Teacher/

# Test admin features
php artisan test tests/Feature/Admin/

# Test super admin features
php artisan test tests/Feature/SuperAdmin/
```

### Run a Single Test File
```bash
php artisan test tests/Feature/Student/DashboardTest.php
```

### Run Tests with Coverage Report
```bash
php artisan test --coverage
```

### Run Tests in Parallel (Faster)
```bash
php artisan test --parallel
```

## ✅ What Each Test Does

### Authentication Tests (`tests/Feature/Auth/AuthenticationTest.php`)
- ✓ User can view login page
- ✓ Student can login with correct credentials
- ✓ User cannot login with wrong password
- ✓ User cannot login with non-existent email
- ✓ Authenticated user is redirected to dashboard
- ✓ User can logout
- ✓ Redirect after login based on role

**Run it:**
```bash
php artisan test tests/Feature/Auth/AuthenticationTest.php
```

### Student Portal Tests (`tests/Feature/Student/DashboardTest.php`)
- ✓ Student can access dashboard
- ✓ Unauthenticated user cannot access dashboard
- ✓ Teacher cannot access student dashboard
- ✓ Dashboard displays enrolled subjects
- ✓ Student can mark notification as read
- ✓ Student can view analytics

**Run it:**
```bash
php artisan test tests/Feature/Student/DashboardTest.php
```

### Teacher Portal Tests (`tests/Feature/Teacher/DashboardTest.php`)
- ✓ Teacher can access dashboard
- ✓ Unauthenticated user cannot access dashboard
- ✓ Student cannot access teacher dashboard
- ✓ Pending teacher sees pending approval page

**Run it:**
```bash
php artisan test tests/Feature/Teacher/DashboardTest.php
```

### Admin Portal Tests (`tests/Feature/Admin/DashboardTest.php`)
- ✓ Admin can access dashboard
- ✓ Unauthenticated user cannot access dashboard
- ✓ Student cannot access admin dashboard

**Run it:**
```bash
php artisan test tests/Feature/Admin/DashboardTest.php
```

### Super Admin Portal Tests (`tests/Feature/SuperAdmin/DashboardTest.php`)
- ✓ Super admin can access dashboard
- ✓ Unauthenticated user cannot access dashboard
- ✓ Admin cannot access super admin dashboard
- ✓ Super admin can view departments

**Run it:**
```bash
php artisan test tests/Feature/SuperAdmin/DashboardTest.php
```

## 🎯 Testing Workflow

### Week 1: Basic Tests
```bash
# Day 1-2: Run authentication tests
php artisan test tests/Feature/Auth/

# Day 3-4: Run portal access tests
php artisan test tests/Feature/Student/DashboardTest.php
php artisan test tests/Feature/Teacher/DashboardTest.php
php artisan test tests/Feature/Admin/DashboardTest.php

# Day 5: Full test run
php artisan test
```

### Week 2: Feature Tests
```bash
# Add tests for:
# - User management (create, edit, delete)
# - Attendance taking and viewing
# - Grade input and viewing
# - Intervention creation and management
# - Notification and email sending
```

### Week 3+: Edge Cases & Performance
```bash
# Test:
# - Concurrent requests
# - Large data sets
# - Error handling
# - Email delivery
# - PDF generation
```

## 📊 Understanding Test Output

### Successful Run ✅
```
tests/Feature/Auth/AuthenticationTest.php
✓ user can view login page
✓ student can login with correct credentials
✓ user cannot login with wrong password
✓ user can logout

Tests: 4 passed (15 assertions)
Time: 0.234s
```

### Failed Test ❌
```
tests/Feature/Student/DashboardTest.php
✗ student can access dashboard

AssertionError:
Expected response status code [200] but received [403].

Failed asserting that 200 is identical to 403.

File: tests/Feature/Student/DashboardTest.php:20
```

### How to Fix
1. Read the error message
2. Check what status code was received (403 = forbidden)
3. Verify user role is correct
4. Check authorization gates in `app/Providers/AppServiceProvider.php`
5. Run test again

## 🐛 Common Test Issues

### "Table does not exist"
```bash
php artisan migrate --env=testing
```

### "Method does not exist"
- Check model and controller method names
- Ensure factory exists: `database/factories/UserFactory.php`

### "CSRF token mismatch"
```php
// Add to test if needed:
$response = $this->withoutMiddleware('csrf')->post(...);
```

### "Trying to access undefined variable"
- Check database transactions are enabled
- Ensure factory creates the record

## 📈 Code Coverage

View how much of your code is tested:

```bash
php artisan test --coverage

# Output shows percentage covered for each file
# Goal: 80%+ coverage
```

To see detailed coverage:

```bash
php artisan test --coverage --coverage-html=storage/coverage
# Open storage/coverage/index.html in browser
```

## 🚨 Test Everything Checklist

### Routes
- [ ] All routes accessible by correct roles
- [ ] All routes return correct status codes
- [ ] Unauthorized users get 403 Forbidden

### Database
- [ ] Records are created correctly
- [ ] Records are updated correctly
- [ ] Records are deleted correctly
- [ ] Relationships work correctly

### Business Logic
- [ ] Calculations are correct
- [ ] Validations work
- [ ] Edge cases handled

### User Experience
- [ ] Error messages are clear
- [ ] Success messages appear
- [ ] Redirects work correctly
- [ ] Data displays correctly

## 📚 Example: Write Your First Test

1. **Create file:** `tests/Feature/Student/AttendanceTest.php`

```php
<?php

namespace Tests\Feature\Student;

use App\Models\User;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    public function test_student_can_view_attendance(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)->get('/attendance');

        $response->assertOk();
    }
}
```

2. **Run it:**
```bash
php artisan test tests/Feature/Student/AttendanceTest.php
```

3. **See it pass! ✅**

## 🔄 Continuous Testing

### Auto-run tests when files change
```bash
php artisan test --watch
```

### Run tests on every Git commit
Add this to `.git/hooks/pre-commit`:
```bash
#!/bin/sh
php artisan test
```

## 📞 Need Help?

1. Check the full guide: `TESTING_GUIDE.md`
2. Read test error messages carefully
3. Compare with example tests in `tests/Feature/`
4. Check Laravel docs: https://laravel.com/docs/testing

## 🎓 Learning Path

1. ✅ Run existing tests
2. ✅ Understand test structure
3. ✅ Write simple tests
4. ✅ Write complex tests
5. ✅ Achieve 80%+ coverage
6. ✅ Set up CI/CD pipeline

---

**Happy Testing! 🚀**


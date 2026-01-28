# SATIS System - Complete Testing Guide

## Overview

This document outlines the proper way to test the SATIS (Smart Academic Tracking and Intervention System) application. The system uses **Laravel** for the backend and **React with Inertia.js** for the frontend, requiring tests at multiple levels.

---

## Testing Pyramid

```
        ┌─────────────────┐
        │   E2E Tests     │  (Selenium, Cypress, Playwright)
        │  (UI Workflows) │
        ├─────────────────┤
        │   Feature Tests │  (HTTP Requests, Routes, Controllers)
        │  (Integration)  │
        ├─────────────────┤
        │   Unit Tests    │  (Functions, Models, Methods)
        │  (Isolated)     │
        └─────────────────┘
```

---

## Testing Levels Explained

### 1. **Unit Tests** (Bottom - Foundation)
- Test individual functions, methods, and classes in **isolation**
- Mock external dependencies
- Fastest to run
- Best for: business logic, calculations, validations

**Example**: Testing if a prediction service correctly calculates attendance risk

### 2. **Feature/Integration Tests** (Middle)
- Test how multiple components work **together**
- Test HTTP endpoints and routes
- Test database interactions
- Medium speed

**Example**: Testing "Create a student" workflow (form → controller → database → response)

### 3. **End-to-End Tests** (Top - User Perspective)
- Test **complete user workflows** through the UI
- Simulate real user interactions (clicks, typing, etc.)
- Slowest but most realistic
- Best for: critical user flows

**Example**: "Teacher logs in → Creates intervention → Marks as complete"

---

## Getting Started with Testing

### Prerequisites

Make sure your `.env.testing` or phpunit.xml has these settings:

```
APP_ENV=testing
DB_CONNECTION=sqlite
DB_DATABASE=:memory:
MAIL_MAILER=array
```

Your `phpunit.xml` is already configured ✅

### Install Testing Tools

```bash
# Composer dependencies are already installed
composer install

# Install Node dependencies for frontend testing (optional)
npm install
```

---

## Test Structure

```
tests/
├── Unit/                    # Unit tests (isolated logic)
│   ├── Services/
│   ├── Models/
│   └── ...
├── Feature/                 # Feature/Integration tests (HTTP, workflows)
│   ├── Auth/
│   ├── Admin/
│   ├── Teacher/
│   ├── Student/
│   └── SuperAdmin/
├── TestCase.php            # Base test class
└── Pest.php                # Pest framework config
```

---

## Testing with Pest Framework

Your project uses **Pest** (modern PHP testing framework built on PHPUnit). It's simpler and more readable.

### Basic Pest Test Structure

```php
<?php

use Tests\TestCase;
use App\Models\User;

test('user can log in', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password'),
    ]);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect('/dashboard');
    $this->assertAuthenticated();
});
```

---

## Comprehensive Testing Outline

### **PHASE 1: Authentication & Authorization**

#### 1.1 Unit Tests - Authentication Logic
- [ ] Test password hashing
- [ ] Test token generation
- [ ] Test role validation

#### 1.2 Feature Tests - Login/Logout
- [ ] User can log in with correct credentials
- [ ] User cannot log in with wrong password
- [ ] User cannot log in with non-existent email
- [ ] Logged-in user can access protected routes
- [ ] Logged-out user is redirected to login
- [ ] User can log out
- [ ] Session is destroyed after logout

**Sample Test:**
```php
test('student can login', function () {
    $student = User::factory()->create(['role' => 'student']);
    $response = $this->post('/login', [
        'email' => $student->email,
        'password' => 'password',
    ]);
    $response->assertRedirect('/redirect-after-login');
});

test('student cannot access admin dashboard', function () {
    $student = User::factory()->create(['role' => 'student']);
    $this->actingAs($student)
        ->get('/admin/dashboard')
        ->assertForbidden();
});
```

---

### **PHASE 2: Student Portal**

#### 2.1 Dashboard & Notifications
- [ ] Student can access dashboard
- [ ] Dashboard displays enrolled subjects
- [ ] Dashboard shows at-risk subjects
- [ ] Notifications appear correctly
- [ ] User can mark notification as read
- [ ] User can mark all notifications as read
- [ ] Unread count is accurate

#### 2.2 Interventions Feed
- [ ] Student sees assigned interventions
- [ ] Student can view intervention details
- [ ] Student can complete intervention tasks
- [ ] Student can request intervention completion
- [ ] Student receives feedback notifications
- [ ] Intervention status updates correctly

#### 2.3 Analytics & Reporting
- [ ] Student can view analytics for each enrollment
- [ ] Analytics show correct grades
- [ ] Analytics show attendance data
- [ ] Student can export PDF reports
- [ ] PDF contains all necessary data

#### 2.4 Attendance Viewing
- [ ] Student can view attendance records
- [ ] Attendance shows correct dates
- [ ] Attendance shows present/absent status

#### 2.5 Subject at Risk
- [ ] Page displays at-risk subjects
- [ ] Shows reasons for risk (low grades, high absences)
- [ ] Links to interventions work

**Sample Test:**
```php
test('student can view analytics', function () {
    $student = User::factory()->create(['role' => 'student']);
    $enrollment = Enrollment::factory()->for($student)->create();
    
    $response = $this->actingAs($student)
        ->get("/analytics/{$enrollment->id}");
    
    $response->assertOk();
    $response->assertInertia(fn ($page) =>
        $page
            ->component('Student/Analytics')
            ->has('enrollment')
            ->has('grades')
    );
});
```

---

### **PHASE 3: Teacher Portal**

#### 3.1 Dashboard
- [ ] Teacher can access dashboard
- [ ] Dashboard shows taught subjects
- [ ] Dashboard shows class statistics
- [ ] Shows upcoming classes/interventions

#### 3.2 Class Management
- [ ] Teacher can view classes
- [ ] Teacher can create new class
- [ ] Teacher can add students to class (manually)
- [ ] Teacher can upload class list (CSV/Excel)
- [ ] Teacher can start a quarter
- [ ] Teacher can update grade structure
- [ ] Class list displays correctly

#### 3.3 Attendance Management
- [ ] Teacher can access attendance page
- [ ] Teacher can take attendance (mark present/absent)
- [ ] Teacher can save attendance records
- [ ] Teacher can view attendance log
- [ ] Teacher can export attendance (CSV/PDF)
- [ ] Cannot take attendance for past dates (validation)
- [ ] Attendance history is maintained

#### 3.4 Grades Management
- [ ] Teacher can input grades
- [ ] Teacher can bulk upload grades
- [ ] Teacher can import grades (CSV/Excel)
- [ ] Grades are saved correctly
- [ ] Grade structure reflects in calculations
- [ ] Can view grade breakdown per student

#### 3.5 Interventions
- [ ] Teacher can view all interventions
- [ ] Teacher can create intervention for student
- [ ] Teacher can create bulk interventions
- [ ] Teacher can assign tasks to intervention
- [ ] Teacher can view student completion requests
- [ ] Teacher can approve intervention completion
- [ ] Teacher can reject intervention completion with reason
- [ ] Teacher can send nudges to students
- [ ] Intervention status reflects correctly

#### 3.6 Pending Approval Page
- [ ] Teacher sees pending approval message if not approved
- [ ] Teacher can access portal once approved

**Sample Test:**
```php
test('teacher can take attendance', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $subject = Subject::factory()->for($teacher)->create();
    
    $response = $this->actingAs($teacher)
        ->post('/teacher/attendance', [
            'subject_id' => $subject->id,
            'date' => now()->toDateString(),
            'attendance' => [
                'student_1' => 'present',
                'student_2' => 'absent',
            ],
        ]);
    
    $response->assertRedirect();
    $this->assertDatabaseHas('attendance_records', [
        'subject_id' => $subject->id,
        'date' => now()->toDateString(),
    ]);
});
```

---

### **PHASE 4: Admin Portal**

#### 4.1 Dashboard
- [ ] Admin can access dashboard
- [ ] Dashboard shows system statistics
- [ ] Shows user counts, pending approvals

#### 4.2 User Management
- [ ] Admin can view all users
- [ ] Admin can create new user (student/teacher)
- [ ] Admin can edit user information
- [ ] Admin can delete user
- [ ] Admin can bulk delete users
- [ ] Admin can reset user password
- [ ] User email is sent with credentials/password

#### 4.3 Password Reset Requests
- [ ] Admin can view pending password reset requests
- [ ] Admin can approve password reset request
- [ ] Admin can reject password reset request
- [ ] User receives appropriate notifications

#### 4.4 Teacher Registration Approvals
- [ ] Admin can view pending registrations
- [ ] Admin can view uploaded documents
- [ ] Admin can approve registration
- [ ] Admin can reject registration with reason
- [ ] Teacher receives approval/rejection email
- [ ] Approved teacher can access portal

**Sample Test:**
```php
test('admin can manage users', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    
    $response = $this->actingAs($admin)
        ->post('/admin/users', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'role' => 'student',
            'password' => 'password123',
        ]);
    
    $response->assertRedirect('/admin/users');
    $this->assertDatabaseHas('users', [
        'email' => 'john@example.com',
        'role' => 'student',
    ]);
});
```

---

### **PHASE 5: Super Admin Portal**

#### 5.1 Dashboard
- [ ] Super Admin can access dashboard
- [ ] Shows system-wide statistics

#### 5.2 Department Management
- [ ] Super Admin can view all departments
- [ ] Can create new department
- [ ] Can edit department
- [ ] Can delete department
- [ ] Can toggle department status (active/inactive)
- [ ] Department list is accurate

#### 5.3 Admin Management
- [ ] Super Admin can view all admins
- [ ] Can create new admin
- [ ] Can edit admin
- [ ] Can delete admin
- [ ] Can reset admin password
- [ ] Can resend admin credentials
- [ ] Admin credentials email is sent

#### 5.4 Curriculum Management
- [ ] Super Admin can view all master subjects
- [ ] Can create new master subject
- [ ] Can edit master subject
- [ ] Can delete master subject
- [ ] Can set prerequisites
- [ ] Can toggle status
- [ ] Subject list shows correctly with prerequisites

#### 5.5 System Settings
- [ ] Super Admin can view settings
- [ ] Can update academic settings (terms, quarters)
- [ ] Can update enrollment settings
- [ ] Can update grading settings
- [ ] Can update school info
- [ ] Settings are saved correctly
- [ ] Settings affect system behavior

**Sample Test:**
```php
test('super admin can manage departments', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    
    $response = $this->actingAs($superAdmin)
        ->post('/superadmin/departments', [
            'name' => 'Computer Science',
            'code' => 'CS',
        ]);
    
    $response->assertRedirect();
    $this->assertDatabaseHas('departments', [
        'name' => 'Computer Science',
    ]);
});
```

---

### **PHASE 6: Profile & Universal Routes**

#### 6.1 Profile Management
- [ ] User can view profile
- [ ] User can edit profile information
- [ ] User can update password
- [ ] User can request password reset
- [ ] User can cancel password reset request
- [ ] Changes are saved correctly

#### 6.2 Redirect After Login
- [ ] Student redirects to student dashboard
- [ ] Teacher redirects to teacher dashboard
- [ ] Admin redirects to admin dashboard
- [ ] Super Admin redirects to super admin dashboard

---

### **PHASE 7: Data Validation & Error Handling**

#### 7.1 Input Validation
- [ ] Email format validation
- [ ] Required fields validation
- [ ] Numeric field validation
- [ ] Date format validation
- [ ] File upload validation
- [ ] Error messages display correctly

#### 7.2 Business Logic Validation
- [ ] Cannot enroll student in same subject twice
- [ ] Cannot take attendance for future dates
- [ ] Cannot create intervention without valid subject
- [ ] Grade must be within valid range
- [ ] Attendance percentage calculates correctly

#### 7.3 Authorization & Access Control
- [ ] Teacher cannot access other teacher's classes
- [ ] Admin cannot manage super admin accounts
- [ ] Student cannot access teacher routes
- [ ] Deleted user cannot access system
- [ ] Inactive department blocks enrollment

---

### **PHASE 8: Database Integrity**

#### 8.1 Relationships
- [ ] Student has many enrollments
- [ ] Teacher has many subjects
- [ ] Subject has many enrollments
- [ ] Grades are linked to correct enrollment
- [ ] Attendance records are linked correctly

#### 8.2 Cascading Operations
- [ ] Deleting user deletes related records
- [ ] Deleting subject handles orphaned enrollments
- [ ] Deleting intervention deletes tasks

#### 8.3 Data Consistency
- [ ] Enrollment count matches actual records
- [ ] Grade calculations match stored values
- [ ] Attendance percentages are accurate

---

### **PHASE 9: Performance & Edge Cases**

#### 9.1 Performance
- [ ] Dashboard loads in < 1 second
- [ ] Reports generate in reasonable time
- [ ] Pagination works for large datasets
- [ ] Search/filter functions efficiently

#### 9.2 Edge Cases
- [ ] System handles 1000+ students
- [ ] System handles special characters in names
- [ ] Concurrent requests don't cause conflicts
- [ ] Large file uploads handled gracefully
- [ ] Empty datasets show appropriate messages

---

### **PHASE 10: Email & Notifications**

#### 10.1 Email Functionality
- [ ] Welcome email sent on user creation
- [ ] Password reset email has correct link
- [ ] Admin credentials sent to new admin
- [ ] Rejection reasons included in emails
- [ ] Email templates render correctly

#### 10.2 Notifications
- [ ] Notifications created correctly
- [ ] Read status toggles properly
- [ ] Notification count accurate
- [ ] Deleted notifications removed from list

---

## How to Run Tests

### Run All Tests
```bash
php artisan test
```

### Run Specific Test Suite
```bash
php artisan test tests/Feature/Auth
php artisan test tests/Unit/Services
```

### Run Single Test File
```bash
php artisan test tests/Feature/Student/DashboardTest.php
```

### Run with Coverage Report
```bash
php artisan test --coverage
```

### Run Tests in Parallel (faster)
```bash
php artisan test --parallel
```

### Run Specific Test Method
```bash
php artisan test tests/Feature/AuthTest.php --filter=test_user_can_login
```

---

## Writing Tests - Quick Reference

### Test Template

```php
<?php

namespace Tests\Feature\Student;

use Tests\TestCase;
use App\Models\User;
use App\Models\Subject;

class DashboardTest extends TestCase
{
    /** @test */
    public function student_can_view_dashboard()
    {
        // ARRANGE: Set up test data
        $student = User::factory()->create(['role' => 'student']);

        // ACT: Perform the action
        $response = $this->actingAs($student)->get('/dashboard');

        // ASSERT: Verify the outcome
        $response->assertOk();
        $response->assertViewIs('Student.Dashboard');
    }

    /** @test */
    public function dashboard_shows_enrolled_subjects()
    {
        $student = User::factory()->create(['role' => 'student']);
        $subject = Subject::factory()->create();
        Enrollment::factory()->for($student)->for($subject)->create();

        $response = $this->actingAs($student)->get('/dashboard');

        $response->assertInertia(fn ($page) =>
            $page->has('enrollments', 1)
        );
    }
}
```

### Assertion Helpers

```php
// Response assertions
$response->assertOk();                          // Status 200
$response->assertCreated();                     // Status 201
$response->assertUnauthorized();                // Status 401
$response->assertForbidden();                   // Status 403
$response->assertNotFound();                    // Status 404
$response->assertRedirect('/path');
$response->assertViewIs('view.name');

// Database assertions
$this->assertDatabaseHas('users', ['email' => 'test@example.com']);
$this->assertDatabaseMissing('users', ['email' => 'deleted@example.com']);

// Authentication assertions
$this->assertAuthenticated();
$this->assertGuest();
$this->actingAs($user);

// JSON assertions
$response->assertJsonStructure(['data' => ['id', 'name']]);
$response->assertJson(['success' => true]);

// Inertia assertions (React components)
$response->assertInertia(fn ($page) =>
    $page
        ->component('Student/Dashboard')
        ->has('enrollments')
        ->where('total', 5)
);
```

---

## Testing Best Practices

### ✅ DO

1. **Use Descriptive Names**
   ```php
   test('teacher_can_create_intervention_for_student'); // ✅ Good
   test('create'); // ❌ Bad
   ```

2. **Follow AAA Pattern (Arrange, Act, Assert)**
   ```php
   // Arrange: Setup
   $user = User::factory()->create();
   
   // Act: Do something
   $response = $this->actingAs($user)->post('/users', [...]);
   
   // Assert: Verify
   $response->assertRedirect();
   ```

3. **Use Factories for Test Data**
   ```php
   $user = User::factory()->create(); // ✅ Clean, reusable
   $user = new User(...); // ❌ Messy
   ```

4. **Test One Thing Per Test**
   ```php
   // ✅ Good - single responsibility
   test('user_can_login');
   test('user_cannot_login_with_wrong_password');
   
   // ❌ Bad - testing multiple things
   test('user_login_workflow');
   ```

5. **Use Transactions to Rollback**
   ```php
   class TestCase extends BaseTestCase
   {
       use DatabaseTransactions; // Rolls back after each test
   }
   ```

### ❌ DON'T

1. Don't test the framework (Laravel testing is already tested)
2. Don't make tests dependent on each other
3. Don't use real file operations (use fake disk)
4. Don't make unnecessary database queries
5. Don't test implementation details, test behavior

---

## Testing Checklist - First Week

- [ ] Phase 1: Authentication (3 days)
- [ ] Phase 2: Student Portal (2 days)
- [ ] Phase 3: Teacher Portal (3 days)
- [ ] Phase 4: Admin Portal (2 days)
- [ ] Phase 5: Super Admin Portal (2 days)
- [ ] Phase 6: Profile & Universal Routes (1 day)
- [ ] Phase 7: Validation & Error Handling (2 days)
- [ ] Phase 8: Database Integrity (1 day)
- [ ] Phase 9: Performance & Edge Cases (2 days)
- [ ] Phase 10: Email & Notifications (1 day)

**Goal:** 80-90% code coverage

---

## Continuous Integration (CI)

### GitHub Actions Example

Create `.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: php-actions/composer@v6
      - run: php artisan test
```

---

## Troubleshooting Tests

### Test Failed - What to Do?

1. **Read the error message carefully**
2. **Check test database is clean** - migrations ran
3. **Verify test data exists** - factories created records
4. **Debug with dd()** - dump and die to inspect values
5. **Run single test** - isolate the problem

### Common Issues

| Issue | Solution |
|-------|----------|
| "Table does not exist" | Run migrations: `php artisan migrate --env=testing` |
| "Factory not found" | Check factory path and namespace |
| "Undefined method" | Ensure method exists on model/class |
| "Assertion failed" | Check actual vs expected values |
| "CSRF token mismatch" | Disable CSRF for API tests or use session |

---

## Next Steps

1. **Create test files** for each major feature
2. **Run tests frequently** during development
3. **Aim for 80%+ code coverage**
4. **Set up CI/CD pipeline** for automated testing
5. **Write tests FIRST** (TDD approach) for new features

---

## Resources

- [Laravel Testing Docs](https://laravel.com/docs/testing)
- [Pest PHP Docs](https://pestphp.com/)
- [PHPUnit Docs](https://phpunit.de/documentation.html)
- [Testing Best Practices](https://laravel.com/docs/testing#best-practices)


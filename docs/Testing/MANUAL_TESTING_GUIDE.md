# Manual Testing Guide - UI & Button Testing

## 📌 Introduction

Manual testing means you actually use the application yourself by clicking buttons, filling forms, and checking if the expected results happen. This is important for catching UI bugs that automated tests might miss.

---

## 🎯 Before Manual Testing

### 1. Setup Your Development Environment

```bash
cd "/home/danyxtu021/Desktop/Sofware Engineering/SATIS-Smart-Academic-Tracking-and-Intervention-System"

# Install dependencies
composer install
npm install

# Setup environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Create and migrate database
php artisan migrate:fresh --seed

# Start the development server
php artisan serve

# In another terminal, start Vite for frontend
npm run dev
```

Visit: http://localhost:8000

### 2. Create Test Users

You can use seeders or create users manually:

```bash
# Use tinker to create users
php artisan tinker

# Create a student
$student = App\Models\User::create([
    'first_name' => 'John',
    'last_name' => 'Student',
    'email' => 'student@example.com',
    'password' => bcrypt('password'),
    'role' => 'student',
    'email_verified_at' => now(),
]);

# Create a teacher
$teacher = App\Models\User::create([
    'first_name' => 'Jane',
    'last_name' => 'Teacher',
    'email' => 'teacher@example.com',
    'password' => bcrypt('password'),
    'role' => 'teacher',
    'email_verified_at' => now(),
]);

# Create an admin
$admin = App\Models\User::create([
    'first_name' => 'Bob',
    'last_name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => bcrypt('password'),
    'role' => 'admin',
    'email_verified_at' => now(),
]);

# Create a super admin
$superAdmin = App\Models\User::create([
    'first_name' => 'Alice',
    'last_name' => 'SuperAdmin',
    'email' => 'superadmin@example.com',
    'password' => bcrypt('password'),
    'role' => 'super_admin',
    'email_verified_at' => now(),
]);

exit
```

### 3. Open Browser DevTools

Press `F12` to open DevTools. You'll want:

- **Console tab** - to see JavaScript errors
- **Network tab** - to see HTTP requests
- **Application tab** - to see stored data

---

## 📋 Manual Testing Checklist

### ✅ SECTION 1: Authentication

#### 1.1 Login Page

- [Done] Can see login form
- [Done] Email field accepts input
- [Done] Password field masks characters
- [Done] "Remember me" checkbox appears
- [Done] "Forgot password?" link appears
- [Done] "Login" button is clickable

#### 1.2 Login Functionality

- [Done] **Test 1:** Login with correct credentials
    - Email: `student@example.com`
    - Password: `password`
    - **Expected:** Redirected to student dashboard
- [DOne] **Test 2:** Login with wrong password
    - Email: `student@example.com`
    - Password: `wrongpassword`
    - **Expected:** See error message "Invalid credentials"
- [Done] **Test 3:** Login with non-existent email
    - Email: `nonexistent@example.com`
    - Password: `password`
    - **Expected:** See error message
- [Done] **Test 4:** Login with empty fields
    - Leave email and password blank
    - Click "Login"
    - **Expected:** See validation error messages

#### 1.3 Session & Logout

- [Done] After login, session is created
- [Done] "Logout" button visible in navigation [needs improvement]
- [Done] Clicking "Logout" signs out user [it needs to have a confimation before logging out]
- [Done] After logout, redirected to home page [redirected to the login page]
- [Done] Cannot access dashboard after logout

**How to Test:**

1. Login as student
2. Visit `/dashboard` - should work ✅
3. Logout
4. Try visiting `/dashboard` - should redirect to login ✅

---

### ✅ SECTION 2: Student Portal

#### 2.1 Student Dashboard

**Test Scenario: Login as student**

- [ ] Dashboard page loads without errors
- [ ] Student name is displayed in greeting
- [ ] "Enrolled Subjects" section visible
- [ ] Subject cards show:
    - [ ] Subject name
    - [ ] Teacher name
    - [ ] Current grade
    - [ ] Attendance percentage
    - [ ] Status (at-risk or normal)

- [ ] Notifications section shows:
    - [ ] Unread count
    - [ ] Notification list
    - [ ] "Mark as read" button works
    - [ ] "Mark all as read" button works

- [ ] Quick links work:
    - [ ] "View Interventions" button
    - [ ] "Check Attendance" button
    - [ ] "View Analytics" button
    - [ ] "Subject at Risk" button

**Test Steps:**

```
1. Login as: student@example.com / password
2. Verify all sections load
3. Check each button and link works
4. Monitor console (F12) for errors
```

#### 2.2 Interventions Feed

- [ ] Page loads correctly
- [ ] Shows list of assigned interventions
- [ ] Each intervention displays:
    - [ ] Intervention title
    - [ ] Task count
    - [ ] Due date
    - [ ] Status (pending, in-progress, completed)

- [ ] For each intervention:
    - [ ] Can click "View Details"
    - [ ] Can mark tasks as complete
    - [ ] Can request completion
    - [ ] Can see feedback

**Test Steps:**

```
1. Go to /interventions-feed
2. Click on an intervention
3. Check if tasks display
4. Try marking a task complete
5. Try requesting intervention completion
```

#### 2.3 Analytics Page

- [ ] Analytics page loads
- [ ] Shows enrollment details
- [ ] Displays grades section:
    - [ ] Current grade shows
    - [ ] Grade breakdown by component (tests, assignments, etc.)
    - [ ] Grade trend chart shows (if available)

- [ ] Shows attendance section:
    - [ ] Attendance percentage
    - [ ] Days present/absent
    - [ ] Attendance trend

- [ ] Can export to PDF:
    - [ ] Click "Export PDF" button
    - [ ] PDF downloads correctly
    - [ ] PDF contains all data

**Test Steps:**

```
1. Go to /analytics
2. Click on an enrollment
3. Verify all data displays
4. Click "Export PDF"
5. Check PDF in Downloads folder
```

#### 2.4 Subject at Risk

- [ ] Page loads
- [ ] Shows only "at-risk" subjects
- [ ] For each subject displays:
    - [ ] Subject name
    - [ ] Risk level (high/medium)
    - [ ] Reason for risk
    - [ ] Current grade
    - [ ] Link to interventions

**Test Steps:**

```
1. Go to /subject-at-risk
2. Verify only at-risk subjects shown
3. Click on subject to see details
4. Click "View Interventions" link
```

---

### ✅ SECTION 3: Teacher Portal

#### 3.1 Teacher Dashboard

**Test Scenario: Login as teacher**

- [ ] Dashboard loads without errors
- [ ] Teacher name in greeting
- [ ] "My Classes" section shows:
    - [ ] List of taught subjects
    - [ ] Student count per subject
    - [ ] Class status

- [ ] Statistics show:
    - [ ] Total students taught
    - [ ] Total interventions created
    - [ ] Pending approvals count

- [ ] Quick actions available:
    - [ ] "Add Class" button
    - [ ] "Take Attendance" button
    - [ ] "Create Intervention" button

**Test Steps:**

```
1. Login as: teacher@example.com / password
2. Check all elements load
3. Verify statistics are accurate
4. Try clicking each quick action
```

#### 3.2 Class Management

- [ ] Can view "My Classes" page
- [ ] "Add Class" button opens form
- [ ] Class form has fields:
    - [ ] Subject selection
    - [ ] Section/Class name
    - [ ] Schedule (if applicable)

- [ ] After adding class:
    - [ ] Redirected back to classes list
    - [ ] New class appears in list
    - [ ] Can click on class to view details

- [ ] Class details page shows:
    - [ ] Class information
    - [ ] Student list
    - [ ] "Add Student" button
    - [ ] "Upload Class List" button (for bulk)
    - [ ] "Start Quarter" button

- [ ] Can add students:
    - [ ] Click "Add Student"
    - [ ] Search for student
    - [ ] Click to add
    - [ ] Student appears in list

- [ ] Can upload class list:
    - [ ] Click "Upload Class List"
    - [ ] Select CSV/Excel file
    - [ ] File uploads and students added
    - [ ] Success message appears

**Test Steps:**

```
1. Go to /teacher/classes
2. Click "Add Class"
3. Fill form and submit
4. Click on new class
5. Try adding students (manual)
6. Try uploading class list (if file available)
```

#### 3.3 Attendance Management

- [ ] Can access attendance page
- [ ] Select class/subject
- [ ] Calendar/date picker appears
- [ ] Can mark students present/absent:
    - [ ] Student list shows
    - [ ] Checkbox for each student
    - [ ] Can mark all present/absent

- [ ] Can save attendance:
    - [ ] "Save Attendance" button works
    - [ ] Success message appears
    - [ ] Records saved to database

- [ ] Can view attendance log:
    - [ ] Go to "Attendance Log"
    - [ ] Shows attendance history
    - [ ] Can filter by date
    - [ ] Can export as CSV/PDF

**Test Steps:**

```
1. Go to /teacher/attendance
2. Select a subject
3. Choose a date
4. Mark some students present/absent
5. Click "Save"
6. Go to "Attendance Log"
7. Verify records saved
8. Try export
```

#### 3.4 Grades Management

- [ ] Can access grades page
- [ ] Select subject/class
- [ ] Grade entry form appears:
    - [ ] Student list
    - [ ] Grade input field
    - [ ] Save button

- [ ] Can input grades:
    - [ ] Type grade for each student
    - [ ] Click "Save"
    - [ ] Grades saved to database

- [ ] Can bulk upload grades:
    - [ ] Click "Upload Grades"
    - [ ] Select CSV file
    - [ ] File uploads
    - [ ] Grades appear in system

- [ ] Can view grade summary:
    - [ ] Average grade shows
    - [ ] Distribution chart (if available)
    - [ ] Students sorted by grade

**Test Steps:**

```
1. Go to /teacher/classes/{class}
2. Click "Grades"
3. Enter grades manually
4. Click "Save"
5. Try bulk upload option
6. View grade summary
```

#### 3.5 Interventions Creation

- [ ] Can access interventions page
- [ ] Shows list of created interventions
- [ ] "Create Intervention" button works
- [ ] Intervention form has:
    - [ ] Student selection
    - [ ] Subject selection
    - [ ] Intervention type (Tier 1, 2, 3)
    - [ ] Description
    - [ ] Due date
    - [ ] Task list

- [ ] Can add tasks:
    - [ ] Click "Add Task"
    - [ ] Enter task description
    - [ ] Set task due date

- [ ] Can submit intervention:
    - [ ] Click "Create"
    - [ ] Intervention added to list
    - [ ] Student sees in their interventions
    - [ ] Notification sent to student

- [ ] Can manage interventions:
    - [ ] Can view student progress
    - [ ] Can approve completion (for Tier 3)
    - [ ] Can reject completion
    - [ ] Can edit intervention

**Test Steps:**

```
1. Go to /teacher/interventions
2. Click "Create Intervention"
3. Fill form completely
4. Add 2-3 tasks
5. Submit
6. Verify in interventions list
7. Logout and login as student
8. Check if intervention appears
```

#### 3.6 Pending Approval

- [ ] If teacher not approved, see pending page:
    - [ ] Clear "pending approval" message
    - [ ] Waiting for admin approval message
    - [ ] Cannot access other teacher features

**Test Steps:**

```
1. Create new teacher account
2. Try accessing /teacher/dashboard
3. Should see pending approval page
4. Login as admin
5. Approve teacher
6. Login as teacher again
7. Can now access dashboard
```

---

### ✅ SECTION 4: Admin Portal

#### 4.1 Admin Dashboard

**Test Scenario: Login as admin**

- [ ] Dashboard loads
- [ ] Shows statistics:
    - [ ] Total users
    - [ ] Total students
    - [ ] Total teachers
    - [ ] Pending approvals

- [ ] Quick actions:
    - [ ] "Create User" button
    - [ ] "Pending Approvals" button
    - [ ] "Manage Users" button

**Test Steps:**

```
1. Login as: admin@example.com / password
2. Verify all stats display
3. Check format looks good
```

#### 4.2 User Management

- [ ] Can view all users
- [ ] User list shows:
    - [ ] Name
    - [ ] Email
    - [ ] Role
    - [ ] Status
    - [ ] Action buttons (edit, delete)

- [ ] Can create user:
    - [ ] Click "Create User"
    - [ ] Form appears with fields:
        - [ ] Name
        - [ ] Email
        - [ ] Role (student/teacher)
        - [ ] Password
    - [ ] Submit form
    - [ ] User created and appears in list
    - [ ] User receives email with credentials

- [ ] Can edit user:
    - [ ] Click "Edit" on user
    - [ ] Can modify name, email, role
    - [ ] Click "Save"
    - [ ] Changes saved

- [ ] Can delete user:
    - [ ] Click "Delete"
    - [ ] Confirmation dialog appears
    - [ ] Confirm deletion
    - [ ] User removed from list

- [ ] Can reset user password:
    - [ ] Click "Reset Password" on user
    - [ ] Temporary password generated
    - [ ] Email sent to user

**Test Steps:**

```
1. Go to /admin/users
2. Click "Create User"
3. Fill form (new student)
4. Submit
5. Check email received (check spam)
6. Try editing created user
7. Try deleting a test user
8. Try password reset
```

#### 4.3 Teacher Registration Approvals

- [ ] Can view pending registrations
- [ ] Shows:
    - [ ] Teacher name
    - [ ] Email
    - [ ] Application date
    - [ ] "View Documents" button
    - [ ] "Approve" button
    - [ ] "Reject" button

- [ ] Can view documents:
    - [ ] Click "View Documents"
    - [ ] Documents display/download

- [ ] Can approve:
    - [ ] Click "Approve"
    - [ ] Approval confirmation
    - [ ] Teacher can now login
    - [ ] Teacher receives approval email

- [ ] Can reject:
    - [ ] Click "Reject"
    - [ ] Rejection form appears
    - [ ] Can add rejection reason
    - [ ] Teacher receives rejection email

**Test Steps:**

```
1. Go to /admin/teacher-registrations
2. If no pending: create new teacher account first
3. Try approving a registration
4. Verify teacher can login after
5. Try rejecting another
6. Check rejection email
```

#### 4.4 Password Reset Requests

- [ ] Can view pending password reset requests
- [ ] Shows:
    - [ ] User name
    - [ ] Request date
    - [ ] "Approve" button
    - [ ] "Reject" button

- [ ] Can approve:
    - [ ] Click "Approve"
    - [ ] Temporary password sent
    - [ ] User can login with temp password

- [ ] Can reject:
    - [ ] Click "Reject"
    - [ ] User notified
    - [ ] Request removed

**Test Steps:**

```
1. Go to /admin/password-reset-requests
2. Try approving request (if any pending)
3. Check email received
4. Try rejecting another
```

---

### ✅ SECTION 5: Super Admin Portal

#### 5.1 Super Admin Dashboard

**Test Scenario: Login as super admin**

- [ ] Dashboard loads
- [ ] Shows system statistics:
    - [ ] Total departments
    - [ ] Total admins
    - [ ] Total users
    - [ ] Total subjects

**Test Steps:**

```
1. Login as: superadmin@example.com / password
2. Verify dashboard loads
```

#### 5.2 Department Management

- [ ] Can view all departments
- [ ] Department list shows:
    - [ ] Department name
    - [ ] Code
    - [ ] Status (active/inactive)
    - [ ] Action buttons

- [ ] Can create department:
    - [ ] Click "Create Department"
    - [ ] Form with fields:
        - [ ] Name
        - [ ] Code
        - [ ] Description
    - [ ] Submit
    - [ ] Department created

- [ ] Can edit department:
    - [ ] Click "Edit"
    - [ ] Modify details
    - [ ] Save

- [ ] Can delete department:
    - [ ] Click "Delete"
    - [ ] Confirmation
    - [ ] Deleted

- [ ] Can toggle status:
    - [ ] Click "Active/Inactive" toggle
    - [ ] Status changes
    - [ ] Saves correctly

**Test Steps:**

```
1. Go to /superadmin/departments
2. Click "Create"
3. Add new department
4. Try editing it
5. Try toggling status
```

#### 5.3 Admin Management

- [ ] Can view all admins
- [ ] Can create admin:
    - [ ] Name, email, password
    - [ ] Admin created
    - [ ] Credentials sent to email

- [ ] Can edit admin:
    - [ ] Change details
    - [ ] Save

- [ ] Can delete admin:
    - [ ] Delete with confirmation

- [ ] Can reset admin password:
    - [ ] Sends temporary password

- [ ] Can resend credentials:
    - [ ] Email resent to admin

**Test Steps:**

```
1. Go to /superadmin/admins
2. Create new admin
3. Check email
4. Edit admin
5. Reset password
6. Verify email received
```

#### 5.4 Curriculum Management

- [ ] Can view all subjects
- [ ] Can create master subject:
    - [ ] Subject name
    - [ ] Code
    - [ ] Description
    - [ ] Prerequisites (if any)

- [ ] Can set prerequisites:
    - [ ] Select prerequisite subjects
    - [ ] Save

- [ ] Can toggle status:
    - [ ] Active/inactive toggle

- [ ] Can delete subject:
    - [ ] With confirmation

**Test Steps:**

```
1. Go to /superadmin/curriculum
2. Create new subject
3. Try setting prerequisites
4. Toggle status
```

#### 5.5 System Settings

- [ ] Can access settings page
- [ ] Settings sections:
    - [ ] Academic Settings
    - [ ] Enrollment Settings
    - [ ] Grading Settings
    - [ ] School Info

- [ ] Academic Settings:
    - [ ] Set academic year/semester
    - [ ] Set quarter dates
    - [ ] Save changes

- [ ] Enrollment Settings:
    - [ ] Configure enrollment rules
    - [ ] Save changes

- [ ] Grading Settings:
    - [ ] Set grade components (tests, assignments, etc.)
    - [ ] Set weights/percentages
    - [ ] Verify total = 100%
    - [ ] Save changes

- [ ] School Info:
    - [ ] School name
    - [ ] School address
    - [ ] Contact info
    - [ ] Logo upload
    - [ ] Save changes

**Test Steps:**

```
1. Go to /superadmin/settings
2. Update academic settings
3. Verify settings saved
4. Update grading settings
5. Check percentage validation
```

---

### ✅ SECTION 6: Cross-Portal Features

#### 6.1 Profile Management

- [ ] Can access profile (any user)
- [ ] View current information
- [ ] Can edit profile:
    - [ ] Name
    - [ ] Email
    - [ ] Password (with current password verification)
- [ ] Changes saved correctly
- [ ] Logout after password change works

**Test Steps:**

```
1. Login as any user
2. Click profile
3. Edit name
4. Save
5. Change password
6. Logout
7. Login with new password
8. Should work ✅
```

#### 6.2 Notifications

- [ ] New notifications appear in real-time
- [ ] Can mark as read
- [ ] Can mark all as read
- [ ] Read/unread count updates
- [ ] Notification bell shows badge with count

**Test Steps:**

```
1. Login as student
2. Have another user create intervention for this student
3. Check if notification appears
4. Click to mark read
5. Badge count updates
```

#### 6.3 Email Notifications

- [ ] Welcome email sent on user creation
- [ ] Password reset email works
- [ ] Intervention notifications sent
- [ ] Approval/rejection emails sent
- [ ] Emails contain correct information
- [ ] Links in emails work

**Test Steps:**

```
1. Create new user
2. Check email (may go to spam)
3. Verify it has login credentials
4. Test password reset email
5. Check all links work
```

---

## 🐛 Bug Report Template

When you find a bug, document it:

```
### Bug Title
[Clear, concise title]

### Steps to Reproduce
1. Go to [page/section]
2. Click [button]
3. Enter [data]
4. Click [button]

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Browser & Environment
- Browser: Chrome/Firefox/Safari
- Device: Windows/Mac/Linux
- Screen Resolution: 1920x1080

### Screenshot
[Include screenshot if possible]

### Error Message
[Copy from console if available]
```

---

## ✅ Testing Checklist Template

```
## Test Date: ___________
## Tester: ___________

### Authentication
- [ ] Login works
- [ ] Logout works
- [ ] Wrong password rejected
- [ ] Role-based redirect works

### Student Portal
- [ ] Dashboard loads
- [ ] Interventions show
- [ ] Analytics work
- [ ] Attendance visible

### Teacher Portal
- [ ] Dashboard loads
- [ ] Classes managed
- [ ] Attendance taken
- [ ] Grades entered
- [ ] Interventions created

### Admin Portal
- [ ] Dashboard loads
- [ ] Users managed
- [ ] Registrations approved

### Super Admin Portal
- [ ] Dashboard loads
- [ ] Departments managed
- [ ] Settings configured

### Issues Found
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

### Status: [ ] Pass [ ] Fail
```

---

## 🎯 Testing Tips

### ✅ DO's

1. **Test in multiple browsers** (Chrome, Firefox, Safari, Edge)
2. **Test on multiple devices** (Desktop, Tablet, Mobile)
3. **Use realistic data** (real names, email formats, etc.)
4. **Check console for errors** (F12)
5. **Test edge cases** (very long names, special characters)
6. **Test in different orders** (don't always follow same path)
7. **Test with different roles** (student, teacher, admin)
8. **Test error scenarios** (wrong password, non-existent email)

### ❌ DON'Ts

1. Don't skip validation tests
2. Don't assume a feature works if similar feature works
3. Don't forget to check responsive design (mobile view)
4. Don't skip email/notification testing
5. Don't test only happy paths (things that work)

---

## 📱 Responsive Design Testing

### Desktop (1920x1080)

```
1. All content visible
2. Layout looks good
3. Buttons easily clickable
4. Forms properly aligned
```

### Tablet (768x1024)

```
1. Content adapted
2. Touch-friendly buttons
3. Navigation accessible
4. No horizontal scrolling
```

### Mobile (375x667)

```
1. Single column layout
2. Large touch targets
3. Mobile menu works
4. No overflow
```

**Test All Sizes:**

```
Open DevTools (F12)
Click Device Toolbar icon
Test at each breakpoint
```

---

## 🚀 Automation (Optional)

After manual testing, consider automating with:

- **Selenium** - browser automation
- **Cypress** - end-to-end testing
- **Playwright** - multi-browser testing

But start with manual testing first!

---

## 📊 Testing Report

Track your testing progress:

| Feature    | Tested | Passed | Failed      | Notes                |
| ---------- | ------ | ------ | ----------- | -------------------- |
| Login      | ✅     | ✅     |             | All scenarios passed |
| Dashboard  | ✅     | ⚠️     | Mobile view | Fix mobile layout    |
| Attendance | ✅     | ✅     |             | Works smoothly       |
| Grades     | ⏳     | -      | -           | In progress          |

---

## 🎓 Next Steps

1. ✅ Test all features manually
2. ✅ Document bugs found
3. ✅ Fix bugs
4. ✅ Re-test fixed features
5. ✅ Write automated tests
6. ✅ Deploy to production

---

**Happy Testing! 🧪**

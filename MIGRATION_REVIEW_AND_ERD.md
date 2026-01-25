# Migration Review & Entity Relationship Diagram (ERD)

**Date:** January 23, 2026  
**System:** SATIS - Smart Academic Tracking and Intervention System  
**Database:** Laravel 12 with SQL Migrations

---

## 🔍 Migration Quality Assessment

### ✅ Strengths

1. **Clear Foreign Key Relationships**
    - All foreign keys are properly defined with `.constrained()` and cascade rules
    - Relationships are consistent: `onDelete('cascade')` for child records, `nullOnDelete()` for optional references
    - Example: `enrollments` → `users` and `enrollments` → `subjects` both cascade on delete

2. **Good Use of Enums**
    - `attendance_records.status` → `['present', 'absent', 'late', 'excused']`
    - `interventions.type` → multiple intervention tiers (academic_quiz, automated_nudge, task_list, etc.)
    - `password_reset_requests.status` → `['pending', 'approved', 'rejected']`
    - `user.status` → `['active', 'pending_approval']`
    - Prevents invalid data at DB level

3. **Nullable Fields for Optional Data**
    - `middle_name`, `lrn`, `avatar`, `description` are properly nullable
    - Optional references use `->nullable()` and `nullOnDelete()` (e.g., `approval_notes`)
    - Good for flexibility without requiring defaults

4. **Unique Constraints**
    - `users.email` → unique (no duplicate logins)
    - `departments.code`, `master_subjects.code` → unique (no duplicate department/subject codes)
    - `teacher_registrations.email` → unique
    - Composite unique: `grades` → `['enrollment_id', 'assignment_key', 'quarter']` (prevents duplicate grades)
    - Composite unique: `master_subject_prerequisites` → `['master_subject_id', 'prerequisite_id']` (prevents duplicate prerequisites)

5. **Audit Trail / Timestamps**
    - All tables include `created_at` and `updated_at` columns for logging
    - Helpful for tracking when records were created/modified

6. **Good Denormalization for Performance**
    - `enrollments.current_grade` and `current_attendance_rate` cache computed values (can be refreshed async)
    - `subjects.grade_categories` stores JSON structure for flexible grading categories
    - `users.temp_password` and `must_change_password` support first-login flow
    - Reduces need to recalculate on every dashboard load

7. **Workflow Support**
    - `interventions` has complete workflow tracking: `completion_requested_at`, `approved_at`, `approved_by`, `rejected_at`, `rejection_reason`
    - `password_reset_requests` tracks the approval flow with `status`, `processed_by`, `processed_at`
    - `teacher_registrations` has approval flow with `reviewed_by`, `reviewed_at`, `status`, `rejection_reason`

8. **Proper Data Types**
    - `Float` for grades and attendance rates (appropriate for percentages and scores)
    - `Integer` for quarter, units, minimum_grade
    - `Decimal(3, 1)` for units (e.g., 1.5 units) — good precision
    - `Enum` for status fields instead of string
    - `Timestamp` for dates with precise time tracking

---

### ⚠️ Observations & Suggestions for Improvement

1. **Missing Indexes on Foreign Keys**
    - While Laravel handles basic FK indexes, explicit indexes on frequently queried columns would help:
        ```php
        // Add to relevant migrations:
        $table->index('enrollment_id');  // For grades, attendance_records
        $table->index('subject_id');     // For enrollments
        $table->index('user_id');        // For enrollments, notifications
        $table->index('intervention_id'); // For intervention_tasks
        ```
    - Impact: Faster queries for dashboard aggregations

2. **No Index on Quarter**
    - `grades.quarter` is used in queries but not indexed
    - Suggestion: Add `$table->index(['enrollment_id', 'quarter'])` for quarterly reports

3. **Composite Unique Constraint Syntax**
    - `master_subject_prerequisites` has a duplicate `master_subject_id` FK definition (lines show it twice)
    - **Recommendation:** Review and clean up to single definition
    - Possible issue: The migration adds the FK twice which could fail on re-run or rollback

4. **No Soft Deletes**
    - Some records (users, departments, subjects) might benefit from soft deletes for audit/archive purposes
    - Currently hard-delete is immediate; consider adding:
        ```php
        $table->softDeletes(); // Adds deleted_at column
        ```
    - Allows recovering "deleted" records without full DB restoration

5. **Attendance Records Missing Important Fields**
    - Current: `date`, `status`, timestamps only
    - Suggestion: Add optional fields for completeness:
        ```php
        $table->text('notes')->nullable(); // Reason for absence/late
        $table->timestamp('marked_at')->nullable(); // When attendance was recorded
        $table->foreignId('marked_by')->nullable()->constrained('users')->nullOnDelete(); // Who marked it
        ```

6. **Students Table Schema Concerns**
    - **Redundancy:** `students.subject` and `students.grade` are duplicated in `enrollments`
    - `students.lrn` (Learning Reference Number) should be unique if it's meant to be an identifier
    - Suggestion: Either:
        - Remove subject/grade from students (use enrollments instead), or
        - Make students a simpler table with just profile info
    - Current structure creates data consistency risk

7. **Interventions Type Migration Issue**
    - The `2025_12_09_043149_add_tier3_types_to_interventions_table.php` migration:
        - Uses PostgreSQL-specific SQL (`ALTER TABLE ... CHECK`)
        - Will **fail on MySQL/SQLite**
        - Should be DB-agnostic or have conditionals:
            ```php
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("ALTER TABLE ...");
            }
            ```

8. **No Timestamps for Grade Approval/Submission**
    - `grades.score` is recorded but no tracking of when/by whom
    - Suggestion: Add:
        ```php
        $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete(); // Teacher
        $table->timestamp('submitted_at')->nullable(); // When submitted
        ```

9. **Master Subject Prerequisites - Minimum Grade Logic**
    - `minimum_grade` defaults to 75, but this might be configurable
    - Suggestion: Make it reference `system_settings` for institutional policy, or at least document the assumption

10. **Missing Composite Indexes for Performance**
    - Common queries likely use `(enrollment_id, quarter)` or `(subject_id, user_id)`
    - Suggestion: Add:
        ```php
        $table->index(['enrollment_id', 'quarter']);
        $table->index(['subject_id', 'user_id']);
        ```

11. **No Default Values for Important Fields**
    - `enrollments.risk_status` defaults to 'low' — good
    - `interventions.status` defaults to 'active' — good
    - But `subjects.grade_categories` is nullable and populated by manual update in migration — fragile
    - Suggest pre-populating in factory/seeder or as a constraint

---

## 📊 Entity Relationship Diagram (ERD)

### Mermaid Diagram

```mermaid
erDiagram
    USERS ||--o{ DEPARTMENTS : "works_in"
    USERS ||--o{ STUDENTS : "has"
    USERS ||--o{ ENROLLMENTS : "enrolls_in"
    USERS ||--o{ SUBJECTS : "teaches"
    USERS ||--o{ INTERVENTIONS : "approves"
    USERS ||--o{ STUDENT_NOTIFICATIONS : "sends"
    USERS ||--o{ PASSWORD_RESET_REQUESTS : "processes"
    USERS ||--o{ TEACHER_REGISTRATIONS : "reviews"
    USERS ||--o{ SYSTEM_SETTINGS : "updates"

    SUBJECTS ||--o{ ENROLLMENTS : "has"
    SUBJECTS ||--o{ MASTER_SUBJECTS : "references"

    ENROLLMENTS ||--o{ GRADES : "has"
    ENROLLMENTS ||--o{ ATTENDANCE_RECORDS : "has"
    ENROLLMENTS ||--o{ INTERVENTIONS : "receives"

    INTERVENTIONS ||--o{ INTERVENTION_TASKS : "contains"
    INTERVENTIONS ||--o{ STUDENT_NOTIFICATIONS : "triggers"

    MASTER_SUBJECTS ||--o{ MASTER_SUBJECT_PREREQUISITES : "references"
    MASTER_SUBJECTS ||--o{ MASTER_SUBJECT_PREREQUISITES : "has_prerequisites"

    DEPARTMENTS : id PK
    DEPARTMENTS : name
    DEPARTMENTS : code UK
    DEPARTMENTS : is_active
    DEPARTMENTS : created_by FK

    USERS : id PK
    USERS : email UK
    USERS : role
    USERS : status
    USERS : department_id FK
    USERS : first_name
    USERS : password

    STUDENTS : id PK
    STUDENTS : user_id FK
    STUDENTS : first_name
    STUDENTS : last_name
    STUDENTS : lrn
    STUDENTS : grade_level
    STUDENTS : section

    SUBJECTS : id PK
    SUBJECTS : user_id FK "teacher"
    SUBJECTS : name
    SUBJECTS : grade_level
    SUBJECTS : school_year
    SUBJECTS : grade_categories JSON

    MASTER_SUBJECTS : id PK
    MASTER_SUBJECTS : code UK
    MASTER_SUBJECTS : name
    MASTER_SUBJECTS : grade_level
    MASTER_SUBJECTS : semester

    ENROLLMENTS : id PK
    ENROLLMENTS : user_id FK "student"
    ENROLLMENTS : subject_id FK
    ENROLLMENTS : risk_status
    ENROLLMENTS : current_grade
    ENROLLMENTS : current_attendance_rate

    GRADES : id PK
    GRADES : enrollment_id FK
    GRADES : assignment_key
    GRADES : score
    GRADES : total_score
    GRADES : quarter
    GRADES : "CU: (enrollment_id, assignment_key, quarter)"

    ATTENDANCE_RECORDS : id PK
    ATTENDANCE_RECORDS : enrollment_id FK
    ATTENDANCE_RECORDS : date
    ATTENDANCE_RECORDS : status "present|absent|late|excused"

    INTERVENTIONS : id PK
    INTERVENTIONS : enrollment_id FK
    INTERVENTIONS : type "academic_quiz|automated_nudge|..."
    INTERVENTIONS : status "active|completed|cancelled"
    INTERVENTIONS : approved_by FK
    INTERVENTIONS : approved_at

    INTERVENTION_TASKS : id PK
    INTERVENTION_TASKS : intervention_id FK
    INTERVENTION_TASKS : description
    INTERVENTION_TASKS : is_completed

    STUDENT_NOTIFICATIONS : id PK
    STUDENT_NOTIFICATIONS : user_id FK "student"
    STUDENT_NOTIFICATIONS : intervention_id FK
    STUDENT_NOTIFICATIONS : sender_id FK
    STUDENT_NOTIFICATIONS : type
    STUDENT_NOTIFICATIONS : is_read

    PASSWORD_RESET_REQUESTS : id PK
    PASSWORD_RESET_REQUESTS : user_id FK
    PASSWORD_RESET_REQUESTS : status "pending|approved|rejected"
    PASSWORD_RESET_REQUESTS : processed_by FK

    TEACHER_REGISTRATIONS : id PK
    TEACHER_REGISTRATIONS : email UK
    TEACHER_REGISTRATIONS : department_id FK
    TEACHER_REGISTRATIONS : status "pending|approved|rejected"
    TEACHER_REGISTRATIONS : reviewed_by FK

    MASTER_SUBJECT_PREREQUISITES : id PK
    MASTER_SUBJECT_PREREQUISITES : master_subject_id FK
    MASTER_SUBJECT_PREREQUISITES : prerequisite_id FK
    MASTER_SUBJECT_PREREQUISITES : minimum_grade
    MASTER_SUBJECT_PREREQUISITES : "CU: (master_subject_id, prerequisite_id)"

    SYSTEM_SETTINGS : id PK
    SYSTEM_SETTINGS : key UK
    SYSTEM_SETTINGS : value
    SYSTEM_SETTINGS : type
    SYSTEM_SETTINGS : group
```

### ASCII Relationship Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        CORE ENTITIES                             │
└─────────────────────────────────────────────────────────────────┘

                              ┌──────────┐
                              │ USERS    │
                              │ (id, PK) │
                              └──────────┘
                                   │
                    ┌──────────────┼──────────────┬─────────────┐
                    │              │              │             │
                    ▼              ▼              ▼             ▼
            ┌──────────────┐ ┌──────────────┐ ┌─────────┐ ┌──────────────┐
            │ DEPARTMENTS  │ │ STUDENTS     │ │SUBJECTS │ │ ENROLLMENTS  │
            │ (id, PK)     │ │ (id, PK)     │ │(id, PK) │ │ (id, PK)     │
            │ code (UK)    │ │ user_id (FK) │ │user_id  │ │ user_id (FK) │
            └──────────────┘ └──────────────┘ │(FK-tea.)│ │ subject_id(FK)
                                               │grade_   │ │ risk_status  │
                                               │categ.   │ │ curr_grade   │
                                               │(JSON)   │ │ curr_att_rate│
                                               └─────────┘ └──────────────┘
                                                   │            │
                                                   │            ├────────────────┐
                                                   │            ▼                 ▼
                                                   │        ┌──────────┐    ┌──────────────┐
                                                   │        │ GRADES   │    │ ATTENDANCE   │
                                                   │        │ (id, PK) │    │ RECORDS      │
                                                   │        │enroll(FK)│    │ (id, PK)     │
                                                   │        │assignment│    │ enroll (FK)  │
                                                   │        │score,    │    │ date, status │
                                                   │        │quarter   │    └──────────────┘
                                                   │        │CU: enr,  │
                                                   │        │assign,qtr│
                                                   │        └──────────┘
                                                   │            │
                                                   │            └────────────┐
                                                   │                         ▼
                                                   │                    ┌──────────────┐
                                                   │                    │INTERVENTIONS │
                                                   │                    │ (id, PK)     │
                                                   │                    │ enroll (FK)  │
                                                   │                    │ type (Enum)  │
                                                   │                    │ status       │
                                                   │                    │ approved_by  │
                                                   │                    └──────────────┘
                                                   │                         │
                                                   │                         ▼
                                                   │                 ┌──────────────────┐
                                                   │                 │INTERVENTION_TASKS│
                                                   │                 │ (id, PK)         │
                                                   │                 │ interv_id (FK)   │
                                                   │                 │ description      │
                                                   │                 │ is_completed     │
                                                   │                 └──────────────────┘
                                                   │
                                                   ▼
                                            ┌────────────────────┐
                                            │ STUDENT_            │
                                            │ NOTIFICATIONS       │
                                            │ (id, PK)            │
                                            │ user_id (FK)        │
                                            │ intervention_id(FK) │
                                            │ sender_id (FK)      │
                                            │ type, is_read       │
                                            └────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CURRICULUM ENTITIES                           │
└─────────────────────────────────────────────────────────────────┘

                        ┌──────────────────┐
                        │ MASTER_SUBJECTS  │
                        │ (id, PK)         │
                        │ code (UK)        │
                        │ name, grade_lev  │
                        │ semester, units  │
                        └──────────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │MASTER_SUBJECT_           │
                    │PREREQUISITES             │
                    │ (id, PK)                 │
                    │ master_subject_id (FK)   │
                    │ prerequisite_id (FK)     │
                    │ minimum_grade            │
                    │ CU: (subject, prereq)    │
                    └──────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   ADMIN/WORKFLOW ENTITIES                        │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────┐      ┌──────────────────────┐
    │PASSWORD_RESET_REQUESTS  │      │TEACHER_REGISTRATIONS │
    │(id, PK)                 │      │(id, PK)              │
    │user_id (FK)             │      │email (UK)            │
    │status (Enum)            │      │department_id (FK)    │
    │processed_by (FK)        │      │status (Enum)         │
    │processed_at             │      │reviewed_by (FK)      │
    │Idx: (user_id, status)   │      │Idx: email, status    │
    └─────────────────────────┘      └──────────────────────┘

    ┌──────────────────────────┐
    │ SYSTEM_SETTINGS          │
    │ (id, PK)                 │
    │ key (UK)                 │
    │ value                    │
    │ type (string|bool|json)  │
    │ group                    │
    │ updated_by (FK)          │
    └──────────────────────────┘
```

---

## 📋 Table Summary

| Table                          | Purpose                             | Key Relationships                                                    | Status                              |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------------------- | ----------------------------------- |
| `users`                        | Core authentication & authorization | Parent to: students, enrollments, subjects, notifications            | ✅ Good                             |
| `departments`                  | Organizational structure            | Parent to: master_subjects, admin assignments                        | ✅ Good                             |
| `students`                     | Student profile info                | 1:1 with users; has enrollments via user                             | ⚠️ Redundant (see below)            |
| `subjects`                     | Teacher's class sections            | Taught by users; parent to enrollments                               | ✅ Good                             |
| `master_subjects`              | Curriculum master records           | Parent to: prerequisites; referenced by subjects                     | ✅ Good                             |
| `enrollments`                  | Student ↔ Subject mapping           | Links users to subjects; parent to grades, attendance, interventions | ✅ Core                             |
| `grades`                       | Individual assignment scores        | Per enrollment per quarter; unique constraint                        | ✅ Good                             |
| `attendance_records`           | Daily attendance tracking           | Per enrollment; status enum                                          | ⚠️ Missing fields (see improvement) |
| `interventions`                | Academic intervention workflows     | Per enrollment; multi-tier types; approval workflow                  | ✅ Good                             |
| `intervention_tasks`           | Tasks within interventions          | Sub-tasks with completion tracking                                   | ✅ Good                             |
| `student_notifications`        | Push notifications to students      | Triggered by interventions; read tracking                            | ✅ Good                             |
| `password_reset_requests`      | Password reset workflow             | Approval-based workflow                                              | ✅ Good                             |
| `teacher_registrations`        | New teacher applications            | Registration approval workflow                                       | ✅ Good                             |
| `system_settings`              | Configuration & settings            | Key-value store for policies                                         | ✅ Good                             |
| `master_subject_prerequisites` | Curriculum prerequisites            | Links subjects with min grade required                               | ✅ Good                             |

---

## 🎯 Key Design Patterns Observed

### 1. **Workflow Pattern** (Tier 2 / Tier 3 Feature)

Multiple tables implement approval workflows:

- `interventions`: completion request → teacher approval → feedback
- `password_reset_requests`: student request → admin approval
- `teacher_registrations`: registration → admin review → creation of user

**Quality:** Excellent — consistent implementation across tables

### 2. **Caching Pattern** (Denormalization)

- `enrollments.current_grade` and `current_attendance_rate` cache computed values
- Should be refreshed async (e.g., nightly job) to avoid stale data

**Suggestion:** Add a `last_computed_at` timestamp to track freshness

### 3. **Flexible Configuration Pattern**

- `subjects.grade_categories` stored as JSON (written_works, performance_task, quarterly_exam)
- `system_settings` as key-value store

**Quality:** Good for flexibility; allow configuration per-subject or globally

### 4. **Audit Trail Pattern**

- All tables have `created_at`, `updated_at`, and foreign key to `created_by` / `updated_by`
- Tracks data provenance and change history

**Quality:** ✅ Well-implemented

---

## 🚨 Critical Issues Found

### Issue 1: Duplicate Foreign Key in `master_subject_prerequisites`

**File:** `2025_12_07_110022_create_master_subject_prerequisites_table.php`
**Problem:** `master_subject_id` is defined twice (lines 10 and 15)

```php
$table->foreignId('master_subject_id')->constrained()->onDelete('cascade');
// ... later ...
$table->foreignId('master_subject_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
```

**Fix:** Remove the duplicate line; keep only the first definition

```php
$table->foreignId('master_subject_id')->constrained()->onDelete('cascade');
$table->foreignId('prerequisite_id')->constrained('master_subjects')->onDelete('cascade');
```

---

### Issue 2: PostgreSQL-Specific Migration

**File:** `2025_12_09_043149_add_tier3_types_to_interventions_table.php`
**Problem:** Uses raw PostgreSQL SQL; will fail on MySQL, SQLite

```php
DB::statement("ALTER TABLE interventions DROP CONSTRAINT IF EXISTS interventions_type_check");
```

**Fix:** Add database driver check:

```php
if (DB::getDriverName() === 'pgsql') {
    DB::statement("ALTER TABLE interventions DROP CONSTRAINT IF EXISTS interventions_type_check");
    DB::statement("ALTER TABLE interventions ADD CONSTRAINT interventions_type_check CHECK (...)");
}
```

---

### Issue 3: Students Table Redundancy

**Problem:** `students.subject` and `students.grade` duplicate data in `enrollments`
**Risk:** Data inconsistency; hard to maintain multiple copies
**Fix:** Either:

1. Remove subject/grade from students, or
2. Use students only as profile; keep enrollments as the source of truth

---

## ✨ Recommendations (Prioritized)

### 🔴 High Priority (Do Soon)

1. **Fix duplicate FK in `master_subject_prerequisites`** — prevent migration failures
2. **Fix PostgreSQL-specific migration** — ensure DB compatibility
3. **Add indexes** on foreign keys and common query columns:
    ```php
    // In relevant migrations' up() method:
    $table->index('enrollment_id');
    $table->index('subject_id');
    $table->index('user_id');
    $table->index(['enrollment_id', 'quarter']);
    ```

### 🟡 Medium Priority (Next Sprint)

4. **Resolve Students table redundancy** — decide on single source of truth
5. **Add composite indexes** for performance (enrollment_id + quarter, subject_id + user_id)
6. **Enhance attendance_records** with notes, marked_by, marked_at fields
7. **Add soft deletes** to users, departments, subjects for archival

### 🟢 Low Priority (Nice-to-Have)

8. **Cache freshness tracking** — add `last_computed_at` to enrollments
9. **Grade submission tracking** — add submitted_by, submitted_at to grades
10. **Prerequisite logic configuration** — reference system_settings for minimum_grade

---

## 🏆 Overall Migration Quality Score

**7.5 / 10** — **Good Overall, Few Issues**

- ✅ Clear relationships and constraints
- ✅ Good use of enums and unique constraints
- ✅ Proper cascade rules and nullable handling
- ✅ Comprehensive workflow support
- ⚠️ Missing some indexes for performance
- ❌ Two critical bugs (duplicate FK, DB-specific SQL)
- ⚠️ Some redundancy and gaps in data capture

**Action Items:** Fix the 2 critical issues before deploying to production.

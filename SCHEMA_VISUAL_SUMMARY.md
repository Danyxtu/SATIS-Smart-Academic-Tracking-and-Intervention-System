# 📊 SATIS Database Schema - Visual Summary

This document provides a quick visual reference for the complete SATIS database schema.

---

## 🗂️ Table Organization by Domain

### 1. 🔐 **Authentication & Authorization** (3 tables)

```
┌─────────────────────────────────────────────┐
│            USERS (Core)                     │
├─────────────────────────────────────────────┤
│ id (PK)                                     │
│ email (UNIQUE)                              │
│ role (admin, teacher, student, super_admin)│
│ status (active, pending_approval)           │
│ first_name, last_name, middle_name          │
│ password, temp_password                     │
│ must_change_password (boolean)              │
│ password_changed_at (timestamp)             │
│ department_id (FK) → DEPARTMENTS            │
│ created_by (FK) → USERS                     │
│ remember_token, created_at, updated_at      │
└─────────────────────────────────────────────┘

┌──────────────────────────────┐
│     DEPARTMENTS              │
├──────────────────────────────┤
│ id (PK)                      │
│ name                         │
│ code (UNIQUE)                │
│ description                  │
│ is_active (boolean)          │
│ created_by (FK) → USERS      │
│ created_at, updated_at       │
└──────────────────────────────┘

┌──────────────────────────────┐
│  PASSWORD_RESET_TOKENS       │
├──────────────────────────────┤
│ email (PK)                   │
│ token                        │
│ created_at                   │
└──────────────────────────────┘

┌──────────────────────────────┐
│      SESSIONS                │
├──────────────────────────────┤
│ id (PK)                      │
│ user_id (FK)                 │
│ ip_address, user_agent       │
│ payload (text)               │
│ last_activity (INT)          │
└──────────────────────────────┘
```

---

### 2. 👥 **Student Profile & Enrollment** (3 tables)

```
┌──────────────────────────────────────┐
│          STUDENTS                    │
├──────────────────────────────────────┤
│ id (PK)                              │
│ user_id (FK) → USERS [CASCADE]       │
│ first_name, last_name, middle_name   │
│ lrn (Learning Ref Number)            │
│ grade_level, section, strand, track  │
│ subject (⚠️ REDUNDANT)               │
│ grade (⚠️ REDUNDANT - use GRADES)    │
│ trend                                │
│ avatar (nullable)                    │
│ created_at, updated_at               │
└──────────────────────────────────────┘
         │
         │ 1:* (via user_id)
         ▼
┌──────────────────────────────────────┐
│       ENROLLMENTS (Core)             │
├──────────────────────────────────────┤
│ id (PK)                              │
│ user_id (FK) → USERS [CASCADE]       │
│ subject_id (FK) → SUBJECTS [CASCADE] │
│ risk_status (low, medium, high, etc.)│
│ current_grade (float, nullable)      │
│ current_attendance_rate (float, %)   │
│ created_at, updated_at               │
│                                      │
│ 🔑 Composite Index: (user_id,        │
│                      subject_id)     │
└──────────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼
    ┌─────────┐      ┌──────────────┐  ┌─────────────────┐  ┌────────────┐
    │ GRADES  │      │ ATTENDANCE   │  │ INTERVENTIONS   │  │NOTIFICATIONS
    ├─────────┤      │ RECORDS      │  │                 │  │
    │id (PK)  │      ├──────────────┤  ├─────────────────┤  │
    │enr (FK) │      │id (PK)       │  │id (PK)          │  │
    │assign   │      │enr (FK)      │  │enr (FK)         │  │
    │score    │      │date          │  │type (enum)      │  │
    │tot_score│      │status        │  │status           │  │
    │quarter  │      │notes (NEW)   │  │approved_by (FK) │  │
    │         │      │marked_by(NEW)│  │rejection_reason │  │
    │🔑 Unique│      │marked_at(NEW)│  │created_at       │  │
    │ (enr,   │      │created_at    │  │updated_at       │  │
    │ assign, │      └──────────────┘  └─────────────────┘  │
    │ quarter)│                               │              │
    └─────────┘                               ▼              │
                                        ┌──────────────────┐ │
                                        │  INTERVENTION    │ │
                                        │  TASKS           │ │
                                        ├──────────────────┤ │
                                        │id (PK)           │ │
                                        │intervention (FK) │ │
                                        │description       │ │
                                        │is_completed      │ │
                                        │created_at        │ │
                                        └──────────────────┘ │
                                                             │
                                                             ▼
```

---

### 3. 🏫 **Teacher & Subject Management** (2 tables)

```
┌──────────────────────────────────────┐
│          SUBJECTS                    │
├──────────────────────────────────────┤
│ id (PK)                              │
│ user_id (FK) → USERS [CASCADE]       │
│ name (e.g., "G12-STEM Physics")      │
│ grade_level, section, strand, track  │
│ room_number (nullable)               │
│ color (indigo, blue, etc.)           │
│ school_year                          │
│ semester (1, 2, full_year)           │
│ current_quarter (1-4)                │
│ grade_categories (JSON)              │
│  {                                   │
│    id: 'written_works',              │
│    label: 'Written Works',           │
│    weight: 0.30,                     │
│    tasks: []                         │
│  }                                   │
│ created_at, updated_at               │
│                                      │
│ 🔑 Index: user_id, school_year      │
└──────────────────────────────────────┘
```

---

### 4. 📚 **Curriculum & Prerequisites** (2 tables)

```
┌──────────────────────────────────┐
│     MASTER_SUBJECTS              │
├──────────────────────────────────┤
│ id (PK)                          │
│ code (UNIQUE)                    │
│ name                             │
│ description (nullable)           │
│ grade_level, strand, track       │
│ semester (1, 2, full_year)       │
│ units (decimal 3,1)              │
│ is_active (boolean)              │
│ created_by (FK) → USERS          │
│ created_at, updated_at           │
└──────────────────────────────────┘
         │
         │ 1:*
         ▼
┌───────────────────────────────────────┐
│MASTER_SUBJECT_PREREQUISITES           │
├───────────────────────────────────────┤
│id (PK)                                │
│master_subject_id (FK) [CASCADE]       │
│prerequisite_id (FK - to master_subj)  │
│minimum_grade (default: 75)            │
│created_at, updated_at                 │
│                                       │
│🔑 Composite Unique:                   │
│   (master_subject_id, prerequisite_id)│
│⚠️ BUG: Duplicate FK definition        │
└───────────────────────────────────────┘
```

---

### 5. 🔔 **Notifications & Communication** (1 table)

```
┌────────────────────────────────────────┐
│    STUDENT_NOTIFICATIONS               │
├────────────────────────────────────────┤
│ id (PK)                                │
│ user_id (FK) → USERS [CASCADE]         │
│ intervention_id (FK) → INTERVENTIONS   │
│ sender_id (FK) → USERS [SET NULL]      │
│ type (nudge, feedback, task, alert)    │
│ title                                  │
│ message (text)                         │
│ is_read (boolean, default: false)      │
│ read_at (timestamp, nullable)          │
│ created_at, updated_at                 │
│                                        │
│🔑 Index: (user_id, is_read)            │
└────────────────────────────────────────┘
```

---

### 6. ⚙️ **Admin Workflows** (3 tables)

```
┌────────────────────────────────────────┐
│   PASSWORD_RESET_REQUESTS              │
├────────────────────────────────────────┤
│ id (PK)                                │
│ user_id (FK) → USERS [CASCADE]         │
│ reason (text, nullable)                │
│ status (pending|approved|rejected)     │
│ admin_notes (text, nullable)           │
│ processed_by (FK) → USERS [SET NULL]   │
│ processed_at (timestamp, nullable)     │
│ created_at, updated_at                 │
│                                        │
│🔑 Indexes: (user_id, status), status   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│   TEACHER_REGISTRATIONS                │
├────────────────────────────────────────┤
│ id (PK)                                │
│ first_name, last_name                  │
│ email (UNIQUE)                         │
│ department_id (FK) [CASCADE]           │
│ password (hashed)                      │
│ document_path (nullable)               │
│ status (pending|approved|rejected)     │
│ rejection_reason (nullable)            │
│ reviewed_by (FK) → USERS [SET NULL]    │
│ reviewed_at (timestamp, nullable)      │
│ created_at, updated_at                 │
│                                        │
│🔑 Indexes: email, status               │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│    SYSTEM_SETTINGS                     │
├────────────────────────────────────────┤
│ id (PK)                                │
│ key (UNIQUE)                           │
│ value (text, nullable)                 │
│ type (string|integer|boolean|json)     │
│ group (academic|general|system)        │
│ description (text, nullable)           │
│ updated_by (FK) → USERS [SET NULL]     │
│ created_at, updated_at                 │
│                                        │
│ Examples:                              │
│  key='current_school_year'             │
│  key='current_semester'                │
│  key='grading_scale'                   │
└────────────────────────────────────────┘
```

---

## 📈 Data Volume Estimates

For a typical school (1000 students, 50 teachers, 200 subjects):

| Table              | Annual Rows | Growth Rate | Strategy             |
| ------------------ | ----------- | ----------- | -------------------- |
| users              | 1,050       | +100/year   | Archive inactive     |
| students           | 1,000       | +100/year   | Soft delete          |
| enrollments        | 200,000     | +20k/year   | Partition by year    |
| grades             | 2,000,000   | +400k/year  | Archive old quarters |
| attendance_records | 8,000,000   | +2M/year    | Partition by date    |
| interventions      | 50,000      | +10k/year   | Archive completed    |
| notifications      | 500,000     | +100k/year  | Delete after 1 year  |

---

## 🔑 Key Query Patterns & Indexes

### Common Queries:

```sql
-- Student Dashboard: Get all enrollments with current grade
SELECT e.*, s.name FROM enrollments e
JOIN subjects s ON e.subject_id = s.id
WHERE e.user_id = ?
-- ✅ Index: enrollments(user_id, subject_id)

-- Grade History: Get grades for an enrollment by quarter
SELECT * FROM grades
WHERE enrollment_id = ? AND quarter = ?
-- ✅ Index: grades(enrollment_id, quarter)

-- Attendance Report: Get attendance in date range
SELECT * FROM attendance_records
WHERE enrollment_id = ? AND date BETWEEN ? AND ?
-- ✅ Index: attendance_records(enrollment_id, date)

-- Intervention Tracking: Get active interventions
SELECT i.*, e.user_id FROM interventions i
JOIN enrollments e ON i.enrollment_id = e.id
WHERE i.status = 'active' AND e.subject_id = ?
-- ✅ Index: interventions(status, enrollment_id)

-- Notification Feed: Unread notifications for student
SELECT * FROM student_notifications
WHERE user_id = ? AND is_read = false
ORDER BY created_at DESC
-- ✅ Index: student_notifications(user_id, is_read)
```

---

## 🎯 Referential Integrity & Cascade Rules

```
ON DELETE CASCADE:
├─ users → students, enrollments, subjects, notifications, etc.
├─ departments → master_subjects, teacher_registrations, users
├─ subjects → enrollments, grades, attendance_records
└─ enrollments → grades, attendance_records, interventions

ON DELETE SET NULL (optional references):
├─ users.created_by → points to nullable user_id
├─ student_notifications.sender_id → teacher who sent it
├─ student_notifications.intervention_id → can be null
└─ password_reset_requests.processed_by → admin who reviewed
```

**Safety Check:** Deleting a user will cascade-delete all their enrollments, grades, and attendance records. Ensure you have backups!

---

## 📊 Relationship Cardinality

```
1:1 Relationships:
  User ←→ Student (one user per student)

1:N (One-to-Many):
  User → Enrollments (one user, many subjects)
  User → Subjects (one teacher, many classes)
  Subject → Enrollments (one subject, many students)
  Enrollment → Grades (one enrollment, many assignments)
  Enrollment → Attendance Records (one enrollment, many days)
  Enrollment → Interventions (one enrollment, many interventions)
  Intervention → Tasks (one intervention, many tasks)
  Department → Master Subjects (one dept, many subjects)

N:N (Many-to-Many via junction):
  Master Subject ←→ Master Subject (via prerequisites)
    (A subject can require multiple prerequisites)
    (A subject can be a prerequisite for multiple subjects)
```

---

## ⚡ Performance Considerations

**Hot Tables** (frequently queried):

- `enrollments` — queries on every dashboard load
- `grades` — computation for risk prediction
- `attendance_records` — large volume, frequent filters by date
- `student_notifications` — pushed frequently

**Optimization Strategies:**

1. ✅ Add composite indexes (enrollment_id, quarter) for grade queries
2. ✅ Add (user_id, is_read) for notification feeds
3. ✅ Cache `enrollments.current_grade` (pre-computed, refresh nightly)
4. ✅ Archive old attendance records (>1 year) to separate table
5. ✅ Use materialized views for dashboard aggregations

---

## 🔒 Security Notes

- `users.password` — hashed with bcrypt (Laravel default)
- `users.temp_password` — for first-login flow
- `teacher_registrations.password` — should be hashed before storing
- `users.email` — unique index prevents duplicate accounts
- Foreign keys prevent orphaned records

---

## 📝 Schema Versioning

**Current Version:** v1.0 (Jan 2026)

**Recent Changes:**

- Added `interventions.type` enum expansion
- Added `master_subject_prerequisites` table
- Added `password_reset_requests` workflow
- Added `teacher_registrations` workflow

**Planned Changes:**

- Soft deletes for audit trail
- Performance indexes
- Attendance record enhancements (notes, marked_by)

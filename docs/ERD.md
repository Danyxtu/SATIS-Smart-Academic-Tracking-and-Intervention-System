# 📊 Entity Relationship Diagram (ERD)

## SATIS — Smart Academic Tracking and Intervention System

---

## Mermaid ERD Diagram

```mermaid
erDiagram
    departments {
        bigint id PK
        varchar department_name
        varchar department_code UK
        text description
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    users {
        bigint id PK
        varchar first_name
        varchar last_name
        varchar middle_name
        varchar email UK
        varchar personal_email UK
        varchar role "admin | teacher | student | superadmin"
        enum status "active | pending_approval"
        bigint department_id FK
        bigint created_by FK
        timestamp email_verified_at
        varchar password
        varchar temp_password
        boolean must_change_password
        timestamp password_changed_at
        varchar remember_token
        timestamp created_at
        timestamp updated_at
    }

    students {
        bigint id PK
        varchar student_name
        varchar lrn UK
        varchar grade_level
        varchar section
        varchar strand
        varchar track
        varchar subject
        integer grade
        varchar trend
        varchar avatar
        bigint user_id FK
        timestamp created_at
        timestamp updated_at
    }

    subjects {
        bigint id PK
        varchar subject_name
        varchar subject_code UK
        timestamp created_at
        timestamp updated_at
    }

    subject_teachers {
        bigint id PK
        bigint subject_id FK
        bigint teacher_id FK
        varchar grade_level
        varchar section
        varchar color
        varchar strand
        varchar track
        varchar school_year
        tinyint current_quarter
        json grade_categories
        varchar semester
        timestamp created_at
        timestamp updated_at
    }

    enrollments {
        bigint id PK
        bigint user_id FK "The Student"
        bigint subject_teachers_id FK
        varchar risk_status "low | medium | high"
        float current_grade
        float current_attendance_rate
        timestamp created_at
        timestamp updated_at
    }

    grades {
        bigint id PK
        bigint enrollment_id FK
        varchar assignment_key
        varchar assignment_name
        float score
        float total_score
        integer quarter
        timestamp created_at
        timestamp updated_at
    }

    attendance_records {
        bigint id PK
        bigint enrollment_id FK
        date date
        enum status "present | absent | late | excused"
        timestamp created_at
        timestamp updated_at
    }

    interventions {
        bigint id PK
        bigint enrollment_id FK
        enum type "academic_quiz | automated_nudge | task_list | extension_grant | parent_contact | counselor_referral | academic_agreement | one_on_one_meeting"
        enum status "active | completed | cancelled"
        text notes
        timestamp completion_requested_at
        text completion_request_notes
        timestamp approved_at
        bigint approved_by FK
        text approval_notes
        timestamp rejected_at
        text rejection_reason
        timestamp created_at
        timestamp updated_at
    }

    intervention_tasks {
        bigint id PK
        bigint intervention_id FK
        varchar description
        boolean is_completed
        timestamp created_at
        timestamp updated_at
    }

    student_notifications {
        bigint id PK
        bigint user_id FK "Student receiving notification"
        bigint intervention_id FK
        bigint sender_id FK "Teacher who sent it"
        varchar type
        varchar title
        text message
        boolean is_read
        timestamp read_at
        timestamp created_at
        timestamp updated_at
    }

    password_reset_requests {
        bigint id PK
        bigint user_id FK
        text reason
        enum status "pending | approved | rejected"
        text admin_notes
        bigint processed_by FK
        timestamp processed_at
        timestamp created_at
        timestamp updated_at
    }

    system_settings {
        bigint id PK
        varchar key UK
        text value
        varchar type "string | integer | boolean | json"
        varchar group "academic | general | system"
        text description
        bigint updated_by FK
        timestamp created_at
        timestamp updated_at
    }

    teacher_registrations {
        bigint id PK
        varchar first_name
        varchar last_name
        varchar email UK
        bigint department_id FK
        varchar password
        varchar document_path
        enum status "pending | approved | rejected"
        text rejection_reason
        bigint reviewed_by FK
        timestamp reviewed_at
        timestamp created_at
        timestamp updated_at
    }

    %% ── Relationships ──

    departments ||--o{ users : "has many"
    users ||--o| students : "has one profile"
    users ||--o{ users : "created_by"
    users ||--o{ enrollments : "has many (as student)"
    users ||--o{ subject_teachers : "teaches (as teacher)"

    subjects ||--o{ subject_teachers : "has many"
    subject_teachers ||--o{ enrollments : "has many"

    enrollments ||--o{ grades : "has many"
    enrollments ||--o{ attendance_records : "has many"
    enrollments ||--o| interventions : "has one"

    interventions ||--o{ intervention_tasks : "has many"
    users ||--o{ interventions : "approved_by"

    users ||--o{ student_notifications : "receives (as student)"
    users ||--o{ student_notifications : "sends (as teacher)"
    interventions ||--o{ student_notifications : "linked to"

    users ||--o{ password_reset_requests : "requests"
    users ||--o{ password_reset_requests : "processed_by"

    users ||--o{ system_settings : "updated_by"

    departments ||--o{ teacher_registrations : "belongs to"
    users ||--o{ teacher_registrations : "reviewed_by"
```

---

## 📋 Tables Summary

| #   | Table                     | Description                                                 |
| --- | ------------------------- | ----------------------------------------------------------- |
| 1   | `departments`             | Academic departments within the institution                 |
| 2   | `users`                   | All system users (super_admin, admin, teacher, student)     |
| 3   | `students`                | Extended student profile linked to a user                   |
| 4   | `subjects`                | Academic subjects offered                                   |
| 5   | `subject_teachers`        | Pivot: assigns a teacher to a subject (with section, year…) |
| 6   | `enrollments`             | A student enrolled in a specific subject-teacher assignment |
| 7   | `grades`                  | Individual assignment scores per enrollment per quarter     |
| 8   | `attendance_records`      | Daily attendance status per enrollment                      |
| 9   | `interventions`           | Interventions triggered for at-risk enrollments             |
| 10  | `intervention_tasks`      | Checklist items within an intervention                      |
| 11  | `student_notifications`   | Notifications sent to students (nudges, alerts, feedback…)  |
| 12  | `password_reset_requests` | Password reset workflow requests                            |
| 13  | `system_settings`         | Key-value system configuration settings                     |
| 14  | `teacher_registrations`   | Pending teacher registration applications                   |

---

## 🔗 Relationships Detail

### `departments` → `users`

- **Type:** One-to-Many
- **FK:** `users.department_id` → `departments.id`
- A department can have many users (admins, teachers, students). Nullable — on delete set null.

### `users` → `students`

- **Type:** One-to-One
- **FK:** `students.user_id` → `users.id`
- A user (with role `student`) has one student profile. On delete cascade.

### `users` → `users` (self-referential)

- **Type:** One-to-Many
- **FK:** `users.created_by` → `users.id`
- A user (admin/super_admin) can create other users. Nullable — on delete set null.

### `subjects` → `subject_teachers`

- **Type:** One-to-Many
- **FK:** `subject_teachers.subject_id` → `subjects.id`
- A subject can be taught by many teachers (across different sections/years). On delete cascade.

### `users` → `subject_teachers`

- **Type:** One-to-Many
- **FK:** `subject_teachers.teacher_id` → `users.id`
- A teacher (user) can teach many subject assignments. On delete cascade.

### `subject_teachers` → `enrollments`

- **Type:** One-to-Many
- **FK:** `enrollments.subject_teachers_id` → `subject_teachers.id`
- A subject-teacher assignment can have many enrolled students. On delete cascade.

### `users` → `enrollments`

- **Type:** One-to-Many
- **FK:** `enrollments.user_id` → `users.id`
- A student (user) can be enrolled in many subject-teacher assignments. On delete cascade.

### `enrollments` → `grades`

- **Type:** One-to-Many
- **FK:** `grades.enrollment_id` → `enrollments.id`
- An enrollment can have many grade records (per assignment/quarter). On delete cascade.
- **Unique constraint:** `(enrollment_id, assignment_key, quarter)`

### `enrollments` → `attendance_records`

- **Type:** One-to-Many
- **FK:** `attendance_records.enrollment_id` → `enrollments.id`
- An enrollment can have many daily attendance records. On delete cascade.

### `enrollments` → `interventions`

- **Type:** One-to-One
- **FK:** `interventions.enrollment_id` → `enrollments.id`
- An enrollment can have one active intervention. On delete cascade.

### `interventions` → `intervention_tasks`

- **Type:** One-to-Many
- **FK:** `intervention_tasks.intervention_id` → `interventions.id`
- An intervention can have many checklist tasks. On delete cascade.

### `users` → `interventions` (approved_by)

- **Type:** One-to-Many
- **FK:** `interventions.approved_by` → `users.id`
- A teacher/admin can approve many interventions. Nullable — on delete set null.

### `users` → `student_notifications` (recipient)

- **Type:** One-to-Many
- **FK:** `student_notifications.user_id` → `users.id`
- A student receives many notifications. On delete cascade.

### `users` → `student_notifications` (sender)

- **Type:** One-to-Many
- **FK:** `student_notifications.sender_id` → `users.id`
- A teacher sends many notifications. Nullable — on delete set null.

### `interventions` → `student_notifications`

- **Type:** One-to-Many
- **FK:** `student_notifications.intervention_id` → `interventions.id`
- An intervention can trigger many notifications. Nullable — on delete cascade.

### `users` → `password_reset_requests` (requester)

- **Type:** One-to-Many
- **FK:** `password_reset_requests.user_id` → `users.id`
- A user can submit many password reset requests. On delete cascade.

### `users` → `password_reset_requests` (processor)

- **Type:** One-to-Many
- **FK:** `password_reset_requests.processed_by` → `users.id`
- An admin processes many password reset requests. Nullable — on delete set null.

### `users` → `system_settings`

- **Type:** One-to-Many
- **FK:** `system_settings.updated_by` → `users.id`
- An admin/super_admin can update many system settings. Nullable — on delete set null.

### `departments` → `teacher_registrations`

- **Type:** One-to-Many
- **FK:** `teacher_registrations.department_id` → `departments.id`
- A department receives many teacher registration applications. On delete cascade.

### `users` → `teacher_registrations` (reviewer)

- **Type:** One-to-Many
- **FK:** `teacher_registrations.reviewed_by` → `users.id`
- An admin reviews many teacher registrations. Nullable — on delete set null.

---

## 🏷️ Intervention Type Tiers

| Tier   | Type                 | Description        |
| ------ | -------------------- | ------------------ |
| Tier 1 | `academic_quiz`      | Academic Quiz      |
| Tier 1 | `automated_nudge`    | Reminder Nudge     |
| Tier 2 | `task_list`          | Goal Checklist     |
| Tier 2 | `extension_grant`    | Deadline Extension |
| Tier 2 | `parent_contact`     | Parent Contact     |
| Tier 3 | `counselor_referral` | Counselor Referral |
| Tier 3 | `academic_agreement` | Academic Agreement |
| Tier 3 | `one_on_one_meeting` | One-on-One Meeting |

---

## 👤 User Roles

| Role          | Description                                            |
| ------------- | ------------------------------------------------------ |
| `super_admin` | Full system access, manages admins and global settings |
| `admin`       | Department-level management, user creation, approvals  |
| `teacher`     | Manages subjects, grades, attendance, interventions    |
| `student`     | Views grades, attendance, receives interventions       |

---

> **Note:** This ERD is auto-generated from the Laravel migration files and Eloquent model relationships. Render the Mermaid diagram using any Mermaid-compatible Markdown viewer (GitHub, VS Code with Mermaid extension, etc.).

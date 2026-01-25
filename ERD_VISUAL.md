graph TB
subgraph Core["🔷 Core Auth & User Management"]
USERS["<b>USERS</b><br/>id, email (UK), role, status<br/>first_name, last_name, password<br/>temp_password, must_change_password<br/>department_id, created_by<br/>📌 created_at, updated_at"]
DEPARTMENTS["<b>DEPARTMENTS</b><br/>id, name, code (UK)<br/>is_active, created_by<br/>📌 timestamps"]
end

    subgraph Academic["🎓 Academic Core"]
        STUDENTS["<b>STUDENTS</b><br/>id, user_id (FK)<br/>first_name, last_name, lrn<br/>grade_level, section, strand<br/>📌 timestamps<br/><br/>⚠️ Note: Redundant fields"]
        SUBJECTS["<b>SUBJECTS</b><br/>id, user_id (FK)<br/>name, grade_level, section<br/>school_year, current_quarter<br/>grade_categories (JSON)<br/>strand, track, color<br/>📌 timestamps"]
        ENROLLMENTS["<b>ENROLLMENTS</b><br/>id, user_id (FK)<br/>subject_id (FK)<br/>risk_status, current_grade<br/>current_attendance_rate<br/>📌 timestamps"]
        GRADES["<b>GRADES</b><br/>id, enrollment_id (FK)<br/>assignment_key, assignment_name<br/>score, total_score, quarter<br/>📌 timestamps<br/><br/>🔑 Composite Unique:<br/>(enrollment_id, assignment_key, quarter)"]
        ATTENDANCE["<b>ATTENDANCE_RECORDS</b><br/>id, enrollment_id (FK)<br/>date, status (present|absent|late|excused)<br/>📌 timestamps<br/><br/>⚠️ Missing: notes, marked_by"]
    end

    subgraph Curriculum["📚 Curriculum Management"]
        MASTER_SUBJ["<b>MASTER_SUBJECTS</b><br/>id, code (UK), name<br/>grade_level, strand, track<br/>semester, units, is_active<br/>📌 timestamps"]
        PREREQUISITES["<b>MASTER_SUBJECT_PREREQUISITES</b><br/>id<br/>master_subject_id (FK)<br/>prerequisite_id (FK)<br/>minimum_grade<br/>📌 timestamps<br/><br/>🔑 Composite Unique:<br/>(master_subject_id, prerequisite_id)<br/><br/>⚠️ Bug: Duplicate FK definition"]
    end

    subgraph Intervention["🚀 Intervention Management"]
        INTERVENTIONS["<b>INTERVENTIONS</b><br/>id, enrollment_id (FK)<br/>type (academic_quiz|automated_nudge|<br/>task_list|extension_grant|<br/>parent_contact|counselor_referral|<br/>academic_agreement|one_on_one_meeting)<br/>status (active|completed|cancelled)<br/>notes, completion_requested_at<br/>approved_at, approved_by (FK)<br/>rejected_at, rejection_reason<br/>📌 timestamps"]
        TASKS["<b>INTERVENTION_TASKS</b><br/>id, intervention_id (FK)<br/>description, is_completed<br/>📌 timestamps"]
        NOTIFS["<b>STUDENT_NOTIFICATIONS</b><br/>id, user_id (FK)<br/>intervention_id (FK)<br/>sender_id (FK)<br/>type, title, message<br/>is_read, read_at<br/>📌 timestamps"]
    end

    subgraph Admin["⚙️ Admin Workflows"]
        PWD_RESET["<b>PASSWORD_RESET_REQUESTS</b><br/>id, user_id (FK)<br/>reason, status<br/>admin_notes<br/>processed_by (FK)<br/>processed_at<br/>📌 timestamps<br/><br/>🔑 Indexes:<br/>(user_id, status), status"]
        TEACHER_REG["<b>TEACHER_REGISTRATIONS</b><br/>id, email (UK)<br/>first_name, last_name<br/>department_id (FK)<br/>password, document_path<br/>status, rejection_reason<br/>reviewed_by (FK)<br/>reviewed_at<br/>📌 timestamps"]
        SETTINGS["<b>SYSTEM_SETTINGS</b><br/>id, key (UK)<br/>value, type (string|integer|<br/>boolean|json)<br/>group (academic|general|system)<br/>description, updated_by (FK)<br/>📌 timestamps"]
    end

    %% Relationships
    USERS -->|has profile| STUDENTS
    USERS -->|leads| DEPARTMENTS
    USERS -->|teaches| SUBJECTS
    USERS -->|enrolls as| ENROLLMENTS
    USERS -->|approves| INTERVENTIONS
    USERS -->|sends| NOTIFS
    USERS -->|reviews| TEACHER_REG
    USERS -->|processes| PWD_RESET
    USERS -->|updates| SETTINGS
    USERS -->|creates| DEPARTMENTS

    DEPARTMENTS -->|contains| USERS

    SUBJECTS -->|has| ENROLLMENTS
    SUBJECTS -->|belongs to| MASTER_SUBJ

    ENROLLMENTS -->|generates| GRADES
    ENROLLMENTS -->|records| ATTENDANCE
    ENROLLMENTS -->|receives| INTERVENTIONS

    INTERVENTIONS -->|contains| TASKS
    INTERVENTIONS -->|triggers| NOTIFS

    MASTER_SUBJ -->|has prerequisites| PREREQUISITES
    PREREQUISITES -->|links| MASTER_SUBJ

    TEACHER_REG -->|belongs to| DEPARTMENTS

    style Core fill:#e1f5ff
    style Academic fill:#fff9c4
    style Curriculum fill:#f3e5f5
    style Intervention fill:#e8f5e9
    style Admin fill:#ffe0b2

    classDef warning fill:#ffccbc,stroke:#d84315,stroke-width:2px
    classDef alert fill:#ffcdd2,stroke:#c62828,stroke-width:2px

    class PREREQUISITES alert
    class STUDENTS warning
    class ATTENDANCE warning

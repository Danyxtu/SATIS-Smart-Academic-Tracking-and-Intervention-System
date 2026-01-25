## Paste this code in 'https://dbdiagram.io/d'

## ERD

// SATIS: Smart Academic Tracking and Intervention System ERD

Table users {
id integer [primary key]
name string
email string [unique]
email_verified_at timestamp
password string
remember_token string
created_at timestamp
updated_at timestamp
}

Table departments {
id integer [primary key]
name string
code string [unique]
description text
is_active boolean [default: true]
created_by integer [ref: > users.id]
created_at timestamp
updated_at timestamp
}

Table master_subjects {
id integer [primary key]
code string [unique]
name string
description text
grade_level string
strand string
track string
semester enum // '1', '2', 'full_year'
units decimal
is_active boolean [default: true]
created_by integer [ref: > users.id]
created_at timestamp
updated_at timestamp
}

Table students {
id integer [primary key]
first_name string
last_name string
middle_name string
subject string
grade integer
trend string
avatar string
user_id integer [ref: > users.id]
created_at timestamp
updated_at timestamp
}

Table subjects {
id integer [primary key]
user_id integer [ref: > users.id] // The Teacher
name string
room_number string
school_year string
created_at timestamp
updated_at timestamp
}

Table enrollments {
id integer [primary key]
user_id integer [ref: > users.id] // The Student
subject_id integer [ref: > subjects.id]
risk_status string [default: 'low']
current_grade float
current_attendance_rate float
created_at timestamp
updated_at timestamp
}

Table grades {
id integer [primary key]
enrollment_id integer [ref: > enrollments.id]
assignment_name string
score float
total_score float
quarter integer
created_at timestamp
updated_at timestamp
}

Table attendance_records {
id integer [primary key]
enrollment_id integer [ref: > enrollments.id]
date date
status enum // 'present', 'absent', 'late', 'excused'
created_at timestamp
updated_at timestamp
}

Table interventions {
id integer [primary key]
enrollment_id integer [ref: > enrollments.id]
status enum [default: 'active'] // 'active', 'completed', 'cancelled'
created_at timestamp
updated_at timestamp
}

Table intervention_tasks {
id integer [primary key]
intervention_id integer [ref: > interventions.id]
description string
is_completed boolean [default: false]
created_at timestamp
updated_at timestamp
}

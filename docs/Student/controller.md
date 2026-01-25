## Student Controller

<!-- Enumerate using **something** -->

**AnalyticsController**
**AttendanceController**
**InterventionController**
**SubjectRiskController**

### AnalyticsController

    - can do:
        * Display all the subjects along with the grades (index()),
        * Display the detailed analytics for a specific subject/enrollement (show()),
        * Export student analytics as a PDF.

### AttendanceController

    - can do:
        * Display the student's attendance page with real attendance data (index()),

### InterventionController

    - can do:
        * Display the students's intervention and feedback from the teacher (index()),
        * Mark a task as completed (completeTask()),
        * Mark a notification/feedback as read (markFeedbackRead()),
        * Request completion of a tier 3 intervention (requestCompletion())

### SubjectRiskController

    - can do:
        * Display subjects at risk for the student (index()).

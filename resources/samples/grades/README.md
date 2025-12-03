Q1 Grade CSV sample and instructions

File: q1_grade_template_20_students.csv

Columns:

-   Student Name: Optional but recommended. Matches if LRN missing.
-   LRN: Required. Numeric identifiers used to match students in the class.
-   Activity 1 / Activity 2 / Activity 3: Example performance task columns. Totals per assignment should match the assignment setup (e.g., 20, 20, 30)
-   Quiz 1 / Quiz 2: Example written works columns. Totals: 10, 10
-   Quarterly Exam: Example quarterly exam column. Total: 20

Notes:

-   The importer matches assignment columns using the assignment label (case-insensitive, normalized) or assignment id (slug).
-   Scores must be numeric and less than or equal to the assignment's total.
-   Blank values are skipped and won't remove existing grades.
-   This sample file imports to Quarter 1 by default (the current importer writes quarter=1). If you need Q2, the importer can be extended to accept 'quarter' column or q2\_ prefix.

How to use:

1. Save the CSV file to your disk.
2. Open the teacher class view → select class → "Upload Grades" → select this CSV.
3. Upload and check the import summary for skipped rows or errors.

If you want a version that uses assignment IDs or Q2 prefix, tell me and I can add it.

Classlist CSV:

-   File: classlist_20_students.csv
-   Columns supported: Student Name, LRN (required), Grade Level, Section, Email
-   The ClassController import expects at least Name and LRN and 'grade_level' is required for storing a new Student record.
-   Example usage: Teacher → Add Class → Upload Classlist (choose classlist_20_students.csv). The import will create users when one doesn't exist and return generated passwords in the import summary only for newly created users.

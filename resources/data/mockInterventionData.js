// This file simulates database/API responses.

export const mockStudentList = [
  {
    id: "1001",
    name: "John Ray D. Cruz",
    alertReason: "Grade < 70%",
    priority: "High",
    subject: "Mathematics 8",
    lastInterventionDate: "2025-10-28",
    photoUrl: "https://example.com/images/john.png",
  },
  {
    id: "1002",
    name: "Maria S. Dela Vega",
    alertReason: "4+ Missing Assignments",
    priority: "High",
    subject: "Science 8",
    lastInterventionDate: "2025-10-25",
    photoUrl: "https://example.com/images/maria.png",
  },
  {
    id: "1003",
    name: "Peter A. Garcia",
    alertReason: "Attendance Flag",
    priority: "Medium",
    subject: "English 8",
    lastInterventionDate: "2025-11-01",
    photoUrl: "https://example.com/images/peter.png",
  },
  {
    id: "1004",
    name: "Angela M. Santos",
    alertReason: "Behavior Report",
    priority: "Low",
    subject: "Filipino 8",
    lastInterventionDate: "2025-11-03",
    photoUrl: "https://example.com/images/angela.png",
  },
];

export const mockStudentDetails = {
  "1001": {
    id: "1001",
    name: "John Ray D. Cruz",
    photoUrl: "https://example.com/images/john.png",
    currentGrade: "68%",
    gradeTrend: [75, 72, 70, 68], 
    specialPrograms: ["IEP"],
    parentContact: "parent.cruz@email.com",
    counselor: "Mr. Reyes",
    attendanceSummary: "2 Absences, 1 Tardy",
    missingAssignments: [
      { id: "ma1", title: "Algebra Worksheet (Ch. 4)" },
      { id: "ma2", title: "Geometry Quiz #2" },
    ],
    behaviorLog: [
      { id: "b1", date: "2025-10-20", report: "Disruptive in class." },
    ],
    interventionLog: [
      {
        id: "i1",
        date: "2025-10-28",
        action: "1-on-1 Conference",
        notes: "Spoke with John. He's struggling with factoring.",
        followUp: "2025-11-04",
      },
    ],
  },
  "1002": {
    id: "1002",
    name: "Maria S. Dela Vega",
    photoUrl: "https://example.com/images/maria.png",
    currentGrade: "78%",
    gradeTrend: [85, 82, 80, 78],
    specialPrograms: ["ELL"],
    parentContact: "parent.vega@email.com",
    counselor: "Ms. Aquino",
    attendanceSummary: "0 Absences, 0 Tardy",
    missingAssignments: [
      { id: "ma3", title: "Lab Report: Photosynthesis" },
      { id: "ma4", title: "Homework 5.1" },
      { id: "ma5", title: "Homework 5.2" },
      { id: "ma6", title: "Project Proposal" },
    ],
    behaviorLog: [],
    interventionLog: [
      {
        id: "i2",
        date: "2025-10-25",
        action: "Parent Emailed",
        notes: "Emailed parent about missing work. No response yet.",
        followUp: "2025-11-01",
      },
    ],
  },
  // ... (Add more student details as needed)
};
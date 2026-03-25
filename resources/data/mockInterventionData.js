export const mockStudentList = [
    {
        id: "1",
        name: "Juan Dela Cruz",
        currentGrade: "78",
        riskLevel: "high",
    },
    {
        id: "2",
        name: "Maria Santos",
        currentGrade: "82",
        riskLevel: "medium",
    },
    {
        id: "3",
        name: "Pedro Reyes",
        currentGrade: "89",
        riskLevel: "low",
    },
];

export const mockStudentDetails = {
    1: {
        id: "1",
        name: "Juan Dela Cruz",
        specialPrograms: ["At Risk", "Math Support"],
        parentContact: "+63 912 345 6789",
        counselor: "Ms. Ana Lopez",
        currentGrade: "78",
        attendanceSummary: "3 absences, 4 tardies this quarter",
        missingAssignments: [
            { id: "m1", title: "Algebra Worksheet 3" },
            { id: "m2", title: "Quarter 1 Project Reflection" },
        ],
        behaviorLog: [
            { id: "b1", date: "2026-03-01", report: "Late submission" },
        ],
        interventionLog: [
            {
                id: "i1",
                date: "2026-03-05",
                action: "Parent Emailed",
                notes: "Sent progress and missing requirements update.",
                followUp: "2026-03-12",
            },
        ],
    },
    2: {
        id: "2",
        name: "Maria Santos",
        specialPrograms: ["Reading Program"],
        parentContact: "+63 917 123 4567",
        counselor: "Mr. Carlo Diaz",
        currentGrade: "82",
        attendanceSummary: "1 absence, 1 tardy this quarter",
        missingAssignments: [{ id: "m3", title: "Science Lab Report" }],
        behaviorLog: [],
        interventionLog: [
            {
                id: "i2",
                date: "2026-03-07",
                action: "1-on-1 Conference",
                notes: "Discussed study routine and weekly planner.",
                followUp: "2026-03-14",
            },
        ],
    },
    3: {
        id: "3",
        name: "Pedro Reyes",
        specialPrograms: ["Honor Watch"],
        parentContact: "+63 918 000 1122",
        counselor: "Ms. Ana Lopez",
        currentGrade: "89",
        attendanceSummary: "No recent attendance issues",
        missingAssignments: [],
        behaviorLog: [],
        interventionLog: [
            {
                id: "i3",
                date: "2026-03-08",
                action: "Other",
                notes: "Positive reinforcement and goal-setting check-in.",
                followUp: null,
            },
        ],
    },
};

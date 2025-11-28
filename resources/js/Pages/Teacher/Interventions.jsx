import TeacherLayout from "@/Layouts/TeacherLayout";
import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

// --- Mock Data (Placeholder) ---
const mockStudentList = [
    {
        id: "1001",
        name: "John Ray D. Cruz",
        alertReason: "Grade < 70%",
        priority: "High",
        subject: "Mathematics 8",
        lastInterventionDate: "2025-10-28",
    },
    {
        id: "1002",
        name: "Maria S. Dela Vega",
        alertReason: "4+ Missing Assignments",
        priority: "High",
        subject: "Science 8",
        lastInterventionDate: "2025-10-25",
    },
];

const mockStudentDetails = {
    1001: {
        id: "1001",
        name: "John Ray D. Cruz",
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
        behaviorLog: [],
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
    1002: {
        id: "1002",
        name: "Maria S. Dela Vega",
        currentGrade: "78%",
        gradeTrend: [85, 82, 80, 78],
        specialPrograms: ["ELL"],
        parentContact: "parent.vega@email.com",
        counselor: "Ms. Aquino",
        attendanceSummary: "0 Absences, 0 Tardy",
        missingAssignments: [
            { id: "ma3", title: "Lab Report: Photosynthesis" },
            { id: "ma4", title: "Homework 5.1" },
        ],
        behaviorLog: [],
        interventionLog: [],
    },
};

// --- Helper Function ---
const getPriorityClasses = (priority) => {
    const baseClasses =
        "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full";
    switch (priority) {
        case "High":
            return `${baseClasses} bg-red-100 text-red-800`;
        case "Medium":
            return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case "Low":
            return `${baseClasses} bg-blue-100 text-blue-800`;
        default:
            return `${baseClasses} bg-gray-100 text-gray-800`;
    }
};

// --- Dashboard Component ---
function InterventionDashboard({ students, onSelectStudent }) {
    const totalStudents = students.length;
    const highPriority = students.filter((s) => s.priority === "High").length;
    const mediumPriority = students.filter(
        (s) => s.priority === "Medium"
    ).length;
    const lowPriority = students.filter((s) => s.priority === "Low").length;

    return (
        <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Intervention Overview
            </h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                    <p className="text-sm font-medium text-gray-500">
                        Total Students on Watchlist
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                        {totalStudents}
                    </p>
                </div>
                <div className="bg-red-50 p-5 rounded-lg shadow-md border border-red-200">
                    <p className="text-sm font-medium text-red-700">
                        High Priority
                    </p>
                    <p className="text-3xl font-bold text-red-900 mt-1">
                        {highPriority}
                    </p>
                </div>
                <div className="bg-yellow-50 p-5 rounded-lg shadow-md border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-700">
                        Medium Priority
                    </p>
                    <p className="text-3xl font-bold text-yellow-900 mt-1">
                        {mediumPriority}
                    </p>
                </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Priority Watchlist
            </h3>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            {[
                                "Student Name",
                                "Alert Reason",
                                "Priority",
                                "Subject", // Changed from 'Class' to 'Subject' for clarity
                                "Last Intervention", // Changed from 'Last Contact'
                            ].map((head) => (
                                <th
                                    key={head}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                                >
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((s) => (
                            <tr
                                key={s.id}
                                onClick={() => onSelectStudent(s.id)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <div className="flex items-center">
                                        {/* Simple Avatar with Initials */}
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 text-xs font-bold mr-3">
                                            {s.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                        </div>
                                        {s.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {s.alertReason}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <span
                                        className={getPriorityClasses(
                                            s.priority
                                        )}
                                    >
                                        {s.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {s.subject}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {s.lastInterventionDate}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- Modal Component for AI Quiz ---
function AIGeneratedQuizModal({ open, onClose, studentName }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [quiz, setQuiz] = useState([]);

    const generateQuiz = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const sampleQuestions = Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                question: `Question ${i + 1}: Solve ${Math.floor(
                    Math.random() * 10
                )} + ${Math.floor(Math.random() * 10)} = ?`,
                choices: ["A. 5", "B. 7", "C. 10", "D. 12"],
            }));
            setQuiz(sampleQuestions);
            setIsGenerating(false);
        }, 1000);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
                <h2 className="text-xl font-bold mb-2">
                    AI-Assisted Quiz Generator
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                    Generating a custom quiz to help{" "}
                    <strong>{studentName}</strong> improve performance.
                </p>
                {isGenerating ? (
                    <div className="text-center text-gray-500">
                        🤖 Thinking and generating questions...
                    </div>
                ) : quiz.length === 0 ? (
                    <button
                        onClick={generateQuiz}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        Generate 10-Item Quiz
                    </button>
                ) : (
                    <div className="max-h-80 overflow-y-auto border-t border-gray-200 mt-3 pt-3 space-y-3">
                        {quiz.map((q) => (
                            <div key={q.id} className="border-b pb-2">
                                <p className="font-medium text-gray-800">
                                    {q.question}
                                </p>
                                <ul className="text-sm text-gray-600 list-disc list-inside">
                                    {q.choices.map((c, i) => (
                                        <li key={i}>{c}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}

                {quiz.length > 0 && (
                    <div className="flex justify-between mt-5">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            Close
                        </button>
                        <button
                            onClick={() =>
                                alert("📨 Quiz sent to student portal!")
                            }
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            Send Quiz to Student
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- New Modal for Teacher Feedback ---
function FeedbackModal({ open, onClose, onSubmit, studentName }) {
    const [message, setMessage] = useState("");

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-3">
                    Send Feedback to {studentName}
                </h2>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your feedback..."
                    className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none h-28 mb-4"
                />
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (message.trim()) {
                                onSubmit(message);
                                setMessage("");
                                onClose();
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Send Feedback
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Start Intervention Modal (NEW) ---
function StartInterventionModal({ open, onClose, studentId, studentName }) {
    const { data, setData, post, processing, reset } = useForm({
        student_id: studentId,
        type: "parent_contact",
        notes: "",
    });

    if (!open) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ensure route 'teacher.interventions.store' exists in routes/web.php
        post(route("teacher.interventions.store"), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    // Dynamic descriptions for the selected type
    const typeDescriptions = {
        academic_quiz:
            "System will generate a 10-item quiz based on recent low-scoring topics.",
        automated_nudge:
            "Sends a notification to the student's dashboard reminding them of goals.",
        task_list:
            "Creates a manual checklist of goals (e.g., 'Submit Lab Report') for the student.",
        extension_grant:
            "Officially extends the deadline for the current missing assignment by 3 days.",
        parent_contact:
            "Log a call or email sent to the parent regarding performance.",
        counselor_referral:
            "Escalates this case to the Guidance Office for official review.",
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Start Intervention for {studentName}
                </h2>

                <form onSubmit={handleSubmit}>
                    {/* Intervention Type Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Intervention Strategy
                        </label>
                        <select
                            value={data.type}
                            onChange={(e) => setData("type", e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <optgroup label="Tier 1: Low Touch (Automated)">
                                <option value="academic_quiz">
                                    🤖 Assign Remedial Quiz (AI)
                                </option>
                                <option value="automated_nudge">
                                    🔔 Send Reminder Nudge
                                </option>
                            </optgroup>
                            <optgroup label="Tier 2: Targeted (Teacher Led)">
                                <option value="task_list">
                                    📋 Create Goal Checklist
                                </option>
                                <option value="extension_grant">
                                    ⏳ Grant Deadline Extension
                                </option>
                                <option value="parent_contact">
                                    📞 Parent Contact Log
                                </option>
                            </optgroup>
                            <optgroup label="Tier 3: Intensive (Admin)">
                                <option value="counselor_referral">
                                    🚩 Refer to Counselor
                                </option>
                            </optgroup>
                        </select>

                        {/* Dynamic Description Box */}
                        <div className="mt-2 p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-100">
                            <strong>Strategy Info:</strong>{" "}
                            {typeDescriptions[data.type]}
                        </div>
                    </div>

                    {/* Notes / Context */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Specific Notes / Instructions
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-24"
                            placeholder="e.g., 'Spoke to mother, she will monitor homework tonight' or 'Focus on Quadratic Equations'"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 border-t pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing ? "Saving..." : "Confirm Intervention"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Student Profile Component ---
function StudentInterventionProfile({ studentId, onBack }) {
    const [student, setStudent] = useState(null);
    const [openQuizModal, setOpenQuizModal] = useState(false);
    const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
    // NEW: State for Intervention Modal
    const [isInterventionModalOpen, setIsInterventionModalOpen] =
        useState(false);

    useEffect(() => {
        setStudent({ ...mockStudentDetails[studentId] });
    }, [studentId]);

    const handleAddFeedback = (message) => {
        const newFeedback = {
            id: Date.now(),
            date: new Date().toISOString().split("T")[0],
            action: "Teacher Feedback",
            notes: message,
        };
        setStudent((prev) => ({
            ...prev,
            interventionLog: [...prev.interventionLog, newFeedback],
        }));
    };

    if (!student) return <div className="p-6 text-gray-500">Loading...</div>;

    const numericGrade = parseInt(student.currentGrade);
    const showAISuggestion = numericGrade < 75;

    // Helper for initials
    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    return (
        <div className="p-4 sm:p-6 bg-white rounded-lg shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <button
                    onClick={onBack}
                    className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                </button>
                {/* NEW: Start Intervention Button */}
                <button
                    onClick={() => setIsInterventionModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 shadow-md transition-all"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Start New Intervention
                </button>
            </div>

            {/* Snapshot */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start bg-blue-50 p-6 rounded-lg shadow-inner border border-blue-200">
                <div className="w-24 h-24 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 text-3xl font-bold flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                    {getInitials(student.name)}
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-3xl font-bold text-blue-900">
                        {student.name}
                    </h2>
                    <p className="text-md text-blue-700 mt-2">
                        <strong>Parent Contact:</strong> {student.parentContact}
                    </p>
                    <p className="text-md text-blue-700">
                        <strong>Counselor:</strong> {student.counselor}
                    </p>
                    {student.specialPrograms.length > 0 && (
                        <p className="text-md text-blue-700">
                            <strong>Programs:</strong>{" "}
                            {student.specialPrograms.join(", ")}
                        </p>
                    )}
                </div>
            </div>

            {/* Vitals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            Academic Status
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Current Grade:
                        </p>
                        <p
                            className={`text-4xl font-bold ${
                                numericGrade < 75
                                    ? "text-red-600"
                                    : "text-green-600"
                            }`}
                        >
                            {student.currentGrade}
                        </p>
                    </div>
                    {student.gradeTrend && student.gradeTrend.length > 1 && (
                        <p className="text-sm text-gray-500 mt-4">
                            Grade Trend:{" "}
                            {student.gradeTrend[0] >
                            student.gradeTrend[
                                student.gradeTrend.length - 1
                            ] ? (
                                <span className="text-red-500">Decreasing</span>
                            ) : student.gradeTrend[0] <
                              student.gradeTrend[
                                  student.gradeTrend.length - 1
                              ] ? (
                                <span className="text-green-500">
                                    Increasing
                                </span>
                            ) : (
                                <span className="text-gray-500">Stable</span>
                            )}
                        </p>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            Engagement
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                            <strong>Attendance:</strong>{" "}
                            {student.attendanceSummary}
                        </p>
                        {student.missingAssignments &&
                            student.missingAssignments.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm text-gray-600 font-semibold mb-1">
                                        Missing Assignments:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-red-600">
                                        {student.missingAssignments.map(
                                            (assignment) => (
                                                <li key={assignment.id}>
                                                    {assignment.title}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Other Notes
                    </h3>
                    {student.behaviorLog && student.behaviorLog.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-gray-700">
                            {student.behaviorLog.map((log, index) => (
                                <li key={index}>{log}</li> // Assuming behaviorLog stores strings
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">
                            No recent behavioral notes.
                        </p>
                    )}
                </div>
            </div>

            {/* System Suggested Intervention */}
            {showAISuggestion && (
                <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-300 rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-indigo-800 mb-3">
                        🤖 System-Suggested Intervention
                    </h3>
                    <p className="text-md text-gray-700 mb-4">
                        The system detected low academic performance and/or
                        missing assignments. Consider assigning an AI-generated
                        quiz, sending personal feedback, or initiating a new
                        intervention strategy.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setOpenQuizModal(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 shadow-md transition-all"
                        >
                            Generate AI Quiz
                        </button>
                        <button
                            onClick={() => setOpenFeedbackModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-md transition-all"
                        >
                            Send Feedback
                        </button>
                        <button
                            onClick={() => setIsInterventionModalOpen(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 shadow-md transition-all"
                        >
                            Start New Intervention
                        </button>
                    </div>
                </div>
            )}

            {/* Intervention Log */}
            <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Intervention Log
                </h3>
                <div className="grid gap-4">
                    {student.interventionLog.length > 0 ? (
                        student.interventionLog.map((log) => (
                            <div
                                key={log.id}
                                className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm"
                            >
                                <p className="text-sm font-semibold text-gray-800 mb-1">
                                    {log.date} - {log.action}
                                </p>
                                <p className="text-sm text-gray-700">
                                    {log.notes}
                                </p>
                                {log.followUp && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Follow-up: {log.followUp}
                                    </p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">
                            No intervention history for this student.
                        </p>
                    )}
                </div>
            </div>

            <AIGeneratedQuizModal
                open={openQuizModal}
                onClose={() => setOpenQuizModal(false)}
                studentName={student.name}
            />
            <FeedbackModal
                open={openFeedbackModal}
                onClose={() => setOpenFeedbackModal(false)}
                onSubmit={handleAddFeedback}
                studentName={student.name}
            />

            {/* NEW: Render the Intervention Modal */}
            <StartInterventionModal
                open={isInterventionModalOpen}
                onClose={() => setIsInterventionModalOpen(false)}
                studentId={student.id}
                studentName={student.name}
            />
        </div>
    );
}

// --- Parent Component ---
function InterventionCenter() {
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    useEffect(() => {
        setStudents(mockStudentList);
    }, []);

    return (
        <div className="p-4 sm:p-6 font-sans">
            <h1 className="text-3xl font-bold text-gray-900 border-b pb-4 mb-6">
                Intervention Center
            </h1>

            {selectedStudentId ? (
                <StudentInterventionProfile
                    studentId={selectedStudentId}
                    onBack={() => setSelectedStudentId(null)}
                />
            ) : (
                <InterventionDashboard
                    students={students}
                    onSelectStudent={setSelectedStudentId}
                />
            )}
        </div>
    );
}

// --- Export Page ---
const Interventions = () => (
    <TeacherLayout>
        <div className="bg-gray-100 min-h-screen">
            <InterventionCenter />
        </div>
    </TeacherLayout>
);

export default Interventions;

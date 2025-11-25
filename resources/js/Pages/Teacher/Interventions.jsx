import TeacherLayout from "@/Layouts/TeacherLayout";
import React, { useState, useEffect } from "react";

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
  "1001": {
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
  "1002": {
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
  return (
    <div className="dashboard-container">
      <h2 className="text-2xl font-semibold text-gray-800">Priority Watchlist</h2>
      <div className="flex flex-col mt-6">
        <table className="min-w-full divide-y divide-gray-200 shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Student Name",
                "Alert Reason",
                "Priority",
                "Class",
                "Last Contact",
              ].map((head) => (
                <th
                  key={head}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
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
                  {s.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {s.alertReason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <span className={getPriorityClasses(s.priority)}>
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
        question: `Question ${i + 1}: Solve ${Math.floor(Math.random() * 10)} + ${Math.floor(Math.random() * 10)} = ?`,
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
        <h2 className="text-xl font-bold mb-2">AI-Assisted Quiz Generator</h2>
        <p className="text-sm text-gray-600 mb-4">
          Generating a custom quiz to help <strong>{studentName}</strong> improve
          performance.
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
                <p className="font-medium text-gray-800">{q.question}</p>
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
              onClick={() => alert("📨 Quiz sent to student portal!")}
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
        <h2 className="text-xl font-bold mb-3">Send Feedback to {studentName}</h2>
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

// --- Student Profile Component ---
function StudentInterventionProfile({ studentId, onBack }) {
  const [student, setStudent] = useState(null);
  const [openQuizModal, setOpenQuizModal] = useState(false);
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);

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

  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        &larr; Back to Dashboard
      </button>

      {/* Snapshot */}
      <div className="flex flex-col sm:flex-row items-start bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="w-20 h-20 rounded-full bg-gray-300 flex-shrink-0 mb-4 sm:mb-0 sm:mr-6" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
          <p className="text-sm text-gray-600 mt-1">
            <strong>Parent Contact:</strong> {student.parentContact}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Counselor:</strong> {student.counselor}
          </p>
        </div>
      </div>

      {/* Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Academic Vitals</h3>
          <p className="text-sm text-gray-600 mb-2">Current Grade:</p>
          <p
            className={`text-4xl font-bold ${
              numericGrade < 75 ? "text-red-600" : "text-green-600"
            }`}
          >
            {student.currentGrade}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Engagement</h3>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Attendance:</strong> {student.attendanceSummary}
          </p>
        </div>
      </div>

      {/* System Suggested Intervention */}
      {showAISuggestion && (
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-white border border-indigo-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-indigo-700 mb-2">
            🤖 System-Suggested Intervention
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            The system detected low academic performance. Consider assigning an
            AI-generated quiz or sending personal feedback.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setOpenQuizModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Generate AI Quiz
            </button>
            <button
              onClick={() => setOpenFeedbackModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Send Feedback
            </button>
          </div>
        </div>
      )}

      {/* Intervention Log */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Intervention Log
        </h3>
        {student.interventionLog.map((log) => (
          <div key={log.id} className="border-b pb-4 mb-3">
            <strong className="text-sm text-gray-900">
              {log.date} - {log.action}
            </strong>
            <p className="text-sm text-gray-700">{log.notes}</p>
          </div>
        ))}
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

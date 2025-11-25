import React, { useState } from "react";

/** Scratch
 * InterventionDashboard.jsx
 *
 * Displays the main "Priority Watchlist" table.
 * Receives the student list and a selection handler from its parent.
 */
function InterventionDashboard({ students, onSelectStudent }) {
  const [filter, setFilter] = useState("All"); // Example filter state

  // In a real app, you'd filter `students` based on the `filter` state
  const filteredStudents = students;

  return (
    <div className="dashboard-container">
      <h2>Priority Watchlist</h2>
      {/* Add filter buttons here */}
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th>Student Name</th>
            <th>Alert Reason</th>
            <th>Priority</th>
            <th>Class</th>
            <th>Last Contact</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr
              key={student.id}
              onClick={() => onSelectStudent(student.id)}
              style={styles.tableRow}
              className="student-row"
            >
              <td style={styles.cell}>{student.name}</td>
              <td style={styles.cell}>{student.alertReason}</td>
              <td style={styles.cell}>
                <span style={getPriorityStyle(student.priority)}>
                  {student.priority}
                </span>
              </td>
              <td style={styles.cell}>{student.subject}</td>
              <td style={styles.cell}>{student.lastInterventionDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Basic Styling ---
const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
  tableHeader: {
    backgroundColor: "#f9f9f9",
    textAlign: "left",
  },
  cell: {
    padding: "12px 8px",
    borderBottom: "1px solid #ddd",
  },
  tableRow: {
    cursor: "pointer",
  },
};

// Helper function for styling priority tags
const getPriorityStyle = (priority) => {
  const baseStyle = {
    padding: "4px 8px",
    borderRadius: "12px",
    color: "white",
    fontWeight: "bold",
  };
  switch (priority) {
    case "High":
      return { ...baseStyle, backgroundColor: "#d9534f" }; // Red
    case "Medium":
      return { ...baseStyle, backgroundColor: "#f0ad4e" }; // Orange
    case "Low":
      return { ...baseStyle, backgroundColor: "#5bc0de" }; // Blue
    default:
      return baseStyle;
  }
};

export default InterventionDashboard;
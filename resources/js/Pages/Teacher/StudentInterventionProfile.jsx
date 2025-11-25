import React, { useState, useEffect } from "react";

// Import mock data (in a real app, this would be an API call)
import { mockStudentList } from "../../../data/mockInterventionData";

/**
 * StudentInterventionProfile.jsx
 *
 * Displays the detailed "deep dive" view for a single student.
 * It "fetches" its own data based on the studentId prop.
 */
function StudentInterventionProfile({ studentId, onBack }) {
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // "Fetch" the specific student's details when the ID changes
  useEffect(() => {
    setIsLoading(true);
    // Simulate an API call
    setTimeout(() => {
      setStudent(mockStudentDetails[studentId]);
      setIsLoading(false);
    }, 300); // 0.3 second delay
  }, [studentId]);

  if (isLoading) {
    return <div>Loading Student Profile...</div>;
  }

  if (!student) {
    return <div>Student not found.</div>;
  }

  return (
    <div style={styles.profileContainer}>
      <button onClick={onBack} style={styles.backButton}>
        &larr; Back to Dashboard
      </button>

      {/* --- 1. Student Snapshot --- */}
      <div style={styles.snapshot}>
        <div style={styles.snapshotInfo}>
          <h2>{student.name}</h2>
          <div>
            {student.specialPrograms.map((program) => (
              <span key={program} style={styles.badge}>
                {program}
              </span>
            ))}
          </div>
          <p>
            <strong>Parent Contact:</strong> {student.parentContact}
          </p>
          <p>
            <strong>Counselor:</strong> {student.counselor}
          </p>
        </div>
      </div>

      {/* --- 2. Vitals (Academic & Engagement) --- */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Academic Vitals</h3>
          <p>
            <strong>Current Grade:</strong>{" "}
            <span style={styles.grade}>{student.currentGrade}</span>
          </p>
          <strong>Missing Assignments:</strong>
          <ul>
            {student.missingAssignments.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </div>

        <div style={styles.card}>
          <h3>Engagement Vitals</h3>
          <p>
            <strong>Attendance:</strong> {student.attendanceSummary}
          </p>
          <strong>Behavior Log:</strong>
          {student.behaviorLog.length > 0 ? (
            <ul>
              {student.behaviorLog.map((item) => (
                <li key={item.id}>
                  <strong>{item.date}:</strong> {item.report}
                </li>
              ))}
            </ul>
          ) : (
            <p>No behavior reports.</p>
          )}
        </div>
      </div>

      {/* --- 3. Intervention Log (Action Area) --- */}
      <div style={styles.logSection}>
        <h3>Intervention & Communication Log</h3>
        
        {/* New Log Form (This would be its own component) */}
        <form style={styles.logForm}>
          <h4>Log New Intervention</h4>
          <select style={styles.input}>
            <option>Parent Emailed</option>
            <option>1-on-1 Conference</option>
            <option>Referred to Counselor</option>
            <option>Other</option>
          </select>
          <textarea
            style={styles.textarea}
            placeholder="Add notes..."
          ></textarea>
          <label>
            Set Follow-up Date:
            <input type="date" style={styles.input} />
          </label>
          <button type="submit" style={styles.logButton}>
            Save Log
          </button>
        </form>

        {/* Log History */}
        <div style={styles.logHistory}>
          <h4>History</h4>
          {student.interventionLog.map((log) => (
            <div key={log.id} style={styles.logEntry}>
              <strong>{log.date} - {log.action}</strong>
              <p>{log.notes}</p>
              {log.followUp && <small>Follow-up: {log.followUp}</small>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Basic Styling ---
const styles = {
  profileContainer: { padding: "10px" },
  backButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#007bff",
    cursor: "pointer",
    fontSize: "16px",
    marginBottom: "15px",
  },
  snapshot: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: "20px",
    borderRadius: "8px",
  },
  snapshotInfo: { flex: 1, paddingLeft: "20px" },
  badge: {
    backgroundColor: "#f0ad4e",
    color: "white",
    padding: "4px 8px",
    borderRadius: "12px",
    marginRight: "5px",
    fontSize: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginTop: "20px",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "16px",
  },
  grade: { fontSize: "24px", fontWeight: "bold", color: "#d9534f" },
  logSection: { marginTop: "20px" },
  logForm: {
    backgroundColor: "#fdfdfd",
    border: "1px solid #eee",
    borderRadius: "8px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: { padding: "8px", border: "1px solid #ccc", borderRadius: "4px" },
  textarea: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    minHeight: "80px",
  },
  logButton: {
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  },
  logHistory: { marginTop: "20px" },
  logEntry: {
    borderBottom: "1px solid #eee",
    padding: "10px 0",
  },
};

export default StudentInterventionProfile;
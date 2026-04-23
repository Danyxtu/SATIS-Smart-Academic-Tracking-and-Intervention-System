const GRID_ROWS = 5;
const GRID_COLS = 10;
export const buildSeatLayout = (students, existingLayout = null) => {
    const totalSeats = GRID_ROWS * GRID_COLS;
    const studentIds = students.map((s) => s.id);

    if (existingLayout && Array.isArray(existingLayout)) {
        // Use existing layout but filter out students who are no longer enrolled
        // and find students who are newly enrolled.
        const layout = existingLayout.map((seat) => {
            const studentId = studentIds.includes(seat.studentId)
                ? seat.studentId
                : null;
            return { ...seat, studentId };
        });

        // Find students who are not in the layout yet
        const assignedStudentIds = layout
            .map((s) => s.studentId)
            .filter((id) => id !== null);
        const unassignedStudentIds = studentIds.filter(
            (id) => !assignedStudentIds.includes(id),
        );

        // Fill empty seats with unassigned students
        let unassignedIndex = 0;
        const finalLayout = layout.map((seat) => {
            if (seat.studentId === null && unassignedIndex < unassignedStudentIds.length) {
                return { ...seat, studentId: unassignedStudentIds[unassignedIndex++] };
            }
            return seat;
        });

        return finalLayout;
    }

    const assignments = [...studentIds];

    while (assignments.length < totalSeats) {
        assignments.push(null);
    }

    return assignments.map((studentId, index) => ({
        row: Math.floor(index / GRID_COLS) + 1,
        col: (index % GRID_COLS) + 1,
        studentId,
    }));
};

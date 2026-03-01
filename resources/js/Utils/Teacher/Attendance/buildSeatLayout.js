export const buildSeatLayout = (students) => {
    const totalSeats = GRID_ROWS * GRID_COLS;
    const assignments = students.map((student) => student.id);

    while (assignments.length < totalSeats) {
        assignments.push(null);
    }

    return assignments.map((studentId, index) => ({
        row: Math.floor(index / GRID_COLS) + 1,
        col: (index % GRID_COLS) + 1,
        studentId,
    }));
};

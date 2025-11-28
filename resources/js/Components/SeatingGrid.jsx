import SeatCard from "./SeatCard";
import EmptySeatCard from "./EmptySeatCard";

const SeatingGrid = ({
    students,
    seatLayout,
    onClick,
    isDraggingEnabled,
    onSeatDrop,
}) => {
    const handleDragOver = (e) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = (e, targetRow, targetCol) => {
        e.preventDefault();
        const seatDataString = e.dataTransfer.getData("seat-data");
        if (seatDataString && isDraggingEnabled) {
            const draggedSeatInfo = JSON.parse(seatDataString);
            onSeatDrop(draggedSeatInfo, { row: targetRow, col: targetCol });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center text-sm font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded-lg py-3 mb-8">
                Teacher's Desk / Front of Classroom
            </div>
            <div
                className="grid gap-x-2 gap-y-4"
                style={{ gridTemplateColumns: "repeat(11, 1fr)" }}
                onDragOver={isDraggingEnabled ? handleDragOver : null}
            >
                {seatLayout.map((seat) => {
                    const student = seat.studentId
                        ? students.find((s) => s.id === seat.studentId)
                        : null;
                    // Adjust column for visual spacing in grid, assuming 10 cols + 1 for middle aisle
                    const gridCol = seat.col > 5 ? seat.col + 1 : seat.col;

                    if (student) {
                        return (
                            <SeatCard
                                key={student.id}
                                student={student}
                                onClick={() => onClick(student.id)}
                                seatRow={seat.row}
                                seatCol={gridCol}
                                isDraggingEnabled={isDraggingEnabled}
                                onDrop={handleDrop}
                            />
                        );
                    } else {
                        return (
                            <EmptySeatCard
                                key={`empty-${seat.row}-${seat.col}`}
                                seatRow={seat.row}
                                seatCol={gridCol}
                                isDraggingEnabled={isDraggingEnabled}
                                onDrop={handleDrop}
                            />
                        );
                    }
                })}
            </div>
        </div>
    );
};

export default SeatingGrid;

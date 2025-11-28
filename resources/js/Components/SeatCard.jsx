const SeatCard = ({
    student,
    onClick,
    seatRow,
    seatCol,
    isDraggingEnabled,
    onDrop,
}) => {
    const statusStyles = {
        present: "bg-green-100 border-green-400 text-green-800",
        absent: "bg-red-100 border-red-400 text-red-800 opacity-60",
        late: "bg-yellow-100 border-yellow-400 text-yellow-800",
    };

    const handleDragStart = (e) => {
        if (!isDraggingEnabled) return;

        const payload = {
            studentId: student.id,
            row: seatRow,
            col: seatCol > 5 ? seatCol - 1 : seatCol, // fix aisle offset when reversing
        };

        e.dataTransfer.setData("seat-data", JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "move";
    };

    return (
        <div
            draggable={isDraggingEnabled}
            onDragStart={handleDragStart}
            onDrop={(e) =>
                onDrop(e, seatRow, seatCol > 5 ? seatCol - 1 : seatCol)
            }
            onDragOver={(e) => isDraggingEnabled && e.preventDefault()}
            className={`
                relative rounded-lg border p-3 flex flex-col items-center justify-center cursor-pointer
                transition-transform hover:scale-105 select-none
                ${statusStyles[student.status]}
            `}
            style={{
                gridColumn: seatCol,
            }}
            onClick={() => {
                if (!isDraggingEnabled) onClick(student.id);
            }}
        >
            <img
                src={student.avatar}
                alt={student.name}
                className="w-12 h-12 rounded-full mb-2"
            />
            <p className="text-sm font-semibold">{student.name}</p>
            <p className="text-xs opacity-80 capitalize">{student.status}</p>
        </div>
    );
};

export default SeatCard;

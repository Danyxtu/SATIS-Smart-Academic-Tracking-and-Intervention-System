const EmptySeatCard = ({ seatRow, seatCol, isDraggingEnabled, onDrop }) => {
    return (
        <div
            onDrop={(e) =>
                onDrop(e, seatRow, seatCol > 5 ? seatCol - 1 : seatCol)
            }
            onDragOver={(e) => isDraggingEnabled && e.preventDefault()}
            style={{
                gridColumn: seatCol,
            }}
            className="border border-dashed border-gray-400 rounded-lg h-20 flex items-center justify-center text-gray-400"
        >
            Empty
        </div>
    );
};

export default EmptySeatCard;

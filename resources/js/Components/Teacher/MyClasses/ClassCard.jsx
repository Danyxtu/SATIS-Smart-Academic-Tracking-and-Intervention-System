import { Users, Book, Megaphone, Loader2, Pencil, Trash2 } from "lucide-react";

const ClassCard = ({
    handleClassSelect,
    cls,
    colors,
    onSendNudge,
    onEditClass,
    onDeleteClass,
    isLoading = false,
}) => {
    const className = cls?.name?.trim?.() ?? cls?.name ?? "";
    const classSection = cls?.section?.trim?.() ?? cls?.section ?? "";
    const badgeLabel = className || classSection || "Class";

    const handleNudgeClick = (e) => {
        e.stopPropagation();
        if (onSendNudge) {
            onSendNudge(cls);
        }
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        if (onEditClass) {
            onEditClass(cls);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (onDeleteClass) {
            onDeleteClass(cls);
        }
    };

    return (
        <div
            className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md hover:border-indigo-300 group ${isLoading ? "opacity-75" : ""}`}
        >
            <button
                onClick={() => handleClassSelect(cls)}
                className="w-full p-4 text-left"
                disabled={isLoading}
            >
                {/* Header with grade tag and icon */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <span
                            className={`${colors.bg} ${colors.text} px-2.5 py-1 rounded-md text-xs font-semibold inline-block`}
                        >
                            {className || "Class"}
                        </span>
                    </div>
                    {isLoading ? (
                        <Loader2
                            className={`${colors.icon} animate-spin flex-shrink-0 ml-2`}
                            size={20}
                        />
                    ) : (
                        <Book
                            className={`${colors.icon} flex-shrink-0 ml-2`}
                            size={20}
                        />
                    )}
                </div>

                {/* Subject */}
                <div className="mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Subject
                    </p>
                    <p
                        className="text-sm text-gray-800 font-semibold truncate"
                        title={cls.subject || cls.subject_name}
                    >
                        {cls.subject || cls.subject_name || "N/A"}
                    </p>
                </div>

                {/* Grade and section */}
                <div className="mb-3 grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">
                            Grade
                        </p>
                        <p className="text-xs font-semibold text-gray-800 truncate">
                            {className || "N/A"}
                        </p>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">
                            Section
                        </p>
                        <p className="text-xs font-semibold text-gray-800 truncate">
                            {classSection || badgeLabel || "N/A"}
                        </p>
                    </div>
                </div>

                {/* Student count */}
                <div className="flex items-center text-gray-600 mt-3 pt-3 border-t border-gray-100">
                    <Users size={14} className="mr-1.5 flex-shrink-0" />
                    <span className="text-xs font-medium">
                        {cls.student_count ?? 0} Student
                        {cls.student_count !== 1 ? "s" : ""}
                    </span>
                </div>
            </button>

            {/* Actions */}
            <div className="px-4 pb-3 border-t border-gray-100 pt-3 flex items-center gap-2">
                <button
                    onClick={handleNudgeClick}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors text-xs font-medium"
                >
                    <Megaphone size={14} />
                    Nudge
                </button>
                <button
                    onClick={handleEditClick}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                    title="Edit class"
                >
                    <Pencil size={14} />
                </button>
                <button
                    onClick={handleDeleteClick}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-md transition-colors"
                    title="Delete class"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

export default ClassCard;

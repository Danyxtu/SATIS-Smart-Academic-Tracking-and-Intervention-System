import { Users, Book, Megaphone, Loader2 } from "lucide-react";

const normalizeLabel = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase();
};

const ClassCard = ({
    handleClassSelect,
    cls,
    colors,
    onSendNudge,
    isLoading = false,
}) => {
    const className = cls?.name?.trim?.() ?? cls?.name ?? "";
    const classSection = cls?.section?.trim?.() ?? cls?.section ?? "";
    const badgeLabel = className || classSection || "Class";
    const showSectionLine =
        Boolean(classSection) &&
        normalizeLabel(className) !== normalizeLabel(classSection);

    const handleNudgeClick = (e) => {
        e.stopPropagation();
        if (onSendNudge) {
            onSendNudge(cls);
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
                {/* Header with badge and icon */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <span
                            className={`${colors.bg} ${colors.text} px-2.5 py-1 rounded-md text-xs font-semibold inline-block`}
                        >
                            {badgeLabel}
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

                {/* Class section/name */}
                {showSectionLine && (
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                        {classSection}
                    </h3>
                )}

                {/* Subject */}
                <p
                    className="text-sm text-gray-700 font-medium mb-2 truncate"
                    title={cls.subject}
                >
                    {cls.subject}
                </p>

                {/* Strand/Track */}
                {(cls.strand || cls.track) && (
                    <p className="text-xs text-gray-500 mb-3 truncate">
                        {[cls.strand, cls.track].filter(Boolean).join(" • ")}
                    </p>
                )}

                {/* Student count */}
                <div className="flex items-center text-gray-600 mt-3 pt-3 border-t border-gray-100">
                    <Users size={14} className="mr-1.5 flex-shrink-0" />
                    <span className="text-xs font-medium">
                        {cls.student_count ?? 0} Student
                        {cls.student_count !== 1 ? "s" : ""}
                    </span>
                </div>
            </button>

            {/* Send Nudge Button */}
            <div className="px-4 pb-3 border-t border-gray-100">
                <button
                    onClick={handleNudgeClick}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors text-xs font-medium"
                >
                    <Megaphone size={14} />
                    Send Nudge
                </button>
            </div>
        </div>
    );
};

export default ClassCard;

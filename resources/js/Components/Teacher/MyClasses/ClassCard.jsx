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
            className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl hover:scale-105 group ${isLoading ? "opacity-75" : ""}`}
        >
            <button
                onClick={() => handleClassSelect(cls)}
                className="w-full p-6 text-left"
                disabled={isLoading}
            >
                <div className="flex items-center justify-between mb-4">
                    <span
                        className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-sm font-medium`}
                    >
                        {badgeLabel}
                    </span>
                    {isLoading ? (
                        <Loader2 className={`${colors.icon} animate-spin`} />
                    ) : (
                        <Book className={colors.icon} />
                    )}
                </div>
                {showSectionLine && (
                    <h2 className="text-2xl font-bold text-gray-900">
                        {classSection}
                    </h2>
                )}
                <p className="text-gray-600 text-lg">{cls.subject}</p>
                {(cls.strand || cls.track) && (
                    <p className="text-sm text-gray-500 mt-1">
                        {[cls.strand, cls.track].filter(Boolean).join(" • ")}
                    </p>
                )}
                <div className="flex items-center text-gray-500 mt-6">
                    <Users size={16} className="mr-2" />
                    <span className="text-sm font-medium">
                        {cls.student_count ?? 0} Students
                    </span>
                </div>
            </button>

            {/* Send Nudge Button */}
            <div className="px-6 pb-4">
                <button
                    onClick={handleNudgeClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 rounded-lg transition-all text-sm font-medium border border-indigo-100 hover:border-indigo-200"
                >
                    <Megaphone size={16} />
                    Send Nudge
                </button>
            </div>
        </div>
    );
};

export default ClassCard;

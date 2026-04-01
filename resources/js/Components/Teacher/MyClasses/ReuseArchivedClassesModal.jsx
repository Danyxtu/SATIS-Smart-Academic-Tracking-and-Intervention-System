import {
    AlertTriangle,
    CheckSquare,
    Layers,
    Loader2,
    Square,
    X,
} from "lucide-react";

const getSemesterLabel = (semester) =>
    Number(semester) === 2 ? "2nd Semester" : "1st Semester";

const ReuseArchivedClassesModal = ({
    isOpen,
    classes = [],
    selectedClassIds = [],
    schoolYear,
    semester = 1,
    blockedReason = "",
    error = "",
    isSubmitting = false,
    onToggleClass,
    onSelectAll,
    onClearAll,
    onClose,
    onSubmit,
}) => {
    if (!isOpen) {
        return null;
    }

    const selectedSet = new Set(
        selectedClassIds.map((classId) => Number(classId)),
    );
    const selectedCount = selectedSet.size;
    const totalCount = classes.length;
    const isSubmitDisabled =
        isSubmitting || selectedCount === 0 || Boolean(blockedReason);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-indigo-100 bg-indigo-50 px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-indigo-100 p-2 text-indigo-700">
                            <Layers size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-indigo-900">
                                Use Archived Classes
                            </h3>
                            <p className="mt-1 text-xs text-indigo-700">
                                {schoolYear} • {getSemesterLabel(semester)}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-sm text-gray-700">
                            Selected classes: <strong>{selectedCount}</strong> /{" "}
                            {totalCount}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onSelectAll}
                                className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                                Select all
                            </button>
                            <button
                                type="button"
                                onClick={onClearAll}
                                className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                                Clear all
                            </button>
                        </div>
                    </div>

                    {blockedReason && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                            <div className="flex items-start gap-2">
                                <AlertTriangle
                                    size={15}
                                    className="mt-0.5 text-amber-600"
                                />
                                <p className="text-xs font-medium text-amber-700">
                                    {blockedReason}
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                            <p className="text-xs font-medium text-red-700">
                                {error}
                            </p>
                        </div>
                    )}

                    <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                        {classes.map((cls, index) => {
                            const classId = Number(cls?.id);
                            const isSelected = selectedSet.has(classId);

                            return (
                                <button
                                    key={`${classId}-${index}`}
                                    type="button"
                                    onClick={() => onToggleClass(classId)}
                                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                                        isSelected
                                            ? "border-indigo-300 bg-indigo-50"
                                            : "border-gray-200 bg-white hover:border-gray-300"
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="mt-0.5 text-indigo-600">
                                            {isSelected ? (
                                                <CheckSquare size={16} />
                                            ) : (
                                                <Square size={16} />
                                            )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {cls?.subject || "N/A"}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {cls?.name || "Class"} •{" "}
                                                {cls?.section || "Section N/A"}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Students:{" "}
                                                {cls?.student_count ?? 0}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                        {classes.length === 0 && (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-center">
                                <p className="text-sm text-gray-600">
                                    No archived classes available for this
                                    semester.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={isSubmitDisabled}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting && (
                                <Loader2 size={14} className="animate-spin" />
                            )}
                            Add Selected Classes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReuseArchivedClassesModal;

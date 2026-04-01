import { AlertTriangle, CheckCircle2, Layers, X } from "lucide-react";

const getSemesterLabel = (semester) =>
    Number(semester) === 2 ? "2nd Semester" : "1st Semester";

const ReuseArchivedClassesSummaryModal = ({ isOpen, summary, onClose }) => {
    if (!isOpen || !summary) {
        return null;
    }

    const createdClasses = Array.isArray(summary.created_classes)
        ? summary.created_classes
        : [];
    const skippedDuplicates = Array.isArray(summary.skipped_duplicates)
        ? summary.skipped_duplicates
        : [];
    const skippedMissingIds = Array.isArray(summary.skipped_missing_ids)
        ? summary.skipped_missing_ids
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-emerald-900">
                                Archived Classes Added
                            </h3>
                            <p className="mt-1 text-xs text-emerald-700">
                                {summary.source_school_year} to{" "}
                                {summary.target_school_year} •{" "}
                                {getSemesterLabel(summary.semester)}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">
                                Requested
                            </p>
                            <p className="font-semibold text-gray-900">
                                {summary.requested_count ?? 0}
                            </p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-emerald-600">
                                Added
                            </p>
                            <p className="font-semibold text-emerald-800">
                                {summary.created_count ?? 0}
                            </p>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-amber-600">
                                Existing
                            </p>
                            <p className="font-semibold text-amber-800">
                                {summary.skipped_duplicate_count ?? 0}
                            </p>
                        </div>
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-rose-600">
                                Missing
                            </p>
                            <p className="font-semibold text-rose-800">
                                {summary.skipped_missing_count ?? 0}
                            </p>
                        </div>
                    </div>

                    {createdClasses.length > 0 && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                            <div className="mb-2 flex items-center gap-2">
                                <Layers
                                    size={15}
                                    className="text-emerald-600"
                                />
                                <p className="text-sm font-semibold text-emerald-800">
                                    Added Classes ({createdClasses.length})
                                </p>
                            </div>
                            <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                                {createdClasses.map((item, index) => (
                                    <div
                                        key={`${item?.id ?? index}-${index}`}
                                        className="rounded-md border border-emerald-200 bg-white px-3 py-2"
                                    >
                                        <p className="text-sm font-medium text-gray-900">
                                            {item?.subject || "N/A"}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {item?.grade_level || "Class"} •{" "}
                                            {item?.section || "Section N/A"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {skippedDuplicates.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <div className="mb-2 flex items-center gap-2">
                                <AlertTriangle
                                    size={15}
                                    className="text-amber-600"
                                />
                                <p className="text-sm font-semibold text-amber-800">
                                    Skipped Existing Classes (
                                    {skippedDuplicates.length})
                                </p>
                            </div>
                            <ul className="max-h-40 space-y-1 overflow-y-auto pr-1 text-xs text-amber-800">
                                {skippedDuplicates.map((item, index) => (
                                    <li
                                        key={`${item?.source_id ?? index}-${index}`}
                                        className="rounded-md border border-amber-200 bg-white px-3 py-2"
                                    >
                                        {item?.subject || "N/A"} •{" "}
                                        {item?.grade_level || "Class"} •{" "}
                                        {item?.section || "Section N/A"}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {skippedMissingIds.length > 0 && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                            <p className="text-xs font-medium text-rose-700">
                                Missing class IDs:{" "}
                                {skippedMissingIds.join(", ")}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end border-t border-gray-100 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReuseArchivedClassesSummaryModal;

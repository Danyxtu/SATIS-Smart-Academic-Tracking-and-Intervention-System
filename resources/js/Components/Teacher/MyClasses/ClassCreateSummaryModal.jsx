import { AlertTriangle, CheckCircle2, X } from "lucide-react";

const ClassCreateSummaryModal = ({
    isOpen,
    summary,
    onClose,
    onSaveChanges,
    onSkip,
}) => {
    if (!isOpen || !summary) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-emerald-900">
                                Class Created Successfully
                            </h3>
                            <p className="mt-1 text-xs text-emerald-700">
                                Review your new class details below.
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
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">
                                Grade Level
                            </p>
                            <p className="font-semibold text-gray-900">
                                {summary.grade_level}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">
                                Strand
                            </p>
                            <p className="font-semibold text-gray-900">
                                {summary.strand}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">
                                Section
                            </p>
                            <p className="font-semibold text-gray-900">
                                {summary.section}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">
                                Subject
                            </p>
                            <p className="font-semibold text-gray-900">
                                {summary.subject_name}
                            </p>
                        </div>
                    </div>

                    {summary.duplicate_section && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle
                                    size={16}
                                    className="mt-0.5 text-amber-600"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">
                                        Duplicate Grade + Section Warning
                                    </p>
                                    <p className="mt-1 text-xs text-amber-700">
                                        The combination of {summary.grade_level}{" "}
                                        and {summary.section} already exists in
                                        your class list. Please verify the
                                        subject details before proceeding.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                        {summary.duplicate_section ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onSkip || onClose}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Keep as Correct
                                </button>
                                <button
                                    type="button"
                                    onClick={onSaveChanges || onClose}
                                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                                >
                                    Review and Edit
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Okay
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassCreateSummaryModal;

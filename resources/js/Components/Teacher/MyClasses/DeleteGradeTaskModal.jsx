import { useEffect, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

const DeleteGradeTaskModal = ({
    isOpen,
    categoryLabel,
    taskLabel,
    gradedStudentCount = 0,
    requiresTypedConfirmation = false,
    isSubmitting = false,
    onClose,
    onConfirm,
}) => {
    const [confirmationText, setConfirmationText] = useState("");

    useEffect(() => {
        if (isOpen) {
            setConfirmationText("");
        }
    }, [isOpen, taskLabel]);

    if (!isOpen) {
        return null;
    }

    const typedConfirmationValid =
        !requiresTypedConfirmation ||
        confirmationText.trim().toLowerCase() === "yes";

    const handleConfirm = () => {
        if (!typedConfirmationValid || isSubmitting) {
            return;
        }

        onConfirm?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-full bg-red-100 p-2 text-red-600">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-red-800">
                                Delete Activity
                            </h3>
                            <p className="text-xs text-red-700">
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-full p-1.5 text-red-500 transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close delete activity modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-3 p-4">
                    <p className="text-sm text-gray-700">
                        You are about to delete <strong>{taskLabel}</strong>{" "}
                        from <strong>{categoryLabel}</strong>.
                    </p>

                    {requiresTypedConfirmation ? (
                        <>
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                {gradedStudentCount} student row(s) already have
                                score(s) in this activity. Deleting this
                                activity will permanently remove those grades
                                for this quarter.
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                                    Type YES to confirm permanent deletion
                                </label>
                                <input
                                    type="text"
                                    value={confirmationText}
                                    onChange={(event) =>
                                        setConfirmationText(event.target.value)
                                    }
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-300"
                                    placeholder="Type YES"
                                    autoComplete="off"
                                />
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-gray-500">
                            No scores were found for this activity.
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!typedConfirmationValid || isSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Trash2 size={14} />
                        {isSubmitting
                            ? "Deleting..."
                            : requiresTypedConfirmation
                              ? "Delete Activity and Grades"
                              : "Delete Activity"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteGradeTaskModal;

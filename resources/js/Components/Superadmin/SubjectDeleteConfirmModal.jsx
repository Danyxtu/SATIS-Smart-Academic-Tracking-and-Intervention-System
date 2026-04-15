import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Copy } from "lucide-react";
import Modal from "@/Components/Modal";

export default function SubjectDeleteConfirmModal({
    show,
    onClose,
    onConfirm,
    subjectName = "",
    blockedReason = "",
    error = "",
    deleting = false,
}) {
    const [confirmationValue, setConfirmationValue] = useState("");
    const [copyStatus, setCopyStatus] = useState("idle");

    const expectedName = useMemo(
        () => String(subjectName || "").trim(),
        [subjectName],
    );

    const isMatch =
        expectedName !== "" && confirmationValue.trim() === expectedName;
    const canConfirm =
        Boolean(expectedName) && isMatch && !blockedReason && !deleting;

    useEffect(() => {
        if (!show) {
            return;
        }

        setConfirmationValue("");
        setCopyStatus("idle");
    }, [show, expectedName]);

    const handleCopyName = async () => {
        if (!expectedName) {
            return;
        }

        try {
            if (typeof navigator === "undefined" || !navigator.clipboard) {
                throw new Error("Clipboard unavailable");
            }

            await navigator.clipboard.writeText(expectedName);
            setCopyStatus("copied");
            window.setTimeout(() => setCopyStatus("idle"), 1600);
        } catch {
            setCopyStatus("error");
            window.setTimeout(() => setCopyStatus("idle"), 2000);
        }
    };

    return (
        <Modal
            show={show}
            onClose={onClose}
            maxWidth="lg"
            closeable={!deleting}
        >
            <div className="border-b border-rose-200 bg-rose-50 px-5 py-4">
                <p className="text-sm font-semibold text-rose-800">
                    Delete Subject
                </p>
                <p className="mt-1 text-xs text-rose-700">
                    This action is permanent. Copy and re-enter the exact
                    subject name to continue.
                </p>
            </div>

            <div className="space-y-4 px-5 py-4">
                {blockedReason && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        {blockedReason}
                    </div>
                )}

                {error && (
                    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {error}
                    </div>
                )}

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Subject Name
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <p className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-mono font-semibold text-slate-800">
                            {expectedName || "-"}
                        </p>
                        <button
                            type="button"
                            onClick={handleCopyName}
                            disabled={!expectedName}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {copyStatus === "copied" ? (
                                <Check size={13} />
                            ) : (
                                <Copy size={13} />
                            )}
                            {copyStatus === "copied" ? "Copied" : "Copy"}
                        </button>
                    </div>
                    {copyStatus === "error" && (
                        <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-700">
                            <AlertTriangle size={12} />
                            Unable to copy. Please type manually.
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Type subject name to confirm deletion
                    </label>
                    <input
                        type="text"
                        value={confirmationValue}
                        onChange={(event) =>
                            setConfirmationValue(event.target.value)
                        }
                        disabled={deleting || Boolean(blockedReason)}
                        placeholder="Paste or type the exact subject name"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                    {confirmationValue && !isMatch && (
                        <p className="mt-1 text-[11px] text-rose-600">
                            Subject name does not match.
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={deleting}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={!canConfirm}
                    className="rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {deleting ? "Deleting..." : "Delete Subject"}
                </button>
            </div>
        </Modal>
    );
}

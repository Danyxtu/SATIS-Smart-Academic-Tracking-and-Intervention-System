import { X, Trash2, AlertTriangle } from "lucide-react";

/**
 * DeleteConfirmModal
 *
 * A reusable confirmation modal for delete actions.
 *
 * Props:
 * - isOpen        {boolean}  - Controls visibility of the modal
 * - onClose       {function} - Called when the modal should close (cancel / backdrop click)
 * - onConfirm     {function} - Called when the user confirms the delete action
 * - title         {string}   - Modal heading (default: "Delete Item")
 * - description   {string}   - Descriptive warning message shown to the user
 * - itemName      {string}   - The name of the item being deleted (shown in bold)
 * - isLoading     {boolean}  - Optional: disables buttons while a delete request is in-flight
 *
 * Usage example:
 *   <DeleteConfirmModal
 *     isOpen={showDeleteModal}
 *     onClose={() => setShowDeleteModal(false)}
 *     onConfirm={handleConfirmDelete}
 *     title="Delete Department"
 *     itemName={departmentToDelete?.department_name}
 *     description="This will permanently remove the department and cannot be undone."
 *   />
 */
export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Item",
    description = "This action cannot be undone.",
    itemName,
    isLoading = false,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md transform rounded-2xl bg-white shadow-2xl transition-all">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-rose-500 to-red-600 px-6 py-6">
                        {/* Decorative blobs */}
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="absolute top-3 z-10 right-3 rounded-xl p-3 text-white/80 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>

                        {/* Icon + Title */}
                        <div className="relative flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                <Trash2 className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {title}
                                </h2>
                                <p className="text-sm text-rose-100 mt-0.5">
                                    This action is irreversible
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5">
                        {/* Warning banner */}
                        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 mb-5">
                            <AlertTriangle
                                size={18}
                                className="text-rose-500 mt-0.5 shrink-0"
                            />
                            <p className="text-sm text-rose-700 leading-relaxed">
                                {description}
                            </p>
                        </div>

                        {/* Item name highlight */}
                        {itemName && (
                            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                    Item to be deleted
                                </p>
                                <p className="font-semibold text-slate-800 text-sm">
                                    {itemName}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {isLoading ? (
                                <>
                                    <svg
                                        className="animate-spin h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"
                                        />
                                    </svg>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={15} />
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

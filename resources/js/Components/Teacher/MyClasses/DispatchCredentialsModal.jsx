import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { Mail, AlertTriangle, X } from "lucide-react";

const DispatchCredentialsModal = ({
    isOpen,
    onClose,
    classId,
    studentCount,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            `/teacher/classes/${classId}/dispatch-credentials`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                },
                onError: () => {
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            }
        );
    };

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                    disabled={isSubmitting}
                >
                    <X size={18} />
                </button>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <AlertTriangle
                                    size={28}
                                    className="text-amber-600 dark:text-amber-500"
                                />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                            Send Login Credentials?
                        </h3>

                        {/* Description */}
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                You are about to send login credentials to all <span className="font-bold text-indigo-600 dark:text-indigo-400">{studentCount}</span> students in this class.
                            </p>
                            
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                <div className="flex gap-2">
                                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 dark:text-amber-400">
                                        This action will <span className="font-bold">reset existing passwords</span> for all students and send them new ones via their registered personal email.
                                    </p>
                                </div>
                            </div>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-500 text-center italic">
                                This process runs in the background. You will receive an email report once all credentials have been dispatched.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
                        >
                            <Mail size={16} />
                            {isSubmitting ? "Sending..." : "Yes, Send Credentials"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DispatchCredentialsModal;

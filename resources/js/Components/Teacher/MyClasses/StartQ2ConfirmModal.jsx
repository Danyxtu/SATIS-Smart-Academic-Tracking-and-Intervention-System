import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { AlertTriangle, Lock, Eye, EyeOff, X } from "lucide-react";

/**
 * Modal that confirms whether the teacher wants to start Quarter 2.
 *
 * - If Q1 already has quarterly-exam scores → simple confirmation (no password).
 * - If Q1 does NOT have quarterly-exam scores → warns the teacher and requires
 *   their password to proceed.
 */
const StartQ2ConfirmModal = ({
    isOpen,
    onClose,
    classId,
    hasQuarterlyExam,
    onSuccess,
}) => {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        // If no quarterly exam scores exist, password is required
        if (!hasQuarterlyExam && !password.trim()) {
            setError("Please enter your password to confirm.");
            return;
        }

        setIsSubmitting(true);

        const payload = { quarter: 2 };
        if (!hasQuarterlyExam) {
            payload.password = password;
        }

        router.post(`/teacher/classes/${classId}/quarter`, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                setPassword("");
                onSuccess?.();
                onClose();
            },
            onError: (errors) => {
                setIsSubmitting(false);
                if (errors.password) {
                    setError(errors.password);
                } else {
                    setError("Something went wrong. Please try again.");
                }
            },
        });
    };

    const handleClose = () => {
        if (isSubmitting) return;
        setPassword("");
        setError("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition"
                >
                    <X size={18} />
                </button>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div
                                className={`p-3 rounded-full ${
                                    hasQuarterlyExam
                                        ? "bg-emerald-100"
                                        : "bg-amber-100"
                                }`}
                            >
                                {hasQuarterlyExam ? (
                                    <AlertTriangle
                                        size={28}
                                        className="text-emerald-600"
                                    />
                                ) : (
                                    <AlertTriangle
                                        size={28}
                                        className="text-amber-600"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                            Start Quarter 2?
                        </h3>

                        {/* Description */}
                        {hasQuarterlyExam ? (
                            <p className="text-sm text-gray-600 text-center mb-6">
                                Are you sure you want to start Quarter 2? This
                                will allow you to view Q2 grades and begin
                                entering Q2 data.
                            </p>
                        ) : (
                            <div className="mb-6">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-amber-800 font-medium mb-1">
                                        ⚠️ No quarterly exam scores found
                                    </p>
                                    <p className="text-xs text-amber-700">
                                        Quarter 1 does not have any quarterly
                                        exam grades yet. Are you sure you want
                                        to start Q2 without having a quarterly
                                        grade? Students won't receive a
                                        transmuted Q1 grade without it.
                                    </p>
                                </div>

                                <p className="text-sm text-gray-600 text-center mb-3">
                                    To proceed, please enter your password to
                                    confirm.
                                </p>

                                {/* Password input */}
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError("");
                                        }}
                                        placeholder="Enter your password"
                                        className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                                            error
                                                ? "border-red-300 focus:ring-red-200"
                                                : "border-gray-300 focus:ring-indigo-200 focus:border-indigo-400"
                                        }`}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={16} />
                                        ) : (
                                            <Eye size={16} />
                                        )}
                                    </button>
                                </div>

                                {/* Error message */}
                                {error && (
                                    <p className="mt-2 text-xs text-red-600">
                                        {error}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                (!hasQuarterlyExam && !password.trim())
                            }
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${
                                hasQuarterlyExam
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-amber-600 hover:bg-amber-700"
                            }`}
                        >
                            {isSubmitting
                                ? "Starting..."
                                : "Yes, Start Quarter 2"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StartQ2ConfirmModal;

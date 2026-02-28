import React from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

const GradeSubmissionModal = ({ isOpen, onClose, status, message }) => {
    if (!isOpen) return null;

    const isSuccess = status === "success";
    const isError = status === "error";

    const getStatusConfig = () => {
        if (isSuccess) {
            return {
                icon: CheckCircle,
                iconBgColor: "bg-green-100",
                iconColor: "text-green-600",
                title: "Grades Submitted Successfully!",
                titleColor: "text-green-900",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
                buttonColor: "bg-green-600 hover:bg-green-700",
            };
        }

        if (isError) {
            return {
                icon: XCircle,
                iconBgColor: "bg-red-100",
                iconColor: "text-red-600",
                title: "Failed to Submit Grades",
                titleColor: "text-red-900",
                bgColor: "bg-red-50",
                borderColor: "border-red-200",
                buttonColor: "bg-red-600 hover:bg-red-700",
            };
        }

        // Default/loading state
        return {
            icon: null,
            iconBgColor: "bg-gray-100",
            iconColor: "text-gray-600",
            title: "Processing...",
            titleColor: "text-gray-900",
            bgColor: "bg-gray-50",
            borderColor: "border-gray-200",
            buttonColor: "bg-gray-600 hover:bg-gray-700",
        };
    };

    const config = getStatusConfig();
    const IconComponent = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md">
                <div
                    className={`relative rounded-2xl bg-white p-6 shadow-2xl border-2 ${config.borderColor}`}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Content */}
                    <div className="text-center">
                        {/* Icon */}
                        <div
                            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${config.iconBgColor}`}
                        >
                            {IconComponent ? (
                                <IconComponent
                                    size={32}
                                    className={config.iconColor}
                                />
                            ) : (
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"></div>
                            )}
                        </div>

                        {/* Title */}
                        <h3
                            className={`mb-3 text-xl font-bold ${config.titleColor}`}
                        >
                            {config.title}
                        </h3>

                        {/* Message */}
                        {message && (
                            <p className="mb-6 text-gray-600 text-sm leading-relaxed">
                                {message}
                            </p>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={onClose}
                            className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${config.buttonColor}`}
                        >
                            {isError ? "Try Again" : "Continue"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradeSubmissionModal;

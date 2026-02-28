import { useState } from "react";
import { router } from "@inertiajs/react";
import {
    X,
    Send,
    Megaphone,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import showToast from "@/Utils/toast";

const DEFAULT_MESSAGES = [
    "Keep up the great work! 💪 Remember to stay on top of your assignments and don't hesitate to reach out if you need help.",
    "Just a friendly reminder to review your notes and prepare for upcoming activities. You've got this! 🌟",
    "Stay focused and keep pushing forward! Your effort today shapes your success tomorrow. 📚",
    "Hi class! Make sure to complete any pending tasks and come prepared for our next session. 👍",
];

const SendNudgeModal = ({ isOpen, onClose, subject }) => {
    const [message, setMessage] = useState(DEFAULT_MESSAGES[0]);
    const [customMessage, setCustomMessage] = useState("");
    const [useCustom, setUseCustom] = useState(false);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleSend = () => {
        const finalMessage = useCustom ? customMessage.trim() : message;

        if (!finalMessage) {
            showToast.error("Please enter a message.");
            return;
        }

        setIsSending(true);

        router.post(
            route("teacher.classes.nudge", subject.id),
            { message: finalMessage },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = page.props?.flash;
                    if (flash?.success) {
                        showToast.success(flash.success);
                    } else if (flash?.error) {
                        showToast.error(flash.error);
                    } else {
                        showToast.success("Nudge sent successfully!");
                    }
                    setIsSending(false);
                    handleClose();
                },
                onError: (errors) => {
                    showToast.error(
                        errors.message ||
                            "Failed to send nudge. Please try again."
                    );
                    setIsSending(false);
                },
            }
        );
    };

    const handleClose = () => {
        setMessage(DEFAULT_MESSAGES[0]);
        setCustomMessage("");
        setUseCustom(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Megaphone className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    Send Nudge
                                </h2>
                                <p className="text-sm text-white/80">
                                    {subject?.name} • {subject?.section}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white/80 hover:text-white transition-colors p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                        Send an encouraging message to all{" "}
                        <span className="font-semibold">
                            {subject?.student_count ?? 0}
                        </span>{" "}
                        students in this class.
                    </p>

                    {/* Message Type Toggle */}
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={() => setUseCustom(false)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                !useCustom
                                    ? "bg-indigo-100 text-indigo-700 font-medium dark:bg-indigo-900 dark:text-indigo-200"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                        >
                            Quick Messages
                        </button>
                        <button
                            onClick={() => setUseCustom(true)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                useCustom
                                    ? "bg-indigo-100 text-indigo-700 font-medium dark:bg-indigo-900 dark:text-indigo-200"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                        >
                            Custom Message
                        </button>
                    </div>

                    {!useCustom ? (
                        /* Pre-built Messages */
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {DEFAULT_MESSAGES.map((msg, index) => (
                                <button
                                    key={index}
                                    onClick={() => setMessage(msg)}
                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm ${
                                        message === msg
                                            ? "border-indigo-500 bg-indigo-50"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {msg}
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Custom Message Textarea */
                        <div>
                            <textarea
                                value={customMessage}
                                onChange={(e) =>
                                    setCustomMessage(e.target.value)
                                }
                                placeholder="Type your custom message here..."
                                maxLength={500}
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-0 resize-none text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">
                                {customMessage.length}/500 characters
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex items-center justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={
                            isSending ||
                            (!useCustom && !message) ||
                            (useCustom && !customMessage.trim())
                        }
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send to All Students
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendNudgeModal;

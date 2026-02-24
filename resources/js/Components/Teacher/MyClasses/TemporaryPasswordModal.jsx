import { useState } from "react";
import { X, Copy, Check, Key, AlertTriangle, User, Mail } from "lucide-react";

const TemporaryPasswordModal = ({ studentInfo, onClose }) => {
    const [copied, setCopied] = useState(false);

    if (!studentInfo) return null;

    const { name, email, lrn, password } = studentInfo;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleCopyAll = async () => {
        const credentials = `Student: ${name}\nEmail: ${email}\nLRN: ${
            lrn || "N/A"
        }\nTemporary Password: ${password}`;
        try {
            await navigator.clipboard.writeText(credentials);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Key className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    Student Created!
                                </h3>
                                <p className="text-emerald-100 text-sm">
                                    Temporary login credentials
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Warning Banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">
                                    Important: Save this password!
                                </p>
                                <p className="text-xs text-amber-700 mt-1">
                                    This is the only time you'll see this
                                    password. The student will be required to
                                    change it on first login.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Student Info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">
                                    Student Name
                                </p>
                                <p className="font-medium text-gray-900">
                                    {name}
                                </p>
                            </div>
                        </div>

                        {email && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Email
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {email}
                                    </p>
                                </div>
                            </div>
                        )}

                        {lrn && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <span className="w-5 h-5 text-gray-400 text-xs font-bold flex items-center justify-center">
                                    LRN
                                </span>
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Learner Reference Number
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {lrn}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Password Display */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">
                        <p className="text-xs text-indigo-600 font-medium mb-2">
                            Temporary Password
                        </p>
                        <div className="flex items-center justify-between gap-3">
                            <code className="text-xl font-mono font-bold text-indigo-700 tracking-wider">
                                {password}
                            </code>
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                    copied
                                        ? "bg-green-100 text-green-700"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={handleCopyAll}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <Copy className="w-4 h-4" />
                        Copy All Details
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemporaryPasswordModal;

/**
 * Interventions.jsx
 *
 * Teacher-facing intervention management center.
 * Allows teachers to monitor at-risk students, create tiered
 * intervention plans, send feedback, and track progress.
 *
 * Components (top-level):
 *   Interventions            – Page root, sets layout
 *   InterventionCenter       – State orchestrator (dashboard ↔ profile)
 *   InterventionDashboard    – Watchlist table + summary cards
 *   StudentInterventionProfile – Per-student detail view
 *
 * Modals:
 *   StartInterventionModal   – Create a new tiered intervention
 *   BulkInterventionModal    – Apply one action to many students
 *   FeedbackModal            – Send a typed message to a student
 */

import React, { useState, useEffect, useMemo } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import { useLoading } from "@/Context/LoadingContext";
import { ArrowLeft } from "lucide-react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";

// ─────────────────────────────────────────────
// CONSTANTS & PURE HELPERS
// ─────────────────────────────────────────────

const INTERVENTION_STUDENT_QUERY_KEY = "student";

/** Returns Tailwind badge classes for a given priority level. */
const getPriorityClasses = (priority) => {
    const base =
        "px-2.5 py-0.5 inline-flex items-center text-[10px] leading-4 font-semibold rounded-full border";
    const map = {
        High: `${base} bg-rose-50 border-rose-200 text-rose-700`,
        Medium: `${base} bg-amber-50 border-amber-200 text-amber-700`,
        Low: `${base} bg-sky-50 border-sky-200 text-sky-700`,
    };
    return map[priority] ?? `${base} bg-gray-100 border-gray-200 text-gray-700`;
};

/** Returns Tailwind badge classes for intervention status labels. */
const getInterventionStatusClasses = (status) => {
    const base =
        "px-2.5 py-0.5 inline-flex items-center text-[10px] leading-4 font-semibold rounded-full border";

    const map = {
        active: `${base} bg-emerald-50 border-emerald-200 text-emerald-700`,
        completed: `${base} bg-sky-50 border-sky-200 text-sky-700`,
        pending_approval: `${base} bg-amber-50 border-amber-200 text-amber-700`,
    };

    return map[status] ?? `${base} bg-gray-100 border-gray-200 text-gray-700`;
};

const formatInterventionStatus = (status) => {
    if (!status) return "Unknown";
    return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

/** Reads the `student` query-param from the URL as a positive integer. */
const getSelectedEnrollmentIdFromUrl = () => {
    if (typeof window === "undefined") return null;
    const raw = new URLSearchParams(window.location.search).get(
        INTERVENTION_STUDENT_QUERY_KEY,
    );
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

/** Formats a value compatible with <input type="datetime-local">. */
const toDateTimeLocalValue = (date) => {
    const p = (v) => String(v).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
};

const toDateTimeLocalFromIso = (isoValue) => {
    if (!isoValue) return "";
    const parsed = new Date(isoValue);
    if (Number.isNaN(parsed.getTime())) return "";
    return toDateTimeLocalValue(parsed);
};

/** Formats a date string/value into a human-readable "Month Day, Year". */
const formatReadableDate = (dateValue) => {
    if (!dateValue) return "N/A";
    if (dateValue === "Never") return "Never";

    const opts = { month: "long", day: "numeric", year: "numeric" };

    if (typeof dateValue !== "string") {
        const d = new Date(dateValue);
        return isNaN(d)
            ? String(dateValue)
            : d.toLocaleDateString("en-US", opts);
    }

    const trimmed = dateValue.trim();
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    const d = dateOnly
        ? new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3])
        : new Date(trimmed);

    return isNaN(d) ? dateValue : d.toLocaleDateString("en-US", opts);
};

/** Derives 1–2 uppercase initials from a full name. */
const getInitials = (name) =>
    name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

// ─────────────────────────────────────────────
// SHARED ICON COMPONENTS
// ─────────────────────────────────────────────

/** SVG icons keyed by intervention strategy type. */
const StrategyIcons = {
    automated_nudge: ({ className }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
        </svg>
    ),
    task_list: ({ className }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    ),
    extension_grant: ({ className }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    ),
    parent_contact: ({ className }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            />
        </svg>
    ),
    academic_agreement: ({ className }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
        </svg>
    ),
    one_on_one_meeting: ({ className }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
            />
        </svg>
    ),
};

// ─────────────────────────────────────────────
// INTERVENTION STRATEGY DEFINITIONS
// ─────────────────────────────────────────────

/**
 * Central source of truth for all intervention strategy metadata.
 * Used by both StartInterventionModal and related UI.
 */
const INTERVENTION_STRATEGIES = {
    automated_nudge: {
        iconKey: "automated_nudge",
        label: "Send Reminder Nudge",
        description:
            "Sends a notification to the student's dashboard reminding them of goals.",
        tier: 1,
        tierLabel: "Automated",
        tierColor: "emerald",
    },
    task_list: {
        iconKey: "task_list",
        label: "Create Goal Checklist",
        description:
            "Creates a manual checklist of goals for the student to complete.",
        tier: 2,
        tierLabel: "Teacher Led",
        tierColor: "amber",
    },
    extension_grant: {
        iconKey: "extension_grant",
        label: "Grant Deadline Extension",
        description:
            "Officially extends the deadline for the current missing assignment.",
        tier: 2,
        tierLabel: "Teacher Led",
        tierColor: "amber",
    },
    parent_contact: {
        iconKey: "parent_contact",
        label: "Parent Contact Log",
        description:
            "Log a call or email sent to the parent regarding performance.",
        tier: 2,
        tierLabel: "Teacher Led",
        tierColor: "amber",
    },
    academic_agreement: {
        iconKey: "academic_agreement",
        label: "Student Academic Agreement",
        description:
            "A signed contract where student agrees to complete missing tasks by a deadline.",
        tier: 3,
        tierLabel: "Intensive",
        tierColor: "red",
    },
    one_on_one_meeting: {
        iconKey: "one_on_one_meeting",
        label: "One-on-One Intervention Meeting",
        description:
            "Mandatory meeting to diagnose the real issue. Record notes after the session.",
        tier: 3,
        tierLabel: "Intensive",
        tierColor: "red",
    },
};

const TASK_DELIVERY_MODES = [
    { value: "remote", label: "Remote" },
    { value: "face_to_face", label: "Face-to-Face" },
];

const TASK_SUPPORTED_TYPES = ["task_list", "academic_agreement"];
const PARENT_CONTACT_TYPE = "parent_contact";

const getTaskDeliveryModeLabel = (mode) =>
    TASK_DELIVERY_MODES.find((item) => item.value === mode)?.label ?? "";

// ─────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────

/** Reusable modal backdrop + centered card shell. */
function ModalShell({ children, maxWidth = "max-w-lg" }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
                className={`w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 flex flex-col`}
            >
                {children}
            </div>
        </div>
    );
}

/** Standardised modal header row with icon, title, subtitle, and close button. */
function ModalHeader({ icon, title, subtitle, onClose }) {
    return (
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label="Close"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
        </div>
    );
}

/** Spinning indicator used inside buttons during async operations. */
function Spinner({ className = "h-4 w-4" }) {
    return (
        <svg
            className={`animate-spin ${className}`}
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

/** Avatar circle using student initials. */
function Avatar({ name, size = "md", className = "" }) {
    const sizes = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-20 w-20 text-2xl",
    };
    return (
        <div
            className={`flex-shrink-0 flex items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-sm ${sizes[size]} ${className}`}
        >
            {getInitials(name)}
        </div>
    );
}

// ─────────────────────────────────────────────
// FEEDBACK MODAL
// ─────────────────────────────────────────────

const FEEDBACK_TYPES = [
    {
        id: "encouragement",
        label: "Encouragement",
        color: "amber",
        placeholder:
            "Great job on your recent quiz! Keep up the excellent work...",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ),
    },
    {
        id: "concern",
        label: "Concern",
        color: "orange",
        placeholder:
            "I've noticed some challenges with your recent assignments...",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                />
            </svg>
        ),
    },
    {
        id: "action_required",
        label: "Action Required",
        color: "red",
        placeholder: "Please submit the missing assignment by Friday...",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                />
            </svg>
        ),
    },
    {
        id: "general",
        label: "General",
        color: "blue",
        placeholder: "Write your message here...",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path
                    fillRule="evenodd"
                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                    clipRule="evenodd"
                />
            </svg>
        ),
    },
];

const QUICK_TEMPLATES = [
    {
        label: "Praise improvement",
        text: "Great improvement on your recent work! Keep it up!",
    },
    {
        label: "Request meeting",
        text: "Please see me during office hours to discuss your progress.",
    },
    {
        label: "Remind deadline",
        text: "Don't forget to submit your missing assignments by the deadline.",
    },
];

/** Feedback type button with color theming. */
function FeedbackTypeButton({ type, isSelected, onClick }) {
    const colorSelected = {
        amber: "bg-amber-100 border-amber-400 text-amber-700",
        orange: "bg-orange-100 border-orange-400 text-orange-700",
        red: "bg-red-100 border-red-400 text-red-700",
        blue: "bg-blue-100 border-blue-400 text-blue-700",
    };
    const colorIdle =
        "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${isSelected ? colorSelected[type.color] : colorIdle}`}
        >
            <span className={isSelected ? "" : "opacity-60"}>{type.icon}</span>
            <span className="text-xs font-medium">{type.label}</span>
        </button>
    );
}

/** Modal for sending teacher feedback to a single student. */
function FeedbackModal({ open, onClose, onSubmit, studentName }) {
    const [message, setMessage] = useState("");
    const [feedbackType, setFeedbackType] = useState("encouragement");
    const [isSending, setIsSending] = useState(false);

    if (!open) return null;

    const selectedType = FEEDBACK_TYPES.find((t) => t.id === feedbackType);

    const handleSubmit = () => {
        if (!message.trim()) return;
        setIsSending(true);
        setTimeout(() => {
            onSubmit(message);
            setMessage("");
            setFeedbackType("encouragement");
            setIsSending(false);
            onClose();
        }, 500);
    };

    return (
        <ModalShell>
            <ModalHeader
                icon={
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                }
                title="Send Feedback"
                subtitle={
                    <>
                        to <span className="font-semibold">{studentName}</span>
                    </>
                }
                onClose={onClose}
            />

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Type selector */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Feedback Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {FEEDBACK_TYPES.map((type) => (
                            <FeedbackTypeButton
                                key={type.id}
                                type={type}
                                isSelected={feedbackType === type.id}
                                onClick={() => setFeedbackType(type.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Message textarea */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Your Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                            selectedType?.placeholder ??
                            "Write your feedback..."
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-4 text-sm resize-none h-32 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                    <div className="flex justify-between mt-2">
                        <p className="text-xs text-gray-400">
                            This message will be sent to the student's dashboard
                        </p>
                        <p
                            className={`text-xs ${message.length > 500 ? "text-red-500" : "text-gray-400"}`}
                        >
                            {message.length}/500
                        </p>
                    </div>
                </div>

                {/* Quick templates */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Quick Templates
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_TEMPLATES.map(({ label, text }) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => setMessage(text)}
                                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={
                            !message.trim() || isSending || message.length > 500
                        }
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {isSending ? (
                            <>
                                <Spinner /> Sending...
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                                Send Feedback
                            </>
                        )}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────
// BULK INTERVENTION MODAL
// ─────────────────────────────────────────────

const BULK_INTERVENTION_TYPES = [
    {
        id: "automated_nudge",
        name: "Send Reminder Nudge",
        description: "Send automated reminders to all selected students",
        tier: 1,
        tierColor: "bg-blue-100 text-blue-700",
    },
    {
        id: "task_list",
        name: "Create Goal Checklist",
        description: "Assign a goal checklist for students to complete",
        tier: 2,
        tierColor: "bg-amber-100 text-amber-700",
    },
    {
        id: "extension_grant",
        name: "Grant Extension",
        description: "Extend deadlines for assignments or assessments",
        tier: 2,
        tierColor: "bg-amber-100 text-amber-700",
    },
    {
        id: "parent_contact",
        name: "Contact Parents/Guardians",
        description: "Notify parents about student performance",
        tier: 2,
        tierColor: "bg-amber-100 text-amber-700",
    },
];

/** Modal for applying a single intervention type to multiple students at once. */
function BulkInterventionModal({ open, onClose, selectedStudents }) {
    const [selectedType, setSelectedType] = useState("automated_nudge");
    const [notes, setNotes] = useState("");
    const [deadlineAt, setDeadlineAt] = useState("");
    const [parentMessage, setParentMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const currentType =
        BULK_INTERVENTION_TYPES.find((t) => t.id === selectedType) ??
        BULK_INTERVENTION_TYPES[0];
    const isParentContactType = selectedType === PARENT_CONTACT_TYPE;
    const deadlineRequired = currentType.tier >= 2 && !isParentContactType;
    const studentsMissingParentContact = selectedStudents.filter(
        (student) => !String(student.parentContact ?? "").trim(),
    );

    if (!open) return null;

    const handleSubmit = () => {
        if (deadlineRequired && !deadlineAt) return;
        if (isParentContactType && !parentMessage.trim()) return;

        setIsSubmitting(true);
        router.post(
            route("teacher.interventions.bulk"),
            {
                enrollment_ids: selectedStudents.map((s) => s.id),
                type: selectedType,
                notes,
                deadline_at: deadlineRequired ? deadlineAt : null,
                ...(isParentContactType
                    ? {
                          send_sms: true,
                          sms_custom_message: parentMessage.trim(),
                      }
                    : {}),
            },
            {
                onSuccess: () => {
                    setSubmitSuccess(true);
                    setTimeout(() => {
                        onClose();
                        setSubmitSuccess(false);
                        setSelectedType("automated_nudge");
                        setNotes("");
                        setDeadlineAt("");
                        setParentMessage("");
                    }, 1500);
                },
                onFinish: () => setIsSubmitting(false),
                preserveScroll: true,
            },
        );
    };

    return (
        <ModalShell maxWidth="max-w-2xl">
            <ModalHeader
                icon={
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                }
                title="Bulk Intervention"
                subtitle={`Apply intervention to ${selectedStudents.length} student${selectedStudents.length !== 1 ? "s" : ""}`}
                onClose={onClose}
            />

            <div className="flex-1 overflow-y-auto p-6">
                {submitSuccess ? (
                    /* Success state */
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 text-green-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Interventions Created!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-center">
                            Successfully created interventions for{" "}
                            {selectedStudents.length} students.
                            <br />
                            Email notifications have been sent.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Student chips */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Selected Students
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudents.slice(0, 8).map((s) => (
                                    <span
                                        key={s.id}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm"
                                    >
                                        <Avatar
                                            name={s.name}
                                            size="sm"
                                            className="!w-6 !h-6 !rounded-full !text-[10px]"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {s.name.split(" ")[0]}
                                        </span>
                                    </span>
                                ))}
                                {selectedStudents.length > 8 && (
                                    <span className="inline-flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                        +{selectedStudents.length - 8} more
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Type picker */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Select Intervention Type
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {BULK_INTERVENTION_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                            selectedType === type.id
                                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                                : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-gray-300"
                                        }`}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedType === type.id ? "bg-indigo-600" : "bg-gray-100 dark:bg-gray-700"}`}
                                        >
                                            {/* Contextual icon per type */}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className={`h-5 w-5 ${selectedType === type.id ? "text-white" : "text-gray-500"}`}
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                {type.id ===
                                                    "automated_nudge" && (
                                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                                )}
                                                {type.id === "task_list" && (
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                                                        clipRule="evenodd"
                                                    />
                                                )}
                                                {type.id ===
                                                    "extension_grant" && (
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                        clipRule="evenodd"
                                                    />
                                                )}
                                                {type.id ===
                                                    "parent_contact" && (
                                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                )}
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {type.name}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full ${type.tierColor}`}
                                                >
                                                    Tier {type.tier}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                {type.description}
                                            </p>
                                        </div>
                                        {selectedType === type.id && (
                                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 text-white"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Deadline (Tier 2+) */}
                        {deadlineRequired && (
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Deadline Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={deadlineAt}
                                    onChange={(e) =>
                                        setDeadlineAt(e.target.value)
                                    }
                                    min={toDateTimeLocalValue(
                                        new Date(Date.now() + 60_000),
                                    )}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-600"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Required for Tier 2 and Tier 3
                                    interventions.
                                </p>
                            </div>
                        )}

                        {isParentContactType && (
                            <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
                                <div>
                                    <h5 className="text-sm font-semibold text-sky-900">
                                        Parent Contact SMS
                                    </h5>
                                    <p className="mt-1 text-xs text-sky-700">
                                        The custom message below will be sent to
                                        each selected student's saved parent
                                        number.
                                    </p>
                                    {studentsMissingParentContact.length >
                                        0 && (
                                        <p className="mt-2 text-xs font-medium text-amber-700">
                                            {
                                                studentsMissingParentContact.length
                                            }{" "}
                                            selected student
                                            {studentsMissingParentContact.length !==
                                            1
                                                ? "s"
                                                : ""}{" "}
                                            do not have a saved parent number.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-sky-900">
                                        Custom Message to Parent
                                    </label>
                                    <textarea
                                        value={parentMessage}
                                        onChange={(e) =>
                                            setParentMessage(e.target.value)
                                        }
                                        rows={4}
                                        className="w-full rounded-xl border border-sky-300 px-4 py-3 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 resize-none"
                                        placeholder="Type the message you want to send to parents..."
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Notes for All Students (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                placeholder="Add any notes that will be included in the intervention record..."
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            {!submitSuccess && (
                <div className="flex-shrink-0 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={
                            isSubmitting ||
                            (deadlineRequired && !deadlineAt) ||
                            (isParentContactType && !parentMessage.trim())
                        }
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner className="h-5 w-5" /> Creating...
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Create {selectedStudents.length} Intervention
                                {selectedStudents.length !== 1 ? "s" : ""}
                            </>
                        )}
                    </button>
                </div>
            )}
        </ModalShell>
    );
}

// ─────────────────────────────────────────────
// START INTERVENTION MODAL
// ─────────────────────────────────────────────

/** Tier column color helpers */
const TIER_COLORS = {
    emerald: {
        bg: "bg-emerald-50/50 border-emerald-100",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        infoBg: "bg-emerald-50 border-emerald-200",
        icon: "text-emerald-600",
        num: "bg-emerald-500",
        label: "text-emerald-700",
        sub: "text-emerald-600",
    },
    amber: {
        bg: "bg-amber-50/50 border-amber-100",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        infoBg: "bg-amber-50 border-amber-200",
        icon: "text-amber-600",
        num: "bg-amber-500",
        label: "text-amber-700",
        sub: "text-amber-600",
    },
    red: {
        bg: "bg-red-50/50 border-red-100",
        badge: "bg-red-100 text-red-700 border-red-200",
        infoBg: "bg-red-50 border-red-200",
        icon: "text-red-600",
        num: "bg-red-500",
        label: "text-red-700",
        sub: "text-red-600",
    },
};

/** Renders a single strategy choice card within a tier column. */
function StrategyCard({
    strategyKey,
    strategy,
    isSelected,
    isDisabled,
    onSelect,
}) {
    const IconComponent = StrategyIcons[strategy.iconKey];
    const tc = TIER_COLORS[strategy.tierColor];

    return (
        <button
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(strategyKey)}
            className={`relative w-full p-3 rounded-lg border-2 text-left transition-all ${
                isDisabled
                    ? "border-transparent bg-gray-50 dark:bg-gray-800 cursor-not-allowed grayscale"
                    : isSelected
                      ? "border-indigo-500 bg-white dark:bg-gray-900 ring-2 ring-indigo-200 shadow-md"
                      : "border-transparent bg-white dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 hover:border-gray-200 hover:shadow-md"
            }`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-indigo-100" : isDisabled ? "bg-gray-100 dark:bg-gray-700" : `bg-${strategy.tierColor}-100`}`}
                >
                    {IconComponent && (
                        <IconComponent
                            className={`w-5 h-5 ${isDisabled ? "text-gray-400" : isSelected ? "text-indigo-600" : tc.icon}`}
                        />
                    )}
                </div>
                <p
                    className={`font-medium text-sm flex-1 ${isDisabled ? "text-gray-400" : isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300"}`}
                >
                    {strategy.label}
                </p>
                {!isDisabled && isSelected && (
                    <svg
                        className="w-5 h-5 text-indigo-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                )}
            </div>
        </button>
    );
}

/** Renders one tier column (1/2/3) with its cards. */
function TierColumn({
    tier,
    tierColor,
    isHighRisk,
    lockedForHighRisk,
    selectedType,
    onSelect,
}) {
    const tc = TIER_COLORS[tierColor];
    const tierStrategies = Object.entries(INTERVENTION_STRATEGIES).filter(
        ([, s]) => s.tier === tier,
    );
    const isRequired = isHighRisk && tier === 3;
    const isLocked = lockedForHighRisk && tier !== 3;

    return (
        <div
            className={`rounded-xl p-4 border ${isLocked ? "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-700 opacity-60" : isRequired ? `${tc.bg} ring-2 ring-red-200` : tc.bg}`}
        >
            {/* Tier header */}
            <div className="flex items-center gap-2 mb-3">
                <span
                    className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${isLocked ? "bg-gray-400" : tc.num}`}
                >
                    {tier}
                </span>
                <div className="flex-1">
                    <span
                        className={`text-sm font-bold ${isLocked ? "text-gray-500 dark:text-gray-400" : tc.label}`}
                    >
                        Tier {tier}
                    </span>
                    <span
                        className={`text-xs ml-1 ${isLocked ? "text-gray-400" : tc.sub}`}
                    >
                        • {tierStrategies[0]?.[1]?.tierLabel}
                    </span>
                </div>
                {isRequired && (
                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                        REQUIRED
                    </span>
                )}
            </div>

            {/* Lock / required notice */}
            {isLocked && (
                <div className="mb-3 p-2 bg-gray-200 rounded-lg text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Not available for high-risk students
                    </p>
                </div>
            )}
            {isRequired && (
                <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-lg text-center">
                    <p className="text-xs text-red-700 font-medium">
                        ⚠️ High-risk student requires intensive intervention
                    </p>
                </div>
            )}

            {/* Strategy cards */}
            <div className="space-y-2">
                {tierStrategies.map(([key, strategy]) => (
                    <StrategyCard
                        key={key}
                        strategyKey={key}
                        strategy={strategy}
                        isSelected={selectedType === key}
                        isDisabled={isLocked}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Modal for starting a single new intervention for a specific student.
 * Shows tiered strategy selection; restricts Tier 1/2 for high-risk students.
 */
function StartInterventionModal({
    open,
    onClose,
    enrollmentId,
    studentName,
    priority,
    parentContact,
}) {
    const isHighRisk = priority === "High";
    const normalizedParentContact =
        typeof parentContact === "string" ? parentContact.trim() : "";

    const { data, setData, post, processing, reset, errors, transform } =
        useForm({
            enrollment_id: enrollmentId,
            type: isHighRisk ? "academic_agreement" : "parent_contact",
            notes: "",
            deadline_at: "",
            tasks: [],
            parent_phone:
                normalizedParentContact && normalizedParentContact !== "N/A"
                    ? normalizedParentContact
                    : "",
            sms_custom_message: "",
        });

    const [taskDraft, setTaskDraft] = useState({
        task_name: "",
        description: "",
        delivery_mode: "remote",
    });

    useEffect(() => {
        setData("enrollment_id", enrollmentId);
    }, [enrollmentId]);

    useEffect(() => {
        if (normalizedParentContact && normalizedParentContact !== "N/A") {
            setData("parent_phone", normalizedParentContact);
        }
    }, [normalizedParentContact]);

    const selectedStrategy = INTERVENTION_STRATEGIES[data.type];
    const isParentContactType = data.type === PARENT_CONTACT_TYPE;
    const deadlineRequired =
        (selectedStrategy?.tier ?? 1) >= 2 && !isParentContactType;
    const requiresTaskChecklist = TASK_SUPPORTED_TYPES.includes(data.type);
    const isAcademicAgreement = data.type === "academic_agreement";
    const parentPhoneMissing =
        isParentContactType && !String(data.parent_phone ?? "").trim();
    const parentMessageMissing =
        isParentContactType && !String(data.sms_custom_message ?? "").trim();

    useEffect(() => {
        if (!deadlineRequired) setData("deadline_at", "");
    }, [deadlineRequired]);

    useEffect(() => {
        if (!requiresTaskChecklist && data.tasks.length > 0) {
            setData("tasks", []);
        }
    }, [requiresTaskChecklist]);

    const addTask = () => {
        const taskName = taskDraft.task_name.trim();
        if (!taskName) return;

        const taskDescription = taskDraft.description.trim() || taskName;

        setData("tasks", [
            ...data.tasks,
            {
                task_name: taskName,
                description: taskDescription,
                delivery_mode: isAcademicAgreement
                    ? taskDraft.delivery_mode
                    : null,
            },
        ]);

        setTaskDraft((prev) => ({
            ...prev,
            task_name: "",
            description: "",
        }));
    };

    const removeTask = (index) =>
        setData(
            "tasks",
            data.tasks.filter((_, i) => i !== index),
        );

    const handleTaskKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTask();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (deadlineRequired && !data.deadline_at) return;

        transform((current) => {
            const { parent_phone, sms_custom_message, ...basePayload } =
                current;

            return {
                ...basePayload,
                deadline_at: deadlineRequired ? current.deadline_at : null,
                ...(current.type === PARENT_CONTACT_TYPE
                    ? {
                          send_sms: true,
                          parent_phone,
                          sms_custom_message,
                      }
                    : {}),
            };
        });

        post(route("teacher.interventions.store"), {
            onSuccess: () => {
                reset();
                setTaskDraft({
                    task_name: "",
                    description: "",
                    delivery_mode: "remote",
                });
                onClose();
            },
        });
    };

    if (!open) return null;

    const tc = TIER_COLORS[selectedStrategy?.tierColor ?? "amber"];

    const canSubmit =
        !processing &&
        !(deadlineRequired && !data.deadline_at) &&
        !(requiresTaskChecklist && data.tasks.length === 0) &&
        !parentPhoneMissing &&
        !parentMessageMissing;

    const footerHint = parentPhoneMissing
        ? "⚠️ Enter the parent's contact number"
        : parentMessageMissing
          ? "⚠️ Add the custom SMS message for the parent"
          : deadlineRequired && !data.deadline_at
            ? "⚠️ Deadline date and time is required for this tier"
            : requiresTaskChecklist && data.tasks.length === 0
              ? "⚠️ Please add at least one task before starting"
              : "This will create a new intervention record";

    return (
        <ModalShell maxWidth="max-w-4xl">
            <ModalHeader
                icon={
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                            clipRule="evenodd"
                        />
                    </svg>
                }
                title="Start New Intervention"
                subtitle={
                    <>
                        for <span className="font-semibold">{studentName}</span>
                    </>
                }
                onClose={onClose}
            />

            <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Strategy tier grid */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                            Choose Intervention Strategy
                        </label>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <TierColumn
                                tier={1}
                                tierColor="emerald"
                                isHighRisk={isHighRisk}
                                lockedForHighRisk={isHighRisk}
                                selectedType={data.type}
                                onSelect={(k) => setData("type", k)}
                            />
                            <TierColumn
                                tier={2}
                                tierColor="amber"
                                isHighRisk={isHighRisk}
                                lockedForHighRisk={isHighRisk}
                                selectedType={data.type}
                                onSelect={(k) => setData("type", k)}
                            />
                            <TierColumn
                                tier={3}
                                tierColor="red"
                                isHighRisk={isHighRisk}
                                lockedForHighRisk={false}
                                selectedType={data.type}
                                onSelect={(k) => setData("type", k)}
                            />
                        </div>
                    </div>

                    {/* Selected strategy info banner */}
                    {selectedStrategy && (
                        <div className={`p-4 rounded-xl border ${tc.infoBg}`}>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-11 h-11 bg-white dark:bg-gray-900 rounded-lg shadow-sm flex items-center justify-center">
                                    {(() => {
                                        const Icon =
                                            StrategyIcons[
                                                selectedStrategy.iconKey
                                            ];
                                        return Icon ? (
                                            <Icon
                                                className={`w-6 h-6 ${tc.icon}`}
                                            />
                                        ) : null;
                                    })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {selectedStrategy.label}
                                        </h4>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium border ${tc.badge}`}
                                        >
                                            Tier {selectedStrategy.tier} •{" "}
                                            {selectedStrategy.tierLabel}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {selectedStrategy.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deadline input (Tier 2+) */}
                    {deadlineRequired && (
                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                            <label className="mb-2 block text-sm font-semibold text-amber-800">
                                Deadline Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={data.deadline_at}
                                onChange={(e) =>
                                    setData("deadline_at", e.target.value)
                                }
                                min={toDateTimeLocalValue(
                                    new Date(Date.now() + 60_000),
                                )}
                                className="w-full rounded-xl border-amber-300 text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                required
                            />
                            <p className="mt-1 text-xs text-amber-700">
                                Required for Tier 2 and Tier 3 interventions.
                            </p>
                        </div>
                    )}

                    {isParentContactType && (
                        <div className="space-y-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-sky-900">
                                    Parent Number
                                </label>
                                <input
                                    type="text"
                                    value={data.parent_phone}
                                    onChange={(e) =>
                                        setData("parent_phone", e.target.value)
                                    }
                                    className="w-full rounded-xl border border-sky-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                    placeholder="e.g. 09171234567 or +639171234567"
                                    required
                                />
                                {errors.parent_phone && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.parent_phone}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-sky-700">
                                    {normalizedParentContact &&
                                    normalizedParentContact !== "N/A"
                                        ? "Pre-filled from the student's saved parent contact."
                                        : "No saved parent number was found. Enter the parent's number above."}
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-sky-900">
                                    Custom Message to Parent
                                </label>
                                <textarea
                                    value={data.sms_custom_message}
                                    onChange={(e) =>
                                        setData(
                                            "sms_custom_message",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-sky-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 h-24 resize-none"
                                    placeholder="Type the exact text you want to send to the parent..."
                                    required
                                />
                                {errors.sms_custom_message && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.sms_custom_message}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-sky-700">
                                    This message is sent via SMS and logged as a
                                    Parent Contact intervention.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Additional Notes{" "}
                            <span className="text-gray-400 font-normal">
                                (Optional)
                            </span>
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                            className="w-full border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-24 resize-none text-sm"
                            placeholder="Add context, specific instructions, or follow-up details..."
                        />
                    </div>

                    {/* Checklist editor for task_list and academic_agreement */}
                    {requiresTaskChecklist && (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <label className="block text-sm font-semibold text-amber-800 mb-3">
                                {isAcademicAgreement
                                    ? "Academic Agreement Tasks"
                                    : "Goal Checklist Tasks"}{" "}
                                <span className="text-amber-600 font-normal">
                                    (Add at least 1)
                                </span>
                            </label>

                            <div className="space-y-2 mb-3">
                                <input
                                    type="text"
                                    value={taskDraft.task_name}
                                    onChange={(e) =>
                                        setTaskDraft((prev) => ({
                                            ...prev,
                                            task_name: e.target.value,
                                        }))
                                    }
                                    onKeyDown={handleTaskKeyDown}
                                    placeholder={
                                        isAcademicAgreement
                                            ? "Task name (e.g., Attend tutorial session)"
                                            : "Task name (e.g., Submit missing Lab Report)"
                                    }
                                    className="w-full border-amber-300 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                                />

                                <textarea
                                    value={taskDraft.description}
                                    onChange={(e) =>
                                        setTaskDraft((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Task description or completion details"
                                    className="w-full border-amber-300 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm h-20 resize-none"
                                />

                                {isAcademicAgreement && (
                                    <select
                                        value={taskDraft.delivery_mode}
                                        onChange={(e) =>
                                            setTaskDraft((prev) => ({
                                                ...prev,
                                                delivery_mode: e.target.value,
                                            }))
                                        }
                                        className="w-full border-amber-300 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                                    >
                                        {TASK_DELIVERY_MODES.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={addTask}
                                        disabled={!taskDraft.task_name.trim()}
                                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </div>

                            {data.tasks.length > 0 ? (
                                <div className="space-y-2">
                                    {data.tasks.map((task, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-lg border border-amber-100 group"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-amber-700">
                                                    {i + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                    {task.task_name ?? task}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {task.description ?? task}
                                                </p>
                                                {isAcademicAgreement &&
                                                    task.delivery_mode && (
                                                        <span className="inline-flex mt-1 rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                                            {getTaskDeliveryModeLabel(
                                                                task.delivery_mode,
                                                            )}
                                                        </span>
                                                    )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeTask(i)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-amber-600 text-sm opacity-60">
                                    No tasks added yet.
                                </div>
                            )}

                            <p className="text-xs text-amber-600 mt-3">
                                💡 Tip: use one task per actionable deliverable.
                            </p>
                        </div>
                    )}

                    {/* Form footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {footerHint}
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Spinner /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Start Intervention
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────
// COMPLETION APPROVAL / REJECTION MODALS
// ─────────────────────────────────────────────

/** Compact confirmation modal for approving or rejecting a student's completion request. */
function CompletionActionModal({
    open,
    onClose,
    title,
    titleIcon,
    submitLabel,
    submitColor,
    onSubmit,
    isProcessing,
    children,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {titleIcon}
                        {title}
                    </h3>
                </div>
                <div className="p-6">
                    {children}
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={isProcessing}
                            className={`flex-1 px-4 py-2.5 ${submitColor} text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
                        >
                            {isProcessing ? (
                                <>
                                    <Spinner /> Processing...
                                </>
                            ) : (
                                submitLabel
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InterventionManagementModal({
    open,
    onClose,
    studentName,
    intervention,
}) {
    const { data, setData, put, processing, errors } = useForm({
        type: "",
        notes: "",
        deadline_at: "",
    });

    const [taskDraft, setTaskDraft] = useState({
        task_name: "",
        description: "",
        delivery_mode: "remote",
    });
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingTaskDraft, setEditingTaskDraft] = useState({
        task_name: "",
        description: "",
        delivery_mode: "remote",
        is_completed: false,
    });
    const [completionNotes, setCompletionNotes] = useState("");
    const [isMutating, setIsMutating] = useState(false);

    useEffect(() => {
        if (!open || !intervention) return;

        setData("type", intervention.type ?? "");
        setData("notes", intervention.notes ?? "");
        setData("deadline_at", toDateTimeLocalFromIso(intervention.deadlineAt));
        setTaskDraft({
            task_name: "",
            description: "",
            delivery_mode: "remote",
        });
        setEditingTaskId(null);
        setCompletionNotes("");
    }, [open, intervention]);

    if (!open || !intervention) return null;

    const tasks = Array.isArray(intervention.tasks) ? intervention.tasks : [];
    const completedTasks =
        intervention.completedTasks ??
        tasks.filter((task) => task.is_completed).length;
    const totalTasks = intervention.totalTasks ?? tasks.length;
    const progressPercent =
        intervention.progressPercent ??
        (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
    const selectedStrategy = INTERVENTION_STRATEGIES[data.type] ?? null;
    const isParentContactType = data.type === PARENT_CONTACT_TYPE;
    const deadlineRequired =
        (selectedStrategy?.tier ?? 1) >= 2 && !isParentContactType;
    const canApproveDirectly =
        intervention.isTier3 && intervention.status === "active";

    const handleSaveIntervention = (e) => {
        e.preventDefault();

        put(
            route("teacher.interventions.update", {
                intervention: intervention.id,
            }),
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsMutating(true),
                onFinish: () => setIsMutating(false),
            },
        );
    };

    const handleAddTask = () => {
        const taskName = taskDraft.task_name.trim();
        if (!taskName) return;

        router.post(
            route("teacher.interventions.tasks.store", {
                intervention: intervention.id,
            }),
            {
                task_name: taskName,
                description: taskDraft.description.trim() || taskName,
                delivery_mode: taskDraft.delivery_mode,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsMutating(true),
                onSuccess: () => {
                    setTaskDraft({
                        task_name: "",
                        description: "",
                        delivery_mode: "remote",
                    });
                },
                onFinish: () => setIsMutating(false),
            },
        );
    };

    const beginTaskEdit = (task) => {
        setEditingTaskId(task.id);
        setEditingTaskDraft({
            task_name: task.task_name ?? task.description ?? "",
            description: task.description ?? task.task_name ?? "",
            delivery_mode: task.delivery_mode ?? "remote",
            is_completed: Boolean(task.is_completed),
        });
    };

    const handleSaveTaskEdit = (taskId) => {
        const taskName = editingTaskDraft.task_name.trim();
        if (!taskName) return;

        router.put(
            route("teacher.interventions.tasks.update", {
                intervention: intervention.id,
                task: taskId,
            }),
            {
                task_name: taskName,
                description: editingTaskDraft.description.trim() || taskName,
                delivery_mode: editingTaskDraft.delivery_mode,
                is_completed: editingTaskDraft.is_completed,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsMutating(true),
                onSuccess: () => setEditingTaskId(null),
                onFinish: () => setIsMutating(false),
            },
        );
    };

    const handleToggleTask = (task) => {
        router.post(
            route("teacher.interventions.tasks.toggle", {
                intervention: intervention.id,
                task: task.id,
            }),
            {
                is_completed: !task.is_completed,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsMutating(true),
                onFinish: () => setIsMutating(false),
            },
        );
    };

    const handleDeleteTask = (task) => {
        if (!window.confirm("Delete this task from the intervention?")) return;

        router.delete(
            route("teacher.interventions.tasks.destroy", {
                intervention: intervention.id,
                task: task.id,
            }),
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsMutating(true),
                onFinish: () => setIsMutating(false),
            },
        );
    };

    const handleApproveDirectly = () => {
        router.post(
            route("teacher.interventions.complete", {
                intervention: intervention.id,
            }),
            {
                notes: completionNotes,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsMutating(true),
                onSuccess: () => setCompletionNotes(""),
                onFinish: () => setIsMutating(false),
            },
        );
    };

    const handleDeleteIntervention = () => {
        if (
            !window.confirm(
                "Delete this intervention and all related tasks? This cannot be undone.",
            )
        ) {
            return;
        }

        router.delete(
            route("teacher.interventions.destroy", {
                intervention: intervention.id,
            }),
            {
                preserveScroll: true,
                onStart: () => setIsMutating(true),
                onSuccess: () => onClose(),
                onFinish: () => setIsMutating(false),
            },
        );
    };

    const busy = processing || isMutating;

    return (
        <ModalShell maxWidth="max-w-5xl">
            <ModalHeader
                icon={
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm5 4a1 1 0 012 0v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1H7a1 1 0 110-2h1V7z"
                            clipRule="evenodd"
                        />
                    </svg>
                }
                title="Manage Intervention"
                subtitle={
                    <>
                        for <span className="font-semibold">{studentName}</span>
                    </>
                }
                onClose={onClose}
            />

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold text-indigo-900">
                                {intervention.typeLabel ?? intervention.type}
                            </p>
                            <p className="text-xs text-indigo-700">
                                Status: {intervention.status}
                            </p>
                        </div>
                        <span className="rounded-full border border-indigo-300 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                            {completedTasks}/{totalTasks} tasks done
                        </span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-indigo-100">
                        <div
                            className="h-2 rounded-full bg-indigo-600 transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-indigo-700">
                        Progress: {progressPercent}%
                    </p>
                </div>

                <form
                    onSubmit={handleSaveIntervention}
                    className="rounded-xl border border-gray-200 bg-white p-4 space-y-4"
                >
                    <h3 className="text-sm font-semibold text-gray-800">
                        Intervention Details
                    </h3>
                    <div
                        className={`grid grid-cols-1 gap-3 ${deadlineRequired ? "md:grid-cols-2" : ""}`}
                    >
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Intervention Type
                            </label>
                            <select
                                value={data.type}
                                onChange={(e) =>
                                    setData("type", e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 text-sm"
                            >
                                {Object.entries(INTERVENTION_STRATEGIES).map(
                                    ([key, strategy]) => (
                                        <option key={key} value={key}>
                                            {strategy.label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                        {deadlineRequired && (
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.deadline_at}
                                    onChange={(e) =>
                                        setData("deadline_at", e.target.value)
                                    }
                                    min={toDateTimeLocalValue(
                                        new Date(Date.now() + 60_000),
                                    )}
                                    className="w-full rounded-lg border border-gray-300 text-sm"
                                    required={deadlineRequired}
                                />
                                {errors.deadline_at && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.deadline_at}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Notes
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 text-sm h-24 resize-none"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={busy}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing ? "Saving..." : "Save Intervention"}
                        </button>
                    </div>
                </form>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-amber-900">
                        Task Checklist CRUD
                    </h3>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <input
                            type="text"
                            value={taskDraft.task_name}
                            onChange={(e) =>
                                setTaskDraft((prev) => ({
                                    ...prev,
                                    task_name: e.target.value,
                                }))
                            }
                            placeholder="Task name"
                            className="rounded-lg border border-amber-300 text-sm"
                        />
                        <select
                            value={taskDraft.delivery_mode}
                            onChange={(e) =>
                                setTaskDraft((prev) => ({
                                    ...prev,
                                    delivery_mode: e.target.value,
                                }))
                            }
                            className="rounded-lg border border-amber-300 text-sm"
                        >
                            {TASK_DELIVERY_MODES.map((mode) => (
                                <option key={mode.value} value={mode.value}>
                                    {mode.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleAddTask}
                            disabled={busy || !taskDraft.task_name.trim()}
                            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                        >
                            Add Task
                        </button>
                    </div>

                    <textarea
                        value={taskDraft.description}
                        onChange={(e) =>
                            setTaskDraft((prev) => ({
                                ...prev,
                                description: e.target.value,
                            }))
                        }
                        placeholder="Task description"
                        className="w-full rounded-lg border border-amber-300 text-sm h-20 resize-none"
                    />

                    {tasks.length > 0 ? (
                        <div className="space-y-2">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="rounded-lg border border-amber-200 bg-white p-3"
                                >
                                    {editingTaskId === task.id ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={
                                                    editingTaskDraft.task_name
                                                }
                                                onChange={(e) =>
                                                    setEditingTaskDraft(
                                                        (prev) => ({
                                                            ...prev,
                                                            task_name:
                                                                e.target.value,
                                                        }),
                                                    )
                                                }
                                                className="w-full rounded-lg border border-amber-300 text-sm"
                                            />
                                            <textarea
                                                value={
                                                    editingTaskDraft.description
                                                }
                                                onChange={(e) =>
                                                    setEditingTaskDraft(
                                                        (prev) => ({
                                                            ...prev,
                                                            description:
                                                                e.target.value,
                                                        }),
                                                    )
                                                }
                                                className="w-full rounded-lg border border-amber-300 text-sm h-20 resize-none"
                                            />
                                            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                                <select
                                                    value={
                                                        editingTaskDraft.delivery_mode
                                                    }
                                                    onChange={(e) =>
                                                        setEditingTaskDraft(
                                                            (prev) => ({
                                                                ...prev,
                                                                delivery_mode:
                                                                    e.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    className="rounded-lg border border-amber-300 text-sm"
                                                >
                                                    {TASK_DELIVERY_MODES.map(
                                                        (mode) => (
                                                            <option
                                                                key={mode.value}
                                                                value={
                                                                    mode.value
                                                                }
                                                            >
                                                                {mode.label}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            editingTaskDraft.is_completed
                                                        }
                                                        onChange={(e) =>
                                                            setEditingTaskDraft(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    is_completed:
                                                                        e.target
                                                                            .checked,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                    Completed
                                                </label>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setEditingTaskId(
                                                                null,
                                                            )
                                                        }
                                                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleSaveTaskEdit(
                                                                task.id,
                                                            )
                                                        }
                                                        disabled={busy}
                                                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {task.task_name ??
                                                        task.description}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {task.description}
                                                </p>
                                                {task.delivery_mode && (
                                                    <span className="mt-1 inline-flex rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                                        {getTaskDeliveryModeLabel(
                                                            task.delivery_mode,
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleTask(task)
                                                    }
                                                    disabled={busy}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${task.is_completed ? "bg-slate-200 text-slate-700" : "bg-emerald-600 text-white"} disabled:opacity-50`}
                                                >
                                                    {task.is_completed
                                                        ? "Mark Pending"
                                                        : "Mark Done"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        beginTaskEdit(task)
                                                    }
                                                    disabled={busy}
                                                    className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 disabled:opacity-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteTask(task)
                                                    }
                                                    disabled={busy}
                                                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-amber-700">
                            No tasks yet. Add one to start tracking progress.
                        </p>
                    )}
                </div>

                {canApproveDirectly && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-green-900">
                            Teacher Direct Approval
                        </h3>
                        <p className="text-xs text-green-800">
                            You can approve completion even without a student
                            completion request.
                        </p>
                        <textarea
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder="Optional notes for the student"
                            className="w-full rounded-lg border border-green-300 text-sm h-20 resize-none"
                        />
                        <button
                            type="button"
                            onClick={handleApproveDirectly}
                            disabled={busy}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            Approve and Complete Intervention
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <button
                        type="button"
                        onClick={handleDeleteIntervention}
                        disabled={busy}
                        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                        Delete Intervention
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────
// INTERVENTION DASHBOARD
// ─────────────────────────────────────────────

/** Summary stat card used in the dashboard grid. */
function StatCard({
    label,
    value,
    color = "text-gray-900 dark:text-gray-100",
    dot,
    tone = "from-white to-slate-50/80 dark:from-gray-800 dark:to-gray-800",
}) {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-gray-200/90 bg-gradient-to-br p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 ${tone}`}
        >
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.14em]">
                {label}
            </p>
            <div className="mt-1 flex items-center justify-between">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                {dot && (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/70 shadow-sm dark:bg-gray-900/40">
                        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                    </span>
                )}
            </div>
            <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/50 blur-xl dark:bg-gray-100/10" />
        </div>
    );
}

/**
 * Dashboard listing all watchlist students in a sortable, filterable table.
 * Supports multi-select for bulk interventions.
 */
function InterventionDashboard({ students, onSelectStudent }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [viewMode, setViewMode] = useState("watchlist");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => setIsReady(true));
        return () => window.cancelAnimationFrame(frame);
    }, []);

    // Sort alphabetically by backend sort key (last, first middle-initial format)
    const sortedStudents = useMemo(
        () =>
            [...students].sort((a, b) => {
                const left = String(a.sort_key ?? a.name ?? "");
                const right = String(b.sort_key ?? b.name ?? "");

                return left.localeCompare(right, undefined, {
                    sensitivity: "base",
                    numeric: true,
                });
            }),
        [students],
    );

    const interventionGivenStudents = useMemo(
        () => sortedStudents.filter((s) => s.hasActiveIntervention),
        [sortedStudents],
    );

    const priorityWatchlistStudents = useMemo(
        () => sortedStudents.filter((s) => !s.hasActiveIntervention),
        [sortedStudents],
    );

    const studentsForCurrentView =
        viewMode === "intervention_given"
            ? interventionGivenStudents
            : priorityWatchlistStudents;

    const filteredStudents = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return studentsForCurrentView.filter((s) => {
            const matchesPriority =
                priorityFilter === "All" || s.priority === priorityFilter;
            if (!q) return matchesPriority;

            const searchable = [
                s.name,
                s.alertReason,
                s.subject,
                s.priority,
                s.intervention?.typeLabel,
                s.intervention?.status,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return matchesPriority && searchable.includes(q);
        });
    }, [priorityFilter, searchQuery, studentsForCurrentView]);

    useEffect(() => {
        setSelectedIds([]);
    }, [viewMode]);

    // Summary counts
    const highPriority = studentsForCurrentView.filter(
        (s) => s.priority === "High",
    ).length;
    const mediumPriority = studentsForCurrentView.filter(
        (s) => s.priority === "Medium",
    ).length;
    const activeInterventions = interventionGivenStudents.filter(
        (s) => s.hasActiveIntervention,
    ).length;

    const tableTitle =
        viewMode === "watchlist" ? "Priority Watchlist" : "Intervention Given";
    const tableSubtitle =
        viewMode === "watchlist"
            ? "Students requiring attention"
            : "Students with active interventions";

    // Selection helpers
    const visibleIds = filteredStudents.map((s) => s.id);
    const visibleSelectedCount = visibleIds.filter((id) =>
        selectedIds.includes(id),
    ).length;
    const allVisibleSelected =
        visibleSelectedCount === filteredStudents.length &&
        filteredStudents.length > 0;
    const hasFilters = searchQuery.trim() !== "" || priorityFilter !== "All";
    const selectedStudents = studentsForCurrentView.filter((s) =>
        selectedIds.includes(s.id),
    );

    const toggleSelect = (id, e) => {
        e.stopPropagation();
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const toggleSelectAll = () => {
        if (visibleIds.length === 0) return;
        if (allVisibleSelected) {
            setSelectedIds((prev) =>
                prev.filter((id) => !visibleIds.includes(id)),
            );
        } else {
            setSelectedIds((prev) =>
                Array.from(new Set([...prev, ...visibleIds])),
            );
        }
    };

    return (
        <div
            className={`space-y-5 transition-all duration-300 ${isReady ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
        >
            {/* Bulk intervention modal */}
            <BulkInterventionModal
                open={isBulkModalOpen}
                onClose={() => {
                    setIsBulkModalOpen(false);
                    setSelectedIds([]);
                }}
                selectedStudents={selectedStudents}
            />

            {/* View toggle */}
            <div className="rounded-2xl border border-gray-200/90 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setViewMode("watchlist")}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                            viewMode === "watchlist"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                    >
                        Priority Watchlist
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("intervention_given")}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                            viewMode === "intervention_given"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                    >
                        Intervention Given
                    </button>
                </div>
            </div>

            {/* Bulk selection action bar */}
            {viewMode === "watchlist" && selectedIds.length > 0 && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-900/40 dark:bg-indigo-900/20">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200 flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path
                                        fillRule="evenodd"
                                        d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-indigo-800 dark:text-indigo-100">
                                    {selectedIds.length} student
                                    {selectedIds.length !== 1 ? "s" : ""}{" "}
                                    selected
                                </p>
                                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                    Ready for bulk intervention
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700/40 dark:bg-indigo-950/30 dark:text-indigo-200 text-xs font-medium transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsBulkModalOpen(true)}
                                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                            >
                                Start Bulk Intervention
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={
                        viewMode === "watchlist"
                            ? "Total Watchlist"
                            : "Intervention Given"
                    }
                    value={studentsForCurrentView.length}
                    tone="from-white to-slate-50/90 dark:from-gray-800 dark:to-gray-800"
                />
                <StatCard
                    label="High Priority"
                    value={highPriority}
                    color="text-red-600 dark:text-red-400"
                    dot="bg-red-500"
                    tone="from-rose-50 to-white dark:from-rose-900/20 dark:to-gray-800"
                />
                <StatCard
                    label="Medium Priority"
                    value={mediumPriority}
                    color="text-amber-600 dark:text-amber-400"
                    dot="bg-amber-500"
                    tone="from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800"
                />
                <StatCard
                    label="Active Interventions"
                    value={activeInterventions}
                    color="text-indigo-600 dark:text-indigo-400"
                    dot="bg-indigo-500"
                    tone="from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800"
                />
            </div>

            {/* Priority watchlist table */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {/* Table header bar */}
                <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/80">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-indigo-600 dark:text-indigo-300"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path
                                        fillRule="evenodd"
                                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                    {tableTitle}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {tableSubtitle}
                                </p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 text-xs font-medium rounded-full">
                            {filteredStudents.length} shown
                            {hasFilters
                                ? ` of ${studentsForCurrentView.length}`
                                : ""}
                        </span>
                    </div>
                </div>

                <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-md">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={
                                    viewMode === "watchlist"
                                        ? "Search student, subject, or alert reason"
                                        : "Search student, subject, or intervention type"
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white/90 py-2.5 pl-9 pr-3 text-sm text-gray-700 shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {["All", "High", "Medium", "Low"].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setPriorityFilter(level)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        priorityFilter === level
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setPriorityFilter("All");
                                }}
                                disabled={!hasFilters}
                                className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-400"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur dark:bg-gray-800/95">
                            <tr>
                                {/* Select-all checkbox */}
                                {viewMode === "watchlist" && (
                                    <th className="w-10 px-3 py-2">
                                        {filteredStudents.length > 0 && (
                                            <input
                                                type="checkbox"
                                                checked={allVisibleSelected}
                                                onChange={toggleSelectAll}
                                                className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                                            />
                                        )}
                                    </th>
                                )}
                                {(viewMode === "watchlist"
                                    ? [
                                          "Student Name",
                                          "Alert Reason",
                                          "Priority",
                                          "Subject",
                                          "Last Intervention",
                                      ]
                                    : [
                                          "Student Name",
                                          "Intervention Type",
                                          "Status",
                                          "Subject",
                                          "Last Intervention",
                                      ]
                                ).map((head) => (
                                    <th
                                        key={head}
                                        className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400"
                                    >
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            viewMode === "watchlist" ? "6" : "5"
                                        }
                                        className="px-6 py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                                <svg
                                                    className="w-6 h-6 text-green-500"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                                {hasFilters
                                                    ? "No students match your filters"
                                                    : viewMode ===
                                                        "intervention_given"
                                                      ? "No active interventions yet"
                                                      : "All students doing well!"}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                                                {hasFilters
                                                    ? "Try adjusting your search or priority filter."
                                                    : viewMode ===
                                                        "intervention_given"
                                                      ? "Students with active interventions will appear here."
                                                      : "No students currently need intervention."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s) => (
                                    <tr
                                        key={s.id}
                                        onClick={() => onSelectStudent(s.id)}
                                        className={`hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors group ${selectedIds.includes(s.id) ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}`}
                                    >
                                        {/* Checkbox cell – prevents row click */}
                                        {viewMode === "watchlist" && (
                                            <td
                                                className="px-3 py-3 whitespace-nowrap"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(
                                                        s.id,
                                                    )}
                                                    onChange={(e) =>
                                                        toggleSelect(s.id, e)
                                                    }
                                                    className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                                                />
                                            </td>
                                        )}

                                        {/* Student name + status */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    name={s.name}
                                                    size="sm"
                                                    className="group-hover:shadow-md"
                                                />
                                                <div>
                                                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                                        {s.name}
                                                    </div>
                                                    {s.hasPendingCompletionRequest ? (
                                                        <span className="text-[10px] text-amber-600 flex items-center gap-1">
                                                            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                                                            Pending Request
                                                        </span>
                                                    ) : s.hasActiveIntervention ? (
                                                        <span className="text-[10px] text-green-600 flex items-center gap-1">
                                                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                                                            Active
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>

                                        {viewMode === "watchlist" ? (
                                            <>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                                        {s.alertReason}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span
                                                        className={getPriorityClasses(
                                                            s.priority,
                                                        )}
                                                    >
                                                        {s.priority}
                                                    </span>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                                        {s.intervention
                                                            ?.typeLabel ??
                                                            "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span
                                                        className={getInterventionStatusClasses(
                                                            s.intervention
                                                                ?.status,
                                                        )}
                                                    >
                                                        {formatInterventionStatus(
                                                            s.intervention
                                                                ?.status,
                                                        )}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                {s.subject}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatReadableDate(
                                                    s.lastInterventionDate,
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// STUDENT INTERVENTION PROFILE
// ─────────────────────────────────────────────

/**
 * Full detail view for a selected student.
 * Shows academic vitals, pending completion requests,
 * intervention history, and action buttons.
 */
function StudentInterventionProfile({ enrollmentId, studentData, onBack }) {
    const [student, setStudent] = useState(
        studentData ? { ...studentData } : null,
    );
    const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
    const [isInterventionModalOpen, setIsInterventionModalOpen] =
        useState(false);
    const [
        showInterventionManagementModal,
        setShowInterventionManagementModal,
    ] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [approvalNotes, setApprovalNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (studentData) setStudent({ ...studentData });
    }, [studentData]);

    const pendingRequest = studentData?.pendingCompletionRequest ?? null;
    const activeIntervention = student?.activeIntervention ?? null;
    const hasActiveIntervention = Boolean(activeIntervention);
    const priorityReason = student?.priorityReason ?? "Under Observation";

    const handleApproveCompletion = () => {
        if (!pendingRequest) return;
        setIsProcessing(true);
        router.post(
            route("teacher.interventions.approve", {
                intervention: pendingRequest.interventionId,
            }),
            { notes: approvalNotes },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowApprovalModal(false);
                    setApprovalNotes("");
                },
                onFinish: () => setIsProcessing(false),
            },
        );
    };

    const handleRejectCompletion = () => {
        if (!pendingRequest || !rejectionReason.trim()) return;
        setIsProcessing(true);
        router.post(
            route("teacher.interventions.reject", {
                intervention: pendingRequest.interventionId,
            }),
            { reason: rejectionReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                },
                onFinish: () => setIsProcessing(false),
            },
        );
    };

    const handleAddFeedback = (message) => {
        setStudent((prev) => ({
            ...prev,
            interventionLog: [
                ...prev.interventionLog,
                {
                    id: Date.now(),
                    date: new Date().toISOString().split("T")[0],
                    action: "Teacher Feedback",
                    notes: message,
                },
            ],
        }));
    };

    if (!student)
        return (
            <div className="p-6 text-gray-500 dark:text-gray-400">
                Loading...
            </div>
        );

    return (
        <div className="space-y-5">
            {/* Student identity + action bar */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/80">
                <div className="border-b border-slate-200/80 px-4 py-3 dark:border-gray-700 sm:px-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            onClick={onBack}
                            className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-auto sm:justify-start"
                        >
                            <ArrowLeft size={16} className="mr-1.5" /> Back to
                            Watchlist
                        </button>

                        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                            <button
                                onClick={() => setOpenFeedbackModal(true)}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-auto"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-blue-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                                </svg>
                                Send Feedback
                            </button>
                            <button
                                onClick={() =>
                                    hasActiveIntervention
                                        ? setShowInterventionManagementModal(
                                              true,
                                          )
                                        : setIsInterventionModalOpen(true)
                                }
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:w-auto"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                {hasActiveIntervention
                                    ? "Manage Intervention"
                                    : "Start Intervention"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-4 sm:px-5 sm:py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <Avatar
                            name={student.name}
                            size="md"
                            className="!h-14 !w-14 !rounded-2xl !text-base"
                        />

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {student.name}
                                </h2>
                                <span
                                    className={getPriorityClasses(
                                        student.priority,
                                    )}
                                >
                                    {student.priority} Priority
                                </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 flex-shrink-0 text-indigo-500"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    <span className="min-w-0 truncate">
                                        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            Parent
                                        </span>
                                        {student.parentContact || "N/A"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 flex-shrink-0 text-indigo-500"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="min-w-0 truncate">
                                        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            Counselor
                                        </span>
                                        {student.counselor}
                                    </span>
                                </div>
                            </div>

                            {student.specialPrograms?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {student.specialPrograms.map((p, i) => (
                                        <span
                                            key={i}
                                            className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300"
                                        >
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending completion request banner */}
            {pendingRequest && (
                <div className="overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-orange-50 to-white shadow-sm dark:border-amber-700/50 dark:from-amber-900/25 dark:via-amber-900/10 dark:to-gray-800">
                    <div className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:ring-amber-700/50">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-amber-600 dark:text-amber-300"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100">
                                        Pending Completion Request
                                    </h3>
                                    <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-700/70 dark:bg-amber-900/40 dark:text-amber-200">
                                        {pendingRequest.typeLabel}
                                    </span>
                                </div>

                                <p className="mb-2 text-sm text-amber-800/90 dark:text-amber-200/90">
                                    {student.name} has requested to mark their
                                    Tier 3 intervention as complete.
                                </p>

                                {pendingRequest.requestNotes && (
                                    <div className="mb-3 rounded-xl border border-amber-200/80 bg-white/85 p-3 dark:border-amber-700/40 dark:bg-gray-900/50">
                                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                                            Student Notes
                                        </p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            "{pendingRequest.requestNotes}"
                                        </p>
                                    </div>
                                )}

                                <p className="mb-3 text-xs font-medium text-amber-700 dark:text-amber-300">
                                    Requested on{" "}
                                    {formatReadableDate(
                                        pendingRequest.requestedAt,
                                    )}
                                </p>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <button
                                        onClick={() =>
                                            setShowApprovalModal(true)
                                        }
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 sm:w-auto"
                                    >
                                        Approve Completion
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-600/60 dark:bg-gray-900 dark:text-red-300 dark:hover:bg-red-900/20 sm:w-auto"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-gray-200/90 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.14em] mb-3">
                    Reason for Priority
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {priorityReason}
                </p>
            </div>

            {/* Intervention history log */}
            <div className="rounded-2xl border border-gray-200/90 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Intervention History
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {student.interventionLog.length} record
                        {student.interventionLog.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {student.interventionLog.length > 0 ? (
                    <div className="space-y-3">
                        {student.interventionLog.map((log) => (
                            <div
                                key={log.id}
                                className="rounded-xl border border-gray-200 bg-white/80 p-4 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900/50"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 dark:bg-indigo-900/40">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-indigo-600"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {log.action}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                •
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatReadableDate(log.date)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {log.notes}
                                        </p>
                                        {log.followUp && (
                                            <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3.5 w-3.5"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Follow-up: {log.followUp}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-gray-300 mx-auto mb-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            No intervention history yet
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Start an intervention to create the first record
                        </p>
                    </div>
                )}
            </div>

            {/* ── Modals ─────────────────────────── */}

            <FeedbackModal
                open={openFeedbackModal}
                onClose={() => setOpenFeedbackModal(false)}
                onSubmit={handleAddFeedback}
                studentName={student.name}
            />

            <StartInterventionModal
                open={isInterventionModalOpen}
                onClose={() => setIsInterventionModalOpen(false)}
                enrollmentId={enrollmentId}
                studentName={student.name}
                priority={student.priority}
                parentContact={student.parentContact}
            />

            <InterventionManagementModal
                open={showInterventionManagementModal}
                onClose={() => setShowInterventionManagementModal(false)}
                studentName={student.name}
                intervention={activeIntervention}
            />

            {/* Approval modal */}
            <CompletionActionModal
                open={showApprovalModal}
                onClose={() => {
                    setShowApprovalModal(false);
                    setApprovalNotes("");
                }}
                title="Approve Completion"
                titleIcon={
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                }
                submitLabel="Approve"
                submitColor="bg-green-600 hover:bg-green-700"
                onSubmit={handleApproveCompletion}
                isProcessing={isProcessing}
            >
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    You are about to approve {student.name}'s Tier 3
                    intervention completion request.
                </p>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes for the student (optional)
                </label>
                <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Add any congratulatory message or feedback..."
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    maxLength={1000}
                />
            </CompletionActionModal>

            {/* Rejection modal */}
            <CompletionActionModal
                open={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                }}
                title="Reject Completion Request"
                titleIcon={
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-red-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                }
                submitLabel="Reject Request"
                submitColor="bg-red-600 hover:bg-red-700"
                onSubmit={handleRejectCompletion}
                isProcessing={isProcessing}
            >
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Please provide a reason. The student will be able to submit
                    a new request after addressing your feedback.
                </p>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain what the student needs to complete or improve..."
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    maxLength={1000}
                    required
                />
            </CompletionActionModal>
        </div>
    );
}

// ─────────────────────────────────────────────
// INTERVENTION CENTER (STATE ORCHESTRATOR)
// ─────────────────────────────────────────────

/**
 * Top-level state manager that decides whether to show the
 * dashboard list view or a student's profile view.
 * Also keeps the URL query-param in sync with the selection.
 */
function InterventionCenter({ watchlist = [], studentDetails = {} }) {
    const { startLoading, stopLoading } = useLoading();
    const [students, setStudents] = useState(watchlist);
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(
        getSelectedEnrollmentIdFromUrl,
    );

    // Keep local student list in sync with props
    useEffect(() => {
        setStudents(watchlist);
    }, [watchlist]);

    // Sync browser back/forward navigation
    useEffect(() => {
        const handlePopState = () =>
            setSelectedEnrollmentId(getSelectedEnrollmentIdFromUrl());
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    // Clear invalid IDs (e.g. after a page reload without that student)
    useEffect(() => {
        if (selectedEnrollmentId && !studentDetails[selectedEnrollmentId]) {
            setSelectedEnrollmentId(null);
        }
    }, [selectedEnrollmentId, studentDetails]);

    // Keep URL in sync
    useEffect(() => {
        const url = new URL(window.location.href);
        if (selectedEnrollmentId) {
            url.searchParams.set(
                INTERVENTION_STUDENT_QUERY_KEY,
                String(selectedEnrollmentId),
            );
        } else {
            url.searchParams.delete(INTERVENTION_STUDENT_QUERY_KEY);
        }
        window.history.replaceState(
            window.history.state,
            "",
            `${url.pathname}${url.search}${url.hash}`,
        );
    }, [selectedEnrollmentId]);

    const navigate = (id) => {
        startLoading();
        setTimeout(() => {
            setSelectedEnrollmentId(id);
            stopLoading();
        }, 300);
    };

    const selectedStudentData = selectedEnrollmentId
        ? studentDetails[selectedEnrollmentId]
        : null;
    const hasSelectedStudent = Boolean(
        selectedEnrollmentId && selectedStudentData,
    );

    return (
        <div className="space-y-5">
            {/* Conditional view: profile or dashboard */}
            {hasSelectedStudent ? (
                <StudentInterventionProfile
                    enrollmentId={selectedEnrollmentId}
                    studentData={selectedStudentData}
                    onBack={() => navigate(null)}
                />
            ) : (
                <InterventionDashboard
                    students={students}
                    onSelectStudent={(id) => navigate(id)}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// PAGE ROOT
// ─────────────────────────────────────────────

const Interventions = ({ watchlist = [], studentDetails = {} }) => (
    <>
        <Head title="Interventions" />
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Interventions
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Track watchlist students and manage active interventions.
                </p>
            </div>

            <InterventionCenter
                watchlist={watchlist}
                studentDetails={studentDetails}
            />
        </div>
    </>
);

Interventions.layout = (page) => <SchoolStaffLayout children={page} />;

export default Interventions;

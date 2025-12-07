import TeacherLayout from "@/Layouts/TeacherLayout";
import React, { useState, useEffect, useMemo } from "react";
import { useForm, usePage, router } from "@inertiajs/react";
import { useLoading } from "@/Context/LoadingContext";
import { ArrowLeft } from "lucide-react";

// --- Helper Function ---
const getPriorityClasses = (priority) => {
    const baseClasses =
        "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full";
    switch (priority) {
        case "High":
            return `${baseClasses} bg-red-100 text-red-800`;
        case "Medium":
            return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case "Low":
            return `${baseClasses} bg-blue-100 text-blue-800`;
        default:
            return `${baseClasses} bg-gray-100 text-gray-800`;
    }
};

// Priority order for sorting (High first, then Medium, then Low)
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

// --- Dashboard Component ---
function InterventionDashboard({ students, onSelectStudent }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    // Sort students by priority: High → Medium → Low
    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            const orderA = PRIORITY_ORDER[a.priority] ?? 99;
            const orderB = PRIORITY_ORDER[b.priority] ?? 99;
            return orderA - orderB;
        });
    }, [students]);

    const totalStudents = students.length;
    const highPriority = students.filter((s) => s.priority === "High").length;
    const mediumPriority = students.filter(
        (s) => s.priority === "Medium"
    ).length;
    const lowPriority = students.filter((s) => s.priority === "Low").length;

    const toggleSelect = (id, e) => {
        e.stopPropagation();
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === sortedStudents.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(sortedStudents.map((s) => s.id));
        }
    };

    const clearSelection = () => {
        setSelectedIds([]);
    };

    const selectedStudents = sortedStudents.filter((s) =>
        selectedIds.includes(s.id)
    );

    return (
        <div className="space-y-6">
            {/* Bulk Action Modal */}
            <BulkInterventionModal
                open={isBulkModalOpen}
                onClose={() => {
                    setIsBulkModalOpen(false);
                    setSelectedIds([]);
                }}
                selectedStudents={selectedStudents}
            />

            {/* Bulk Selection Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4 rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
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
                            <p className="font-semibold">
                                {selectedIds.length} student
                                {selectedIds.length !== 1 ? "s" : ""} selected
                            </p>
                            <p className="text-sm text-indigo-200">
                                Ready for bulk intervention
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={clearSelection}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                        >
                            Clear Selection
                        </button>
                        <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="px-5 py-2 bg-white text-indigo-700 hover:bg-indigo-50 rounded-lg text-sm font-semibold shadow-md transition-all flex items-center gap-2"
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
                            Start Bulk Intervention
                        </button>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Total Students on Watchlist
                            </p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {totalStudents}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-indigo-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 p-5 rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600">
                                High Priority
                            </p>
                            <p className="text-3xl font-bold text-red-700 mt-1">
                                {highPriority}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-red-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-amber-600">
                                Medium Priority
                            </p>
                            <p className="text-3xl font-bold text-amber-700 mt-1">
                                {mediumPriority}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-amber-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Priority Watchlist */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-white"
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
                                <h3 className="text-lg font-bold text-gray-900">
                                    Priority Watchlist
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Students requiring attention based on
                                    academic performance
                                </p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                            {students.length} student
                            {students.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-12 px-4 py-3">
                                    {sortedStudents.length > 0 && (
                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedIds.length ===
                                                    sortedStudents.length &&
                                                sortedStudents.length > 0
                                            }
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                    )}
                                </th>
                                {[
                                    "Student Name",
                                    "Alert Reason",
                                    "Priority",
                                    "Subject",
                                    "Last Intervention",
                                ].map((head) => (
                                    <th
                                        key={head}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                    >
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {sortedStudents.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-16 text-center"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                                <svg
                                                    className="w-8 h-8 text-green-500"
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
                                            <p className="text-lg font-semibold text-gray-900">
                                                All students are doing well!
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1 max-w-sm">
                                                No students currently need
                                                intervention based on grades or
                                                attendance.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedStudents.map((s) => (
                                    <tr
                                        key={s.id}
                                        onClick={() => onSelectStudent(s.id)}
                                        className={`hover:bg-indigo-50/50 cursor-pointer transition-colors group ${
                                            selectedIds.includes(s.id)
                                                ? "bg-indigo-50"
                                                : ""
                                        }`}
                                    >
                                        <td
                                            className="px-4 py-4 whitespace-nowrap"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(
                                                    s.id
                                                )}
                                                onChange={(e) =>
                                                    toggleSelect(s.id, e)
                                                }
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold mr-3 shadow-sm group-hover:shadow-md transition-shadow">
                                                    {s.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {s.name}
                                                    </div>
                                                    {s.hasActiveIntervention && (
                                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                            Active Intervention
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {s.alertReason}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={getPriorityClasses(
                                                    s.priority
                                                )}
                                            >
                                                {s.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {s.subject}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-500">
                                                {s.lastInterventionDate}
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

// --- New Modal for Teacher Feedback ---
function FeedbackModal({ open, onClose, onSubmit, studentName }) {
    const [message, setMessage] = useState("");
    const [feedbackType, setFeedbackType] = useState("encouragement");
    const [isSending, setIsSending] = useState(false);

    if (!open) return null;

    const feedbackTypes = [
        {
            id: "encouragement",
            label: "Encouragement",
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
            color: "amber",
            placeholder:
                "Great job on your recent quiz! Keep up the excellent work...",
        },
        {
            id: "concern",
            label: "Concern",
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
            color: "orange",
            placeholder:
                "I've noticed some challenges with your recent assignments...",
        },
        {
            id: "action_required",
            label: "Action Required",
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
            color: "red",
            placeholder: "Please submit the missing assignment by Friday...",
        },
        {
            id: "general",
            label: "General",
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
            color: "blue",
            placeholder: "Write your message here...",
        },
    ];

    const selectedType = feedbackTypes.find((t) => t.id === feedbackType);

    const getTypeButtonClasses = (typeId, color) => {
        const isSelected = feedbackType === typeId;
        const colorClasses = {
            amber: isSelected
                ? "bg-amber-100 border-amber-400 text-amber-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-amber-200 hover:bg-amber-50",
            orange: isSelected
                ? "bg-orange-100 border-orange-400 text-orange-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:bg-orange-50",
            red: isSelected
                ? "bg-red-100 border-red-400 text-red-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50",
            blue: isSelected
                ? "bg-blue-100 border-blue-400 text-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-blue-50",
        };
        return colorClasses[color];
    };

    const handleSubmit = () => {
        if (message.trim()) {
            setIsSending(true);
            // Simulate sending delay
            setTimeout(() => {
                onSubmit(message);
                setMessage("");
                setFeedbackType("encouragement");
                setIsSending(false);
                onClose();
            }, 500);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-white"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Send Feedback
                                </h2>
                                <p className="text-blue-100 text-sm">
                                    to{" "}
                                    <span className="font-semibold">
                                        {studentName}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
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
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Feedback Type Selection */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Feedback Type
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {feedbackTypes.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFeedbackType(type.id)}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${getTypeButtonClasses(
                                        type.id,
                                        type.color
                                    )}`}
                                >
                                    <span
                                        className={
                                            feedbackType === type.id
                                                ? ""
                                                : "opacity-60"
                                        }
                                    >
                                        {type.icon}
                                    </span>
                                    <span className="text-xs font-medium">
                                        {type.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message Input */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <span className="flex items-center gap-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-gray-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Your Message
                            </span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={
                                selectedType?.placeholder ||
                                "Write your feedback..."
                            }
                            className="w-full border border-gray-300 rounded-xl p-4 text-sm resize-none h-32 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                                This message will be sent to the student's
                                dashboard
                            </p>
                            <p
                                className={`text-xs ${
                                    message.length > 500
                                        ? "text-red-500"
                                        : "text-gray-400"
                                }`}
                            >
                                {message.length}/500
                            </p>
                        </div>
                    </div>

                    {/* Quick Templates */}
                    <div className="mb-6">
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                            Quick Templates
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setMessage(
                                        "Great improvement on your recent work! Keep it up!"
                                    )
                                }
                                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                Praise improvement
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setMessage(
                                        "Please see me during office hours to discuss your progress."
                                    )
                                }
                                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                Request meeting
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setMessage(
                                        "Don't forget to submit your missing assignments by the deadline."
                                    )
                                }
                                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                Remind deadline
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={
                                !message.trim() ||
                                isSending ||
                                message.length > 500
                            }
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {isSending ? (
                                <>
                                    <svg
                                        className="animate-spin h-4 w-4"
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
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Sending...
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
            </div>
        </div>
    );
}

// --- Bulk Intervention Modal ---
function BulkInterventionModal({ open, onClose, selectedStudents }) {
    const [selectedType, setSelectedType] = useState("automated_nudge");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    if (!open) return null;

    const interventionTypes = [
        {
            id: "automated_nudge",
            name: "Send Reminder Nudge",
            description:
                "Send automated reminder notifications to all selected students",
            tier: 1,
            tierColor: "bg-blue-100 text-blue-700",
        },
        {
            id: "task_list",
            name: "Create Goal Checklist",
            description: "Assign a goal checklist for students to complete",
            tier: 1,
            tierColor: "bg-blue-100 text-blue-700",
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
            description:
                "Send notification to parents about student performance",
            tier: 2,
            tierColor: "bg-amber-100 text-amber-700",
        },
    ];

    const handleSubmit = () => {
        setIsSubmitting(true);

        router.post(
            route("teacher.interventions.bulk"),
            {
                enrollment_ids: selectedStudents.map((s) => s.id),
                type: selectedType,
                notes: notes,
            },
            {
                onSuccess: () => {
                    setSubmitSuccess(true);
                    setTimeout(() => {
                        onClose();
                        setSubmitSuccess(false);
                        setSelectedType("automated_nudge");
                        setNotes("");
                    }, 1500);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
                preserveScroll: true,
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-white"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Bulk Intervention
                                </h2>
                                <p className="text-indigo-200 text-sm">
                                    Apply intervention to{" "}
                                    {selectedStudents.length} students
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-white"
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
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {submitSuccess ? (
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
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Interventions Created!
                            </h3>
                            <p className="text-gray-600 text-center">
                                Successfully created interventions for{" "}
                                {selectedStudents.length} students.
                                <br />
                                Email notifications have been sent.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Selected Students Preview */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                    Selected Students
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedStudents
                                        .slice(0, 8)
                                        .map((student) => (
                                            <span
                                                key={student.id}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm"
                                            >
                                                <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {student.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .substring(0, 2)}
                                                </span>
                                                <span className="text-gray-700">
                                                    {student.name.split(" ")[0]}
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

                            {/* Intervention Type Selection */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                    Select Intervention Type
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {interventionTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() =>
                                                setSelectedType(type.id)
                                            }
                                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                                selectedType === type.id
                                                    ? "border-indigo-500 bg-indigo-50"
                                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                            }`}
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                    selectedType === type.id
                                                        ? "bg-indigo-600"
                                                        : "bg-gray-100"
                                                }`}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className={`h-5 w-5 ${
                                                        selectedType === type.id
                                                            ? "text-white"
                                                            : "text-gray-500"
                                                    }`}
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    {type.id ===
                                                        "automated_nudge" && (
                                                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                                    )}
                                                    {type.id ===
                                                        "task_list" && (
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
                                                    <span className="font-medium text-gray-900">
                                                        {type.name}
                                                    </span>
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded-full ${type.tierColor}`}
                                                    >
                                                        Tier {type.tier}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {type.description}
                                                </p>
                                            </div>
                                            {selectedType === type.id && (
                                                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
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

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Notes for All Students (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    placeholder="Add any notes that will be included in the intervention record..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!submitSuccess && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    <span>Creating...</span>
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
                                    <span>
                                        Create {selectedStudents.length}{" "}
                                        Intervention
                                        {selectedStudents.length !== 1
                                            ? "s"
                                            : ""}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Icon Components for Intervention Strategies ---
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
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75"
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

// --- Start Intervention Modal (NEW) ---
function StartInterventionModal({ open, onClose, enrollmentId, studentName }) {
    const { data, setData, post, processing, reset } = useForm({
        enrollment_id: enrollmentId,
        type: "parent_contact",
        notes: "",
        tasks: [],
    });

    // State for new task input
    const [newTask, setNewTask] = useState("");

    // Update enrollment_id when prop changes
    useEffect(() => {
        setData("enrollment_id", enrollmentId);
    }, [enrollmentId]);

    if (!open) return null;

    // Add a new task to the list
    const addTask = () => {
        if (newTask.trim()) {
            setData("tasks", [...data.tasks, newTask.trim()]);
            setNewTask("");
        }
    };

    // Remove a task from the list
    const removeTask = (index) => {
        setData(
            "tasks",
            data.tasks.filter((_, i) => i !== index)
        );
    };

    // Handle Enter key in task input
    const handleTaskKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTask();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("teacher.interventions.store"), {
            onSuccess: () => {
                reset();
                setNewTask("");
                onClose();
            },
        });
    };

    // Intervention strategies with icons, descriptions, and tier colors
    const interventionStrategies = {
        automated_nudge: {
            iconKey: "automated_nudge",
            label: "Send Reminder Nudge",
            description:
                "Sends a notification to the student's dashboard reminding them of goals.",
            tier: 1,
            tierLabel: "Low Touch",
            tierColor: "emerald",
        },
        task_list: {
            iconKey: "task_list",
            label: "Create Goal Checklist",
            description:
                "Creates a manual checklist of goals (e.g., 'Submit Lab Report') for the student.",
            tier: 2,
            tierLabel: "Teacher Led",
            tierColor: "amber",
        },
        extension_grant: {
            iconKey: "extension_grant",
            label: "Grant Deadline Extension",
            description:
                "Officially extends the deadline for the current missing assignment by 3 days.",
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
                "A signed contract where student agrees to complete missing tasks by a deadline. Signed physically by student.",
            tier: 3,
            tierLabel: "Intensive",
            tierColor: "red",
        },
        one_on_one_meeting: {
            iconKey: "one_on_one_meeting",
            label: "One-on-One Intervention Meeting",
            description:
                "Mandatory meeting to diagnose the real issue (personal, academic, time management). Record notes after the session.",
            tier: 3,
            tierLabel: "Intensive",
            tierColor: "red",
        },
    };

    const selectedStrategy = interventionStrategies[data.type];

    const getTierBadgeClasses = (tierColor) => {
        const colorMap = {
            emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
            amber: "bg-amber-100 text-amber-700 border-amber-200",
            red: "bg-red-100 text-red-700 border-red-200",
        };
        return (
            colorMap[tierColor] || "bg-gray-100 text-gray-700 border-gray-200"
        );
    };

    const getTierBgClasses = (tierColor) => {
        const colorMap = {
            emerald:
                "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200",
            amber: "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200",
            red: "bg-gradient-to-r from-red-50 to-rose-50 border-red-200",
        };
        return colorMap[tierColor] || "bg-gray-50 border-gray-200";
    };

    const getIconColorClasses = (tierColor, isSelected) => {
        if (isSelected) {
            return "text-indigo-600";
        }
        const colorMap = {
            emerald: "text-emerald-600",
            amber: "text-amber-600",
            red: "text-red-600",
        };
        return colorMap[tierColor] || "text-gray-600";
    };

    const renderIcon = (iconKey, tierColor, isSelected) => {
        const IconComponent = StrategyIcons[iconKey];
        if (!IconComponent) return null;
        return (
            <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected
                        ? "bg-indigo-100"
                        : tierColor === "emerald"
                        ? "bg-emerald-100"
                        : tierColor === "amber"
                        ? "bg-amber-100"
                        : "bg-red-100"
                }`}
            >
                <IconComponent
                    className={`w-5 h-5 ${getIconColorClasses(
                        tierColor,
                        isSelected
                    )}`}
                />
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-white"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Start New Intervention
                                </h2>
                                <p className="text-indigo-100 text-sm">
                                    for{" "}
                                    <span className="font-semibold">
                                        {studentName}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
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
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* Intervention Strategy Cards */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-800 mb-3">
                                Choose Intervention Strategy
                            </label>

                            {/* All Tiers in a Grid Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Tier 1 Column */}
                                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                                            1
                                        </span>
                                        <div>
                                            <span className="text-sm font-bold text-emerald-700">
                                                Tier 1
                                            </span>
                                            <span className="text-xs text-emerald-600 ml-1">
                                                • Automated
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {Object.entries(interventionStrategies)
                                            .filter(([_, s]) => s.tier === 1)
                                            .map(([key, strategy]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() =>
                                                        setData("type", key)
                                                    }
                                                    className={`relative w-full p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                                                        data.type === key
                                                            ? "border-indigo-500 bg-white ring-2 ring-indigo-200 shadow-md"
                                                            : "border-transparent bg-white/80 hover:bg-white hover:border-emerald-200"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {renderIcon(
                                                            strategy.iconKey,
                                                            strategy.tierColor,
                                                            data.type === key
                                                        )}
                                                        <p
                                                            className={`font-medium text-sm flex-1 ${
                                                                data.type ===
                                                                key
                                                                    ? "text-indigo-900"
                                                                    : "text-gray-700"
                                                            }`}
                                                        >
                                                            {strategy.label}
                                                        </p>
                                                        {data.type === key && (
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
                                            ))}
                                    </div>
                                </div>

                                {/* Tier 2 Column */}
                                <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                                            2
                                        </span>
                                        <div>
                                            <span className="text-sm font-bold text-amber-700">
                                                Tier 2
                                            </span>
                                            <span className="text-xs text-amber-600 ml-1">
                                                • Teacher Led
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {Object.entries(interventionStrategies)
                                            .filter(([_, s]) => s.tier === 2)
                                            .map(([key, strategy]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() =>
                                                        setData("type", key)
                                                    }
                                                    className={`relative w-full p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                                                        data.type === key
                                                            ? "border-indigo-500 bg-white ring-2 ring-indigo-200 shadow-md"
                                                            : "border-transparent bg-white/80 hover:bg-white hover:border-amber-200"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {renderIcon(
                                                            strategy.iconKey,
                                                            strategy.tierColor,
                                                            data.type === key
                                                        )}
                                                        <p
                                                            className={`font-medium text-sm flex-1 ${
                                                                data.type ===
                                                                key
                                                                    ? "text-indigo-900"
                                                                    : "text-gray-700"
                                                            }`}
                                                        >
                                                            {strategy.label}
                                                        </p>
                                                        {data.type === key && (
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
                                            ))}
                                    </div>
                                </div>

                                {/* Tier 3 Column */}
                                <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                                            3
                                        </span>
                                        <div>
                                            <span className="text-sm font-bold text-red-700">
                                                Tier 3
                                            </span>
                                            <span className="text-xs text-red-600 ml-1">
                                                • Intensive
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {Object.entries(interventionStrategies)
                                            .filter(([_, s]) => s.tier === 3)
                                            .map(([key, strategy]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() =>
                                                        setData("type", key)
                                                    }
                                                    className={`relative w-full p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                                                        data.type === key
                                                            ? "border-red-400 bg-white ring-2 ring-red-200 shadow-md"
                                                            : "border-transparent bg-white/80 hover:bg-white hover:border-red-200"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {renderIcon(
                                                            strategy.iconKey,
                                                            strategy.tierColor,
                                                            data.type === key
                                                        )}
                                                        <div className="flex-1">
                                                            <p
                                                                className={`font-medium text-sm ${
                                                                    data.type ===
                                                                    key
                                                                        ? "text-red-900"
                                                                        : "text-gray-700"
                                                                }`}
                                                            >
                                                                {strategy.label}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                Escalates to
                                                                guidance office
                                                            </p>
                                                        </div>
                                                        {data.type === key && (
                                                            <svg
                                                                className="w-5 h-5 text-red-600 flex-shrink-0"
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
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Selected Strategy Info Box */}
                        <div
                            className={`mb-5 p-4 rounded-xl border ${getTierBgClasses(
                                selectedStrategy.tierColor
                            )}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-11 h-11 bg-white rounded-lg shadow-sm flex items-center justify-center">
                                    {(() => {
                                        const IconComponent =
                                            StrategyIcons[
                                                selectedStrategy.iconKey
                                            ];
                                        return IconComponent ? (
                                            <IconComponent
                                                className={`w-6 h-6 ${getIconColorClasses(
                                                    selectedStrategy.tierColor,
                                                    false
                                                )}`}
                                            />
                                        ) : null;
                                    })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900">
                                            {selectedStrategy.label}
                                        </h4>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getTierBadgeClasses(
                                                selectedStrategy.tierColor
                                            )}`}
                                        >
                                            Tier {selectedStrategy.tier} •{" "}
                                            {selectedStrategy.tierLabel}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {selectedStrategy.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notes / Context */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                <span className="flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 text-gray-500"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Additional Notes
                                    <span className="text-gray-400 font-normal">
                                        (Optional)
                                    </span>
                                </span>
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(e) =>
                                    setData("notes", e.target.value)
                                }
                                className="w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-24 resize-none transition-colors text-sm"
                                placeholder="Add context, specific instructions, or follow-up details...&#10;Example: 'Spoke to mother, she will monitor homework tonight' or 'Focus on Quadratic Equations'"
                            />
                        </div>

                        {/* Task List Input - Only shown when task_list is selected */}
                        {data.type === "task_list" && (
                            <div className="mb-5 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <label className="block text-sm font-semibold text-amber-800 mb-3">
                                    <span className="flex items-center gap-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                            <path
                                                fillRule="evenodd"
                                                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Goal Checklist Tasks
                                        <span className="text-amber-600 font-normal">
                                            (Add at least 1 task)
                                        </span>
                                    </span>
                                </label>

                                {/* Task Input */}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newTask}
                                        onChange={(e) =>
                                            setNewTask(e.target.value)
                                        }
                                        onKeyDown={handleTaskKeyDown}
                                        placeholder="e.g., Submit missing Lab Report by Friday"
                                        className="flex-1 border-amber-300 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={addTask}
                                        disabled={!newTask.trim()}
                                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 font-medium text-sm"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Add
                                    </button>
                                </div>

                                {/* Task List */}
                                {data.tasks.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.tasks.map((task, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 bg-white p-3 rounded-lg border border-amber-100 group"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-amber-700">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <span className="flex-1 text-sm text-gray-700">
                                                    {task}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeTask(index)
                                                    }
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
                                    <div className="text-center py-4 text-amber-600 text-sm">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-8 w-8 mx-auto mb-2 opacity-50"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                            />
                                        </svg>
                                        No tasks added yet. Add tasks for the
                                        student to complete.
                                    </div>
                                )}

                                <p className="text-xs text-amber-600 mt-3">
                                    💡 Tip: Press Enter to quickly add tasks.
                                    Students will see these on their dashboard.
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                                {data.type === "task_list" &&
                                data.tasks.length === 0
                                    ? "⚠️ Please add at least one task before starting"
                                    : "This will create a new intervention record"}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        (data.type === "task_list" &&
                                            data.tasks.length === 0)
                                    }
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <svg
                                                className="animate-spin h-4 w-4"
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
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Saving...
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
            </div>
        </div>
    );
}

// --- Student Profile Component ---
function StudentInterventionProfile({ enrollmentId, studentData, onBack }) {
    const [student, setStudent] = useState(null);
    const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
    // NEW: State for Intervention Modal
    const [isInterventionModalOpen, setIsInterventionModalOpen] =
        useState(false);

    useEffect(() => {
        if (studentData) {
            setStudent({ ...studentData });
        }
    }, [studentData]);

    const handleAddFeedback = (message) => {
        const newFeedback = {
            id: Date.now(),
            date: new Date().toISOString().split("T")[0],
            action: "Teacher Feedback",
            notes: message,
        };
        setStudent((prev) => ({
            ...prev,
            interventionLog: [...prev.interventionLog, newFeedback],
        }));
    };

    if (!student) return <div className="p-6 text-gray-500">Loading...</div>;

    const numericGrade = parseInt(student.currentGrade);
    const showAISuggestion = numericGrade < 75;

    // Helper for initials
    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    return (
        <div className="p-4 sm:p-6 bg-white rounded-lg shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <button
                    onClick={onBack}
                    className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                </button>
                {/* NEW: Start Intervention Button */}
                <button
                    onClick={() => setIsInterventionModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 transition-all font-medium"
                >
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
                    Start New Intervention
                </button>
            </div>

            {/* Snapshot */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-200">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 mb-4 sm:mb-0 sm:mr-6 shadow-lg">
                    {getInitials(student.name)}
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {student.name}
                    </h2>
                    <div className="mt-3 space-y-1.5">
                        <p className="text-sm text-gray-600 flex items-center justify-center sm:justify-start gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-gray-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            <span className="font-medium text-gray-700">
                                Parent:
                            </span>{" "}
                            {student.parentContact}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center justify-center sm:justify-start gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-gray-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="font-medium text-gray-700">
                                Counselor:
                            </span>{" "}
                            {student.counselor}
                        </p>
                        {student.specialPrograms.length > 0 && (
                            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-2">
                                {student.specialPrograms.map((program, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                                    >
                                        {program}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Vitals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            Academic Status
                        </h3>
                        <div
                            className={`w-3 h-3 rounded-full ${
                                numericGrade < 75
                                    ? "bg-red-500"
                                    : "bg-green-500"
                            }`}
                        ></div>
                    </div>
                    <p
                        className={`text-4xl font-bold ${
                            numericGrade < 75
                                ? "text-red-600"
                                : "text-green-600"
                        }`}
                    >
                        {student.currentGrade}
                    </p>
                    {student.gradeTrend && student.gradeTrend.length > 1 && (
                        <p className="text-sm text-gray-500 mt-3 flex items-center gap-1.5">
                            {student.gradeTrend[0] >
                            student.gradeTrend[
                                student.gradeTrend.length - 1
                            ] ? (
                                <>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 text-red-500"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-red-500 font-medium">
                                        Decreasing
                                    </span>
                                </>
                            ) : student.gradeTrend[0] <
                              student.gradeTrend[
                                  student.gradeTrend.length - 1
                              ] ? (
                                <>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 text-green-500"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-green-500 font-medium">
                                        Increasing
                                    </span>
                                </>
                            ) : (
                                <>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 text-gray-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-gray-500 font-medium">
                                        Stable
                                    </span>
                                </>
                            )}
                        </p>
                    )}
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Engagement
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-blue-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                            {student.attendanceSummary}
                        </span>
                    </div>
                    {student.missingAssignments &&
                        student.missingAssignments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
                                    Missing ({student.missingAssignments.length}
                                    )
                                </p>
                                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                                    {student.missingAssignments.map(
                                        (assignment) => (
                                            <div
                                                key={assignment.id}
                                                className="flex items-center gap-2 text-sm text-gray-600"
                                            >
                                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></span>
                                                <span className="truncate">
                                                    {assignment.title}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Behavioral Notes
                    </h3>
                    {student.behaviorLog && student.behaviorLog.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {student.behaviorLog.map((log, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-2 text-sm text-gray-600"
                                >
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0 mt-1.5"></span>
                                    <span>{log}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="text-sm">
                                No behavioral concerns
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* System Suggested Intervention */}
            {showAISuggestion && (
                <div className="mt-6 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border border-amber-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-white"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    Attention Required
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    This student's academic performance is below
                                    the passing threshold. Consider taking
                                    action to help improve their grades.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() =>
                                            setOpenFeedbackModal(true)
                                        }
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all text-sm font-medium"
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
                                            setIsInterventionModalOpen(true)
                                        }
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all text-sm font-medium"
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
                                        Start Intervention
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Intervention Log */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                        Intervention History
                    </h3>
                    <span className="text-sm text-gray-500">
                        {student.interventionLog.length} record
                        {student.interventionLog.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {student.interventionLog.length > 0 ? (
                    <div className="space-y-3">
                        {student.interventionLog.map((log) => (
                            <div
                                key={log.id}
                                className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                                            <span className="text-sm font-semibold text-gray-900">
                                                {log.action}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                •
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {log.date}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
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
                    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center">
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
                        <p className="text-gray-500 font-medium">
                            No intervention history yet
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            Start an intervention to create the first record
                        </p>
                    </div>
                )}
            </div>

            <FeedbackModal
                open={openFeedbackModal}
                onClose={() => setOpenFeedbackModal(false)}
                onSubmit={handleAddFeedback}
                studentName={student.name}
            />

            {/* NEW: Render the Intervention Modal */}
            <StartInterventionModal
                open={isInterventionModalOpen}
                onClose={() => setIsInterventionModalOpen(false)}
                enrollmentId={enrollmentId}
                studentName={student.name}
            />
        </div>
    );
}

// --- Parent Component ---
function InterventionCenter({ watchlist = [], studentDetails = {} }) {
    const { startLoading, stopLoading } = useLoading();
    const [students, setStudents] = useState(watchlist);
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(null);

    useEffect(() => {
        setStudents(watchlist);
    }, [watchlist]);

    const handleSelectStudent = (enrollmentId) => {
        startLoading();
        setTimeout(() => {
            setSelectedEnrollmentId(enrollmentId);
            stopLoading();
        }, 300);
    };

    const handleBackToDashboard = () => {
        startLoading();
        setTimeout(() => {
            setSelectedEnrollmentId(null);
            stopLoading();
        }, 300);
    };

    const selectedStudentData = selectedEnrollmentId
        ? studentDetails[selectedEnrollmentId]
        : null;

    return (
        <div className="p-4 sm:p-6 font-sans">
            <div className="flex items-center gap-4 border-b pb-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Intervention Center
                    </h1>
                    <p className="text-sm text-gray-500">
                        Monitor and support students who need academic
                        intervention
                    </p>
                </div>
            </div>

            {selectedEnrollmentId && selectedStudentData ? (
                <StudentInterventionProfile
                    enrollmentId={selectedEnrollmentId}
                    studentData={selectedStudentData}
                    onBack={handleBackToDashboard}
                />
            ) : (
                <InterventionDashboard
                    students={students}
                    onSelectStudent={handleSelectStudent}
                />
            )}
        </div>
    );
}

const Interventions = ({ watchlist = [], studentDetails = {} }) => {
    return (
        <div className="bg-gray-100 min-h-screen">
            <InterventionCenter
                watchlist={watchlist}
                studentDetails={studentDetails}
            />
        </div>
    );
};

Interventions.layout = (page) => <TeacherLayout children={page} />;

export default Interventions;

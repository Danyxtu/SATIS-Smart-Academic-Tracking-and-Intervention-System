import React, { useState } from "react";
import Modal from "@/Components/Modal";
import {
    X,
    FileText,
    AlertTriangle,
    TrendingDown,
    Eye,
    FileDown,
    Loader2,
} from "lucide-react";

export default function PriorityStudentsReportModal({
    show,
    onClose,
    priorityStudents,
    academicPeriod,
    department,
}) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [filters, setFilters] = useState({
        critical: true,
        warning: true,
        watchlist: true,
    });

    const toggleFilter = (key) => {
        setFilters((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const selectAll = () => {
        setFilters({
            critical: true,
            warning: true,
            watchlist: true,
        });
    };

    const deselectAll = () => {
        setFilters({
            critical: false,
            warning: false,
            watchlist: false,
        });
    };

    const hasAnySelection =
        filters.critical || filters.warning || filters.watchlist;

    const getSelectedCount = () => {
        let count = 0;
        if (filters.critical) count += priorityStudents?.critical?.length || 0;
        if (filters.warning) count += priorityStudents?.warning?.length || 0;
        if (filters.watchlist)
            count += priorityStudents?.watchList?.length || 0;
        return count;
    };

    const handleGeneratePdf = async () => {
        if (!hasAnySelection) return;

        setIsGenerating(true);

        try {
            // Build query parameters
            const params = new URLSearchParams();
            params.append("critical", filters.critical ? "1" : "0");
            params.append("warning", filters.warning ? "1" : "0");
            params.append("watchlist", filters.watchlist ? "1" : "0");

            // Trigger download
            window.location.href =
                route("teacher.dashboard.priority-students.pdf") +
                "?" +
                params.toString();

            // Close modal after a short delay
            setTimeout(() => {
                setIsGenerating(false);
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Error generating PDF:", error);
            setIsGenerating(false);
        }
    };

    const filterOptions = [
        {
            key: "critical",
            label: "Students at Risk (Critical)",
            description: "Students with grades below 70%",
            count: priorityStudents?.critical?.length || 0,
            icon: AlertTriangle,
            color: "red",
            bgColor: "bg-red-50 dark:bg-red-900/20",
            borderColor: "border-red-200 dark:border-red-800",
            textColor: "text-red-700 dark:text-red-400",
            iconColor: "text-red-500",
            checkedBg: "bg-red-500",
        },
        {
            key: "warning",
            label: "Needs Attention (Warning)",
            description: "Students with grades between 70-74%",
            count: priorityStudents?.warning?.length || 0,
            icon: Eye,
            color: "amber",
            bgColor: "bg-amber-50 dark:bg-amber-900/20",
            borderColor: "border-amber-200 dark:border-amber-800",
            textColor: "text-amber-700 dark:text-amber-400",
            iconColor: "text-amber-500",
            checkedBg: "bg-amber-500",
        },
        {
            key: "watchlist",
            label: "Recent Declines (Watchlist)",
            description: "Students with grades 75-79% and declining trend",
            count: priorityStudents?.watchList?.length || 0,
            icon: TrendingDown,
            color: "blue",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            borderColor: "border-blue-200 dark:border-blue-800",
            textColor: "text-blue-700 dark:text-blue-400",
            iconColor: "text-blue-500",
            checkedBg: "bg-blue-500",
        },
    ];

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    Generate Priority Students Report
                                </h3>
                                <p className="text-sm text-indigo-100">
                                    Configure which students to include in the
                                    PDF report
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Report Info */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Report Details
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {academicPeriod && (
                                <>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            School Year:
                                        </span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                            {academicPeriod.schoolYear}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Semester:
                                        </span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                            {academicPeriod.semester === 1
                                                ? "1st"
                                                : "2nd"}{" "}
                                            Semester
                                        </span>
                                    </div>
                                </>
                            )}
                            {department && (
                                <div className="col-span-2">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Department:
                                    </span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {department.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select Categories to Include
                        </h4>
                        <div className="flex gap-2">
                            <button
                                onClick={selectAll}
                                className="text-xs px-3 py-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                            >
                                Select All
                            </button>
                            <button
                                onClick={deselectAll}
                                className="text-xs px-3 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>

                    {/* Filter Options */}
                    <div className="space-y-3">
                        {filterOptions.map((option) => {
                            const Icon = option.icon;
                            const isChecked = filters[option.key];

                            return (
                                <button
                                    key={option.key}
                                    onClick={() => toggleFilter(option.key)}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                        isChecked
                                            ? `${option.bgColor} ${option.borderColor}`
                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <div
                                            className={`flex-shrink-0 w-5 h-5 rounded mt-0.5 flex items-center justify-center ${
                                                isChecked
                                                    ? option.checkedBg
                                                    : "border-2 border-gray-300 dark:border-gray-600"
                                            }`}
                                        >
                                            {isChecked && (
                                                <svg
                                                    className="w-3 h-3 text-white"
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M10 3L4.5 8.5L2 6"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Icon */}
                                        <div
                                            className={`flex-shrink-0 p-2 rounded-lg ${option.bgColor}`}
                                        >
                                            <Icon
                                                className={`w-5 h-5 ${option.iconColor}`}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span
                                                    className={`font-medium ${
                                                        isChecked
                                                            ? option.textColor
                                                            : "text-gray-900 dark:text-white"
                                                    }`}
                                                >
                                                    {option.label}
                                                </span>
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        isChecked
                                                            ? `${option.bgColor} ${option.textColor}`
                                                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                                    }`}
                                                >
                                                    {option.count} student
                                                    {option.count !== 1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                                    Total Students Selected
                                </p>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                                    These students will be included in the
                                    report
                                </p>
                            </div>
                            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                {getSelectedCount()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        The report will include a summary section at the end
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGeneratePdf}
                            disabled={!hasAnySelection || isGenerating}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition-all ${
                                hasAnySelection && !isGenerating
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4" />
                                    Generate PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

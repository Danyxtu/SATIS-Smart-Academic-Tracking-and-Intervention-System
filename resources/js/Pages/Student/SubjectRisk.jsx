import React, { useState, Fragment } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { Dialog, Transition } from "@headlessui/react";
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    TrendingUp,
    TrendingDown,
    Minus,
    X,
    User,
    Calendar,
    BookOpen,
    Target,
    BarChart3,
    Clock,
    AlertCircle,
    ChevronRight,
    Award,
    FileText,
    CheckSquare,
    Square,
    Info,
    ShieldAlert,
    ShieldCheck,
    Shield,
} from "lucide-react";

// --- Risk Level Badge ---
const RiskBadge = ({ level, size = "md" }) => {
    const config = {
        high: {
            bg: "bg-red-100 dark:bg-red-900/30",
            text: "text-red-700 dark:text-red-300",
            border: "border-red-200 dark:border-red-700/50",
            icon: XCircle,
            label: "High Risk",
        },
        medium: {
            bg: "bg-yellow-100 dark:bg-yellow-900/30",
            text: "text-yellow-700 dark:text-yellow-300",
            border: "border-yellow-200 dark:border-yellow-700/50",
            icon: AlertTriangle,
            label: "Medium Risk",
        },
        low: {
            bg: "bg-green-100 dark:bg-green-900/30",
            text: "text-green-700 dark:text-green-300",
            border: "border-green-200 dark:border-green-700/50",
            icon: CheckCircle,
            label: "Low Risk",
        },
    };

    const c = config[level] || config.low;
    const Icon = c.icon;
    const sizeClasses =
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold border ${c.bg} ${c.text} ${c.border} ${sizeClasses}`}
        >
            <Icon size={size === "sm" ? 12 : 14} />
            {c.label}
        </span>
    );
};

// --- Trend Indicator ---
const TrendIndicator = ({ trend }) => {
    const config = {
        improving: {
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/25",
            label: "Improving",
        },
        declining: {
            icon: TrendingDown,
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-900/25",
            label: "Declining",
        },
        stable: {
            icon: Minus,
            color: "text-gray-600 dark:text-gray-300",
            bg: "bg-gray-50 dark:bg-gray-700/50",
            label: "Stable",
        },
        new: {
            icon: Minus,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/25",
            label: "New",
        },
    };

    const c = config[trend] || config.stable;
    const Icon = c.icon;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color} ${c.bg}`}
        >
            <Icon size={12} />
            {c.label}
        </span>
    );
};

// --- Progress Bar ---
const ProgressBar = ({
    value,
    max = 100,
    color = "pink",
    showLabel = true,
    size = "md",
}) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const colors = {
        pink: "bg-pink-500",
        green: "bg-green-500",
        yellow: "bg-yellow-500",
        red: "bg-red-500",
        blue: "bg-blue-500",
    };

    const heightClass = size === "sm" ? "h-1.5" : "h-2";

    return (
        <div className="flex items-center gap-2">
            <div
                className={`flex-1 bg-gray-200 dark:bg-gray-700 rounded-full ${heightClass}`}
            >
                <div
                    className={`${colors[color]} ${heightClass} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-10 text-right">
                    {Math.round(percentage)}%
                </span>
            )}
        </div>
    );
};

// --- Stat Card for Summary ---
const StatCard = ({ icon: Icon, label, value, color = "gray" }) => {
    const colors = {
        red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
        yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300",
        green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300",
        gray: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors[color]}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {label}
                </p>
            </div>
        </div>
    );
};

// --- Subject Card ---
const SubjectCard = ({ subject, onClick }) => {
    const gradeColor =
        subject.currentGrade !== null
            ? subject.currentGrade < 70
                ? "red"
                : subject.currentGrade < 75
                  ? "yellow"
                  : "green"
            : "gray";

    const riskBorderColors = {
        high: "border-l-red-500 hover:border-red-200 dark:hover:border-red-700/60",
        medium: "border-l-yellow-500 hover:border-yellow-200 dark:hover:border-yellow-700/60",
        low: "border-l-green-500 hover:border-green-200 dark:hover:border-green-700/60",
    };

    return (
        <button
            onClick={onClick}
            className={`w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 ${
                riskBorderColors[subject.riskLevel]
            } p-4 text-left hover:shadow-md transition-all duration-200 group`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {subject.subjectName}
                        </h3>
                        <TrendIndicator trend={subject.trend} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-3">
                        <User size={12} />
                        {subject.teacherName}
                        {subject.section && ` • ${subject.section}`}
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Grade
                            </p>
                            <p
                                className={`text-lg font-bold ${
                                    gradeColor === "red"
                                        ? "text-red-600"
                                        : gradeColor === "yellow"
                                          ? "text-yellow-600"
                                          : "text-green-600"
                                }`}
                            >
                                {subject.currentGrade !== null
                                    ? `${subject.currentGrade}%`
                                    : "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">
                                Attendance
                            </p>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                {subject.attendanceRate}%
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">
                                Missing
                            </p>
                            <p
                                className={`text-lg font-bold ${
                                    subject.missingWork > 0
                                        ? "text-red-600"
                                        : "text-green-600"
                                }`}
                            >
                                {subject.missingWork}
                            </p>
                        </div>
                    </div>

                    {subject.riskReasons.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                            {subject.riskReasons
                                .slice(0, 2)
                                .map((reason, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300"
                                    >
                                        <AlertCircle size={10} />
                                        {reason}
                                    </span>
                                ))}
                            {subject.riskReasons.length > 2 && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    +{subject.riskReasons.length - 2} more
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2">
                    <RiskBadge level={subject.riskLevel} size="sm" />
                    <ChevronRight
                        size={20}
                        className="text-gray-400 dark:text-gray-500 group-hover:text-pink-500 transition-colors"
                    />
                </div>
            </div>
        </button>
    );
};

// --- Detail Panel (Slide-over) ---
const DetailPanel = ({ subject, isOpen, onClose }) => {
    if (!subject) return null;

    const gradeColor =
        subject.currentGrade !== null
            ? subject.currentGrade < 70
                ? "red"
                : subject.currentGrade < 75
                  ? "yellow"
                  : "green"
            : "pink";

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-xl overflow-y-auto">
                                        {/* Header */}
                                        <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-5">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Dialog.Title className="text-xl font-bold text-white">
                                                        {subject.subjectName}
                                                    </Dialog.Title>
                                                    <p className="text-pink-100 text-sm mt-1 flex items-center gap-1">
                                                        <User size={14} />
                                                        {subject.teacherName}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={onClose}
                                                    className="z-10 text-white/80 hover:text-white transition-colors"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>
                                            <div className="mt-4">
                                                <RiskBadge
                                                    level={subject.riskLevel}
                                                />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 px-6 py-5 space-y-6">
                                            {/* Risk Reasons */}
                                            {subject.riskReasons.length > 0 && (
                                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-700/40 rounded-xl p-4">
                                                    <h4 className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2 mb-3">
                                                        <AlertCircle
                                                            size={16}
                                                        />
                                                        Risk Factors
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {subject.riskReasons.map(
                                                            (reason, idx) => (
                                                                <li
                                                                    key={idx}
                                                                    className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300"
                                                                >
                                                                    <XCircle
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="flex-shrink-0 mt-0.5"
                                                                    />
                                                                    {reason}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Grade Overview */}
                                            <div>
                                                <h4 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-3">
                                                    <Award
                                                        size={16}
                                                        className="text-pink-500"
                                                    />
                                                    Grade Overview
                                                </h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                            Current Grade
                                                        </p>
                                                        <p
                                                            className={`text-2xl font-bold ${
                                                                gradeColor ===
                                                                "red"
                                                                    ? "text-red-600"
                                                                    : gradeColor ===
                                                                        "yellow"
                                                                      ? "text-yellow-600"
                                                                      : "text-green-600"
                                                            }`}
                                                        >
                                                            {subject.currentGrade !==
                                                            null
                                                                ? `${subject.currentGrade}%`
                                                                : "N/A"}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                            Expected Grade
                                                        </p>
                                                        <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                                                            {subject.expectedGrade !==
                                                            null
                                                                ? `${subject.expectedGrade}%`
                                                                : "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        Trend
                                                    </span>
                                                    <TrendIndicator
                                                        trend={subject.trend}
                                                    />
                                                </div>
                                            </div>

                                            {/* Grade Breakdown by Category */}
                                            {Object.keys(
                                                subject.gradesByCategory,
                                            ).length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-3">
                                                        <BarChart3
                                                            size={16}
                                                            className="text-pink-500"
                                                        />
                                                        Grade Breakdown
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {Object.entries(
                                                            subject.gradesByCategory,
                                                        ).map(
                                                            ([
                                                                category,
                                                                data,
                                                            ]) => (
                                                                <div
                                                                    key={
                                                                        category
                                                                    }
                                                                >
                                                                    <div className="flex justify-between text-sm mb-1">
                                                                        <span className="text-gray-600 dark:text-gray-300 capitalize">
                                                                            {
                                                                                category
                                                                            }
                                                                        </span>
                                                                        <span className="font-medium text-gray-800 dark:text-gray-100">
                                                                            {data.percentage !==
                                                                            null
                                                                                ? `${data.percentage}%`
                                                                                : "N/A"}
                                                                        </span>
                                                                    </div>
                                                                    <ProgressBar
                                                                        value={
                                                                            data.percentage ||
                                                                            0
                                                                        }
                                                                        color={
                                                                            data.percentage <
                                                                            70
                                                                                ? "red"
                                                                                : data.percentage <
                                                                                    75
                                                                                  ? "yellow"
                                                                                  : "green"
                                                                        }
                                                                        showLabel={
                                                                            false
                                                                        }
                                                                        size="sm"
                                                                    />
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recent Grades */}
                                            {subject.recentGrades.length >
                                                0 && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-3">
                                                        <FileText
                                                            size={16}
                                                            className="text-pink-500"
                                                        />
                                                        Recent Grades
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {subject.recentGrades.map(
                                                            (grade) => (
                                                                <div
                                                                    key={
                                                                        grade.id
                                                                    }
                                                                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                                                                >
                                                                    <div>
                                                                        <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                                                                            {
                                                                                grade.name
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {
                                                                                grade.category
                                                                            }{" "}
                                                                            •{" "}
                                                                            {
                                                                                grade.date
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p
                                                                            className={`font-bold ${
                                                                                grade.percentage <
                                                                                70
                                                                                    ? "text-red-600"
                                                                                    : grade.percentage <
                                                                                        75
                                                                                      ? "text-yellow-600"
                                                                                      : "text-green-600"
                                                                            }`}
                                                                        >
                                                                            {
                                                                                grade.percentage
                                                                            }
                                                                            %
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {
                                                                                grade.score
                                                                            }
                                                                            /
                                                                            {
                                                                                grade.totalScore
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Attendance */}
                                            <div>
                                                <h4 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-3">
                                                    <Calendar
                                                        size={16}
                                                        className="text-pink-500"
                                                    />
                                                    Attendance
                                                </h4>
                                                <div className="grid grid-cols-4 gap-2 text-center">
                                                    <div className="bg-blue-50 dark:bg-blue-900/25 rounded-lg p-2">
                                                        <p className="text-lg font-bold text-blue-600">
                                                            {
                                                                subject.totalClasses
                                                            }
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Total
                                                        </p>
                                                    </div>
                                                    <div className="bg-green-50 dark:bg-green-900/25 rounded-lg p-2">
                                                        <p className="text-lg font-bold text-green-600">
                                                            {
                                                                subject.presentDays
                                                            }
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Present
                                                        </p>
                                                    </div>
                                                    <div className="bg-red-50 dark:bg-red-900/25 rounded-lg p-2">
                                                        <p className="text-lg font-bold text-red-600">
                                                            {subject.absentDays}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Absent
                                                        </p>
                                                    </div>
                                                    <div className="bg-yellow-50 dark:bg-yellow-900/25 rounded-lg p-2">
                                                        <p className="text-lg font-bold text-yellow-600">
                                                            {subject.lateDays}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Late
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-600 dark:text-gray-300">
                                                            Attendance Rate
                                                        </span>
                                                        <span className="font-medium text-gray-800 dark:text-gray-100">
                                                            {
                                                                subject.attendanceRate
                                                            }
                                                            %
                                                        </span>
                                                    </div>
                                                    <ProgressBar
                                                        value={
                                                            subject.attendanceRate
                                                        }
                                                        color={
                                                            subject.attendanceRate <
                                                            80
                                                                ? "red"
                                                                : subject.attendanceRate <
                                                                    90
                                                                  ? "yellow"
                                                                  : "green"
                                                        }
                                                        showLabel={false}
                                                    />
                                                </div>
                                            </div>

                                            {/* Intervention */}
                                            {subject.intervention && (
                                                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-700/40 rounded-xl p-4">
                                                    <h4 className="font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2 mb-2">
                                                        <Target size={16} />
                                                        Active Intervention
                                                    </h4>
                                                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                                                        {
                                                            subject.intervention
                                                                .typeLabel
                                                        }
                                                    </p>
                                                    {subject.intervention
                                                        .notes && (
                                                        <p className="text-sm text-orange-600 dark:text-orange-300 bg-orange-100/50 dark:bg-orange-900/30 rounded-lg p-2 mb-3">
                                                            {
                                                                subject
                                                                    .intervention
                                                                    .notes
                                                            }
                                                        </p>
                                                    )}
                                                    {subject.intervention.tasks
                                                        .length > 0 && (
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">
                                                                Tasks:
                                                            </p>
                                                            {subject.intervention.tasks.map(
                                                                (task) => (
                                                                    <div
                                                                        key={
                                                                            task.id
                                                                        }
                                                                        className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300"
                                                                    >
                                                                        {task.isCompleted ? (
                                                                            <CheckSquare
                                                                                size={
                                                                                    14
                                                                                }
                                                                                className="text-green-600"
                                                                            />
                                                                        ) : (
                                                                            <Square
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />
                                                                        )}
                                                                        <span
                                                                            className={
                                                                                task.isCompleted
                                                                                    ? "line-through opacity-60"
                                                                                    : ""
                                                                            }
                                                                        >
                                                                            {
                                                                                task.description
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* View Full Analytics Button */}
                                            <Link
                                                href={route("analytics.show", {
                                                    enrollment: subject.id,
                                                })}
                                                className="block w-full text-center bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 rounded-xl transition-colors"
                                            >
                                                View Full Analytics
                                            </Link>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

// --- Empty State ---
const EmptyState = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
        <ShieldCheck size={64} className="mx-auto text-green-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            All Subjects Looking Good!
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            You're doing great! None of your subjects are currently at risk.
            Keep up the excellent work!
        </p>
    </div>
);

// --- Main Component ---
const SubjectRisk = ({ subjects = [], stats = {} }) => {
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [filter, setFilter] = useState("all");

    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject);
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setTimeout(() => setSelectedSubject(null), 300);
    };

    // Filter subjects
    const filteredSubjects = subjects.filter((subject) => {
        if (filter === "all") return true;
        return subject.riskLevel === filter;
    });

    return (
        <AuthenticatedLayout>
            <Head title="Subjects at Risk" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <ShieldAlert size={32} className="text-pink-600" />
                        Subjects at Risk
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Monitor your academic performance and identify areas
                        needing attention
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard
                        icon={BookOpen}
                        label="Total Subjects"
                        value={stats.total || 0}
                        color="gray"
                    />
                    <StatCard
                        icon={XCircle}
                        label="High Risk"
                        value={stats.highRisk || 0}
                        color="red"
                    />
                    <StatCard
                        icon={AlertTriangle}
                        label="Medium Risk"
                        value={stats.mediumRisk || 0}
                        color="yellow"
                    />
                    <StatCard
                        icon={CheckCircle}
                        label="Low Risk"
                        value={stats.lowRisk || 0}
                        color="green"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full p-1 w-fit">
                    {[
                        { key: "all", label: "All", count: subjects.length },
                        {
                            key: "high",
                            label: "High",
                            count: stats.highRisk || 0,
                        },
                        {
                            key: "medium",
                            label: "Medium",
                            count: stats.mediumRisk || 0,
                        },
                        { key: "low", label: "Low", count: stats.lowRisk || 0 },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                filter === tab.key
                                    ? "bg-white dark:bg-gray-900 text-pink-600 shadow-sm"
                                    : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span
                                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                                        filter === tab.key
                                            ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Subject List */}
                {filteredSubjects.length > 0 ? (
                    <div className="space-y-3">
                        {filteredSubjects.map((subject) => (
                            <SubjectCard
                                key={subject.id}
                                subject={subject}
                                onClick={() => handleSubjectClick(subject)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState />
                )}

                {/* Info Card */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-100 dark:border-pink-800/40 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <Info
                            size={20}
                            className="text-pink-600 flex-shrink-0 mt-0.5"
                        />
                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                                Understanding Risk Levels
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                <p>
                                    <span className="font-medium text-red-600">
                                        High Risk:
                                    </span>{" "}
                                    Grade below 70% or attendance below 80%
                                </p>
                                <p>
                                    <span className="font-medium text-yellow-600">
                                        Medium Risk:
                                    </span>{" "}
                                    Grade between 70-75%, declining trend, or
                                    missing work
                                </p>
                                <p>
                                    <span className="font-medium text-green-600">
                                        Low Risk:
                                    </span>{" "}
                                    Grade above 75% with good attendance
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Panel */}
            <DetailPanel
                subject={selectedSubject}
                isOpen={isPanelOpen}
                onClose={handleClosePanel}
            />
        </AuthenticatedLayout>
    );
};

export default SubjectRisk;

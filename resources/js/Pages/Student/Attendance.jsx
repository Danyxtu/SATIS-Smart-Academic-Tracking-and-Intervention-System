import React, { useEffect, useMemo, useRef, useState } from "react";
import StudentLayout from "@/Layouts/StudentLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
    CalendarCheck,
    CheckCircle2,
    XCircle,
    Clock,
    UserCheck,
    BookOpen,
    History,
    AlertCircle,
    ShieldCheck,
    Loader2,
    RefreshCw,
    TrendingUp,
    TrendingDown,
} from "lucide-react";

// --- Helper Components ---

// Loading Skeleton for cards
const CardSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-5 animate-pulse border border-transparent dark:border-gray-700">
        <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
        </div>
    </div>
);

// Loading Skeleton for subject cards
const SubjectCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-5 animate-pulse border border-transparent dark:border-gray-700">
        <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3"></div>
        <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
    </div>
);

// Empty State Component
const EmptyState = ({ title, message, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-12 text-center border border-transparent dark:border-gray-700">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Icon size={32} className="text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {message}
        </p>
    </div>
);

// Error State Component
const ErrorState = ({ message, onRetry }) => (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-red-700 mb-2">
            Unable to Load Attendance
        </h3>
        <p className="text-red-600 mb-4">
            {message || "Something went wrong. Please try again."}
        </p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
                <RefreshCw size={18} />
                Try Again
            </button>
        )}
    </div>
);

// --- Reusable Components ---

// Top Summary Card
const SummaryCard = ({ label, value, icon: Icon, color, bgColor, trend }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 flex items-center space-x-3 hover:shadow-xl transition-shadow border border-transparent dark:border-gray-700">
        <div className={`p-2.5 rounded-full ${bgColor}`}>
            <Icon size={24} className={color} />
        </div>
        <div className="flex-1">
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {value}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {label}
            </p>
        </div>
        {trend !== undefined && trend !== null && (
            <div
                className={`flex items-center gap-1 text-sm ${
                    trend >= 0 ? "text-green-600" : "text-red-600"
                }`}
            >
                {trend >= 0 ? (
                    <TrendingUp size={16} />
                ) : (
                    <TrendingDown size={16} />
                )}
                <span>{Math.abs(trend)}%</span>
            </div>
        )}
    </div>
);

// Progress Bar for Subjects
const AttendanceProgressBar = ({ rate }) => {
    let barColor = "bg-green-500";
    if (rate < 90) barColor = "bg-yellow-500";
    if (rate < 80) barColor = "bg-red-500";

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
                className={`${barColor} h-2.5 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${rate}%` }}
            />
        </div>
    );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
    const statusConfig = {
        Present: {
            bg: "bg-green-100 dark:bg-green-900/30",
            text: "text-green-700 dark:text-green-300",
            icon: CheckCircle2,
        },
        Absent: {
            bg: "bg-red-100 dark:bg-red-900/30",
            text: "text-red-700 dark:text-red-300",
            icon: XCircle,
        },
        Late: {
            bg: "bg-yellow-100 dark:bg-yellow-900/30",
            text: "text-yellow-700 dark:text-yellow-300",
            icon: Clock,
        },
        Excused: {
            bg: "bg-blue-100 dark:bg-blue-900/30",
            text: "text-blue-700 dark:text-blue-300",
            icon: ShieldCheck,
        },
    };

    const config = statusConfig[status] || statusConfig.Present;
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
        >
            <Icon size={14} />
            {status}
        </span>
    );
};

// Subject Attendance Card
const SubjectAttendanceCard = ({ item }) => {
    const hasStarted = Number(item.total) > 0;

    return (
        <Link
            href={route("attendance.show", { enrollment: item.id })}
            className="block bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 transition-all hover:shadow-xl hover:-translate-y-1 border border-transparent dark:border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
            title={`View ${item.subject} attendance summary`}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 line-clamp-1">
                        {item.subject}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.instructor}
                    </p>
                </div>
                <div className="text-right">
                    {hasStarted ? (
                        <span
                            className={`text-xl font-bold ${
                                item.rate >= 90
                                    ? "text-green-600"
                                    : item.rate >= 80
                                      ? "text-yellow-600"
                                      : "text-red-600"
                            }`}
                        >
                            {item.rate}%
                        </span>
                    ) : (
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Not yet Started
                        </span>
                    )}
                </div>
            </div>
            <AttendanceProgressBar rate={hasStarted ? item.rate : 0} />
            <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                <div className="bg-green-50 dark:bg-green-900/25 rounded-lg p-2">
                    <p className="text-base font-bold text-green-600">
                        {item.present}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Present
                    </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/25 rounded-lg p-2">
                    <p className="text-base font-bold text-red-600">
                        {item.absences}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Absent
                    </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/25 rounded-lg p-2">
                    <p className="text-base font-bold text-yellow-600">
                        {item.lates}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Late
                    </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/25 rounded-lg p-2">
                    <p className="text-base font-bold text-blue-600">
                        {item.excused}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Excused
                    </p>
                </div>
            </div>

            <p className="mt-3 text-xs font-medium text-pink-600 dark:text-pink-400">
                View attendance summary
            </p>
        </Link>
    );
};

// Calendar Component with real data
const AttendanceCalendar = ({ calendarData }) => {
    const [date, setDate] = useState(new Date());

    const getTileClassName = ({ date, view }) => {
        if (view === "month") {
            const dateString = date.toISOString().split("T")[0];
            const status = calendarData[dateString];
            if (status === "absent") return "day-absent";
            if (status === "late") return "day-late";
            if (status === "excused") return "day-excused";
            if (status === "present") return "day-present";
        }
        return null;
    };

    const hasData = Object.keys(calendarData).length > 0;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 attendance-calendar border border-transparent dark:border-gray-700">
            <Calendar
                onChange={setDate}
                value={date}
                tileClassName={getTileClassName}
                view="month"
            />
            {hasData ? (
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-100 border border-green-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            Present
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-100 border border-red-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            Absent
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            Late
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            Excused
                        </span>
                    </div>
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    No attendance data to display yet
                </p>
            )}
        </div>
    );
};

// Recent Activity Log with real data
const RecentActivity = ({ attendanceLog }) => {
    const getStatusConfig = (status) => {
        const configs = {
            Present: {
                icon: CheckCircle2,
                color: "text-green-600",
                bg: "bg-green-100",
            },
            Absent: { icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
            Late: {
                icon: Clock,
                color: "text-yellow-600",
                bg: "bg-yellow-100",
            },
            Excused: {
                icon: ShieldCheck,
                color: "text-blue-600",
                bg: "bg-blue-100",
            },
        };
        return configs[status] || configs.Present;
    };

    if (!attendanceLog || attendanceLog.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-transparent dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <History size={22} className="text-pink-600" />
                    Recent Activity
                </h3>
                <div className="text-center py-8">
                    <Clock
                        size={40}
                        className="mx-auto text-gray-300 dark:text-gray-500 mb-3"
                    />
                    <p className="text-gray-500 dark:text-gray-400">
                        No attendance records yet
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-transparent dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <History size={22} className="text-pink-600" />
                Recent Activity
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {attendanceLog.map((item) => {
                    const config = getStatusConfig(item.status);
                    const Icon = config.icon;
                    return (
                        <div
                            key={item.id}
                            className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className={`p-2 rounded-full ${config.bg}`}>
                                <Icon size={18} className={config.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-700 dark:text-gray-200 truncate">
                                    {item.subject}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{item.date}</span>
                                    <span>•</span>
                                    <span>{item.time}</span>
                                </div>
                            </div>
                            <StatusBadge status={item.status} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Main Attendance Page Component ---
const Attendance = ({
    summaryStats,
    subjectAttendance,
    attendanceLog,
    calendarData,
}) => {
    const { props } = usePage();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const hashScrollDoneRef = useRef(false);

    // Build summary cards from real data
    const summaryCards = useMemo(() => {
        if (!summaryStats) return [];
        return [
            {
                label: "Overall Rate",
                value: `${summaryStats.overallRate}%`,
                icon: CheckCircle2,
                color: "text-green-600",
                bgColor: "bg-green-100",
            },
            {
                label: "Days Present",
                value: summaryStats.presentDays.toString(),
                icon: UserCheck,
                color: "text-pink-600",
                bgColor: "bg-pink-100",
            },
            {
                label: "Total Absences",
                value: summaryStats.absentDays.toString(),
                icon: XCircle,
                color: "text-red-600",
                bgColor: "bg-red-100",
            },
            {
                label: "Total Lates",
                value: summaryStats.lateDays.toString(),
                icon: Clock,
                color: "text-yellow-600",
                bgColor: "bg-yellow-100",
            },
        ];
    }, [summaryStats]);

    // Handle refresh
    const handleRefresh = () => {
        window.location.reload();
    };

    // Check if we have any data
    const hasAttendanceData = summaryStats && summaryStats.totalDays > 0;
    const hasSubjects = subjectAttendance && subjectAttendance.length > 0;

    useEffect(() => {
        if (hashScrollDoneRef.current) return;
        if (typeof window === "undefined") return;
        if (window.location.hash !== "#attendance-subject-cards") return;

        const target = document.getElementById("attendance-subject-cards");
        if (!target) return;

        hashScrollDoneRef.current = true;
        window.requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }, [hasSubjects, isLoading]);

    return (
        <>
            <Head title="Attendance" />

            {/* Global CSS for Calendar */}
            <style>{`
                .attendance-calendar .react-calendar {
                    border: none;
                    width: 100%;
                    font-family: inherit;
                }
                .dark .attendance-calendar .react-calendar {
                    background: transparent;
                    color: #e5e7eb;
                }
                .attendance-calendar .react-calendar__tile {
                    border-radius: 8px;
                    padding: 0.75em 0.5em;
                }
                .dark .attendance-calendar .react-calendar__tile {
                    color: #d1d5db;
                }
                .attendance-calendar .react-calendar__tile--now {
                    background: #fdf2f8;
                    color: #be185d;
                }
                .dark .attendance-calendar .react-calendar__tile--now {
                    background: #312e81;
                    color: #c7d2fe;
                }
                .attendance-calendar .react-calendar__tile--active {
                    background: #ec4899;
                    color: white;
                }
                .attendance-calendar .react-calendar__tile:hover {
                    background: #f3f4f6;
                }
                .dark .attendance-calendar .react-calendar__tile:hover {
                    background: #374151;
                }
                .attendance-calendar .react-calendar__tile--active:hover {
                    background: #db2777;
                }
                .attendance-calendar .day-absent {
                    background: #fee2e2 !important;
                    color: #b91c1c !important;
                    font-weight: bold;
                }
                .attendance-calendar .day-late {
                    background: #fef3c7 !important;
                    color: #b45309 !important;
                    font-weight: bold;
                }
                .attendance-calendar .day-excused {
                    background: #dbeafe !important;
                    color: #1d4ed8 !important;
                    font-weight: bold;
                }
                .attendance-calendar .day-present {
                    background: #dcfce7 !important;
                    color: #15803d !important;
                }
                .attendance-calendar .react-calendar__navigation button {
                    min-width: 44px;
                    background: none;
                    font-size: 16px;
                    font-weight: 600;
                }
                .dark .attendance-calendar .react-calendar__navigation button {
                    color: #e5e7eb;
                }
                .attendance-calendar .react-calendar__navigation button:hover {
                    background: #f3f4f6;
                    border-radius: 8px;
                }
                .dark .attendance-calendar .react-calendar__navigation button:hover {
                    background: #374151;
                }
                .dark .attendance-calendar .react-calendar__month-view__weekdays__weekday {
                    color: #9ca3af;
                }
            `}</style>

            <div className="max-w-7xl mx-auto space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
                        <CalendarCheck size={22} className="text-pink-600" />
                        Attendance Overview
                    </h1>
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all disabled:opacity-50"
                    >
                        <RefreshCw
                            size={18}
                            className={isLoading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <ErrorState message={error} onRetry={handleRefresh} />
                )}

                {/* Loading State */}
                {isLoading ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[...Array(4)].map((_, i) => (
                                <CardSkeleton key={i} />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[...Array(4)].map((_, i) => (
                                    <SubjectCardSkeleton key={i} />
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Summary Stats Grid */}
                        {hasAttendanceData ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {summaryCards.map((stat) => (
                                    <SummaryCard key={stat.label} {...stat} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-pink-100 dark:border-pink-700/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-gray-900 rounded-full shadow-sm border border-transparent dark:border-gray-700">
                                        <CalendarCheck
                                            size={24}
                                            className="text-pink-600"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                                            No Attendance Records Yet
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                                            Your attendance will appear here
                                            once your teachers start recording
                                            it.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Content: 2-Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            {/* Left Column: Subject Breakdown */}
                            <div
                                id="attendance-subject-cards"
                                className="lg:col-span-2 space-y-5 scroll-mt-24"
                            >
                                <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <BookOpen size={22} />
                                    Attendance by Subject
                                </h2>

                                {hasSubjects ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {subjectAttendance.map((item) => (
                                            <SubjectAttendanceCard
                                                key={item.id}
                                                item={item}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        title="No Subjects Found"
                                        message="You're not enrolled in any subjects yet. Contact your teacher or administrator for enrollment."
                                        icon={BookOpen}
                                    />
                                )}
                            </div>

                            {/* Right Column: Calendar & Activity */}
                            <div className="space-y-5">
                                <AttendanceCalendar
                                    calendarData={calendarData || {}}
                                />
                                <RecentActivity
                                    attendanceLog={attendanceLog || []}
                                />
                            </div>
                        </div>

                        {/* Attendance Tips Section */}
                        {hasAttendanceData && summaryStats.overallRate < 90 && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-5 border border-yellow-200 dark:border-yellow-700/50">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                                        <AlertCircle
                                            size={24}
                                            className="text-yellow-600"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                            Improve Your Attendance
                                        </h3>
                                        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                            <li>
                                                • Regular attendance is crucial
                                                for academic success
                                            </li>
                                            <li>
                                                • If you're having difficulties,
                                                talk to your guidance counselor
                                            </li>
                                            <li>
                                                • Remember to bring an excuse
                                                letter for unavoidable absences
                                            </li>
                                            <li>
                                                • Arrive on time to avoid being
                                                marked as late
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Excellent Attendance Recognition */}
                        {hasAttendanceData &&
                            summaryStats.overallRate >= 95 && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-5 border border-green-200 dark:border-green-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                            <CheckCircle2
                                                size={24}
                                                className="text-green-600"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                                                Excellent Attendance! 🎉
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                                Keep up the great work! Your
                                                consistent attendance shows
                                                dedication to your education.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                    </>
                )}
            </div>
        </>
    );
};

Attendance.layout = (page) => <StudentLayout children={page} />;

export default Attendance;

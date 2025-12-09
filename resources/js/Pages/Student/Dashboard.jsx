import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";

// --- Greeting based on time of day ---
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
};

// --- Status Badge Component ---
const StatusBadge = ({ status }) => {
    const styles = {
        good: "bg-emerald-100 text-emerald-700 border-emerald-200",
        warning: "bg-amber-100 text-amber-700 border-amber-200",
        critical: "bg-red-100 text-red-700 border-red-200",
    };

    const labels = {
        good: "On Track",
        warning: "Needs Attention",
        critical: "At Risk",
    };

    return (
        <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status]}`}
        >
            {labels[status]}
        </span>
    );
};

// --- Stat Card Component ---
const StatCard = ({ title, value, subtitle, icon, gradient, trend }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">
                    {title}
                </p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {subtitle && (
                    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                )}
                {trend !== undefined && (
                    <div
                        className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                            trend >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                    >
                        {trend >= 0 ? (
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                                />
                            </svg>
                        )}
                        <span>{Math.abs(trend)}% from last week</span>
                    </div>
                )}
            </div>
            <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${gradient}`}
            >
                {icon}
            </div>
        </div>
    </div>
);

// --- Subject Performance Card ---
const SubjectCard = ({ subject }) => {
    const getGradeColor = (grade) => {
        if (grade === null) return "text-gray-400";
        if (grade >= 85) return "text-emerald-600";
        if (grade >= 75) return "text-amber-600";
        return "text-red-600";
    };

    const getProgressColor = (grade) => {
        if (grade === null) return "bg-gray-200";
        if (grade >= 85)
            return "bg-gradient-to-r from-emerald-400 to-emerald-500";
        if (grade >= 75) return "bg-gradient-to-r from-amber-400 to-amber-500";
        return "bg-gradient-to-r from-red-400 to-red-500";
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {subject.name}
                        </h4>
                        {subject.hasIntervention && (
                            <span
                                className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                                title="Active Intervention"
                            ></span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">{subject.section}</p>
                </div>
                <StatusBadge status={subject.status} />
            </div>

            <div className="space-y-3">
                {/* Grade Progress */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-600">Grade</span>
                        <span
                            className={`text-sm font-bold ${getGradeColor(
                                subject.grade
                            )}`}
                        >
                            {subject.gradeDisplay}
                        </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                                subject.grade
                            )}`}
                            style={{ width: `${subject.grade || 0}%` }}
                        />
                    </div>
                </div>

                {/* Attendance */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Attendance</span>
                    <span className="font-medium text-gray-900">
                        {subject.attendance}%
                    </span>
                </div>
            </div>

            <Link
                href={route("analytics.show", {
                    enrollment: subject.id,
                })}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
                View Details
                <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </Link>
        </div>
    );
};

// --- Notification Item Component ---
const NotificationItem = ({ notification, onMarkRead, isHighlighted }) => {
    const itemRef = useRef(null);

    // Scroll into view when highlighted
    useEffect(() => {
        if (isHighlighted && itemRef.current) {
            itemRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [isHighlighted]);

    const typeStyles = {
        nudge: {
            bg: "bg-blue-50",
            icon: "text-blue-600",
            iconBg: "bg-blue-100",
        },
        task: {
            bg: "bg-purple-50",
            icon: "text-purple-600",
            iconBg: "bg-purple-100",
        },
        feedback: {
            bg: "bg-green-50",
            icon: "text-green-600",
            iconBg: "bg-green-100",
        },
        extension: {
            bg: "bg-amber-50",
            icon: "text-amber-600",
            iconBg: "bg-amber-100",
        },
        alert: {
            bg: "bg-red-50",
            icon: "text-red-600",
            iconBg: "bg-red-100",
        },
        intervention: {
            bg: "bg-orange-50",
            icon: "text-orange-600",
            iconBg: "bg-orange-100",
        },
    };

    const style = typeStyles[notification.type] || typeStyles.nudge;

    const icons = {
        nudge: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>
        ),
        task: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
            </svg>
        ),
        feedback: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
            </svg>
        ),
        extension: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
        alert: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
            </svg>
        ),
        intervention: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
            </svg>
        ),
    };

    const handleClick = () => {
        // Mark as read first, then navigate
        router.post(
            route("notifications.read", { notification: notification.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Navigate to interventions page with highlight
                    router.visit(
                        route("interventions-feed") +
                            `?highlight=${notification.id}`
                    );
                },
            }
        );
    };

    return (
        <div
            ref={itemRef}
            onClick={handleClick}
            className={`p-4 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                style.bg
            } ${
                !notification.isRead ? "ring-2 ring-inset ring-indigo-200" : ""
            } ${
                isHighlighted
                    ? "animate-highlight-blink ring-2 ring-pink-500"
                    : ""
            }`}
        >
            <div className="flex gap-4">
                <div
                    className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                    <span className={style.icon}>
                        {icons[notification.type] || icons.nudge}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.isRead && (
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                            <span className="text-xs text-gray-500">
                                {notification.createdAt}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                            From: {notification.sender}
                        </span>
                        {!notification.isRead && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkRead(notification.id);
                                }}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                            >
                                Mark as read
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Task Item Component ---
const TaskItem = ({ task }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="w-5 h-5 mt-0.5 rounded border-2 border-gray-300 flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800">{task.description}</p>
            <p className="text-xs text-gray-500 mt-1">{task.subject}</p>
        </div>
    </div>
);

// --- Mini Chart Component (Visual Grade Trend) ---
const MiniChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-16 flex items-center justify-center text-sm text-gray-400">
                No data available
            </div>
        );
    }

    const max = Math.max(...data, 100);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    return (
        <div className="h-16 flex items-end gap-1">
            {data.map((value, index) => {
                const height = ((value - min) / range) * 100;
                const isLast = index === data.length - 1;
                return (
                    <div
                        key={index}
                        className="flex-1 flex flex-col items-center"
                    >
                        <div
                            className={`w-full rounded-t transition-all duration-300 ${
                                isLast ? "bg-indigo-500" : "bg-indigo-200"
                            }`}
                            style={{ height: `${height}%`, minHeight: "4px" }}
                        />
                        <span className="text-xs text-gray-400 mt-1">
                            W{index + 1}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// --- Quick Action Card ---
const QuickActionCard = ({ title, description, icon, href, gradient }) => (
    <Link
        href={href}
        className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 group"
    >
        <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${gradient} group-hover:scale-110 transition-transform`}
        >
            {icon}
        </div>
        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
    </Link>
);

// --- Main Dashboard Component ---
export default function Dashboard({
    student = {},
    stats = {},
    subjectPerformance = [],
    notifications = [],
    unreadNotificationCount = 0,
    upcomingTasks = [],
    gradeTrend = [],
    semesters = {},
}) {
    const [showAllNotifications, setShowAllNotifications] = useState(false);
    const { url } = usePage();

    // Extract highlight parameter from URL
    const urlParams = new URLSearchParams(url.split("?")[1] || "");
    const highlightId = urlParams.get("highlight");

    // Semester navigation handler
    const handleSemesterChange = (semester) => {
        router.get(
            window.location.pathname,
            { semester },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleMarkRead = (notificationId) => {
        router.post(
            route("notifications.read", { notification: notificationId }),
            {},
            {
                preserveScroll: true,
            }
        );
    };

    const handleMarkAllRead = () => {
        router.post(
            route("notifications.read-all"),
            {},
            {
                preserveScroll: true,
            }
        );
    };

    const displayedNotifications = showAllNotifications
        ? notifications
        : notifications.slice(0, 3);

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            {/* Custom CSS for blink animation */}
            <style>{`
                @keyframes highlight-blink {
                    0%, 100% { 
                        background-color: rgb(254 242 242); 
                        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3);
                    }
                    25%, 75% { 
                        background-color: rgb(254 226 226); 
                        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.6);
                    }
                    50% { 
                        background-color: rgb(254 202 202); 
                        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.8);
                    }
                }
                .animate-highlight-blink {
                    animation: highlight-blink 0.5s ease-in-out 2;
                }
            `}</style>

            <div className="min-h-screen bg-gray-50/50">
                {/* Welcome Header */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl mx-4 mt-4 p-8 text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <svg
                            className="w-full h-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                <pattern
                                    id="grid"
                                    width="10"
                                    height="10"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d="M 10 0 L 0 0 0 10"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="0.5"
                                    />
                                </pattern>
                            </defs>
                            <rect width="100" height="100" fill="url(#grid)" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">👋</span>
                            <h1 className="text-3xl font-bold">
                                {getGreeting()},{" "}
                                {student.firstName || "Student"}!
                            </h1>
                        </div>
                        <p className="text-indigo-100 text-lg">
                            Here's an overview of your academic progress. Keep
                            up the great work!
                        </p>

                        {/* Quick Stats in Header */}
                        <div className="mt-6 flex flex-wrap gap-6">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                                <p className="text-sm text-indigo-100">
                                    Overall Grade
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.overallGrade !== null
                                        ? `${stats.overallGrade}%`
                                        : "N/A"}
                                </p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                                <p className="text-sm text-indigo-100">
                                    Attendance
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.overallAttendance}%
                                </p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                                <p className="text-sm text-indigo-100">
                                    Tasks Completed
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.completedTasks}/{stats.totalTasks}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -right-5 -bottom-10 w-32 h-32 bg-pink-400/20 rounded-full blur-xl" />
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <StatCard
                            title="Overall Grade"
                            value={
                                stats.overallGrade !== null
                                    ? `${stats.overallGrade}%`
                                    : "N/A"
                            }
                            subtitle="Across all subjects"
                            gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
                            icon={
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                    />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Subjects at Risk"
                            value={stats.subjectsAtRisk}
                            subtitle={`of ${stats.totalSubjects} subjects`}
                            gradient="bg-gradient-to-br from-red-400 to-red-600"
                            icon={
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Attendance Rate"
                            value={`${stats.overallAttendance}%`}
                            subtitle="This semester"
                            gradient="bg-gradient-to-br from-blue-400 to-blue-600"
                            icon={
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Tasks Completed"
                            value={`${stats.completedTasks}/${stats.totalTasks}`}
                            subtitle="Intervention goals"
                            gradient="bg-gradient-to-br from-amber-400 to-amber-600"
                            icon={
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                    />
                                </svg>
                            }
                        />
                    </div>

                    {/* Main Grid - Two Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Subject Performance */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Semester Toggle */}
                            {(semesters?.semester1Count > 0 ||
                                semesters?.semester2Count > 0) && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg
                                                className="w-5 h-5 text-pink-600"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <span className="font-semibold text-gray-700">
                                                Academic Year{" "}
                                                {semesters?.schoolYear || ""}
                                            </span>
                                        </div>
                                        {semesters?.selected !==
                                            semesters?.current && (
                                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                                Viewing past semester
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {[
                                            {
                                                id: 1,
                                                label: "1st Semester",
                                                count:
                                                    semesters?.semester1Count ||
                                                    0,
                                            },
                                            {
                                                id: 2,
                                                label: "2nd Semester",
                                                count:
                                                    semesters?.semester2Count ||
                                                    0,
                                            },
                                        ].map((sem) => {
                                            const isActive =
                                                semesters?.selected === sem.id;
                                            const isCurrentSem =
                                                semesters?.current === sem.id;
                                            return (
                                                <button
                                                    key={sem.id}
                                                    onClick={() =>
                                                        handleSemesterChange(
                                                            sem.id
                                                        )
                                                    }
                                                    className={`flex-1 relative flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium transition-all ${
                                                        isActive
                                                            ? "bg-pink-600 text-white shadow-md"
                                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                    }`}
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                        />
                                                    </svg>
                                                    <span className="hidden sm:inline">
                                                        {sem.label}
                                                    </span>
                                                    <span className="sm:hidden">
                                                        Sem {sem.id}
                                                    </span>
                                                    <span
                                                        className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                                            isActive
                                                                ? "bg-white/20 text-white"
                                                                : "bg-gray-200 text-gray-600"
                                                        }`}
                                                    >
                                                        {sem.count}
                                                    </span>
                                                    {isCurrentSem && (
                                                        <span
                                                            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                                                                isActive
                                                                    ? "bg-green-400"
                                                                    : "bg-green-500"
                                                            } border-2 border-white`}
                                                            title="Current Semester"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Subject Performance Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            Subject Performance
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Your grades across all enrolled
                                            subjects
                                        </p>
                                    </div>
                                    <Link
                                        href={route("analytics.index")}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        View All
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </Link>
                                </div>

                                {subjectPerformance.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {subjectPerformance
                                            .slice(0, 4)
                                            .map((subject) => (
                                                <SubjectCard
                                                    key={subject.id}
                                                    subject={subject}
                                                />
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg
                                                className="w-8 h-8 text-gray-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500">
                                            No subjects enrolled yet
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Grade Trend & Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Grade Trend Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4">
                                        Grade Trend
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Your weekly performance
                                    </p>
                                    <MiniChart data={gradeTrend} />
                                </div>

                                {/* Upcoming Tasks */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900">
                                            Pending Tasks
                                        </h3>
                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                                            {upcomingTasks.length} pending
                                        </span>
                                    </div>
                                    {upcomingTasks.length > 0 ? (
                                        <div className="space-y-1">
                                            {upcomingTasks.map((task) => (
                                                <TaskItem
                                                    key={task.id}
                                                    task={task}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <svg
                                                    className="w-6 h-6 text-green-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                All tasks completed!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Notifications */}
                        <div className="space-y-6">
                            {/* Notifications Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-bold text-gray-900">
                                            Notifications
                                        </h2>
                                        {unreadNotificationCount > 0 && (
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                                {unreadNotificationCount > 99
                                                    ? "99+"
                                                    : unreadNotificationCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {unreadNotificationCount > 0 && (
                                            <button
                                                onClick={handleMarkAllRead}
                                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        <Link
                                            href={route("interventions-feed")}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            View all →
                                        </Link>
                                    </div>
                                </div>

                                {notifications.length > 0 ? (
                                    <div className="space-y-3">
                                        {displayedNotifications.map(
                                            (notification) => (
                                                <NotificationItem
                                                    key={notification.id}
                                                    notification={notification}
                                                    onMarkRead={handleMarkRead}
                                                    isHighlighted={
                                                        highlightId ===
                                                        notification.id.toString()
                                                    }
                                                />
                                            )
                                        )}

                                        {notifications.length > 3 && (
                                            <button
                                                onClick={() =>
                                                    setShowAllNotifications(
                                                        !showAllNotifications
                                                    )
                                                }
                                                className="w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                {showAllNotifications
                                                    ? "Show Less"
                                                    : `View ${
                                                          notifications.length -
                                                          3
                                                      } More`}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg
                                                className="w-7 h-7 text-gray-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 text-sm">
                                            No notifications yet
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">
                                    Quick Actions
                                </h3>
                                <div className="space-y-3">
                                    <QuickActionCard
                                        title="View Analytics"
                                        description="Detailed performance breakdown"
                                        href={route("analytics.index")}
                                        gradient="bg-gradient-to-br from-indigo-400 to-indigo-600"
                                        icon={
                                            <svg
                                                className="w-6 h-6 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                />
                                            </svg>
                                        }
                                    />
                                    <QuickActionCard
                                        title="Interventions & Feed"
                                        description="Check teacher feedback"
                                        href={route("interventions-feed")}
                                        gradient="bg-gradient-to-br from-purple-400 to-purple-600"
                                        icon={
                                            <svg
                                                className="w-6 h-6 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                                />
                                            </svg>
                                        }
                                    />
                                    <QuickActionCard
                                        title="Subjects at Risk"
                                        description="View struggling areas"
                                        href={route("subject-at-risk")}
                                        gradient="bg-gradient-to-br from-red-400 to-red-600"
                                        icon={
                                            <svg
                                                className="w-6 h-6 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                />
                                            </svg>
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

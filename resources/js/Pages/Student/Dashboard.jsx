import StudentLayout from "@/Layouts/StudentLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

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
        good: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50",
        warning:
            "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50",
        critical:
            "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/50",
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
const StatCard = ({ title, value, subtitle, icon, trend }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                    {value}
                </p>
                {subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {subtitle}
                    </p>
                )}
                {trend !== undefined && (
                    <div
                        className={`flex items-center gap-1 mt-2 text-xs font-medium ${
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
            <div className="w-9 h-9 flex items-center justify-center">
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
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors">
                            {subject.name}
                        </h4>
                        {subject.hasIntervention && (
                            <span
                                className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                                title="Active Intervention"
                            ></span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {subject.section}
                    </p>
                </div>
                <StatusBadge status={subject.status} />
            </div>

            <div className="space-y-3">
                {/* Grade Progress */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                            Grade
                        </span>
                        <span
                            className={`text-xs font-bold ${getGradeColor(
                                subject.grade,
                            )}`}
                        >
                            {subject.gradeDisplay}
                        </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                                subject.grade,
                            )}`}
                            style={{ width: `${subject.grade || 0}%` }}
                        />
                    </div>
                </div>

                {/* Attendance */}
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300">
                        Attendance
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        {subject.attendance}%
                    </span>
                </div>
            </div>

            <Link
                href={route("analytics.show", {
                    enrollment: subject.id,
                })}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-200 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg text-xs font-medium transition-colors"
            >
                View Details
                <svg
                    className="w-3.5 h-3.5"
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
            bg: "bg-blue-50 dark:bg-blue-900/20",
            icon: "text-blue-600 dark:text-blue-300",
            iconBg: "bg-blue-100 dark:bg-blue-900/35",
        },
        task: {
            bg: "bg-purple-50 dark:bg-purple-900/20",
            icon: "text-purple-600 dark:text-purple-300",
            iconBg: "bg-purple-100 dark:bg-purple-900/35",
        },
        feedback: {
            bg: "bg-green-50 dark:bg-green-900/20",
            icon: "text-green-600 dark:text-green-300",
            iconBg: "bg-green-100 dark:bg-green-900/35",
        },
        extension: {
            bg: "bg-amber-50 dark:bg-amber-900/20",
            icon: "text-amber-600 dark:text-amber-300",
            iconBg: "bg-amber-100 dark:bg-amber-900/35",
        },
        alert: {
            bg: "bg-red-50 dark:bg-red-900/20",
            icon: "text-red-600 dark:text-red-300",
            iconBg: "bg-red-100 dark:bg-red-900/35",
        },
        intervention: {
            bg: "bg-orange-50 dark:bg-orange-900/20",
            icon: "text-orange-600 dark:text-orange-300",
            iconBg: "bg-orange-100 dark:bg-orange-900/35",
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
                            `?highlight=${notification.id}`,
                    );
                },
            },
        );
    };

    return (
        <div
            ref={itemRef}
            onClick={handleClick}
            className={`p-3 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                style.bg
            } ${
                !notification.isRead ? "ring-2 ring-inset ring-indigo-200" : ""
            } ${
                isHighlighted
                    ? "animate-highlight-blink ring-2 ring-pink-500"
                    : ""
            } border border-transparent dark:border-gray-700`}
        >
            <div className="flex gap-3">
                <div
                    className={`w-8 h-8 rounded-lg ${style.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                    <span className={style.icon}>
                        {icons[notification.type] || icons.nudge}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                            {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.isRead && (
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {notification.createdAt}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {notification.message}
                    </p>
                    {notification.type === "extension" &&
                        notification.deadlineLabel && (
                            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-300 mt-1">
                                Updated deadline: {notification.deadlineLabel}
                            </p>
                        )}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
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
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="w-4 h-4 mt-0.5 rounded border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-800 dark:text-gray-200">
                {task.description}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {task.subject}
            </p>
        </div>
    </div>
);

// --- Category config for grade trend line chart ---
const CATEGORY_COLORS = {
    written_works: { stroke: "#3b82f6", label: "Written Works" },
    performance_task: { stroke: "#f59e0b", label: "Performance Task" },
    quarterly_exam: { stroke: "#ec4899", label: "Quarterly Exam" },
};

const CATEGORY_KEYWORDS = {
    written_works: [
        "written",
        "written works",
        "written_works",
        "written-work",
    ],
    performance_task: [
        "performance",
        "performance task",
        "performance_task",
        "performance-t",
    ],
    quarterly_exam: ["quarterly exam", "quarterly_exam", "quarterly", "exam"],
};

const detectCategory = (item) => {
    const text = ((item.key || "") + " " + (item.name || "")).toLowerCase();
    for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some((k) => text.includes(k))) return catId;
    }
    return "other";
};

// --- Mini Chart Component (Visual Grade Trend - Line Chart per Category) ---
const MiniChart = ({ data }) => {
    // data = { subjectName, items: [{ id, name, key, score, totalScore, percentage, quarter }] }
    const items = data?.items || [];

    if (!items || items.length === 0) {
        return (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                No data available
            </div>
        );
    }

    // Filter items with valid scores
    const validItems = items.filter(
        (item) => item.score !== null && item.totalScore > 0,
    );

    if (validItems.length === 0) {
        return (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                No scores recorded yet
            </div>
        );
    }

    // Tag each item with detected category and percentage
    const taggedItems = validItems.map((item) => ({
        ...item,
        _category: detectCategory(item),
        _pct: Math.round((item.score / item.totalScore) * 100),
    }));

    // Group by category
    const grouped = {};
    taggedItems.forEach((item) => {
        if (!grouped[item._category]) grouped[item._category] = [];
        grouped[item._category].push(item);
    });

    const activeCategories = Object.keys(grouped).filter(
        (cat) => cat !== "other",
    );
    const categoriesToPlot =
        activeCategories.length > 0 ? activeCategories : Object.keys(grouped);

    const maxLen = Math.max(
        ...categoriesToPlot.map((cat) => grouped[cat]?.length || 0),
        1,
    );

    // Build chart data
    const chartData = [];
    for (let i = 0; i < maxLen; i++) {
        const point = { index: i + 1 };
        categoriesToPlot.forEach((cat) => {
            const entry = grouped[cat]?.[i];
            if (entry) {
                point[cat] = entry._pct;
                point[`_label_${cat}`] = entry.name;
            }
        });
        chartData.push(point);
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || payload.length === 0) return null;
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-2.5 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Item #{label}
                </p>
                {payload.map((entry) => {
                    const cat = entry.dataKey;
                    const catInfo = CATEGORY_COLORS[cat] || {
                        label: cat,
                        stroke: "#6b7280",
                    };
                    const itemLabel = entry.payload?.[`_label_${cat}`] || "";
                    return (
                        <div
                            key={cat}
                            className="flex items-center gap-1.5 mb-0.5"
                        >
                            <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
                                {catInfo.label}
                                {itemLabel ? ` – ${itemLabel}` : ""}:
                            </span>
                            <span className="font-bold text-gray-800 dark:text-gray-100">
                                {entry.value}%
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-2">
                {categoriesToPlot.map((cat) => {
                    const info = CATEGORY_COLORS[cat] || {
                        label: cat,
                        stroke: "#6b7280",
                    };
                    return (
                        <div
                            key={cat}
                            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
                        >
                            <span
                                className="inline-block w-3 h-0.5 rounded"
                                style={{ backgroundColor: info.stroke }}
                            />
                            {info.label}
                        </div>
                    );
                })}
            </div>

            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis
                            dataKey="index"
                            stroke="#9ca3af"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            fontSize={10}
                            domain={[0, 100]}
                            tickLine={false}
                            axisLine={false}
                            ticks={[0, 25, 50, 75, 100]}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {categoriesToPlot.map((cat) => {
                            const info = CATEGORY_COLORS[cat] || {
                                stroke: "#6b7280",
                            };
                            return (
                                <Line
                                    key={cat}
                                    type="monotone"
                                    dataKey={cat}
                                    stroke={info.stroke}
                                    strokeWidth={2}
                                    dot={{ r: 2.5, fill: info.stroke }}
                                    activeDot={{ r: 4 }}
                                    connectNulls
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Quick Action Card ---
const QuickActionCard = ({ title, icon, href }) => (
    <Link
        href={href}
        className="block bg-transparent rounded-md px-2 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:ring-1 hover:ring-inset hover:ring-indigo-100 dark:hover:ring-indigo-700/50 transition-all duration-200 group"
    >
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors truncate whitespace-nowrap">
                    {title}
                </h3>
            </div>
            <svg
                className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0"
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
        </div>
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
    gradeTrend = {},
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
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleMarkRead = (notificationId) => {
        router.post(
            route("notifications.read", { notification: notificationId }),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleMarkAllRead = () => {
        router.post(
            route("notifications.read-all"),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const displayedNotifications = showAllNotifications
        ? notifications
        : notifications.slice(0, 3);

    return (
        <>
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

            <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
                {/* Welcome Header */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl mx-4 mt-4 p-5 text-white relative overflow-hidden">
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
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <span className="text-xl">👋</span>
                            <h1 className="text-lg md:text-xl font-bold">
                                {getGreeting()},{" "}
                                {student.firstName || "Student"}!
                            </h1>
                        </div>
                        <p className="text-indigo-100 text-sm sm:text-base">
                            Your progress at a glance.
                        </p>

                        {/* Quick Stats in Header */}
                        <div className="mt-4 flex flex-wrap gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3.5 py-2">
                                <p className="text-xs text-indigo-100">
                                    Overall Grade
                                </p>
                                <p className="text-lg font-bold leading-tight">
                                    {stats.overallGrade !== null
                                        ? `${stats.overallGrade}%`
                                        : "N/A"}
                                </p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3.5 py-2">
                                <p className="text-xs text-indigo-100">
                                    Attendance
                                </p>
                                <p className="text-lg font-bold leading-tight">
                                    {stats.overallAttendance}%
                                </p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3.5 py-2">
                                <p className="text-xs text-indigo-100">
                                    Tasks Completed
                                </p>
                                <p className="text-lg font-bold leading-tight">
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
                <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Overall Grade"
                            value={
                                stats.overallGrade !== null
                                    ? `${stats.overallGrade}%`
                                    : "N/A"
                            }
                            subtitle="Across all subjects"
                            icon={
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
                                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                    />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Subjects at Risk"
                            value={stats.subjectsAtRisk}
                            subtitle={`of ${stats.totalSubjects} subjects`}
                            icon={
                                <svg
                                    className="w-5 h-5 text-amber-500"
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
                            icon={
                                <svg
                                    className="w-5 h-5 text-emerald-600"
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
                            icon={
                                <svg
                                    className="w-5 h-5 text-indigo-600"
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Left Column - Subject Performance */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Semester Toggle */}
                            {(semesters?.semester1Count > 0 ||
                                semesters?.semester2Count > 0) && (
                                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3.5">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <svg
                                                className="w-4 h-4 text-pink-600"
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
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                Academic Year{" "}
                                                {semesters?.schoolYear || ""}
                                            </span>
                                        </div>
                                        {semesters?.selected !==
                                            semesters?.current && (
                                            <span className="text-[11px] text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/25 px-2 py-0.5 rounded-full">
                                                Past semester
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
                                            // Consider a semester "future" (not started) when its id is greater than the current semester
                                            const isFutureSemester =
                                                semesters?.current &&
                                                sem.id > semesters?.current;
                                            return (
                                                <button
                                                    key={sem.id}
                                                    onClick={() => {
                                                        if (isFutureSemester)
                                                            return;
                                                        handleSemesterChange(
                                                            sem.id,
                                                        );
                                                    }}
                                                    disabled={isFutureSemester}
                                                    className={`flex-1 relative flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                                        isFutureSemester
                                                            ? "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60"
                                                            : isActive
                                                              ? "bg-pink-600 text-white shadow-md"
                                                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                    }`}
                                                >
                                                    <svg
                                                        className="w-3.5 h-3.5"
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
                                                        className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                            isActive
                                                                ? "bg-white/20 text-white"
                                                                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
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
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            Subject Performance
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Grades across subjects
                                        </p>
                                    </div>
                                    <Link
                                        href={route("analytics.index")}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        View All
                                        <svg
                                            className="w-3.5 h-3.5"
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg
                                                className="w-8 h-8 text-gray-400 dark:text-gray-500"
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
                                        <p className="text-gray-500 dark:text-gray-400">
                                            No subjects enrolled yet
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Grade Trend & Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Grade Trend Card */}
                                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                        Grade Trend
                                    </h3>
                                    {gradeTrend?.subjectName ? (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">
                                            <span className="font-medium text-indigo-600">
                                                {gradeTrend.subjectName}
                                            </span>{" "}
                                            trend
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">
                                            Score by category
                                        </p>
                                    )}
                                    <MiniChart data={gradeTrend} />
                                </div>

                                {/* Upcoming Tasks */}
                                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            Pending Tasks
                                        </h3>
                                        <span className="text-[11px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">
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
                                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
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
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                All tasks completed!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Notifications */}
                        <div className="space-y-4">
                            {/* Notifications Section */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
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
                                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        <Link
                                            href={route("interventions-feed")}
                                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
                                            ),
                                        )}

                                        {notifications.length > 3 && (
                                            <button
                                                onClick={() =>
                                                    setShowAllNotifications(
                                                        !showAllNotifications,
                                                    )
                                                }
                                                className="w-full py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
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
                                        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg
                                                className="w-7 h-7 text-gray-400 dark:text-gray-500"
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
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            No notifications yet
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                    Quick Actions
                                </h3>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700/70">
                                    <QuickActionCard
                                        title="View Analytics"
                                        href={route("analytics.index")}
                                        icon={
                                            <svg
                                                className="w-5 h-5 text-indigo-600"
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
                                        href={route("interventions-feed")}
                                        icon={
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
                                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                                />
                                            </svg>
                                        }
                                    />
                                    <QuickActionCard
                                        title="Risk Overview"
                                        href={route("analytics.index", {
                                            risk: "at-risk",
                                        })}
                                        icon={
                                            <svg
                                                className="w-5 h-5 text-amber-500"
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
        </>
    );
}

Dashboard.layout = (page) => <StudentLayout children={page} />;

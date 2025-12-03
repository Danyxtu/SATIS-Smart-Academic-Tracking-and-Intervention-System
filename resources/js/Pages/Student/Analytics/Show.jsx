import React, { useMemo, useState, Fragment } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { Dialog, Transition } from "@headlessui/react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
} from "recharts";
import {
    FileDown,
    Lightbulb,
    Bot,
    AlertTriangle,
    AlertCircle,
    CheckCircle2,
    Star,
    ThumbsUp,
    Calendar,
    BookOpen,
    Target,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Clock,
    Award,
    X,
    Zap,
    ArrowRight,
    Info,
    CheckCircle,
    Users,
    PenLine,
    FileText,
} from "lucide-react";

// --- Helper Components ---

// Helper function to calculate expected grade (simple projection)
const calculateExpectedGrade = (currentGrade, assignmentCount) => {
    if (currentGrade === null || assignmentCount === 0) return null;
    // Simple projection - in real scenario this could be more sophisticated
    // Adding a small boost for expected performance
    const expected = Math.min(100, Math.round(currentGrade * 1.02));
    return expected;
};

// Helper function to get grade color
const getGradeColor = (grade) => {
    if (grade === null) return "text-gray-400";
    if (grade >= 90) return "text-green-600";
    if (grade >= 85) return "text-blue-600";
    if (grade >= 80) return "text-blue-500";
    if (grade >= 75) return "text-yellow-600";
    return "text-red-600";
};

// Helper function to get remarks
const getRemarks = (grade) => {
    if (grade === null)
        return { text: "N/A", bg: "bg-gray-100", color: "text-gray-600" };
    if (grade >= 90)
        return {
            text: "Excellent",
            bg: "bg-green-100",
            color: "text-green-700",
        };
    if (grade >= 85)
        return { text: "Very Good", bg: "bg-blue-100", color: "text-blue-700" };
    if (grade >= 80)
        return { text: "Good", bg: "bg-blue-50", color: "text-blue-600" };
    if (grade >= 75)
        return {
            text: "Satisfactory",
            bg: "bg-yellow-100",
            color: "text-yellow-700",
        };
    return {
        text: "Needs Improvement",
        bg: "bg-red-100",
        color: "text-red-700",
    };
};

// Quarter Grade Card Component
const QuarterGradeCard = ({
    quarter,
    quarterNum,
    grade,
    expectedGrade,
    attendance,
    assignmentCount,
    hasStarted = true,
}) => {
    const remarks = getRemarks(grade);
    const gradeColor = getGradeColor(grade);
    const expectedColor = getGradeColor(expectedGrade);

    // Card for quarters that haven't started - NO expected grade, just message
    if (!hasStarted) {
        return (
            <div className="bg-white rounded-2xl shadow-md p-5 border border-dashed border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-400">
                                Q{quarterNum}
                            </span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-700">
                            Quarter {quarterNum}
                        </h3>
                    </div>
                    <Clock size={20} className="text-gray-300" />
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-4xl font-bold text-gray-300 mb-2">--</p>
                    <p className="text-sm text-gray-500">
                        Quarter {quarterNum} has not started yet.
                    </p>
                </div>
            </div>
        );
    }

    // Card for active quarters with actual data
    return (
        <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            grade !== null && grade >= 75
                                ? "bg-green-100"
                                : grade !== null
                                ? "bg-red-100"
                                : "bg-gray-100"
                        }`}
                    >
                        <span
                            className={`text-lg font-bold ${
                                grade !== null && grade >= 75
                                    ? "text-green-600"
                                    : grade !== null
                                    ? "text-red-600"
                                    : "text-gray-400"
                            }`}
                        >
                            Q{quarterNum}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-800">
                            Quarter {quarterNum}
                        </h3>
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${remarks.bg} ${remarks.color}`}
                        >
                            {remarks.text}
                        </span>
                    </div>
                </div>
                {grade !== null && grade >= 90 && (
                    <Award size={20} className="text-yellow-500" />
                )}
            </div>

            {/* Current Grade */}
            <div className="bg-gray-50 rounded-lg p-3 text-center mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Current Grade
                </p>
                <p className={`text-4xl font-bold ${gradeColor}`}>
                    {grade !== null ? grade : "--"}
                </p>
            </div>

            {/* Expected Grade - only show if quarter has started */}
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">
                            Expected
                        </span>
                    </div>
                    <span className={`text-xl font-bold ${expectedColor}`}>
                        {expectedGrade !== null ? expectedGrade : "--"}
                    </span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-green-600">
                        {attendance}
                    </p>
                    <p className="text-xs text-gray-500">Attendance</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-purple-600">
                        {assignmentCount}
                    </p>
                    <p className="text-xs text-gray-500">Items</p>
                </div>
            </div>
        </div>
    );
};

// Quarterly Grades Cards Section
const QuarterlyGradesCards = ({ data }) => {
    // Find Q1 and Q2 data
    const q1Data = data.find((q) => q.quarterNum === 1);
    const q2Data = data.find((q) => q.quarterNum === 2);
    const q3Data = data.find((q) => q.quarterNum === 3);
    const q4Data = data.find((q) => q.quarterNum === 4);

    // Determine if quarters have started (based on whether there are assignments)
    const q1HasStarted = q1Data && q1Data.assignmentCount > 0;
    const q2HasStarted = q2Data && q2Data.assignmentCount > 0;
    const q3HasStarted = q3Data && q3Data.assignmentCount > 0;
    const q4HasStarted = q4Data && q4Data.assignmentCount > 0;

    // Calculate expected grades
    const q1Expected = q1HasStarted
        ? calculateExpectedGrade(q1Data.grade, q1Data.assignmentCount)
        : null;
    const q2Expected = q1HasStarted
        ? q2HasStarted
            ? calculateExpectedGrade(q2Data.grade, q2Data.assignmentCount)
            : calculateExpectedGrade(q1Data.grade, q1Data.assignmentCount)
        : null;

    // If no data at all
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar size={22} className="text-pink-600" />
                    Quarterly Grades
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuarterGradeCard
                        quarter="Q1"
                        quarterNum={1}
                        grade={null}
                        expectedGrade={null}
                        attendance="--"
                        assignmentCount={0}
                        hasStarted={false}
                    />
                    <QuarterGradeCard
                        quarter="Q2"
                        quarterNum={2}
                        grade={null}
                        expectedGrade={null}
                        attendance="--"
                        assignmentCount={0}
                        hasStarted={false}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={22} className="text-pink-600" />
                Quarterly Grades
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Quarter Card */}
                <QuarterGradeCard
                    quarter="Q1"
                    quarterNum={1}
                    grade={q1HasStarted ? q1Data.grade : null}
                    expectedGrade={q1Expected}
                    attendance={q1HasStarted ? q1Data.attendance : "--"}
                    assignmentCount={q1HasStarted ? q1Data.assignmentCount : 0}
                    hasStarted={q1HasStarted}
                />

                {/* Second Quarter Card */}
                <QuarterGradeCard
                    quarter="Q2"
                    quarterNum={2}
                    grade={q2HasStarted ? q2Data.grade : null}
                    expectedGrade={q2Expected}
                    attendance={q2HasStarted ? q2Data.attendance : "--"}
                    assignmentCount={q2HasStarted ? q2Data.assignmentCount : 0}
                    hasStarted={q2HasStarted}
                />
            </div>

            {/* Show Q3 and Q4 if they exist */}
            {(q3Data || q4Data) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q3Data && (
                        <QuarterGradeCard
                            quarter="Q3"
                            quarterNum={3}
                            grade={q3HasStarted ? q3Data.grade : null}
                            expectedGrade={
                                q3HasStarted
                                    ? calculateExpectedGrade(
                                          q3Data.grade,
                                          q3Data.assignmentCount
                                      )
                                    : q2Expected
                            }
                            attendance={q3HasStarted ? q3Data.attendance : "--"}
                            assignmentCount={
                                q3HasStarted ? q3Data.assignmentCount : 0
                            }
                            hasStarted={q3HasStarted}
                        />
                    )}
                    {q4Data && (
                        <QuarterGradeCard
                            quarter="Q4"
                            quarterNum={4}
                            grade={q4HasStarted ? q4Data.grade : null}
                            expectedGrade={
                                q4HasStarted
                                    ? calculateExpectedGrade(
                                          q4Data.grade,
                                          q4Data.assignmentCount
                                      )
                                    : q3HasStarted
                                    ? calculateExpectedGrade(
                                          q3Data?.grade,
                                          q3Data?.assignmentCount
                                      )
                                    : q2Expected
                            }
                            attendance={q4HasStarted ? q4Data.attendance : "--"}
                            assignmentCount={
                                q4HasStarted ? q4Data.assignmentCount : 0
                            }
                            hasStarted={q4HasStarted}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

// Grade Breakdown - split into three sections (Written Works, Performance Task, Quarterly Exam)
const GradeBreakdown = ({ data }) => {
    // Handle both old array format and new structured format
    let writtenWorks = [];
    let performanceTasks = [];
    let quarterlyExams = [];

    if (data && typeof data === "object" && !Array.isArray(data)) {
        // New structured format
        writtenWorks = data.writtenWorks?.items || [];
        performanceTasks = data.performanceTask?.items || [];
        quarterlyExams = data.quarterlyExam?.items || [];
    } else if (Array.isArray(data)) {
        // Legacy array format - categorize items
        const items = data;

        const matchBucket = (item, keywords) => {
            const text = (
                (item.category || item.type || item.name || item.key || "") + ""
            ).toLowerCase();
            return keywords.some((k) => text.includes(k));
        };

        writtenWorks = items.filter((it) =>
            matchBucket(it, ["written", "written works", "written-work"])
        );

        performanceTasks = items.filter((it) =>
            matchBucket(it, [
                "performance",
                "performance task",
                "performance-t",
            ])
        );

        quarterlyExams = items.filter((it) =>
            matchBucket(it, ["quarterly exam", "quarterly", "exam"])
        );
    }

    const hasAny =
        writtenWorks.length > 0 ||
        performanceTasks.length > 0 ||
        quarterlyExams.length > 0;

    if (!hasAny) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Grade Breakdown
                </h3>
                <div className="text-center py-8">
                    <BookOpen
                        size={40}
                        className="mx-auto text-gray-300 mb-3"
                    />
                    <p className="text-gray-500">No assignments graded yet.</p>
                </div>
            </div>
        );
    }

    // Render function for a single card
    const renderCard = (title, list, emptyMessage) => (
        <div className="bg-gray-50 rounded-xl p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">{title}</h4>
                <span className="text-xs text-gray-500">
                    {list.length} items
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {list.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">
                                {emptyMessage}
                            </p>
                        </div>
                    </div>
                ) : (
                    list.map((item) => (
                        <div
                            key={
                                item.id ||
                                `${item.name}-${item.date || item.createdAt}`
                            }
                            className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm"
                        >
                            <div className="min-w-0">
                                <p className="font-medium text-gray-800 truncate">
                                    {item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {item.date || item.createdAt} • Q
                                    {item.quarter}
                                </p>
                            </div>
                            <div className="text-right ml-4">
                                <p className="text-sm font-bold text-gray-800">
                                    {item.score}/{item.totalScore}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {item.percentage}%
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Grade Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderCard(
                    "Written Works",
                    writtenWorks,
                    "No written works recorded yet."
                )}

                {renderCard(
                    "Performance Task",
                    performanceTasks,
                    "No performance tasks recorded yet."
                )}

                {renderCard(
                    "Quarterly Exam",
                    quarterlyExams,
                    "Quarterly exam has not been started yet."
                )}
            </div>
        </div>
    );
};

// Bar Chart Component - Compact and optimized
const GradeChart = ({ data }) => {
    // Filter only quarters that have grades
    const activeQuarters =
        data?.filter((q) => q.grade !== null && q.assignmentCount > 0) || [];

    if (activeQuarters.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-md p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-pink-600" />
                    Grade Trend
                </h3>
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-400 text-sm">No data yet</p>
                </div>
            </div>
        );
    }

    const chartData = activeQuarters.map((q) => ({
        name: q.quarter,
        Grade: q.grade || 0,
    }));

    return (
        <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-pink-600" />
                Grade Trend
            </h3>
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                        <XAxis
                            dataKey="name"
                            stroke="#9ca3af"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            fontSize={10}
                            domain={[0, 100]}
                            tickLine={false}
                            axisLine={false}
                            ticks={[0, 50, 75, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                fontSize: "12px",
                                padding: "8px 12px",
                            }}
                            formatter={(value) => [`${value}%`, "Grade"]}
                        />
                        <Bar
                            dataKey="Grade"
                            fill="#ec4899"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// Attendance Summary Card - Compact
const AttendanceSummary = ({ attendance }) => {
    if (!attendance) return null;

    return (
        <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-pink-600" />
                Attendance
            </h3>
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-green-600">
                        {attendance.rate}%
                    </p>
                    <p className="text-xs text-gray-500">Rate</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-blue-600">
                        {attendance.presentDays}
                    </p>
                    <p className="text-xs text-gray-500">Present</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-red-600">
                        {attendance.absentDays}
                    </p>
                    <p className="text-xs text-gray-500">Absent</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-yellow-600">
                        {attendance.lateDays}
                    </p>
                    <p className="text-xs text-gray-500">Late</p>
                </div>
            </div>
        </div>
    );
};

// Intervention Card - Compact
const InterventionCard = ({ intervention }) => {
    if (!intervention) return null;

    const progressPercent =
        intervention.totalTasks > 0
            ? Math.round(
                  (intervention.completedTasks / intervention.totalTasks) * 100
              )
            : 0;

    return (
        <div className="bg-white rounded-2xl shadow-md p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                    <Target size={16} className="text-orange-600" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                        Intervention
                    </h3>
                    <p className="text-xs text-orange-600">
                        {intervention.typeLabel}
                    </p>
                </div>
            </div>

            {intervention.notes && (
                <p className="text-gray-600 text-xs mb-3 bg-orange-50 p-2 rounded-lg line-clamp-2">
                    {intervention.notes}
                </p>
            )}

            {intervention.totalTasks > 0 && (
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium text-gray-700">
                            {intervention.completedTasks}/
                            {intervention.totalTasks}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                            className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Suggestions Component
const SuggestionsCard = ({ suggestions }) => {
    if (!suggestions || suggestions.length === 0) return null;

    const getIcon = (type, iconName) => {
        if (iconName === "star") return <Star size={20} />;
        if (iconName === "thumbs-up") return <ThumbsUp size={20} />;
        if (iconName === "lightbulb") return <Lightbulb size={20} />;
        if (iconName === "alert") return <AlertTriangle size={20} />;
        if (iconName === "alert-triangle") return <AlertTriangle size={20} />;
        if (iconName === "calendar") return <Calendar size={20} />;
        if (iconName === "book") return <BookOpen size={20} />;
        return <Lightbulb size={20} />;
    };

    const getColors = (type) => {
        switch (type) {
            case "success":
                return {
                    bg: "bg-green-50",
                    border: "border-green-200",
                    text: "text-green-800",
                    icon: "text-green-600",
                };
            case "warning":
                return {
                    bg: "bg-yellow-50",
                    border: "border-yellow-200",
                    text: "text-yellow-800",
                    icon: "text-yellow-600",
                };
            case "danger":
                return {
                    bg: "bg-red-50",
                    border: "border-red-200",
                    text: "text-red-800",
                    icon: "text-red-600",
                };
            default:
                return {
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    text: "text-blue-800",
                    icon: "text-blue-600",
                };
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Lightbulb size={22} className="text-pink-600" />
                Suggestions & Tips
            </h3>
            <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                    const colors = getColors(suggestion.type);
                    return (
                        <div
                            key={index}
                            className={`${colors.bg} border ${colors.border} rounded-xl p-4`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 ${colors.icon}`}>
                                    {getIcon(suggestion.type, suggestion.icon)}
                                </div>
                                <div>
                                    <h4
                                        className={`font-semibold ${colors.text}`}
                                    >
                                        {suggestion.title}
                                    </h4>
                                    <p
                                        className={`text-sm ${colors.text} opacity-90 mt-1`}
                                    >
                                        {suggestion.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Study Aids Component
const StudyAids = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-pink-200">
        <div className="flex items-center gap-3 mb-2">
            <Bot className="w-6 h-6 text-pink-600" />
            <h3 className="text-xl font-semibold text-gray-800">
                Personalized Study Aids
            </h3>
        </div>
        <p className="text-gray-700 mb-4">
            Struggling in certain areas? Let A.I. create a custom reviewer to
            help you catch up!
        </p>
        <button className="w-full bg-pink-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-pink-700 transition-colors flex items-center justify-center gap-2">
            <Bot size={18} />
            Generate Personalized Quiz
        </button>
    </div>
);

// --- Expected Grade Factors Card ---
// Explains the key factors that affect the expected grade calculation
const ExpectedGradeFactorsCard = () => {
    const factors = [
        {
            icon: TrendingUp,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            title: "Current Performance",
            description:
                "Your current grade serves as the baseline for predictions",
        },
        {
            icon: Calendar,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            title: "Attendance Rate",
            description:
                "Attendance below 90% may reduce your expected grade by up to 5% per 10% drop",
        },
        {
            icon: Target,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            title: "Grade Trend",
            description:
                "Improving trends project continued growth; declining trends suggest areas needing attention",
        },
        {
            icon: CheckCircle,
            iconBg: "bg-pink-100",
            iconColor: "text-pink-600",
            title: "Previous Quarter",
            description:
                "Q1 performance helps predict Q2 expectations based on historical patterns",
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Info size={20} className="text-blue-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">
                        Expected Grade Factors
                    </h3>
                    <p className="text-sm text-gray-500">
                        Your expected grade is calculated based on these key
                        factors:
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {factors.map((factor, idx) => {
                    const IconComponent = factor.icon;
                    return (
                        <div
                            key={idx}
                            className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl"
                        >
                            <div
                                className={`w-10 h-10 ${factor.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
                            >
                                <IconComponent
                                    size={20}
                                    className={factor.iconColor}
                                />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">
                                    {factor.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                    {factor.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- "For Your Case" Component ---
// Personalized insights with expected grade calculation and improvement plan
// Matching mobile SubjectAnalytics.jsx functionality
const ForYourCaseCard = ({
    currentGrade,
    attendance,
    quarterlyGrades = [],
    gradeBreakdown,
    gradeTrend = [],
}) => {
    const [showApproachModal, setShowApproachModal] = useState(false);

    // ============================================
    // DYNAMIC INSIGHTS COMPUTATION
    // "For Your Case" - Real-time Performance Analysis
    // ============================================
    const personalizedInsights = useMemo(() => {
        // =============================================
        // STEP 1: GATHER RAW METRICS FROM API DATA
        // =============================================
        const baseGrade = currentGrade ?? 0;
        const attendanceRate = attendance?.rate ?? 100;
        const totalDays = attendance?.totalDays ?? 0;
        const presentDays = attendance?.presentDays ?? 0;
        const absentDays = attendance?.absentDays ?? 0;

        // Task completion metrics from gradeBreakdown
        const writtenWorksItems = gradeBreakdown?.writtenWorks?.items || [];
        const performanceTaskItems =
            gradeBreakdown?.performanceTask?.items || [];
        const quarterlyExamItems = gradeBreakdown?.quarterlyExam?.items || [];

        const totalCompletedTasks =
            writtenWorksItems.length +
            performanceTaskItems.length +
            quarterlyExamItems.length;
        const estimatedTotalTasks = Math.max(totalCompletedTasks, 15);
        const completionRate =
            estimatedTotalTasks > 0
                ? Math.round((totalCompletedTasks / estimatedTotalTasks) * 100)
                : 0;

        // Category averages
        const writtenWorksAvg =
            gradeBreakdown?.writtenWorks?.average ||
            (writtenWorksItems.length > 0
                ? writtenWorksItems.reduce(
                      (sum, i) => sum + (i.percentage || 0),
                      0
                  ) / writtenWorksItems.length
                : 0);
        const performanceTaskAvg =
            gradeBreakdown?.performanceTask?.average ||
            (performanceTaskItems.length > 0
                ? performanceTaskItems.reduce(
                      (sum, i) => sum + (i.percentage || 0),
                      0
                  ) / performanceTaskItems.length
                : 0);
        const quarterlyExamAvg =
            gradeBreakdown?.quarterlyExam?.average ||
            (quarterlyExamItems.length > 0
                ? quarterlyExamItems.reduce(
                      (sum, i) => sum + (i.percentage || 0),
                      0
                  ) / quarterlyExamItems.length
                : 0);

        // =============================================
        // STEP 2: CALCULATE PERFORMANCE LEVEL (DepEd Scale)
        // =============================================
        let performanceLevel = "N/A";
        let performanceLevelColor = "text-gray-500";
        if (baseGrade >= 90) {
            performanceLevel = "Outstanding";
            performanceLevelColor = "text-green-600";
        } else if (baseGrade >= 85) {
            performanceLevel = "Very Satisfactory";
            performanceLevelColor = "text-blue-600";
        } else if (baseGrade >= 80) {
            performanceLevel = "Satisfactory";
            performanceLevelColor = "text-indigo-600";
        } else if (baseGrade >= 75) {
            performanceLevel = "Fairly Satisfactory";
            performanceLevelColor = "text-yellow-600";
        } else if (baseGrade > 0) {
            performanceLevel = "Did Not Meet Expectations";
            performanceLevelColor = "text-red-600";
        }

        // =============================================
        // STEP 3: RISK ASSESSMENT (Weighted Scoring)
        // =============================================
        const riskFactors = [];
        let riskScore = 0;

        // Grade Risk (40% weight)
        if (baseGrade > 0 && baseGrade < 75) {
            riskScore += 40;
            riskFactors.push({
                text: "Below passing grade (75%)",
                severity: "high",
            });
        } else if (baseGrade >= 75 && baseGrade < 80) {
            riskScore += 20;
            riskFactors.push({
                text: "Near failing threshold",
                severity: "medium",
            });
        } else if (baseGrade >= 80 && baseGrade < 85) {
            riskScore += 10;
        }

        // Attendance Risk (30% weight)
        if (attendanceRate < 80) {
            riskScore += 30;
            riskFactors.push({
                text: `Critical attendance: ${attendanceRate}%`,
                severity: "high",
            });
        } else if (attendanceRate < 90) {
            riskScore += 15;
            riskFactors.push({
                text: `Low attendance: ${attendanceRate}%`,
                severity: "medium",
            });
        }

        // Trend Risk (20% weight) - from quarterly grades
        let trendDirection = "stable";
        let trendChange = 0;
        const validQuarters = quarterlyGrades.filter(
            (q) => q.grade !== null && q.grade > 0
        );
        if (validQuarters.length >= 2) {
            const first = validQuarters[0].grade;
            const last = validQuarters[validQuarters.length - 1].grade;
            trendChange = last - first;

            let decliningCount = 0;
            for (let i = 1; i < validQuarters.length; i++) {
                if (validQuarters[i].grade < validQuarters[i - 1].grade)
                    decliningCount++;
            }

            if (decliningCount >= 2) {
                riskScore += 20;
                trendDirection = "declining";
                riskFactors.push({
                    text: "Consistent grade decline",
                    severity: "medium",
                });
            } else if (decliningCount === 1 && trendChange < 0) {
                riskScore += 10;
                trendDirection = "slightly declining";
            } else if (trendChange > 0) {
                trendDirection = "improving";
            }
        }

        // Completion Risk (10% weight)
        if (completionRate < 50) {
            riskScore += 10;
            riskFactors.push({
                text: `Low task completion: ${completionRate}%`,
                severity: "low",
            });
        } else if (completionRate < 80) {
            riskScore += 5;
        }

        // Classify Risk Level
        let riskLevel = "Low";
        let riskColor = "text-green-600";
        let riskBgColor = "bg-green-100";
        if (riskScore >= 50) {
            riskLevel = "High";
            riskColor = "text-red-600";
            riskBgColor = "bg-red-100";
        } else if (riskScore >= 25) {
            riskLevel = "Moderate";
            riskColor = "text-yellow-600";
            riskBgColor = "bg-yellow-100";
        }

        // =============================================
        // STEP 4: EXPECTED GRADE CALCULATION
        // =============================================
        const gradeExplanation = [];
        let expectedGrade = baseGrade > 0 ? baseGrade : 75;

        // Base Grade
        gradeExplanation.push({
            label: "Base (Current Grade)",
            value: baseGrade || 75,
            impact: 0,
            formula: "Starting point from actual scores",
        });

        // Attendance Adjustment
        let attendanceAdj = 0;
        if (attendanceRate >= 90) {
            attendanceAdj = 1;
        } else if (attendanceRate >= 80) {
            attendanceAdj = 0;
        } else {
            attendanceAdj = -Math.round((90 - attendanceRate) * 0.3);
        }
        expectedGrade += attendanceAdj;
        gradeExplanation.push({
            label: "Attendance Effect",
            value: attendanceRate,
            impact: attendanceAdj,
            formula:
                attendanceAdj >= 0
                    ? "≥90%: +1 | 80-89%: 0"
                    : "(90 - rate) × 0.3 penalty",
        });

        // Trend Adjustment
        let trendAdj = 0;
        if (trendDirection === "improving" && trendChange > 0) {
            trendAdj = Math.min(3, Math.round(trendChange * 0.4));
        } else if (
            trendDirection === "declining" ||
            trendDirection === "slightly declining"
        ) {
            trendAdj = Math.max(-3, Math.round(trendChange * 0.3));
        }
        expectedGrade += trendAdj;
        gradeExplanation.push({
            label: "Trend Projection",
            value: trendDirection,
            impact: trendAdj,
            formula: "Improving: +change×0.4 | Declining: change×0.3",
        });

        // Completion Adjustment
        let completionAdj = 0;
        if (completionRate >= 80) {
            completionAdj = 1;
        } else if (completionRate < 60) {
            completionAdj = -2;
        }
        expectedGrade += completionAdj;
        gradeExplanation.push({
            label: "Task Completion",
            value: `${completionRate}%`,
            impact: completionAdj,
            formula: "≥80%: +1 | <60%: -2",
        });

        // Improvement Potential (from weak categories)
        let improvementAdj = 0;
        const categoryScores = {
            writtenWorksAvg,
            performanceTaskAvg,
            quarterlyExamAvg,
        };
        const validCategoryScores = Object.values(categoryScores).filter(
            (s) => s > 0
        );
        const avgCategoryScore =
            validCategoryScores.length > 0
                ? validCategoryScores.reduce((a, b) => a + b, 0) /
                  validCategoryScores.length
                : 0;

        let weakestCategory = null;
        let weakestScore = 100;
        if (writtenWorksAvg > 0 && writtenWorksAvg < weakestScore) {
            weakestScore = writtenWorksAvg;
            weakestCategory = "writtenWorks";
        }
        if (performanceTaskAvg > 0 && performanceTaskAvg < weakestScore) {
            weakestScore = performanceTaskAvg;
            weakestCategory = "performanceTask";
        }
        if (quarterlyExamAvg > 0 && quarterlyExamAvg < weakestScore) {
            weakestScore = quarterlyExamAvg;
            weakestCategory = "quarterlyExam";
        }

        if (weakestCategory && avgCategoryScore - weakestScore >= 10) {
            improvementAdj = 2;
            gradeExplanation.push({
                label: "Improvement Potential",
                value: `Gap: ${Math.round(avgCategoryScore - weakestScore)}pts`,
                impact: improvementAdj,
                formula: "Weak category 10+ below avg: +2 potential",
            });
            expectedGrade += improvementAdj;
        }

        // Clamp and round
        expectedGrade = Math.max(60, Math.min(100, Math.round(expectedGrade)));

        // Gap to target (85 - Very Satisfactory)
        const expectedTo85Gap = Math.max(0, 85 - expectedGrade);

        return {
            currentGrade: baseGrade,
            attendanceRate,
            completionRate,
            totalCompletedTasks,
            absentDays,
            presentDays,
            totalDays,
            writtenWorksAvg: Math.round(writtenWorksAvg),
            performanceTaskAvg: Math.round(performanceTaskAvg),
            quarterlyExamAvg: Math.round(quarterlyExamAvg),
            weakestCategory,
            weakestScore: Math.round(weakestScore),
            performanceLevel,
            performanceLevelColor,
            riskLevel,
            riskColor,
            riskBgColor,
            riskScore,
            riskFactors,
            trendDirection,
            trendChange: Math.round(trendChange),
            expectedGrade,
            gradeExplanation,
            expectedTo85Gap,
        };
    }, [currentGrade, attendance, quarterlyGrades, gradeBreakdown]);

    // Alias for backwards compatibility
    const insights = personalizedInsights;

    // ============================================
    // SYSTEM-GENERATED IMPROVEMENT PLAN
    // How to go from Expected Grade → 85 (Very Satisfactory)
    // ============================================
    const improvementPlan = useMemo(() => {
        if (!personalizedInsights) return null;

        const {
            currentGrade,
            expectedGrade,
            attendanceRate,
            completionRate,
            weakestCategory,
            weakestScore,
            trendDirection,
            riskFactors,
            absentDays,
            totalDays,
        } = personalizedInsights;

        const targetGrade = 85; // Very Satisfactory
        const gapToTarget = Math.max(0, targetGrade - expectedGrade);

        if (gapToTarget === 0) {
            return {
                targetGrade,
                gapToTarget: 0,
                isAlreadyMet: true,
                steps: [],
                conclusion: {
                    currentGrade,
                    expectedGrade,
                    projectedGrade: expectedGrade,
                    message:
                        "You're already on track to achieve Very Satisfactory level!",
                },
            };
        }

        const steps = [];
        let projectedGradeGain = 0;

        // STEP 1: ATTENDANCE TARGET
        if (attendanceRate < 95) {
            const targetAttendance = Math.min(95, attendanceRate + 10);
            const attendanceGain = Math.round(
                (targetAttendance - attendanceRate) * 0.5
            );
            const remainingDays = Math.max(0, 20 - totalDays);
            const requiredPresentDays =
                Math.ceil(
                    (targetAttendance / 100) * (totalDays + remainingDays)
                ) -
                (totalDays - absentDays);

            projectedGradeGain += Math.min(attendanceGain, 2);

            steps.push({
                icon: Calendar,
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600",
                title: "Improve Attendance",
                currentValue: `${attendanceRate}%`,
                targetValue: `${targetAttendance}%`,
                action: `Attend ${
                    requiredPresentDays > 0 ? requiredPresentDays : "all"
                } more class sessions without absence`,
                gradeImpact: `+${Math.min(attendanceGain, 2)} points`,
                formula: "Grade Impact = (Target% - Current%) × 0.5",
                details: [
                    `Current: ${attendanceRate}% (${
                        totalDays - absentDays
                    }/${totalDays} days)`,
                    `Target: ${targetAttendance}% attendance`,
                    `Each 1% increase ≈ 0.5 point grade improvement`,
                ],
            });
        }

        // STEP 2: TASK COMPLETION
        if (completionRate < 90) {
            const targetCompletion = Math.min(100, completionRate + 20);
            const completionGain = targetCompletion >= 90 ? 2 : 1;
            projectedGradeGain += completionGain;

            steps.push({
                icon: CheckCircle,
                iconBg: "bg-green-100",
                iconColor: "text-green-600",
                title: "Complete All Remaining Tasks",
                currentValue: `${completionRate}%`,
                targetValue: `${targetCompletion}%`,
                action: "Submit all pending assignments and activities on time",
                gradeImpact: `+${completionGain} points`,
                formula: "Completion ≥90%: +2 | ≥70%: +1",
                details: [
                    `Current completion: ${completionRate}%`,
                    `Missing tasks = missed grade opportunities`,
                    `Aim for 100% submission rate`,
                ],
            });
        }

        // STEP 3: FOCUS ON WEAK CATEGORY
        if (weakestCategory) {
            const categoryNames = {
                writtenWorks: "Written Works",
                performanceTask: "Performance Tasks",
                quarterlyExam: "Quarterly Exam",
            };
            const categoryWeights = {
                writtenWorks: 0.25,
                performanceTask: 0.5,
                quarterlyExam: 0.25,
            };
            const categoryStrategies = {
                writtenWorks: [
                    "Review notes 10 minutes daily before class",
                    "Practice past quiz questions",
                    "Ask teacher for clarification on confusing topics",
                ],
                performanceTask: [
                    "Start projects early - avoid last-minute work",
                    "Follow rubric requirements exactly",
                    "Seek feedback before final submission",
                ],
                quarterlyExam: [
                    "Create a 2-week study schedule before exam",
                    "Use practice tests and past exams",
                    "Focus on frequently tested topics",
                ],
            };

            const targetCategoryScore = Math.min(90, weakestScore + 15);
            const categoryWeight = categoryWeights[weakestCategory];
            const categoryGain = Math.round(
                (targetCategoryScore - weakestScore) * categoryWeight
            );
            projectedGradeGain += Math.min(categoryGain, 3);

            steps.push({
                icon: Target,
                iconBg: "bg-yellow-100",
                iconColor: "text-yellow-600",
                title: `Improve ${categoryNames[weakestCategory]}`,
                currentValue: `${weakestScore}%`,
                targetValue: `${targetCategoryScore}%`,
                action: `This is your weakest area - focused improvement here yields highest returns`,
                gradeImpact: `+${Math.min(categoryGain, 3)} points`,
                formula: `Impact = (Target - Current) × ${categoryWeight} weight`,
                details: categoryStrategies[weakestCategory],
            });
        }

        // STEP 4: MAINTAIN UPWARD TREND
        if (trendDirection !== "improving") {
            projectedGradeGain += 1;

            steps.push({
                icon: TrendingUp,
                iconBg: "bg-indigo-100",
                iconColor: "text-indigo-600",
                title: "Build Positive Momentum",
                currentValue:
                    trendDirection === "stable" ? "Stable" : "Declining",
                targetValue: "Consistently Improving",
                action: "Score higher than your previous assessment each time",
                gradeImpact: "+1 point",
                formula: "3+ consecutive improvements = +1 trend bonus",
                details: [
                    "Track your scores after each activity",
                    "Aim to beat your last score by 2-3 points",
                    "Consistent small gains compound over time",
                ],
            });
        }

        // STEP 5: SCORE TARGET ON UPCOMING TASKS
        const remainingTasks = 5;
        const requiredAvgScore = Math.min(
            95,
            expectedGrade + gapToTarget * 1.5
        );

        steps.push({
            icon: Award,
            iconBg: "bg-pink-100",
            iconColor: "text-pink-600",
            title: "Target Scores for Upcoming Tasks",
            currentValue: `${currentGrade}% avg`,
            targetValue: `${Math.round(requiredAvgScore)}% avg needed`,
            action: `Score an average of ${Math.round(
                requiredAvgScore
            )}% on your next ${remainingTasks} graded activities`,
            gradeImpact: `+${
                gapToTarget - projectedGradeGain > 0
                    ? gapToTarget - projectedGradeGain
                    : 1
            } points`,
            formula: `Required = Expected + (Target - Expected) × 1.5`,
            details: [
                `Current average: ${currentGrade}%`,
                `Need: ${Math.round(
                    requiredAvgScore
                )}% average on remaining tasks`,
                `This closes the gap to ${targetGrade}% (Very Satisfactory)`,
            ],
        });

        // Calculate projected final grade
        const projectedGrade = Math.min(
            100,
            expectedGrade + projectedGradeGain
        );

        // CONCLUSION SUMMARY
        const conclusion = {
            currentGrade,
            expectedGrade,
            targetGrade,
            projectedGrade,
            gapClosed: projectedGradeGain,
            remainingGap: Math.max(0, targetGrade - projectedGrade),
            message:
                projectedGrade >= targetGrade
                    ? `By following this plan, your expected grade can improve from ${expectedGrade}% to approximately ${projectedGrade}%, reaching Very Satisfactory level!`
                    : `This plan can raise your expected grade from ${expectedGrade}% to ${projectedGrade}%. Continue these strategies to reach ${targetGrade}%.`,
        };

        return {
            targetGrade,
            gapToTarget,
            isAlreadyMet: false,
            steps,
            projectedGradeGain,
            conclusion,
        };
    }, [personalizedInsights]);

    // Don't render if no grade data
    if (currentGrade === null || currentGrade === undefined) return null;

    // Helper function for grade colors
    const getGradeColorClass = (grade) => {
        if (grade === null || grade === undefined) return "text-gray-500";
        if (grade >= 90) return "text-green-600";
        if (grade >= 85) return "text-blue-600";
        if (grade >= 80) return "text-indigo-600";
        if (grade >= 75) return "text-yellow-600";
        return "text-red-600";
    };

    const gradeColor = getGradeColorClass(insights?.expectedGrade);

    return (
        <>
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-lg p-6 border border-pink-200">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                        <Zap size={20} className="text-pink-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            For Your Case
                        </h3>
                        <p className="text-sm text-gray-600">
                            Personalized Grade Analysis & Insights
                        </p>
                    </div>
                </div>

                {/* Grade Summary Row */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                    {/* Current Grade */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Current Grade
                        </p>
                        <p
                            className={`text-3xl font-bold ${getGradeColorClass(
                                insights.currentGrade
                            )}`}
                        >
                            {insights.currentGrade || "--"}%
                        </p>
                        <p
                            className={`text-sm font-medium ${insights.performanceLevelColor}`}
                        >
                            {insights.performanceLevel}
                        </p>
                    </div>
                    {/* Expected Grade */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Expected Grade
                        </p>
                        <p className={`text-3xl font-bold ${gradeColor}`}>
                            {insights.expectedGrade}%
                        </p>
                        <p className="text-sm text-gray-500">
                            Computed Projection
                        </p>
                    </div>
                </div>

                {/* Why Expected Grade Section */}
                <div className="bg-white rounded-xl p-4 mb-5 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">
                        📊 Why is your expected grade {insights.expectedGrade}%?
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                        Your expected grade is calculated using multiple
                        performance factors:
                    </p>

                    {/* Formula Breakdown */}
                    <div className="space-y-2">
                        {insights.gradeExplanation?.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between text-sm border-b border-gray-100 pb-2"
                            >
                                <div>
                                    <span className="text-gray-700 font-medium">
                                        {item.label}
                                    </span>
                                    <p className="text-xs text-gray-400">
                                        {item.formula}
                                    </p>
                                </div>
                                <span
                                    className={`font-bold ${
                                        item.impact > 0
                                            ? "text-green-600"
                                            : item.impact < 0
                                            ? "text-red-600"
                                            : "text-gray-500"
                                    }`}
                                >
                                    {item.impact > 0 ? "+" : ""}
                                    {item.impact !== 0 ? item.impact : "—"}
                                </span>
                            </div>
                        ))}

                        {/* Final Calculation */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t-2 border-pink-200">
                            <span className="font-bold text-gray-800">
                                Final Expected Grade
                            </span>
                            <span className={`text-xl font-bold ${gradeColor}`}>
                                {insights.expectedGrade}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Final Expected Grade Bar - Matching Mobile */}
                <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-xl p-4 mb-5 flex items-center justify-between">
                    <span className="text-white font-semibold">
                        Final Expected Grade
                    </span>
                    <span className="text-white text-2xl font-bold">
                        {insights.expectedGrade}%
                    </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                    <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                        <Calendar
                            size={16}
                            className="text-blue-600 mx-auto mb-1"
                        />
                        <p className="text-xs text-gray-500">Attendance</p>
                        <p
                            className={`text-lg font-bold ${
                                insights.attendanceRate >= 90
                                    ? "text-green-600"
                                    : insights.attendanceRate >= 80
                                    ? "text-yellow-600"
                                    : "text-red-600"
                            }`}
                        >
                            {insights.attendanceRate}%
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                        <CheckCircle
                            size={16}
                            className="text-green-600 mx-auto mb-1"
                        />
                        <p className="text-xs text-gray-500">Completion</p>
                        <p
                            className={`text-lg font-bold ${
                                insights.completionRate >= 80
                                    ? "text-green-600"
                                    : insights.completionRate >= 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                            }`}
                        >
                            {insights.completionRate}%
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                        <TrendingUp
                            size={16}
                            className="text-purple-600 mx-auto mb-1"
                        />
                        <p className="text-xs text-gray-500">Trend</p>
                        <p
                            className={`text-lg font-bold ${
                                insights.trendDirection === "improving"
                                    ? "text-green-600"
                                    : insights.trendDirection === "stable"
                                    ? "text-gray-600"
                                    : "text-red-600"
                            }`}
                        >
                            {insights.trendDirection === "improving"
                                ? "↑ Up"
                                : insights.trendDirection === "declining"
                                ? "↓ Down"
                                : "→ Stable"}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                        <AlertTriangle
                            size={16}
                            className="text-yellow-600 mx-auto mb-1"
                        />
                        <p className="text-xs text-gray-500">Risk</p>
                        <p
                            className={`text-lg font-bold ${insights.riskColor}`}
                        >
                            {insights.riskLevel}
                        </p>
                    </div>
                </div>

                {/* Category Performance */}
                {insights.weakestCategory && (
                    <div className="bg-white rounded-xl p-4 mb-5 shadow-sm">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">
                            Category Performance:
                        </h4>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">
                                    Written Works
                                </p>
                                <p
                                    className={`text-lg font-bold ${getGradeColorClass(
                                        insights.writtenWorksAvg
                                    )}`}
                                >
                                    {insights.writtenWorksAvg || "--"}%
                                </p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">
                                    Performance
                                </p>
                                <p
                                    className={`text-lg font-bold ${getGradeColorClass(
                                        insights.performanceTaskAvg
                                    )}`}
                                >
                                    {insights.performanceTaskAvg || "--"}%
                                </p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">Exam</p>
                                <p
                                    className={`text-lg font-bold ${getGradeColorClass(
                                        insights.quarterlyExamAvg
                                    )}`}
                                >
                                    {insights.quarterlyExamAvg || "--"}%
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-lg">
                            <AlertCircle size={14} />
                            <span>
                                Weakest:{" "}
                                {insights.weakestCategory === "writtenWorks"
                                    ? "Written Works"
                                    : insights.weakestCategory ===
                                      "performanceTask"
                                    ? "Performance Tasks"
                                    : "Quarterly Exam"}{" "}
                                ({insights.weakestScore}%)
                            </span>
                        </div>
                    </div>
                )}

                {/* Risk Factors (if any) */}
                {insights.riskFactors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                        <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                            ⚠️ Risk Indicators:
                        </h4>
                        <ul className="space-y-1">
                            {insights.riskFactors.map((risk, idx) => (
                                <li
                                    key={idx}
                                    className="text-sm text-red-700 flex items-center gap-2"
                                >
                                    <span
                                        className={`w-2 h-2 rounded-full ${
                                            risk.severity === "high"
                                                ? "bg-red-500"
                                                : risk.severity === "medium"
                                                ? "bg-yellow-500"
                                                : "bg-gray-400"
                                        }`}
                                    />
                                    {risk.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Gap to Target */}
                {insights.expectedTo85Gap > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">
                            🎯 Gap to Very Satisfactory (85%):
                        </h4>
                        <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            +{insights.expectedTo85Gap} points needed
                        </div>
                    </div>
                )}

                {/* System-Generated Approach Button */}
                <button
                    onClick={() => setShowApproachModal(true)}
                    className="w-full bg-pink-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Lightbulb size={18} />
                    System-Generated Approach
                    <ArrowRight size={16} />
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                    Tap to see how to improve from {insights.expectedGrade}% →
                    85%
                </p>
            </div>

            {/* System-Generated Approach Modal */}
            <Transition.Root show={showApproachModal} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={setShowApproachModal}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50 transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all max-h-[90vh] flex flex-col">
                                    {/* Modal Header */}
                                    <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <Lightbulb
                                                    size={24}
                                                    className="text-white"
                                                />
                                                <div>
                                                    <Dialog.Title className="text-xl font-bold text-white">
                                                        System-Generated
                                                        Approach
                                                    </Dialog.Title>
                                                    <p className="text-pink-100 text-sm mt-1">
                                                        Personalized improvement
                                                        plan for your academic
                                                        success
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setShowApproachModal(false)
                                                }
                                                className="text-white/80 hover:text-white"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Modal Content - Scrollable */}
                                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                                        {/* Goal Summary */}
                                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4">
                                            <h4 className="text-sm font-bold text-gray-800 mb-3">
                                                🎯 Improvement Goal: Reach Very
                                                Satisfactory (85%)
                                            </h4>
                                            <div className="flex items-center justify-center gap-2 mb-3">
                                                <div className="text-center bg-white rounded-lg p-3 flex-1">
                                                    <p className="text-xs text-gray-500">
                                                        Current
                                                    </p>
                                                    <p
                                                        className={`text-2xl font-bold ${getGradeColorClass(
                                                            insights.currentGrade
                                                        )}`}
                                                    >
                                                        {insights.currentGrade}%
                                                    </p>
                                                </div>
                                                <ChevronRight
                                                    className="text-pink-400"
                                                    size={20}
                                                />
                                                <div className="text-center bg-white rounded-lg p-3 flex-1">
                                                    <p className="text-xs text-gray-500">
                                                        Expected
                                                    </p>
                                                    <p
                                                        className={`text-2xl font-bold ${gradeColor}`}
                                                    >
                                                        {insights.expectedGrade}
                                                        %
                                                    </p>
                                                </div>
                                                <ChevronRight
                                                    className="text-pink-400"
                                                    size={20}
                                                />
                                                <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-3 flex-1">
                                                    <p className="text-xs text-gray-500">
                                                        Target
                                                    </p>
                                                    <p className="text-2xl font-bold text-blue-600">
                                                        85%
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-center text-gray-600">
                                                Gap to close:{" "}
                                                <span className="font-bold text-pink-600">
                                                    {improvementPlan?.gapToTarget ||
                                                        0}{" "}
                                                    points
                                                </span>
                                            </p>
                                        </div>

                                        {/* Already Met Goal */}
                                        {improvementPlan?.isAlreadyMet && (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                                <CheckCircle
                                                    size={48}
                                                    className="text-green-600 mx-auto mb-3"
                                                />
                                                <h4 className="text-lg font-bold text-green-800 mb-2">
                                                    Excellent Progress!
                                                </h4>
                                                <p className="text-green-700">
                                                    You're already on track to
                                                    achieve Very Satisfactory
                                                    level. Keep up the great
                                                    work!
                                                </p>
                                            </div>
                                        )}

                                        {/* Improvement Steps */}
                                        {!improvementPlan?.isAlreadyMet &&
                                            improvementPlan?.steps?.map(
                                                (step, idx) => {
                                                    const IconComponent =
                                                        step.icon;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                                                        >
                                                            <div className="flex items-start gap-3 mb-3">
                                                                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-sm flex-shrink-0">
                                                                    {idx + 1}
                                                                </div>
                                                                <div
                                                                    className={`w-10 h-10 ${step.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
                                                                >
                                                                    <IconComponent
                                                                        size={
                                                                            20
                                                                        }
                                                                        className={
                                                                            step.iconColor
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="font-bold text-gray-800">
                                                                        {
                                                                            step.title
                                                                        }
                                                                    </h4>
                                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                        <span>
                                                                            {
                                                                                step.currentValue
                                                                            }
                                                                        </span>
                                                                        <ChevronRight
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                        <span className="text-green-600 font-medium">
                                                                            {
                                                                                step.targetValue
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <p className="text-sm text-gray-600 mb-3">
                                                                {step.action}
                                                            </p>

                                                            {/* Step Details */}
                                                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                                                <ul className="space-y-1">
                                                                    {step.details?.map(
                                                                        (
                                                                            detail,
                                                                            dIdx
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    dIdx
                                                                                }
                                                                                className="text-sm text-gray-600 flex items-start gap-2"
                                                                            >
                                                                                <span className="text-gray-400">
                                                                                    •
                                                                                </span>
                                                                                {
                                                                                    detail
                                                                                }
                                                                            </li>
                                                                        )
                                                                    )}
                                                                </ul>
                                                            </div>

                                                            {/* Impact & Formula */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                                                                    <TrendingUp
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                    <span className="font-medium">
                                                                        {
                                                                            step.gradeImpact
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    <span className="font-medium">
                                                                        Formula:
                                                                    </span>{" "}
                                                                    {
                                                                        step.formula
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            )}

                                        {/* Conclusion Summary */}
                                        {improvementPlan?.conclusion &&
                                            !improvementPlan?.isAlreadyMet && (
                                                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
                                                    <h4 className="text-sm font-bold text-gray-800 mb-3">
                                                        📋 Summary & Projection
                                                    </h4>

                                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                                        <div className="text-center bg-white rounded-lg p-3">
                                                            <p className="text-xs text-gray-500">
                                                                Current
                                                            </p>
                                                            <p
                                                                className={`text-xl font-bold ${getGradeColorClass(
                                                                    improvementPlan
                                                                        .conclusion
                                                                        .currentGrade
                                                                )}`}
                                                            >
                                                                {
                                                                    improvementPlan
                                                                        .conclusion
                                                                        .currentGrade
                                                                }
                                                                %
                                                            </p>
                                                        </div>
                                                        <div className="text-center bg-white rounded-lg p-3">
                                                            <p className="text-xs text-gray-500">
                                                                Expected
                                                            </p>
                                                            <p
                                                                className={`text-xl font-bold ${getGradeColorClass(
                                                                    improvementPlan
                                                                        .conclusion
                                                                        .expectedGrade
                                                                )}`}
                                                            >
                                                                {
                                                                    improvementPlan
                                                                        .conclusion
                                                                        .expectedGrade
                                                                }
                                                                %
                                                            </p>
                                                        </div>
                                                        <div className="text-center bg-green-100 border border-green-200 rounded-lg p-3">
                                                            <p className="text-xs text-gray-500">
                                                                Projected
                                                            </p>
                                                            <p className="text-xl font-bold text-green-600">
                                                                ~
                                                                {
                                                                    improvementPlan
                                                                        .conclusion
                                                                        .projectedGrade
                                                                }
                                                                %
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white rounded-lg p-3 mb-3">
                                                        <p className="text-sm text-gray-600">
                                                            {
                                                                improvementPlan
                                                                    .conclusion
                                                                    .message
                                                            }
                                                        </p>
                                                    </div>

                                                    {improvementPlan.conclusion
                                                        .projectedGrade >=
                                                        85 && (
                                                        <div className="flex items-center gap-2 justify-center bg-green-100 text-green-700 px-4 py-2 rounded-full">
                                                            <Award size={16} />
                                                            <span className="font-medium text-sm">
                                                                On track to
                                                                reach Very
                                                                Satisfactory!
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        {/* Formula Reference */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h4 className="text-sm font-bold text-gray-700 mb-3">
                                                📊 Calculation Methodology
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                                    <span className="font-medium text-gray-600 min-w-[140px]">
                                                        Expected Grade:
                                                    </span>
                                                    <span className="text-gray-500">
                                                        Base + Attendance Adj +
                                                        Trend Adj + Completion
                                                        Adj + Improvement
                                                        Potential
                                                    </span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                                    <span className="font-medium text-gray-600 min-w-[140px]">
                                                        Attendance Impact:
                                                    </span>
                                                    <span className="text-gray-500">
                                                        ≥90%: +1 | 80-89%: 0 |{" "}
                                                        {"<"}80%: -(90-rate)×0.3
                                                    </span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                                    <span className="font-medium text-gray-600 min-w-[140px]">
                                                        Category Weight (DepEd):
                                                    </span>
                                                    <span className="text-gray-500">
                                                        Written: 25% |
                                                        Performance: 50% | Exam:
                                                        25%
                                                    </span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                                    <span className="font-medium text-gray-600 min-w-[140px]">
                                                        Risk Score:
                                                    </span>
                                                    <span className="text-gray-500">
                                                        Grade(40%) +
                                                        Attendance(30%) +
                                                        Trend(20%) +
                                                        Completion(10%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="px-6 py-4 bg-gray-50 border-t">
                                        <button
                                            onClick={() =>
                                                setShowApproachModal(false)
                                            }
                                            className="w-full bg-pink-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-pink-700 transition-colors"
                                        >
                                            Got It
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    );
};

// --- Main Page Component ---
const AnalyticsShow = ({
    enrollment = {},
    subject = {},
    performance = {},
    attendance = {},
    intervention = null,
    suggestions = [],
}) => {
    const {
        overallGrade,
        quarterlyGrades = [],
        gradeBreakdown = {},
    } = performance;

    // Determine grade status
    const gradeStatus = useMemo(() => {
        if (overallGrade === null)
            return { color: "text-gray-400", label: "No data" };
        if (overallGrade >= 90)
            return { color: "text-green-600", label: "Excellent" };
        if (overallGrade >= 85)
            return { color: "text-blue-600", label: "Very Good" };
        if (overallGrade >= 80)
            return { color: "text-blue-500", label: "Good" };
        if (overallGrade >= 75)
            return { color: "text-yellow-600", label: "Satisfactory" };
        return { color: "text-red-600", label: "Needs Improvement" };
    }, [overallGrade]);

    const handleExportPdf = async () => {
        if (!enrollment?.id) return;
        const url = route("analytics.show.pdf", { enrollment: enrollment.id });
        try {
            const resp = await fetch(url, {
                method: "GET",
                credentials: "same-origin",
                headers: { Accept: "application/pdf" },
            });
            if (
                resp.ok &&
                resp.headers.get("Content-Type")?.includes("application/pdf")
            ) {
                const blob = await resp.blob();
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, "_blank");
                setTimeout(() => URL.revokeObjectURL(blobUrl), 20000);
                return;
            }
        } catch (e) {
            // fallback to printing
            window.print();
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={subject.name || "Subject Analytics"} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Breadcrumbs */}
                <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Link
                        href={route("analytics.index")}
                        className="hover:text-pink-600 transition-colors"
                    >
                        Performance Analytics
                    </Link>
                    <ChevronRight size={16} />
                    <span className="text-gray-900">{subject.name}</span>
                </div>

                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">
                            {subject.name}
                        </h1>
                        <p className="text-lg text-gray-600">
                            {subject.teacher} • {subject.schoolYear}
                            {subject.section && ` • ${subject.section}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExportPdf}
                            className="flex items-center gap-2 bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-pink-700 transition-colors"
                        >
                            <FileDown size={18} />
                            Export PDF
                        </button>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-500">
                                CURRENT GRADE
                            </p>
                            <div className="flex items-end gap-2">
                                <p
                                    className={`text-6xl font-bold ${gradeStatus.color}`}
                                >
                                    {overallGrade !== null ? overallGrade : "—"}
                                </p>
                                {overallGrade !== null && (
                                    <span
                                        className={`text-sm font-medium ${gradeStatus.color} mb-2`}
                                    >
                                        {gradeStatus.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <QuarterlyGradesCards data={quarterlyGrades} />
                        <ExpectedGradeFactorsCard />
                        <ForYourCaseCard
                            currentGrade={overallGrade}
                            attendance={attendance}
                            quarterlyGrades={quarterlyGrades}
                            gradeBreakdown={gradeBreakdown}
                        />
                        <GradeBreakdown data={gradeBreakdown} />
                        <SuggestionsCard suggestions={suggestions} />
                        <StudyAids />
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        <GradeChart data={quarterlyGrades} />
                        <AttendanceSummary attendance={attendance} />
                        {intervention && (
                            <InterventionCard intervention={intervention} />
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default AnalyticsShow;

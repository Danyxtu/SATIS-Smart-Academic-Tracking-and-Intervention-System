import React, { useState, useMemo } from "react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    AlertTriangle,
    ClipboardList,
    CheckCircle2,
    TrendingDown,
    Calendar,
    BookOpen,
    Building2,
    HelpCircle,
    Printer,
    Upload,
    FileText,
    Users,
    ChevronRight,
} from "lucide-react";
import { getSemesterLabel } from "@/Utils/Teacher/Dashboard";
import {
    PriorityStudentsReportModal,
    ShowTutorialModal,
    UploadGradesModal,
    StartInterventionModal,
} from "@/Components/Teacher/Dashboard";
import UnifiedDashboardSwitcher from "@/Components/UnifiedDashboardSwitcher";

const getAttentionStatusClasses = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "high") {
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    }

    if (normalized === "medium") {
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    }

    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
};

const getAttentionStatusLabel = (status) => {
    const normalized = String(status || "low").toLowerCase();
    if (normalized === "high") return "High";
    if (normalized === "medium") return "Medium";
    return "Low";
};

const getAttentionRowAccentClasses = (status) => {
    const normalized = String(status || "low").toLowerCase();
    if (normalized === "high") return "bg-red-500";
    if (normalized === "medium") return "bg-amber-500";
    return "bg-blue-500";
};

const getAttentionRowHoverClasses = (status) => {
    const normalized = String(status || "low").toLowerCase();

    if (normalized === "high") {
        return "hover:bg-gradient-to-r hover:from-red-50 hover:via-rose-50 hover:to-orange-50 dark:hover:from-red-900/25 dark:hover:via-rose-900/20 dark:hover:to-orange-900/20 hover:ring-1 hover:ring-red-200/70 dark:hover:ring-red-700/40";
    }

    if (normalized === "medium") {
        return "hover:bg-gradient-to-r hover:from-amber-50 hover:via-orange-50 hover:to-yellow-50 dark:hover:from-amber-900/25 dark:hover:via-orange-900/20 dark:hover:to-yellow-900/20 hover:ring-1 hover:ring-amber-200/70 dark:hover:ring-amber-700/40";
    }

    return "hover:bg-gradient-to-r hover:from-sky-50 hover:via-blue-50 hover:to-cyan-50 dark:hover:from-sky-900/25 dark:hover:via-blue-900/20 dark:hover:to-cyan-900/20 hover:ring-1 hover:ring-sky-200/70 dark:hover:ring-sky-700/40";
};

const Dashboard = ({
    auth,
    stats,
    priorityStudents,
    recentActivity,
    academicPeriod,
    department,
    allSubjects,
    attentionStudents = [],
    watchlistRuleConfig = {},
    watchlistObservedCategories = {},
}) => {
    const [showTutorial, setShowTutorial] = useState(false);
    const [studentFilter, setStudentFilter] = useState("all");
    const [showReportModal, setShowReportModal] = useState(false);
    const [showUploadGradesModal, setShowUploadGradesModal] = useState(false);
    const [showInterventionModal, setShowInterventionModal] = useState(false);

    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    const observeAtRisk =
        watchlistObservedCategories?.at_risk !== undefined
            ? Boolean(watchlistObservedCategories.at_risk)
            : true;
    const observeNeedsAttention =
        watchlistObservedCategories?.needs_attention !== undefined
            ? Boolean(watchlistObservedCategories.needs_attention)
            : true;
    const observeRecentDecline =
        watchlistObservedCategories?.recent_decline !== undefined
            ? Boolean(watchlistObservedCategories.recent_decline)
            : true;

    const passingGrade = Number(watchlistRuleConfig?.passing_grade ?? 75);
    const atRiskAbsenceThreshold = Number(
        watchlistRuleConfig?.high_risk?.absence_threshold ?? 5,
    );
    const needsAttentionAbsenceThreshold = Number(
        watchlistRuleConfig?.needs_attention?.absence_threshold ?? 3,
    );
    const needsAttentionFailingActivitiesThreshold = Number(
        watchlistRuleConfig?.needs_attention?.failing_activities_threshold ?? 3,
    );
    const recentDeclineMinimumDropPercent = Number(
        watchlistRuleConfig?.recent_decline?.minimum_drop_percent ?? 20,
    );
    const recentDeclineRequiresFailingFinalQuarter = Boolean(
        watchlistRuleConfig?.recent_decline?.require_final_quarter_failing ??
        true,
    );

    const statCards = [
        {
            title: "At Risk",
            value: stats?.studentsAtRisk || 0,
            icon: AlertTriangle,
            iconBgColor: "bg-red-500",
            label: observeAtRisk
                ? `grade < ${passingGrade}% or absences >= ${atRiskAbsenceThreshold}`
                : "hidden in Class Settings",
            gradient: "from-red-500 to-red-600",
        },
        {
            title: "Needs Attention",
            value: stats?.needsAttention || 0,
            icon: ClipboardList,
            iconBgColor: "bg-amber-500",
            label: observeNeedsAttention
                ? `absences > ${needsAttentionAbsenceThreshold} or failing activities > ${needsAttentionFailingActivitiesThreshold}`
                : "hidden in Class Settings",
            gradient: "from-amber-500 to-amber-600",
        },
        {
            title: "Recent Declines",
            value: stats?.recentDeclines || 0,
            icon: TrendingDown,
            iconBgColor: "bg-blue-500",
            label: observeRecentDecline
                ? recentDeclineRequiresFailingFinalQuarter
                    ? `decline >= ${recentDeclineMinimumDropPercent}% and final quarter failing`
                    : `decline >= ${recentDeclineMinimumDropPercent}% from midterm`
                : "hidden in Class Settings",
            gradient: "from-blue-500 to-blue-600",
        },
    ];

    const attentionList = useMemo(
        () => (Array.isArray(attentionStudents) ? attentionStudents : []),
        [attentionStudents],
    );

    // Filter students based on selected filter
    const filteredStudents = useMemo(() => {
        if (studentFilter === "all") return attentionList;
        if (studentFilter === "at_risk") {
            return attentionList.filter((student) => student.at_risk);
        }
        if (studentFilter === "needs_attention") {
            return attentionList.filter((student) => student.needs_attention);
        }
        if (studentFilter === "recent_decline") {
            return attentionList.filter((student) => student.recent_decline);
        }

        return attentionList;
    }, [attentionList, studentFilter]);

    // Filter tabs configuration
    const filterTabs = [
        {
            id: "all",
            label: "All",
            count: attentionList.length,
            color: "gray",
        },
        {
            id: "at_risk",
            label: "At Risks",
            count: attentionList.filter((student) => student.at_risk).length,
            color: "red",
        },
        {
            id: "needs_attention",
            label: "Needs Attention",
            count: attentionList.filter((student) => student.needs_attention)
                .length,
            color: "amber",
        },
        {
            id: "recent_decline",
            label: "Recent Declines",
            count: attentionList.filter((student) => student.recent_decline)
                .length,
            color: "blue",
        },
    ];

    // Quick actions configuration
    const quickActions = [
        {
            label: "Upload Grades",
            icon: Upload,
            onClick: () => setShowUploadGradesModal(true),
            color: "from-indigo-500 to-indigo-600",
        },
        {
            label: "View Classes",
            icon: Users,
            href: route("teacher.classes.index"),
            color: "from-emerald-500 to-emerald-600",
        },
        {
            label: "New Intervention",
            icon: FileText,
            onClick: () => setShowInterventionModal(true),
            color: "from-violet-500 to-violet-600",
        },
    ];

    const openInterventionDetails = (enrollmentId) => {
        if (!enrollmentId) return;

        router.get(
            route("teacher.interventions.index", { student: enrollmentId }),
        );
    };

    return (
        <>
            <Head title="Teacher Dashboard" />

            <div className="space-y-5">
                <UnifiedDashboardSwitcher />

                {/* 1. Compact Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Welcome back, {auth.user.first_name}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {currentDate}
                        </p>
                    </div>

                    {/* Compact Info Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        {academicPeriod && (
                            <>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                    <Calendar
                                        size={14}
                                        className="text-indigo-600 dark:text-indigo-400"
                                    />
                                    <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                                        {academicPeriod.schoolYear}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <BookOpen
                                        size={14}
                                        className="text-emerald-600 dark:text-emerald-400"
                                    />
                                    <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                                        {getSemesterLabel(
                                            academicPeriod.semester,
                                        )}
                                    </span>
                                </div>
                            </>
                        )}
                        {department && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/30 rounded-lg border border-violet-100 dark:border-violet-800">
                                <Building2
                                    size={14}
                                    className="text-violet-600 dark:text-violet-400"
                                />
                                <span className="text-xs font-semibold text-violet-900 dark:text-violet-200">
                                    {department.name}
                                </span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <button
                            onClick={() => setShowTutorial(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-xs font-medium"
                        >
                            <HelpCircle size={14} />
                            Tutorial
                        </button>
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-xs font-medium"
                        >
                            <Printer size={14} />
                            Print
                        </button>
                    </div>
                </div>

                {/* 2. Compact Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.title}
                                className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
                            >
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                {stat.title}
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                                {stat.value}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {stat.label}
                                            </p>
                                        </div>
                                        <div
                                            className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
                                        >
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                                {/* Subtle gradient overlay */}
                                <div
                                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* 3. Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                    {/* 3a. Priority Students (3 columns) */}
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            {/* Compact Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-gradient-to-br from-red-500 to-amber-500 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                                Students Needing Attention
                                            </h2>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {attentionList.length} student
                                                {attentionList.length !== 1
                                                    ? "s"
                                                    : ""}{" "}
                                                requiring intervention
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Compact Filter Tabs */}
                                <div className="flex flex-wrap gap-1.5">
                                    {filterTabs.map((tab) => {
                                        const isActive =
                                            studentFilter === tab.id;
                                        const colorClasses = {
                                            gray: isActive
                                                ? "bg-gray-600 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300",
                                            red: isActive
                                                ? "bg-red-600 text-white"
                                                : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
                                            amber: isActive
                                                ? "bg-amber-500 text-white"
                                                : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
                                            blue: isActive
                                                ? "bg-blue-600 text-white"
                                                : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
                                        };

                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() =>
                                                    setStudentFilter(tab.id)
                                                }
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                    colorClasses[tab.color]
                                                }`}
                                            >
                                                {tab.label}
                                                <span
                                                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                        isActive
                                                            ? "bg-white/20"
                                                            : "bg-gray-200 dark:bg-gray-600"
                                                    }`}
                                                >
                                                    {tab.count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Student List - Flat Table */}
                            <div className="max-h-[500px] overflow-y-auto">
                                {filteredStudents.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/40">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                        STUDENT_NAME
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                        SECTION
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                        SUBJECT
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                        STATUS
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                        REASON
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {filteredStudents.map(
                                                    (student, index) => {
                                                        const canOpenIntervention =
                                                            Boolean(
                                                                student.enrollment_id,
                                                            );

                                                        return (
                                                            <tr
                                                                key={`${student.enrollment_id}-${index}`}
                                                                role={
                                                                    canOpenIntervention
                                                                        ? "link"
                                                                        : undefined
                                                                }
                                                                tabIndex={
                                                                    canOpenIntervention
                                                                        ? 0
                                                                        : -1
                                                                }
                                                                onClick={() =>
                                                                    openInterventionDetails(
                                                                        student.enrollment_id,
                                                                    )
                                                                }
                                                                onKeyDown={(
                                                                    event,
                                                                ) => {
                                                                    if (
                                                                        !canOpenIntervention
                                                                    ) {
                                                                        return;
                                                                    }

                                                                    if (
                                                                        event.key ===
                                                                            "Enter" ||
                                                                        event.key ===
                                                                            " "
                                                                    ) {
                                                                        event.preventDefault();
                                                                        openInterventionDetails(
                                                                            student.enrollment_id,
                                                                        );
                                                                    }
                                                                }}
                                                                className={`group transition-all duration-300 ${
                                                                    canOpenIntervention
                                                                        ? `cursor-pointer bg-white dark:bg-gray-800 hover:-translate-y-[1px] hover:shadow-lg ${getAttentionRowHoverClasses(
                                                                              student.status,
                                                                          )} focus:outline-none focus:ring-2 focus:ring-indigo-300`
                                                                        : "bg-white dark:bg-gray-800"
                                                                }`}
                                                            >
                                                                <td className="relative px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                                    <span
                                                                        className={`absolute inset-y-2 left-0 w-1 rounded-r-full transition-all duration-300 group-hover:w-1.5 ${getAttentionRowAccentClasses(
                                                                            student.status,
                                                                        )}`}
                                                                    />
                                                                    <div className="pl-2">
                                                                        <p className="font-semibold transition-colors group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                                                                            {
                                                                                student.student_name
                                                                            }
                                                                        </p>
                                                                        <p className="text-[11px] text-gray-500 transition-colors group-hover:text-indigo-600/80 dark:text-gray-400 dark:group-hover:text-indigo-300/80">
                                                                            Open
                                                                            intervention
                                                                            details
                                                                        </p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                                    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-200">
                                                                        {student.section ||
                                                                            "N/A"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                                    <span className="inline-flex rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                                                                        {student.subject ||
                                                                            "N/A"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                                    <span
                                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getAttentionStatusClasses(
                                                                            student.status,
                                                                        )}`}
                                                                    >
                                                                        {getAttentionStatusLabel(
                                                                            student.status,
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <span className="leading-5">
                                                                            {student.reason ||
                                                                                "N/A"}
                                                                        </span>
                                                                        {canOpenIntervention && (
                                                                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500 dark:text-gray-500" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                            {studentFilter === "all"
                                                ? "No Students Needing Attention"
                                                : `No ${
                                                      filterTabs.find(
                                                          (t) =>
                                                              t.id ===
                                                              studentFilter,
                                                      )?.label
                                                  } Students`}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {studentFilter === "all"
                                                ? "No students currently match the alert conditions."
                                                : "No students in this category."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3b. Sidebar (1 column) */}
                    <div className="space-y-5">
                        {/* Quick Actions - Compact */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                    Quick Actions
                                </h3>
                            </div>
                            <div className="p-3 space-y-2">
                                {quickActions.map((action, index) => {
                                    const Icon = action.icon;
                                    if (action.href) {
                                        return (
                                            <Link
                                                key={index}
                                                href={action.href}
                                                className={`w-full flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r ${action.color} text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-xs font-medium`}
                                            >
                                                <Icon size={14} />
                                                {action.label}
                                            </Link>
                                        );
                                    }
                                    return (
                                        <button
                                            key={index}
                                            onClick={action.onClick}
                                            className={`w-full flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r ${action.color} text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-xs font-medium`}
                                        >
                                            <Icon size={14} />
                                            {action.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Activity - Compact */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                    Recent Activity
                                </h3>
                            </div>
                            <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto">
                                {recentActivity && recentActivity.length > 0 ? (
                                    recentActivity.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <div className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                                <ClipboardList className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-700 dark:text-gray-300">
                                                    Intervention for{" "}
                                                    <span className="font-semibold">
                                                        {
                                                            item.enrollment.user
                                                                .first_name
                                                        }{" "}
                                                        {
                                                            item.enrollment.user
                                                                .last_name
                                                        }
                                                    </span>
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {new Date(
                                                        item.created_at,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                                        No recent activity
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showTutorial && (
                <ShowTutorialModal
                    closeTutorial={() => setShowTutorial(false)}
                />
            )}

            <PriorityStudentsReportModal
                show={showReportModal}
                onClose={() => setShowReportModal(false)}
                attentionStudents={attentionStudents}
                academicPeriod={academicPeriod}
                department={department}
                watchlistRuleConfig={watchlistRuleConfig}
                watchlistObservedCategories={watchlistObservedCategories}
            />

            <UploadGradesModal
                show={showUploadGradesModal}
                onClose={() => setShowUploadGradesModal(false)}
                allSubjects={allSubjects}
            />

            <StartInterventionModal
                show={showInterventionModal}
                onClose={() => setShowInterventionModal(false)}
                attentionStudents={attentionStudents}
            />
        </>
    );
};

Dashboard.layout = (page) => <SchoolStaffLayout children={page} />;

export default Dashboard;

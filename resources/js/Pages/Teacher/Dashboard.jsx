import React, { useState, useMemo } from "react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import { Head, Link } from "@inertiajs/react";
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
} from "lucide-react";
import { getSemesterLabel } from "@/Utils/Teacher/Dashboard";
import {
    PriorityStudentsReportModal,
    ShowTutorialModal,
    UploadGradesModal,
    StartInterventionModal,
} from "@/Components/Teacher/Dashboard";
import UnifiedDashboardSwitcher from "@/Components/UnifiedDashboardSwitcher";

const Dashboard = ({
    auth,
    stats,
    priorityStudents,
    recentActivity,
    academicPeriod,
    department,
    allSubjects,
    attentionStudents = [],
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

    const statCards = [
        {
            title: "At Risk",
            value: stats?.studentsAtRisk || 0,
            icon: AlertTriangle,
            iconBgColor: "bg-red-500",
            label: "students that are below 75",
            gradient: "from-red-500 to-red-600",
        },
        {
            title: "Needs Attention",
            value: stats?.needsAttention || 0,
            icon: ClipboardList,
            iconBgColor: "bg-amber-500",
            label: "students absent more than 5",
            gradient: "from-amber-500 to-amber-600",
        },
        {
            title: "Recent Declines",
            value: stats?.recentDeclines || 0,
            icon: TrendingDown,
            iconBgColor: "bg-blue-500",
            label: ">75 down to 75 or below",
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
                                                        Student Name
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                        Section
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                        Subject
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                        Grade
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                        Absences
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {filteredStudents.map(
                                                    (student, index) => (
                                                        <tr
                                                            key={`${student.enrollment_id}-${index}`}
                                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                                        >
                                                            <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white">
                                                                {
                                                                    student.student_name
                                                                }
                                                            </td>
                                                            <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300">
                                                                {student.section ||
                                                                    "N/A"}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300">
                                                                {student.subject ||
                                                                    "N/A"}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300">
                                                                {student.grade ??
                                                                    "N/A"}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300">
                                                                {student.absences ??
                                                                    0}
                                                            </td>
                                                        </tr>
                                                    ),
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

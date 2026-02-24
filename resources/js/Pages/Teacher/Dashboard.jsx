import React, { useState, useMemo } from "react";
import TeacherLayout from "@/Layouts/TeacherLayout";
import { Head, Link } from "@inertiajs/react";
import {
    AlertTriangle,
    ClipboardList,
    TrendingDown,
    CheckCircle2,
    Calendar,
    BookOpen,
    Building2,
    HelpCircle,
    Eye,
    Printer,
} from "lucide-react";

import {
    StudentRiskCard,
    StatCard,
    ActivityFeedItem,
    PriorityStudentsReportModal,
    PrimaryButton,
    ShowTutorialModal,
} from "@/Components/Teacher/Dashboard";

const Dashboard = ({
    auth,
    stats,
    priorityStudents,
    recentActivity,
    academicPeriod,
    department,
}) => {
    const [showTutorial, setShowTutorial] = useState(false);
    const [studentFilter, setStudentFilter] = useState("all");
    const [showReportModal, setShowReportModal] = useState(false);

    console.log("Academic Period:", academicPeriod);
    console.log("Department:", department);
    console.log("Priority Students:", priorityStudents);
    console.log("Stats:", stats);
    console.log("Recent Activity:", recentActivity);
    console.log("Auth User:", auth.user);

    const closeTutorial = () => {
        setShowTutorial(false);
    };

    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    const getSemesterLabel = (semester) => {
        switch (semester) {
            case 1:
                return "1st Semester";
            case 2:
                return "2nd Semester";
            default:
                return `Semester ${semester}`;
        }
    };

    const statCards = [
        {
            title: "Students at Risk",
            value: stats.studentsAtRisk,
            icon: AlertTriangle,
            iconBgColor: "bg-red-500",
            label: "grade < 75",
        },
        {
            title: "Needs Attention",
            value: stats.needsAttention,
            icon: ClipboardList,
            iconBgColor: "bg-yellow-500",
            label: "missing work",
        },
        {
            title: "Recent Declines",
            value: stats.recentDeclines,
            icon: TrendingDown,
            iconBgColor: "bg-blue-500",
            label: "dropped 10+",
        },
    ];

    // Combine all students with their risk level for unified display
    const allStudentsWithRisk = useMemo(() => {
        const students = [];

        // Add critical students (red)
        priorityStudents.critical.forEach((student) => {
            students.push({ ...student, riskLevel: "critical" });
        });

        // Add warning students (yellow/orange)
        priorityStudents.warning.forEach((student) => {
            students.push({ ...student, riskLevel: "warning" });
        });

        // Add watchlist students (blue)
        priorityStudents.watchList.forEach((student) => {
            students.push({ ...student, riskLevel: "watchlist" });
        });

        return students;
    }, [priorityStudents]);

    // Filter students based on selected filter
    const filteredStudents = useMemo(() => {
        if (studentFilter === "all") return allStudentsWithRisk;
        return allStudentsWithRisk.filter(
            (student) => student.riskLevel === studentFilter,
        );
    }, [allStudentsWithRisk, studentFilter]);

    // Filter tabs configuration
    const filterTabs = [
        {
            id: "all",
            label: "All Students",
            count: allStudentsWithRisk.length,
            color: "gray",
        },
        {
            id: "critical",
            label: "Critical",
            count: priorityStudents.critical.length,
            color: "red",
        },
        {
            id: "warning",
            label: "Warning",
            count: priorityStudents.warning.length,
            color: "amber",
        },
        {
            id: "watchlist",
            label: "Watchlist",
            count: priorityStudents.watchList.length,
            color: "blue",
        },
    ];

    // Risk level styling
    const getRiskLevelBadge = (riskLevel) => {
        const styles = {
            critical: {
                bg: "bg-red-100 dark:bg-red-900/30",
                text: "text-red-700 dark:text-red-400",
                border: "border-red-200 dark:border-red-800",
                label: "Critical",
                icon: AlertTriangle,
            },
            warning: {
                bg: "bg-amber-100 dark:bg-amber-900/30",
                text: "text-amber-700 dark:text-amber-400",
                border: "border-amber-200 dark:border-amber-800",
                label: "Warning",
                icon: TrendingDown,
            },
            watchlist: {
                bg: "bg-blue-100 dark:bg-blue-900/30",
                text: "text-blue-700 dark:text-blue-400",
                border: "border-blue-200 dark:border-blue-800",
                label: "Watchlist",
                icon: Eye,
            },
        };
        return styles[riskLevel] || styles.watchlist;
    };

    // Full Name of the teacher
    const fullname = auth.user.first_name + " " + auth.user.last_name;
    return (
        <TeacherLayout>
            <Head title="Teacher Dashboard" />

            {/* 1. Header */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Welcome Back, {fullname}!
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Here's your overview for {currentDate}.
                        </p>
                    </div>

                    {/* Academic Period & Department Info */}
                    <div className="flex flex-wrap items-center gap-3">
                        {academicPeriod && (
                            <>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                    <Calendar
                                        size={18}
                                        className="text-indigo-600 dark:text-indigo-400"
                                    />
                                    <div>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                            School Year
                                        </p>
                                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                                            {academicPeriod.schoolYear}
                                        </p>
                                    </div>
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                    <BookOpen
                                        size={18}
                                        className="text-emerald-600 dark:text-emerald-400"
                                    />
                                    <div>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                            Semester
                                        </p>
                                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                                            {getSemesterLabel(
                                                academicPeriod.semester,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                        {department && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/30 rounded-xl border border-violet-100 dark:border-violet-800">
                                <Building2
                                    size={18}
                                    className="text-violet-600 dark:text-violet-400"
                                />
                                <div>
                                    <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                                        Department
                                    </p>
                                    <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                                        {department.name}
                                    </p>
                                </div>
                            </div>
                        )}
                        {/* Tutorial Button */}
                        <button
                            onClick={() => setShowTutorial(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 font-medium text-sm"
                        >
                            <HelpCircle size={18} />
                            How to Create a Class
                        </button>
                        {/* Print Report Button */}
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 font-medium text-sm"
                        >
                            <Printer size={18} />
                            Print Report
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <StatCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        iconBgColor={stat.iconBgColor}
                        label={stat.label}
                    />
                ))}
            </div>

            {/* 3. Main Content (2-col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* 3a. Left Column (Priority Students - Unified) */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                        {/* Header with Filter Tabs */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-red-500 to-amber-500 rounded-lg">
                                        <AlertTriangle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            Students Needing Attention
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {allStudentsWithRisk.length} student
                                            {allStudentsWithRisk.length !== 1
                                                ? "s"
                                                : ""}{" "}
                                            requiring intervention
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {filterTabs.map((tab) => {
                                    const isActive = studentFilter === tab.id;
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
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                colorClasses[tab.color]
                                            }`}
                                        >
                                            {tab.label}
                                            <span
                                                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
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

                        {/* Student List */}
                        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student, index) => {
                                    const riskStyle = getRiskLevelBadge(
                                        student.riskLevel,
                                    );
                                    const RiskIcon = riskStyle.icon;

                                    return (
                                        <div
                                            key={`${student.id}-${student.riskLevel}-${index}`}
                                            className={`relative p-4 rounded-xl border ${riskStyle.border} ${riskStyle.bg} transition-all hover:shadow-md`}
                                        >
                                            {/* Risk Level Badge */}
                                            <div
                                                className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${riskStyle.bg} ${riskStyle.text} border ${riskStyle.border}`}
                                            >
                                                <RiskIcon className="w-3.5 h-3.5" />
                                                {riskStyle.label}
                                            </div>

                                            <StudentRiskCard
                                                student={student}
                                            />
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        {studentFilter === "all"
                                            ? "All Students are Performing Well!"
                                            : `No ${
                                                  filterTabs.find(
                                                      (t) =>
                                                          t.id ===
                                                          studentFilter,
                                                  )?.label
                                              } Students`}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {studentFilter === "all"
                                            ? "Great job! None of your students currently need intervention."
                                            : "There are no students in this category at the moment."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3b. Right Column (Quick Actions, Activity) */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                            Quick Actions
                        </h2>
                        <div className="bg-white rounded-xl shadow-lg p-6 space-y-3">
                            <PrimaryButton className="w-full justify-center">
                                📤 Upload Grades
                            </PrimaryButton>
                            <Link
                                href={route("teacher.classes.index")}
                                className="w-full inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                📊 View Full Class List
                            </Link>
                            <Link
                                href={route("teacher.interventions.index")}
                                className="w-full inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                📝 Create Intervention
                            </Link>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                            Recent Activity
                        </h2>
                        <div className="bg-white rounded-xl shadow-lg p-6 space-y-5">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((item) => (
                                    <ActivityFeedItem
                                        key={item.id}
                                        icon={ClipboardList}
                                        text={`Intervention for <strong>${item.enrollment.user.name}</strong> was created.`}
                                        time={new Date(
                                            item.created_at,
                                        ).toLocaleDateString()}
                                        iconBgColor="bg-yellow-500"
                                    />
                                ))
                            ) : (
                                <p className="text-gray-500">
                                    No recent activity.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tutorial Modal */}
            {showTutorial && (
                <ShowTutorialModal closeTutorial={closeTutorial} />
            )}

            {/* Priority Students Report Modal */}
            <PriorityStudentsReportModal
                show={showReportModal}
                onClose={() => setShowReportModal(false)}
                priorityStudents={priorityStudents}
                academicPeriod={academicPeriod}
                department={department}
            />
        </TeacherLayout>
    );
};
export default Dashboard;

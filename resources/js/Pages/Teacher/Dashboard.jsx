import React, { useState, useMemo } from "react";
import TeacherLayout from "@/Layouts/TeacherLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Users,
    AlertTriangle,
    ClipboardList,
    TrendingDown,
    FileUp,
    CheckCircle2,
    BarChart,
    Calendar,
    BookOpen,
    Building2,
    HelpCircle,
    X,
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    Upload,
    UserPlus,
    FileSpreadsheet,
    Sparkles,
    Filter,
    Eye,
    FileDown,
    Printer,
} from "lucide-react";

import StudentRiskCard from "@/Components/StudentRiskCard";
import StatCard from "@/Components/StatCard";
import ActivityFeedItem from "@/Components/ActivityFeedItem";
import GradeUploader from "@/Components/GradeUploader";
import PrimaryButton from "@/Components/PrimaryButton";
import PriorityStudentsReportModal from "@/Components/PriorityStudentsReportModal";

// --- Main Dashboard Page Component ---
export default function Dashboard({
    auth,
    stats,
    priorityStudents,
    recentActivity,
    academicPeriod,
    department,
}) {
    const [showTutorial, setShowTutorial] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [studentFilter, setStudentFilter] = useState("all");
    const [showReportModal, setShowReportModal] = useState(false);

    const tutorialSteps = [
        {
            title: "Welcome to Class Creation",
            description:
                "This tutorial will guide you through the process of creating and managing your class in SATIS. Follow these steps to get started!",
            icon: Sparkles,
            iconBg: "bg-indigo-500",
            tips: [
                "Make sure you have your class list ready",
                "You'll need student information (names, IDs)",
                "Have your subject details handy",
            ],
        },
        {
            title: "Step 1: Navigate to My Classes",
            description:
                "Click on 'My Classes' in the navigation menu at the top of the page. This will take you to your class management dashboard.",
            icon: BookOpen,
            iconBg: "bg-blue-500",
            tips: [
                "Look for the book icon in the navigation bar",
                "You can also click 'View Full Class List' in Quick Actions",
                "Your existing classes will be displayed here",
            ],
        },
        {
            title: "Step 2: Create a New Class",
            description:
                "Click the 'Create Class' or 'Add Class' button to start setting up your new class. You'll be prompted to enter the class details.",
            icon: UserPlus,
            iconBg: "bg-emerald-500",
            tips: [
                "Select your subject from the dropdown",
                "Choose the correct section/block",
                "Set the schedule if required",
            ],
        },
        {
            title: "Step 3: Add Students",
            description:
                "Once your class is created, you can add students either manually one by one, or by uploading a CSV/Excel file with student information.",
            icon: Users,
            iconBg: "bg-violet-500",
            tips: [
                "Use bulk upload for large classes",
                "Ensure student IDs are correct",
                "Verify student names match official records",
            ],
        },
        {
            title: "Step 4: Upload Grades",
            description:
                "After adding students, you can start uploading grades. Use the grade upload feature to import grades from a spreadsheet or enter them manually.",
            icon: Upload,
            iconBg: "bg-amber-500",
            tips: [
                "Download the grade template first",
                "Fill in scores for each assessment",
                "Double-check before submitting",
            ],
        },
        {
            title: "Step 5: Monitor & Track",
            description:
                "Your dashboard will automatically update with student analytics. Monitor at-risk students, track grade distributions, and create interventions as needed.",
            icon: BarChart,
            iconBg: "bg-rose-500",
            tips: [
                "Check your dashboard regularly",
                "Create interventions for struggling students",
                "Track attendance patterns",
            ],
        },
        {
            title: "You're All Set!",
            description:
                "Congratulations! You now know how to create and manage your class in SATIS. Remember, you can always access this tutorial by clicking the help button.",
            icon: CheckCircle,
            iconBg: "bg-green-500",
            tips: [
                "Explore the Interventions feature",
                "Use the Attendance tracker",
                "Contact support if you need help",
            ],
        },
    ];

    const nextStep = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const closeTutorial = () => {
        setShowTutorial(false);
        setCurrentStep(0);
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
        // {
        //     title: "Average Grade",
        //     value: `${stats.averageGrade}%`,
        //     icon: Users,
        //     iconBgColor: "bg-indigo-500",
        //     label: "class avg",
        // },
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

    return (
        <TeacherLayout>
            <Head title="Teacher Dashboard" />

            {/* 1. Header */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Welcome Back, {auth.user.name}!
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
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                        onClick={closeTutorial}
                    />

                    {/* Modal */}
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-2xl transform rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                            {/* Progress Bar */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-2xl overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                                    style={{
                                        width: `${
                                            ((currentStep + 1) /
                                                tutorialSteps.length) *
                                            100
                                        }%`,
                                    }}
                                />
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={closeTutorial}
                                className="absolute top-4 right-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                            >
                                <X size={20} />
                            </button>

                            {/* Step Counter */}
                            <div className="absolute top-4 left-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                                Step {currentStep + 1} of {tutorialSteps.length}
                            </div>

                            {/* Content */}
                            <div className="pt-14 pb-6 px-6">
                                {/* Icon */}
                                <div className="flex justify-center mb-6">
                                    <div
                                        className={`h-20 w-20 rounded-2xl ${tutorialSteps[currentStep].iconBg} flex items-center justify-center shadow-lg`}
                                    >
                                        {React.createElement(
                                            tutorialSteps[currentStep].icon,
                                            {
                                                size: 40,
                                                className: "text-white",
                                            },
                                        )}
                                    </div>
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
                                    {tutorialSteps[currentStep].title}
                                </h2>

                                {/* Description */}
                                <p className="text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
                                    {tutorialSteps[currentStep].description}
                                </p>

                                {/* Tips */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                        <Sparkles
                                            size={16}
                                            className="text-amber-500"
                                        />
                                        Tips
                                    </h3>
                                    <ul className="space-y-2">
                                        {tutorialSteps[currentStep].tips.map(
                                            (tip, index) => (
                                                <li
                                                    key={index}
                                                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                                                >
                                                    <CheckCircle
                                                        size={16}
                                                        className="text-green-500 mt-0.5 flex-shrink-0"
                                                    />
                                                    {tip}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>

                                {/* Step Indicators */}
                                <div className="flex justify-center gap-2 mb-6">
                                    {tutorialSteps.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                setCurrentStep(index)
                                            }
                                            className={`h-2 rounded-full transition-all ${
                                                index === currentStep
                                                    ? "w-8 bg-indigo-500"
                                                    : index < currentStep
                                                      ? "w-2 bg-indigo-300"
                                                      : "w-2 bg-gray-300 dark:bg-gray-600"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                                <button
                                    onClick={prevStep}
                                    disabled={currentStep === 0}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                        currentStep === 0
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    <ChevronLeft size={18} />
                                    Previous
                                </button>

                                {currentStep === tutorialSteps.length - 1 ? (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={closeTutorial}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <CheckCircle size={18} />
                                            Got it!
                                        </button>
                                        <Link
                                            href={
                                                route("teacher.classes.index") +
                                                "?highlight=addclass"
                                            }
                                            className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                                        >
                                            <BookOpen size={18} />
                                            Go to My Classes
                                        </Link>
                                    </div>
                                ) : (
                                    <button
                                        onClick={nextStep}
                                        className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                                    >
                                        Next
                                        <ChevronRight size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
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
}

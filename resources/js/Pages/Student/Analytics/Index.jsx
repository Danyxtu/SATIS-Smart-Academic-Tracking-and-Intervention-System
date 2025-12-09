import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Award,
    BookOpen,
    Target,
    RefreshCw,
    CheckCircle2,
} from "lucide-react";
import SemesterNavigation from "@/Components/SemesterNavigation";

// --- Helper function for color-coding ---
const getGradeStyles = (grade) => {
    if (grade === null)
        return {
            color: "text-gray-400",
            bg: "bg-gray-300",
            label: "No grades yet",
        };
    if (grade >= 90)
        return {
            color: "text-green-600",
            bg: "bg-green-500",
            label: "Excellent",
        };
    if (grade >= 85)
        return {
            color: "text-blue-600",
            bg: "bg-blue-500",
            label: "Very Good",
        };
    if (grade >= 80)
        return { color: "text-blue-500", bg: "bg-blue-400", label: "Good" };
    if (grade >= 75)
        return {
            color: "text-yellow-600",
            bg: "bg-yellow-500",
            label: "Satisfactory",
        };
    return {
        color: "text-red-600",
        bg: "bg-red-500",
        label: "Needs Improvement",
    };
};

// --- Stat Card Component ---
const StatCard = ({ label, value, icon: Icon, color, bgColor }) => (
    <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center space-x-4 hover:shadow-xl transition-shadow">
        <div className={`p-3 rounded-full ${bgColor}`}>
            <Icon size={24} className={color} />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-sm font-medium text-gray-500">{label}</p>
        </div>
    </div>
);

// --- Empty State Component ---
const EmptyState = ({ title, message }) => (
    <div className="bg-white rounded-2xl shadow-lg p-12 text-center col-span-full">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen size={32} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-gray-500 max-w-md mx-auto">{message}</p>
    </div>
);

// --- Subject Grade Card Component ---
const SubjectGradeCard = ({
    subject,
    teacher,
    grade,
    status,
    hasIntervention,
    gradeCount,
}) => {
    const { color, bg, label } = getGradeStyles(grade);
    const gradeLabel =
        grade !== null
            ? gradeCount > 0
                ? "CURRENT GRADE"
                : "EXPECTED GRADE"
            : "NO GRADES YET";

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 transition-all hover:shadow-xl hover:scale-[1.02] relative overflow-hidden">
            {/* Status indicator */}
            {hasIntervention && (
                <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                        <Target size={12} />
                        Intervention
                    </span>
                </div>
            )}

            <h3 className="text-xl font-bold text-gray-800 pr-20">{subject}</h3>
            <p className="text-sm text-gray-500 mb-4">{teacher}</p>

            <p className="text-xs text-gray-500 uppercase tracking-wider">
                {gradeLabel}
            </p>
            <div className="flex items-end gap-2">
                <p className={`text-6xl font-bold ${color}`}>
                    {grade !== null ? grade : "—"}
                </p>
                {grade !== null && (
                    <span className={`text-sm font-medium ${color} mb-2`}>
                        {label}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                <div
                    className={`${bg} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: grade !== null ? `${grade}%` : "0%" }}
                />
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 mt-3">
                {status === "critical" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        <AlertTriangle size={12} />
                        At Risk
                    </span>
                )}
                {status === "warning" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        <TrendingDown size={12} />
                        Needs Attention
                    </span>
                )}
                {grade !== null && grade >= 90 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <Award size={12} />
                        Excelling
                    </span>
                )}
            </div>
        </div>
    );
};

// --- Main Page Component ---
const AnalyticsIndex = ({ subjects = [], stats = {}, semesters = {} }) => {
    const hasSubjects = subjects && subjects.length > 0;

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Performance Analytics" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <BarChart3 size={36} className="text-pink-600" />
                        Performance Analytics
                    </h1>
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>

                {/* Semester Navigation */}
                <SemesterNavigation
                    currentSemester={semesters.current || 1}
                    schoolYear={semesters.schoolYear || ""}
                    semester1Count={semesters.semester1Count || 0}
                    semester2Count={semesters.semester2Count || 0}
                />

                {/* Stats Summary */}
                {hasSubjects && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="Overall Grade"
                            value={
                                stats.overallGrade !== null
                                    ? `${stats.overallGrade}%`
                                    : "N/A"
                            }
                            icon={BarChart3}
                            color="text-pink-600"
                            bgColor="bg-pink-100"
                        />
                        <StatCard
                            label="Total Subjects"
                            value={stats.totalSubjects || 0}
                            icon={BookOpen}
                            color="text-blue-600"
                            bgColor="bg-blue-100"
                        />
                        <StatCard
                            label="Subjects Excelling"
                            value={stats.subjectsExcelling || 0}
                            icon={Award}
                            color="text-green-600"
                            bgColor="bg-green-100"
                        />
                        <StatCard
                            label="Subjects at Risk"
                            value={stats.subjectsAtRisk || 0}
                            icon={AlertTriangle}
                            color="text-red-600"
                            bgColor="bg-red-100"
                        />
                    </div>
                )}

                {/* Overall Performance Message */}
                {hasSubjects && stats.overallGrade !== null && (
                    <div
                        className={`rounded-2xl p-6 border ${
                            stats.overallGrade >= 85
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                                : stats.overallGrade >= 75
                                ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200"
                                : "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={`p-3 rounded-full ${
                                    stats.overallGrade >= 85
                                        ? "bg-green-100"
                                        : stats.overallGrade >= 75
                                        ? "bg-blue-100"
                                        : "bg-yellow-100"
                                }`}
                            >
                                {stats.overallGrade >= 85 ? (
                                    <CheckCircle2
                                        size={24}
                                        className="text-green-600"
                                    />
                                ) : stats.overallGrade >= 75 ? (
                                    <TrendingUp
                                        size={24}
                                        className="text-blue-600"
                                    />
                                ) : (
                                    <AlertTriangle
                                        size={24}
                                        className="text-yellow-600"
                                    />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">
                                    {stats.overallGrade >= 90
                                        ? "Outstanding Performance! 🌟"
                                        : stats.overallGrade >= 85
                                        ? "Great Job! Keep it up!"
                                        : stats.overallGrade >= 80
                                        ? "Good Progress!"
                                        : stats.overallGrade >= 75
                                        ? "You're on the right track"
                                        : "Let's work on improving together"}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    {stats.overallGrade >= 85
                                        ? "Your academic performance is excellent. Continue your great study habits!"
                                        : stats.overallGrade >= 75
                                        ? "You're doing well. Focus on the subjects that need attention to boost your overall grade."
                                        : "Click on subjects below to see detailed analytics and suggestions for improvement."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Grid of Subject Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hasSubjects ? (
                        subjects.map((item) => (
                            <Link
                                href={route("analytics.show", {
                                    enrollment: item.id,
                                })}
                                key={item.id}
                                className="focus:outline-none focus:ring-2 focus:ring-pink-400 rounded-2xl"
                            >
                                <SubjectGradeCard
                                    subject={item.subject}
                                    teacher={item.teacher}
                                    grade={item.grade}
                                    status={item.status}
                                    hasIntervention={item.hasIntervention}
                                    gradeCount={item.gradeCount}
                                />
                            </Link>
                        ))
                    ) : (
                        <EmptyState
                            title="No Subjects Found"
                            message="You're not enrolled in any subjects yet. Once you're enrolled, your performance analytics will appear here."
                        />
                    )}
                </div>

                {/* Help text */}
                {hasSubjects && (
                    <p className="text-center text-gray-500 text-sm">
                        Click on any subject card to view detailed analytics,
                        grade breakdown, and personalized study suggestions.
                    </p>
                )}
            </div>
        </AuthenticatedLayout>
    );
};

export default AnalyticsIndex;

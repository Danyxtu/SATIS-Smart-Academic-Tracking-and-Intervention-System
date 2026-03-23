import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Users, Calendar, ChevronRight, Check, X, Clock } from "lucide-react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";

const colorClasses = {
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    red: "bg-red-100 text-red-800 border-red-200",
    green: "bg-green-100 text-green-800 border-green-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    teal: "bg-teal-100 text-teal-800 border-teal-200",
};

const AttendanceLog = ({ sections = [] }) => {
    return (
        <>
            <Head title="Attendance Log" />

            <div className="space-y-4">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Link
                        href={route("teacher.attendance.index")}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                        Attendance
                    </Link>
                    <ChevronRight size={12} />
                    <span className="text-gray-700 dark:text-gray-300">
                        Log
                    </span>
                </nav>

                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Attendance Log
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        View detailed attendance records by class
                    </p>
                </div>

                {/* Sections Grid */}
                {sections.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                            No Attendance Records
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No classes with attendance records yet
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sections.map((section) => (
                            <Link
                                key={section.id}
                                href={route("teacher.attendance.log.show", {
                                    subjectTeacher: section.id,
                                })}
                                className="group"
                            >
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all overflow-hidden">
                                    {/* Header */}
                                    <div
                                        className={`px-4 py-3 border-b ${
                                            colorClasses[section.color] ||
                                            colorClasses.indigo
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold truncate">
                                                    {section.grade_level} -{" "}
                                                    {section.section}
                                                </h3>
                                                <p className="text-xs opacity-80 truncate">
                                                    {section.name}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="p-4">
                                        <div className="flex items-center gap-3 mb-3 text-xs">
                                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                <Users className="w-3.5 h-3.5" />
                                                <span className="font-medium">
                                                    {section.student_count}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="font-medium">
                                                    {section.total_days} days
                                                </span>
                                            </div>
                                        </div>

                                        {/* Attendance Stats */}
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                                                <Check size={12} />
                                                <span className="font-semibold">
                                                    {section.stats.present}
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1 text-red-700 dark:text-red-400">
                                                <X size={12} />
                                                <span className="font-semibold">
                                                    {section.stats.absent}
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                                                <Clock size={12} />
                                                <span className="font-semibold">
                                                    {section.stats.late}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

AttendanceLog.layout = (page) => <SuperAdminLayout children={page} />;

export default AttendanceLog;

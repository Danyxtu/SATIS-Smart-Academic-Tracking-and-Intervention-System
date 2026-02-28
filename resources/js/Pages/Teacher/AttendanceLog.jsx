import React from "react";
import TeacherLayout from "../../Layouts/TeacherLayout";
import { Head, Link } from "@inertiajs/react";
import { Users, Calendar, ChevronRight, Check, X, Clock } from "lucide-react";

// Color classes for sections
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
        <TeacherLayout>
            <Head title="Attendance Log" />

            {/* --- Breadcrumbs --- */}
            <nav className="mb-4 text-sm font-medium text-gray-500">
                <Link
                    href={route("teacher.attendance.index")}
                    className="text-indigo-600 hover:underline"
                >
                    Attendance
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-700">Log</span>
            </nav>

            {/* --- Page Header --- */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Attendance Log
                </h1>
                <p className="text-lg text-gray-600">
                    Select a section to view detailed attendance records.
                </p>
            </div>

            {/* --- Sections Grid --- */}
            {sections.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Sections Found
                    </h3>
                    <p className="text-gray-500">
                        You don't have any classes with attendance records yet.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((section) => (
                        <Link
                            key={section.id}
                            href={route("teacher.attendance.log.show", {
                                subjectTeacher: section.id,
                            })}
                            className="group"
                        >
                            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl hover:border-indigo-300 transition-all duration-200">
                                {/* Section Header */}
                                <div
                                    className={`px-6 py-4 border-b ${
                                        colorClasses[section.color] ||
                                        colorClasses.indigo
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold">
                                                {section.grade_level} -{" "}
                                                {section.section}
                                            </h3>
                                            <p className="text-sm opacity-80">
                                                {section.name}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>

                                {/* Section Stats */}
                                <div className="px-6 py-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Users className="w-4 h-4" />
                                            <span className="text-sm font-medium">
                                                {section.student_count} Students
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm font-medium">
                                                {section.total_days} Days
                                            </span>
                                        </div>
                                    </div>

                                    {/* Attendance Stats */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1.5 text-green-700">
                                            <Check size={14} />
                                            <span className="font-medium">
                                                {section.stats.present}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-1.5 text-red-700">
                                            <X size={14} />
                                            <span className="font-medium">
                                                {section.stats.absent}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-1.5 text-yellow-700">
                                            <Clock size={14} />
                                            <span className="font-medium">
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
        </TeacherLayout>
    );
};

export default AttendanceLog;

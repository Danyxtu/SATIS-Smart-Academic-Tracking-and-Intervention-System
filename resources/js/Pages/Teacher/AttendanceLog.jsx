import React from "react";
import TeacherLayout from "../../Layouts/TeacherLayout";
import { Head, Link } from "@inertiajs/react";
import { useLoading } from "@/Context/LoadingContext";
import { Check, XIcon, Clock } from "lucide-react";

// --- Mock Data for Attendance Log ---
const mockAttendanceLog = [
    {
        id: 1,
        dateTime: "2025-11-06T09:15:00Z",
        className: "Grade 12 - STEM (Physics)",
        stats: { present: 38, absent: 1, late: 1 },
    },
    {
        id: 2,
        dateTime: "2025-11-05T09:12:00Z",
        className: "Grade 12 - STEM (Physics)",
        stats: { present: 37, absent: 3, late: 0 },
    },
    {
        id: 3,
        dateTime: "2025-11-04T13:30:00Z",
        className: "Grade 10 - ABM (Economics)",
        stats: { present: 40, absent: 0, late: 0 },
    },
    {
        id: 4,
        dateTime: "2025-11-04T09:10:00Z",
        className: "Grade 12 - STEM (Physics)",
        stats: { present: 39, absent: 0, late: 1 },
    },
    {
        id: 5,
        dateTime: "2025-11-03T09:14:00Z",
        className: "Grade 12 - STEM (Physics)",
        stats: { present: 36, absent: 2, late: 2 },
    },
    {
        id: 6,
        dateTime: "2025-11-02T13:30:00Z",
        className: "Grade 10 - ABM (Economics)",
        stats: { present: 39, absent: 1, late: 0 },
    },
    {
        id: 7,
        dateTime: "2025-11-01T09:11:00Z",
        className: "Grade 12 - STEM (Physics)",
        stats: { present: 40, absent: 0, late: 0 },
    },
];

// --- Helper function to format DateTime ---
const formatLogDateTime = (isoString) => {
    const date = new Date(isoString);
    const options = {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    };
    return date.toLocaleString("en-US", options);
};

// --- The Attendance Log Page Component ---
const AttendanceLog = () => {
    return (
        <TeacherLayout>
            <Head title="Attendance Log" />

            {/* --- Breadcrumbs --- */}
            <nav className="mb-4 text-sm font-medium text-gray-500">
                <Link
                    href="/teacher/attendance" // Use the route to your main attendance page
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
                    A history of all submitted attendance records.
                </p>
            </div>

            {/* --- Log List --- */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {mockAttendanceLog.map((log) => (
                        <li key={log.id} className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                <div>
                                    <p className="text-lg font-semibold text-indigo-700">
                                        {log.className}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2 sm:mb-0">
                                        {formatLogDateTime(log.dateTime)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 text-sm sm:gap-6">
                                    <span className="flex items-center gap-1.5 text-green-700">
                                        <Check size={16} />
                                        <span className="font-medium">
                                            {log.stats.present}
                                        </span>
                                        <span className="text-gray-600">
                                            Present
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-red-700">
                                        <XIcon size={16} />
                                        <span className="font-medium">
                                            {log.stats.absent}
                                        </span>
                                        <span className="text-gray-600">
                                            Absent
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-yellow-700">
                                        <Clock size={16} />
                                        <span className="font-medium">
                                            {log.stats.late}
                                        </span>
                                        <span className="text-gray-600">
                                            Late
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </TeacherLayout>
    );
};

export default AttendanceLog;

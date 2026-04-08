import React from "react";
import StudentLayout from "@/Layouts/StudentLayout";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    BookOpen,
    UserCheck,
    CalendarCheck,
    CheckCircle2,
    XCircle,
    Clock,
    ShieldCheck,
    AlertCircle,
} from "lucide-react";

const SummaryStatCard = ({ label, value, icon: Icon, color, bgColor }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 flex items-center space-x-3 border border-transparent dark:border-gray-700">
        <div className={`p-2.5 rounded-full ${bgColor}`}>
            <Icon size={22} className={color} />
        </div>
        <div>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {value}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {label}
            </p>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const configByStatus = {
        Present: {
            icon: CheckCircle2,
            text: "text-green-700 dark:text-green-300",
            bg: "bg-green-100 dark:bg-green-900/30",
        },
        Absent: {
            icon: XCircle,
            text: "text-red-700 dark:text-red-300",
            bg: "bg-red-100 dark:bg-red-900/30",
        },
        Late: {
            icon: Clock,
            text: "text-yellow-700 dark:text-yellow-300",
            bg: "bg-yellow-100 dark:bg-yellow-900/30",
        },
        Excused: {
            icon: ShieldCheck,
            text: "text-blue-700 dark:text-blue-300",
            bg: "bg-blue-100 dark:bg-blue-900/30",
        },
    };

    const config = configByStatus[status] || configByStatus.Present;
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
        >
            <Icon size={14} />
            {status}
        </span>
    );
};

const AttendanceSummary = ({
    subject = {},
    hasStarted = false,
    summary = {},
    records = [],
}) => {
    const safeRecords = Array.isArray(records) ? records : [];
    const numericRate = Number(summary.rate);
    const attendanceRate = Number.isFinite(numericRate)
        ? `${numericRate}%`
        : "Not yet Started";

    const statCards = [
        {
            label: "Attendance Rate",
            value: attendanceRate,
            icon: CalendarCheck,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            label: "Present",
            value: String(summary.present ?? 0),
            icon: CheckCircle2,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            label: "Absent",
            value: String(summary.absent ?? 0),
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-100",
        },
        {
            label: "Late",
            value: String(summary.late ?? 0),
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
        },
        {
            label: "Excused",
            value: String(summary.excused ?? 0),
            icon: ShieldCheck,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            label: "Total Records",
            value: String(summary.total ?? 0),
            icon: UserCheck,
            color: "text-pink-600",
            bgColor: "bg-pink-100",
        },
    ];

    return (
        <>
            <Head title="Attendance Summary" />

            <div className="max-w-7xl mx-auto space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
                            <CalendarCheck
                                size={22}
                                className="text-pink-600"
                            />
                            Attendance Summary
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {subject.name || "Unknown Subject"}
                        </p>
                    </div>

                    <Link
                        href={`${route("attendance")}#attendance-subject-cards`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                        <ArrowLeft size={16} />
                        Back to Attendance
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-5 border border-transparent dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                                Subject
                            </p>
                            <p className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <BookOpen size={16} className="text-pink-600" />
                                {subject.name || "Unknown Subject"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                                Instructor
                            </p>
                            <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
                                {subject.instructor || "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                {!hasStarted ? (
                    <div className="bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-900/50 dark:to-slate-900/30 rounded-2xl p-8 border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="max-w-xl mx-auto text-center">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                <AlertCircle
                                    size={26}
                                    className="text-gray-500 dark:text-gray-400"
                                />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                Not yet Started
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                Attendance for this subject has not started yet.
                                Once your teacher records attendance, the
                                summary and history will appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {statCards.map((item) => (
                                <SummaryStatCard key={item.label} {...item} />
                            ))}
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-5 border border-transparent dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                Attendance Records
                            </h2>

                            {safeRecords.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No attendance records available yet.
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                                    {safeRecords.map((record) => (
                                        <div
                                            key={record.id}
                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-gray-100">
                                                    {record.date}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {record.recordedAt
                                                        ? `Recorded at ${record.recordedAt}`
                                                        : "Recorded"}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                status={record.status}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

AttendanceSummary.layout = (page) => <StudentLayout children={page} />;

export default AttendanceSummary;

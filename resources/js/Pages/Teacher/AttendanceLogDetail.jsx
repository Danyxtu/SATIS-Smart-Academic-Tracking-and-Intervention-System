import React, { useRef, useState, useMemo } from "react";
import TeacherLayout from "../../Layouts/TeacherLayout";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    Download,
    FileSpreadsheet,
    FileText,
    Check,
    X,
    Clock,
    Minus,
    Calendar,
    ToggleLeft,
    ToggleRight,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

// Status cell component
const StatusCell = ({ status }) => {
    switch (status) {
        case "present":
            return (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700">
                    <Check size={14} />
                </div>
            );
        case "absent":
            return (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700">
                    <X size={14} />
                </div>
            );
        case "late":
            return (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700">
                    <Clock size={14} />
                </div>
            );
        case "excused":
            return (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700">
                    <span className="text-xs font-bold">E</span>
                </div>
            );
        default:
            return (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400">
                    <Minus size={14} />
                </div>
            );
    }
};

// Format date for column header
const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    return { day, dayName };
};

// Get month name
const getMonthName = (year, month) => {
    return new Date(year, month).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
};

const AttendanceLogDetail = ({ section, dates = [], students = [] }) => {
    const tableRef = useRef(null);

    // Get current month as default
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState({
        year: now.getFullYear(),
        month: now.getMonth(),
    });
    const [simpleMode, setSimpleMode] = useState(false);

    // Filter dates by selected month
    const filteredDates = useMemo(() => {
        return dates.filter((dateStr) => {
            const date = new Date(dateStr);
            return (
                date.getFullYear() === selectedMonth.year &&
                date.getMonth() === selectedMonth.month
            );
        });
    }, [dates, selectedMonth]);

    // Calculate students data filtered by month
    const filteredStudents = useMemo(() => {
        return students.map((student) => {
            const monthAttendance = {};
            let present = 0,
                absent = 0,
                late = 0,
                total = 0;

            filteredDates.forEach((date) => {
                const status = student.attendance[date];
                monthAttendance[date] = status;
                if (status) {
                    total++;
                    if (status === "present") present++;
                    else if (status === "absent") absent++;
                    else if (status === "late") late++;
                }
            });

            return {
                ...student,
                monthAttendance,
                monthStats: {
                    present,
                    absent,
                    late,
                    total,
                    rate: total > 0 ? Math.round((present / total) * 100) : 0,
                },
            };
        });
    }, [students, filteredDates]);

    // Navigate months
    const goToPrevMonth = () => {
        setSelectedMonth((prev) => {
            let newMonth = prev.month - 1;
            let newYear = prev.year;
            if (newMonth < 0) {
                newMonth = 11;
                newYear--;
            }
            return { year: newYear, month: newMonth };
        });
    };

    const goToNextMonth = () => {
        setSelectedMonth((prev) => {
            let newMonth = prev.month + 1;
            let newYear = prev.year;
            if (newMonth > 11) {
                newMonth = 0;
                newYear++;
            }
            return { year: newYear, month: newMonth };
        });
    };

    // Export to CSV
    const handleExportCSV = () => {
        window.location.href = route("teacher.attendance.log.export", {
            subject: section.id,
        });
    };

    // Export to PDF
    const handleExportPDF = async () => {
        window.location.href = route("teacher.attendance.log.export.pdf", {
            subject: section.id,
        });
    };

    return (
        <TeacherLayout>
            <Head title={`Attendance - ${section.label}`} />

            {/* --- Breadcrumbs --- */}
            <nav className="mb-4 text-sm font-medium text-gray-500">
                <Link
                    href={route("teacher.attendance.index")}
                    className="text-indigo-600 hover:underline"
                >
                    Attendance
                </Link>
                <span className="mx-2">/</span>
                <Link
                    href={route("teacher.attendance.log")}
                    className="text-indigo-600 hover:underline"
                >
                    Log
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-700">{section.section}</span>
            </nav>

            {/* --- Page Header --- */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link
                            href={route("teacher.attendance.log")}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {section.grade_level} - {section.section}
                        </h1>
                    </div>
                    <p className="text-lg text-gray-600 ml-8">
                        {section.name} • {students.length} Students •{" "}
                        {filteredDates.length} Days in{" "}
                        {getMonthName(selectedMonth.year, selectedMonth.month)}
                    </p>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                    >
                        <FileSpreadsheet size={18} />
                        <span>Export CSV</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                    >
                        <FileText size={18} />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            {/* --- Month Selector & View Toggle --- */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-4">
                {/* Month Navigation */}
                <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-indigo-600" />
                    <button
                        onClick={goToPrevMonth}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <span className="text-lg font-semibold text-gray-800 min-w-[180px] text-center">
                        {getMonthName(selectedMonth.year, selectedMonth.month)}
                    </span>
                    <button
                        onClick={goToNextMonth}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronRight size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* View Mode Toggle */}
                <button
                    onClick={() => setSimpleMode(!simpleMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        simpleMode
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    {simpleMode ? (
                        <ToggleRight size={20} />
                    ) : (
                        <ToggleLeft size={20} />
                    )}
                    <span className="font-medium">
                        {simpleMode ? "Summary View" : "Detailed View"}
                    </span>
                </button>
            </div>

            {/* --- Legend (only in detailed mode) --- */}
            {!simpleMode && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 mb-4 flex flex-wrap items-center gap-6">
                    <span className="text-sm font-medium text-gray-600">
                        Legend:
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <Check size={12} className="text-green-700" />
                        </div>
                        <span className="text-sm text-gray-600">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                            <X size={12} className="text-red-700" />
                        </div>
                        <span className="text-sm text-gray-600">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock size={12} className="text-yellow-700" />
                        </div>
                        <span className="text-sm text-gray-600">Late</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-700">
                                E
                            </span>
                        </div>
                        <span className="text-sm text-gray-600">Excused</span>
                    </div>
                </div>
            )}

            {/* --- Attendance Table --- */}
            <div
                ref={tableRef}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
            >
                <div className="overflow-x-auto">
                    {simpleMode ? (
                        /* ========== SIMPLE/SUMMARY VIEW ========== */
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">
                                        Student Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        LRN
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50">
                                        Present
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-red-700 uppercase tracking-wider bg-red-50">
                                        Absent
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-yellow-700 uppercase tracking-wider bg-yellow-50">
                                        Late
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100">
                                        Total Days
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider bg-indigo-50">
                                        Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.length === 0 ||
                                filteredDates.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            No attendance records for{" "}
                                            {getMonthName(
                                                selectedMonth.year,
                                                selectedMonth.month
                                            )}
                                            .
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student, index) => (
                                        <tr
                                            key={student.id}
                                            className={
                                                index % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50"
                                            }
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {student.name}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.lrn || "-"}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold">
                                                    {student.monthStats.present}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold">
                                                    {student.monthStats.absent}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 font-bold">
                                                    {student.monthStats.late}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                                                {student.monthStats.total}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span
                                                    className={`text-lg font-bold ${
                                                        student.monthStats
                                                            .rate >= 90
                                                            ? "text-green-600"
                                                            : student.monthStats
                                                                  .rate >= 75
                                                            ? "text-yellow-600"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {student.monthStats.rate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        /* ========== DETAILED VIEW ========== */
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[200px]">
                                        Student Name
                                    </th>
                                    {filteredDates.map((date) => {
                                        const { day, dayName } =
                                            formatDateHeader(date);
                                        return (
                                            <th
                                                key={date}
                                                className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[50px]"
                                            >
                                                <div className="text-[10px] text-gray-400">
                                                    {dayName}
                                                </div>
                                                <div className="text-sm">
                                                    {day}
                                                </div>
                                            </th>
                                        );
                                    })}
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50 border-l border-gray-200">
                                        P
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-red-700 uppercase tracking-wider bg-red-50">
                                        A
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-yellow-700 uppercase tracking-wider bg-yellow-50">
                                        L
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider bg-indigo-50">
                                        Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.length === 0 ||
                                filteredDates.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={filteredDates.length + 5}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            No attendance records for{" "}
                                            {getMonthName(
                                                selectedMonth.year,
                                                selectedMonth.month
                                            )}
                                            .
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student, index) => (
                                        <tr
                                            key={student.id}
                                            className={
                                                index % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50"
                                            }
                                        >
                                            <td className="sticky left-0 z-10 px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200 bg-inherit">
                                                <div>{student.name}</div>
                                                {student.lrn && (
                                                    <div className="text-xs text-gray-400">
                                                        LRN: {student.lrn}
                                                    </div>
                                                )}
                                            </td>
                                            {filteredDates.map((date) => (
                                                <td
                                                    key={date}
                                                    className="px-2 py-3"
                                                >
                                                    <div className="flex justify-center">
                                                        <StatusCell
                                                            status={
                                                                student
                                                                    .monthAttendance[
                                                                    date
                                                                ]
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="px-3 py-3 text-center text-sm font-semibold text-green-700 bg-green-50/50 border-l border-gray-200">
                                                {student.monthStats.present}
                                            </td>
                                            <td className="px-3 py-3 text-center text-sm font-semibold text-red-700 bg-red-50/50">
                                                {student.monthStats.absent}
                                            </td>
                                            <td className="px-3 py-3 text-center text-sm font-semibold text-yellow-700 bg-yellow-50/50">
                                                {student.monthStats.late}
                                            </td>
                                            <td className="px-3 py-3 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50">
                                                {student.monthStats.rate}%
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </TeacherLayout>
    );
};

export default AttendanceLogDetail;

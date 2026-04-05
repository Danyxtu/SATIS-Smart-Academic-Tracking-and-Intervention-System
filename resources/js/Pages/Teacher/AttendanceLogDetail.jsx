import React, { useEffect, useMemo, useState } from "react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    FileSpreadsheet,
    FileText,
    Check,
    X,
    Clock,
    Minus,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const StatusCell = ({ status }) => {
    switch (status) {
        case "present":
            return (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Check size={12} />
                </div>
            );
        case "absent":
            return (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                    <X size={12} />
                </div>
            );
        case "late":
            return (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <Clock size={12} />
                </div>
            );
        case "excused":
            return (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <span className="text-[10px] font-bold">E</span>
                </div>
            );
        default:
            return (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                    <Minus size={12} />
                </div>
            );
    }
};

const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    return { day, dayName };
};

const getMonthName = (year, month) => {
    return new Date(year, month).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
};

const toMonthKey = (year, month) =>
    `${year}-${String(month + 1).padStart(2, "0")}`;

const parseMonthKey = (monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    return { year, month: month - 1 };
};

const getLatestMonthFromDates = (dates) => {
    if (!dates.length) {
        return null;
    }

    const latestDate = [...dates].sort().at(-1);
    const parsed = new Date(latestDate);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return {
        year: parsed.getFullYear(),
        month: parsed.getMonth(),
    };
};

const StatChip = ({ label, value, tone = "slate" }) => {
    const toneClasses = {
        slate: "bg-slate-50 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200",
        emerald:
            "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
        amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    };

    return (
        <div
            className={`rounded-lg px-3 py-2 ${toneClasses[tone] || toneClasses.slate}`}
        >
            <p className="text-[11px] font-medium opacity-80">{label}</p>
            <p className="text-sm font-semibold mt-0.5">{value}</p>
        </div>
    );
};

const AttendanceLogDetail = ({ section, dates = [], students = [] }) => {
    const [simpleMode, setSimpleMode] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const latest = getLatestMonthFromDates(dates);
        if (latest) {
            return latest;
        }

        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth(),
        };
    });

    useEffect(() => {
        const latest = getLatestMonthFromDates(dates);
        if (!latest) {
            return;
        }

        const currentMonthKey = toMonthKey(
            selectedMonth.year,
            selectedMonth.month,
        );
        const hasCurrentMonth = dates.some((dateString) => {
            const date = new Date(dateString);
            return (
                !Number.isNaN(date.getTime()) &&
                toMonthKey(date.getFullYear(), date.getMonth()) ===
                    currentMonthKey
            );
        });

        if (!hasCurrentMonth) {
            setSelectedMonth(latest);
        }
    }, [dates, selectedMonth.year, selectedMonth.month]);

    const availableMonthKeys = useMemo(() => {
        const keys = dates
            .map((dateString) => {
                const parsed = new Date(dateString);
                if (Number.isNaN(parsed.getTime())) {
                    return null;
                }
                return toMonthKey(parsed.getFullYear(), parsed.getMonth());
            })
            .filter(Boolean);

        return Array.from(new Set(keys)).sort();
    }, [dates]);

    const activeMonthKey = toMonthKey(selectedMonth.year, selectedMonth.month);
    const activeMonthIndex = availableMonthKeys.indexOf(activeMonthKey);
    const canGoPrev = activeMonthIndex > 0;
    const canGoNext =
        activeMonthIndex !== -1 &&
        activeMonthIndex < availableMonthKeys.length - 1;

    const filteredDates = useMemo(() => {
        return dates.filter((dateStr) => {
            const date = new Date(dateStr);
            return (
                date.getFullYear() === selectedMonth.year &&
                date.getMonth() === selectedMonth.month
            );
        });
    }, [dates, selectedMonth]);

    const filteredStudents = useMemo(() => {
        return students.map((student) => {
            const attendanceMap = student.attendance || {};
            const monthAttendance = {};
            let present = 0;
            let absent = 0;
            let late = 0;
            let total = 0;

            filteredDates.forEach((date) => {
                const status = attendanceMap[date];
                monthAttendance[date] = status;

                if (status) {
                    total += 1;
                    if (status === "present") present += 1;
                    if (status === "absent") absent += 1;
                    if (status === "late") late += 1;
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

    const monthSummary = useMemo(() => {
        return filteredStudents.reduce(
            (acc, student) => {
                acc.present += student.monthStats.present;
                acc.absent += student.monthStats.absent;
                acc.late += student.monthStats.late;
                acc.total += student.monthStats.total;
                return acc;
            },
            { present: 0, absent: 0, late: 0, total: 0 },
        );
    }, [filteredStudents]);

    const monthRate =
        monthSummary.total > 0
            ? Math.round((monthSummary.present / monthSummary.total) * 100)
            : 0;

    const goToPrevMonth = () => {
        if (!canGoPrev) {
            return;
        }
        setSelectedMonth(
            parseMonthKey(availableMonthKeys[activeMonthIndex - 1]),
        );
    };

    const goToNextMonth = () => {
        if (!canGoNext) {
            return;
        }
        setSelectedMonth(
            parseMonthKey(availableMonthKeys[activeMonthIndex + 1]),
        );
    };

    const handleExportCSV = () => {
        window.location.href = route("teacher.attendance.log.export", {
            subjectTeacher: section.id,
        });
    };

    const handleExportPDF = () => {
        window.location.href = route("teacher.attendance.log.export.pdf", {
            subjectTeacher: section.id,
        });
    };

    const isTableEmpty =
        filteredStudents.length === 0 || filteredDates.length === 0;

    return (
        <>
            <Head
                title={`${section.grade_level} - ${section.section} Attendance Log`}
            />

            <div className="space-y-4">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-3">
                            <Link
                                href={route("teacher.attendance.index")}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <ArrowLeft size={16} />
                            </Link>

                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                                    Section Attendance Log
                                </p>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                                    {section.grade_level} - {section.section}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {section.name}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleExportCSV}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                            >
                                <FileSpreadsheet size={14} />
                                CSV
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50"
                            >
                                <FileText size={14} />
                                PDF
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                        <StatChip label="Students" value={students.length} />
                        <StatChip
                            label="Days This Month"
                            value={filteredDates.length}
                            tone="indigo"
                        />
                        <StatChip
                            label="Present"
                            value={monthSummary.present}
                            tone="emerald"
                        />
                        <StatChip
                            label="Absent"
                            value={monthSummary.absent}
                            tone="rose"
                        />
                        <StatChip
                            label="Overall Rate"
                            value={`${monthRate}%`}
                            tone={
                                monthRate >= 90
                                    ? "emerald"
                                    : monthRate >= 75
                                      ? "amber"
                                      : "rose"
                            }
                        />
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/40">
                            <button
                                onClick={goToPrevMonth}
                                disabled={!canGoPrev}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-l-lg text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="flex min-w-[190px] items-center justify-center gap-1.5 px-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                <Calendar
                                    size={14}
                                    className="text-indigo-500"
                                />
                                {getMonthName(
                                    selectedMonth.year,
                                    selectedMonth.month,
                                )}
                            </div>
                            <button
                                onClick={goToNextMonth}
                                disabled={!canGoNext}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-r-lg text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-700/50">
                            <button
                                onClick={() => setSimpleMode(false)}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    !simpleMode
                                        ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-600 dark:text-indigo-300"
                                        : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600"
                                }`}
                            >
                                Detailed
                            </button>
                            <button
                                onClick={() => setSimpleMode(true)}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    simpleMode
                                        ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-600 dark:text-indigo-300"
                                        : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600"
                                }`}
                            >
                                Summary
                            </button>
                        </div>
                    </div>
                </section>

                {!simpleMode && (
                    <section className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                            Legend
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <Check size={11} /> Present
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                            <X size={11} /> Absent
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            <Clock size={11} /> Late
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            E Excused
                        </span>
                    </section>
                )}

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="overflow-x-auto">
                        {simpleMode ? (
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-900/60">
                                    <tr>
                                        <th className="min-w-[220px] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Student Name
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            LRN
                                        </th>
                                        <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                            Present
                                        </th>
                                        <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                                            Absent
                                        </th>
                                        <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                                            Late
                                        </th>
                                        <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Total
                                        </th>
                                        <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                                            Rate
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {isTableEmpty ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                                            >
                                                No attendance records for{" "}
                                                {getMonthName(
                                                    selectedMonth.year,
                                                    selectedMonth.month,
                                                )}
                                                .
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map(
                                            (student, index) => {
                                                const rowClass =
                                                    index % 2 === 0
                                                        ? "bg-white dark:bg-slate-800"
                                                        : "bg-slate-50/60 dark:bg-slate-800/70";

                                                return (
                                                    <tr
                                                        key={student.id}
                                                        className={`${rowClass} hover:bg-indigo-50/40 dark:hover:bg-slate-700/40`}
                                                    >
                                                        <td className="px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                                                            {student.name}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400">
                                                            {student.lrn || "-"}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                                            {
                                                                student
                                                                    .monthStats
                                                                    .present
                                                            }
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center text-sm font-semibold text-rose-700 dark:text-rose-300">
                                                            {
                                                                student
                                                                    .monthStats
                                                                    .absent
                                                            }
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center text-sm font-semibold text-amber-700 dark:text-amber-300">
                                                            {
                                                                student
                                                                    .monthStats
                                                                    .late
                                                            }
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                            {
                                                                student
                                                                    .monthStats
                                                                    .total
                                                            }
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span
                                                                className={`text-sm font-bold ${
                                                                    student
                                                                        .monthStats
                                                                        .rate >=
                                                                    90
                                                                        ? "text-emerald-600 dark:text-emerald-300"
                                                                        : student
                                                                                .monthStats
                                                                                .rate >=
                                                                            75
                                                                          ? "text-amber-600 dark:text-amber-300"
                                                                          : "text-rose-600 dark:text-rose-300"
                                                                }`}
                                                            >
                                                                {
                                                                    student
                                                                        .monthStats
                                                                        .rate
                                                                }
                                                                %
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-900/60">
                                    <tr>
                                        <th className="sticky left-0 z-20 min-w-[220px] border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                                            Student Name
                                        </th>
                                        {filteredDates.map((date) => {
                                            const { day, dayName } =
                                                formatDateHeader(date);
                                            return (
                                                <th
                                                    key={date}
                                                    className="min-w-[52px] px-1.5 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                                                >
                                                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                        {dayName}
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                        {day}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                        <th className="border-l border-slate-200 px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-slate-700 dark:text-emerald-300">
                                            P
                                        </th>
                                        <th className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                                            A
                                        </th>
                                        <th className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                                            L
                                        </th>
                                        <th className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                                            Rate
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {isTableEmpty ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    filteredDates.length + 5
                                                }
                                                className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                                            >
                                                No attendance records for{" "}
                                                {getMonthName(
                                                    selectedMonth.year,
                                                    selectedMonth.month,
                                                )}
                                                .
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map(
                                            (student, index) => {
                                                const rowClass =
                                                    index % 2 === 0
                                                        ? "bg-white dark:bg-slate-800"
                                                        : "bg-slate-50/60 dark:bg-slate-800/70";

                                                return (
                                                    <tr
                                                        key={student.id}
                                                        className={`${rowClass} hover:bg-indigo-50/40 dark:hover:bg-slate-700/40`}
                                                    >
                                                        <td
                                                            className={`sticky left-0 z-10 border-r border-slate-200 px-3 py-2.5 dark:border-slate-700 ${rowClass}`}
                                                        >
                                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                {student.name}
                                                            </div>
                                                            {student.lrn && (
                                                                <div className="text-xs text-slate-400 dark:text-slate-500">
                                                                    LRN:{" "}
                                                                    {
                                                                        student.lrn
                                                                    }
                                                                </div>
                                                            )}
                                                        </td>

                                                        {filteredDates.map(
                                                            (date) => (
                                                                <td
                                                                    key={date}
                                                                    className="px-1.5 py-2"
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
                                                            ),
                                                        )}

                                                        <td className="border-l border-slate-200 px-2 py-2.5 text-center text-sm font-semibold text-emerald-700 dark:border-slate-700 dark:text-emerald-300">
                                                            {
                                                                student
                                                                    .monthStats
                                                                    .present
                                                            }
                                                        </td>
                                                        <td className="px-2 py-2.5 text-center text-sm font-semibold text-rose-700 dark:text-rose-300">
                                                            {
                                                                student
                                                                    .monthStats
                                                                    .absent
                                                            }
                                                        </td>
                                                        <td className="px-2 py-2.5 text-center text-sm font-semibold text-amber-700 dark:text-amber-300">
                                                            {
                                                                student
                                                                    .monthStats
                                                                    .late
                                                            }
                                                        </td>
                                                        <td className="px-2 py-2.5 text-center text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                                            {
                                                                student
                                                                    .monthStats
                                                                    .rate
                                                            }
                                                            %
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
};

AttendanceLogDetail.layout = (page) => <SchoolStaffLayout children={page} />;

export default AttendanceLogDetail;

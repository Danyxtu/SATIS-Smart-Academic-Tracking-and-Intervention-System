import React, { useRef } from "react";
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
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    return { month, day };
};

const AttendanceLogDetail = ({ section, dates = [], students = [] }) => {
    const tableRef = useRef(null);

    // Export to CSV
    const handleExportCSV = () => {
        window.location.href = route("teacher.attendance.log.export", {
            subject: section.id,
        });
    };

    // Export to PDF (server-side) - fallback to print if endpoint not available
    const handleExportPDF = async () => {
        const url = route("teacher.attendance.log.export.pdf", {
            subject: section.id,
        });
        try {
            const resp = await fetch(url, {
                method: "GET",
                credentials: "same-origin",
                headers: { Accept: "application/pdf" },
            });

            if (
                resp.ok &&
                resp.headers.get("Content-Type")?.includes("application/pdf")
            ) {
                const blob = await resp.blob();
                const blobUrl = URL.createObjectURL(blob);
                const win = window.open(blobUrl, "_blank");
                // revoke after a timeout
                setTimeout(() => URL.revokeObjectURL(blobUrl), 20000);
                return;
            }
        } catch (err) {
            // ignore and fallback
        }

        // fallback: client-side print
        const printContent = tableRef.current;
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Attendance - ${section.label}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { font-size: 18px; margin-bottom: 5px; }
                    h2 { font-size: 14px; color: #666; margin-bottom: 20px; font-weight: normal; }
                    table { border-collapse: collapse; width: 100%; font-size: 11px; }
                    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: center; }
                    th { background-color: #f3f4f6; font-weight: 600; }
                    .name-col { text-align: left; min-width: 150px; }
                    .present { color: #16a34a; font-weight: bold; }
                    .absent { color: #dc2626; font-weight: bold; }
                    .late { color: #ca8a04; font-weight: bold; }
                    .excused { color: #2563eb; font-weight: bold; }
                    .no-record { color: #9ca3af; }
                    .stats-header { background-color: #e0e7ff; }
                    .legend { margin-top: 20px; font-size: 11px; }
                    .legend span { margin-right: 15px; }
                    @media print {
                        body { padding: 0; }
                        @page { size: landscape; margin: 10mm; }
                    }
                </style>
            </head>
            <body>
                <h1>${section.grade_level} - ${section.section}</h1>
                <h2>${
                    section.name
                } | Generated: ${new Date().toLocaleDateString()}</h2>
                <table>
                    <thead>
                        <tr>
                            <th class="name-col">Student Name</th>
                            <th>LRN</th>
                            ${dates
                                .map(
                                    (d) =>
                                        `<th>${new Date(d).toLocaleDateString(
                                            "en-US",
                                            { month: "short", day: "numeric" }
                                        )}</th>`
                                )
                                .join("")}
                            <th class="stats-header">P</th>
                            <th class="stats-header">A</th>
                            <th class="stats-header">L</th>
                            <th class="stats-header">Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students
                            .map(
                                (student) => `
                            <tr>
                                <td class="name-col">${student.name}</td>
                                <td>${student.lrn || "-"}</td>
                                ${dates
                                    .map((d) => {
                                        const status = student.attendance[d];
                                        const className = status || "no-record";
                                        const symbol =
                                            status === "present"
                                                ? "P"
                                                : status === "absent"
                                                ? "A"
                                                : status === "late"
                                                ? "L"
                                                : status === "excused"
                                                ? "E"
                                                : "-";
                                        return `<td class="${className}">${symbol}</td>`;
                                    })
                                    .join("")}
                                <td class="present">${
                                    student.stats.present
                                }</td>
                                <td class="absent">${student.stats.absent}</td>
                                <td class="late">${student.stats.late}</td>
                                <td>${student.stats.rate}%</td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
                <div class="legend">
                    <strong>Legend:</strong>
                    <span class="present">P = Present</span>
                    <span class="absent">A = Absent</span>
                    <span class="late">L = Late</span>
                    <span class="excused">E = Excused</span>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
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
                        {dates.length} Days
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

            {/* --- Legend --- */}
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

            {/* --- Attendance Table --- */}
            <div
                ref={tableRef}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[200px]">
                                    Student Name
                                </th>
                                {dates.map((date) => {
                                    const { month, day } =
                                        formatDateHeader(date);
                                    return (
                                        <th
                                            key={date}
                                            className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[50px]"
                                        >
                                            <div className="text-[10px] text-gray-400">
                                                {month}
                                            </div>
                                            <div className="text-sm">{day}</div>
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
                            {students.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={dates.length + 5}
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        No attendance records found.
                                    </td>
                                </tr>
                            ) : (
                                students.map((student, index) => (
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
                                        {dates.map((date) => (
                                            <td
                                                key={date}
                                                className="px-2 py-3"
                                            >
                                                <div className="flex justify-center">
                                                    <StatusCell
                                                        status={
                                                            student.attendance[
                                                                date
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        ))}
                                        <td className="px-3 py-3 text-center text-sm font-semibold text-green-700 bg-green-50/50 border-l border-gray-200">
                                            {student.stats.present}
                                        </td>
                                        <td className="px-3 py-3 text-center text-sm font-semibold text-red-700 bg-red-50/50">
                                            {student.stats.absent}
                                        </td>
                                        <td className="px-3 py-3 text-center text-sm font-semibold text-yellow-700 bg-yellow-50/50">
                                            {student.stats.late}
                                        </td>
                                        <td className="px-3 py-3 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50">
                                            {student.stats.rate}%
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </TeacherLayout>
    );
};

export default AttendanceLogDetail;

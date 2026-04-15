import React, { useEffect, useState } from "react";
import { X, Check, QrCode, Copy, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const StudentStatusModal = ({
    student,
    assignments = [],
    gradeCategories = [],
    gradeStructure = null,
    calculateFinalGrade,
    calculateExpectedQuarterlyGrade,
    calculateOverallFinalGrade,
    hasQuarterlyExamScores,
    onClose,
}) => {
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [overviewMode, setOverviewMode] = useState("grades");
    const [credentialsCopied, setCredentialsCopied] = useState(false);

    useEffect(() => {
        setSelectedQuarter(1);
        setOverviewMode("grades");
        setCredentialsCopied(false);
    }, [student?.id]);

    if (!student) return null;

    // Resolve categories for the selected quarter from per-quarter structure
    const FALLBACK_CATEGORIES = gradeCategories;
    const resolveCategories = (quarter) => {
        if (gradeStructure) {
            return (
                gradeStructure?.[quarter]?.categories ??
                gradeStructure?.[String(quarter)]?.categories ??
                FALLBACK_CATEGORIES
            );
        }
        return FALLBACK_CATEGORIES;
    };
    const currentCategories = resolveCategories(selectedQuarter);
    const q1Categories = resolveCategories(1);

    const hasChangedPassword =
        student.user?.must_change_password === false ||
        student.must_change_password === false;

    // Check if Q1 is finished (has quarterly exam scores)
    const q1Finished = hasQuarterlyExamScores
        ? hasQuarterlyExamScores(student.grades, q1Categories, 1)
        : false;

    const attendanceSummary = student?.attendance?.summary ?? {};

    // Calculate grades for the selected quarter
    const quarterlyGrade =
        hasQuarterlyExamScores &&
        hasQuarterlyExamScores(
            student.grades,
            currentCategories,
            selectedQuarter,
        )
            ? calculateFinalGrade(
                  student.grades,
                  currentCategories,
                  selectedQuarter,
                  attendanceSummary,
              )
            : "—";
    const expectedGrade = calculateExpectedQuarterlyGrade
        ? calculateExpectedQuarterlyGrade(
              student.grades,
              currentCategories,
              selectedQuarter,
              attendanceSummary,
          )
        : "—";
    const finalGrade = calculateOverallFinalGrade
        ? calculateOverallFinalGrade(
              student.grades,
              gradeCategories,
              attendanceSummary,
          )
        : "—";
    const attendanceRecords = Array.isArray(student?.attendance?.records)
        ? student.attendance.records
        : [];
    const attendanceRate = Number(attendanceSummary.attendance_rate);
    const attendanceRateLabel = Number.isFinite(attendanceRate)
        ? `${attendanceRate.toFixed(1)}%`
        : "—";

    const metaItems = [
        { label: "LRN", value: student.lrn || "—" },
        { label: "Username", value: student.username || "—" },
        {
            label: "Personal Email",
            value: student.personal_email || student.email || "—",
        },
        { label: "Grade Level", value: student.grade_level || "—" },
        { label: "Section", value: student.section || "—" },
        { label: "Strand", value: student.strand || "—" },
        { label: "Track", value: student.track || "—" },
    ];

    const credentialUsername = student.username || student.user?.username || "";
    const credentialPassword =
        student.password ||
        student.temporary_password ||
        student.generated_password ||
        "";
    const hasCredentialPayload = Boolean(
        credentialUsername && credentialPassword,
    );
    const qrCredentialsPayload = hasCredentialPayload
        ? JSON.stringify({
              type: "satis_student_credentials",
              version: 1,
              username: credentialUsername,
              password: credentialPassword,
          })
        : "";

    const copyCredentialDetails = async () => {
        if (!hasCredentialPayload) {
            return;
        }

        if (typeof navigator === "undefined" || !navigator.clipboard) {
            return;
        }

        const payload = `Username: ${credentialUsername}\nPassword: ${credentialPassword}`;

        try {
            await navigator.clipboard.writeText(payload);
            setCredentialsCopied(true);
            window.setTimeout(() => setCredentialsCopied(false), 1800);
        } catch (error) {
            console.error("Failed to copy student credentials", error);
        }
    };

    const getInitials = () => {
        if (!student.name) return "ST";
        return student.name
            .split(" ")
            .map((segment) => segment.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getAttendanceStatusClasses = (status) => {
        const normalizedStatus = String(status || "").toLowerCase();

        if (normalizedStatus === "present") {
            return "bg-emerald-100 text-emerald-700 border-emerald-200";
        }

        if (normalizedStatus === "absent") {
            return "bg-rose-100 text-rose-700 border-rose-200";
        }

        if (normalizedStatus === "late") {
            return "bg-amber-100 text-amber-700 border-amber-200";
        }

        if (normalizedStatus === "excused") {
            return "bg-sky-100 text-sky-700 border-sky-200";
        }

        return "bg-gray-100 text-gray-700 border-gray-200";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-4 overflow-y-auto">
            <div className="relative w-full max-w-3xl my-4 rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
                {/* Close button - fixed position, always visible */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 z-10 rounded-full bg-white/90 dark:bg-gray-900/90 p-1.5 text-gray-600 shadow-lg transition hover:bg-white dark:hover:bg-gray-900 hover:text-gray-900 dark:text-gray-100"
                    aria-label="Close modal"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-4 text-white flex-shrink-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pr-8">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-lg border border-white/40 bg-white/20 dark:bg-gray-900/20 flex items-center justify-center text-base font-semibold flex-shrink-0">
                                {student.avatar ? (
                                    <img
                                        src={student.avatar}
                                        alt={student.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>{getInitials()}</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs uppercase tracking-widest text-white/80">
                                    Student Status
                                </p>
                                <h2 className="text-lg sm:text-xl font-bold truncate">
                                    {student.name}
                                </h2>
                                <p className="text-xs text-white/80">
                                    {student.grade_level || ""}{" "}
                                    {student.section
                                        ? `• ${student.section}`
                                        : ""}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                            <div className="rounded-lg bg-white/20 dark:bg-gray-900/20 px-2.5 py-1.5 text-center backdrop-blur min-w-[78px]">
                                <p className="text-[10px] uppercase tracking-wide text-white/70">
                                    Q{selectedQuarter} Grade
                                </p>
                                <p className="text-lg font-semibold leading-tight">
                                    {quarterlyGrade}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/20 dark:bg-gray-900/20 px-2.5 py-1.5 text-center backdrop-blur min-w-[78px]">
                                <p className="text-[10px] uppercase tracking-wide text-white/70">
                                    Expected Q{selectedQuarter}
                                </p>
                                <p className="text-lg font-semibold text-yellow-200 leading-tight">
                                    {expectedGrade}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/20 dark:bg-gray-900/20 px-2.5 py-1.5 text-center backdrop-blur min-w-[78px]">
                                <p className="text-[10px] uppercase tracking-wide text-white/70">
                                    Final Grade
                                </p>
                                <p className="text-lg font-semibold leading-tight">
                                    {finalGrade}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/20 dark:bg-gray-900/20 px-2.5 py-1.5 text-center backdrop-blur min-w-[78px]">
                                <p className="text-[10px] uppercase tracking-wide text-white/70">
                                    Activities
                                </p>
                                <p className="text-lg font-semibold leading-tight">
                                    {assignments.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {/* Overview Toggle */}
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/70">
                        <div className="grid grid-cols-3 gap-1">
                            <button
                                type="button"
                                onClick={() => setOverviewMode("grades")}
                                className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                                    overviewMode === "grades"
                                        ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-900 dark:text-indigo-300"
                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                }`}
                            >
                                Grades Overview
                            </button>
                            <button
                                type="button"
                                onClick={() => setOverviewMode("attendance")}
                                className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                                    overviewMode === "attendance"
                                        ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-900 dark:text-indigo-300"
                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                }`}
                            >
                                Attendance Overview
                            </button>
                            <button
                                type="button"
                                onClick={() => setOverviewMode("credentials")}
                                className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                                    overviewMode === "credentials"
                                        ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-900 dark:text-indigo-300"
                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                }`}
                            >
                                Login Credentials
                            </button>
                        </div>
                    </div>

                    {/* Account Status Section */}
                    <div
                        className={`rounded-lg border p-2.5 ${
                            hasChangedPassword
                                ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                : "border-amber-200 bg-amber-50"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                    hasChangedPassword
                                        ? "bg-green-100"
                                        : "bg-amber-100"
                                }`}
                            >
                                <Check
                                    size={16}
                                    className={
                                        hasChangedPassword
                                            ? "text-green-600"
                                            : "text-amber-600"
                                    }
                                />
                            </div>
                            <div>
                                <p
                                    className={`text-xs font-semibold ${
                                        hasChangedPassword
                                            ? "text-gray-800 dark:text-gray-200"
                                            : "text-amber-800"
                                    }`}
                                >
                                    {hasChangedPassword
                                        ? "Password Changed"
                                        : "Password Change Required"}
                                </p>
                                <p
                                    className={`text-xs ${
                                        hasChangedPassword
                                            ? "text-gray-500 dark:text-gray-400"
                                            : "text-amber-600"
                                    }`}
                                >
                                    {hasChangedPassword
                                        ? "This student has already set their own password."
                                        : "This student must update their password after login."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Meta Information Grid */}
                    <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                        {metaItems.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 p-2"
                            >
                                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    {item.label}
                                </p>
                                <p className="mt-0.5 text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {item.value || "—"}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Grades Overview */}
                    {overviewMode === "grades" &&
                        currentCategories.length > 0 && (
                            <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-2.5">
                                <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                            Grades Overview
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Breakdown by assessment category
                                        </p>
                                    </div>

                                    {/* Quarter Toggle */}
                                    <div className="flex items-center gap-2 ml-auto">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Quarter:
                                        </span>
                                        <div className="flex items-center p-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <button
                                                onClick={() =>
                                                    setSelectedQuarter(1)
                                                }
                                                className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                                                    selectedQuarter === 1
                                                        ? "bg-white dark:bg-gray-900 text-indigo-700 shadow-sm"
                                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                                                }`}
                                            >
                                                Q1
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (q1Finished) {
                                                        setSelectedQuarter(2);
                                                    }
                                                }}
                                                disabled={!q1Finished}
                                                className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                                                    selectedQuarter === 2
                                                        ? "bg-white dark:bg-gray-900 text-indigo-700 shadow-sm"
                                                        : !q1Finished
                                                          ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                                                }`}
                                                title={
                                                    !q1Finished
                                                        ? "Complete Q1 quarterly exam first"
                                                        : ""
                                                }
                                            >
                                                Q2
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                                    {currentCategories.map((category) => (
                                        <span
                                            key={category.id}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400"
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                            {category.label} (
                                            {Math.round(
                                                (category.weight ?? 0) * 100,
                                            )}
                                            %)
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2">
                                                    Activity
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Score
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300">
                                            {currentCategories.every(
                                                (cat) =>
                                                    !cat.tasks ||
                                                    cat.tasks.length === 0,
                                            ) && (
                                                <tr>
                                                    <td
                                                        className="px-3 py-4 text-center text-gray-400 dark:text-gray-500"
                                                        colSpan={3}
                                                    >
                                                        No assignments defined
                                                        for this class yet.
                                                    </td>
                                                </tr>
                                            )}
                                            {currentCategories.map(
                                                (category) => {
                                                    const tasks =
                                                        category.tasks ?? [];
                                                    if (tasks.length === 0)
                                                        return null;

                                                    // Abbreviate category labels
                                                    const abbrev = {
                                                        written_works: "WW",
                                                        performance_task: "PT",
                                                        quarterly_exam: "QE",
                                                    };
                                                    const shortLabel =
                                                        abbrev[category.id] ||
                                                        category.label;
                                                    const percent = Math.round(
                                                        (category.weight ?? 0) *
                                                            100,
                                                    );

                                                    // Calculate category subtotal
                                                    const quarterGrades =
                                                        student.grades?.[
                                                            selectedQuarter
                                                        ] ?? {};
                                                    let catScore = 0;
                                                    let catTotal = 0;
                                                    tasks.forEach((task) => {
                                                        const val =
                                                            quarterGrades[
                                                                task.id
                                                            ];
                                                        if (
                                                            val !== undefined &&
                                                            val !== null &&
                                                            val !== ""
                                                        ) {
                                                            catScore +=
                                                                Number(val);
                                                            catTotal += Number(
                                                                task.total,
                                                            );
                                                        }
                                                    });

                                                    return (
                                                        <React.Fragment
                                                            key={category.id}
                                                        >
                                                            {/* Category Header Row */}
                                                            <tr className="bg-gray-50 dark:bg-gray-800/90">
                                                                <td
                                                                    colSpan={3}
                                                                    className="px-3 py-2"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                            {
                                                                                shortLabel
                                                                            }{" "}
                                                                            <span className="font-normal text-gray-500 dark:text-gray-400">
                                                                                —{" "}
                                                                                {
                                                                                    category.label
                                                                                }
                                                                            </span>
                                                                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                                                                (
                                                                                {
                                                                                    percent
                                                                                }
                                                                                %)
                                                                            </span>
                                                                        </span>
                                                                        {catTotal >
                                                                            0 && (
                                                                            <span className="text-xs font-medium text-indigo-600">
                                                                                {
                                                                                    catScore
                                                                                }

                                                                                /
                                                                                {
                                                                                    catTotal
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {/* Task Rows */}
                                                            {tasks.map(
                                                                (task) => {
                                                                    const score =
                                                                        quarterGrades[
                                                                            task
                                                                                .id
                                                                        ];
                                                                    return (
                                                                        <tr
                                                                            key={
                                                                                task.id
                                                                            }
                                                                        >
                                                                            <td className="px-3 py-1.5 pl-6 text-gray-600 dark:text-gray-400">
                                                                                {
                                                                                    task.label
                                                                                }
                                                                            </td>
                                                                            <td className="px-3 py-1.5 text-right font-semibold text-indigo-600">
                                                                                {score !==
                                                                                    undefined &&
                                                                                score !==
                                                                                    null &&
                                                                                score !==
                                                                                    ""
                                                                                    ? score
                                                                                    : "—"}
                                                                            </td>
                                                                            <td className="px-3 py-1.5 text-right text-gray-500 dark:text-gray-400">
                                                                                {
                                                                                    task.total
                                                                                }
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                },
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                },
                                            )}
                                            {currentCategories.some(
                                                (cat) =>
                                                    cat.tasks &&
                                                    cat.tasks.length > 0,
                                            ) && (
                                                <>
                                                    <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100">
                                                        <td className="px-3 py-2 font-semibold">
                                                            Q{selectedQuarter}{" "}
                                                            Grade
                                                        </td>
                                                        <td
                                                            className="px-3 py-2 text-right font-semibold text-indigo-700"
                                                            colSpan={2}
                                                        >
                                                            {quarterlyGrade}
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-indigo-50/50 text-gray-900 dark:text-gray-100">
                                                        <td className="px-3 py-2 font-semibold">
                                                            Expected Q
                                                            {selectedQuarter}{" "}
                                                            Grade
                                                            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                                (Projected)
                                                            </span>
                                                        </td>
                                                        <td
                                                            className="px-3 py-2 text-right font-semibold text-amber-600"
                                                            colSpan={2}
                                                        >
                                                            {expectedGrade}
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-indigo-100/70 text-gray-900 dark:text-gray-100">
                                                        <td className="px-3 py-2 font-bold">
                                                            Final Grade
                                                            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                                (Q1 + Q2
                                                                Average)
                                                            </span>
                                                        </td>
                                                        <td
                                                            className="px-3 py-2 text-right font-bold text-indigo-800"
                                                            colSpan={2}
                                                        >
                                                            {finalGrade}
                                                        </td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    {overviewMode === "grades" &&
                        currentCategories.length === 0 && (
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400">
                                No grade categories are available for this class
                                yet.
                            </div>
                        )}

                    {/* Student Credentials Overview */}
                    {overviewMode === "credentials" && (
                        <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2 dark:border-gray-700">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                        Student Login Credentials
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Scan this QR code in the mobile login
                                        page (bottom-right scanner button).
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    <QrCode size={14} /> Auto Login QR
                                </span>
                            </div>

                            {hasCredentialPayload ? (
                                <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr]">
                                    <div className="rounded-lg border border-gray-200 bg-white p-3 flex items-center justify-center">
                                        <QRCodeSVG
                                            value={qrCredentialsPayload}
                                            size={180}
                                            includeMargin
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 p-2">
                                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                Username
                                            </p>
                                            <p className="mt-0.5 text-xs font-semibold text-gray-900 dark:text-gray-100 break-all">
                                                {credentialUsername}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 p-2">
                                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                Temporary Password
                                            </p>
                                            <p className="mt-0.5 text-xs font-semibold text-gray-900 dark:text-gray-100 break-all">
                                                {credentialPassword}
                                            </p>
                                        </div>

                                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                            This QR contains plain login
                                            credentials. Let the student scan it
                                            immediately, then close this modal.
                                        </p>

                                        <button
                                            type="button"
                                            onClick={copyCredentialDetails}
                                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                credentialsCopied
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                                            }`}
                                        >
                                            <Copy size={14} />
                                            {credentialsCopied
                                                ? "Credentials Copied"
                                                : "Copy Credentials"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                    <p className="font-semibold inline-flex items-center gap-1.5">
                                        <AlertTriangle size={14} /> Temporary
                                        password unavailable
                                    </p>
                                    <p className="mt-1">
                                        QR auto-login is available when a
                                        temporary password is present (for
                                        example, right after student account
                                        creation).
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Attendance Overview */}
                    {overviewMode === "attendance" && (
                        <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2 dark:border-gray-700">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                        Attendance Overview
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Attendance summary and latest records
                                    </p>
                                </div>
                                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    Attendance Rate: {attendanceRateLabel}
                                </span>
                            </div>

                            <div className="mt-2 grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/70">
                                    <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Total Days
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {attendanceSummary.total_days ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                                    <p className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                        Present
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                                        {attendanceSummary.present_days ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 dark:border-rose-900/40 dark:bg-rose-900/20">
                                    <p className="text-[10px] uppercase tracking-wide text-rose-700 dark:text-rose-300">
                                        Absent
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-rose-700 dark:text-rose-200">
                                        {attendanceSummary.absent_days ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-900/40 dark:bg-amber-900/20">
                                    <p className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                                        Late
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-amber-700 dark:text-amber-200">
                                        {attendanceSummary.late_days ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-sky-200 bg-sky-50 p-2 dark:border-sky-900/40 dark:bg-sky-900/20">
                                    <p className="text-[10px] uppercase tracking-wide text-sky-700 dark:text-sky-300">
                                        Excused
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-sky-700 dark:text-sky-200">
                                        {attendanceSummary.excused_days ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 dark:border-indigo-900/40 dark:bg-indigo-900/20">
                                    <p className="text-[10px] uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                                        Attended
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-indigo-700 dark:text-indigo-200">
                                        {attendanceSummary.attended_days ?? 0}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
                                <table className="min-w-full divide-y divide-gray-200 text-left">
                                    <thead className="sticky top-0 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800/80 dark:text-gray-400">
                                        <tr>
                                            <th className="px-3 py-2">Date</th>
                                            <th className="px-3 py-2 text-right">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                        {attendanceRecords.length === 0 && (
                                            <tr>
                                                <td
                                                    className="px-3 py-4 text-center text-gray-400 dark:text-gray-500"
                                                    colSpan={2}
                                                >
                                                    No attendance records found
                                                    for this student.
                                                </td>
                                            </tr>
                                        )}

                                        {attendanceRecords.map((record) => (
                                            <tr
                                                key={`${record.date}-${record.status}`}
                                            >
                                                <td className="px-3 py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                                    {record.date_label ||
                                                        record.date ||
                                                        "—"}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getAttendanceStatusClasses(
                                                            record.status,
                                                        )}`}
                                                    >
                                                        {record.status_label ||
                                                            record.status ||
                                                            "Unknown"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end bg-gray-50 dark:bg-gray-800 px-3 py-2.5 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentStatusModal;

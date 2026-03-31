import React, { useState } from "react";
import { X, Eye, EyeOff, Copy, Check } from "lucide-react";

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
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedQuarter, setSelectedQuarter] = useState(1);

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

    // Get the temporary password from the student's user record
    const temporaryPassword =
        student.user?.temp_password || student.temp_password || null;
    const hasChangedPassword =
        student.user?.must_change_password === false ||
        student.must_change_password === false;

    // Check if Q1 is finished (has quarterly exam scores)
    const q1Finished = hasQuarterlyExamScores
        ? hasQuarterlyExamScores(student.grades, q1Categories, 1)
        : false;

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
              )
            : "—";
    const expectedGrade = calculateExpectedQuarterlyGrade
        ? calculateExpectedQuarterlyGrade(
              student.grades,
              currentCategories,
              selectedQuarter,
          )
        : "—";
    const finalGrade = calculateOverallFinalGrade
        ? calculateOverallFinalGrade(student.grades, gradeCategories)
        : "—";

    const metaItems = [
        { label: "LRN", value: student.lrn || "—" },
        { label: "Email", value: student.email || "—" },
        { label: "Grade Level", value: student.grade_level || "—" },
        { label: "Section", value: student.section || "—" },
        { label: "Strand", value: student.strand || "—" },
        { label: "Track", value: student.track || "—" },
    ];

    const getInitials = () => {
        if (!student.name) return "ST";
        return student.name
            .split(" ")
            .map((segment) => segment.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(temporaryPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-4 overflow-y-auto">
            <div className="relative w-full max-w-3xl my-4 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
                {/* Close button - fixed position, always visible */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-gray-600 shadow-lg transition hover:bg-white hover:text-gray-900"
                    aria-label="Close modal"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-4 text-white flex-shrink-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pr-8">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-lg border border-white/40 bg-white/20 flex items-center justify-center text-base font-semibold flex-shrink-0">
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
                            <div className="rounded-lg bg-white/20 px-2.5 py-1.5 text-center backdrop-blur min-w-[78px]">
                                <p className="text-[10px] uppercase tracking-wide text-white/70">
                                    Q{selectedQuarter} Grade
                                </p>
                                <p className="text-lg font-semibold leading-tight">
                                    {quarterlyGrade}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/20 px-2.5 py-1.5 text-center backdrop-blur min-w-[78px]">
                                <p className="text-[10px] uppercase tracking-wide text-white/70">
                                    Expected Q{selectedQuarter}
                                </p>
                                <p className="text-lg font-semibold text-yellow-200 leading-tight">
                                    {expectedGrade}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/20 px-2.5 py-1.5 text-center backdrop-blur min-w-[78px]">
                                <p className="text-[10px] uppercase tracking-wide text-white/70">
                                    Final Grade
                                </p>
                                <p className="text-lg font-semibold leading-tight">
                                    {finalGrade}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/20 px-2.5 py-1.5 text-center backdrop-blur min-w-[78px]">
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
                    {/* Temporary Password Section */}
                    {hasChangedPassword ? (
                        // Student has already changed their password
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <Check
                                        size={16}
                                        className="text-green-600"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-800">
                                        Password Changed
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        This student has set their own password
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : temporaryPassword ? (
                        // Student has a temporary password
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <p className="text-xs font-semibold text-emerald-800">
                                        Temporary Password
                                    </p>
                                    <p className="text-xs text-emerald-600">
                                        Share this password with the student for
                                        initial login
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-1 rounded-lg bg-white border border-emerald-300 px-2.5 py-1">
                                        <span className="font-mono text-sm font-semibold text-gray-900 tracking-wide">
                                            {showPassword
                                                ? temporaryPassword
                                                : "••••••••••••"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="p-0.5 text-gray-500 hover:text-gray-700 transition"
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff size={15} />
                                            ) : (
                                                <Eye size={15} />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCopyPassword}
                                            className="p-0.5 text-gray-500 hover:text-gray-700 transition"
                                            aria-label="Copy password"
                                        >
                                            {copied ? (
                                                <Check
                                                    size={15}
                                                    className="text-green-600"
                                                />
                                            ) : (
                                                <Copy size={15} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // No temporary password available
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Eye size={16} className="text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-amber-800">
                                        No Temporary Password
                                    </p>
                                    <p className="text-xs text-amber-600">
                                        This student account was created without
                                        a temporary password
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Meta Information Grid */}
                    <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                        {metaItems.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-lg border border-gray-100 bg-gray-50/70 p-2"
                            >
                                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                                    {item.label}
                                </p>
                                <p className="mt-0.5 text-xs font-semibold text-gray-900 truncate">
                                    {item.value || "—"}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Grades Overview */}
                    {currentCategories.length > 0 && (
                        <div className="rounded-lg border border-gray-100 p-2.5">
                            <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-2">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">
                                        Grades Overview
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Breakdown by assessment category
                                    </p>
                                </div>

                                {/* Quarter Toggle */}
                                <div className="flex items-center gap-2 ml-auto">
                                    <span className="text-xs font-medium text-gray-500">
                                        Quarter:
                                    </span>
                                    <div className="flex items-center p-0.5 bg-gray-100 rounded-lg">
                                        <button
                                            onClick={() =>
                                                setSelectedQuarter(1)
                                            }
                                            className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                                                selectedQuarter === 1
                                                    ? "bg-white text-indigo-700 shadow-sm"
                                                    : "text-gray-600 hover:bg-gray-200"
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
                                                    ? "bg-white text-indigo-700 shadow-sm"
                                                    : !q1Finished
                                                      ? "text-gray-400 cursor-not-allowed"
                                                      : "text-gray-600 hover:bg-gray-200"
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
                                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600"
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

                            <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-100">
                                <table className="min-w-full divide-y divide-gray-200 text-left">
                                    <thead className="bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500 sticky top-0">
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
                                    <tbody className="divide-y divide-gray-100 bg-white text-sm text-gray-700">
                                        {currentCategories.every(
                                            (cat) =>
                                                !cat.tasks ||
                                                cat.tasks.length === 0,
                                        ) && (
                                            <tr>
                                                <td
                                                    className="px-3 py-4 text-center text-gray-400"
                                                    colSpan={3}
                                                >
                                                    No assignments defined for
                                                    this class yet.
                                                </td>
                                            </tr>
                                        )}
                                        {currentCategories.map((category) => {
                                            const tasks = category.tasks ?? [];
                                            if (tasks.length === 0) return null;

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
                                                (category.weight ?? 0) * 100,
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
                                                    quarterGrades[task.id];
                                                if (
                                                    val !== undefined &&
                                                    val !== null &&
                                                    val !== ""
                                                ) {
                                                    catScore += Number(val);
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
                                                    <tr className="bg-gray-50/90">
                                                        <td
                                                            colSpan={3}
                                                            className="px-3 py-2"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold text-gray-900">
                                                                    {shortLabel}{" "}
                                                                    <span className="font-normal text-gray-500">
                                                                        —{" "}
                                                                        {
                                                                            category.label
                                                                        }
                                                                    </span>
                                                                    <span className="ml-1 text-xs text-gray-500">
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
                                                    {tasks.map((task) => {
                                                        const score =
                                                            quarterGrades[
                                                                task.id
                                                            ];
                                                        return (
                                                            <tr key={task.id}>
                                                                <td className="px-3 py-1.5 pl-6 text-gray-600">
                                                                    {task.label}
                                                                </td>
                                                                <td className="px-3 py-1.5 text-right font-semibold text-indigo-600">
                                                                    {score !==
                                                                        undefined &&
                                                                    score !==
                                                                        null &&
                                                                    score !== ""
                                                                        ? score
                                                                        : "—"}
                                                                </td>
                                                                <td className="px-3 py-1.5 text-right text-gray-500">
                                                                    {task.total}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}
                                        {currentCategories.some(
                                            (cat) =>
                                                cat.tasks &&
                                                cat.tasks.length > 0,
                                        ) && (
                                            <>
                                                <tr className="bg-gray-50/80 text-gray-900">
                                                    <td className="px-3 py-2 font-semibold">
                                                        Q{selectedQuarter} Grade
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 text-right font-semibold text-indigo-700"
                                                        colSpan={2}
                                                    >
                                                        {quarterlyGrade}
                                                    </td>
                                                </tr>
                                                <tr className="bg-indigo-50/50 text-gray-900">
                                                    <td className="px-3 py-2 font-semibold">
                                                        Expected Q
                                                        {selectedQuarter} Grade
                                                        <span className="ml-2 text-xs font-normal text-gray-500">
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
                                                <tr className="bg-indigo-100/70 text-gray-900">
                                                    <td className="px-3 py-2 font-bold">
                                                        Final Grade
                                                        <span className="ml-2 text-xs font-normal text-gray-500">
                                                            (Q1 + Q2 Average)
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
                </div>

                {/* Footer */}
                <div className="flex justify-end bg-gray-50 px-3 py-2.5 border-t border-gray-100 flex-shrink-0">
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

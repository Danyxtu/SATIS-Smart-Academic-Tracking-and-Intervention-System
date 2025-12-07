import React, { useState } from "react";
import { X, Eye, EyeOff, Copy, Check } from "lucide-react";

const StudentStatusModal = ({
    student,
    assignments = [],
    gradeCategories = [],
    calculateFinalGrade,
    calculateExpectedQuarterlyGrade,
    calculateOverallFinalGrade,
    hasQuarterlyExamScores,
    onClose,
    tempPassword = null, // Optional: Only passed when a new student is created
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedQuarter, setSelectedQuarter] = useState(1);

    if (!student) return null;

    // Check if Q1 is finished (has quarterly exam scores)
    const q1Finished = hasQuarterlyExamScores
        ? hasQuarterlyExamScores(student.grades, gradeCategories, 1)
        : false;

    // Calculate grades for the selected quarter
    const quarterlyGrade =
        hasQuarterlyExamScores &&
        hasQuarterlyExamScores(student.grades, gradeCategories, selectedQuarter)
            ? calculateFinalGrade(
                  student.grades,
                  gradeCategories,
                  selectedQuarter
              )
            : "—";
    const expectedGrade = calculateExpectedQuarterlyGrade
        ? calculateExpectedQuarterlyGrade(
              student.grades,
              gradeCategories,
              selectedQuarter
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
        if (tempPassword) {
            navigator.clipboard.writeText(tempPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-4 overflow-y-auto">
            <div className="relative w-full max-w-4xl my-4 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
                {/* Close button - fixed position, always visible */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gray-600 shadow-lg transition hover:bg-white hover:text-gray-900"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white flex-shrink-0">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pr-8">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 overflow-hidden rounded-xl border border-white/40 bg-white/20 flex items-center justify-center text-xl font-semibold flex-shrink-0">
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
                                <h2 className="text-xl sm:text-2xl font-bold truncate">
                                    {student.name}
                                </h2>
                                <p className="text-sm text-white/80">
                                    {student.grade_level || ""}{" "}
                                    {student.section
                                        ? `• ${student.section}`
                                        : ""}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 flex-shrink-0 flex-wrap">
                            <div className="rounded-xl bg-white/20 px-4 py-3 text-center backdrop-blur">
                                <p className="text-xs uppercase tracking-wide text-white/70">
                                    Q{selectedQuarter} Grade
                                </p>
                                <p className="text-2xl font-semibold">
                                    {quarterlyGrade}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white/20 px-4 py-3 text-center backdrop-blur">
                                <p className="text-xs uppercase tracking-wide text-white/70">
                                    Expected Q{selectedQuarter}
                                </p>
                                <p className="text-2xl font-semibold text-yellow-200">
                                    {expectedGrade}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white/20 px-4 py-3 text-center backdrop-blur">
                                <p className="text-xs uppercase tracking-wide text-white/70">
                                    Final Grade
                                </p>
                                <p className="text-2xl font-semibold">
                                    {finalGrade}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white/20 px-4 py-3 text-center backdrop-blur">
                                <p className="text-xs uppercase tracking-wide text-white/70">
                                    Activities
                                </p>
                                <p className="text-2xl font-semibold">
                                    {assignments.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Temporary Password Section - Only shown when tempPassword is provided (new student) */}
                    {tempPassword && (
                        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">
                                        Temporary Password
                                    </p>
                                    <p className="text-xs text-emerald-600">
                                        Share this password with the student for
                                        initial login
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 rounded-lg bg-white border border-emerald-300 px-4 py-2">
                                        <span className="font-mono text-lg font-semibold text-gray-900 tracking-wider">
                                            {showPassword
                                                ? tempPassword
                                                : "••••••••••••"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="p-1 text-gray-500 hover:text-gray-700 transition"
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCopyPassword}
                                            className="p-1 text-gray-500 hover:text-gray-700 transition"
                                            aria-label="Copy password"
                                        >
                                            {copied ? (
                                                <Check
                                                    size={18}
                                                    className="text-green-600"
                                                />
                                            ) : (
                                                <Copy size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Meta Information Grid */}
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                        {metaItems.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl border border-gray-100 bg-gray-50/70 p-3"
                            >
                                <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                                    {item.label}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-gray-900 truncate">
                                    {item.value || "—"}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Grades Overview */}
                    {gradeCategories.length > 0 && (
                        <div className="rounded-xl border border-gray-100 p-4">
                            <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
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

                            <div className="flex flex-wrap gap-2 mt-3 mb-3">
                                {gradeCategories.map((category) => (
                                    <span
                                        key={category.id}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                        {category.label} (
                                        {Math.round(
                                            (category.weight ?? 0) * 100
                                        )}
                                        %)
                                    </span>
                                ))}
                            </div>

                            <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-gray-100">
                                <table className="min-w-full divide-y divide-gray-200 text-left">
                                    <thead className="bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2">
                                                Category
                                            </th>
                                            <th className="px-3 py-2">
                                                Activity
                                            </th>
                                            <th className="px-3 py-2">Score</th>
                                            <th className="px-3 py-2">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white text-sm text-gray-700">
                                        {assignments.length === 0 && (
                                            <tr>
                                                <td
                                                    className="px-3 py-4 text-center text-gray-400"
                                                    colSpan={4}
                                                >
                                                    No assignments defined for
                                                    this class yet.
                                                </td>
                                            </tr>
                                        )}
                                        {assignments.map((assign) => (
                                            <tr key={assign.id}>
                                                <td className="px-3 py-2 font-semibold text-gray-900">
                                                    {assign.category_label}
                                                    {assign.category_weight !==
                                                        undefined && (
                                                        <span className="ml-1 text-xs text-gray-500">
                                                            (
                                                            {Math.round(
                                                                (assign.category_weight ??
                                                                    0) * 100
                                                            )}
                                                            %)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-gray-600">
                                                    {assign.label}
                                                </td>
                                                <td className="px-3 py-2 font-semibold text-indigo-600">
                                                    {student.grades?.[
                                                        assign.id
                                                    ] ?? "—"}
                                                </td>
                                                <td className="px-3 py-2 text-gray-500">
                                                    {assign.total}
                                                </td>
                                            </tr>
                                        ))}
                                        {assignments.length > 0 && (
                                            <>
                                                <tr className="bg-gray-50/80 text-gray-900">
                                                    <td
                                                        className="px-3 py-2 font-semibold"
                                                        colSpan={3}
                                                    >
                                                        Q{selectedQuarter} Grade
                                                    </td>
                                                    <td className="px-3 py-2 font-semibold text-indigo-700">
                                                        {quarterlyGrade}
                                                    </td>
                                                </tr>
                                                <tr className="bg-indigo-50/50 text-gray-900">
                                                    <td
                                                        className="px-3 py-2 font-semibold"
                                                        colSpan={3}
                                                    >
                                                        Expected Q
                                                        {selectedQuarter} Grade
                                                        <span className="ml-2 text-xs font-normal text-gray-500">
                                                            (Projected)
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 font-semibold text-amber-600">
                                                        {expectedGrade}
                                                    </td>
                                                </tr>
                                                <tr className="bg-indigo-100/70 text-gray-900">
                                                    <td
                                                        className="px-3 py-2 font-bold"
                                                        colSpan={3}
                                                    >
                                                        Final Grade
                                                        <span className="ml-2 text-xs font-normal text-gray-500">
                                                            (Q1 + Q2 Average)
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 font-bold text-indigo-800">
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
                <div className="flex justify-end bg-gray-50 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentStatusModal;

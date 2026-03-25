import React from "react";
import {
    X,
    Copy,
    CheckCircle2,
    Users,
    UserPlus,
    UserCheck,
} from "lucide-react";

const BulkStudentImportSummaryModal = ({ summary, onClose }) => {
    if (!summary) return null;

    const newlyCreated = Number(summary.newly_created ?? summary.imported ?? 0);
    const assignedExisting = Number(summary.assigned_existing ?? 0);
    const alreadyEnrolled = Number(summary.already_enrolled ?? 0);
    const skipped = Number(summary.skipped ?? 0);
    const errors = Array.isArray(summary.errors) ? summary.errors : [];

    const newStudents = Array.isArray(summary.newly_created_students)
        ? summary.newly_created_students
        : Array.isArray(summary.created_students)
          ? summary.created_students
          : [];

    const existingStudents = Array.isArray(summary.assigned_existing_students)
        ? summary.assigned_existing_students
        : [];

    const alreadyEnrolledStudents = Array.isArray(
        summary.already_enrolled_students,
    )
        ? summary.already_enrolled_students
        : [];

    const copyPassword = async (password) => {
        if (!password) return;
        await navigator.clipboard.writeText(password);
    };

    const renderStudentList = (title, icon, students, showPassword = false) => {
        if (!students.length) return null;

        return (
            <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center gap-2">
                    {icon}
                    <p className="text-sm font-semibold text-gray-800">
                        {title}
                    </p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {students.length}
                    </span>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                    {students.map((student, index) => (
                        <div
                            key={`${student?.lrn ?? "no-lrn"}-${index}`}
                            className="rounded-md border border-gray-100 bg-gray-50 p-2"
                        >
                            <p className="text-sm font-medium text-gray-900">
                                {student?.name || student?.email || "Student"}
                            </p>
                            <p className="text-xs text-gray-600">
                                LRN: {student?.lrn || "N/A"}
                            </p>
                            {showPassword && student?.password && (
                                <div className="mt-1 flex items-center gap-2">
                                    <code className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-900">
                                        {student.password}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            copyPassword(student.password)
                                        }
                                        className="rounded p-1 text-indigo-600 hover:bg-indigo-100"
                                        title="Copy password"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b px-6 py-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Bulk Student Import Summary
                        </h3>
                        <p className="text-sm text-gray-600">
                            Each row was checked by LRN and either assigned or
                            created.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid gap-3 border-b bg-gray-50 px-6 py-4 sm:grid-cols-4">
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Newly Created</p>
                        <p className="text-lg font-bold text-emerald-700">
                            {newlyCreated}
                        </p>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-xs text-gray-500">
                            Assigned Existing
                        </p>
                        <p className="text-lg font-bold text-blue-700">
                            {assignedExisting}
                        </p>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-xs text-gray-500">
                            Already Enrolled
                        </p>
                        <p className="text-lg font-bold text-amber-700">
                            {alreadyEnrolled}
                        </p>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Skipped</p>
                        <p className="text-lg font-bold text-rose-700">
                            {skipped}
                        </p>
                    </div>
                </div>

                <div className="max-h-[60vh] space-y-3 overflow-y-auto px-6 py-4">
                    {renderStudentList(
                        "Newly Created Accounts",
                        <UserPlus size={16} className="text-emerald-600" />,
                        newStudents,
                        true,
                    )}

                    {renderStudentList(
                        "Existing Students Assigned",
                        <UserCheck size={16} className="text-blue-600" />,
                        existingStudents,
                    )}

                    {renderStudentList(
                        "Students Already In Class",
                        <Users size={16} className="text-amber-600" />,
                        alreadyEnrolledStudents,
                    )}

                    {errors.length > 0 && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                            <div className="mb-2 flex items-center gap-2">
                                <CheckCircle2
                                    size={16}
                                    className="text-rose-600"
                                />
                                <p className="text-sm font-semibold text-rose-800">
                                    Skipped Rows / Errors ({errors.length})
                                </p>
                            </div>
                            <ul className="list-disc space-y-1 pl-5 text-xs text-rose-700">
                                {errors.map((error, index) => (
                                    <li key={`import-error-${index}`}>
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkStudentImportSummaryModal;

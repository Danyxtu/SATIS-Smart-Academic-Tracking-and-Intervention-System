import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import DeleteConfirmModal from "@/Components/Superadmin/DeleteConfirmModal";
import AddSectionWizardModal from "@/Components/Superadmin/AcademicManagement/AddSectionWizardModal";
import {
    BookOpen,
    Building2,
    Layers,
    Search,
    School,
    Users,
    X,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function FieldError({ message }) {
    if (!message) return null;

    return <p className="mt-1.5 text-xs text-rose-600">{message}</p>;
}

function SectionFormModal({
    isOpen,
    mode,
    data,
    setData,
    errors,
    processing,
    onClose,
    onSubmit,
    departments = [],
}) {
    if (!isOpen) {
        return null;
    }

    const isEdit = mode === "edit";

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-4">
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative max-h-[calc(100vh-1rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 sm:max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-200">
                            <Layers size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                {isEdit ? "Edit Section" : "Add Section"}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {isEdit
                                    ? "Update section details across departments"
                                    : "Create a new section record"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={onSubmit}>
                    <div className="space-y-3 px-4 py-4 sm:space-y-4 sm:px-6 sm:py-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Department{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.department_id}
                                    onChange={(event) => {
                                        const selectedDepartmentId =
                                            event.target.value;
                                        const selectedDepartment =
                                            departments.find(
                                                (department) =>
                                                    String(department.id) ===
                                                    selectedDepartmentId,
                                            ) || null;

                                        setData(
                                            "department_id",
                                            selectedDepartmentId,
                                        );

                                        if (
                                            !data.strand &&
                                            selectedDepartment
                                        ) {
                                            setData(
                                                "strand",
                                                selectedDepartment.department_code ||
                                                    "",
                                            );
                                        }
                                    }}
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.department_id
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                >
                                    <option value="">Select department</option>
                                    {departments.map((department) => (
                                        <option
                                            key={department.id}
                                            value={department.id}
                                        >
                                            {department.department_code} -{" "}
                                            {department.department_name}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={errors.department_id} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Section Name{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.section_name}
                                    onChange={(event) =>
                                        setData(
                                            "section_name",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g., 11 ABM Einstein"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.section_name
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                <FieldError message={errors.section_name} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Section Code
                                </label>
                                <input
                                    type="text"
                                    value={data.section_code}
                                    onChange={(event) =>
                                        setData(
                                            "section_code",
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="Auto-generated if empty"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.section_code
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                <FieldError message={errors.section_code} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Cohort{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.cohort}
                                    onChange={(event) =>
                                        setData("cohort", event.target.value)
                                    }
                                    placeholder="e.g., 2026"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.cohort
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                <FieldError message={errors.cohort} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Grade Level
                                </label>
                                <input
                                    type="text"
                                    value={data.grade_level}
                                    onChange={(event) =>
                                        setData(
                                            "grade_level",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g., Grade 11"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.grade_level
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                <FieldError message={errors.grade_level} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Strand
                                </label>
                                <input
                                    type="text"
                                    value={data.strand}
                                    onChange={(event) =>
                                        setData("strand", event.target.value)
                                    }
                                    placeholder="e.g., ABM"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.strand
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                <FieldError message={errors.strand} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Track
                                </label>
                                <input
                                    type="text"
                                    value={data.track}
                                    onChange={(event) =>
                                        setData("track", event.target.value)
                                    }
                                    placeholder="e.g., Academic"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.track
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                <FieldError message={errors.track} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    School Year
                                </label>
                                <input
                                    type="text"
                                    value={data.school_year}
                                    onChange={(event) =>
                                        setData(
                                            "school_year",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g., 2026-2027"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.school_year
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                <FieldError message={errors.school_year} />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Description
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(event) =>
                                    setData("description", event.target.value)
                                }
                                rows={3}
                                placeholder="Optional section notes"
                                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                    errors.description
                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                }`}
                            />
                            <FieldError message={errors.description} />
                        </div>

                        <label className="inline-flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={Boolean(data.is_active)}
                                onChange={(event) =>
                                    setData("is_active", event.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Section is active and available for class
                            assignments
                        </label>
                        <FieldError message={errors.is_active} />
                    </div>

                    <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
                        >
                            {processing && (
                                <svg
                                    className="h-3.5 w-3.5 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8z"
                                    />
                                </svg>
                            )}
                            {isEdit ? "Save Changes" : "Create Section"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ClassFormModal({
    isOpen,
    mode,
    data,
    setData,
    errors,
    processing,
    onClose,
    onSubmit,
    sectionOptions = [],
    subjects = [],
    teachers = [],
    colorOptions = [],
}) {
    if (!isOpen) {
        return null;
    }

    const isEdit = mode === "edit";

    const selectedSection = useMemo(
        () =>
            sectionOptions.find(
                (section) => String(section.id) === String(data.section_id),
            ) || null,
        [sectionOptions, data.section_id],
    );

    const availableTeachers = useMemo(() => {
        if (!selectedSection) {
            return [];
        }

        return teachers.filter(
            (teacher) =>
                Number(teacher.department_id) ===
                Number(selectedSection.department_id),
        );
    }, [teachers, selectedSection]);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-4">
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative max-h-[calc(100vh-1rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 sm:max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 ring-1 ring-violet-200">
                            <BookOpen size={16} className="text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                {isEdit ? "Edit Class" : "Add Class"}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {isEdit
                                    ? "Update subject, section, and teacher assignment"
                                    : "Create a class for a selected section"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={onSubmit}>
                    <div className="space-y-3 px-4 py-4 sm:space-y-4 sm:px-6 sm:py-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Section{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.section_id}
                                    onChange={(event) => {
                                        const nextSectionId =
                                            event.target.value;
                                        setData("section_id", nextSectionId);

                                        const nextSection =
                                            sectionOptions.find(
                                                (section) =>
                                                    String(section.id) ===
                                                    nextSectionId,
                                            ) || null;

                                        const currentTeacher =
                                            teachers.find(
                                                (teacher) =>
                                                    String(teacher.id) ===
                                                    String(data.teacher_id),
                                            ) || null;

                                        if (
                                            nextSection &&
                                            currentTeacher &&
                                            Number(
                                                currentTeacher.department_id,
                                            ) !==
                                                Number(
                                                    nextSection.department_id,
                                                )
                                        ) {
                                            setData("teacher_id", "");
                                        }
                                    }}
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.section_id
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-violet-500 focus:ring-violet-100"
                                    }`}
                                >
                                    <option value="">Select section</option>
                                    {sectionOptions.map((section) => (
                                        <option
                                            key={section.id}
                                            value={section.id}
                                        >
                                            {section.section_name} (
                                            {section.section_code || "-"}) -{" "}
                                            {section.department
                                                ?.department_code || "N/A"}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={errors.section_id} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Subject{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.subject_id}
                                    onChange={(event) =>
                                        setData(
                                            "subject_id",
                                            event.target.value,
                                        )
                                    }
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.subject_id
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-violet-500 focus:ring-violet-100"
                                    }`}
                                >
                                    <option value="">Select subject</option>
                                    {subjects.map((subject) => (
                                        <option
                                            key={subject.id}
                                            value={subject.id}
                                        >
                                            {subject.subject_code || "-"} -{" "}
                                            {subject.subject_name}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={errors.subject_id} />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Teacher <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.teacher_id}
                                onChange={(event) =>
                                    setData("teacher_id", event.target.value)
                                }
                                disabled={!selectedSection}
                                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                                    errors.teacher_id
                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                        : "border-slate-300 bg-white focus:border-violet-500 focus:ring-violet-100"
                                }`}
                            >
                                <option value="">
                                    {selectedSection
                                        ? "Select teacher"
                                        : "Select section first"}
                                </option>
                                {availableTeachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>
                                ))}
                            </select>
                            <FieldError message={errors.teacher_id} />
                            {selectedSection &&
                                availableTeachers.length === 0 && (
                                    <p className="mt-1.5 text-xs text-amber-600">
                                        No teacher found for this section's
                                        department.
                                    </p>
                                )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    School Year{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.school_year}
                                    onChange={(event) =>
                                        setData(
                                            "school_year",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g., 2026-2027"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.school_year
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-violet-500 focus:ring-violet-100"
                                    }`}
                                />
                                <FieldError message={errors.school_year} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Color Tag
                                </label>
                                <select
                                    value={data.color}
                                    onChange={(event) =>
                                        setData("color", event.target.value)
                                    }
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                        errors.color
                                            ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                            : "border-slate-300 bg-white focus:border-violet-500 focus:ring-violet-100"
                                    }`}
                                >
                                    {colorOptions.map((color) => (
                                        <option key={color} value={color}>
                                            {color.charAt(0).toUpperCase() +
                                                color.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={errors.color} />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-700 disabled:opacity-60 sm:w-auto"
                        >
                            {processing && (
                                <svg
                                    className="h-3.5 w-3.5 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8z"
                                    />
                                </svg>
                            )}
                            {isEdit ? "Save Changes" : "Create Class"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, accent = "emerald" }) {
    const accents = {
        emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
        blue: "bg-blue-50 text-blue-600 ring-blue-200",
        violet: "bg-violet-50 text-violet-600 ring-violet-200",
    };

    return (
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accents[accent]}`}
            >
                <Icon size={17} />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">
                    {value}
                </p>
            </div>
        </div>
    );
}

function Pagination({ links = [] }) {
    if (!Array.isArray(links) || links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1 border-t border-slate-200 px-4 py-3">
            {links.map((link, index) => {
                const isDisabled = !link.url;

                if (isDisabled) {
                    return (
                        <span
                            key={`${link.label}-${index}`}
                            className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-400"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                }

                return (
                    <Link
                        key={`${link.label}-${link.url}`}
                        href={link.url}
                        className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                            link.active
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </div>
    );
}

export default function Index({
    tab = "sections",
    sections,
    classes,
    departments = [],
    availableStudents = [],
    sectionOptions = [],
    subjects = [],
    teachers = [],
    currentSchoolYear = "",
    colorOptions = [],
    filters,
    stats,
}) {
    const { flash } = usePage().props;

    const resolvedColorOptions = useMemo(
        () =>
            Array.isArray(colorOptions) && colorOptions.length > 0
                ? colorOptions
                : ["indigo", "blue", "red", "green", "amber", "purple", "teal"],
        [colorOptions],
    );

    const defaultSectionState = useMemo(
        () => ({
            department_id: "",
            section_name: "",
            section_code: "",
            cohort: String(new Date().getFullYear()),
            grade_level: "",
            strand: "",
            track: "",
            school_year: currentSchoolYear || "",
            description: "",
            is_active: true,
        }),
        [currentSchoolYear],
    );

    const defaultClassState = useMemo(
        () => ({
            subject_id: "",
            section_id: "",
            teacher_id: "",
            school_year: currentSchoolYear || "",
            color: resolvedColorOptions[0],
        }),
        [currentSchoolYear, resolvedColorOptions],
    );

    const [activeTab, setActiveTab] = useState(
        filters?.tab || tab || "sections",
    );
    const [search, setSearch] = useState(filters?.search || "");
    const [departmentId, setDepartmentId] = useState(
        filters?.department_id ? String(filters.department_id) : "",
    );

    const [showSectionWizard, setShowSectionWizard] = useState(false);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [sectionToEdit, setSectionToEdit] = useState(null);

    const [showClassModal, setShowClassModal] = useState(false);
    const [classModalMode, setClassModalMode] = useState("create");
    const [classToEdit, setClassToEdit] = useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const {
        data: sectionData,
        setData: setSectionData,
        put: putSection,
        processing: sectionProcessing,
        errors: sectionErrors,
        clearErrors: clearSectionErrors,
    } = useForm(defaultSectionState);

    const {
        data: classData,
        setData: setClassData,
        post: postClass,
        put: putClass,
        processing: classProcessing,
        errors: classErrors,
        reset: resetClass,
        clearErrors: clearClassErrors,
    } = useForm(defaultClassState);

    const sectionRows = sections?.data || [];
    const classRows = classes?.data || [];

    const currentStats = useMemo(
        () => ({
            departmentsCount: Number(stats?.departments_count || 0),
            sectionsCount: Number(stats?.sections_count || 0),
            classesCount: Number(stats?.classes_count || 0),
        }),
        [stats],
    );

    useEffect(() => {
        setActiveTab(filters?.tab || tab || "sections");
    }, [filters?.tab, tab]);

    useEffect(() => {
        setSearch(filters?.search || "");
        setDepartmentId(
            filters?.department_id ? String(filters.department_id) : "",
        );
    }, [filters?.search, filters?.department_id]);

    useEffect(() => {
        if (!classData.section_id || !classData.teacher_id) {
            return;
        }

        const selectedSection = sectionOptions.find(
            (section) => String(section.id) === String(classData.section_id),
        );
        const selectedTeacher = teachers.find(
            (teacher) => String(teacher.id) === String(classData.teacher_id),
        );

        if (!selectedSection || !selectedTeacher) {
            setClassData("teacher_id", "");
            return;
        }

        if (
            Number(selectedTeacher.department_id) !==
            Number(selectedSection.department_id)
        ) {
            setClassData("teacher_id", "");
        }
    }, [
        classData.section_id,
        classData.teacher_id,
        sectionOptions,
        teachers,
        setClassData,
    ]);

    const goToIndex = (
        nextTab,
        nextSearch = search,
        nextDepartmentId = departmentId,
    ) => {
        const payload = {
            tab: nextTab,
            search: nextSearch || undefined,
            department_id: nextDepartmentId || undefined,
        };

        router.get(route("superadmin.academic-management.index"), payload, {
            preserveState: true,
            replace: true,
        });
    };

    const handleTabSwitch = (nextTab) => {
        if (nextTab === activeTab) {
            return;
        }

        setActiveTab(nextTab);
        goToIndex(nextTab);
    };

    const handleSearch = (event) => {
        event.preventDefault();
        goToIndex(activeTab, search, departmentId);
    };

    const clearFilters = () => {
        setSearch("");
        setDepartmentId("");
        goToIndex(activeTab, "", "");
    };

    const openCreateSectionWizard = () => {
        setShowSectionWizard(true);
    };

    const closeSectionWizard = () => {
        setShowSectionWizard(false);
    };

    const openEditSectionModal = (section) => {
        setSectionToEdit(section);
        clearSectionErrors();
        setSectionData({
            department_id: section.department_id
                ? String(section.department_id)
                : "",
            section_name: section.section_name || "",
            section_code: section.section_code || "",
            cohort: section.cohort || "",
            grade_level: section.grade_level || "",
            strand: section.strand || "",
            track: section.track || "",
            school_year: section.school_year || currentSchoolYear || "",
            description: section.description || "",
            is_active: Boolean(section.is_active),
        });
        setShowSectionModal(true);
    };

    const closeSectionModal = () => {
        setShowSectionModal(false);
        setSectionToEdit(null);
        clearSectionErrors();
    };

    const handleSectionSubmit = (event) => {
        event.preventDefault();

        if (!sectionToEdit) {
            return;
        }

        putSection(
            route(
                "superadmin.academic-management.sections.update",
                sectionToEdit.id,
            ),
            {
                preserveScroll: true,
                onSuccess: closeSectionModal,
            },
        );
    };

    const sectionCreateSummary = flash?.section_create_summary || null;

    const assignedStudentsSummary = Array.isArray(
        sectionCreateSummary?.assigned_existing_students,
    )
        ? sectionCreateSummary.assigned_existing_students
        : [];

    const createdStudentsSummary = Array.isArray(
        sectionCreateSummary?.created_students,
    )
        ? sectionCreateSummary.created_students
        : [];

    const handleClassSubmit = (event) => {
        event.preventDefault();

        if (classModalMode === "edit" && classToEdit) {
            putClass(
                route(
                    "superadmin.academic-management.classes.update",
                    classToEdit.id,
                ),
                {
                    preserveScroll: true,
                    onSuccess: closeClassModal,
                },
            );
            return;
        }

        postClass(route("superadmin.academic-management.classes.store"), {
            preserveScroll: true,
            onSuccess: closeClassModal,
        });
    };

    const openCreateClassModal = () => {
        setClassModalMode("create");
        setClassToEdit(null);
        clearClassErrors();
        resetClass();
        setClassData({ ...defaultClassState });
        setShowClassModal(true);
    };

    const openEditClassModal = (item) => {
        setClassModalMode("edit");
        setClassToEdit(item);
        clearClassErrors();
        setClassData({
            subject_id: item.subject_id ? String(item.subject_id) : "",
            section_id: item.section_id ? String(item.section_id) : "",
            teacher_id: item.teacher_id ? String(item.teacher_id) : "",
            school_year: item.school_year || currentSchoolYear || "",
            color: item.color || resolvedColorOptions[0],
        });
        setShowClassModal(true);
    };

    const closeClassModal = () => {
        setShowClassModal(false);
        setClassToEdit(null);
        clearClassErrors();
    };

    const openDeleteModal = (type, item) => {
        setDeleteTarget({ type, item });
    };

    const handleDelete = () => {
        if (!deleteTarget?.item?.id) {
            return;
        }

        const destroyRoute =
            deleteTarget.type === "section"
                ? route(
                      "superadmin.academic-management.sections.destroy",
                      deleteTarget.item.id,
                  )
                : route(
                      "superadmin.academic-management.classes.destroy",
                      deleteTarget.item.id,
                  );

        router.delete(destroyRoute, {
            preserveScroll: true,
            onStart: () => setDeleteProcessing(true),
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleteProcessing(false),
        });
    };

    const deleteTitle =
        deleteTarget?.type === "section" ? "Delete Section" : "Delete Class";

    const deleteItemName = useMemo(() => {
        if (!deleteTarget?.item) {
            return "";
        }

        if (deleteTarget.type === "section") {
            const code = deleteTarget.item.section_code || "-";
            return `${deleteTarget.item.section_name} (${code})`;
        }

        const subject =
            deleteTarget.item.subject_code ||
            deleteTarget.item.subject_name ||
            "Unknown Subject";
        const section =
            deleteTarget.item.section_code ||
            deleteTarget.item.section_name ||
            "Unknown Section";

        return `${subject} - ${section}`;
    }, [deleteTarget]);

    const deleteDescription =
        deleteTarget?.type === "section"
            ? "This will permanently remove the section record. If students or classes are still linked, deletion will be blocked."
            : "This will permanently remove the class record. Classes with enrollments cannot be deleted.";

    return (
        <>
            <Head title="Academic Management" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Academic Management
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            SuperAdmin view of sections and classes across all
                            departments.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            activeTab === "sections"
                                ? openCreateSectionWizard()
                                : openCreateClassModal()
                        }
                        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:w-auto"
                    >
                        <Plus size={16} />
                        {activeTab === "sections" ? "Add Section" : "Add Class"}
                    </button>
                </div>

                {sectionCreateSummary && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-800">
                            Section created: {sectionCreateSummary.section_name}{" "}
                            ({sectionCreateSummary.section_code})
                        </p>
                        <p className="mt-1 text-xs text-emerald-700">
                            Department: {sectionCreateSummary.department_code} -{" "}
                            {sectionCreateSummary.department_name} | Grade:{" "}
                            {sectionCreateSummary.grade_level} | Cohort:{" "}
                            {sectionCreateSummary.cohort} | School Year:{" "}
                            {sectionCreateSummary.school_year}
                        </p>
                        <p className="mt-1 text-xs text-emerald-700">
                            Existing assigned:{" "}
                            {sectionCreateSummary.existing_assigned_count} | New
                            students created:{" "}
                            {sectionCreateSummary.new_students_created_count} |
                            Total: {sectionCreateSummary.total_students}
                        </p>

                        {(assignedStudentsSummary.length > 0 ||
                            createdStudentsSummary.length > 0) && (
                            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                                <div className="rounded-xl border border-emerald-100 bg-white/70 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                                        Assigned Existing Students (
                                        {assignedStudentsSummary.length})
                                    </p>
                                    <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                                        {assignedStudentsSummary.length ===
                                        0 ? (
                                            <p className="text-xs text-emerald-700">
                                                No existing students were
                                                assigned.
                                            </p>
                                        ) : (
                                            assignedStudentsSummary.map(
                                                (student) => (
                                                    <p
                                                        key={`assigned-${student.id}-${student.lrn || "none"}`}
                                                        className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-900"
                                                    >
                                                        {student.student_name} (
                                                        {student.lrn || "-"})
                                                        {student.previous_section
                                                            ? ` from ${student.previous_section}`
                                                            : ""}
                                                    </p>
                                                ),
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-emerald-100 bg-white/70 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                                        Newly Created Students (
                                        {createdStudentsSummary.length})
                                    </p>
                                    <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                                        {createdStudentsSummary.length === 0 ? (
                                            <p className="text-xs text-emerald-700">
                                                No new student accounts were
                                                created.
                                            </p>
                                        ) : (
                                            createdStudentsSummary.map(
                                                (student) => (
                                                    <p
                                                        key={`created-${student.id}-${student.lrn || "none"}`}
                                                        className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-900"
                                                    >
                                                        {student.student_name} (
                                                        {student.lrn || "-"})
                                                        {student.personal_email
                                                            ? ` • ${student.personal_email}`
                                                            : ""}
                                                    </p>
                                                ),
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatCard
                        icon={Building2}
                        label="Departments"
                        value={currentStats.departmentsCount}
                        accent="emerald"
                    />
                    <StatCard
                        icon={Layers}
                        label="Sections"
                        value={currentStats.sectionsCount}
                        accent="blue"
                    />
                    <StatCard
                        icon={BookOpen}
                        label="Classes"
                        value={currentStats.classesCount}
                        accent="violet"
                    />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="grid w-full grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:inline-flex sm:w-auto">
                            <button
                                type="button"
                                onClick={() => handleTabSwitch("sections")}
                                className={`w-full rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                                    activeTab === "sections"
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-600 hover:bg-white"
                                }`}
                            >
                                Section Management
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTabSwitch("classes")}
                                className={`w-full rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                                    activeTab === "classes"
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-600 hover:bg-white"
                                }`}
                            >
                                Class Management
                            </button>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSearch}
                        className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-12"
                    >
                        <div className="relative md:col-span-6">
                            <Search
                                size={15}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                placeholder={
                                    activeTab === "sections"
                                        ? "Search section, strand, cohort, department..."
                                        : "Search class, subject, teacher, department..."
                                }
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="md:col-span-4">
                            <select
                                value={departmentId}
                                onChange={(event) =>
                                    setDepartmentId(event.target.value)
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="">All Departments</option>
                                {departments.map((department) => (
                                    <option
                                        key={department.id}
                                        value={department.id}
                                    >
                                        {department.department_code} -{" "}
                                        {department.department_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2 md:col-span-2">
                            <button
                                type="submit"
                                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </div>

                {activeTab === "sections" ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 md:grid">
                            <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Section
                            </div>
                            <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Department
                            </div>
                            <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Cohort
                            </div>
                            <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Details
                            </div>
                            <div className="col-span-1 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Students
                            </div>
                            <div className="col-span-1 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Actions
                            </div>
                        </div>

                        {sectionRows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                                    <School
                                        size={22}
                                        className="text-slate-400"
                                    />
                                </div>
                                <p className="text-sm font-semibold text-slate-700">
                                    No sections found.
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Try adjusting search or department filter.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {sectionRows.map((section) => (
                                    <div key={section.id}>
                                        <div className="hidden grid-cols-12 items-center gap-4 px-5 py-4 hover:bg-slate-50/70 md:grid">
                                            <div className="col-span-3 min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {section.section_name ||
                                                        "N/A"}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {section.section_code ||
                                                        "-"}
                                                </p>
                                            </div>

                                            <div className="col-span-3 min-w-0">
                                                <p className="truncate text-sm text-slate-800">
                                                    {section.department
                                                        ?.department_name ||
                                                        "N/A"}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {section.department
                                                        ?.department_code ||
                                                        "-"}
                                                </p>
                                            </div>

                                            <div className="col-span-2 text-sm text-slate-700">
                                                {section.cohort || "-"}
                                            </div>

                                            <div className="col-span-2 min-w-0">
                                                <p className="truncate text-xs text-slate-700">
                                                    {section.grade_level || "-"}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                                    {[
                                                        section.strand,
                                                        section.track,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" • ") || "-"}
                                                </p>
                                            </div>

                                            <div className="col-span-1 text-right">
                                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                                    <Users
                                                        size={12}
                                                        className="mr-1"
                                                    />
                                                    {section.students_count ||
                                                        0}
                                                </span>
                                            </div>

                                            <div className="col-span-1 flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditSectionModal(
                                                            section,
                                                        )
                                                    }
                                                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100"
                                                    title="Edit section"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            "section",
                                                            section,
                                                        )
                                                    }
                                                    className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                                    title="Delete section"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 px-4 py-4 md:hidden">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                        {section.section_name ||
                                                            "N/A"}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        {section.section_code ||
                                                            "-"}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditSectionModal(
                                                                section,
                                                            )
                                                        }
                                                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100"
                                                        title="Edit section"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                "section",
                                                                section,
                                                            )
                                                        }
                                                        className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                                        title="Delete section"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                                    Department
                                                </p>
                                                <p className="mt-1 text-sm text-slate-700">
                                                    {section.department
                                                        ?.department_name ||
                                                        "N/A"}
                                                    <span className="ml-1 text-xs text-slate-500">
                                                        (
                                                        {section.department
                                                            ?.department_code ||
                                                            "-"}
                                                        )
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                    Cohort:{" "}
                                                    {section.cohort || "-"}
                                                </span>
                                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                                    <Users
                                                        size={12}
                                                        className="mr-1"
                                                    />
                                                    {section.students_count ||
                                                        0}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500">
                                                {[
                                                    section.grade_level,
                                                    section.strand,
                                                    section.track,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" • ") || "-"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Pagination links={sections?.links || []} />
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 md:grid">
                            <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Subject
                            </div>
                            <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Section
                            </div>
                            <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Department
                            </div>
                            <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Teacher
                            </div>
                            <div className="col-span-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Year
                            </div>
                            <div className="col-span-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Details
                            </div>
                            <div className="col-span-1 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Actions
                            </div>
                        </div>

                        {classRows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                                    <BookOpen
                                        size={22}
                                        className="text-slate-400"
                                    />
                                </div>
                                <p className="text-sm font-semibold text-slate-700">
                                    No classes found.
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Try adjusting search or department filter.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {classRows.map((item) => (
                                    <div key={item.id}>
                                        <div className="hidden grid-cols-12 items-center gap-4 px-5 py-4 hover:bg-slate-50/70 md:grid">
                                            <div className="col-span-3 min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {item.subject_name || "N/A"}
                                                </p>
                                                <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                                                    <span>
                                                        {item.subject_code ||
                                                            "-"}
                                                    </span>
                                                    {item.color && (
                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                                                            {item.color}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            <div className="col-span-2 min-w-0">
                                                <p className="truncate text-sm text-slate-800">
                                                    {item.section_name || "N/A"}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {item.section_code || "-"}
                                                </p>
                                            </div>

                                            <div className="col-span-2 min-w-0">
                                                <p className="truncate text-sm text-slate-800">
                                                    {item.department
                                                        ?.department_name ||
                                                        "N/A"}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {item.department
                                                        ?.department_code ||
                                                        "-"}
                                                </p>
                                            </div>

                                            <div className="col-span-2 min-w-0 text-sm text-slate-700">
                                                {item.teacher_name || "N/A"}
                                            </div>

                                            <div className="col-span-1 text-sm text-slate-700">
                                                {item.school_year || "-"}
                                            </div>

                                            <div className="col-span-1 min-w-0">
                                                <p className="truncate text-xs text-slate-500">
                                                    {[
                                                        item.grade_level,
                                                        item.strand,
                                                        item.track,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" • ") || "-"}
                                                </p>
                                            </div>

                                            <div className="col-span-1 flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditClassModal(item)
                                                    }
                                                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100"
                                                    title="Edit class"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            "class",
                                                            item,
                                                        )
                                                    }
                                                    className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                                    title="Delete class"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 px-4 py-4 md:hidden">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                        {item.subject_name ||
                                                            "N/A"}
                                                    </p>
                                                    <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                                                        <span>
                                                            {item.subject_code ||
                                                                "-"}
                                                        </span>
                                                        {item.color && (
                                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                                                                {item.color}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditClassModal(
                                                                item,
                                                            )
                                                        }
                                                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100"
                                                        title="Edit class"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                "class",
                                                                item,
                                                            )
                                                        }
                                                        className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                                        title="Delete class"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-700">
                                                {item.section_name || "N/A"}
                                                <span className="ml-1 text-xs text-slate-500">
                                                    ({item.section_code || "-"})
                                                </span>
                                            </p>

                                            <p className="text-xs text-slate-600">
                                                {item.department
                                                    ?.department_name || "N/A"}
                                                <span className="ml-1 text-slate-500">
                                                    (
                                                    {item.department
                                                        ?.department_code ||
                                                        "-"}
                                                    )
                                                </span>
                                            </p>

                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                                                    {item.school_year || "-"}
                                                </span>
                                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                                                    {item.teacher_name || "N/A"}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500">
                                                {[
                                                    item.grade_level,
                                                    item.strand,
                                                    item.track,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" • ") || "-"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Pagination links={classes?.links || []} />
                    </div>
                )}
            </div>

            <SectionFormModal
                isOpen={showSectionModal}
                mode="edit"
                data={sectionData}
                setData={setSectionData}
                errors={sectionErrors}
                processing={sectionProcessing}
                onClose={closeSectionModal}
                onSubmit={handleSectionSubmit}
                departments={departments}
            />

            <AddSectionWizardModal
                isOpen={showSectionWizard}
                onClose={closeSectionWizard}
                departments={departments}
                currentSchoolYear={currentSchoolYear}
                availableStudents={availableStudents}
            />

            <ClassFormModal
                isOpen={showClassModal}
                mode={classModalMode}
                data={classData}
                setData={setClassData}
                errors={classErrors}
                processing={classProcessing}
                onClose={closeClassModal}
                onSubmit={handleClassSubmit}
                sectionOptions={sectionOptions}
                subjects={subjects}
                teachers={teachers}
                colorOptions={resolvedColorOptions}
            />

            <DeleteConfirmModal
                isOpen={Boolean(deleteTarget)}
                onClose={() => {
                    if (!deleteProcessing) {
                        setDeleteTarget(null);
                    }
                }}
                onConfirm={handleDelete}
                title={deleteTitle}
                description={deleteDescription}
                itemName={deleteItemName}
                isLoading={deleteProcessing}
            />
        </>
    );
}

Index.layout = (page) => <SchoolStaffLayout children={page} />;

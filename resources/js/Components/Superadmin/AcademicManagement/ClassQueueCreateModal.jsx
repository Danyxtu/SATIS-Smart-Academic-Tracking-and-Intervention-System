import { AlertCircle, BookOpen, ListPlus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function FieldError({ message }) {
    if (!message) return null;

    return <p className="mt-1.5 text-xs text-rose-600">{message}</p>;
}

function normalizeWhitespace(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ");
}

function sectionOptionLabel(section) {
    const sectionCode = section.section_code || "-";
    const departmentCode = section.department?.department_code || "N/A";

    return `[${section.id}] ${section.section_name} (${sectionCode}) - ${departmentCode}`;
}

function subjectOptionLabel(subject) {
    const subjectCode = subject.subject_code || "-";

    return `[${subject.id}] ${subjectCode} - ${subject.subject_name}`;
}

function teacherOptionLabel(teacher) {
    const departmentCode = teacher.department?.department_code || "N/A";

    return `[${teacher.id}] ${teacher.name} - ${departmentCode}`;
}

export default function ClassQueueCreateModal({
    isOpen,
    data,
    setData,
    errors,
    processing,
    onClose,
    onSubmit,
    onAddToQueue,
    onRemoveFromQueue,
    queueItems = [],
    queueNotice = "",
    sectionOptions = [],
    subjects = [],
    teachers = [],
    colorOptions = [],
    duplicateDraftMessage = "",
    progressPercent = 0,
    progressLabel = "",
}) {
    const [sectionSearch, setSectionSearch] = useState("");
    const [subjectSearch, setSubjectSearch] = useState("");
    const [teacherSearch, setTeacherSearch] = useState("");

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

    const sectionLookup = useMemo(() => {
        const lookup = new Map();

        sectionOptions.forEach((section) => {
            lookup.set(sectionOptionLabel(section), section);
        });

        return lookup;
    }, [sectionOptions]);

    const subjectLookup = useMemo(() => {
        const lookup = new Map();

        subjects.forEach((subject) => {
            lookup.set(subjectOptionLabel(subject), subject);
        });

        return lookup;
    }, [subjects]);

    const teacherLookup = useMemo(() => {
        const lookup = new Map();

        availableTeachers.forEach((teacher) => {
            lookup.set(teacherOptionLabel(teacher), teacher);
        });

        return lookup;
    }, [availableTeachers]);

    const queueErrorMessages = useMemo(() => {
        return Object.entries(errors || {})
            .flatMap(([field, value]) => {
                const messages = Array.isArray(value) ? value : [value];

                return messages
                    .map((entry) => {
                        const normalizedMessage = String(entry || "").trim();

                        if (!normalizedMessage) {
                            return null;
                        }

                        if (field === "class_queue") {
                            return normalizedMessage;
                        }

                        if (field.startsWith("class_queue.")) {
                            return `${field.replace(/\./g, " ")}: ${normalizedMessage}`;
                        }

                        return null;
                    })
                    .filter(Boolean);
            })
            .filter(Boolean);
    }, [errors]);

    const canAddToQueue = useMemo(() => {
        const hasRequiredDraftFields =
            String(data.section_id || "").trim() !== "" &&
            String(data.subject_id || "").trim() !== "" &&
            String(data.teacher_id || "").trim() !== "" &&
            /^\d{4}-\d{4}$/.test(normalizeWhitespace(data.school_year));

        return hasRequiredDraftFields && !duplicateDraftMessage && !processing;
    }, [
        data.section_id,
        data.subject_id,
        data.teacher_id,
        data.school_year,
        duplicateDraftMessage,
        processing,
    ]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const activeSection = sectionOptions.find(
            (section) => String(section.id) === String(data.section_id),
        );

        setSectionSearch(
            activeSection ? sectionOptionLabel(activeSection) : "",
        );
    }, [isOpen, sectionOptions, data.section_id]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const activeSubject = subjects.find(
            (subject) => String(subject.id) === String(data.subject_id),
        );

        setSubjectSearch(
            activeSubject ? subjectOptionLabel(activeSubject) : "",
        );
    }, [isOpen, subjects, data.subject_id]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const activeTeacher = availableTeachers.find(
            (teacher) => String(teacher.id) === String(data.teacher_id),
        );

        setTeacherSearch(
            activeTeacher ? teacherOptionLabel(activeTeacher) : "",
        );
    }, [isOpen, availableTeachers, data.teacher_id]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-4">
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative max-h-[calc(100vh-1rem)] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 sm:max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 ring-1 ring-violet-200">
                            <BookOpen size={16} className="text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Add Class Queue
                            </h2>
                            <p className="text-xs text-slate-500">
                                Type and queue multiple classes in one create
                                action
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
                    <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-violet-700">
                                <span>Create Progress</span>
                                <span>{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
                                <div
                                    className={`h-full rounded-full bg-violet-600 transition-all duration-300 ${
                                        processing ? "animate-pulse" : ""
                                    }`}
                                    style={{
                                        width: `${Math.max(
                                            0,
                                            Math.min(100, progressPercent),
                                        )}%`,
                                    }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-violet-700">
                                {progressLabel}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                            <div className="space-y-4 xl:col-span-7">
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="mb-3 flex items-center gap-2">
                                        <ListPlus
                                            size={15}
                                            className="text-violet-600"
                                        />
                                        <p className="text-sm font-semibold text-slate-900">
                                            Draft Class Entry
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                        <div className="lg:col-span-2">
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Section{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                list="superadmin-class-section-options"
                                                value={sectionSearch}
                                                onChange={(event) => {
                                                    const nextValue =
                                                        event.target.value;
                                                    setSectionSearch(nextValue);

                                                    const matchedSection =
                                                        sectionLookup.get(
                                                            nextValue,
                                                        ) || null;

                                                    if (!matchedSection) {
                                                        setData(
                                                            "section_id",
                                                            "",
                                                        );
                                                        setData(
                                                            "teacher_id",
                                                            "",
                                                        );
                                                        return;
                                                    }

                                                    setData(
                                                        "section_id",
                                                        String(
                                                            matchedSection.id,
                                                        ),
                                                    );

                                                    const currentTeacher =
                                                        teachers.find(
                                                            (teacher) =>
                                                                String(
                                                                    teacher.id,
                                                                ) ===
                                                                String(
                                                                    data.teacher_id,
                                                                ),
                                                        ) || null;

                                                    if (
                                                        currentTeacher &&
                                                        Number(
                                                            currentTeacher.department_id,
                                                        ) !==
                                                            Number(
                                                                matchedSection.department_id,
                                                            )
                                                    ) {
                                                        setData(
                                                            "teacher_id",
                                                            "",
                                                        );
                                                    }
                                                }}
                                                placeholder="Type to search section"
                                                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                                    errors.section_id
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-violet-500 focus:ring-violet-100"
                                                }`}
                                            />
                                            <datalist id="superadmin-class-section-options">
                                                {sectionOptions.map(
                                                    (section) => (
                                                        <option
                                                            key={section.id}
                                                            value={sectionOptionLabel(
                                                                section,
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </datalist>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Department is auto-derived from
                                                the selected section.
                                            </p>
                                            <FieldError
                                                message={errors.section_id}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Subject{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                list="superadmin-class-subject-options"
                                                value={subjectSearch}
                                                onChange={(event) => {
                                                    const nextValue =
                                                        event.target.value;
                                                    setSubjectSearch(nextValue);

                                                    const matchedSubject =
                                                        subjectLookup.get(
                                                            nextValue,
                                                        ) || null;

                                                    setData(
                                                        "subject_id",
                                                        matchedSubject
                                                            ? String(
                                                                  matchedSubject.id,
                                                              )
                                                            : "",
                                                    );
                                                }}
                                                placeholder="Type to search subject"
                                                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                                    errors.subject_id
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-violet-500 focus:ring-violet-100"
                                                }`}
                                            />
                                            <datalist id="superadmin-class-subject-options">
                                                {subjects.map((subject) => (
                                                    <option
                                                        key={subject.id}
                                                        value={subjectOptionLabel(
                                                            subject,
                                                        )}
                                                    />
                                                ))}
                                            </datalist>
                                            <FieldError
                                                message={errors.subject_id}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Teacher{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                list="superadmin-class-teacher-options"
                                                value={teacherSearch}
                                                onChange={(event) => {
                                                    const nextValue =
                                                        event.target.value;
                                                    setTeacherSearch(nextValue);

                                                    const matchedTeacher =
                                                        teacherLookup.get(
                                                            nextValue,
                                                        ) || null;

                                                    setData(
                                                        "teacher_id",
                                                        matchedTeacher
                                                            ? String(
                                                                  matchedTeacher.id,
                                                              )
                                                            : "",
                                                    );
                                                }}
                                                disabled={!selectedSection}
                                                placeholder={
                                                    selectedSection
                                                        ? "Type to search teacher"
                                                        : "Select section first"
                                                }
                                                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                                                    errors.teacher_id
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-violet-500 focus:ring-violet-100"
                                                }`}
                                            />
                                            <datalist id="superadmin-class-teacher-options">
                                                {availableTeachers.map(
                                                    (teacher) => (
                                                        <option
                                                            key={teacher.id}
                                                            value={teacherOptionLabel(
                                                                teacher,
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </datalist>
                                            {selectedSection &&
                                                availableTeachers.length ===
                                                    0 && (
                                                    <p className="mt-1.5 text-xs text-amber-600">
                                                        No teachers found for
                                                        this section's
                                                        department.
                                                    </p>
                                                )}
                                            <FieldError
                                                message={errors.teacher_id}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                School Year{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
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
                                            <FieldError
                                                message={errors.school_year}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Color Tag
                                            </label>
                                            <select
                                                value={data.color}
                                                onChange={(event) =>
                                                    setData(
                                                        "color",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                                    errors.color
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-violet-500 focus:ring-violet-100"
                                                }`}
                                            >
                                                {colorOptions.map((color) => (
                                                    <option
                                                        key={color}
                                                        value={color}
                                                    >
                                                        {color
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            color.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                            <FieldError
                                                message={errors.color}
                                            />
                                        </div>
                                    </div>

                                    {duplicateDraftMessage && (
                                        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                            {duplicateDraftMessage}
                                        </div>
                                    )}

                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={onAddToQueue}
                                            disabled={!canAddToQueue}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <ListPlus size={15} />
                                            Add To Queue
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 xl:col-span-5">
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-900">
                                            Queue Summary
                                        </p>
                                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                            {queueItems.length} queued
                                        </span>
                                    </div>

                                    {queueNotice && (
                                        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                            {queueNotice}
                                        </div>
                                    )}

                                    {queueItems.length === 0 ? (
                                        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-center text-xs text-slate-500">
                                            Queue is empty. Build a class entry
                                            and add it to queue.
                                        </p>
                                    ) : (
                                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                            {queueItems.map((item, index) => (
                                                <div
                                                    key={item.queue_id}
                                                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                                {
                                                                    item.subject_name
                                                                }
                                                            </p>
                                                            <p className="mt-0.5 truncate text-xs text-slate-600">
                                                                {
                                                                    item.section_name
                                                                }{" "}
                                                                (
                                                                {item.section_code ||
                                                                    "-"}
                                                                )
                                                            </p>
                                                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                                                {
                                                                    item.teacher_name
                                                                }
                                                            </p>
                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                {
                                                                    item.school_year
                                                                }{" "}
                                                                •{" "}
                                                                {item.department_code ||
                                                                    "N/A"}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onRemoveFromQueue(
                                                                    item.queue_id,
                                                                )
                                                            }
                                                            disabled={
                                                                processing
                                                            }
                                                            className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                                                            title={`Remove queued class #${index + 1}`}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {queueErrorMessages.length > 0 && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                                        <div className="mb-1 flex items-center gap-1.5 font-semibold">
                                            <AlertCircle size={14} />
                                            Queue validation errors
                                        </div>
                                        <ul className="space-y-1">
                                            {queueErrorMessages.map(
                                                (message) => (
                                                    <li key={message}>
                                                        - {message}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                        <p className="text-xs text-slate-500">
                            {queueItems.length} queued class
                            {queueItems.length === 1 ? "" : "es"} ready for
                            creation.
                        </p>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={processing}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing || queueItems.length === 0}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                                Create Classes ({queueItems.length})
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

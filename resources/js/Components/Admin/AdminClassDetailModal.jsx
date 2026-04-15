import { useEffect, useMemo, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    BookOpen,
    Calendar,
    ListChecks,
    Pencil,
    Save,
    School,
    UserCog,
    X,
} from "lucide-react";
import Modal from "@/Components/Modal";

function DetailRow({ label, value, mono = false }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-blue-200 py-2.5 last:border-b-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700/90">
                {label}
            </span>
            <span
                className={`text-sm font-medium text-slate-800 ${mono ? "font-mono" : ""}`}
            >
                {value || "-"}
            </span>
        </div>
    );
}

function NavItem({ active, onClick, icon: Icon, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                active
                    ? "bg-blue-100 text-blue-900"
                    : "text-slate-600 hover:bg-blue-50"
            }`}
        >
            <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${
                    active ? "bg-blue-200" : "bg-slate-100"
                }`}
            >
                <Icon size={14} />
            </span>
            <span>{label}</span>
        </button>
    );
}

function FieldError({ message }) {
    if (!message) {
        return null;
    }

    return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}

export default function AdminClassDetailModal({
    show,
    onClose,
    payload,
    loading = false,
    error = "",
    row,
    mode = "view",
    subjects = [],
    sections = [],
    teachers = [],
    currentSchoolYear = "",
    onSaved,
}) {
    const activeClass = useMemo(
        () => payload?.class || row || null,
        [payload, row],
    );
    const [editMode, setEditMode] = useState(mode === "edit");
    const [panel, setPanel] = useState("info");

    const { data, setData, put, processing, errors, clearErrors } = useForm({
        subject_id: "",
        section_id: "",
        teacher_id: "",
        school_year: "",
    });

    const hydrateForm = (source = null) => {
        setData({
            subject_id: source?.subject_id ? String(source.subject_id) : "",
            section_id: source?.section_id ? String(source.section_id) : "",
            teacher_id: source?.teacher_id ? String(source.teacher_id) : "",
            school_year: source?.school_year || currentSchoolYear || "",
        });
    };

    useEffect(() => {
        if (!show) {
            return;
        }

        clearErrors();
        hydrateForm(activeClass);
        const shouldEdit = mode === "edit";
        setEditMode(shouldEdit);
        setPanel(shouldEdit ? "edit" : "info");
    }, [show, activeClass?.id, mode]);

    const selectedSubject = useMemo(
        () =>
            subjects.find(
                (subject) => String(subject.id) === String(data.subject_id),
            ) || null,
        [subjects, data.subject_id],
    );

    const selectedSection = useMemo(
        () =>
            sections.find(
                (section) => String(section.id) === String(data.section_id),
            ) || null,
        [sections, data.section_id],
    );

    const selectedTeacher = useMemo(
        () =>
            teachers.find(
                (teacher) => String(teacher.id) === String(data.teacher_id),
            ) || null,
        [teachers, data.teacher_id],
    );

    const handleClose = () => {
        if (processing) {
            return;
        }

        onClose?.();
    };

    const handleCancelEdit = () => {
        if (processing) {
            return;
        }

        clearErrors();
        hydrateForm(activeClass);
        setEditMode(false);
        setPanel("info");
    };

    const handleSave = () => {
        if (!activeClass?.id) {
            return;
        }

        put(route("admin.classes.update", activeClass.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditMode(false);
                setPanel("info");
                onSaved?.(activeClass.id);
                onClose?.();
            },
        });
    };

    const classTitle =
        activeClass?.subject_name ||
        selectedSubject?.subject_name ||
        "Class Record";
    const classCode =
        activeClass?.subject_code || selectedSubject?.subject_code;
    const titleInitial =
        String(classTitle || "C")
            .trim()
            .charAt(0)
            .toUpperCase() || "C";

    const panelTitle =
        panel === "assignment"
            ? "Assignment Summary"
            : panel === "edit"
              ? "Edit Class Assignment"
              : "Class Information";

    const panelSubtitle =
        panel === "assignment"
            ? "Subject, section, and teacher breakdown"
            : panel === "edit"
              ? "Update fields with prefilled values"
              : "Overview of the selected class record";

    return (
        <Modal
            show={show}
            onClose={handleClose}
            maxWidth="3xl"
            closeable={false}
        >
            <div className="h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)] min-h-0 overflow-hidden">
                <div className="flex h-full min-h-0 flex-col md:flex-row">
                    <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-blue-200 md:h-full md:w-[220px] md:border-b-0 md:border-r">
                        <div className="bg-gradient-to-b from-blue-700 to-blue-900 px-4 py-4">
                            <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-200 text-sm font-semibold text-blue-900">
                                {titleInitial}
                            </div>
                            <p className="text-sm font-semibold text-blue-50">
                                {classTitle}
                            </p>
                            <p className="mt-0.5 text-xs text-blue-200">
                                {classCode || "No subject code"}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-blue-100">
                                    Class
                                </span>
                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-blue-100">
                                    {activeClass?.school_year ||
                                        currentSchoolYear ||
                                        "-"}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-3">
                            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                Menu
                            </p>
                            <div className="space-y-1.5">
                                <NavItem
                                    active={panel === "info"}
                                    onClick={() => {
                                        setEditMode(false);
                                        setPanel("info");
                                    }}
                                    icon={School}
                                    label="Class info"
                                />
                                <NavItem
                                    active={panel === "assignment"}
                                    onClick={() => {
                                        setEditMode(false);
                                        setPanel("assignment");
                                    }}
                                    icon={ListChecks}
                                    label="Assignment"
                                />
                                <NavItem
                                    active={panel === "edit"}
                                    onClick={() => {
                                        setEditMode(true);
                                        setPanel("edit");
                                    }}
                                    icon={Pencil}
                                    label="Edit mode"
                                />
                            </div>
                        </div>

                        <div className="border-t border-blue-200 p-3">
                            <div className="rounded-lg bg-blue-50 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-wide text-blue-700">
                                    Class ID
                                </p>
                                <p className="font-mono text-xs font-semibold text-blue-900">
                                    {activeClass?.id || "-"}
                                </p>
                            </div>
                        </div>
                    </aside>

                    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
                        <div className="flex items-start justify-between gap-3 border-b border-blue-200 px-5 py-4">
                            <div>
                                <p className="text-[15px] font-semibold text-slate-900">
                                    {panelTitle}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {panelSubtitle}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto bg-blue-50/40 p-4">
                            {loading && (
                                <div className="mb-3 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm text-blue-700">
                                    Loading class details...
                                </div>
                            )}

                            {error && (
                                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {error}
                                </div>
                            )}

                            {panel === "info" && (
                                <div className="space-y-3">
                                    <div className="rounded-lg border border-blue-200 bg-white px-4 py-2">
                                        <DetailRow
                                            label="Subject"
                                            value={
                                                activeClass?.subject_name
                                                    ? `${activeClass.subject_name} (${activeClass.subject_code || "-"})`
                                                    : "-"
                                            }
                                        />
                                        <DetailRow
                                            label="Section"
                                            value={
                                                activeClass?.section_name
                                                    ? `${activeClass.section_name} (${activeClass.section_code || "-"})`
                                                    : "-"
                                            }
                                        />
                                        <DetailRow
                                            label="Teacher"
                                            value={activeClass?.teacher_name}
                                        />
                                        <DetailRow
                                            label="School Year"
                                            value={activeClass?.school_year}
                                            mono
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                                            <p className="text-[11px] text-blue-700">
                                                Section Code
                                            </p>
                                            <p className="text-sm font-semibold text-blue-900">
                                                {activeClass?.section_code ||
                                                    "-"}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                                            <p className="text-[11px] text-blue-700">
                                                Updated
                                            </p>
                                            <p className="inline-flex items-center gap-1 text-sm font-semibold text-blue-900">
                                                <Calendar size={12} />
                                                {activeClass?.updated_at
                                                    ? new Date(
                                                          activeClass.updated_at,
                                                      ).toLocaleDateString()
                                                    : "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {panel === "assignment" && (
                                <div className="space-y-3">
                                    <div className="rounded-lg border border-blue-200 bg-white p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                            Assignment Summary
                                        </p>
                                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700">
                                            <p>
                                                <span className="font-semibold text-slate-900">
                                                    Subject:
                                                </span>{" "}
                                                {selectedSubject?.subject_name ||
                                                    activeClass?.subject_name ||
                                                    "-"}
                                            </p>
                                            <p>
                                                <span className="font-semibold text-slate-900">
                                                    Section:
                                                </span>{" "}
                                                {selectedSection?.section_name ||
                                                    activeClass?.section_name ||
                                                    "-"}
                                            </p>
                                            <p>
                                                <span className="font-semibold text-slate-900">
                                                    Teacher:
                                                </span>{" "}
                                                {selectedTeacher?.name ||
                                                    activeClass?.teacher_name ||
                                                    "-"}
                                            </p>
                                            <p>
                                                <span className="font-semibold text-slate-900">
                                                    School Year:
                                                </span>{" "}
                                                {data.school_year ||
                                                    activeClass?.school_year ||
                                                    "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {panel === "edit" && (
                                <div className="space-y-4 rounded-lg border border-blue-200 bg-white p-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Subject{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                value={data.subject_id}
                                                onChange={(event) =>
                                                    setData(
                                                        "subject_id",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.subject_id
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            >
                                                <option value="">
                                                    Select subject
                                                </option>
                                                {subjects.map((subject) => (
                                                    <option
                                                        key={subject.id}
                                                        value={subject.id}
                                                    >
                                                        {subject.subject_name} (
                                                        {subject.subject_code ||
                                                            "-"}
                                                        )
                                                    </option>
                                                ))}
                                            </select>
                                            <FieldError
                                                message={errors.subject_id}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Section{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                value={data.section_id}
                                                onChange={(event) =>
                                                    setData(
                                                        "section_id",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.section_id
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            >
                                                <option value="">
                                                    Select section
                                                </option>
                                                {sections.map((section) => (
                                                    <option
                                                        key={section.id}
                                                        value={section.id}
                                                    >
                                                        {section.section_name} (
                                                        {section.section_code ||
                                                            "-"}
                                                        )
                                                    </option>
                                                ))}
                                            </select>
                                            <FieldError
                                                message={errors.section_id}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Teacher{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                value={data.teacher_id}
                                                onChange={(event) =>
                                                    setData(
                                                        "teacher_id",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.teacher_id
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            >
                                                <option value="">
                                                    Select teacher
                                                </option>
                                                {teachers.map((teacher) => (
                                                    <option
                                                        key={teacher.id}
                                                        value={teacher.id}
                                                    >
                                                        {teacher.name}
                                                    </option>
                                                ))}
                                            </select>
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
                                                placeholder="YYYY-YYYY"
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.school_year
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            />
                                            <FieldError
                                                message={errors.school_year}
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                            Edit Preview
                                        </p>
                                        <p className="mt-1 text-sm text-slate-700">
                                            <School
                                                size={14}
                                                className="mr-1 inline"
                                            />
                                            {selectedSection?.section_name ||
                                                "No section selected"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-700">
                                            <BookOpen
                                                size={14}
                                                className="mr-1 inline"
                                            />
                                            {selectedSubject?.subject_name ||
                                                "No subject selected"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-700">
                                            <UserCog
                                                size={14}
                                                className="mr-1 inline"
                                            />
                                            {selectedTeacher?.name ||
                                                "No teacher selected"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-blue-200 bg-white px-5 py-3">
                            {!editMode ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditMode(true);
                                            setPanel("edit");
                                        }}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        <Pencil size={14} />
                                        Edit
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        disabled={processing}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        <Save size={14} />
                                        {processing
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </button>
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </Modal>
    );
}

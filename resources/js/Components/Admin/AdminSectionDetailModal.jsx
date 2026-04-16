import { useEffect, useMemo, useState } from "react";
import { useForm } from "@inertiajs/react";
import { Layers3, Pencil, Save, School, UserCog, Users, X } from "lucide-react";
import Modal from "@/Components/Modal";

const GRADE_LEVEL_OPTIONS = ["11", "12"];

function DetailRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-blue-200 py-2.5 last:border-b-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700/90">
                {label}
            </span>
            <span className="text-sm font-medium text-slate-800">
                {value || "-"}
            </span>
        </div>
    );
}

function NavItem({ active, onClick, icon: Icon, label, count }) {
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
            {typeof count === "number" && (
                <span className="ml-auto rounded-full bg-blue-200 px-2 py-0.5 text-[10px] text-blue-900">
                    {count}
                </span>
            )}
        </button>
    );
}

function FieldError({ message }) {
    if (!message) {
        return null;
    }

    return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}

export default function AdminSectionDetailModal({
    show,
    onClose,
    payload,
    loading = false,
    error = "",
    row,
    mode = "view",
    teachers = [],
    currentSchoolYear = "",
    onSaved,
}) {
    const activeSection = useMemo(
        () => payload?.section || row || null,
        [payload, row],
    );
    const [editMode, setEditMode] = useState(mode === "edit");
    const [panel, setPanel] = useState("info");

    const { data, setData, put, processing, errors, clearErrors } = useForm({
        section_name: "",
        grade_level: "",
        strand: "",
        school_year: "",
        description: "",
        advisor_teacher_id: "",
        is_active: true,
    });

    const hydrateForm = (source = null) => {
        setData({
            section_name: source?.section_name || "",
            grade_level: source?.grade_level || "",
            strand: source?.strand || "",
            school_year: source?.school_year || currentSchoolYear || "",
            description: source?.description || "",
            advisor_teacher_id: source?.advisor_teacher_id
                ? String(source.advisor_teacher_id)
                : "",
            is_active:
                source?.is_active === undefined || source?.is_active === null
                    ? true
                    : Boolean(source.is_active),
        });
    };

    useEffect(() => {
        if (!show) {
            return;
        }

        clearErrors();
        hydrateForm(activeSection);
        const shouldEdit = mode === "edit";
        setEditMode(shouldEdit);
        setPanel(shouldEdit ? "edit" : "info");
    }, [show, activeSection?.id, mode]);

    const selectedTeacher = useMemo(
        () =>
            teachers.find(
                (teacher) =>
                    String(teacher.id) === String(data.advisor_teacher_id),
            ) || null,
        [teachers, data.advisor_teacher_id],
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
        hydrateForm(activeSection);
        setEditMode(false);
        setPanel("info");
    };

    const handleSave = () => {
        if (!activeSection?.id) {
            return;
        }

        put(route("admin.sections.update", activeSection.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditMode(false);
                setPanel("info");
                onSaved?.(activeSection.id);
                onClose?.();
            },
        });
    };

    const sectionTitle =
        activeSection?.section_full_label ||
        activeSection?.section_name ||
        "Section";
    const sectionInitial =
        String(activeSection?.section_name || "S")
            .trim()
            .charAt(0)
            .toUpperCase() || "S";

    const panelTitle =
        panel === "roster"
            ? "Section Roster Summary"
            : panel === "edit"
              ? "Edit Section"
              : "Section Information";

    const panelSubtitle =
        panel === "roster"
            ? "Adviser, student count, and section health"
            : panel === "edit"
              ? "Update section fields with prefilled values"
              : "General details for this section record";

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
                                {sectionInitial}
                            </div>
                            <p className="text-sm font-semibold text-blue-50">
                                {sectionTitle}
                            </p>
                            <p className="mt-0.5 text-xs text-blue-200">
                                {activeSection?.section_code ||
                                    "No section code"}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-blue-100">
                                    Grade {activeSection?.grade_level || "-"}
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
                                    label="Section info"
                                />
                                <NavItem
                                    active={panel === "roster"}
                                    onClick={() => {
                                        setEditMode(false);
                                        setPanel("roster");
                                    }}
                                    icon={Users}
                                    label="Roster"
                                    count={Number(
                                        activeSection?.students_count || 0,
                                    )}
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
                                    School Year
                                </p>
                                <p className="font-mono text-xs font-semibold text-blue-900">
                                    {activeSection?.school_year ||
                                        currentSchoolYear ||
                                        "-"}
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
                                    Loading section details...
                                </div>
                            )}

                            {error && (
                                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {error}
                                </div>
                            )}

                            {panel === "info" && (
                                <div className="rounded-lg border border-blue-200 bg-white px-4 py-2">
                                    <DetailRow
                                        label="Section"
                                        value={sectionTitle}
                                    />
                                    <DetailRow
                                        label="Code"
                                        value={activeSection?.section_code}
                                    />
                                    <DetailRow
                                        label="Grade Level"
                                        value={activeSection?.grade_level}
                                    />
                                    <DetailRow
                                        label="Strand"
                                        value={activeSection?.strand}
                                    />
                                    <DetailRow
                                        label="Track"
                                        value={activeSection?.track}
                                    />
                                    <DetailRow
                                        label="School Year"
                                        value={activeSection?.school_year}
                                    />
                                    <DetailRow
                                        label="Description"
                                        value={activeSection?.description}
                                    />
                                </div>
                            )}

                            {panel === "roster" && (
                                <div className="space-y-3">
                                    <div className="rounded-lg border border-blue-200 bg-white p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                            Adviser and Student Snapshot
                                        </p>
                                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                                                <p className="text-[11px] text-blue-700">
                                                    Adviser
                                                </p>
                                                <p className="inline-flex items-center gap-1 text-sm font-semibold text-blue-900">
                                                    <UserCog size={12} />
                                                    {activeSection?.advisor_teacher_name ||
                                                        "Unassigned"}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                                                <p className="text-[11px] text-blue-700">
                                                    Students
                                                </p>
                                                <p className="inline-flex items-center gap-1 text-sm font-semibold text-blue-900">
                                                    <Users size={12} />
                                                    {Number(
                                                        activeSection?.students_count ||
                                                            0,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-blue-200 bg-white p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                            Status
                                        </p>
                                        <p className="mt-2 inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
                                            {activeSection?.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {panel === "edit" && (
                                <div className="space-y-4 rounded-lg border border-blue-200 bg-white p-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Section Name{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
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
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.section_name
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            />
                                            <FieldError
                                                message={errors.section_name}
                                            />
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Grade Level
                                            </label>
                                            <select
                                                value={data.grade_level}
                                                onChange={(event) =>
                                                    setData(
                                                        "grade_level",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.grade_level
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            >
                                                <option value="">
                                                    Select grade level
                                                </option>
                                                {GRADE_LEVEL_OPTIONS.map(
                                                    (gradeLevel) => (
                                                        <option
                                                            key={gradeLevel}
                                                            value={gradeLevel}
                                                        >
                                                            {`Grade ${gradeLevel}`}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <FieldError
                                                message={errors.grade_level}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Strand
                                            </label>
                                            <input
                                                type="text"
                                                value={data.strand}
                                                onChange={(event) =>
                                                    setData(
                                                        "strand",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.strand
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            />
                                            <FieldError
                                                message={errors.strand}
                                            />
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Adviser Teacher
                                            </label>
                                            <select
                                                value={data.advisor_teacher_id}
                                                onChange={(event) =>
                                                    setData(
                                                        "advisor_teacher_id",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.advisor_teacher_id
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            >
                                                <option value="">
                                                    Unassigned (N/A)
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
                                                message={
                                                    errors.advisor_teacher_id
                                                }
                                            />
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

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Description
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={data.description}
                                            onChange={(event) =>
                                                setData(
                                                    "description",
                                                    event.target.value,
                                                )
                                            }
                                            className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                errors.description
                                                    ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                    : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        />
                                        <FieldError
                                            message={errors.description}
                                        />
                                    </div>

                                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(data.is_active)}
                                            onChange={(event) =>
                                                setData(
                                                    "is_active",
                                                    event.target.checked,
                                                )
                                            }
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        Active section
                                    </label>

                                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                            Edit Preview
                                        </p>
                                        <p className="mt-1 text-sm text-slate-700">
                                            <UserCog
                                                size={14}
                                                className="mr-1 inline"
                                            />
                                            Adviser:{" "}
                                            {selectedTeacher?.name ||
                                                "Unassigned"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-700">
                                            <Users
                                                size={14}
                                                className="mr-1 inline"
                                            />
                                            Students:{" "}
                                            {Number(
                                                activeSection?.students_count ||
                                                    0,
                                            )}
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

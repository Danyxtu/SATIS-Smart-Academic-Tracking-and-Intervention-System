import { useEffect, useMemo, useState } from "react";
import { useForm } from "@inertiajs/react";
import { ArrowLeft, Building2, GitBranch, Pencil, Save, X } from "lucide-react";
import Modal from "@/Components/Modal";

function FieldRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-emerald-200 py-2.5 last:border-b-0">
            <span className="text-xs font-medium text-emerald-700">
                {label}
            </span>
            <span className="text-right text-[13px] font-semibold text-emerald-900">
                {value || "-"}
            </span>
        </div>
    );
}

function SidebarButton({ active, onClick, icon: Icon, label, count }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold transition ${
                active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-emerald-50"
            }`}
        >
            <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${
                    active ? "bg-emerald-200" : "bg-slate-100"
                }`}
            >
                <Icon size={14} className="text-emerald-700" />
            </span>
            <span>{label}</span>
            {typeof count === "number" && (
                <span className="ml-auto rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700">
                    {count}
                </span>
            )}
        </button>
    );
}

export default function SchoolTrackDetailModal({
    show,
    onClose,
    track,
    onSaved,
}) {
    const [panel, setPanel] = useState("info");
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    const { data, setData, put, processing, errors, clearErrors, reset } =
        useForm({
            track_name: "",
            track_code: "",
            school_year: "",
            description: "",
        });

    const trackLabel = useMemo(() => {
        if (!track?.track_name) {
            return "School Track";
        }

        return String(track.track_name)
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((token) => token[0]?.toUpperCase() || "")
            .join("");
    }, [track?.track_name]);

    const departments = useMemo(() => {
        if (!Array.isArray(track?.departments)) {
            return [];
        }

        return track.departments;
    }, [track?.departments]);

    useEffect(() => {
        if (!show || !track) {
            return;
        }

        setData({
            track_name: track.track_name || "",
            track_code: track.track_code || "",
            school_year: track.school_year || "",
            description: track.description || "",
        });
        clearErrors();
        setPanel("info");
        setIsEditMode(false);
        setSelectedDepartment(null);
    }, [show, track, setData, clearErrors]);

    const closeModal = () => {
        if (processing) {
            return;
        }

        clearErrors();
        setPanel("info");
        setIsEditMode(false);
        setSelectedDepartment(null);
        reset();
        onClose?.();
    };

    const handleSave = () => {
        if (!track?.id || processing) {
            return;
        }

        put(route("superadmin.school-tracks.update", track.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditMode(false);
                onSaved?.();
                onClose?.();
            },
        });
    };

    if (!show || !track) {
        return null;
    }

    const headerTitle =
        panel === "info"
            ? isEditMode
                ? "Edit School Track"
                : "School Track Information"
            : selectedDepartment
              ? "Department Information"
              : "Departments";

    const headerSubtitle =
        panel === "info"
            ? "Manage school track profile and details"
            : selectedDepartment
              ? "Selected department under this school track"
              : "Click a department banner to view details";

    const trackDetails = (
        <div className="space-y-3">
            <div className="rounded-md bg-white p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                            Track Name
                        </p>
                        {isEditMode ? (
                            <>
                                <input
                                    type="text"
                                    value={data.track_name}
                                    onChange={(event) =>
                                        setData(
                                            "track_name",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                />
                                {errors.track_name && (
                                    <p className="mt-1 text-[11px] text-rose-600">
                                        {errors.track_name}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm font-semibold text-slate-900">
                                {track.track_name || "-"}
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                            Track Code
                        </p>
                        {isEditMode ? (
                            <>
                                <input
                                    type="text"
                                    value={data.track_code}
                                    onChange={(event) =>
                                        setData(
                                            "track_code",
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                />
                                {errors.track_code && (
                                    <p className="mt-1 text-[11px] text-rose-600">
                                        {errors.track_code}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="font-mono text-sm font-semibold text-slate-900">
                                {track.track_code || "-"}
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                            School Year
                        </p>
                        {isEditMode ? (
                            <>
                                <input
                                    type="text"
                                    value={data.school_year}
                                    onChange={(event) =>
                                        setData(
                                            "school_year",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                />
                                {errors.school_year && (
                                    <p className="mt-1 text-[11px] text-rose-600">
                                        {errors.school_year}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm font-semibold text-slate-900">
                                {track.school_year || "-"}
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                            Department Count
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                            {track.departments_count ?? departments.length}
                        </p>
                    </div>
                </div>

                <div className="mt-3">
                    <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                        Description
                    </p>
                    {isEditMode ? (
                        <>
                            <textarea
                                value={data.description}
                                onChange={(event) =>
                                    setData("description", event.target.value)
                                }
                                rows={4}
                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                            />
                            {errors.description && (
                                <p className="mt-1 text-[11px] text-rose-600">
                                    {errors.description}
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-xs text-slate-700">
                            {track.description || "No description"}
                        </p>
                    )}
                </div>
            </div>

            {!isEditMode && (
                <div className="rounded-md border border-emerald-200 bg-white px-4">
                    <FieldRow
                        label="Created"
                        value={
                            track.created_at
                                ? new Date(track.created_at).toLocaleString(
                                      "en-US",
                                      {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      },
                                  )
                                : "-"
                        }
                    />
                    <FieldRow
                        label="Updated"
                        value={
                            track.updated_at
                                ? new Date(track.updated_at).toLocaleString(
                                      "en-US",
                                      {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      },
                                  )
                                : "-"
                        }
                    />
                </div>
            )}
        </div>
    );

    const departmentsPanel = selectedDepartment ? (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => setSelectedDepartment(null)}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
                <ArrowLeft size={13} />
                Back to Department Banners
            </button>

            <div className="rounded-md border border-emerald-200 bg-white px-4">
                <FieldRow
                    label="Department Name"
                    value={selectedDepartment.department_name || "-"}
                />
                <FieldRow
                    label="Department Code"
                    value={selectedDepartment.department_code || "-"}
                />
                <FieldRow
                    label="Status"
                    value={selectedDepartment.is_active ? "Active" : "Inactive"}
                />
                <FieldRow
                    label="Admins"
                    value={selectedDepartment.admins_count ?? 0}
                />
                <FieldRow
                    label="Teachers"
                    value={selectedDepartment.teachers_count ?? 0}
                />
                <FieldRow
                    label="Students"
                    value={selectedDepartment.students_count ?? 0}
                />
            </div>

            <div className="rounded-md border border-emerald-200 bg-white p-3">
                <p className="text-[11px] font-semibold text-emerald-700">
                    Description
                </p>
                <p className="mt-1 text-xs text-slate-700">
                    {selectedDepartment.description || "No description"}
                </p>
            </div>
        </div>
    ) : departments.length === 0 ? (
        <div className="rounded-md border border-dashed border-emerald-200 bg-white px-4 py-5 text-sm text-emerald-700">
            No departments are assigned to this school track.
        </div>
    ) : (
        <div className="space-y-2.5">
            {departments.map((department) => (
                <button
                    key={department.id}
                    type="button"
                    onClick={() => setSelectedDepartment(department)}
                    className="w-full rounded-md border border-emerald-200 bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                                {department.department_name || "Department"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                                {department.department_code || "-"}
                            </p>
                        </div>
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                department.is_active
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                        >
                            {department.is_active ? "Active" : "Inactive"}
                        </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-600">
                        <span className="rounded bg-slate-100 px-2 py-0.5">
                            Admins: {department.admins_count ?? 0}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5">
                            Teachers: {department.teachers_count ?? 0}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5">
                            Students: {department.students_count ?? 0}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    );

    return (
        <Modal show={show} onClose={closeModal} maxWidth="3xl">
            <div className="relative h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)] min-h-0 overflow-hidden">
                <div className="flex h-full min-h-0 flex-col md:flex-row">
                    <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-emerald-200 md:h-full md:w-[220px] md:border-b-0 md:border-r">
                        <div className="bg-emerald-600 px-4 py-4">
                            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-200 text-sm font-semibold text-emerald-900">
                                {trackLabel || "ST"}
                            </div>
                            <p className="text-sm font-semibold text-emerald-50">
                                {track.track_name || "School Track"}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-emerald-300">
                                {track.track_code || "-"}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-3">
                            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                Menu
                            </p>
                            <div className="space-y-1">
                                <SidebarButton
                                    active={panel === "info"}
                                    onClick={() => {
                                        setPanel("info");
                                        setSelectedDepartment(null);
                                    }}
                                    icon={GitBranch}
                                    label="School Track Info"
                                />
                                <SidebarButton
                                    active={panel === "departments"}
                                    onClick={() => {
                                        setPanel("departments");
                                        setSelectedDepartment(null);
                                    }}
                                    icon={Building2}
                                    label="Departments"
                                    count={departments.length}
                                />
                            </div>
                        </div>

                        <div className="border-t border-emerald-200 px-3 py-3">
                            <div className="rounded-md bg-emerald-50 px-3 py-2.5">
                                <p className="text-[10px] text-emerald-700">
                                    School Year
                                </p>
                                <p className="mt-0.5 truncate text-xs font-semibold text-emerald-900">
                                    {track.school_year || "-"}
                                </p>
                            </div>
                        </div>
                    </aside>

                    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
                        <div className="flex items-start justify-between gap-3 border-b border-emerald-200 px-5 py-4">
                            <div>
                                <p className="text-[15px] font-semibold text-slate-900">
                                    {headerTitle}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {headerSubtitle}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto bg-emerald-50 p-4 pb-20">
                            {panel === "info" ? trackDetails : departmentsPanel}
                        </div>

                        {panel === "info" &&
                            (!isEditMode ? (
                                <button
                                    type="button"
                                    onClick={() => setIsEditMode(true)}
                                    className="absolute right-5 bottom-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
                                    title="Edit school track"
                                >
                                    <Pencil size={18} />
                                </button>
                            ) : (
                                <div className="absolute right-5 bottom-5 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditMode(false);
                                            setData({
                                                track_name:
                                                    track.track_name || "",
                                                track_code:
                                                    track.track_code || "",
                                                school_year:
                                                    track.school_year || "",
                                                description:
                                                    track.description || "",
                                            });
                                            clearErrors();
                                        }}
                                        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={processing}
                                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        <Save size={14} />
                                        {processing ? "Saving" : "Save"}
                                    </button>
                                </div>
                            ))}
                    </section>
                </div>
            </div>
        </Modal>
    );
}

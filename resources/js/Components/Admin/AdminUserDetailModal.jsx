import { useEffect, useMemo, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    BookOpen,
    Mail,
    Pencil,
    Save,
    Shield,
    User,
    UserCog,
    X,
} from "lucide-react";
import Modal from "@/Components/Modal";

function RolePill({ role }) {
    const roleLabel = role === "teacher" ? "Teacher" : "Student";

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {role === "teacher" ? <UserCog size={12} /> : <Shield size={12} />}
            {roleLabel}
        </span>
    );
}

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

export default function AdminUserDetailModal({
    show,
    onClose,
    payload,
    loading = false,
    error = "",
    row,
    mode = "view",
    onSaved,
}) {
    const activeUser = useMemo(
        () => payload?.user || row || null,
        [payload, row],
    );
    const [editMode, setEditMode] = useState(mode === "edit");
    const [panel, setPanel] = useState("info");

    const { data, setData, put, processing, errors, clearErrors } = useForm({
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        role: "student",
    });

    const hydrateForm = (source = null) => {
        const resolvedRole =
            source?.role === "teacher" || source?.role === "student"
                ? source.role
                : "student";

        setData({
            first_name: source?.first_name || "",
            last_name: source?.last_name || "",
            middle_name: source?.middle_name || "",
            email: source?.email || source?.personal_email || "",
            role: resolvedRole,
        });
    };

    useEffect(() => {
        if (!show) {
            return;
        }

        clearErrors();
        hydrateForm(activeUser);
        const shouldEdit = mode === "edit";
        setEditMode(shouldEdit);
        setPanel(shouldEdit ? "edit" : "info");
    }, [show, activeUser?.id, mode]);

    const fullName = [
        activeUser?.first_name,
        activeUser?.middle_name,
        activeUser?.last_name,
    ]
        .filter(Boolean)
        .join(" ");

    const subjectRows = Array.isArray(activeUser?.subjects)
        ? activeUser.subjects
        : [];

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
        hydrateForm(activeUser);
        setEditMode(false);
        setPanel("info");
    };

    const handleSave = () => {
        if (!activeUser?.id) {
            return;
        }

        put(route("admin.users.update", activeUser.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditMode(false);
                setPanel("info");
                onSaved?.(activeUser.id);
                onClose?.();
            },
        });
    };

    const userInitials =
        `${String(activeUser?.first_name || "").charAt(0)}${String(activeUser?.last_name || "").charAt(0)}`
            .toUpperCase()
            .trim() || "U";

    const panelTitle =
        panel === "subjects"
            ? "Subjects and Teachers"
            : panel === "edit"
              ? "Edit User"
              : "User Information";

    const panelSubtitle =
        panel === "subjects"
            ? "Enrolled subjects and assigned teachers"
            : panel === "edit"
              ? "Update user fields with prefilled values"
              : "Personal and role details";

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
                                {userInitials}
                            </div>
                            <p className="text-sm font-semibold text-blue-50">
                                {fullName || "Unnamed User"}
                            </p>
                            <p className="mt-0.5 text-xs text-blue-200">
                                {activeUser?.email ||
                                    activeUser?.personal_email ||
                                    "No email"}
                            </p>
                            <div className="mt-2 inline-flex">
                                <RolePill role={activeUser?.role} />
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
                                    icon={User}
                                    label="User info"
                                />
                                <NavItem
                                    active={panel === "subjects"}
                                    onClick={() => {
                                        setEditMode(false);
                                        setPanel("subjects");
                                    }}
                                    icon={BookOpen}
                                    label="Subjects"
                                    count={subjectRows.length}
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
                                    User ID
                                </p>
                                <p className="font-mono text-xs font-semibold text-blue-900">
                                    {activeUser?.id || "-"}
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
                                    Loading user details...
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
                                        label="First Name"
                                        value={activeUser?.first_name}
                                    />
                                    <DetailRow
                                        label="Middle Name"
                                        value={activeUser?.middle_name}
                                    />
                                    <DetailRow
                                        label="Last Name"
                                        value={activeUser?.last_name}
                                    />
                                    <DetailRow
                                        label="Email"
                                        value={
                                            activeUser?.email ||
                                            activeUser?.personal_email
                                        }
                                    />
                                    <DetailRow
                                        label="Role"
                                        value={activeUser?.role}
                                    />
                                    <DetailRow
                                        label="Section"
                                        value={activeUser?.section}
                                    />
                                </div>
                            )}

                            {panel === "subjects" && (
                                <div className="space-y-2">
                                    {subjectRows.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-blue-200 bg-white px-4 py-4 text-sm text-blue-700">
                                            No enrolled subjects available for
                                            this user.
                                        </div>
                                    ) : (
                                        subjectRows.map((subject, index) => (
                                            <div
                                                key={`${subject.name || "subject"}-${index}`}
                                                className="rounded-lg border border-blue-200 bg-white p-3"
                                            >
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {subject.name ||
                                                        "Unnamed Subject"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-600">
                                                    Teacher:{" "}
                                                    {subject.teacher || "N/A"}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {panel === "edit" && (
                                <div className="space-y-4 rounded-lg border border-blue-200 bg-white p-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                First Name{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.first_name}
                                                onChange={(event) =>
                                                    setData(
                                                        "first_name",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.first_name
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            />
                                            <FieldError
                                                message={errors.first_name}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Last Name{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.last_name}
                                                onChange={(event) =>
                                                    setData(
                                                        "last_name",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.last_name
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            />
                                            <FieldError
                                                message={errors.last_name}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Middle Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.middle_name}
                                                onChange={(event) =>
                                                    setData(
                                                        "middle_name",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.middle_name
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            />
                                            <FieldError
                                                message={errors.middle_name}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Role{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                value={data.role}
                                                onChange={(event) =>
                                                    setData(
                                                        "role",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.role
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            >
                                                <option value="student">
                                                    Student
                                                </option>
                                                <option value="teacher">
                                                    Teacher
                                                </option>
                                            </select>
                                            <FieldError message={errors.role} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail
                                                size={16}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(event) =>
                                                    setData(
                                                        "email",
                                                        event.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.email
                                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            />
                                        </div>
                                        <FieldError message={errors.email} />
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

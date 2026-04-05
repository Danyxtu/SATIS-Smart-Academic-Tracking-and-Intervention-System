import { Head, Link, router, useForm } from "@inertiajs/react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import DeleteConfirmModal from "@/Components/Superadmin/DeleteConfirmModal";
import {
    BookOpen,
    Plus,
    Search,
    X,
    Trash2,
    Hash,
    GraduationCap,
    Calendar,
    Pencil,
    Layers,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";

function SubjectFormModal({
    isOpen,
    mode,
    data,
    setData,
    errors,
    processing,
    onClose,
    onSubmit,
}) {
    if (!isOpen) return null;

    const isEdit = mode === "edit";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-200">
                            <BookOpen size={16} className="text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                {isEdit ? "Edit Subject" : "New Subject"}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {isEdit
                                    ? "Update subject details"
                                    : "Add to the subject catalog"}
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

                {/* Body */}
                <form onSubmit={onSubmit}>
                    <div className="space-y-5 px-6 py-5">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Subject Name{" "}
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.subject_name}
                                onChange={(e) =>
                                    setData("subject_name", e.target.value)
                                }
                                placeholder="e.g., General Mathematics"
                                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
                                    errors.subject_name
                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                        : "border-slate-300 bg-white focus:border-emerald-500 focus:ring-emerald-100"
                                }`}
                            />
                            {errors.subject_name && (
                                <p className="mt-1.5 text-xs text-rose-600">
                                    {errors.subject_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Subject Code{" "}
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.subject_code}
                                onChange={(e) =>
                                    setData(
                                        "subject_code",
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                placeholder="e.g., GENMATH"
                                className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
                                    errors.subject_code
                                        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                        : "border-slate-300 bg-white focus:border-emerald-500 focus:ring-emerald-100"
                                }`}
                            />
                            {errors.subject_code && (
                                <p className="mt-1.5 text-xs text-rose-600">
                                    {errors.subject_code}
                                </p>
                            )}
                            <p className="mt-1.5 text-xs text-slate-400">
                                Letters, numbers, spaces, or hyphens only.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
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
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
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
                            {isEdit ? "Save Changes" : "Create Subject"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, accent }) {
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

export default function Index({ subjects, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [subjectToEdit, setSubjectToEdit] = useState(null);
    const [subjectToDelete, setSubjectToDelete] = useState(null);

    const {
        data: createData,
        setData: setCreateData,
        post,
        processing: createProcessing,
        errors: createErrors,
        reset: resetCreate,
        clearErrors: clearCreateErrors,
    } = useForm({ subject_name: "", subject_code: "" });

    const {
        data: editData,
        setData: setEditData,
        put,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
        clearErrors: clearEditErrors,
    } = useForm({ subject_name: "", subject_code: "" });

    const summary = useMemo(() => {
        const listed = subjects.data.length;
        const assigned = subjects.data.filter(
            (s) => s.classes_count > 0,
        ).length;
        const classLoad = subjects.data.reduce(
            (sum, s) => sum + Number(s.classes_count || 0),
            0,
        );
        return { listed, assigned, classLoad };
    }, [subjects.data]);

    const closeCreateModal = () => {
        clearCreateErrors();
        resetCreate();
        setShowCreateModal(false);
    };

    const closeEditModal = () => {
        clearEditErrors();
        resetEdit();
        setSubjectToEdit(null);
        setShowEditModal(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("superadmin.subjects.index"),
            { search },
            { preserveState: true, replace: true },
        );
    };

    const clearSearch = () => {
        setSearch("");
        router.get(
            route("superadmin.subjects.index"),
            {},
            { preserveState: true, replace: true },
        );
    };

    const openEditModal = (subject) => {
        setSubjectToEdit(subject);
        setEditData({
            subject_name: subject.subject_name,
            subject_code: subject.subject_code,
        });
        setShowEditModal(true);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        post(route("superadmin.subjects.store"), {
            preserveScroll: true,
            onSuccess: closeCreateModal,
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        if (!subjectToEdit) return;
        put(route("superadmin.subjects.update", subjectToEdit.id), {
            preserveScroll: true,
            onSuccess: closeEditModal,
        });
    };

    const handleDelete = () => {
        if (!subjectToDelete) return;
        router.delete(
            route("superadmin.subjects.destroy", subjectToDelete.id),
            {
                preserveScroll: true,
                onFinish: () => {
                    setShowDeleteModal(false);
                    setSubjectToDelete(null);
                },
            },
        );
    };

    return (
        <>
            <Head title="Subject Management" />

            <div className="space-y-6">
                {/* ── Page Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Subject Management
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage the senior high school subject catalog
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                        <Plus size={16} />
                        Add Subject
                    </button>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatCard
                        icon={BookOpen}
                        label="Total Subjects"
                        value={subjects.total}
                        accent="emerald"
                    />
                    <StatCard
                        icon={Layers}
                        label="Assigned Subjects"
                        value={summary.assigned}
                        accent="blue"
                    />
                    <StatCard
                        icon={GraduationCap}
                        label="Total Class Load"
                        value={summary.classLoad}
                        accent="violet"
                    />
                </div>

                {/* ── Search Bar ── */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            size={15}
                        />
                        <input
                            type="text"
                            placeholder="Search by subject name or code…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:text-slate-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Search
                    </button>
                </form>

                {/* ── Table ── */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {subjects.data.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                <BookOpen
                                    size={28}
                                    className="text-slate-400"
                                />
                            </div>
                            <h3 className="mb-1 text-base font-semibold text-slate-800">
                                No subjects found
                            </h3>
                            <p className="mb-6 max-w-xs text-sm text-slate-500">
                                {search
                                    ? "Try a different search term."
                                    : "Get started by adding the first subject."}
                            </p>
                            {!search && (
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <Plus size={16} />
                                    Add First Subject
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Table head */}
                            <div className="grid grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3">
                                <div className="col-span-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Subject
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Code
                                </div>
                                <div className="col-span-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Classes
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Updated
                                </div>
                                <div className="col-span-1 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Actions
                                </div>
                            </div>

                            {/* Table rows */}
                            <div className="divide-y divide-slate-100">
                                {subjects.data.map((subject) => (
                                    <div
                                        key={subject.id}
                                        className="grid grid-cols-12 items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70"
                                    >
                                        {/* Name + created date */}
                                        <div className="col-span-5 min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {subject.subject_name}
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                                <Calendar size={11} />
                                                {new Date(
                                                    subject.created_at,
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>

                                        {/* Code badge */}
                                        <div className="col-span-2">
                                            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700">
                                                {subject.subject_code}
                                            </span>
                                        </div>

                                        {/* Classes count */}
                                        <div className="col-span-2 flex justify-center">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    subject.classes_count > 0
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                <GraduationCap size={11} />
                                                {subject.classes_count}
                                            </span>
                                        </div>

                                        {/* Updated date */}
                                        <div className="col-span-2">
                                            <p className="text-xs text-slate-500">
                                                {new Date(
                                                    subject.updated_at,
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-1 flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditModal(subject)
                                                }
                                                title="Edit"
                                                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSubjectToDelete(subject);
                                                    setShowDeleteModal(true);
                                                }}
                                                title="Delete"
                                                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {subjects.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                                    <p className="text-xs text-slate-500">
                                        Showing{" "}
                                        <span className="font-semibold text-slate-700">
                                            {subjects.from}–{subjects.to}
                                        </span>{" "}
                                        of{" "}
                                        <span className="font-semibold text-slate-700">
                                            {subjects.total}
                                        </span>{" "}
                                        subjects
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {subjects.links.map((link, index) => {
                                            const isPrev = index === 0;
                                            const isNext =
                                                index ===
                                                subjects.links.length - 1;
                                            const isNav = isPrev || isNext;

                                            return (
                                                <Link
                                                    key={index}
                                                    href={link.url || "#"}
                                                    className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors ${
                                                        link.active
                                                            ? "bg-emerald-600 text-white"
                                                            : link.url
                                                              ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                              : "cursor-not-allowed border border-slate-100 text-slate-300"
                                                    }`}
                                                    dangerouslySetInnerHTML={
                                                        isNav
                                                            ? undefined
                                                            : {
                                                                  __html: link.label,
                                                              }
                                                    }
                                                >
                                                    {isNav ? (
                                                        isPrev ? (
                                                            <ChevronLeft
                                                                size={14}
                                                            />
                                                        ) : (
                                                            <ChevronRight
                                                                size={14}
                                                            />
                                                        )
                                                    ) : null}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            <SubjectFormModal
                isOpen={showCreateModal}
                mode="create"
                data={createData}
                setData={setCreateData}
                errors={createErrors}
                processing={createProcessing}
                onClose={closeCreateModal}
                onSubmit={handleCreate}
            />
            <SubjectFormModal
                isOpen={showEditModal}
                mode="edit"
                data={editData}
                setData={setEditData}
                errors={editErrors}
                processing={editProcessing}
                onClose={closeEditModal}
                onSubmit={handleUpdate}
            />
            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSubjectToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Delete Subject"
                itemName={subjectToDelete?.subject_name}
                description="This will permanently remove the subject if it is not linked to active classes. This action cannot be undone."
            />
        </>
    );
}

Index.layout = (page) => <SchoolStaffLayout children={page} />;

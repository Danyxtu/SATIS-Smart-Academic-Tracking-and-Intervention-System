import { Head, Link, router, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import {
    AlertTriangle,
    GitBranch,
    Loader2,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import SchoolTrackDetailModal from "@/Components/Superadmin/SchoolTrackDetailModal";

function TrackModal({
    isOpen,
    onClose,
    processing,
    errors,
    data,
    setData,
    onSubmit,
}) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 pb-10 sm:items-center">
            <div
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white">
                            <GitBranch size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">
                                Create School Track
                            </p>
                            <p className="text-xs text-emerald-100">
                                Configure track details for department
                                filtering.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg p-1.5 text-emerald-100 transition-colors hover:bg-white/15 hover:text-white"
                    >
                        <X size={15} />
                    </button>
                </div>

                <form onSubmit={onSubmit}>
                    <div className="space-y-4 p-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Track Name{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.track_name}
                                    onChange={(event) =>
                                        setData(
                                            "track_name",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g., Arts and Design Track"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                />
                                {errors.track_name && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {errors.track_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Track Code{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.track_code}
                                    onChange={(event) =>
                                        setData(
                                            "track_code",
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="e.g., ARTS_DESIGN"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                />
                                {errors.track_code && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {errors.track_code}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                School Year{" "}
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.school_year}
                                onChange={(event) =>
                                    setData("school_year", event.target.value)
                                }
                                placeholder="e.g., 2026-2027"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                            />
                            {errors.school_year && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.school_year}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Description
                            </label>
                            <textarea
                                rows={3}
                                value={data.description || ""}
                                onChange={(event) =>
                                    setData("description", event.target.value)
                                }
                                placeholder="Optional description"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                            />
                            {errors.description && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            Create Track
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteTrackModal({ isOpen, track, deleting, onClose, onConfirm }) {
    const [confirmName, setConfirmName] = useState("");
    const [copyState, setCopyState] = useState("idle");

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setConfirmName("");
        setCopyState("idle");
    }, [isOpen, track?.id]);

    if (!isOpen || !track) {
        return null;
    }

    const expectedName = String(track.track_name || "").trim();
    const canDelete = confirmName.trim() === expectedName;

    const handleCopyName = async () => {
        if (!expectedName) {
            return;
        }

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(expectedName);
                setCopyState("copied");
                return;
            }

            throw new Error("Clipboard not available");
        } catch (_error) {
            setCopyState("failed");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 pb-10 sm:items-center">
            <div
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                onClick={deleting ? undefined : onClose}
            />

            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-rose-100 bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white">
                            <AlertTriangle size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">
                                Delete School Track
                            </p>
                            <p className="text-xs text-rose-100">
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="rounded-lg p-1.5 text-rose-100 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-60"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="space-y-3 p-5">
                    <p className="text-sm text-slate-700">
                        Are you sure you want to delete this school track?
                    </p>

                    <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5">
                        <p className="text-sm font-semibold text-slate-900">
                            {track.track_name}
                        </p>
                        <p className="text-xs text-slate-600">
                            {track.track_code} •{" "}
                            {track.school_year || "No school year"}
                        </p>
                    </div>

                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Type track name to confirm
                            </p>
                            <button
                                type="button"
                                onClick={handleCopyName}
                                disabled={deleting}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                            >
                                Copy Name
                            </button>
                        </div>

                        <input
                            type="text"
                            value={confirmName}
                            onChange={(event) =>
                                setConfirmName(event.target.value)
                            }
                            placeholder={expectedName}
                            disabled={deleting}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                        />

                        {copyState === "copied" ? (
                            <p className="text-[11px] font-medium text-emerald-600">
                                Track name copied. Paste it above to confirm.
                            </p>
                        ) : null}

                        {copyState === "failed" ? (
                            <p className="text-[11px] font-medium text-amber-600">
                                Could not copy automatically. Please copy the
                                track name manually.
                            </p>
                        ) : null}

                        {!canDelete ? (
                            <p className="text-[11px] font-medium text-rose-600">
                                Enter the exact track name to enable deletion.
                            </p>
                        ) : null}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={deleting}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => onConfirm(track)}
                            disabled={deleting || !canDelete}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                            {deleting ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : null}
                            {deleting ? "Deleting..." : "Delete Track"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Index({
    schoolTracks,
    schoolYears = [],
    filters,
    currentSchoolYear,
}) {
    const [search, setSearch] = useState(filters.search || "");
    const [schoolYear, setSchoolYear] = useState(filters.school_year || "");
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletingTrack, setDeletingTrack] = useState(false);

    const { data, setData, post, processing, errors, clearErrors, reset } =
        useForm({
            track_name: "",
            track_code: "",
            school_year: currentSchoolYear || "",
            description: "",
        });

    useEffect(() => {
        setSearch(filters.search || "");
        setSchoolYear(filters.school_year || "");
    }, [filters.search, filters.school_year]);

    const visitIndex = (nextSearch, nextSchoolYear) => {
        const query = {};

        if (nextSearch?.trim()) {
            query.search = nextSearch.trim();
        }

        if (nextSchoolYear) {
            query.school_year = nextSchoolYear;
        }

        router.get(route("superadmin.school-tracks.index"), query, {
            preserveState: true,
            replace: true,
        });
    };

    const openCreateModal = () => {
        clearErrors();
        reset();
        setData("school_year", currentSchoolYear || "");
        setShowModal(true);
    };

    const openDetailModal = (track) => {
        setSelectedTrack(track);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedTrack(null);
    };

    const closeDeleteModal = () => {
        if (deletingTrack) {
            return;
        }

        setDeleteTarget(null);
    };

    const closeModal = () => {
        if (processing) {
            return;
        }

        clearErrors();
        setShowModal(false);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        post(route("superadmin.school-tracks.store"), {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    };

    const handleSearch = (event) => {
        event.preventDefault();
        visitIndex(search, schoolYear);
    };

    const clearSearch = () => {
        setSearch("");
        visitIndex("", schoolYear);
    };

    const handleDelete = (track) => {
        setDeleteTarget(track);
    };

    const confirmDelete = (track) => {
        if (!track?.id) {
            return;
        }

        setDeletingTrack(true);
        router.delete(route("superadmin.school-tracks.destroy", track.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeletingTrack(false);
            },
            onSuccess: () => {
                setDeleteTarget(null);
            },
        });
    };

    return (
        <>
            <Head title="School Tracks Management" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            School Tracks Management
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Create and maintain school tracks used for
                            department filtering.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                        <Plus size={16} />
                        Add School Track
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col gap-3 sm:flex-row"
                    >
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                size={15}
                            />
                            <input
                                type="text"
                                placeholder="Search by track name, code, or description..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
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

                        <select
                            value={schoolYear}
                            onChange={(event) => {
                                const nextYear = event.target.value;
                                setSchoolYear(nextYear);
                                visitIndex(search, nextYear);
                            }}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
                        >
                            <option value="">All School Years</option>
                            {schoolYears.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            Search
                        </button>
                    </form>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {schoolTracks.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                <GitBranch
                                    size={28}
                                    className="text-slate-400"
                                />
                            </div>
                            <h3 className="mb-1 text-base font-semibold text-slate-800">
                                No school tracks found
                            </h3>
                            <p className="mb-6 max-w-xs text-sm text-slate-500">
                                Add a track to organize departments by academic
                                pathways.
                            </p>
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                                <Plus size={16} />
                                Create First Track
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3">
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Track
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Code
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    School Year
                                </div>
                                <div className="col-span-1 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                                    Depts
                                </div>
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Description
                                </div>
                                <div className="col-span-1 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Actions
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {schoolTracks.data.map((track) => (
                                    <div
                                        key={track.id}
                                        className="grid grid-cols-12 items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70 cursor-pointer"
                                        onClick={() => openDetailModal(track)}
                                    >
                                        <div className="col-span-3 min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {track.track_name}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                Updated{" "}
                                                {new Date(
                                                    track.updated_at,
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>

                                        <div className="col-span-2">
                                            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700">
                                                {track.track_code}
                                            </span>
                                        </div>

                                        <div className="col-span-2">
                                            <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                                {track.school_year || "-"}
                                            </span>
                                        </div>

                                        <div className="col-span-1 text-center">
                                            <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                {track.departments_count}
                                            </span>
                                        </div>

                                        <div className="col-span-3">
                                            <p className="truncate text-xs text-slate-600">
                                                {track.description ||
                                                    "No description"}
                                            </p>
                                        </div>

                                        <div className="col-span-1 flex items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleDelete(track);
                                                }}
                                                className="rounded-lg bg-rose-50 p-2 text-rose-700 transition-colors hover:bg-rose-100"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {schoolTracks.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 bg-slate-50/60">
                                    <p className="text-xs text-slate-500">
                                        Showing {schoolTracks.from}-
                                        {schoolTracks.to} of{" "}
                                        {schoolTracks.total} tracks
                                    </p>
                                    <div className="flex gap-1">
                                        {schoolTracks.links.map(
                                            (link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || "#"}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                        link.active
                                                            ? "bg-emerald-600 text-white"
                                                            : link.url
                                                              ? "text-slate-600 hover:bg-slate-100"
                                                              : "text-slate-300 cursor-not-allowed"
                                                    }`}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <TrackModal
                isOpen={showModal}
                onClose={closeModal}
                processing={processing}
                errors={errors}
                data={data}
                setData={setData}
                onSubmit={handleSubmit}
            />

            <SchoolTrackDetailModal
                show={showDetailModal}
                onClose={closeDetailModal}
                track={selectedTrack}
                onSaved={() =>
                    router.reload({ only: ["schoolTracks", "filters"] })
                }
            />

            <DeleteTrackModal
                isOpen={Boolean(deleteTarget)}
                track={deleteTarget}
                deleting={deletingTrack}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
            />
        </>
    );
}

Index.layout = (page) => <SchoolStaffLayout children={page} />;

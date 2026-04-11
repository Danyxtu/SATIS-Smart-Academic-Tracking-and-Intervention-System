import { Head, Link, router } from "@inertiajs/react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import {
    Building2,
    Plus,
    Search,
    Edit,
    Trash2,
    Users,
    GraduationCap,
    UserCog,
    Filter,
    X,
    CheckCircle,
    XCircle,
    Calendar,
    Hash,
    FileText,
    Activity,
    MoreVertical,
    TrendingUp,
    ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";

import DeleteConfirmModal from "@/Components/Superadmin/DeleteConfirmModal";
import EditDepartmentModal from "@/Components/Superadmin/EditDepartmentModal";
import CreateDepartmentModal from "@/Components/Superadmin/CreateDepartmentModal";

export default function Index({ departments, filters, trackOptions = [] }) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");
    const [activeTrack, setActiveTrack] = useState(filters.track || "Academic");
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [departmentToEdit, setDepartmentToEdit] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        setSearch(filters.search || "");
        setStatus(filters.status || "");
        setActiveTrack(filters.track || "Academic");
    }, [filters.search, filters.status, filters.track]);

    const openModal = (dept) => {
        setSelectedDepartment(dept);
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
        setSelectedDepartment(null);
    };
    const confirmDelete = (dept) => {
        setDepartmentToDelete(dept);
        setShowDeleteModal(true);
    };
    const openEditModal = (dept) => {
        setDepartmentToEdit(dept);
        setShowEditModal(true);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("superadmin.departments.index"),
            { search, status, track: activeTrack },
            { preserveState: true },
        );
    };

    const handleDelete = () => {
        router.delete(
            route("superadmin.departments.destroy", departmentToDelete.id),
            {
                onFinish: () => {
                    setShowDeleteModal(false);
                    setDepartmentToDelete(null);
                },
            },
        );
    };

    const handleToggleStatus = (department) => {
        router.post(
            route("superadmin.departments.toggle-status", department.id),
            {},
            { preserveState: true },
        );
    };

    // Summary stats from current page data
    const totalActive = departments.data.filter((d) => d.is_active).length;
    const totalInactive = departments.data.filter((d) => !d.is_active).length;
    const totalMembers = departments.data.reduce(
        (sum, d) =>
            sum +
            (d.admins_count || 0) +
            (d.teachers_count || 0) +
            (d.students_count || 0),
        0,
    );

    return (
        <>
            <Head title="Departments" />

            <div className="space-y-5">
                {/* ── Hero Header ─────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-7 py-6 shadow-lg shadow-blue-500/20">
                    <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-indigo-400/20 blur-xl" />

                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 p-3">
                                <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">
                                    Departments
                                </h1>
                                <p className="text-sm text-blue-100 mt-0.5">
                                    Manage academic departments and their
                                    settings
                                </p>
                            </div>
                        </div>

                        {/* Quick stats row */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/15">
                                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                <span className="text-xs font-semibold text-white">
                                    {totalActive} Active
                                </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/15">
                                <div className="h-2 w-2 rounded-full bg-slate-400" />
                                <span className="text-xs font-semibold text-white">
                                    {totalInactive} Inactive
                                </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/15">
                                <Users size={13} className="text-blue-200" />
                                <span className="text-xs font-semibold text-white">
                                    {totalMembers} Members
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
                            >
                                <Plus size={16} />
                                Add Department
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Search & Filter Bar ──────────────────────────────── */}
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4">
                    <div className="mb-3 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                        {(trackOptions.length > 0
                            ? trackOptions
                            : ["Academic", "TVL"]
                        ).map((track) => (
                            <button
                                key={track}
                                type="button"
                                onClick={() => {
                                    setActiveTrack(track);
                                    router.get(
                                        route("superadmin.departments.index"),
                                        {
                                            search,
                                            status,
                                            track,
                                        },
                                        { preserveState: true },
                                    );
                                }}
                                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                                    activeTrack === track
                                        ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {track}
                            </button>
                        ))}
                    </div>

                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col sm:flex-row gap-3"
                    >
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                size={16}
                            />
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border-slate-200 bg-slate-50 pl-10 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        router.get(
                                            route(
                                                "superadmin.departments.index",
                                            ),
                                            {
                                                status,
                                                track: activeTrack,
                                            },
                                            { preserveState: true },
                                        );
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Status filter as tabs */}
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 gap-0.5">
                            {[
                                { value: "", label: "All" },
                                { value: "active", label: "Active" },
                                { value: "inactive", label: "Inactive" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        setStatus(opt.value);
                                        router.get(
                                            route(
                                                "superadmin.departments.index",
                                            ),
                                            {
                                                search,
                                                status: opt.value,
                                                track: activeTrack,
                                            },
                                            { preserveState: true },
                                        );
                                    }}
                                    className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                                        status === opt.value
                                            ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* ── Departments Table ────────────────────────────────── */}
                <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                    {departments.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                            <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <Building2 className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 mb-1">
                                No departments found
                            </h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-xs">
                                {search || status
                                    ? "Try adjusting your search or filter."
                                    : "Get started by creating your first department."}
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25"
                            >
                                <Plus size={16} />
                                Create Department
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100">
                                <div className="col-span-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Department
                                </div>
                                <div className="col-span-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Code
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                                    Members
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                                    Status
                                </div>
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                                    Actions
                                </div>
                            </div>

                            {/* Table rows */}
                            <div className="divide-y divide-slate-50">
                                {departments.data.map((dept) => (
                                    <div
                                        key={dept.id}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/60 transition-colors group cursor-pointer"
                                        onClick={() => openModal(dept)}
                                    >
                                        {/* Department name */}
                                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                                                <Building2 size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm truncate">
                                                    {dept.department_name}
                                                </p>
                                                {dept.description && (
                                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                                        {dept.description}
                                                    </p>
                                                )}
                                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                                    Track:{" "}
                                                    {dept.track || "Academic"}
                                                </p>
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    {Array.isArray(
                                                        dept.specializations,
                                                    ) &&
                                                    dept.specializations
                                                        .length > 0
                                                        ? `Specializations: ${dept.specializations
                                                              .map(
                                                                  (item) =>
                                                                      item.specialization_name,
                                                              )
                                                              .join(", ")}`
                                                        : "Specializations: None"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Code */}
                                        <div className="col-span-1">
                                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 tracking-wide">
                                                {dept.department_code}
                                            </span>
                                        </div>

                                        {/* Members — compact icon trio */}
                                        <div className="col-span-2 flex items-center justify-center gap-3">
                                            <div
                                                className="flex items-center gap-1"
                                                title="Admins"
                                            >
                                                <div className="h-5 w-5 rounded-md bg-violet-100 flex items-center justify-center">
                                                    <UserCog
                                                        size={10}
                                                        className="text-violet-600"
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">
                                                    {dept.admins_count}
                                                </span>
                                            </div>
                                            <div
                                                className="flex items-center gap-1"
                                                title="Teachers"
                                            >
                                                <div className="h-5 w-5 rounded-md bg-emerald-100 flex items-center justify-center">
                                                    <Users
                                                        size={10}
                                                        className="text-emerald-600"
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">
                                                    {dept.teachers_count}
                                                </span>
                                            </div>
                                            <div
                                                className="flex items-center gap-1"
                                                title="Students"
                                            >
                                                <div className="h-5 w-5 rounded-md bg-amber-100 flex items-center justify-center">
                                                    <GraduationCap
                                                        size={10}
                                                        className="text-amber-600"
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">
                                                    {dept.students_count}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status toggle */}
                                        <div className="col-span-2 flex justify-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleStatus(dept);
                                                }}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                                                    dept.is_active
                                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                }`}
                                            >
                                                <div
                                                    className={`h-1.5 w-1.5 rounded-full ${dept.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                                                />
                                                {dept.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </button>
                                        </div>

                                        {/* Actions */}
                                        <div
                                            className="col-span-3 flex items-center justify-end gap-1.5"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => openModal(dept)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() =>
                                                    openEditModal(dept)
                                                }
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    confirmDelete(dept)
                                                }
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {departments.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                                    <p className="text-xs text-slate-500">
                                        Showing{" "}
                                        <span className="font-semibold text-slate-700">
                                            {departments.from}–{departments.to}
                                        </span>{" "}
                                        of{" "}
                                        <span className="font-semibold text-slate-700">
                                            {departments.total}
                                        </span>{" "}
                                        departments
                                    </p>
                                    <div className="flex gap-1">
                                        {departments.links.map(
                                            (link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || "#"}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                        link.active
                                                            ? "bg-blue-600 text-white shadow-sm"
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

            {/* ── Department Detail Modal ──────────────────────────────── */}
            {showModal && selectedDepartment && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={closeModal}
                    />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl">
                            {/* Header */}
                            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-7">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                                <button
                                    onClick={closeModal}
                                    className="absolute top-3 right-3 z-10 rounded-xl p-2.5 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                                <div className="relative flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shrink-0">
                                        <Building2 className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white leading-tight">
                                            {selectedDepartment.department_name}
                                        </h2>
                                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold text-white">
                                                <Hash size={10} />
                                                {
                                                    selectedDepartment.department_code
                                                }
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                                                    selectedDepartment.is_active
                                                        ? "bg-emerald-400/20 text-emerald-100"
                                                        : "bg-slate-400/20 text-slate-200"
                                                }`}
                                            >
                                                <div
                                                    className={`h-1.5 w-1.5 rounded-full ${selectedDepartment.is_active ? "bg-emerald-400" : "bg-slate-400"}`}
                                                />
                                                {selectedDepartment.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-4">
                                {/* Description */}
                                {selectedDepartment.description && (
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                            Description
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {selectedDepartment.description}
                                        </p>
                                    </div>
                                )}

                                <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-1">
                                        Track
                                    </p>
                                    <p className="text-sm font-semibold text-indigo-900">
                                        {selectedDepartment.track || "Academic"}
                                    </p>

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mt-3 mb-1">
                                        Specializations
                                    </p>
                                    {Array.isArray(
                                        selectedDepartment.specializations,
                                    ) &&
                                    selectedDepartment.specializations.length >
                                        0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedDepartment.specializations.map(
                                                (item) => (
                                                    <span
                                                        key={item.id}
                                                        className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700"
                                                    >
                                                        {
                                                            item.specialization_name
                                                        }
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-indigo-700">
                                            No specialization assigned.
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1">
                                        Department Admin
                                    </p>
                                    {selectedDepartment.department_admin ? (
                                        <>
                                            <p className="text-sm font-semibold text-blue-900">
                                                {
                                                    selectedDepartment
                                                        .department_admin.name
                                                }
                                            </p>
                                            <p className="text-xs text-blue-700 mt-0.5">
                                                {
                                                    selectedDepartment
                                                        .department_admin.email
                                                }
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-blue-700">
                                            No admin assigned yet.
                                        </p>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-center">
                                        <div className="h-9 w-9 mx-auto rounded-lg bg-violet-100 flex items-center justify-center mb-2">
                                            <UserCog
                                                size={16}
                                                className="text-violet-600"
                                            />
                                        </div>
                                        <p className="text-2xl font-bold text-violet-700">
                                            {selectedDepartment.admins_count}
                                        </p>
                                        <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide mt-0.5">
                                            Admins
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                                        <div className="h-9 w-9 mx-auto rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
                                            <Users
                                                size={16}
                                                className="text-emerald-600"
                                            />
                                        </div>
                                        <p className="text-2xl font-bold text-emerald-700">
                                            {selectedDepartment.teachers_count}
                                        </p>
                                        <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide mt-0.5">
                                            Teachers
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                                        <div className="h-9 w-9 mx-auto rounded-lg bg-amber-100 flex items-center justify-center mb-2">
                                            <GraduationCap
                                                size={16}
                                                className="text-amber-600"
                                            />
                                        </div>
                                        <p className="text-2xl font-bold text-amber-700">
                                            {selectedDepartment.students_count}
                                        </p>
                                        <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide mt-0.5">
                                            Students
                                        </p>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-2.5">
                                    {selectedDepartment.created_at && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-slate-500 text-xs">
                                                <Calendar size={13} />
                                                Created
                                            </span>
                                            <span className="font-medium text-slate-700 text-xs">
                                                {new Date(
                                                    selectedDepartment.created_at,
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-slate-500 text-xs">
                                            <Users size={13} />
                                            Total Members
                                        </span>
                                        <span className="font-bold text-slate-800 text-sm">
                                            {(selectedDepartment.admins_count ||
                                                0) +
                                                (selectedDepartment.teachers_count ||
                                                    0) +
                                                (selectedDepartment.students_count ||
                                                    0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 bg-slate-50/50 rounded-b-2xl">
                                <button
                                    onClick={closeModal}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    Close
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            confirmDelete(selectedDepartment);
                                            closeModal();
                                        }}
                                        className="rounded-xl px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => {
                                            closeModal();
                                            openEditModal(selectedDepartment);
                                        }}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                                    >
                                        <Edit size={14} />
                                        Edit Department
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDepartmentToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Delete Department"
                itemName={departmentToDelete?.department_name}
                description="This will permanently remove the department and all its associated data. This action cannot be undone."
            />
            <EditDepartmentModal
                key={departmentToEdit?.id}
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setDepartmentToEdit(null);
                }}
                department={departmentToEdit}
                onSuccess={() => router.reload({ only: ["departments"] })}
            />
            <CreateDepartmentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => router.reload({ only: ["departments"] })}
                defaultTrack={activeTrack}
            />
        </>
    );
}

Index.layout = (page) => <SchoolStaffLayout children={page} />;

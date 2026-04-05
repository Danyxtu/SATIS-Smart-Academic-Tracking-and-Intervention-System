import { Head, Link, router } from "@inertiajs/react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import {
    UserCog,
    Plus,
    Search,
    Pencil,
    Trash2,
    Building2,
    Mail,
    Calendar,
    Users,
    Shield,
    X,
    AlertTriangle,
    Eye,
    ChevronRight,
} from "lucide-react";
import { useState } from "react";

export default function Index({ admins, departments, filters }) {
    const [search, setSearch] = useState(filters?.search || "");
    const [departmentFilter, setDepartmentFilter] = useState(
        filters?.department || "",
    );
    const [deleteModal, setDeleteModal] = useState({
        open: false,
        admin: null,
        password: "",
    });
    const [deleteErrors, setDeleteErrors] = useState({});

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("superadmin.admins.index"),
            { search, department: departmentFilter },
            { preserveState: true },
        );
    };

    const handleDepartmentChange = (value) => {
        setDepartmentFilter(value);
        router.get(
            route("superadmin.admins.index"),
            { search, department: value },
            { preserveState: true },
        );
    };

    const handleDelete = () => {
        if (deleteModal.admin) {
            router.delete(
                route("superadmin.admins.destroy", deleteModal.admin.id),
                {
                    data: { password: deleteModal.password },
                    onSuccess: () => {
                        setDeleteModal({
                            open: false,
                            admin: null,
                            password: "",
                        });
                        setDeleteErrors({});
                    },
                    onError: (errors) => setDeleteErrors(errors),
                },
            );
        }
    };

    const closeDeleteModal = () => {
        setDeleteModal({ open: false, admin: null, password: "" });
        setDeleteErrors({});
    };

    // Summary stats
    const totalAdmins = admins?.total ?? admins?.data?.length ?? 0;
    const uniqueDepts = new Set(
        admins?.data?.map((a) => a.department?.id).filter(Boolean),
    ).size;

    return (
        <>
            <Head title="Admin Management" />

            <div className="space-y-5">
                {/* ── Hero Header ─────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 px-7 py-6 shadow-lg shadow-violet-500/20">
                    <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-purple-400/20 blur-xl" />

                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 p-3">
                                <UserCog className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">
                                    Admin Management
                                </h1>
                                <p className="text-sm text-violet-100 mt-0.5">
                                    Manage department administrators across the
                                    system
                                </p>
                            </div>
                        </div>

                        {/* Quick stats + CTA */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/15">
                                <UserCog
                                    size={13}
                                    className="text-violet-200"
                                />
                                <span className="text-xs font-semibold text-white">
                                    {totalAdmins} Admins
                                </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/15">
                                <Building2
                                    size={13}
                                    className="text-violet-200"
                                />
                                <span className="text-xs font-semibold text-white">
                                    {uniqueDepts} Departments
                                </span>
                            </div>
                            <Link
                                href={route("superadmin.admins.create")}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm hover:bg-violet-50 transition-colors"
                            >
                                <Plus size={16} />
                                Add Admin
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Search & Filter Bar ──────────────────────────────── */}
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4">
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
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full rounded-xl border-slate-200 bg-slate-50 pl-10 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500 focus:bg-white transition-colors"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        router.get(
                                            route("superadmin.admins.index"),
                                            { department: departmentFilter },
                                            { preserveState: true },
                                        );
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Department filter */}
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-w-[180px]">
                            <Building2
                                size={14}
                                className="text-slate-400 shrink-0"
                            />
                            <select
                                value={departmentFilter}
                                onChange={(e) =>
                                    handleDepartmentChange(e.target.value)
                                }
                                className="flex-1 border-0 bg-transparent text-sm focus:ring-0 text-slate-600 font-medium"
                            >
                                <option value="">All Departments</option>
                                {departments?.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.department_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* ── Admins Table ─────────────────────────────────────── */}
                <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                    {admins?.data?.length > 0 ? (
                        <>
                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100">
                                <div className="col-span-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Admin
                                </div>
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Department
                                </div>
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Email
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                                    Actions
                                </div>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-slate-50">
                                {admins.data.map((admin) => (
                                    <div
                                        key={admin.id}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/60 transition-colors group"
                                    >
                                        {/* Admin */}
                                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-bold shadow-sm">
                                                {admin.name
                                                    ?.charAt(0)
                                                    .toUpperCase() || "A"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm truncate">
                                                    {admin.name}
                                                </p>
                                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Shield size={9} />
                                                    {admin.role || "Admin"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Department */}
                                        <div className="col-span-3 flex items-center gap-2 min-w-0">
                                            <div className="h-7 w-7 shrink-0 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Building2
                                                    size={13}
                                                    className="text-blue-600"
                                                />
                                            </div>
                                            <span className="text-sm text-slate-700 font-medium truncate">
                                                {admin.department
                                                    ?.department_name || (
                                                    <span className="text-slate-400 font-normal italic">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        {/* Email */}
                                        <div className="col-span-3 flex items-center gap-2 min-w-0">
                                            <Mail
                                                size={13}
                                                className="text-slate-400 shrink-0"
                                            />
                                            <span className="text-sm text-slate-600 truncate">
                                                {admin.email}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                                            <Link
                                                href={route(
                                                    "superadmin.admins.show",
                                                    admin.id,
                                                )}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                href={route(
                                                    "superadmin.admins.edit",
                                                    admin.id,
                                                )}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setDeleteModal({
                                                        open: true,
                                                        admin,
                                                        password: "",
                                                    });
                                                    setDeleteErrors({});
                                                }}
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {admins?.links && admins.links.length > 3 && (
                                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                                    <p className="text-xs text-slate-500">
                                        Showing{" "}
                                        <span className="font-semibold text-slate-700">
                                            {admins.from}–{admins.to}
                                        </span>{" "}
                                        of{" "}
                                        <span className="font-semibold text-slate-700">
                                            {admins.total}
                                        </span>{" "}
                                        admins
                                    </p>
                                    <div className="flex gap-1">
                                        {admins.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || "#"}
                                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                    link.active
                                                        ? "bg-violet-600 text-white shadow-sm"
                                                        : link.url
                                                          ? "text-slate-600 hover:bg-slate-100"
                                                          : "text-slate-300 cursor-not-allowed"
                                                }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                            <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <UserCog size={36} className="text-slate-300" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 mb-1">
                                No admins found
                            </h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-xs">
                                {search || departmentFilter
                                    ? "Try adjusting your search or filter criteria."
                                    : "Get started by creating a new department administrator."}
                            </p>
                            {!search && !departmentFilter && (
                                <Link
                                    href={route("superadmin.admins.create")}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25"
                                >
                                    <Plus size={16} />
                                    Add Admin
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Delete Modal ─────────────────────────────────────────── */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={closeDeleteModal}
                    />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-md transform rounded-2xl bg-white shadow-2xl">
                            {/* Header */}
                            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-rose-500 to-red-600 px-6 py-6">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                                <button
                                    onClick={closeDeleteModal}
                                    className="absolute top-3 right-3 z-10 rounded-xl p-3 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                                <div className="relative flex items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                        <Trash2 className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            Delete Admin
                                        </h2>
                                        <p className="text-sm text-rose-100 mt-0.5">
                                            This action is irreversible
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5 space-y-4">
                                {/* Warning */}
                                <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3">
                                    <AlertTriangle
                                        size={16}
                                        className="text-rose-500 mt-0.5 shrink-0"
                                    />
                                    <p className="text-sm text-rose-700 leading-relaxed">
                                        You are about to permanently delete{" "}
                                        <span className="font-semibold">
                                            {deleteModal.admin?.name}
                                        </span>
                                        . This will remove their access and all
                                        associated data.
                                    </p>
                                </div>

                                {/* Admin info preview */}
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-bold">
                                        {deleteModal.admin?.name
                                            ?.charAt(0)
                                            .toUpperCase() || "A"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm">
                                            {deleteModal.admin?.name}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {deleteModal.admin?.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Password confirm */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                        Enter your password to confirm
                                    </label>
                                    <input
                                        type="password"
                                        value={deleteModal.password}
                                        onChange={(e) =>
                                            setDeleteModal({
                                                ...deleteModal,
                                                password: e.target.value,
                                            })
                                        }
                                        placeholder="Your password"
                                        className={`w-full rounded-xl border text-sm px-4 py-2.5 focus:outline-none focus:ring-2 transition-colors ${
                                            deleteErrors.password
                                                ? "border-rose-300 focus:ring-rose-500/30 bg-rose-50/50"
                                                : "border-slate-200 focus:ring-blue-500/30 bg-slate-50"
                                        }`}
                                    />
                                    {deleteErrors.password && (
                                        <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                                            <AlertTriangle size={11} />
                                            {deleteErrors.password}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
                                <button
                                    onClick={closeDeleteModal}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all hover:-translate-y-0.5"
                                >
                                    <Trash2 size={14} />
                                    Delete Admin
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Index.layout = (page) => <SchoolStaffLayout children={page} />;

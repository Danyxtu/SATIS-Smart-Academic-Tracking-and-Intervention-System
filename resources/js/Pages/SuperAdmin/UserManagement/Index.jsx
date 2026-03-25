import { Head, Link, router, useForm } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    Users,
    Plus,
    Search,
    Pencil,
    Trash2,
    Mail,
    Shield,
    X,
    AlertTriangle,
    GraduationCap,
    BookOpen,
    Crown,
    Lock,
    Eye,
    EyeOff,
    Copy,
    RefreshCw,
    Info,
    CheckCircle,
    Save,
    UserPlus,
} from "lucide-react";
import { useState } from "react";
import EditUserModal from "@/Components/Superadmin/EditUserModal";
import CreateUserModal from "@/Components/Superadmin/CreateUserModal";

// ─── Role config ─────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
    super_admin: {
        label: "Super Admin",
        icon: Crown,
        badgeClass: "bg-amber-100 text-amber-700",
        filterActive: "bg-amber-500 text-white shadow-amber-200",
        filterInactive:
            "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100",
        dot: "bg-amber-500",
        avatarStyle: {
            background: "linear-gradient(135deg, #f59e0b, #ea580c)",
        },
    },
    admin: {
        label: "Admin",
        icon: Shield,
        badgeClass: "bg-violet-100 text-violet-700",
        filterActive: "bg-violet-600 text-white shadow-violet-200",
        filterInactive:
            "bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100",
        dot: "bg-violet-500",
        avatarStyle: {
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
        },
    },
    teacher: {
        label: "Teacher",
        icon: BookOpen,
        badgeClass: "bg-blue-100 text-blue-700",
        filterActive: "bg-blue-600 text-white shadow-blue-200",
        filterInactive:
            "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100",
        dot: "bg-blue-500",
        avatarStyle: {
            background: "linear-gradient(135deg, #3b82f6, #0891b2)",
        },
    },
    student: {
        label: "Student",
        icon: GraduationCap,
        badgeClass: "bg-emerald-100 text-emerald-700",
        filterActive: "bg-emerald-600 text-white shadow-emerald-200",
        filterInactive:
            "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100",
        dot: "bg-emerald-500",
        avatarStyle: {
            background: "linear-gradient(135deg, #10b981, #0d9488)",
        },
    },
};

const ROLE_ORDER = ["super_admin", "admin", "teacher", "student"];

const getRoleConfig = (role) =>
    ROLE_CONFIG[role] ?? {
        label: role ?? "User",
        icon: Shield,
        badgeClass: "bg-slate-100 text-slate-700",
        filterActive: "bg-slate-600 text-white",
        filterInactive:
            "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100",
        dot: "bg-slate-400",
        avatarStyle: {
            background: "linear-gradient(135deg, #94a3b8, #475569)",
        },
    };

// ─── Main Index Page ──────────────────────────────────────────────────────────
export default function Index({
    users,
    departments,
    filters,
    roleCounts = {},
}) {
    const [search, setSearch] = useState(filters?.search || "");
    const [roleFilter, setRoleFilter] = useState(filters?.role || "");
    const [createModal, setCreateModal] = useState(false);
    const [editModal, setEditModal] = useState({ open: false, user: null });
    const [deleteModal, setDeleteModal] = useState({
        open: false,
        user: null,
        password: "",
    });
    const [deleteErrors, setDeleteErrors] = useState({});

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("superadmin.users.index"),
            { search, role: roleFilter },
            { preserveState: true },
        );
    };

    const toggleRoleFilter = (role) => {
        const next = roleFilter === role ? "" : role;
        setRoleFilter(next);
        router.get(
            route("superadmin.users.index"),
            { search, role: next },
            { preserveState: true },
        );
    };

    const handleDelete = () => {
        if (deleteModal.user) {
            router.delete(
                route("superadmin.users.destroy", deleteModal.user.id),
                {
                    data: { password: deleteModal.password },
                    onSuccess: () => {
                        setDeleteModal({
                            open: false,
                            user: null,
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
        setDeleteModal({ open: false, user: null, password: "" });
        setDeleteErrors({});
    };

    const userList = users?.data ?? users ?? [];
    const totalUsers = users?.total ?? userList.length;

    const normalizedRoleCounts = ROLE_ORDER.reduce((acc, role) => {
        acc[role] = Number(roleCounts?.[role] ?? 0);
        return acc;
    }, {});

    const getInitials = (u) =>
        (
            (u?.first_name?.charAt(0) ?? "") + (u?.last_name?.charAt(0) ?? "")
        ).toUpperCase() || "U";

    const getFullName = (u) =>
        [u?.first_name, u?.middle_name, u?.last_name].filter(Boolean).join(" ");

    return (
        <>
            <Head title="User Management" />

            <div className="space-y-5">
                {/* ── Hero Header ──────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 px-7 py-6 shadow-lg shadow-violet-500/20">
                    <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-purple-400/20 blur-xl" />
                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 p-3">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">
                                    User Management
                                </h1>
                                <p className="text-sm text-violet-100 mt-0.5">
                                    Manage all system users across every role
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/15">
                                <Users size={13} className="text-violet-200" />
                                <span className="text-xs font-semibold text-white">
                                    {totalUsers} Total
                                </span>
                            </div>
                            {ROLE_ORDER.map((role) => {
                                const count = normalizedRoleCounts[role] ?? 0;
                                const cfg = getRoleConfig(role);
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={role}
                                        className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/15"
                                    >
                                        <Icon
                                            size={13}
                                            className="text-violet-200"
                                        />
                                        <span className="text-xs font-semibold text-white">
                                            {count} {cfg.label}
                                            {count !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                );
                            })}
                            <button
                                onClick={() => setCreateModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm hover:bg-violet-50 transition-colors"
                            >
                                <Plus size={16} />
                                Add User
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Search + Role Badge Filters ───────────────────────── */}
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4 space-y-3">
                    {/* Search row */}
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col sm:flex-row gap-3"
                    >
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
                                            route("superadmin.users.index"),
                                            { role: roleFilter },
                                            { preserveState: true },
                                        );
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                        >
                            Search
                        </button>
                    </form>

                    {/* Role badge filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 mr-1">
                            Filter by role:
                        </span>

                        {/* All pill */}
                        <button
                            type="button"
                            onClick={() => {
                                setRoleFilter("");
                                router.get(
                                    route("superadmin.users.index"),
                                    { search },
                                    { preserveState: true },
                                );
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full min-w-[110px] px-5 py-2 text-sm font-semibold transition-all shadow-sm ${
                                roleFilter === ""
                                    ? "bg-slate-800 text-slate-100 shadow-slate-300 ring-2 ring-violet-400"
                                    : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                            }`}
                            style={{
                                boxShadow:
                                    roleFilter === ""
                                        ? "0 0 0 2px #a78bfa"
                                        : undefined,
                            }}
                        >
                            <Users size={13} />
                            All
                        </button>

                        {/* Per-role pills */}
                        {ROLE_ORDER.map((role) => {
                            const cfg = getRoleConfig(role);
                            const Icon = cfg.icon;
                            const active = roleFilter === role;
                            const count = roleCounts[role] ?? 0;
                            return (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => toggleRoleFilter(role)}
                                    className={`inline-flex items-center gap-1.5 rounded-full min-w-[110px] px-5 py-2 text-sm font-semibold transition-all shadow-sm ${
                                        active
                                            ? cfg.filterActive
                                            : cfg.filterInactive
                                    }`}
                                >
                                    <Icon size={13} />
                                    {cfg.label}
                                    {count > 0 && (
                                        <span
                                            className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                                                active
                                                    ? "bg-white/25 text-white"
                                                    : "bg-white text-slate-600"
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        {/* Clear filter indicator */}
                        {roleFilter && (
                            <button
                                onClick={() => {
                                    setRoleFilter("");
                                    router.get(
                                        route("superadmin.users.index"),
                                        { search },
                                        { preserveState: true },
                                    );
                                }}
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={11} />
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Users Table ───────────────────────────────────────── */}
                <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                    {userList.length > 0 ? (
                        <>
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100">
                                <div className="col-span-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    User
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Role
                                </div>
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Email
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Status
                                </div>
                                <div className="col-span-1 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                                    Actions
                                </div>
                            </div>

                            <div className="divide-y divide-slate-50">
                                {userList.map((user) => {
                                    const cfg = getRoleConfig(user.role);
                                    const Icon = cfg.icon;
                                    return (
                                        <div
                                            key={user.id}
                                            className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/60 transition-colors group"
                                        >
                                            {/* User */}
                                            <div className="col-span-4 flex items-center gap-3 min-w-0">
                                                <div
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold shadow-sm"
                                                    style={cfg.avatarStyle}
                                                >
                                                    {getInitials(user)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate">
                                                        {getFullName(user)}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        ID #{user.id}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Role */}
                                            <div className="col-span-2">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${cfg.badgeClass}`}
                                                >
                                                    <Icon size={11} />
                                                    {cfg.label}
                                                </span>
                                            </div>

                                            {/* Email */}
                                            <div className="col-span-3 flex items-center gap-2 min-w-0">
                                                <Mail
                                                    size={13}
                                                    className="text-slate-400 shrink-0"
                                                />
                                                <span className="text-sm text-slate-600 truncate">
                                                    {user.email}
                                                </span>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-2">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                                        user.status === "active"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`}
                                                    />
                                                    {user.status === "active"
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-1 flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() =>
                                                        setEditModal({
                                                            open: true,
                                                            user,
                                                        })
                                                    }
                                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setDeleteModal({
                                                            open: true,
                                                            user,
                                                            password: "",
                                                        });
                                                        setDeleteErrors({});
                                                    }}
                                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {users?.links && users.links.length > 3 && (
                                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                                    <p className="text-xs text-slate-500">
                                        Showing{" "}
                                        <span className="font-semibold text-slate-700">
                                            {users.from}–{users.to}
                                        </span>{" "}
                                        of{" "}
                                        <span className="font-semibold text-slate-700">
                                            {users.total}
                                        </span>{" "}
                                        users
                                    </p>
                                    <div className="flex gap-1">
                                        {users.links.map((link, index) => (
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
                                <Users size={36} className="text-slate-300" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 mb-1">
                                No users found
                            </h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-xs">
                                {search || roleFilter
                                    ? "Try adjusting your search or filter criteria."
                                    : "Get started by creating a new user."}
                            </p>
                            {!search && !roleFilter && (
                                <button
                                    onClick={() => setCreateModal(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25"
                                >
                                    <Plus size={16} />
                                    Add User
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create Modal ─────────────────────────────────────────── */}
            <CreateUserModal
                open={createModal}
                onClose={() => setCreateModal(false)}
                departments={departments}
            />

            {/* ── Edit Modal ───────────────────────────────────────────── */}
            <EditUserModal
                open={editModal.open}
                onClose={() => setEditModal({ open: false, user: null })}
                user={editModal.user}
                departments={departments}
            />

            {/* ── Delete Modal ─────────────────────────────────────────── */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={closeDeleteModal}
                    />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-md transform rounded-2xl bg-white shadow-2xl">
                            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-rose-500 to-red-600 px-6 py-6">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                                <button
                                    onClick={closeDeleteModal}
                                    className="absolute top-3 right-3 rounded-xl p-3 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                                <div className="relative flex items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                        <Trash2 className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            Delete User
                                        </h2>
                                        <p className="text-sm text-rose-100 mt-0.5">
                                            This action is irreversible
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-5 space-y-4">
                                <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3">
                                    <AlertTriangle
                                        size={16}
                                        className="text-rose-500 mt-0.5 shrink-0"
                                    />
                                    <p className="text-sm text-rose-700 leading-relaxed">
                                        You are about to permanently delete{" "}
                                        <span className="font-semibold">
                                            {getFullName(deleteModal.user)}
                                        </span>
                                        . This will remove their access and all
                                        associated data.
                                    </p>
                                </div>

                                {(() => {
                                    const cfg = getRoleConfig(
                                        deleteModal.user?.role,
                                    );
                                    const Icon = cfg.icon;
                                    return (
                                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                                            <div
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
                                                style={cfg.avatarStyle}
                                            >
                                                {getInitials(deleteModal.user)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-slate-800 text-sm">
                                                    {getFullName(
                                                        deleteModal.user,
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {deleteModal.user?.email}
                                                </p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${cfg.badgeClass}`}
                                            >
                                                <Icon size={10} />
                                                {cfg.label}
                                            </span>
                                        </div>
                                    );
                                })()}

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
                                                : "border-slate-200 focus:ring-violet-500/30 bg-slate-50"
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
                                    Delete User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Index.layout = (page) => <SuperAdminLayout children={page} />;

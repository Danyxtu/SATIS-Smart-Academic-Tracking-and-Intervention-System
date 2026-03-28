import {
    X,
    Mail,
    Shield,
    BookOpen,
    GraduationCap,
    Crown,
    Building2,
    Hash,
    Calendar,
    CheckCircle,
    XCircle,
    KeyRound,
    Pencil,
    Trash2,
    UserCog,
} from "lucide-react";

const ROLE_CONFIG = {
    super_admin: {
        label: "Super Admin",
        icon: Crown,
        gradient: "from-amber-500 to-orange-600",
        badgeClass: "bg-amber-100 text-amber-700",
        avatarStyle: { background: "linear-gradient(135deg, #f59e0b, #ea580c)" },
    },
    admin: {
        label: "Admin",
        icon: Shield,
        gradient: "from-violet-600 to-purple-700",
        badgeClass: "bg-violet-100 text-violet-700",
        avatarStyle: { background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
    },
    teacher: {
        label: "Teacher",
        icon: BookOpen,
        gradient: "from-blue-600 to-cyan-600",
        badgeClass: "bg-blue-100 text-blue-700",
        avatarStyle: { background: "linear-gradient(135deg, #3b82f6, #0891b2)" },
    },
    student: {
        label: "Student",
        icon: GraduationCap,
        gradient: "from-emerald-500 to-teal-600",
        badgeClass: "bg-emerald-100 text-emerald-700",
        avatarStyle: { background: "linear-gradient(135deg, #10b981, #0d9488)" },
    },
};

const getRoleConfig = (role) =>
    ROLE_CONFIG[role] ?? {
        label: role ?? "User",
        icon: Shield,
        gradient: "from-slate-500 to-slate-600",
        badgeClass: "bg-slate-100 text-slate-700",
        avatarStyle: { background: "linear-gradient(135deg, #94a3b8, #475569)" },
    };

function InfoRow({ icon: Icon, label, value, valueClass = "" }) {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
            <span className="flex items-center gap-2 text-xs text-slate-500">
                <Icon size={13} className="text-slate-400" />
                {label}
            </span>
            <span className={`text-sm font-medium text-slate-800 text-right max-w-[60%] truncate ${valueClass}`}>
                {value}
            </span>
        </div>
    );
}

export default function UserViewModal({ open, onClose, user, onEdit, onDelete }) {
    if (!open || !user) return null;

    const rolesList = user.roles_list ?? [user.role];
    const primaryRole = rolesList[0];
    const cfg = getRoleConfig(primaryRole);

    const hasRole = (r) => rolesList.includes(r);
    const hasDepartment = hasRole("teacher") || hasRole("admin");
    const isAdmin = hasRole("admin");

    const initials = (
        (user.first_name?.charAt(0) ?? "") + (user.last_name?.charAt(0) ?? "")
    ).toUpperCase() || "U";

    const fullName = [user.first_name, user.middle_name, user.last_name]
        .filter(Boolean)
        .join(" ");

    const joinedDate = user.created_at
        ? new Date(user.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md transform rounded-2xl bg-white shadow-2xl">
                    {/* Header */}
                    <div className={`relative overflow-hidden rounded-t-2xl bg-gradient-to-r ${cfg.gradient} px-6 py-6`}>
                        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute bottom-0 left-1/4 h-20 w-20 rounded-full bg-white/10 blur-xl" />
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 rounded-xl p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="relative flex items-center gap-4">
                            <div
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white text-lg font-bold ring-2 ring-white/30"
                                style={cfg.avatarStyle}
                            >
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold text-white leading-tight truncate">
                                    {fullName}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    {rolesList.map((r) => {
                                        const rc = getRoleConfig(r);
                                        const RIcon = rc.icon;
                                        return (
                                            <span key={r} className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                                                <RIcon size={11} />
                                                {rc.label}
                                            </span>
                                        );
                                    })}
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                            user.status === "active"
                                                ? "bg-emerald-400/20 text-emerald-100"
                                                : "bg-slate-400/20 text-slate-200"
                                        }`}
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full ${user.status === "active" ? "bg-emerald-400" : "bg-slate-400"}`} />
                                        {user.status === "active" ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4 space-y-4">
                        {/* Department card — teachers & admins */}
                        {hasDepartment && (
                            <div className={`rounded-xl border px-4 py-3 ${user.department ? "border-blue-100 bg-blue-50" : "border-amber-100 bg-amber-50"}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${user.department ? "text-blue-500" : "text-amber-500"}`}>
                                    Department
                                </p>
                                {user.department ? (
                                    <div className="flex items-center gap-2">
                                        <Building2 size={14} className="text-blue-600 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-blue-900">
                                                {user.department.department_name}
                                            </p>
                                            {user.department.department_code && (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 mt-0.5">
                                                    <Hash size={9} />
                                                    {user.department.department_code}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-amber-700">No department assigned</p>
                                )}
                            </div>
                        )}

                        {/* Roles breakdown — only shown when user has multiple roles */}
                        {rolesList.length > 1 && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Assigned Roles</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {rolesList.map((r) => {
                                        const rc = getRoleConfig(r);
                                        const RIcon = rc.icon;
                                        return (
                                            <span key={r} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${rc.badgeClass}`}>
                                                <RIcon size={11} />
                                                {rc.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Info rows */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 divide-y divide-slate-100">
                            <InfoRow icon={Mail} label="Email" value={user.email} />
                            <InfoRow icon={Hash} label="User ID" value={`#${user.id}`} />
                            <InfoRow
                                icon={Calendar}
                                label="Joined"
                                value={joinedDate}
                            />
                            <InfoRow
                                icon={KeyRound}
                                label="Password Change"
                                value={
                                    user.must_change_password
                                        ? "Required on next login"
                                        : "Up to date"
                                }
                                valueClass={user.must_change_password ? "text-amber-600" : "text-emerald-600"}
                            />
                        </div>

                        {/* Admin badge note */}
                        {isAdmin && (
                            <div className="flex items-center gap-2.5 rounded-xl border border-violet-100 bg-violet-50 px-4 py-2.5">
                                <UserCog size={14} className="text-violet-600 shrink-0" />
                                <p className="text-xs text-violet-800">
                                    This teacher is assigned as the{" "}
                                    <span className="font-semibold">department admin</span>{" "}
                                    {user.department ? `of ${user.department.department_name}` : ""}.
                                </p>
                            </div>
                        )}

                        {/* Must change password warning */}
                        {user.must_change_password && (
                            <div className="flex items-center gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5">
                                <KeyRound size={14} className="text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-800">
                                    User has not yet changed their initial password.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
                        <button
                            onClick={onClose}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            Close
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { onClose(); onDelete?.(user); }}
                                className="rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                            >
                                <Trash2 size={13} />
                                Delete
                            </button>
                            <button
                                onClick={() => { onClose(); onEdit?.(user); }}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                            >
                                <Pencil size={13} />
                                Edit User
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

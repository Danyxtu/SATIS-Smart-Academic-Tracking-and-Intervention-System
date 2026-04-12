import { useForm } from "@inertiajs/react";
import {
    X,
    UserCog,
    Shield,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Copy,
    RefreshCw,
    Info,
    CheckCircle,
    Save,
    BookOpen,
    GraduationCap,
    Crown,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import { useState, useEffect } from "react";

// ─── Role config (local — no import needed) ───────────────────────────────────
const ROLE_CONFIG = {
    super_admin: {
        label: "Super Admin",
        icon: Crown,
        avatarStyle: {
            background: "linear-gradient(135deg, #f59e0b, #ea580c)",
        },
    },
    admin: {
        label: "Admin",
        icon: Shield,
        avatarStyle: {
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
        },
    },
    teacher: {
        label: "Teacher",
        icon: BookOpen,
        avatarStyle: {
            background: "linear-gradient(135deg, #3b82f6, #0891b2)",
        },
    },
    student: {
        label: "Student",
        icon: GraduationCap,
        avatarStyle: {
            background: "linear-gradient(135deg, #10b981, #0d9488)",
        },
    },
};

const getRoleConfig = (role) =>
    ROLE_CONFIG[role] ?? {
        label: role ?? "User",
        icon: Shield,
        avatarStyle: {
            background: "linear-gradient(135deg, #94a3b8, #475569)",
        },
    };

// ─── Reusable field wrapper ───────────────────────────────────────────────────
function Field({ label, icon: Icon, required, optional, error, children }) {
    return (
        <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                {Icon && <Icon size={13} className="text-slate-400" />}
                {label}
                {required && <span className="text-rose-500">*</span>}
                {optional && (
                    <span className="text-slate-400 text-xs">(Optional)</span>
                )}
            </label>
            {children}
            {error && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <Info size={12} /> {error}
                </p>
            )}
        </div>
    );
}

// ─── EditUserModal ────────────────────────────────────────────────────────────
export default function EditUserModal({ open, onClose, user, departments }) {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    const { data, setData, put, processing, errors, reset, clearErrors } =
        useForm({
            first_name: "",
            last_name: "",
            middle_name: "",
            email: "",
            password: "", // blank = keep existing
            role: "student",
            department_id: "",
            status: "active",
        });

    // Populate form whenever the target user changes
    useEffect(() => {
        if (user) {
            setData({
                first_name: user.first_name ?? "",
                last_name: user.last_name ?? "",
                middle_name: user.middle_name ?? "",
                email: user.email ?? "",
                password: "",
                role: user.role ?? "student",
                department_id: user.department_id ?? "",
                status: user.status ?? "active",
            });
            clearErrors();
            setShowPassword(false);
            setCopied(false);
        }
    }, [user]);

    const generatePassword = () => {
        const charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let pw = "";
        for (let i = 0; i < 12; i++)
            pw += charset.charAt(Math.floor(Math.random() * charset.length));
        setData("password", pw);
    };

    const copyPassword = () => {
        if (!data.password) return;
        navigator.clipboard.writeText(data.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("superadmin.users.update", user.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    if (!open || !user) return null;

    const cfg = getRoleConfig(user.role);
    const AvatarIcon = cfg.icon;
    const initials =
        (
            (user.first_name?.charAt(0) ?? "") +
            (user.last_name?.charAt(0) ?? "")
        ).toUpperCase() || "U";
    const fullName = [user.first_name, user.middle_name, user.last_name]
        .filter(Boolean)
        .join(" ");

    const isTeacherOrStudent = ["teacher", "student"].includes(data.role);
    const isTeacher = data.role === "teacher";

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="flex min-h-full items-end justify-center p-4 pb-10 sm:items-center">
                <div className="relative w-full max-w-lg transform max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl bg-white shadow-2xl">
                    {/* ── Modal Header ──────────────────────────────────── */}
                    <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5">
                        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-indigo-400/20 blur-xl" />
                        <button
                            onClick={handleClose}
                            className="absolute z-10 top-3 right-3 rounded-xl p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="relative flex items-center gap-4">
                            {/* User avatar */}
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white text-base font-bold ring-2 ring-white/30 shadow-lg"
                                style={cfg.avatarStyle}
                            >
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold text-white truncate">
                                    Edit User
                                </h2>
                                <p className="text-sm text-blue-100 mt-0.5 truncate">
                                    {fullName}
                                    <span className="mx-1.5 opacity-50">·</span>
                                    <span className="opacity-80">
                                        {user.email}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Modal Body ────────────────────────────────────── */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                            {/* ── Name ─────────────────────────────────── */}
                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    label="First Name"
                                    icon={Shield}
                                    required
                                    error={errors.first_name}
                                >
                                    <input
                                        type="text"
                                        value={data.first_name}
                                        onChange={(e) =>
                                            setData(
                                                "first_name",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g., Juan"
                                        className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${errors.first_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </Field>
                                <Field
                                    label="Last Name"
                                    icon={Shield}
                                    required
                                    error={errors.last_name}
                                >
                                    <input
                                        type="text"
                                        value={data.last_name}
                                        onChange={(e) =>
                                            setData("last_name", e.target.value)
                                        }
                                        placeholder="e.g., Dela Cruz"
                                        className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${errors.last_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </Field>
                            </div>

                            <Field
                                label="Middle Name"
                                icon={Shield}
                                optional
                                error={errors.middle_name}
                            >
                                <input
                                    type="text"
                                    value={data.middle_name}
                                    onChange={(e) =>
                                        setData("middle_name", e.target.value)
                                    }
                                    placeholder="e.g., Rivera"
                                    className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${errors.middle_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
                            </Field>

                            {/* ── Email ────────────────────────────────── */}
                            <Field
                                label="Email Address"
                                icon={Mail}
                                required
                                error={errors.email}
                            >
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    placeholder="email@school.edu"
                                    className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${errors.email ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
                            </Field>

                            {/* ── Role (teacher/student locked) ─────────── */}
                            {isTeacherOrStudent && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Role{" "}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {getRoleConfig(data.role).label}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            This role is locked. Teacher and
                                            student accounts cannot be switched.
                                        </p>
                                    </div>
                                    {errors.role && (
                                        <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                                            <Info size={12} /> {errors.role}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ── Department (teachers only) ────────────── */}
                            {isTeacher && (
                                <Field
                                    label="Department"
                                    icon={Shield}
                                    required
                                    error={errors.department_id}
                                >
                                    <select
                                        value={data.department_id}
                                        onChange={(e) =>
                                            setData(
                                                "department_id",
                                                e.target.value,
                                            )
                                        }
                                        className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${errors.department_id ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    >
                                        <option value="">
                                            Select a department
                                        </option>
                                        {departments?.map((dept) => (
                                            <option
                                                key={dept.id}
                                                value={dept.id}
                                            >
                                                {dept.department_name}
                                                {dept.department_code
                                                    ? ` (${dept.department_code})`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            )}

                            {/* ── Status toggle ─────────────────────────── */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`h-2 w-2 rounded-full ${data.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`}
                                    />
                                    <span className="text-sm font-medium text-slate-700">
                                        Account Status
                                    </span>
                                    <span
                                        className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                                            data.status === "active"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-slate-200 text-slate-600"
                                        }`}
                                    >
                                        {data.status === "active"
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setData(
                                            "status",
                                            data.status === "active"
                                                ? "inactive"
                                                : "active",
                                        )
                                    }
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Toggle status"
                                >
                                    {data.status === "active" ? (
                                        <ToggleRight
                                            size={28}
                                            className="text-emerald-500"
                                        />
                                    ) : (
                                        <ToggleLeft
                                            size={28}
                                            className="text-slate-400"
                                        />
                                    )}
                                </button>
                            </div>

                            {/* ── Reset Password (optional) ─────────────── */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        <Lock
                                            size={13}
                                            className="text-slate-400"
                                        />
                                        Reset Password
                                        <span className="text-slate-400 text-xs font-normal">
                                            (Optional — leave blank to keep
                                            current)
                                        </span>
                                    </p>
                                </div>
                                <div className="px-4 py-3 space-y-2">
                                    <div className="relative">
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={data.password}
                                            onChange={(e) =>
                                                setData(
                                                    "password",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter new password or generate one"
                                            className={`w-full rounded-xl border bg-white px-3 py-2 pr-28 text-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${errors.password ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword,
                                                    )
                                                }
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={14} />
                                                ) : (
                                                    <Eye size={14} />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={copyPassword}
                                                disabled={!data.password}
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-40"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={generatePassword}
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {errors.password && (
                                        <p className="text-xs text-rose-600 flex items-center gap-1">
                                            <Info size={12} /> {errors.password}
                                        </p>
                                    )}
                                    {copied && (
                                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                                            <CheckCircle size={12} /> Copied to
                                            clipboard!
                                        </p>
                                    )}
                                    {data.password && (
                                        <p className="text-xs text-amber-600 flex items-center gap-1.5">
                                            <Info size={11} />
                                            The user will be required to change
                                            this password on next login.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Modal Footer ──────────────────────────────── */}
                        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
                            <p className="text-xs text-slate-400">
                                Editing{" "}
                                <span className="font-semibold text-slate-600">
                                    {fullName}
                                </span>
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    <Save size={14} />
                                    {processing ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

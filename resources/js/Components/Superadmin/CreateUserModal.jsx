import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    UserPlus,
    X,
    Shield,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Copy,
    RefreshCw,
    CheckCircle,
    Info,
    Save,
} from "lucide-react";
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
// Helper for role config
const getRoleConfig = (role) => {
    if (role === "teacher") {
        return {
            label: "Teacher",
            icon: Shield,
            avatarStyle: {
                background: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
            },
        };
    }
    return {
        label: "Student",
        icon: Shield,
        avatarStyle: {
            background: "linear-gradient(135deg, #059669 0%, #34d399 100%)",
        },
    };
};

export default function CreateUserModal({ open, onClose, departments }) {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        password: "",
        role: "student",
        assign_as_admin: false,
        department_id: "",
    });

    const generatePassword = () => {
        const charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let pw = "";
        for (let i = 0; i < 12; i++)
            pw += charset.charAt(Math.floor(Math.random() * charset.length));
        setData("password", pw);
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(data.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("superadmin.users.store"), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!open) return null;

    const isTeacher = data.role === "teacher";
    const selectedDepartment =
        isTeacher && data.department_id
            ? (departments?.find(
                  (dept) => String(dept.id) === String(data.department_id),
              ) ?? null)
            : null;
    const selectedAdmin = selectedDepartment?.department_admin ?? null;
    const selectedAdminName =
        selectedAdmin?.name ??
        [selectedAdmin?.first_name, selectedAdmin?.last_name]
            .filter(Boolean)
            .join(" ");

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="flex min-h-full items-end justify-center p-4 pb-10 sm:items-center">
                <div className="relative w-full max-w-lg transform max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl bg-white shadow-2xl">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5">
                        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-purple-400/20 blur-xl" />
                        <button
                            onClick={handleClose}
                            className="absolute z-10 top-3 right-3 rounded-xl p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <div className="relative flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/20">
                                <UserPlus className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Create User
                                </h2>
                                <p className="text-sm text-violet-100 mt-0.5">
                                    Add a new teacher or student account
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Role tabs */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Role{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["teacher", "student"].map((role) => {
                                        const cfg = getRoleConfig(role);
                                        const Icon = cfg.icon;
                                        const active = data.role === role;
                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => {
                                                    setData("role", role);
                                                    if (role === "student") {
                                                        setData(
                                                            "department_id",
                                                            "",
                                                        );
                                                        setData(
                                                            "assign_as_admin",
                                                            false,
                                                        );
                                                    }
                                                }}
                                                className={`flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                                                    active
                                                        ? role === "teacher"
                                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                                            : "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                                                }`}
                                            >
                                                <div
                                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                                                    style={
                                                        active
                                                            ? cfg.avatarStyle
                                                            : {
                                                                  background:
                                                                      "#cbd5e1",
                                                              }
                                                    }
                                                >
                                                    <Icon size={14} />
                                                </div>
                                                {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Name row */}
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
                                        className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500 focus:bg-white transition-colors ${errors.first_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
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
                                        className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500 focus:bg-white transition-colors ${errors.last_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
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
                                    className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500 focus:bg-white transition-colors ${errors.middle_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
                            </Field>

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
                                    placeholder={
                                        isTeacher
                                            ? "teacher@school.edu"
                                            : "student@school.edu"
                                    }
                                    className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500 focus:bg-white transition-colors ${errors.email ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
                            </Field>

                            {isTeacher && (
                                <Field
                                    label="Department"
                                    icon={Shield}
                                    required
                                    error={errors.department_id}
                                >
                                    <select
                                        value={data.department_id}
                                        onChange={(e) => {
                                            setData(
                                                "department_id",
                                                e.target.value,
                                            );
                                            setData("assign_as_admin", false);
                                        }}
                                        className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500 focus:bg-white transition-colors ${errors.department_id ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
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

                            {isTeacher && data.department_id && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Department Admin
                                    </p>
                                    {selectedAdmin ? (
                                        <div className="mt-1.5 space-y-0.5">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {selectedAdminName ||
                                                    "Assigned admin"}
                                            </p>
                                            <p className="text-xs text-slate-600">
                                                {selectedAdmin.email ||
                                                    "No email provided"}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
                                            <p className="text-xs text-amber-800">
                                                No admin is currently assigned
                                                to the{" "}
                                                {
                                                    selectedDepartment?.department_name
                                                }{" "}
                                                department.
                                            </p>
                                            <label className="mt-2 flex items-start gap-2.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        !!data.assign_as_admin
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "assign_as_admin",
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                                />
                                                <span className="text-xs text-amber-900">
                                                    Assign this teacher as the
                                                    admin for this department.
                                                </span>
                                            </label>
                                            {errors.assign_as_admin && (
                                                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                                                    <Info size={12} />
                                                    {errors.assign_as_admin}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <Field
                                label="Password"
                                icon={Lock}
                                required
                                error={errors.password}
                            >
                                <div className="relative">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        placeholder="Enter or generate a password"
                                        className={`w-full rounded-xl border bg-slate-50 px-3 py-2 pr-28 text-sm focus:border-violet-500 focus:ring-violet-500 focus:bg-white transition-colors ${errors.password ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
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
                                {copied && (
                                    <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                                        <CheckCircle size={12} /> Copied to
                                        clipboard!
                                    </p>
                                )}
                                <p className="mt-1.5 text-xs text-slate-400">
                                    Click{" "}
                                    <RefreshCw size={10} className="inline" />{" "}
                                    to generate a secure password. The user must
                                    change it on first login.
                                </p>
                            </Field>

                            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                                <Info
                                    size={15}
                                    className="text-amber-600 mt-0.5 shrink-0"
                                />
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    <span className="font-semibold">Note:</span>{" "}
                                    The user will be required to change their
                                    password on first login.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
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
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                <Save size={14} />
                                {processing ? "Creating..." : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

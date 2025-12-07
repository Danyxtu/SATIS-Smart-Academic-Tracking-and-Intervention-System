import { Head, Link, useForm } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    UserCog,
    ArrowLeft,
    Save,
    Eye,
    EyeOff,
    Copy,
    RefreshCw,
    Key,
    Shield,
    Mail,
    Building2,
    User,
    Calendar,
    CheckCircle,
    Info,
} from "lucide-react";
import { useState } from "react";

export default function Edit({ admin, departments }) {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [resetPassword, setResetPassword] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: admin.name || "",
        email: admin.email || "",
        password: "",
        department_id: admin.department_id || "",
    });

    const generatePassword = () => {
        const length = 12;
        const charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += charset.charAt(
                Math.floor(Math.random() * charset.length)
            );
        }
        setData("password", password);
        setResetPassword(true);
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(data.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("superadmin.admins.update", admin.id));
    };

    return (
        <>
            <Head title={`Edit ${admin.name}`} />

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route("superadmin.admins.index")}
                        className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <UserCog className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Edit Admin
                        </h1>
                        <p className="text-slate-500">
                            Update administrator information
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden"
                >
                    <div className="flex items-center gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Admin Details
                            </h2>
                            <p className="text-sm text-slate-500">
                                Modify the administrator information
                            </p>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <User size={14} className="text-slate-400" />
                                Full Name
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                placeholder="e.g., John Smith"
                                className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                    errors.name
                                        ? "border-rose-300 bg-rose-50/50"
                                        : ""
                                }`}
                            />
                            {errors.name && (
                                <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                    <Info size={14} />
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Mail size={14} className="text-slate-400" />
                                Email Address
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                placeholder="e.g., admin@school.edu"
                                className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                    errors.email
                                        ? "border-rose-300 bg-rose-50/50"
                                        : ""
                                }`}
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                    <Info size={14} />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Department */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Building2
                                    size={14}
                                    className="text-slate-400"
                                />
                                Department
                                <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.department_id}
                                onChange={(e) =>
                                    setData("department_id", e.target.value)
                                }
                                className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                    errors.department_id
                                        ? "border-rose-300 bg-rose-50/50"
                                        : ""
                                }`}
                            >
                                <option value="">Select a department</option>
                                {departments?.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name} ({dept.code})
                                    </option>
                                ))}
                            </select>
                            {errors.department_id && (
                                <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                    <Info size={14} />
                                    {errors.department_id}
                                </p>
                            )}
                        </div>

                        {/* Reset Password Section */}
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                            resetPassword
                                                ? "bg-amber-100"
                                                : "bg-slate-200"
                                        }`}
                                    >
                                        <Key
                                            size={20}
                                            className={
                                                resetPassword
                                                    ? "text-amber-600"
                                                    : "text-slate-400"
                                            }
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            Reset Password
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Generate a new password for this
                                            admin
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (resetPassword) {
                                            setResetPassword(false);
                                            setData("password", "");
                                        } else {
                                            generatePassword();
                                        }
                                    }}
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                                        resetPassword
                                            ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                                    }`}
                                >
                                    {resetPassword
                                        ? "Cancel Reset"
                                        : "Generate New Password"}
                                </button>
                            </div>

                            {resetPassword && (
                                <div className="space-y-3">
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
                                                    e.target.value
                                                )
                                            }
                                            placeholder="New password"
                                            className={`w-full rounded-xl border-slate-200 bg-white pr-28 text-sm focus:border-blue-500 focus:ring-blue-500 ${
                                                errors.password
                                                    ? "border-rose-300 bg-rose-50/50"
                                                    : ""
                                            }`}
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={16} />
                                                ) : (
                                                    <Eye size={16} />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={copyPassword}
                                                disabled={!data.password}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={generatePassword}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-rose-600 flex items-center gap-1">
                                            <Info size={14} />
                                            {errors.password}
                                        </p>
                                    )}
                                    {copied && (
                                        <p className="text-sm text-emerald-600 flex items-center gap-1">
                                            <CheckCircle size={14} />
                                            Password copied to clipboard!
                                        </p>
                                    )}
                                    <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
                                        <p className="text-xs text-amber-700 flex items-start gap-2">
                                            <Info
                                                size={14}
                                                className="shrink-0 mt-0.5"
                                            />
                                            The admin will be required to change
                                            this password on next login.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Account Info */}
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Calendar
                                        size={20}
                                        className="text-blue-600"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">
                                        Account Information
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Account creation and update dates
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-white p-3 border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">
                                        Created
                                    </p>
                                    <p className="font-semibold text-slate-900">
                                        {new Date(
                                            admin.created_at
                                        ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-white p-3 border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">
                                        Last Updated
                                    </p>
                                    <p className="font-semibold text-slate-900">
                                        {new Date(
                                            admin.updated_at
                                        ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
                        <Link
                            href={route("superadmin.admins.index")}
                            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
                        >
                            <Save size={18} />
                            {processing ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Edit.layout = (page) => <SuperAdminLayout children={page} />;

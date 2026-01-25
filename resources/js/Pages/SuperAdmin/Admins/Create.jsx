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
    Shield,
    Mail,
    Building2,
    Lock,
    Info,
    CheckCircle,
} from "lucide-react";
import { useState } from "react";

export default function Create({ departments }) {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        password: "",
        department_id: "",
    });

    const generatePassword = () => {
        const length = 12;
        const charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += charset.charAt(
                Math.floor(Math.random() * charset.length),
            );
        }
        setData("password", password);
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(data.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("superadmin.admins.store"));
    };

    return (
        <>
            <Head title="Create Admin" />

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route("superadmin.admins.index")}
                        className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Create Admin
                        </h1>
                        <p className="text-slate-500">
                            Add a new department administrator
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden"
                >
                    <div className="flex items-center gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                            <UserCog className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Admin Details
                            </h2>
                            <p className="text-sm text-slate-500">
                                Fill in the administrator information
                            </p>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* First Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Shield size={14} className="text-slate-400" />
                                First Name
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.first_name}
                                onChange={(e) =>
                                    setData("first_name", e.target.value)
                                }
                                placeholder="e.g., John"
                                className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                    errors.first_name
                                        ? "border-rose-300 bg-rose-50/50"
                                        : ""
                                }`}
                            />
                            {errors.first_name && (
                                <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                    <Info size={14} />
                                    {errors.first_name}
                                </p>
                            )}
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Shield size={14} className="text-slate-400" />
                                Last Name
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.last_name}
                                onChange={(e) =>
                                    setData("last_name", e.target.value)
                                }
                                placeholder="e.g., Smith"
                                className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                    errors.last_name
                                        ? "border-rose-300 bg-rose-50/50"
                                        : ""
                                }`}
                            />
                            {errors.last_name && (
                                <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                    <Info size={14} />
                                    {errors.last_name}
                                </p>
                            )}
                        </div>

                        {/* Middle Name (Optional) */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Shield size={14} className="text-slate-400" />
                                Middle Name{" "}
                                <span className="text-slate-400 text-xs">
                                    (Optional)
                                </span>
                            </label>
                            <input
                                type="text"
                                value={data.middle_name}
                                onChange={(e) =>
                                    setData("middle_name", e.target.value)
                                }
                                placeholder="e.g., Michael"
                                className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                    errors.middle_name
                                        ? "border-rose-300 bg-rose-50/50"
                                        : ""
                                }`}
                            />
                            {errors.middle_name && (
                                <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                    <Info size={14} />
                                    {errors.middle_name}
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

                        {/* Password */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Lock size={14} className="text-slate-400" />
                                Password
                                <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    placeholder="Enter password"
                                    className={`w-full rounded-xl border-slate-200 bg-slate-50/50 pr-32 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                        errors.password
                                            ? "border-rose-300 bg-rose-50/50"
                                            : ""
                                    }`}
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
                                            <EyeOff size={16} />
                                        ) : (
                                            <Eye size={16} />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={copyPassword}
                                        disabled={!data.password}
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                    <Info size={14} />
                                    {errors.password}
                                </p>
                            )}
                            {copied && (
                                <p className="mt-2 text-sm text-emerald-600 flex items-center gap-1">
                                    <CheckCircle size={14} />
                                    Password copied to clipboard!
                                </p>
                            )}
                            <p className="mt-2 text-xs text-slate-400">
                                Click the refresh icon to generate a secure
                                password. The admin will be required to change
                                this on first login.
                            </p>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="mx-6 mb-6 rounded-xl bg-amber-50 p-4 border border-amber-100">
                        <div className="flex gap-3">
                            <Info
                                size={18}
                                className="text-amber-600 shrink-0 mt-0.5"
                            />
                            <div className="text-sm text-amber-800">
                                <p className="font-semibold">Important Note</p>
                                <p className="mt-1">
                                    The admin will receive an email with their
                                    login credentials and will be required to
                                    change their password on first login.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <Link
                            href={route("superadmin.admins.index")}
                            className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
                        >
                            <Save size={16} />
                            {processing ? "Creating..." : "Create Admin"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Create.layout = (page) => <SuperAdminLayout children={page} />;

import { Head, Link, router } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    UserCog,
    ArrowLeft,
    Mail,
    Building2,
    Calendar,
    Shield,
    Key,
    Send,
    AlertCircle,
    CheckCircle,
    Users,
    GraduationCap,
    Pencil,
    RefreshCw,
} from "lucide-react";
import { useState } from "react";

export default function Show({ admin, departmentStats }) {
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleResendCredentials = () => {
        setResending(true);
        router.post(
            route("superadmin.admins.resend-credentials", admin.id),
            {},
            {
                onSuccess: () => {
                    setResendSuccess(true);
                    setTimeout(() => setResendSuccess(false), 3000);
                },
                onFinish: () => setResending(false),
            }
        );
    };

    return (
        <>
            <Head title={`Admin - ${admin.name}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route("superadmin.admins.index")}
                            className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Admin Details
                            </h1>
                            <p className="text-slate-500">
                                View administrator information
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route("superadmin.admins.edit", admin.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                    >
                        <Pencil size={16} />
                        Edit Admin
                    </Link>
                </div>

                {/* Success Alert */}
                {resendSuccess && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <p className="text-sm font-medium text-emerald-800">
                            Credentials email has been sent successfully to{" "}
                            {admin.email}
                        </p>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Info Card */}
                    <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl font-bold shadow-lg shadow-violet-500/25">
                                {admin.name?.charAt(0).toUpperCase() || "A"}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {admin.name}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-100 text-violet-700 text-xs font-medium">
                                        <Shield size={12} />
                                        Administrator
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Email */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Email Address
                                    </p>
                                    <p className="text-slate-900 font-medium mt-1">
                                        {admin.email}
                                    </p>
                                </div>
                            </div>

                            {/* Department */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Department
                                    </p>
                                    <p className="text-slate-900 font-medium mt-1">
                                        {admin.department?.name || "Unassigned"}
                                        {admin.department?.code && (
                                            <span className="text-slate-500 ml-2">
                                                ({admin.department.code})
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Created Date */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Created On
                                    </p>
                                    <p className="text-slate-900 font-medium mt-1">
                                        {admin.created_at}
                                    </p>
                                </div>
                            </div>

                            {/* Password Status */}
                            <div className="flex items-start gap-4">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                        admin.must_change_password
                                            ? "bg-amber-100 text-amber-600"
                                            : "bg-emerald-100 text-emerald-600"
                                    }`}
                                >
                                    <Key size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Password Status
                                    </p>
                                    <div className="mt-1">
                                        {admin.must_change_password ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-sm font-medium">
                                                <AlertCircle size={14} />
                                                Must change on next login
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium">
                                                <CheckCircle size={14} />
                                                Password changed
                                                {admin.password_changed_at &&
                                                    ` on ${admin.password_changed_at}`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Temporary Password (if exists) */}
                            {admin.temp_password &&
                                admin.must_change_password && (
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                                            <Key size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Temporary Password
                                            </p>
                                            <p className="text-slate-900 font-mono mt-1 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                                                {admin.temp_password}
                                            </p>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Side Cards */}
                    <div className="space-y-6">
                        {/* Actions Card */}
                        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-semibold text-slate-900">
                                    Quick Actions
                                </h3>
                            </div>
                            <div className="p-4 space-y-3">
                                <button
                                    onClick={handleResendCredentials}
                                    disabled={resending}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    {resending ? (
                                        <>
                                            <RefreshCw
                                                size={16}
                                                className="animate-spin"
                                            />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Resend Credentials Email
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-slate-500 text-center">
                                    Send login credentials to admin's email
                                </p>
                            </div>
                        </div>

                        {/* Department Stats Card */}
                        {admin.department && (
                            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-semibold text-slate-900">
                                        Department Stats
                                    </h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                            <UserCog size={18} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {departmentStats?.teachers_count ||
                                                    0}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Teachers
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                            <GraduationCap size={18} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {departmentStats?.students_count ||
                                                    0}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Students
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = (page) => <SuperAdminLayout children={page} />;

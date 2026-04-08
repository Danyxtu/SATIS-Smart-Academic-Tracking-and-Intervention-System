import React, { useMemo, useState } from "react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    CheckCircle2,
    Clock,
    Eye,
    EyeOff,
    KeyRound,
    Mail,
    Shield,
    User,
    Users,
    X,
    XCircle,
} from "lucide-react";

const ROLE_LABELS = {
    teacher: "Teacher",
    admin: "Admin",
    super_admin: "Super Admin",
};

const PasswordModal = ({ open, onClose }) => {
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const closeModal = () => {
        reset();
        onClose();
    };

    const submit = (e) => {
        e.preventDefault();
        put(route("password.update"), {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    };

    if (!open) return null;

    const inputClass =
        "w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 py-3 pl-10 pr-11 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={closeModal}
            />
            <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-xl">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Change Password
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Update your school staff account password.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Current Password
                        </label>
                        <div className="relative">
                            <KeyRound
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={16}
                            />
                            <input
                                type={showCurrent ? "text" : "password"}
                                value={data.current_password}
                                onChange={(e) =>
                                    setData("current_password", e.target.value)
                                }
                                className={inputClass}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                {showCurrent ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>
                        {errors.current_password && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.current_password}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            New Password
                        </label>
                        <div className="relative">
                            <KeyRound
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={16}
                            />
                            <input
                                type={showNew ? "text" : "password"}
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                className={inputClass}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                {showNew ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <KeyRound
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={16}
                            />
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                {showConfirm ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>
                        {errors.password_confirmation && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.password_confirmation}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {processing ? "Updating..." : "Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProfileSchoolStaff = ({ pendingPasswordReset = null, status = null }) => {
    const { props } = usePage();
    const user = props?.auth?.user ?? {};
    const flash = props?.flash ?? {};

    const [activeTab, setActiveTab] = useState("account");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showResetRequestForm, setShowResetRequestForm] = useState(false);

    const roleNames = useMemo(() => {
        const roles = Array.isArray(user.roles) ? user.roles : [];
        return roles
            .map((roleItem) =>
                typeof roleItem === "string" ? roleItem : roleItem?.name,
            )
            .filter(Boolean);
    }, [user.roles]);

    const form = useForm({
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        middle_name: user.middle_name ?? "",
        email: user.email ?? "",
    });

    const resetRequestForm = useForm({ reason: "" });

    const successMessage =
        flash?.success ||
        (status === "profile-updated" ? "Profile updated successfully." : null);

    const saveProfile = (e) => {
        e.preventDefault();
        form.patch(route("schoolstaff.profile.update"), {
            preserveScroll: true,
        });
    };

    const submitResetRequest = (e) => {
        e.preventDefault();
        resetRequestForm.post(
            route("schoolstaff.profile.request-password-reset"),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowResetRequestForm(false);
                    resetRequestForm.reset();
                },
            },
        );
    };

    const cancelResetRequest = () => {
        router.delete(route("schoolstaff.profile.cancel-password-reset"), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Staff Profile" />

            <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="flex items-center gap-2.5 text-xl font-bold text-slate-900 dark:text-slate-100">
                                <User size={20} className="text-blue-600" />
                                School Staff Profile
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Manage account details for teacher/admin/super
                                admin access.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {roleNames.map((role) => (
                                <span
                                    key={role}
                                    className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    {ROLE_LABELS[role] || role}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {(successMessage || flash?.error) && (
                    <div
                        className={`rounded-xl border px-4 py-3 text-sm ${
                            flash?.error
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-green-200 bg-green-50 text-green-700"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {flash?.error ? (
                                <XCircle size={16} />
                            ) : (
                                <CheckCircle2 size={16} />
                            )}
                            <span>{flash?.error || successMessage}</span>
                        </div>
                    </div>
                )}

                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-sm">
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab("account")}
                            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                                activeTab === "account"
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                            Account
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("security")}
                            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                                activeTab === "security"
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                            Security
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("roles")}
                            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                                activeTab === "roles"
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                            Roles
                        </button>
                    </div>
                </div>

                {activeTab === "account" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                                Account Details
                            </h2>
                            <form
                                onSubmit={saveProfile}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.first_name}
                                        onChange={(e) =>
                                            form.setData(
                                                "first_name",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                                    />
                                    {form.errors.first_name && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {form.errors.first_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.last_name}
                                        onChange={(e) =>
                                            form.setData(
                                                "last_name",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                                    />
                                    {form.errors.last_name && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {form.errors.last_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Middle Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.middle_name}
                                        onChange={(e) =>
                                            form.setData(
                                                "middle_name",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                                    />
                                    {form.errors.middle_name && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {form.errors.middle_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            size={16}
                                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            type="email"
                                            value={form.data.email}
                                            onChange={(e) =>
                                                form.setData(
                                                    "email",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                    {form.errors.email && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {form.errors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {form.processing
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                    <Users
                                        size={18}
                                        className="text-blue-600"
                                    />
                                    Account Snapshot
                                </h2>
                                <div className="space-y-2 text-sm">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Display Name
                                        </p>
                                        <p className="font-medium text-slate-900 dark:text-slate-100">
                                            {user.name || "N/A"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Username
                                        </p>
                                        <p className="font-medium text-slate-900 dark:text-slate-100">
                                            {user.username || "N/A"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Department ID
                                        </p>
                                        <p className="font-medium text-slate-900 dark:text-slate-100">
                                            {user.department_id || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "security" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                <Shield size={18} className="text-blue-600" />
                                Password Security
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                Change your password to protect
                                teacher/admin/super admin access.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowPasswordModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                <KeyRound size={16} />
                                Change Password
                            </button>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                <Clock size={18} className="text-blue-600" />
                                Admin Password Reset Request
                            </h2>

                            {pendingPasswordReset ? (
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                                        <div className="flex items-center gap-2 font-medium">
                                            <Clock size={16} />
                                            Request Pending
                                        </div>
                                        <p className="mt-1 text-xs">
                                            Submitted{" "}
                                            {pendingPasswordReset.created_at}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={cancelResetRequest}
                                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                                    >
                                        <XCircle size={16} />
                                        Cancel Request
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                                        Submit a request if you are locked out
                                        and need admin assistance.
                                    </p>

                                    {!showResetRequestForm ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowResetRequestForm(true)
                                            }
                                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                                        >
                                            Request Password Reset
                                        </button>
                                    ) : (
                                        <form
                                            onSubmit={submitResetRequest}
                                            className="space-y-3"
                                        >
                                            <textarea
                                                value={
                                                    resetRequestForm.data.reason
                                                }
                                                onChange={(e) =>
                                                    resetRequestForm.setData(
                                                        "reason",
                                                        e.target.value,
                                                    )
                                                }
                                                rows={3}
                                                placeholder="Optional reason for your request"
                                                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowResetRequestForm(
                                                            false,
                                                        )
                                                    }
                                                    className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={
                                                        resetRequestForm.processing
                                                    }
                                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                                >
                                                    {resetRequestForm.processing
                                                        ? "Submitting..."
                                                        : "Submit Request"}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "roles" && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                            Role Access Overview
                        </h2>
                        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                            This profile is shared across all school staff roles
                            assigned to your account.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {roleNames.map((role) => (
                                <div
                                    key={role}
                                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4"
                                >
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {ROLE_LABELS[role] || role}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Access and settings follow school staff
                                        layout standards.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <PasswordModal
                open={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </>
    );
};

ProfileSchoolStaff.layout = (page) => <SchoolStaffLayout children={page} />;

export default ProfileSchoolStaff;

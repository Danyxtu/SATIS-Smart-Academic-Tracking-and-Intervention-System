import React, { useMemo, useState } from "react";
import StudentLayout from "@/Layouts/StudentLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    CalendarCheck,
    CheckCircle2,
    Clock,
    Eye,
    EyeOff,
    KeyRound,
    Mail,
    Shield,
    User,
    X,
    XCircle,
} from "lucide-react";

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
        "w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 pl-10 pr-11 text-sm text-gray-900 dark:text-gray-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={closeModal}
            />
            <div className="relative w-full max-w-md rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-xl">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Change Password
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Update your account password.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Current Password
                        </label>
                        <div className="relative">
                            <KeyRound
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            New Password
                        </label>
                        <div className="relative">
                            <KeyRound
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <KeyRound
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
                        >
                            {processing ? "Updating..." : "Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StudentProfileSettings = ({
    student = null,
    pendingPasswordReset = null,
    status = null,
}) => {
    const { props } = usePage();
    const user = props?.auth?.user ?? {};
    const flash = props?.flash ?? {};

    const [activeTab, setActiveTab] = useState("profile");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showResetRequestForm, setShowResetRequestForm] = useState(false);

    const form = useForm({
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        middle_name: user.middle_name ?? "",
        email: user.email ?? "",
    });

    const resetRequestForm = useForm({ reason: "" });

    const studentDisplayName =
        student?.student_name ||
        [user.first_name, user.middle_name, user.last_name]
            .filter(Boolean)
            .join(" ");

    const successMessage =
        flash?.success ||
        (status === "profile-updated" ? "Profile updated successfully." : null);

    const roleLabel = useMemo(() => "Student", []);

    const saveProfile = (e) => {
        e.preventDefault();
        form.patch(route("student.profile.update"), {
            preserveScroll: true,
        });
    };

    const submitResetRequest = (e) => {
        e.preventDefault();
        resetRequestForm.post(route("student.profile.request-password-reset"), {
            preserveScroll: true,
            onSuccess: () => {
                setShowResetRequestForm(false);
                resetRequestForm.reset();
            },
        });
    };

    const cancelResetRequest = () => {
        router.delete(route("student.profile.cancel-password-reset"), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Profile Settings" />

            <div className="max-w-7xl mx-auto space-y-5">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="flex items-center gap-2.5 text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                                <User size={20} className="text-pink-600" />
                                Profile Settings
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Manage your student account details and
                                security.
                            </p>
                        </div>
                        <span className="inline-flex w-fit rounded-full bg-pink-100 dark:bg-pink-900/30 px-3 py-1 text-xs font-semibold text-pink-700 dark:text-pink-300">
                            {roleLabel}
                        </span>
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

                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-1.5 shadow-sm">
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab("profile")}
                            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                                activeTab === "profile"
                                    ? "bg-pink-600 text-white"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                        >
                            Profile
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("security")}
                            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                                activeTab === "security"
                                    ? "bg-pink-600 text-white"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                        >
                            Security
                        </button>
                    </div>
                </div>

                {activeTab === "profile" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2 space-y-5">
                            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                    Account Information
                                </h2>
                                <form
                                    onSubmit={saveProfile}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
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
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100"
                                        />
                                        {form.errors.first_name && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {form.errors.first_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
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
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100"
                                        />
                                        {form.errors.last_name && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {form.errors.last_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
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
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100"
                                        />
                                        {form.errors.middle_name && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {form.errors.middle_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail
                                                size={16}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100"
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
                                            className="rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
                                        >
                                            {form.processing
                                                ? "Saving..."
                                                : "Save Changes"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
                                    Student Snapshot
                                </h2>
                                <div className="space-y-3 text-sm">
                                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            Student Name
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {studentDisplayName || "N/A"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            LRN
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {student?.lrn || "N/A"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            Grade / Section
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {student?.grade_level
                                                ? `Grade ${student.grade_level}`
                                                : "N/A"}
                                            {student?.section
                                                ? ` - ${student.section}`
                                                : ""}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            Track / Strand
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {student?.track || "N/A"}
                                            {student?.strand
                                                ? ` - ${student.strand}`
                                                : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "security" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                                <Shield size={18} className="text-pink-600" />
                                Password Security
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Keep your account secure by updating your
                                password regularly.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowPasswordModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
                            >
                                <KeyRound size={16} />
                                Change Password
                            </button>
                        </div>

                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                                <CalendarCheck
                                    size={18}
                                    className="text-pink-600"
                                />
                                Password Reset Request
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
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                        If you cannot remember your password,
                                        submit a reset request to your
                                        administrator.
                                    </p>

                                    {!showResetRequestForm ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowResetRequestForm(true)
                                            }
                                            className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-medium text-pink-700 hover:bg-pink-100"
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
                                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowResetRequestForm(
                                                            false,
                                                        )
                                                    }
                                                    className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={
                                                        resetRequestForm.processing
                                                    }
                                                    className="rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
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
            </div>

            <PasswordModal
                open={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </>
    );
};

StudentProfileSettings.layout = (page) => <StudentLayout children={page} />;

export default StudentProfileSettings;

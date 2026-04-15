import React, { useEffect, useMemo, useRef, useState } from "react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
    Clock,
    CheckCircle,
    XCircle,
    User,
    Mail,
    Calendar,
    AlertTriangle,
    X,
    ChevronLeft,
    ChevronRight,
    Shield,
    KeyRound,
    QrCode,
    Search,
    RotateCcw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Status Badge Component
const StatusBadge = ({ status }) => {
    const config = {
        pending: {
            bg: "bg-yellow-100 dark:bg-yellow-900/30",
            text: "text-yellow-700 dark:text-yellow-400",
            icon: Clock,
        },
        approved: {
            bg: "bg-green-100 dark:bg-green-900/30",
            text: "text-green-700 dark:text-green-400",
            icon: CheckCircle,
        },
        rejected: {
            bg: "bg-red-100 dark:bg-red-900/30",
            text: "text-red-700 dark:text-red-400",
            icon: XCircle,
        },
    };

    const { bg, text, icon: Icon } = config[status] || config.pending;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${bg} ${text}`}
        >
            <Icon size={12} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

// Filter Tab Component
const FilterTab = ({ label, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isActive
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
    >
        {label}
        <span
            className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${isActive ? "bg-blue-200 dark:bg-blue-800" : "bg-gray-200 dark:bg-gray-600"}`}
        >
            {count}
        </span>
    </button>
);

// Approve Modal - Server generates 8-char password
const ApproveModal = ({
    isOpen,
    onClose,
    request,
    routePrefix,
    onApprovedCredentials,
}) => {
    const { data, setData, post, processing, reset } = useForm({
        admin_notes: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(
            route(
                `${routePrefix}.password-reset-requests.approve`,
                request?.id,
            ),
            {
                onSuccess: (page) => {
                    const credentials =
                        page?.props?.flash?.password_reset_credentials ?? null;

                    if (credentials) {
                        onApprovedCredentials?.(credentials);
                    }

                    reset();
                    onClose();
                },
            },
        );
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 pb-10 sm:items-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <CheckCircle
                                                size={20}
                                                className="text-green-500"
                                            />
                                            Approve Password Reset
                                        </Dialog.Title>
                                        <button
                                            onClick={onClose}
                                            className="z-10 text-gray-400 hover:text-gray-500"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Approve password reset for{" "}
                                        <strong>{request?.user?.name}</strong>
                                    </p>
                                </div>

                                <form
                                    onSubmit={handleSubmit}
                                    className="p-6 space-y-4"
                                >
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle
                                                size={18}
                                                className="text-amber-600 flex-shrink-0 mt-0.5"
                                            />
                                            <div className="text-sm text-amber-700 dark:text-amber-400">
                                                <p className="font-medium">
                                                    Temporary Credentials
                                                </p>
                                                <p className="mt-1 text-xs">
                                                    A temporary 8-character
                                                    password will be generated.
                                                    After approval, show the
                                                    returned credentials QR and
                                                    temporary password to the
                                                    user. They will be required
                                                    to create a new password on
                                                    next login.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Admin Notes (Optional)
                                        </label>
                                        <textarea
                                            value={data.admin_notes}
                                            onChange={(e) =>
                                                setData(
                                                    "admin_notes",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            placeholder="Add any notes..."
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {processing
                                                ? "Approving..."
                                                : "Approve Request"}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

// Reject Modal
const RejectModal = ({ isOpen, onClose, request, routePrefix }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        admin_notes: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(
            route(`${routePrefix}.password-reset-requests.reject`, request?.id),
            {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            },
        );
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 pb-10 sm:items-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                                    Reject Request
                                </Dialog.Title>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                    Reject password reset request from{" "}
                                    <strong>{request?.user?.name}</strong>
                                </p>

                                <form
                                    onSubmit={handleSubmit}
                                    className="mt-4 space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Reason for Rejection
                                        </label>
                                        <textarea
                                            value={data.admin_notes}
                                            onChange={(e) =>
                                                setData(
                                                    "admin_notes",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            placeholder="Explain why the request is being rejected..."
                                            rows={3}
                                            required
                                        />
                                        {errors.admin_notes && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.admin_notes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={
                                                processing || !data.admin_notes
                                            }
                                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {processing
                                                ? "Rejecting..."
                                                : "Reject Request"}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

const ResetCredentialsModal = ({ isOpen, onClose, credentials }) => {
    const qrPayload = useMemo(() => {
        const loginValue = String(credentials?.username || "").trim();
        const passwordValue = String(credentials?.password || "").trim();

        if (!loginValue || !passwordValue) {
            return "";
        }

        return JSON.stringify({
            type: "satis_student_credentials",
            version: 1,
            username: loginValue,
            password: passwordValue,
        });
    }, [credentials]);

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 pb-10 sm:items-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <QrCode
                                                size={20}
                                                className="text-emerald-600"
                                            />
                                            New Temporary Credentials
                                        </Dialog.Title>
                                        <button
                                            onClick={onClose}
                                            className="z-10 text-gray-400 hover:text-gray-500"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white p-3 flex items-center justify-center">
                                            {qrPayload ? (
                                                <QRCodeSVG
                                                    value={qrPayload}
                                                    size={180}
                                                    includeMargin
                                                />
                                            ) : (
                                                <p className="text-xs text-gray-500">
                                                    QR unavailable
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Full Name
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {credentials?.full_name ||
                                                        "-"}
                                                </p>
                                            </div>

                                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    LRN
                                                </p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {credentials?.lrn || "-"}
                                                </p>
                                            </div>

                                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Username
                                                </p>
                                                <p className="font-mono text-sm text-gray-800 dark:text-gray-200 break-all">
                                                    {credentials?.username ||
                                                        "-"}
                                                </p>
                                            </div>

                                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                                    Temporary Password
                                                </p>
                                                <p className="font-mono text-sm text-amber-800 break-all">
                                                    {credentials?.password ||
                                                        "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

const ResetStudentPasswordConfirmModal = ({
    isOpen,
    onClose,
    student,
    routePrefix,
    onResetSuccess,
}) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        lrn: "",
    });

    useEffect(() => {
        setData("lrn", student?.lrn || "");
    }, [student, setData]);

    const handleSubmit = (e) => {
        e.preventDefault();

        post(
            route(
                `${routePrefix}.password-reset-requests.reset-student-by-lrn`,
            ),
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const credentials =
                        page?.props?.flash?.password_reset_credentials ?? null;

                    if (credentials) {
                        onResetSuccess?.(credentials);
                    }

                    reset();
                    onClose();
                },
            },
        );
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 pb-10 sm:items-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <KeyRound
                                                size={20}
                                                className="text-emerald-600"
                                            />
                                            Confirm Student Password Reset
                                        </Dialog.Title>
                                        <button
                                            onClick={onClose}
                                            className="z-10 text-gray-400 hover:text-gray-500"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <form
                                    onSubmit={handleSubmit}
                                    className="p-6 space-y-4"
                                >
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        You are about to reset the password for
                                        this student account.
                                    </div>

                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {student?.full_name ||
                                                student?.student_name ||
                                                "Student"}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                            LRN: {student?.lrn || "-"}
                                        </p>
                                        <p className="text-xs font-mono text-gray-600 dark:text-gray-300">
                                            Username: {student?.username || "-"}
                                        </p>
                                    </div>

                                    {(errors.lrn || errors.student_lrn) && (
                                        <p className="text-sm text-red-600">
                                            {errors.lrn || errors.student_lrn}
                                        </p>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing || !data.lrn}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {processing
                                                ? "Resetting..."
                                                : "Confirm Reset"}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

// Main Component
export function PasswordResetRequestsPage({
    requests,
    counts,
    currentStatus,
    studentsInCurrentTerm = null,
    studentSearch = null,
    currentSchoolYear = null,
    currentSemester = null,
    routePrefix = "admin",
    subtitle = "Review and process password reset requests from users",
}) {
    const page = usePage();
    const flash = page?.props?.flash ?? {};
    const [approveModal, setApproveModal] = useState({
        isOpen: false,
        request: null,
    });
    const [rejectModal, setRejectModal] = useState({
        isOpen: false,
        request: null,
    });
    const [credentialModal, setCredentialModal] = useState({
        isOpen: false,
        credentials: null,
    });
    const [manualResetModal, setManualResetModal] = useState({
        isOpen: false,
        student: null,
    });

    const isSuperAdminMode = routePrefix === "superadmin";
    const consumedFlashCredentialSignatureRef = useRef(null);
    const [studentLrnQuery, setStudentLrnQuery] = useState(
        String(studentSearch?.lrn || ""),
    );

    useEffect(() => {
        setStudentLrnQuery(String(studentSearch?.lrn || ""));
    }, [studentSearch?.lrn]);

    useEffect(() => {
        const credentials = flash?.password_reset_credentials;

        if (!credentials) {
            return;
        }

        const signature = JSON.stringify(credentials);
        if (consumedFlashCredentialSignatureRef.current === signature) {
            return;
        }

        consumedFlashCredentialSignatureRef.current = signature;
        setCredentialModal({
            isOpen: true,
            credentials,
        });
    }, [flash?.password_reset_credentials]);

    const handleStatusFilter = (status) => {
        const nextQuery = { status };

        if (isSuperAdminMode && studentLrnQuery.trim()) {
            nextQuery.student_lrn = studentLrnQuery.trim();
        }

        router.get(route(`${routePrefix}.password-reset-requests`), nextQuery, {
            preserveState: true,
        });
    };

    const handleStudentSearchSubmit = (event) => {
        event.preventDefault();

        router.get(
            route(`${routePrefix}.password-reset-requests`),
            {
                status: currentStatus,
                student_lrn: studentLrnQuery.trim() || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const clearStudentSearch = () => {
        setStudentLrnQuery("");

        router.get(
            route(`${routePrefix}.password-reset-requests`),
            {
                status: currentStatus,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Password Reset Requests" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Password Reset Requests
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {subtitle}
                    </p>
                </div>
                {counts.pending > 0 && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg">
                        <AlertTriangle size={18} />
                        <span className="font-medium">
                            {counts.pending} pending request
                            {counts.pending > 1 ? "s" : ""}
                        </span>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    <FilterTab
                        label="Pending"
                        count={counts.pending}
                        isActive={currentStatus === "pending"}
                        onClick={() => handleStatusFilter("pending")}
                    />
                    <FilterTab
                        label="Approved"
                        count={counts.approved}
                        isActive={currentStatus === "approved"}
                        onClick={() => handleStatusFilter("approved")}
                    />
                    <FilterTab
                        label="Rejected"
                        count={counts.rejected}
                        isActive={currentStatus === "rejected"}
                        onClick={() => handleStatusFilter("rejected")}
                    />
                    <FilterTab
                        label="All"
                        count={counts.all}
                        isActive={currentStatus === "all"}
                        onClick={() => handleStatusFilter("all")}
                    />
                </div>
            </div>

            {isSuperAdminMode && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6 space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Reset Student by LRN
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Current term: {currentSchoolYear || "-"} •
                                Semester {currentSemester || "-"}
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            <Search size={12} /> LRN Search
                        </span>
                    </div>

                    <form
                        onSubmit={handleStudentSearchSubmit}
                        className="flex flex-col sm:flex-row gap-2"
                    >
                        <input
                            type="text"
                            value={studentLrnQuery}
                            onChange={(event) =>
                                setStudentLrnQuery(event.target.value)
                            }
                            className="w-full sm:flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Search student LRN"
                            minLength={12}
                            maxLength={12}
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={clearStudentSearch}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                <span className="inline-flex items-center gap-1">
                                    <RotateCcw size={12} /> Clear
                                </span>
                            </button>
                        </div>
                    </form>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {(studentsInCurrentTerm?.data || []).length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {studentsInCurrentTerm.data.map((student) => (
                                    <div
                                        key={student.id}
                                        className="px-3 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {student.full_name ||
                                                    student.student_name}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                                LRN: {student.lrn || "-"}
                                            </p>
                                            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                                                Username:{" "}
                                                {student.username || "-"}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setManualResetModal({
                                                    isOpen: true,
                                                    student,
                                                })
                                            }
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                        >
                                            <KeyRound size={13} /> Reset
                                            Password
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                No students found for the current term and LRN
                                filter.
                            </div>
                        )}
                    </div>

                    {studentsInCurrentTerm?.last_page > 1 && (
                        <div className="flex items-center justify-between pt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Showing {studentsInCurrentTerm.from} to{" "}
                                {studentsInCurrentTerm.to} of{" "}
                                {studentsInCurrentTerm.total} students
                            </p>
                            <div className="flex items-center gap-1">
                                {studentsInCurrentTerm.links.map(
                                    (link, index) => (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url || "#"}
                                            className={`px-2 py-1 rounded text-xs ${
                                                link.active
                                                    ? "bg-blue-600 text-white"
                                                    : link.url
                                                      ? "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                      : "text-gray-300 cursor-not-allowed"
                                            }`}
                                            preserveState
                                            preserveScroll
                                        >
                                            {link.label
                                                .replace(
                                                    "&laquo; Previous",
                                                    "Prev",
                                                )
                                                .replace(
                                                    "Next &raquo;",
                                                    "Next",
                                                )}
                                        </Link>
                                    ),
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Requests List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {requests.data.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {requests.data.map((request) => (
                            <div
                                key={request.id}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User
                                                size={24}
                                                className="text-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {request.user?.name}
                                                </h3>
                                                <StatusBadge
                                                    status={request.status}
                                                />
                                                {request.user?.role && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                                        <Shield size={10} />
                                                        {request.user.role}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Mail size={14} />
                                                    {request.user?.email}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {new Date(
                                                        request.created_at,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {request.reason && (
                                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
                                                    <strong>Reason:</strong>{" "}
                                                    {request.reason}
                                                </p>
                                            )}
                                            {request.admin_notes && (
                                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                                                    <strong>
                                                        Admin Notes:
                                                    </strong>{" "}
                                                    {request.admin_notes}
                                                </p>
                                            )}
                                            {request.processed_by && (
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Processed by{" "}
                                                    {request.processed_by?.name}{" "}
                                                    on{" "}
                                                    {new Date(
                                                        request.processed_at,
                                                    ).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {request.status === "pending" && (
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() =>
                                                    setApproveModal({
                                                        isOpen: true,
                                                        request,
                                                    })
                                                }
                                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setRejectModal({
                                                        isOpen: true,
                                                        request,
                                                    })
                                                }
                                                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                        <Shield
                            size={48}
                            className="mx-auto mb-3 text-emerald-500/60"
                        />
                        <p className="text-lg font-medium">No requests found</p>
                        <p className="text-sm">
                            {currentStatus === "pending"
                                ? "No pending password reset requests."
                                : "No requests match the selected filter."}
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {requests.last_page > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {requests.from} to {requests.to} of{" "}
                            {requests.total} results
                        </p>
                        <div className="flex items-center gap-1">
                            {requests.links.map((link, index) => {
                                if (link.label.includes("Previous")) {
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || "#"}
                                            className={`p-2 rounded-lg ${link.url ? "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" : "text-gray-300 cursor-not-allowed"}`}
                                            preserveState
                                        >
                                            <ChevronLeft size={18} />
                                        </Link>
                                    );
                                }
                                if (link.label.includes("Next")) {
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || "#"}
                                            className={`p-2 rounded-lg ${link.url ? "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" : "text-gray-300 cursor-not-allowed"}`}
                                            preserveState
                                        >
                                            <ChevronRight size={18} />
                                        </Link>
                                    );
                                }
                                return (
                                    <Link
                                        key={index}
                                        href={link.url || "#"}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium ${link.active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"}`}
                                        preserveState
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ApproveModal
                isOpen={approveModal.isOpen}
                onClose={() =>
                    setApproveModal({ isOpen: false, request: null })
                }
                request={approveModal.request}
                routePrefix={routePrefix}
                onApprovedCredentials={(credentials) =>
                    setCredentialModal({
                        isOpen: true,
                        credentials,
                    })
                }
            />
            <RejectModal
                isOpen={rejectModal.isOpen}
                onClose={() => setRejectModal({ isOpen: false, request: null })}
                request={rejectModal.request}
                routePrefix={routePrefix}
            />

            <ResetStudentPasswordConfirmModal
                isOpen={manualResetModal.isOpen}
                onClose={() =>
                    setManualResetModal({ isOpen: false, student: null })
                }
                student={manualResetModal.student}
                routePrefix={routePrefix}
                onResetSuccess={(credentials) =>
                    setCredentialModal({
                        isOpen: true,
                        credentials,
                    })
                }
            />

            <ResetCredentialsModal
                isOpen={credentialModal.isOpen}
                onClose={() =>
                    setCredentialModal({ isOpen: false, credentials: null })
                }
                credentials={credentialModal.credentials}
            />
        </>
    );
}

export default function PasswordResetRequests(props) {
    return <PasswordResetRequestsPage {...props} routePrefix="admin" />;
}

PasswordResetRequests.layout = (page) => <SchoolStaffLayout children={page} />;

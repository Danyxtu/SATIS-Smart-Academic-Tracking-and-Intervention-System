import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
    Users,
    Search,
    CheckCircle,
    XCircle,
    FileText,
    Clock,
    Mail,
    Building2,
    Download,
    AlertTriangle,
    X,
    User,
    Calendar,
    Eye,
    Inbox,
} from "lucide-react";

// Status Badge Component
const StatusBadge = ({ status }) => {
    const config = {
        pending: {
            bg: "bg-amber-100 dark:bg-amber-900/30",
            text: "text-amber-700 dark:text-amber-400",
            icon: Clock,
            label: "Pending Review",
        },
        approved: {
            bg: "bg-green-100 dark:bg-green-900/30",
            text: "text-green-700 dark:text-green-400",
            icon: CheckCircle,
            label: "Approved",
        },
        rejected: {
            bg: "bg-red-100 dark:bg-red-900/30",
            text: "text-red-700 dark:text-red-400",
            icon: XCircle,
            label: "Rejected",
        },
    };

    const { bg, text, icon: Icon, label } = config[status] || config.pending;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${bg} ${text}`}
        >
            <Icon size={12} />
            {label}
        </span>
    );
};

// Registration Card Component
const RegistrationCard = ({
    registration,
    onApprove,
    onReject,
    onViewDocument,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Card Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                            {registration.first_name[0]}
                            {registration.last_name[0]}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {registration.full_name}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                <Mail size={12} />
                                {registration.email}
                            </div>
                        </div>
                    </div>
                    <StatusBadge status={registration.status} />
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-4">
                {/* Department */}
                <div className="flex items-center gap-2 text-sm">
                    <Building2 size={16} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                        {registration.department?.name || "Unknown Department"}
                    </span>
                    {registration.department?.code && (
                        <span className="text-xs text-gray-400">
                            ({registration.department.code})
                        </span>
                    )}
                </div>

                {/* Submitted Date */}
                <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                        Submitted: {registration.created_at}
                    </span>
                </div>

                {/* Document */}
                {registration.document_url && (
                    <button
                        onClick={() => onViewDocument(registration)}
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                        <FileText size={16} />
                        <span className="underline">
                            View Supporting Document
                        </span>
                        <Eye size={14} />
                    </button>
                )}
            </div>

            {/* Card Actions */}
            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end gap-3">
                <button
                    onClick={() => onReject(registration)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200"
                >
                    <XCircle size={16} />
                    Reject
                </button>
                <button
                    onClick={() => onApprove(registration)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                    <CheckCircle size={16} />
                    Approve
                </button>
            </div>
        </div>
    );
};

// Empty State Component
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Inbox className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            No Pending Registrations
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
            There are no teacher registration requests waiting for your
            approval. New requests will appear here automatically.
        </p>
    </div>
);

// Confirmation Modal Component
const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    confirmColor,
    processing,
}) => (
    <Transition appear show={isOpen} as={Fragment}>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {title}
                                </Dialog.Title>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                {message}
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={processing}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-all ${
                                        confirmColor === "red"
                                            ? "bg-red-500 hover:bg-red-600"
                                            : "bg-green-500 hover:bg-green-600"
                                    } ${
                                        processing
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                    }`}
                                >
                                    {processing ? "Processing..." : confirmText}
                                </button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
    </Transition>
);

// Reject Modal with Reason
const RejectModal = ({
    isOpen,
    onClose,
    onConfirm,
    registration,
    processing,
}) => {
    const [reason, setReason] = useState("");

    const handleSubmit = () => {
        onConfirm(reason);
        setReason("");
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
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
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        Reject Registration
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <X
                                            size={18}
                                            className="text-gray-500"
                                        />
                                    </button>
                                </div>

                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    Are you sure you want to reject the
                                    registration for{" "}
                                    <span className="font-semibold">
                                        {registration?.full_name}
                                    </span>
                                    ?
                                </p>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Rejection Reason (Optional)
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) =>
                                            setReason(e.target.value)
                                        }
                                        placeholder="Provide a reason for rejection..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary dark:bg-gray-700 dark:text-white transition-colors resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={processing}
                                        className={`px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all ${
                                            processing
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }`}
                                    >
                                        {processing
                                            ? "Rejecting..."
                                            : "Reject Registration"}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default function Index({ registrations, pendingCount }) {
    const { flash } = usePage().props;
    const [searchQuery, setSearchQuery] = useState("");
    const [approveModal, setApproveModal] = useState({
        isOpen: false,
        registration: null,
    });
    const [rejectModal, setRejectModal] = useState({
        isOpen: false,
        registration: null,
    });
    const [processing, setProcessing] = useState(false);

    // Filter registrations based on search
    const filteredRegistrations = registrations.filter((reg) => {
        const query = searchQuery.toLowerCase();
        return (
            reg.full_name.toLowerCase().includes(query) ||
            reg.email.toLowerCase().includes(query) ||
            reg.department?.name?.toLowerCase().includes(query)
        );
    });

    const handleApprove = (registration) => {
        setApproveModal({ isOpen: true, registration });
    };

    const confirmApprove = () => {
        setProcessing(true);
        router.post(
            route(
                "admin.teacher-registrations.approve",
                approveModal.registration.id
            ),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setApproveModal({ isOpen: false, registration: null });
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    const handleReject = (registration) => {
        setRejectModal({ isOpen: true, registration });
    };

    const confirmReject = (reason) => {
        setProcessing(true);
        router.post(
            route(
                "admin.teacher-registrations.reject",
                rejectModal.registration.id
            ),
            { rejection_reason: reason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejectModal({ isOpen: false, registration: null });
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    const handleViewDocument = (registration) => {
        window.open(
            route("admin.teacher-registrations.document", registration.id),
            "_blank"
        );
    };

    return (
        <AdminLayout>
            <Head title="Teacher Registrations" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Users className="w-7 h-7 text-primary" />
                                Teacher Registrations
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Review and approve pending teacher registration
                                requests
                            </p>
                        </div>

                        {/* Stats Badge */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                {pendingCount} Pending{" "}
                                {pendingCount === 1 ? "Request" : "Requests"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-green-700 dark:text-green-300">
                            {flash.success}
                        </span>
                    </div>
                )}

                {flash?.error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="text-red-700 dark:text-red-300">
                            {flash.error}
                        </span>
                    </div>
                )}

                {/* Search Bar */}
                {registrations.length > 0 && (
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, or department..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary dark:bg-gray-800 dark:text-white transition-colors"
                            />
                        </div>
                    </div>
                )}

                {/* Registrations Grid */}
                {filteredRegistrations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRegistrations.map((registration) => (
                            <RegistrationCard
                                key={registration.id}
                                registration={registration}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onViewDocument={handleViewDocument}
                            />
                        ))}
                    </div>
                ) : registrations.length > 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">
                            No registrations found matching "{searchQuery}"
                        </p>
                    </div>
                ) : (
                    <EmptyState />
                )}
            </div>

            {/* Approve Modal */}
            <ConfirmModal
                isOpen={approveModal.isOpen}
                onClose={() =>
                    setApproveModal({ isOpen: false, registration: null })
                }
                onConfirm={confirmApprove}
                title="Approve Registration"
                message={`Are you sure you want to approve the registration for ${approveModal.registration?.full_name}? This will create a new teacher account.`}
                confirmText="Approve"
                confirmColor="green"
                processing={processing}
            />

            {/* Reject Modal */}
            <RejectModal
                isOpen={rejectModal.isOpen}
                onClose={() =>
                    setRejectModal({ isOpen: false, registration: null })
                }
                onConfirm={confirmReject}
                registration={rejectModal.registration}
                processing={processing}
            />
        </AdminLayout>
    );
}

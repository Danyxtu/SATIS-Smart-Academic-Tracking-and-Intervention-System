import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
    Key,
    Clock,
    CheckCircle,
    XCircle,
    User,
    Mail,
    Calendar,
    Eye,
    EyeOff,
    AlertTriangle,
    X,
    ChevronLeft,
    ChevronRight,
    Shield,
} from "lucide-react";

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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${bg} ${text}`}>
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
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
    >
        {label}
        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${isActive ? "bg-purple-200 dark:bg-purple-800" : "bg-gray-200 dark:bg-gray-600"}`}>
            {count}
        </span>
    </button>
);

// Approve Modal
const ApproveModal = ({ isOpen, onClose, request }) => {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        new_password: "",
        admin_notes: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.password-reset-requests.approve", request?.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setData("new_password", password);
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <CheckCircle size={20} className="text-green-500" />
                                            Approve Password Reset
                                        </Dialog.Title>
                                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Set a new password for <strong>{request?.user?.name}</strong>
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={data.new_password}
                                                    onChange={(e) => setData("new_password", e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
                                                    placeholder="Enter new password"
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            <button type="button" onClick={generatePassword} className="px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                                                Generate
                                            </button>
                                        </div>
                                        {errors.new_password && <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>}
                                        <p className="mt-1 text-xs text-gray-500">Share this password securely with the user.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes (Optional)</label>
                                        <textarea
                                            value={data.admin_notes}
                                            onChange={(e) => setData("admin_notes", e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            placeholder="Add any notes..."
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={processing || !data.new_password} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">
                                            {processing ? "Approving..." : "Approve & Set Password"}
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
const RejectModal = ({ isOpen, onClose, request }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        admin_notes: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.password-reset-requests.reject", request?.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white text-center">Reject Request</Dialog.Title>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                    Reject password reset request from <strong>{request?.user?.name}</strong>
                                </p>

                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Rejection</label>
                                        <textarea
                                            value={data.admin_notes}
                                            onChange={(e) => setData("admin_notes", e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            placeholder="Explain why the request is being rejected..."
                                            rows={3}
                                            required
                                        />
                                        {errors.admin_notes && <p className="mt-1 text-sm text-red-600">{errors.admin_notes}</p>}
                                    </div>

                                    <div className="flex justify-center gap-3">
                                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={processing || !data.admin_notes} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
                                            {processing ? "Rejecting..." : "Reject Request"}
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
export default function PasswordResetRequests({ requests, counts, currentStatus }) {
    const [approveModal, setApproveModal] = useState({ isOpen: false, request: null });
    const [rejectModal, setRejectModal] = useState({ isOpen: false, request: null });

    const handleStatusFilter = (status) => {
        router.get(route("admin.password-reset-requests"), { status }, { preserveState: true });
    };

    return (
        <AdminLayout>
            <Head title="Password Reset Requests" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Key size={28} className="text-purple-500" />
                        Password Reset Requests
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Review and process password reset requests from users</p>
                </div>
                {counts.pending > 0 && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg">
                        <AlertTriangle size={18} />
                        <span className="font-medium">{counts.pending} pending request{counts.pending > 1 ? "s" : ""}</span>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    <FilterTab label="Pending" count={counts.pending} isActive={currentStatus === "pending"} onClick={() => handleStatusFilter("pending")} />
                    <FilterTab label="Approved" count={counts.approved} isActive={currentStatus === "approved"} onClick={() => handleStatusFilter("approved")} />
                    <FilterTab label="Rejected" count={counts.rejected} isActive={currentStatus === "rejected"} onClick={() => handleStatusFilter("rejected")} />
                    <FilterTab label="All" count={counts.all} isActive={currentStatus === "all"} onClick={() => handleStatusFilter("all")} />
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {requests.data.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {requests.data.map((request) => (
                            <div key={request.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User size={24} className="text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{request.user?.name}</h3>
                                                <StatusBadge status={request.status} />
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
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {request.reason && (
                                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
                                                    <strong>Reason:</strong> {request.reason}
                                                </p>
                                            )}
                                            {request.admin_notes && (
                                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                                                    <strong>Admin Notes:</strong> {request.admin_notes}
                                                </p>
                                            )}
                                            {request.processed_by && (
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Processed by {request.processed_by?.name} on {new Date(request.processed_at).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {request.status === "pending" && (
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => setApproveModal({ isOpen: true, request })}
                                                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setRejectModal({ isOpen: true, request })}
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
                        <Key size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No requests found</p>
                        <p className="text-sm">
                            {currentStatus === "pending" ? "No pending password reset requests." : "No requests match the selected filter."}
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {requests.last_page > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {requests.from} to {requests.to} of {requests.total} results
                        </p>
                        <div className="flex items-center gap-1">
                            {requests.links.map((link, index) => {
                                if (link.label.includes("Previous")) {
                                    return (
                                        <Link key={index} href={link.url || "#"} className={`p-2 rounded-lg ${link.url ? "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" : "text-gray-300 cursor-not-allowed"}`} preserveState>
                                            <ChevronLeft size={18} />
                                        </Link>
                                    );
                                }
                                if (link.label.includes("Next")) {
                                    return (
                                        <Link key={index} href={link.url || "#"} className={`p-2 rounded-lg ${link.url ? "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" : "text-gray-300 cursor-not-allowed"}`} preserveState>
                                            <ChevronRight size={18} />
                                        </Link>
                                    );
                                }
                                return (
                                    <Link key={index} href={link.url || "#"} className={`px-3 py-1 rounded-lg text-sm font-medium ${link.active ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"}`} preserveState>
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ApproveModal isOpen={approveModal.isOpen} onClose={() => setApproveModal({ isOpen: false, request: null })} request={approveModal.request} />
            <RejectModal isOpen={rejectModal.isOpen} onClose={() => setRejectModal({ isOpen: false, request: null })} request={rejectModal.request} />
        </AdminLayout>
    );
}

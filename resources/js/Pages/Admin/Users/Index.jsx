import React, { useState, useEffect } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
    Users,
    Search,
    Plus,
    Edit,
    Trash2,
    Key,
    GraduationCap,
    UserCog,
    Shield,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    X,
    AlertTriangle,
    Eye,
    EyeOff,
    BookOpen,
    School,
    Copy,
    CheckCircle,
    User,
    Mail,
    Building2,
    Lock,
} from "lucide-react";

// Role Badge Component
const RoleBadge = ({ role }) => {
    const config = {
        student: {
            bg: "bg-blue-100 dark:bg-blue-900/30",
            text: "text-blue-700 dark:text-blue-400",
            icon: GraduationCap,
        },
        teacher: {
            bg: "bg-green-100 dark:bg-green-900/30",
            text: "text-green-700 dark:text-green-400",
            icon: UserCog,
        },
        admin: {
            bg: "bg-purple-100 dark:bg-purple-900/30",
            text: "text-purple-700 dark:text-purple-400",
            icon: Shield,
        },
    };

    const { bg, text, icon: Icon } = config[role] || config.student;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${bg} ${text}`}
        >
            <Icon size={12} />
            {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
    );
};

// Section Badge Component
const SectionBadge = ({ section, gradeLevel }) => {
    if (!section) return <span className="text-gray-400">—</span>;

    return (
        <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full">
                <School size={10} />
                {section}
            </span>
            {gradeLevel && (
                <span className="text-xs text-gray-500 mt-0.5">
                    {gradeLevel}
                </span>
            )}
        </div>
    );
};

// Subjects Popover Component
const SubjectsPopover = ({ subjects }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!subjects || subjects.length === 0) {
        return <span className="text-gray-400">—</span>;
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
                <BookOpen size={12} />
                {subjects.length} subject{subjects.length > 1 ? "s" : ""}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 p-3">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Enrolled Subjects & Teachers
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {subjects.map((subject, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                >
                                    <BookOpen
                                        size={14}
                                        className="text-green-500 mt-0.5 flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                            {subject.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <UserCog size={10} />
                                            {subject.teacher}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
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
        <span
            className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                isActive
                    ? "bg-purple-200 dark:bg-purple-800"
                    : "bg-gray-200 dark:bg-gray-600"
            }`}
        >
            {count}
        </span>
    </button>
);

// Sort Header Component
const SortHeader = ({
    label,
    field,
    currentSort,
    currentDirection,
    onSort,
}) => {
    const isActive = currentSort === field;

    return (
        <button
            onClick={() => onSort(field)}
            className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
            {label}
            <span className="flex flex-col">
                <ChevronUp
                    size={12}
                    className={`-mb-1 ${
                        isActive && currentDirection === "asc"
                            ? "text-purple-600"
                            : "text-gray-400"
                    }`}
                />
                <ChevronDown
                    size={12}
                    className={`-mt-1 ${
                        isActive && currentDirection === "desc"
                            ? "text-purple-600"
                            : "text-gray-400"
                    }`}
                />
            </span>
        </button>
    );
};

// Reset Password Modal
const ResetPasswordModal = ({ isOpen, onClose, user }) => {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        password: "",
        password_confirmation: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.users.reset-password", user.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Key
                                                size={20}
                                                className="text-purple-500"
                                            />
                                            Reset Password
                                        </Dialog.Title>
                                        <button
                                            onClick={onClose}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Reset password for{" "}
                                        <strong>{user?.name}</strong>
                                    </p>
                                </div>

                                <form
                                    onSubmit={handleSubmit}
                                    className="p-6 space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            New Password
                                        </label>
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
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword,
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={18} />
                                                ) : (
                                                    <Eye size={18} />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Confirm Password
                                        </label>
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={data.password_confirmation}
                                            onChange={(e) =>
                                                setData(
                                                    "password_confirmation",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            placeholder="Confirm new password"
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
                                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {processing
                                                ? "Resetting..."
                                                : "Reset Password"}
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

// Delete Confirmation Modal
const DeleteModal = ({ isOpen, onClose, user, onConfirm, processing }) => (
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
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all p-6">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                                Delete User
                            </Dialog.Title>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                Are you sure you want to delete{" "}
                                <strong>{user?.name}</strong>? This action
                                cannot be undone.
                            </p>
                            <div className="flex justify-center gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    disabled={processing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {processing ? "Deleting..." : "Delete User"}
                                </button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
    </Transition.Root>
);

// Bulk Delete Confirmation Modal with Password Input
const BulkDeleteModal = ({
    isOpen,
    onClose,
    selectedCount,
    onConfirm,
    processing,
}) => {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setPassword("");
            setError("");
            setShowPassword(false);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!password.trim()) {
            setError("Password is required");
            return;
        }
        onConfirm(password);
        setPassword("");
        setError("");
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                                    Delete {selectedCount} User
                                    {selectedCount > 1 ? "s" : ""}?
                                </Dialog.Title>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                    This action cannot be undone. Please enter
                                    your password to confirm.
                                </p>

                                <div className="mt-6 space-y-4">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Admin Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    setError("");
                                                }}
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === "Enter" &&
                                                        !processing
                                                    ) {
                                                        handleConfirm();
                                                    }
                                                }}
                                                placeholder="Enter your password"
                                                className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${
                                                    error
                                                        ? "border-red-500 dark:border-red-400"
                                                        : "border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400"
                                                }`}
                                                disabled={processing}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword,
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={18} />
                                                ) : (
                                                    <Eye size={18} />
                                                )}
                                            </button>
                                        </div>
                                        {error && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                <Lock size={14} />
                                                {error}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-center gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={processing}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        disabled={
                                            processing || !password.trim()
                                        }
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        {processing
                                            ? "Deleting..."
                                            : "Delete Users"}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

// Temporary Password Modal - Shows generated password after creating a student
const TempPasswordModal = ({ isOpen, onClose, user, tempPassword }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyAllCredentials = () => {
        const credentials = `Email: ${user?.email}\nPassword: ${tempPassword}`;
        navigator.clipboard.writeText(credentials);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-emerald-500">
                                    <div className="flex items-center justify-between">
                                        <Dialog.Title className="text-lg font-semibold text-white flex items-center gap-2">
                                            <CheckCircle size={20} />
                                            Student Created Successfully!
                                        </Dialog.Title>
                                        <button
                                            onClick={onClose}
                                            className="text-white/80 hover:text-white"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="text-center mb-4">
                                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <GraduationCap
                                                size={32}
                                                className="text-green-600 dark:text-green-400"
                                            />
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Please save these credentials. The
                                            password will only be shown once.
                                        </p>
                                    </div>

                                    {/* User Info */}
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <User
                                                size={18}
                                                className="text-gray-400"
                                            />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Name
                                                </p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {user?.name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail
                                                size={18}
                                                className="text-gray-400"
                                            />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Email
                                                </p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {user?.email}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(user?.email)
                                                }
                                                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                title="Copy email"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Key
                                                size={18}
                                                className="text-gray-400"
                                            />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Temporary Password
                                                </p>
                                                <p className="font-mono font-bold text-purple-600 dark:text-purple-400 text-lg">
                                                    {tempPassword}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(
                                                        tempPassword,
                                                    )
                                                }
                                                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                title="Copy password"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Warning */}
                                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                        <AlertTriangle
                                            size={18}
                                            className="text-amber-500 flex-shrink-0 mt-0.5"
                                        />
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            This password will not be shown
                                            again. Please make sure to save it
                                            or share it with the student
                                            securely.
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={copyAllCredentials}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                                        >
                                            {copied ? (
                                                <>
                                                    <CheckCircle size={18} />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={18} />
                                                    Copy All Credentials
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            Done
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

// User Actions Dropdown
const UserActions = ({ user, onResetPassword, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                <MoreVertical size={18} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                        <Link
                            href={route("admin.users.edit", user.id)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Edit size={16} />
                            Edit User
                        </Link>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onResetPassword(user);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Key size={16} />
                            Reset Password
                        </button>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onDelete(user);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 size={16} />
                            Delete User
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// Main Component
export default function Index({
    users,
    filters,
    roleCounts,
    sections = [],
    department,
}) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [resetPasswordModal, setResetPasswordModal] = useState({
        isOpen: false,
        user: null,
    });
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        user: null,
    });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({
        isOpen: false,
        loading: false,
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [tempPasswordModal, setTempPasswordModal] = useState({
        isOpen: false,
        user: null,
        tempPassword: null,
    });

    // Check for flash data when component mounts or flash changes
    useEffect(() => {
        if (flash?.tempPassword && flash?.createdUser) {
            setTempPasswordModal({
                isOpen: true,
                user: flash.createdUser,
                tempPassword: flash.tempPassword,
            });
        }
    }, [flash]);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("admin.users.index"),
            { ...filters, search },
            { preserveState: true },
        );
    };

    const handleRoleFilter = (role) => {
        router.get(
            route("admin.users.index"),
            { ...filters, role, section: "all", search: filters.search },
            { preserveState: true },
        );
    };

    const handleSectionFilter = (section) => {
        router.get(
            route("admin.users.index"),
            { ...filters, section, role: "student", search: filters.search },
            { preserveState: true },
        );
    };

    const handleSort = (field) => {
        const direction =
            filters.sort === field && filters.direction === "asc"
                ? "desc"
                : "asc";
        router.get(
            route("admin.users.index"),
            { ...filters, sort: field, direction },
            { preserveState: true },
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedUsers(users.data.map((u) => u.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelect = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        );
    };

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(route("admin.users.destroy", deleteModal.user.id), {
            onSuccess: () => {
                setDeleteModal({ isOpen: false, user: null });
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const handleBulkDelete = () => {
        if (selectedUsers.length === 0) return;
        setBulkDeleteModal({ isOpen: true, loading: false });
    };

    const handleConfirmBulkDelete = (password) => {
        if (selectedUsers.length === 0) return;
        setBulkDeleteModal({ isOpen: true, loading: true });
        router.post(
            route("admin.users.bulk-destroy"),
            { ids: selectedUsers, password },
            {
                onSuccess: () => {
                    setSelectedUsers([]);
                    setBulkDeleteModal({ isOpen: false, loading: false });
                },
                onError: (errors) => {
                    setBulkDeleteModal({ isOpen: true, loading: false });
                },
            },
        );
    };

    return (
        <AdminLayout>
            <Head title="User Management" />

            {/* Department Info Banner */}
            {department && (
                <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-blue-100">
                                Managing users for
                            </p>
                            <h2 className="text-lg font-bold">
                                {department.name}
                            </h2>
                            <p className="text-xs text-blue-100">
                                You can manage teachers in your department and
                                all students
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users size={28} className="text-purple-500" />
                        User Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {department
                            ? `Manage students and teachers in ${department.name}`
                            : "Manage all students, teachers, and administrators"}
                    </p>
                </div>
                <Link
                    href={route("admin.users.create")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Add User
                </Link>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            <FilterTab
                                label="All"
                                count={roleCounts.all}
                                isActive={
                                    (filters.role === "all" || !filters.role) &&
                                    (!filters.section ||
                                        filters.section === "all")
                                }
                                onClick={() => handleRoleFilter("all")}
                            />
                            <FilterTab
                                label="Students"
                                count={roleCounts.student}
                                isActive={filters.role === "student"}
                                onClick={() => handleRoleFilter("student")}
                            />
                            <FilterTab
                                label="Teachers"
                                count={roleCounts.teacher}
                                isActive={filters.role === "teacher"}
                                onClick={() => handleRoleFilter("teacher")}
                            />
                            <FilterTab
                                label="Admins"
                                count={roleCounts.admin}
                                isActive={filters.role === "admin"}
                                onClick={() => handleRoleFilter("admin")}
                            />
                        </div>

                        <form onSubmit={handleSearch} className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full lg:w-80 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </form>
                    </div>

                    {/* Section Filter */}
                    {(filters.role === "student" || sections.length > 0) && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <School size={16} />
                                Section:
                            </span>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleSectionFilter("all")}
                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                        filters.section === "all" ||
                                        !filters.section
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                                    }`}
                                >
                                    All Sections
                                </button>
                                {sections.map((section) => (
                                    <button
                                        key={section}
                                        onClick={() =>
                                            handleSectionFilter(section)
                                        }
                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                            filters.section === section
                                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                                        }`}
                                    >
                                        {section}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {selectedUsers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedUsers.length} selected
                        </span>
                        <button
                            onClick={handleBulkDelete}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 size={16} />
                            Delete Selected
                        </button>
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={
                                            selectedUsers.length ===
                                                users.data.length &&
                                            users.data.length > 0
                                        }
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <SortHeader
                                        label="Name"
                                        field="name"
                                        currentSort={filters.sort}
                                        currentDirection={filters.direction}
                                        onSort={handleSort}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <SortHeader
                                        label="Email"
                                        field="email"
                                        currentSort={filters.sort}
                                        currentDirection={filters.direction}
                                        onSort={handleSort}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <SortHeader
                                        label="Role"
                                        field="role"
                                        currentSort={filters.sort}
                                        currentDirection={filters.direction}
                                        onSort={handleSort}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Section
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Subjects & Teachers
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <SortHeader
                                        label="Joined"
                                        field="created_at"
                                        currentSort={filters.sort}
                                        currentDirection={filters.direction}
                                        onSort={handleSort}
                                    />
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {users.data.length > 0 ? (
                                users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(
                                                    user.id,
                                                )}
                                                onChange={() =>
                                                    handleSelect(user.id)
                                                }
                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                        {(
                                                            user.first_name ||
                                                            "U"
                                                        )
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {user.first_name}{" "}
                                                    {user.last_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                                            {user.email}
                                        </td>
                                        <td className="px-4 py-4">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <SectionBadge
                                                section={user.section}
                                                gradeLevel={user.grade_level}
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <SubjectsPopover
                                                subjects={user.subjects}
                                            />
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(
                                                user.created_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <UserActions
                                                user={user}
                                                onResetPassword={(u) =>
                                                    setResetPasswordModal({
                                                        isOpen: true,
                                                        user: u,
                                                    })
                                                }
                                                onDelete={(u) =>
                                                    setDeleteModal({
                                                        isOpen: true,
                                                        user: u,
                                                    })
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                                    >
                                        <Users
                                            size={48}
                                            className="mx-auto mb-3 opacity-50"
                                        />
                                        <p className="text-lg font-medium">
                                            No users found
                                        </p>
                                        <p className="text-sm">
                                            Try adjusting your search or filter
                                            criteria.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {users.from} to {users.to} of {users.total}{" "}
                            results
                        </p>
                        <div className="flex items-center gap-1">
                            {users.links.map((link, index) => {
                                if (link.label.includes("Previous")) {
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || "#"}
                                            className={`p-2 rounded-lg ${
                                                link.url
                                                    ? "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                                    : "text-gray-300 cursor-not-allowed"
                                            }`}
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
                                            className={`p-2 rounded-lg ${
                                                link.url
                                                    ? "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                                    : "text-gray-300 cursor-not-allowed"
                                            }`}
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
                                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                            link.active
                                                ? "bg-purple-600 text-white"
                                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                        }`}
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
            <ResetPasswordModal
                isOpen={resetPasswordModal.isOpen}
                onClose={() =>
                    setResetPasswordModal({ isOpen: false, user: null })
                }
                user={resetPasswordModal.user}
            />
            <DeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, user: null })}
                user={deleteModal.user}
                onConfirm={handleDelete}
                processing={isDeleting}
            />
            <BulkDeleteModal
                isOpen={bulkDeleteModal.isOpen}
                onClose={() =>
                    setBulkDeleteModal({ isOpen: false, loading: false })
                }
                selectedCount={selectedUsers.length}
                onConfirm={handleConfirmBulkDelete}
                processing={bulkDeleteModal.loading}
            />
            <TempPasswordModal
                isOpen={tempPasswordModal.isOpen}
                onClose={() =>
                    setTempPasswordModal({
                        isOpen: false,
                        user: null,
                        tempPassword: null,
                    })
                }
                user={tempPasswordModal.user}
                tempPassword={tempPasswordModal.tempPassword}
            />
        </AdminLayout>
    );
}

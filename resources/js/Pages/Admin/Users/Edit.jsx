import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Edit as EditIcon,
    ArrowLeft,
    User,
    Mail,
    Shield,
    GraduationCap,
    UserCog,
    CheckCircle,
    Save,
    Calendar,
    Building2,
} from "lucide-react";

// Role Selection Card
const RoleCard = ({
    role,
    icon: Icon,
    label,
    description,
    isSelected,
    onClick,
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`p-4 rounded-xl border-2 text-left transition-all ${
            isSelected
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
    >
        <div className="flex items-start justify-between">
            <div
                className={`p-2 rounded-lg ${
                    isSelected
                        ? "bg-purple-100 dark:bg-purple-900/30"
                        : "bg-gray-100 dark:bg-gray-700"
                }`}
            >
                <Icon
                    size={24}
                    className={
                        isSelected
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-gray-500 dark:text-gray-400"
                    }
                />
            </div>
            {isSelected && (
                <CheckCircle
                    size={20}
                    className="text-purple-600 dark:text-purple-400"
                />
            )}
        </div>
        <h4
            className={`mt-3 font-semibold ${
                isSelected
                    ? "text-purple-900 dark:text-purple-100"
                    : "text-gray-900 dark:text-white"
            }`}
        >
            {label}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
        </p>
    </button>
);

export default function Edit({ user, department }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        role: user.role,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("admin.users.update", user.id));
    };

    // Only student and teacher roles - admins cannot change roles to admin
    const roles = [
        {
            value: "student",
            icon: GraduationCap,
            label: "Student",
            description:
                "Can view grades, attendance, and receive interventions.",
        },
        {
            value: "teacher",
            icon: UserCog,
            label: "Teacher",
            description: department
                ? `Will be assigned to ${department.name} department.`
                : "Can manage classes, grades, attendance, and create interventions.",
        },
    ];

    return (
        <AdminLayout>
            <Head title={`Edit User - ${user.name}`} />

            {/* Department Info Banner */}
            {department && (
                <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-blue-100">
                                Editing user for
                            </p>
                            <h2 className="text-lg font-bold">
                                {department.name}
                            </h2>
                            <p className="text-xs text-blue-100">
                                Teachers will be assigned to this department
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <Link
                    href={route("admin.users.index")}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Users
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <EditIcon size={28} className="text-purple-500" />
                    Edit User
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Update user information and role assignment.
                </p>
            </div>

            {/* User Info Card */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <p className="text-purple-100">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-purple-200">
                            <Calendar size={14} />
                            Joined {user.created_at}
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            User Role *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {roles.map((role) => (
                                <RoleCard
                                    key={role.value}
                                    {...role}
                                    isSelected={data.role === role.value}
                                    onClick={() => setData("role", role.value)}
                                />
                            ))}
                        </div>
                        {errors.role && (
                            <p className="mt-2 text-sm text-red-600">
                                {errors.role}
                            </p>
                        )}
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Name */}
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            Full Name *
                        </label>
                        <div className="relative">
                            <User
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Enter full name"
                            />
                        </div>
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            Email Address *
                        </label>
                        <div className="relative">
                            <Mail
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Enter email address"
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                            <strong>Note:</strong> To reset the user's password,
                            go back to the user list and use the "Reset
                            Password" option from the actions menu.
                        </p>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Link
                            href={route("admin.users.index")}
                            className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

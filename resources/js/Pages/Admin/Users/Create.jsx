import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    UserPlus,
    ArrowLeft,
    User,
    Mail,
    Lock,
    Shield,
    Eye,
    EyeOff,
    GraduationCap,
    UserCog,
    CheckCircle,
    Info,
    Copy,
    Key,
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

export default function Create({ department }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "student",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.users.store"), {
            onSuccess: () => reset(),
        });
    };

    // Only student and teacher roles - admins cannot create other admins
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
            <Head title="Create User" />

            {/* Department Info Banner */}
            {department && (
                <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-blue-100">
                                Creating users for
                            </p>
                            <h2 className="text-lg font-bold">
                                {department.name}
                            </h2>
                            <p className="text-xs text-blue-100">
                                Teachers created will be automatically assigned
                                to this department
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
                    <UserPlus size={28} className="text-purple-500" />
                    Create New User
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Add a new student, teacher, or administrator to the system.
                </p>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Select Role *
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

                    {/* Info box for student role - auto-generated password */}
                    {data.role === "student" && (
                        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <Key
                                size={20}
                                className="text-blue-500 mt-0.5 flex-shrink-0"
                            />
                            <div>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    Auto-generated Password
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                                    A secure random password will be
                                    automatically generated for this student.
                                    You'll be able to view and copy it after
                                    creating the account.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Password - only show for non-student roles */}
                    {data.role !== "student" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Password *
                                </label>
                                <div className="relative">
                                    <Lock
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="Enter password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
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
                                <label
                                    htmlFor="password_confirmation"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <Lock
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        id="password_confirmation"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData(
                                                "password_confirmation",
                                                e.target.value
                                            )
                                        }
                                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="Confirm password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Create User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

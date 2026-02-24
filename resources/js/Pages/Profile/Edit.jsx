import { useState } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TeacherLayout from "@/Layouts/TeacherLayout";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    User,
    Mail,
    BookOpen,
    GraduationCap,
    Shield,
    Key,
    CheckCircle,
    X,
    Eye,
    EyeOff,
} from "lucide-react";
import UserPicture from "../../../assets/user.png";

// --- Info Display Field Component (Read-only) ---
const InfoField = ({ label, value, icon: Icon }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-500">
            {label}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon size={18} className="text-gray-400" />
                </div>
            )}
            <div
                className={`
                    w-full rounded-xl border border-gray-200 bg-gray-50 transition-all duration-200
                    ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 text-gray-700
                `}
            >
                {value || (
                    <span className="text-gray-400 italic">Not provided</span>
                )}
            </div>
        </div>
    </div>
);

// --- Password Input Field Component ---
const PasswordInputField = ({
    label,
    name,
    value,
    onChange,
    error,
    placeholder,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={18} className="text-gray-400" />
                </div>
                <input
                    type={showPassword ? "text" : "password"}
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`
                        w-full rounded-xl border transition-all duration-200
                        pl-10 pr-12 py-3
                        bg-white text-gray-900 border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200
                        ${
                            error
                                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                                : ""
                        }
                    `}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
    );
};

// --- Section Card Component ---
const SectionCard = ({ title, description, children, icon: Icon }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className="p-2 bg-pink-100 rounded-lg">
                        <Icon size={20} className="text-pink-600" />
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-sm text-gray-500 mt-0.5">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

// --- Success Message Component ---
const SuccessMessage = ({ show, message }) => {
    if (!show) return null;
    return (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <CheckCircle size={18} />
            <span>{message}</span>
        </div>
    );
};

// --- Change Password Modal ---
const ChangePasswordModal = ({ show, onClose }) => {
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const [successMessage, setSuccessMessage] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("password.update"), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSuccessMessage("Password updated successfully!");
                setTimeout(() => {
                    setSuccessMessage("");
                    onClose();
                }, 1500);
            },
        });
    };

    const handleClose = () => {
        reset();
        setSuccessMessage("");
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-pink-100 rounded-full">
                            <Key size={24} className="text-pink-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Change Password
                            </h3>
                            <p className="text-sm text-gray-500">
                                Update your account password
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {successMessage && (
                    <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                        <CheckCircle size={18} />
                        <span>{successMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <PasswordInputField
                        label="Current Password"
                        name="current_password"
                        value={data.current_password}
                        onChange={(e) =>
                            setData("current_password", e.target.value)
                        }
                        error={errors.current_password}
                        placeholder="Enter your current password"
                    />

                    <PasswordInputField
                        label="New Password"
                        name="password"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        error={errors.password}
                        placeholder="Enter new password"
                    />

                    <PasswordInputField
                        label="Confirm New Password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                        error={errors.password_confirmation}
                        placeholder="Confirm your new password"
                    />

                    <div className="pt-2 text-xs text-gray-500">
                        <p>Password must be at least 8 characters long.</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main Profile Component ---
export default function Edit({ status, student }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const isStudent = user.role === "student";
    const isTeacher = user.role === "teacher";
    const isAdmin = user.role === "admin";

    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Get the full name for display
    const fullName =
        isStudent && student ? student.student_name || "" : user.name;

    // Determine the correct layout based on user role
    const Layout = isTeacher
        ? TeacherLayout
        : isAdmin
          ? AdminLayout
          : AuthenticatedLayout;

    return (
        <Layout>
            <Head title="My Profile" />

            <div className="min-h-screen bg-gray-50/50 py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            My Profile
                        </h1>
                        <p className="text-gray-500 mt-1">
                            View your account information
                        </p>
                    </div>

                    {/* Success Message */}
                    {status === "password-updated" && (
                        <div className="mb-6">
                            <SuccessMessage
                                show={true}
                                message="Your password has been updated successfully!"
                            />
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Profile Header Card */}
                        <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 sm:p-8 text-white relative overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <svg
                                    className="w-full h-full"
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <pattern
                                            id="grid"
                                            width="10"
                                            height="10"
                                            patternUnits="userSpaceOnUse"
                                        >
                                            <path
                                                d="M 10 0 L 0 0 0 10"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="0.5"
                                            />
                                        </pattern>
                                    </defs>
                                    <rect
                                        width="100"
                                        height="100"
                                        fill="url(#grid)"
                                    />
                                </svg>
                            </div>

                            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                                {/* Avatar */}
                                <div className="relative">
                                    <img
                                        src={student?.avatar || UserPicture}
                                        alt="Profile"
                                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/30 shadow-lg object-cover"
                                    />
                                </div>

                                {/* User Info */}
                                <div className="text-center sm:text-left flex-1">
                                    <h2 className="text-2xl sm:text-3xl font-bold">
                                        {fullName || "Student"}
                                    </h2>
                                    <p className="text-white/80 mt-1 text-sm sm:text-base">
                                        {user.email}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium capitalize">
                                            {user.role}
                                        </span>
                                        {isStudent && student?.grade_level && (
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                                                Grade {student.grade_level}
                                            </span>
                                        )}
                                        {isStudent && student?.section && (
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                                                {student.section}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Student Information (Only for students) */}
                        {isStudent && student && (
                            <SectionCard
                                title="Student Information"
                                description="Your academic profile details (read-only)"
                                icon={GraduationCap}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <InfoField
                                        label="Student Name"
                                        value={student.student_name}
                                        icon={User}
                                    />
                                    <InfoField
                                        label="LRN"
                                        value={student.lrn}
                                    />
                                    <InfoField
                                        label="Grade Level"
                                        value={student.grade_level}
                                        icon={BookOpen}
                                    />
                                    <InfoField
                                        label="Section"
                                        value={student.section}
                                    />
                                    {student.track && (
                                        <InfoField
                                            label="Track"
                                            value={student.track}
                                        />
                                    )}
                                    {student.strand && (
                                        <InfoField
                                            label="Strand"
                                            value={student.strand}
                                        />
                                    )}
                                </div>
                            </SectionCard>
                        )}

                        {/* Account Information */}
                        <SectionCard
                            title="Account Information"
                            description="Your login credentials"
                            icon={Mail}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <InfoField
                                    label="Display Name"
                                    value={user.name}
                                    icon={User}
                                />
                                <InfoField
                                    label="Email Address"
                                    value={user.email}
                                    icon={Mail}
                                />
                            </div>
                        </SectionCard>

                        {/* Security Section */}
                        <SectionCard
                            title="Security"
                            description="Manage your password"
                            icon={Shield}
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div>
                                    <h4 className="font-medium text-gray-900">
                                        Password
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Change your password to keep your
                                        account secure
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                                >
                                    <Key size={18} />
                                    Change Password
                                </button>
                            </div>
                        </SectionCard>

                        {/* Info Note */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm text-blue-700">
                                <strong>Note:</strong> To update your personal
                                information, please contact your teacher or
                                school administrator.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                show={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </Layout>
    );
}

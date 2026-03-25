import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import ApplicationLogo from "@/Components/ApplicationLogo";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    ArrowLeft,
    Mail,
    KeyRound,
    Send,
    UserCog,
    MessageSquare,
} from "lucide-react";
import { useState } from "react";

export default function ForgotPassword({ status }) {
    const [activeTab, setActiveTab] = useState("reset-link");

    const resetLinkForm = useForm({
        email: "",
    });

    const adminRequestForm = useForm({
        email: "",
        reason: "",
    });

    const submitResetLink = (e) => {
        e.preventDefault();
        resetLinkForm.post(route("password.email"));
    };

    const submitAdminRequest = (e) => {
        e.preventDefault();
        adminRequestForm.post(route("password.admin-request"));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            {/* Header Section */}
            <div className="flex flex-col items-center mb-6">
                <Link href="/" className="group">
                    <div className="relative">
                        <div className="absolute -inset-3 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <ApplicationLogo className="h-24 w-24 relative drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
                    </div>
                </Link>
                <div className="mt-4 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-primary" />
                    <h1 className="text-xl font-semibold text-gray-800 font-poppins">
                        Reset Password
                    </h1>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
                <button
                    type="button"
                    onClick={() => setActiveTab("reset-link")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === "reset-link"
                            ? "bg-white text-primary shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <Send className="w-4 h-4" />
                    Email Reset Link
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("admin-request")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === "admin-request"
                            ? "bg-white text-primary shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <UserCog className="w-4 h-4" />
                    Admin Reset
                </button>
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600 text-center bg-green-50 p-3 rounded-xl border border-green-200">
                    {status}
                </div>
            )}

            {/* Reset Link Tab */}
            {activeTab === "reset-link" && (
                <>
                    <div className="mb-6 text-sm text-gray-600 text-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                        Forgot your password? No problem. Just enter your email
                        address and we'll send you a password reset link.
                    </div>

                    <form onSubmit={submitResetLink} className="space-y-6">
                        <div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <TextInput
                                    id="reset-email"
                                    type="email"
                                    name="email"
                                    value={resetLinkForm.data.email}
                                    className="block w-full pl-10 rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                                    isFocused={true}
                                    placeholder="Enter your email"
                                    onChange={(e) =>
                                        resetLinkForm.setData(
                                            "email",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <InputError
                                message={resetLinkForm.errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Link
                                href={route("login")}
                                className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors duration-200 font-medium"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Login
                            </Link>

                            <PrimaryButton
                                disabled={resetLinkForm.processing}
                                className="bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-500 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
                            >
                                Send Reset Link
                            </PrimaryButton>
                        </div>
                    </form>
                </>
            )}

            {/* Admin Request Tab */}
            {activeTab === "admin-request" && (
                <>
                    <div className="mb-6 text-sm text-gray-600 text-center bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <div className="flex items-start gap-2 text-left">
                            <UserCog className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-800 mb-1">
                                    Face-to-Face Password Reset
                                </p>
                                <p className="text-amber-700 text-xs">
                                    For teachers and students. Submit a request
                                    and visit your department admin in person.
                                    The admin will generate a temporary password
                                    for you to use.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submitAdminRequest} className="space-y-5">
                        <div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <TextInput
                                    id="admin-email"
                                    type="email"
                                    name="email"
                                    value={adminRequestForm.data.email}
                                    className="block w-full pl-10 rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                                    placeholder="Enter your email"
                                    onChange={(e) =>
                                        adminRequestForm.setData(
                                            "email",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <InputError
                                message={adminRequestForm.errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <textarea
                                    id="reason"
                                    name="reason"
                                    value={adminRequestForm.data.reason}
                                    className="block w-full pl-10 rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200 resize-none text-sm"
                                    placeholder="Briefly explain why you need a password reset..."
                                    rows={3}
                                    onChange={(e) =>
                                        adminRequestForm.setData(
                                            "reason",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <InputError
                                message={adminRequestForm.errors.reason}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Link
                                href={route("login")}
                                className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors duration-200 font-medium"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Login
                            </Link>

                            <PrimaryButton
                                disabled={adminRequestForm.processing}
                                className="bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200"
                            >
                                Submit Request
                            </PrimaryButton>
                        </div>
                    </form>
                </>
            )}

            {/* Back to Welcome */}
            <div className="text-center pt-4">
                <Link
                    href="/"
                    className="text-xs text-gray-500 hover:text-primary transition-colors duration-200"
                >
                    ← Back to Welcome Page
                </Link>
            </div>
        </GuestLayout>
    );
}

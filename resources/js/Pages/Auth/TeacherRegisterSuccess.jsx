import ApplicationLogo from "@/Components/ApplicationLogo";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link } from "@inertiajs/react";
import { CheckCircle2, Clock, ArrowLeft, Mail } from "lucide-react";

export default function TeacherRegisterSuccess() {
    return (
        <GuestLayout>
            <Head title="Registration Submitted" />

            <div className="flex flex-col items-center text-center">
                {/* Success Icon */}
                <div className="relative mb-6">
                    <div className="absolute -inset-4 bg-green-100 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Registration Submitted!
                </h1>
                <p className="text-gray-500 mb-8">
                    Your teacher registration has been submitted successfully.
                </p>

                {/* Status Card */}
                <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <span className="font-semibold text-amber-800">
                            Pending Approval
                        </span>
                    </div>
                    <p className="text-sm text-amber-700">
                        Your registration is currently being reviewed by your
                        department administrator. This process typically takes
                        1-2 business days.
                    </p>
                </div>

                {/* What's Next */}
                <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-4">
                        What happens next?
                    </h3>
                    <div className="space-y-4 text-left">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-primary">
                                    1
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    Document Review
                                </p>
                                <p className="text-xs text-gray-500">
                                    Your department admin will review your
                                    credentials
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-primary">
                                    2
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    Account Activation
                                </p>
                                <p className="text-xs text-gray-500">
                                    Once approved, your account will be
                                    activated
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-primary">
                                    3
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    Start Teaching
                                </p>
                                <p className="text-xs text-gray-500">
                                    Log in with your credentials and access the
                                    portal
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Notice */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Mail className="w-4 h-4" />
                    <span>
                        You may receive an email notification once your account
                        is approved.
                    </span>
                </div>

                {/* Back to Login Button */}
                <Link
                    href={route("login")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-pink-400 text-white font-medium rounded-xl shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-pink-500 transition-all duration-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>
            </div>
        </GuestLayout>
    );
}

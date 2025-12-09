import { Head, Link, usePage } from "@inertiajs/react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { Clock, Mail, Building2, LogOut, RefreshCw, User } from "lucide-react";
import { router } from "@inertiajs/react";

export default function PendingApproval() {
    const { auth } = usePage().props;
    const user = auth.user;

    const handleLogout = (e) => {
        e.preventDefault();
        router.post(route("logout"));
    };

    const handleRefresh = () => {
        router.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col items-center justify-center p-4">
            <Head title="Pending Approval" />

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <ApplicationLogo className="h-24 w-24 drop-shadow-lg" />
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    {/* Status Header */}
                    <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-white animate-pulse" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">
                            Pending Approval
                        </h1>
                        <p className="text-amber-100 text-sm">
                            Your account is awaiting administrator review
                        </p>
                    </div>

                    {/* User Info */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                                {user?.name?.charAt(0) || "T"}
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-800">
                                    {user?.name || "Teacher"}
                                </h2>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <Mail size={12} />
                                    {user?.email || "email@example.com"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="p-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                            <h3 className="font-semibold text-amber-800 mb-2">
                                What's happening?
                            </h3>
                            <p className="text-sm text-amber-700 leading-relaxed">
                                Your teacher registration is currently being
                                reviewed by your department administrator. Once
                                approved, you'll have full access to the teacher
                                portal.
                            </p>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        Registration Submitted
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Your application has been received
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        Under Review
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Waiting for administrator approval
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-400">
                                        Account Activated
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Coming soon...
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={handleRefresh}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-pink-400 text-white font-medium rounded-xl shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-pink-500 transition-all duration-200"
                            >
                                <RefreshCw size={18} />
                                Check Status
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-medium rounded-xl transition-all duration-200"
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Help Text */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Need help? Contact your department administrator.
                </p>
            </div>
        </div>
    );
}

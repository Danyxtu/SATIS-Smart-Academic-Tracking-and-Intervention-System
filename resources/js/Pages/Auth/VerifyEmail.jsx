import PrimaryButton from "@/Components/PrimaryButton";
import ApplicationLogo from "@/Components/ApplicationLogo";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { useEffect } from "react";
import { Mail, CheckCircle, Send } from "lucide-react";

export default function VerifyEmail({
    status,
    currentEmail = "",
    requiresEmailInput = false,
    expiresInMinutes = 30,
}) {
    const { data, setData, post, processing, errors } = useForm({
        email: currentEmail || "",
    });

    useEffect(() => {
        setData("email", currentEmail || "");
    }, [currentEmail, setData]);

    const submit = (e) => {
        e.preventDefault();

        post(route("verification.send"), {
            preserveScroll: true,
        });
    };

    const showEmailRequiredHint = status === "verification-email-required";

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            {/* Header Section */}
            <div className="flex flex-col items-center mb-6">
                <Link href="/" className="group">
                    <div className="relative">
                        <div className="absolute -inset-3 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <ApplicationLogo className="h-24 w-24 relative drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
                    </div>
                </Link>
                <div className="mt-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    <h1 className="text-xl font-semibold text-gray-800 font-poppins">
                        Verify Email
                    </h1>
                </div>
            </div>

            <div className="mb-6 text-sm text-gray-600 text-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                <Mail className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                {requiresEmailInput
                    ? "Please enter your personal email first. We will send a verification link to activate your student dashboard access."
                    : "Before getting started, verify your personal email by clicking the link we send. You can resend a new link anytime."}
                <p className="mt-2 text-xs text-blue-700">
                    Verification links expire in {expiresInMinutes} minutes.
                </p>
            </div>

            {showEmailRequiredHint && (
                <div className="mb-4 text-sm font-medium text-amber-700 text-center bg-amber-50 p-3 rounded-xl border border-amber-200">
                    A personal email is required before you can access the
                    student dashboard.
                </div>
            )}

            {status === "verification-link-sent" && (
                <div className="mb-4 text-sm font-medium text-green-600 text-center bg-green-50 p-3 rounded-xl border border-green-200 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />A new verification link
                    has been sent to your personal email.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mb-4">
                    <label
                        htmlFor="email"
                        className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1"
                    >
                        Personal Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        placeholder="student@example.com"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-primary/30"
                        required={requiresEmailInput}
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <PrimaryButton
                        disabled={processing}
                        className="w-full sm:w-auto justify-center bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-500 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        {requiresEmailInput
                            ? "Send Verification Email"
                            : "Resend Verification Email"}
                    </PrimaryButton>

                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="text-sm text-gray-600 hover:text-primary transition-colors duration-200 font-medium"
                    >
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}

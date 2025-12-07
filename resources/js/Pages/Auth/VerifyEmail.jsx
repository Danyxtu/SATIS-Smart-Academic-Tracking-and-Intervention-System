import PrimaryButton from "@/Components/PrimaryButton";
import ApplicationLogo from "@/Components/ApplicationLogo";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Mail, CheckCircle, Send } from "lucide-react";

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route("verification.send"));
    };

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
                Thanks for signing up! Before getting started, could you verify
                your email address by clicking on the link we just emailed to
                you? If you didn't receive the email, we will gladly send you
                another.
            </div>

            {status === "verification-link-sent" && (
                <div className="mb-4 text-sm font-medium text-green-600 text-center bg-green-50 p-3 rounded-xl border border-green-200 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />A new verification link
                    has been sent to the email address you provided during
                    registration.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <PrimaryButton
                        disabled={processing}
                        className="w-full sm:w-auto justify-center bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-500 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Resend Verification Email
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

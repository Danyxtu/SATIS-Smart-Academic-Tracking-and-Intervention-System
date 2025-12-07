import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import ApplicationLogo from "@/Components/ApplicationLogo";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Mail, KeyRound } from "lucide-react";

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("password.email"));
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

            <div className="mb-6 text-sm text-gray-600 text-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                Forgot your password? No problem. Just enter your email address
                and we'll send you a password reset link.
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600 text-center bg-green-50 p-3 rounded-xl border border-green-200">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="block w-full pl-10 rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                            isFocused={true}
                            placeholder="Enter your email"
                            onChange={(e) => setData("email", e.target.value)}
                        />
                    </div>
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="flex items-center justify-between">
                    {/* Back to Login Link */}
                    <Link
                        href={route("login")}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors duration-200 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Login
                    </Link>

                    {/* Submit Button */}
                    <PrimaryButton
                        disabled={processing}
                        className="bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-500 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
                    >
                        Send Reset Link
                    </PrimaryButton>
                </div>

                {/* Optional: Back to Welcome/Home */}
                <div className="text-center pt-2">
                    <Link
                        href="/"
                        className="text-xs text-gray-500 hover:text-primary transition-colors duration-200"
                    >
                        ← Back to Welcome Page
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}

import ApplicationLogo from "@/Components/ApplicationLogo";
import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import Spacer from "@/Components/util/Spacer";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Eye, EyeClosed, LogIn, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                {/* Logo and Header Section */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="group">
                        <div className="relative">
                            <div className="absolute -inset-3 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <ApplicationLogo className="h-32 w-32 relative drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
                        </div>
                    </Link>
                    <div className="mt-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h1 className="text-xl font-semibold text-gray-800 font-poppins">
                            Welcome Back
                        </h1>
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Sign in to continue to SATIS
                    </p>
                </div>

                <div className="space-y-5">
                    {/* Email Field */}
                    <div>
                        <InputLabel
                            htmlFor="email"
                            value="Email"
                            className="text-gray-700 font-medium"
                        />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                            autoComplete="username"
                            isFocused={true}
                            placeholder="Enter your email"
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    {/* Password Field */}
                    <div className="relative">
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="text-gray-700 font-medium"
                        />
                        <div className="relative">
                            <TextInput
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={data.password}
                                className="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 pr-12 transition-all duration-200"
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                                {showPassword ? (
                                    <Eye className="w-5 h-5 text-primary" />
                                ) : (
                                    <EyeClosed className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    {/* Sign In Button */}
                    <div className="pt-2">
                        <PrimaryButton
                            className="w-full justify-center py-3 bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-500 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 text-sm font-medium"
                            disabled={processing}
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign in
                        </PrimaryButton>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center justify-center">
                        <label className="flex items-center cursor-pointer group">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                className="rounded border-gray-300 text-primary focus:ring-primary/30"
                                onChange={(e) =>
                                    setData("remember", e.target.checked)
                                }
                            />
                            <span className="ms-2 text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                                Remember me
                            </span>
                        </label>
                    </div>

                    {/* Forgot Password */}
                    {canResetPassword && (
                        <div className="text-center pt-2">
                            <Link
                                href={route("password.request")}
                                className="text-sm text-primary hover:text-pink-500 transition-colors duration-200 font-medium"
                            >
                                Forgot your password?
                            </Link>
                        </div>
                    )}

                    {/* Teacher Registration Link */}
                    <div className="text-center pt-4 border-t border-gray-200 mt-4">
                        <p className="text-sm text-gray-500 mb-2">
                            Are you a teacher?
                        </p>
                        <Link
                            href={route("teacher.registration.create")}
                            className="inline-flex items-center gap-2 text-sm text-primary hover:text-pink-500 transition-colors duration-200 font-medium"
                        >
                            <UserPlus className="w-4 h-4" />
                            Register as a Teacher
                        </Link>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}

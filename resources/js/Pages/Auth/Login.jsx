import ApplicationLogo from "@/Components/ApplicationLogo";
import Checkbox from "@/Components/Checkbox";
import AppDownloadCTA from "@/Components/AppDownloadCTA";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
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
        <>
            <GuestLayout cardClassName="max-w-sm px-4 py-4 sm:max-w-sm sm:px-5 sm:py-5 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto">
                <Head title="Log in" />

                {status && (
                    <div className="mb-2.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-2 text-xs font-medium text-green-600">
                        {status}
                    </div>
                )}

                <form onSubmit={submit}>
                    {/* Logo and Header Section */}
                    <div className="mb-3.5 flex flex-col items-center sm:mb-4">
                        <Link href="/" className="group">
                            <div className="relative">
                                <div className="absolute -inset-2 rounded-full bg-primary/20 blur-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:-inset-3" />
                                <ApplicationLogo className="relative h-14 w-14 drop-shadow-md transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16" />
                            </div>
                        </Link>
                        <div className="mt-2.5 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <h1 className="font-poppins text-[15px] sm:text-base font-semibold text-gray-800">
                                Welcome Back
                            </h1>
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <p className="mt-1 text-[11px] sm:text-xs text-gray-500">
                            Sign in to continue to SATIS
                        </p>
                    </div>

                    <div className="space-y-3">
                        {/* Username or Email Field */}
                        <div>
                            <InputLabel
                                htmlFor="email"
                                value="Username or Email"
                                className="text-xs font-semibold tracking-wide text-gray-700"
                            />
                            <TextInput
                                id="email"
                                type="text"
                                name="email"
                                value={data.email}
                                className="mt-1 block h-10 w-full rounded-lg border-gray-200 px-3 text-sm shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-primary focus:ring-primary/25"
                                autoComplete="username"
                                isFocused={true}
                                placeholder="Enter your username or email"
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                            />
                            <InputError
                                message={errors.email}
                                className="mt-1 text-xs"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="relative">
                            <InputLabel
                                htmlFor="password"
                                value="Password"
                                className="text-xs font-semibold tracking-wide text-gray-700"
                            />
                            <div className="relative">
                                <TextInput
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    className="mt-1 block h-10 w-full rounded-lg border-gray-200 px-3 pr-10 text-sm shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-primary focus:ring-primary/25"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-gray-100 transition-colors duration-200"
                                >
                                    {showPassword ? (
                                        <Eye className="h-4 w-4 text-primary" />
                                    ) : (
                                        <EyeClosed className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            <InputError
                                message={errors.password}
                                className="mt-1 text-xs"
                            />
                        </div>

                        {/* Sign In Button */}
                        <div className="pt-1.5">
                            <PrimaryButton
                                className="w-full justify-center rounded-lg bg-gradient-to-r from-primary to-pink-400 py-2 text-xs font-semibold tracking-wide shadow-md shadow-primary/20 transition-all duration-200 hover:from-primary/90 hover:to-pink-500 sm:py-2.5"
                                disabled={processing}
                            >
                                <LogIn className="mr-1.5 h-3.5 w-3.5" />
                                Sign in
                            </PrimaryButton>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center justify-center">
                            <label className="flex items-center cursor-pointer group">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary/30"
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                />
                                <span className="ms-1.5 text-xs text-gray-600 transition-colors group-hover:text-gray-800">
                                    Remember me
                                </span>
                            </label>
                        </div>

                        {/* Forgot Password */}
                        {canResetPassword && (
                            <div className="pt-0.5 text-center">
                                <Link
                                    href={route("password.request")}
                                    className="text-xs font-medium text-primary transition-colors duration-200 hover:text-pink-500"
                                >
                                    Forgot your password?
                                </Link>
                            </div>
                        )}

                        {/* Teacher Registration Link */}
                        <div className="mt-2.5 border-t border-gray-200 pt-2.5 text-center">
                            <p className="mb-1 text-xs text-gray-500">
                                Are you a teacher?
                            </p>
                            <Link
                                href={route("teacher.registration.create")}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors duration-200 hover:text-pink-500"
                            >
                                <UserPlus className="h-3.5 w-3.5" />
                                Register as a Teacher
                            </Link>
                        </div>
                    </div>
                </form>
            </GuestLayout>

            <AppDownloadCTA />
        </>
    );
}

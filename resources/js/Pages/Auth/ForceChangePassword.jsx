import ApplicationLogo from "@/Components/ApplicationLogo";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Eye, EyeClosed, ShieldCheck, Lock, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function ForceChangePassword({ user }) {
    const { data, setData, post, processing, errors } = useForm({
        password: "",
        password_confirmation: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route("password.force-change.update"));
    };

    // Password strength indicator
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: "", color: "" };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;

        const levels = [
            { strength: 1, label: "Very Weak", color: "bg-red-500" },
            { strength: 2, label: "Weak", color: "bg-orange-500" },
            { strength: 3, label: "Fair", color: "bg-yellow-500" },
            { strength: 4, label: "Good", color: "bg-lime-500" },
            { strength: 5, label: "Strong", color: "bg-green-500" },
        ];

        return levels[strength - 1] || { strength: 0, label: "", color: "" };
    };

    const passwordStrength = getPasswordStrength(data.password);
    const passwordsMatch =
        data.password &&
        data.password_confirmation &&
        data.password === data.password_confirmation;

    return (
        <GuestLayout>
            <Head title="Create New Password" />

            <form onSubmit={submit}>
                {/* Logo and Header Section */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="group">
                        <div className="relative">
                            <div className="absolute -inset-3 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <ApplicationLogo className="h-24 w-24 relative drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
                        </div>
                    </Link>

                    {/* Alert Banner */}
                    <div className="mt-6 w-full bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-amber-800">
                                    First Login - Password Required
                                </h3>
                                <p className="text-sm text-amber-700 mt-1">
                                    Hi{" "}
                                    <span className="font-medium">
                                        {user?.name}
                                    </span>
                                    ! For your security, please create a new
                                    password before continuing.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        <h1 className="text-xl font-semibold text-gray-800">
                            Create Your Password
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 text-center">
                        Choose a secure password you'll remember
                    </p>
                </div>

                <div className="space-y-5">
                    {/* New Password Field */}
                    <div>
                        <InputLabel
                            htmlFor="password"
                            value="New Password"
                            className="text-gray-700 font-medium"
                        />
                        <div className="relative">
                            <TextInput
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={data.password}
                                className="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 pr-12 transition-all duration-200"
                                autoComplete="new-password"
                                isFocused={true}
                                placeholder="Enter new password"
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

                        {/* Password Strength Indicator */}
                        {data.password && (
                            <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                                                level <=
                                                passwordStrength.strength
                                                    ? passwordStrength.color
                                                    : "bg-gray-200"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p
                                    className={`text-xs ${
                                        passwordStrength.strength >= 4
                                            ? "text-green-600"
                                            : passwordStrength.strength >= 3
                                            ? "text-yellow-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    Password strength: {passwordStrength.label}
                                </p>
                            </div>
                        )}

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm Password"
                            className="text-gray-700 font-medium"
                        />
                        <div className="relative">
                            <TextInput
                                id="password_confirmation"
                                type={showConfirmPassword ? "text" : "password"}
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className={`mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 pr-12 transition-all duration-200 ${
                                    data.password_confirmation &&
                                    (passwordsMatch
                                        ? "border-green-400 focus:border-green-500"
                                        : "border-red-400 focus:border-red-500")
                                }`}
                                autoComplete="new-password"
                                placeholder="Confirm your password"
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value
                                    )
                                }
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                                {showConfirmPassword ? (
                                    <Eye className="w-5 h-5 text-primary" />
                                ) : (
                                    <EyeClosed className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                        </div>

                        {/* Password Match Indicator */}
                        {data.password_confirmation && (
                            <p
                                className={`mt-1 text-xs ${
                                    passwordsMatch
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {passwordsMatch
                                    ? "✓ Passwords match"
                                    : "✗ Passwords do not match"}
                            </p>
                        )}

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                            Password requirements:
                        </p>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li
                                className={
                                    data.password?.length >= 8
                                        ? "text-green-600"
                                        : ""
                                }
                            >
                                {data.password?.length >= 8 ? "✓" : "○"} At
                                least 8 characters
                            </li>
                            <li
                                className={
                                    data.password?.match(/[A-Z]/)
                                        ? "text-green-600"
                                        : ""
                                }
                            >
                                {data.password?.match(/[A-Z]/) ? "✓" : "○"} One
                                uppercase letter
                            </li>
                            <li
                                className={
                                    data.password?.match(/[a-z]/)
                                        ? "text-green-600"
                                        : ""
                                }
                            >
                                {data.password?.match(/[a-z]/) ? "✓" : "○"} One
                                lowercase letter
                            </li>
                            <li
                                className={
                                    data.password?.match(/[0-9]/)
                                        ? "text-green-600"
                                        : ""
                                }
                            >
                                {data.password?.match(/[0-9]/) ? "✓" : "○"} One
                                number
                            </li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <PrimaryButton
                        className="w-full justify-center py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 transition-all duration-200 shadow-lg shadow-primary/25"
                        disabled={
                            processing ||
                            !passwordsMatch ||
                            passwordStrength.strength < 3
                        }
                    >
                        <Lock className="w-4 h-4 mr-2" />
                        {processing ? "Creating..." : "Set Password & Continue"}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}

import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import ApplicationLogo from "@/Components/ApplicationLogo";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { KeyRound, RefreshCw } from "lucide-react";

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("password.store"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <form onSubmit={submit}>
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
                    <p className="text-sm text-gray-500 mt-1">
                        Create your new password
                    </p>
                </div>

                <div className="space-y-4">
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
                            className="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200 bg-gray-50"
                            autoComplete="username"
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password"
                            value="New Password"
                            className="text-gray-700 font-medium"
                        />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                            autoComplete="new-password"
                            isFocused={true}
                            placeholder="Enter new password"
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                        />
                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm Password"
                            className="text-gray-700 font-medium"
                        />
                        <TextInput
                            type="password"
                            id="password_confirmation"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                            autoComplete="new-password"
                            placeholder="Confirm new password"
                            onChange={(e) =>
                                setData("password_confirmation", e.target.value)
                            }
                        />
                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                        <PrimaryButton
                            className="bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-500 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
                            disabled={processing}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reset Password
                        </PrimaryButton>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}

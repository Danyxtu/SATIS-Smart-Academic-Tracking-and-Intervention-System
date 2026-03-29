import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import ApplicationLogo from "@/Components/ApplicationLogo";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { UserPlus, Sparkles } from "lucide-react";

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

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
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h1 className="text-xl font-semibold text-gray-800 font-poppins">
                            Create Account
                        </h1>
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Join SATIS today
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <InputLabel
                            htmlFor="first_name"
                            value="First Name"
                            className="text-gray-700 font-medium"
                        />
                        <TextInput
                            id="first_name"
                            name="first_name"
                            value={data.first_name}
                            className="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                            autoComplete="given-name"
                            isFocused={true}
                            placeholder="Enter your first name"
                            onChange={(e) =>
                                setData("first_name", e.target.value)
                            }
                            required
                        />
                        <InputError
                            message={errors.first_name}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="middle_name"
                            value="Middle Name (Optional)"
                            className="text-gray-700 font-medium"
                        />
                        <TextInput
                            id="middle_name"
                            name="middle_name"
                            value={data.middle_name}
                            className="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                            autoComplete="additional-name"
                            placeholder="Enter your middle name"
                            onChange={(e) =>
                                setData("middle_name", e.target.value)
                            }
                        />
                        <InputError
                            message={errors.middle_name}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="last_name"
                            value="Last Name"
                            className="text-gray-700 font-medium"
                        />
                        <TextInput
                            id="last_name"
                            name="last_name"
                            value={data.last_name}
                            className="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                            autoComplete="family-name"
                            placeholder="Enter your last name"
                            onChange={(e) =>
                                setData("last_name", e.target.value)
                            }
                            required
                        />
                        <InputError
                            message={errors.last_name}
                            className="mt-2"
                        />
                    </div>

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
                            placeholder="Enter your email"
                            onChange={(e) => setData("email", e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="text-gray-700 font-medium"
                        />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                            autoComplete="new-password"
                            placeholder="Create a password"
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            required
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
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                            autoComplete="new-password"
                            placeholder="Confirm your password"
                            onChange={(e) =>
                                setData("password_confirmation", e.target.value)
                            }
                            required
                        />
                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>

                    <div className="pt-2">
                        <PrimaryButton
                            className="w-full justify-center py-3 bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-500 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 text-sm font-medium"
                            disabled={processing}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Register
                        </PrimaryButton>
                    </div>

                    <div className="text-center">
                        <Link
                            href={route("login")}
                            className="text-sm text-primary hover:text-pink-500 transition-colors duration-200 font-medium"
                        >
                            Already have an account? Sign in
                        </Link>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}

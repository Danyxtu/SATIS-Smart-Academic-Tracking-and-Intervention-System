import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import ApplicationLogo from "@/Components/ApplicationLogo";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Shield, Lock } from "lucide-react";

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("password.confirm"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            {/* Header Section */}
            <div className="flex flex-col items-center mb-6">
                <Link href="/" className="group">
                    <div className="relative">
                        <div className="absolute -inset-3 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <ApplicationLogo className="h-24 w-24 relative drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
                    </div>
                </Link>
                <div className="mt-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h1 className="text-xl font-semibold text-gray-800 font-poppins">
                        Secure Area
                    </h1>
                </div>
            </div>

            <div className="mb-6 text-sm text-gray-600 text-center bg-amber-50 p-4 rounded-xl border border-amber-100">
                <Lock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                This is a secure area of the application. Please confirm your
                password before continuing.
            </div>

            <form onSubmit={submit}>
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
                        isFocused={true}
                        placeholder="Enter your password"
                        onChange={(e) => setData("password", e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-6 flex items-center justify-end">
                    <PrimaryButton
                        className="bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-500 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
                        disabled={processing}
                    >
                        Confirm
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}

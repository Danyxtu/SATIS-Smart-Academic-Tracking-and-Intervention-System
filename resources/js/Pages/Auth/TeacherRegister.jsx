import ApplicationLogo from "@/Components/ApplicationLogo";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Eye,
    EyeClosed,
    UserPlus,
    Sparkles,
    Building2,
    Upload,
    FileText,
    CheckCircle,
    ArrowLeft,
} from "lucide-react";
import { useState } from "react";

export default function TeacherRegister({ departments }) {
    const { data, setData, post, processing, errors, reset, progress } =
        useForm({
            first_name: "",
            last_name: "",
            email: "",
            department_id: "",
            password: "",
            password_confirmation: "",
            document: null,
        });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route("teacher.registration.store"), {
            forceFormData: true,
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setData("document", e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setData("document", e.target.files[0]);
        }
    };

    const removeFile = () => {
        setData("document", null);
    };

    return (
        <GuestLayout>
            <Head title="Teacher Registration" />

            <form onSubmit={submit}>
                {/* Logo and Header Section */}
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
                            Teacher Registration
                        </h1>
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1 text-center">
                        Register as a teacher to join SATIS
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Name Fields - Side by Side */}
                    <div className="grid grid-cols-2 gap-3">
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
                                className="mt-1 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                                autoComplete="given-name"
                                isFocused={true}
                                placeholder="First name"
                                onChange={(e) =>
                                    setData("first_name", e.target.value)
                                }
                            />
                            <InputError
                                message={errors.first_name}
                                className="mt-1 text-xs"
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
                                className="mt-1 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                                autoComplete="family-name"
                                placeholder="Last name"
                                onChange={(e) =>
                                    setData("last_name", e.target.value)
                                }
                            />
                            <InputError
                                message={errors.last_name}
                                className="mt-1 text-xs"
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div>
                        <InputLabel
                            htmlFor="email"
                            value="Email Address"
                            className="text-gray-700 font-medium"
                        />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                            autoComplete="email"
                            placeholder="Enter your email"
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        <InputError
                            message={errors.email}
                            className="mt-1 text-xs"
                        />
                    </div>

                    {/* Department Selection */}
                    <div>
                        <InputLabel
                            htmlFor="department_id"
                            value="Department"
                            className="text-gray-700 font-medium"
                        />
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                id="department_id"
                                name="department_id"
                                value={data.department_id}
                                onChange={(e) =>
                                    setData("department_id", e.target.value)
                                }
                                className="mt-1 block w-full pl-10 rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 transition-all duration-200"
                            >
                                <option value="">Select your department</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name} ({dept.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <InputError
                            message={errors.department_id}
                            className="mt-1 text-xs"
                        />
                    </div>

                    {/* Password Field */}
                    <div>
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
                                className="mt-1 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 pr-12 transition-all duration-200"
                                autoComplete="new-password"
                                placeholder="Create a password"
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
                            className="mt-1 text-xs"
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
                                className="mt-1 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary/30 pr-12 transition-all duration-200"
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
                        <InputError
                            message={errors.password_confirmation}
                            className="mt-1 text-xs"
                        />
                    </div>

                    {/* Document Upload */}
                    <div>
                        <InputLabel
                            htmlFor="document"
                            value="Supporting Document"
                            className="text-gray-700 font-medium"
                        />
                        <p className="text-xs text-gray-500 mt-0.5 mb-2">
                            Upload your teaching credentials, ID, or certificate
                            (PDF, DOC, JPG, PNG - Max 10MB)
                        </p>

                        {!data.document ? (
                            <div
                                className={`mt-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                                    dragActive
                                        ? "border-primary bg-primary/5"
                                        : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() =>
                                    document.getElementById("document").click()
                                }
                            >
                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">
                                    <span className="text-primary font-medium">
                                        Click to upload
                                    </span>{" "}
                                    or drag and drop
                                </p>
                                <input
                                    id="document"
                                    type="file"
                                    name="document"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <div className="mt-1 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-green-600" />
                                    <span className="text-sm text-green-700 truncate max-w-[200px]">
                                        {data.document.name}
                                    </span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                        <InputError
                            message={errors.document}
                            className="mt-1 text-xs"
                        />

                        {progress && (
                            <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${progress.percentage}%`,
                                        }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                    Uploading... {progress.percentage}%
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <PrimaryButton
                            className="w-full justify-center py-3 bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-500 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 text-sm font-medium"
                            disabled={processing}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            {processing
                                ? "Submitting..."
                                : "Submit Registration"}
                        </PrimaryButton>
                    </div>

                    {/* Info Box */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-xs text-blue-700 text-center">
                            Your registration will be reviewed by your
                            department admin. You will be notified once your
                            account is approved.
                        </p>
                    </div>

                    {/* Back to Login */}
                    <div className="text-center pt-2">
                        <Link
                            href={route("login")}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:text-pink-500 transition-colors duration-200 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}

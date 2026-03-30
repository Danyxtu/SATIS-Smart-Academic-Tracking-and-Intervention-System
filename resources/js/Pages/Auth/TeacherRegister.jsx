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
    ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";

const steps = [
    { id: 1, label: "Profile" },
    { id: 2, label: "Security" },
    { id: 3, label: "Document" },
];

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
    const [currentStep, setCurrentStep] = useState(1);
    const [stepErrors, setStepErrors] = useState({});

    const clearStepError = (field) => {
        setStepErrors((prev) => {
            if (!prev[field]) {
                return prev;
            }

            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const setFieldValue = (field, value) => {
        clearStepError(field);
        setData(field, value);
    };

    const validateCurrentStep = () => {
        const nextErrors = {};

        if (currentStep === 1) {
            if (!data.first_name.trim()) {
                nextErrors.first_name = "First name is required.";
            }

            if (!data.last_name.trim()) {
                nextErrors.last_name = "Last name is required.";
            }

            if (!data.email.trim()) {
                nextErrors.email = "Email is required.";
            }

            if (!data.department_id) {
                nextErrors.department_id = "Please select a department.";
            }
        }

        if (currentStep === 2) {
            if (!data.password) {
                nextErrors.password = "Password is required.";
            } else if (data.password.length < 8) {
                nextErrors.password = "Password must be at least 8 characters.";
            }

            if (!data.password_confirmation) {
                nextErrors.password_confirmation =
                    "Please confirm your password.";
            }

            if (
                data.password &&
                data.password_confirmation &&
                data.password !== data.password_confirmation
            ) {
                nextErrors.password_confirmation = "Passwords do not match.";
            }
        }

        if (currentStep === 3 && !data.document) {
            nextErrors.document = "Supporting document is required.";
        }

        setStepErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const goToNextStep = () => {
        if (!validateCurrentStep()) {
            return;
        }

        setCurrentStep((step) => Math.min(step + 1, steps.length));
    };

    const goToPreviousStep = () => {
        setCurrentStep((step) => Math.max(step - 1, 1));
    };

    useEffect(() => {
        if (!errors || Object.keys(errors).length === 0) {
            return;
        }

        if (
            errors.first_name ||
            errors.last_name ||
            errors.email ||
            errors.department_id
        ) {
            setCurrentStep(1);
            return;
        }

        if (errors.password || errors.password_confirmation) {
            setCurrentStep(2);
            return;
        }

        if (errors.document) {
            setCurrentStep(3);
        }
    }, [errors]);

    const submit = (e) => {
        e.preventDefault();

        if (currentStep < steps.length) {
            goToNextStep();
            return;
        }

        if (!validateCurrentStep()) {
            return;
        }

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
            setFieldValue("document", e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFieldValue("document", e.target.files[0]);
        }
    };

    const removeFile = () => {
        setFieldValue("document", null);
    };

    return (
        <GuestLayout cardClassName="max-w-sm px-4 py-4 sm:max-w-sm sm:px-5 sm:py-5 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto">
            <Head title="Teacher Registration" />

            <form onSubmit={submit}>
                {/* Logo and Header Section */}
                <div className="mb-3.5 flex flex-col items-center">
                    <Link href="/" className="group">
                        <div className="relative">
                            <div className="absolute -inset-2 rounded-full bg-primary/20 blur-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:-inset-3" />
                            <ApplicationLogo className="relative h-14 w-14 drop-shadow-md transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16" />
                        </div>
                    </Link>
                    <div className="mt-2.5 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <h1 className="font-poppins text-[15px] sm:text-base font-semibold text-gray-800">
                            Teacher Registration
                        </h1>
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="mt-1 text-center text-[11px] sm:text-xs text-gray-500">
                        Complete the steps to request access
                    </p>
                </div>

                <div className="mb-3.5">
                    <div className="mb-1.5 flex items-center justify-center">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div
                                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                                        currentStep >= step.id
                                            ? "border-primary bg-primary text-white"
                                            : "border-gray-300 bg-white text-gray-500"
                                    }`}
                                >
                                    {step.id}
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`mx-1.5 h-[2px] w-8 rounded sm:w-10 ${
                                            currentStep > step.id
                                                ? "bg-primary/70"
                                                : "bg-gray-200"
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-[11px] font-medium text-gray-500">
                        Step {currentStep} of {steps.length}:{" "}
                        {steps[currentStep - 1].label}
                    </p>
                </div>

                <div className="space-y-3">
                    {currentStep === 1 && (
                        <>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="first_name"
                                        value="First Name"
                                        className="text-xs font-semibold tracking-wide text-gray-700"
                                    />
                                    <TextInput
                                        id="first_name"
                                        name="first_name"
                                        value={data.first_name}
                                        className="mt-1 block h-10 w-full rounded-lg border-gray-200 px-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary focus:ring-primary/25"
                                        autoComplete="given-name"
                                        isFocused={true}
                                        placeholder="First name"
                                        onChange={(e) =>
                                            setFieldValue(
                                                "first_name",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors.first_name ||
                                            stepErrors.first_name
                                        }
                                        className="mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="last_name"
                                        value="Last Name"
                                        className="text-xs font-semibold tracking-wide text-gray-700"
                                    />
                                    <TextInput
                                        id="last_name"
                                        name="last_name"
                                        value={data.last_name}
                                        className="mt-1 block h-10 w-full rounded-lg border-gray-200 px-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary focus:ring-primary/25"
                                        autoComplete="family-name"
                                        placeholder="Last name"
                                        onChange={(e) =>
                                            setFieldValue(
                                                "last_name",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors.last_name ||
                                            stepErrors.last_name
                                        }
                                        className="mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="email"
                                    value="Email Address"
                                    className="text-xs font-semibold tracking-wide text-gray-700"
                                />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block h-10 w-full rounded-lg border-gray-200 px-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary focus:ring-primary/25"
                                    autoComplete="email"
                                    placeholder="Enter your email"
                                    onChange={(e) =>
                                        setFieldValue("email", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.email || stepErrors.email}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="department_id"
                                    value="Department"
                                    className="text-xs font-semibold tracking-wide text-gray-700"
                                />
                                <div className="relative">
                                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <select
                                        id="department_id"
                                        name="department_id"
                                        value={data.department_id}
                                        onChange={(e) =>
                                            setFieldValue(
                                                "department_id",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block h-10 w-full rounded-lg border-gray-200 pl-9 pr-3 text-sm shadow-sm focus:border-primary focus:ring-primary/25"
                                    >
                                        <option value="">
                                            Select your department
                                        </option>
                                        {(departments || []).map((dept) => (
                                            <option
                                                key={dept.id}
                                                value={dept.id}
                                            >
                                                {dept.department_name} (
                                                {dept.department_code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <InputError
                                    message={
                                        errors.department_id ||
                                        stepErrors.department_id
                                    }
                                    className="mt-1 text-xs"
                                />
                            </div>
                        </>
                    )}

                    {currentStep === 2 && (
                        <>
                            <div>
                                <InputLabel
                                    htmlFor="password"
                                    value="Password"
                                    className="text-xs font-semibold tracking-wide text-gray-700"
                                />
                                <div className="relative">
                                    <TextInput
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block h-10 w-full rounded-lg border-gray-200 px-3 pr-10 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary focus:ring-primary/25"
                                        autoComplete="new-password"
                                        placeholder="Create a password"
                                        onChange={(e) =>
                                            setFieldValue(
                                                "password",
                                                e.target.value,
                                            )
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
                                    message={
                                        errors.password || stepErrors.password
                                    }
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="password_confirmation"
                                    value="Confirm Password"
                                    className="text-xs font-semibold tracking-wide text-gray-700"
                                />
                                <div className="relative">
                                    <TextInput
                                        id="password_confirmation"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="mt-1 block h-10 w-full rounded-lg border-gray-200 px-3 pr-10 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary focus:ring-primary/25"
                                        autoComplete="new-password"
                                        placeholder="Confirm your password"
                                        onChange={(e) =>
                                            setFieldValue(
                                                "password_confirmation",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword,
                                            )
                                        }
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        {showConfirmPassword ? (
                                            <Eye className="h-4 w-4 text-primary" />
                                        ) : (
                                            <EyeClosed className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                <InputError
                                    message={
                                        errors.password_confirmation ||
                                        stepErrors.password_confirmation
                                    }
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <p className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 text-[11px] text-blue-700">
                                Use at least 8 characters and keep your password
                                private.
                            </p>
                        </>
                    )}

                    {currentStep === 3 && (
                        <>
                            <div>
                                <InputLabel
                                    htmlFor="document"
                                    value="Supporting Document"
                                    className="text-xs font-semibold tracking-wide text-gray-700"
                                />
                                <p className="mb-2 mt-0.5 text-[11px] text-gray-500">
                                    Upload teaching credentials, ID, or
                                    certificate (PDF, DOC, JPG, PNG - Max 10MB)
                                </p>

                                {!data.document ? (
                                    <div
                                        className={`mt-1 cursor-pointer rounded-lg border-2 border-dashed p-3 text-center transition-all duration-200 ${
                                            dragActive
                                                ? "border-primary bg-primary/5"
                                                : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
                                        }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() =>
                                            window.document
                                                .getElementById("document")
                                                ?.click()
                                        }
                                    >
                                        <Upload className="mx-auto mb-1.5 h-6 w-6 text-gray-400" />
                                        <p className="text-xs text-gray-600">
                                            <span className="font-medium text-primary">
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
                                    <div className="mt-1 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="h-4 w-4 text-green-600" />
                                            <span className="max-w-[170px] truncate text-xs text-green-700">
                                                {data.document.name}
                                            </span>
                                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            className="text-[11px] font-medium text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}

                                <InputError
                                    message={
                                        errors.document || stepErrors.document
                                    }
                                    className="mt-1 text-xs"
                                />

                                {progress && (
                                    <div className="mt-2">
                                        <div className="h-1.5 w-full rounded-full bg-gray-200">
                                            <div
                                                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                                style={{
                                                    width: `${progress.percentage}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <p className="mt-1 text-center text-[11px] text-gray-500">
                                            Uploading... {progress.percentage}%
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2">
                                <p className="text-center text-[11px] text-blue-700">
                                    Your registration is reviewed by your
                                    department admin. You will be notified after
                                    approval.
                                </p>
                            </div>
                        </>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1.5">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={goToPreviousStep}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-800"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back
                            </button>
                        ) : (
                            <Link
                                href={route("login")}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors duration-200 hover:text-pink-500"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Login
                            </Link>
                        )}

                        <PrimaryButton
                            className="justify-center rounded-lg bg-gradient-to-r from-primary to-pink-400 px-3 py-2 text-xs font-semibold tracking-wide shadow-md shadow-primary/20 transition-all duration-200 hover:from-primary/90 hover:to-pink-500"
                            disabled={processing}
                        >
                            {currentStep < steps.length ? (
                                <>
                                    Continue
                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                    {processing
                                        ? "Submitting..."
                                        : "Submit Registration"}
                                </>
                            )}
                        </PrimaryButton>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}

import { useEffect, useMemo, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    Check,
    Copy,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Info,
    Lock,
    Mail,
    RefreshCw,
    Save,
    Shield,
    UserPlus,
    Users,
    X,
} from "lucide-react";

const STEP_PROFILE = 1;
const STEP_SECURITY = 2;
const STEP_REVIEW = 3;

const STEPS = [
    {
        id: STEP_PROFILE,
        label: "Profile",
        icon: Users,
    },
    {
        id: STEP_SECURITY,
        label: "Security",
        icon: Lock,
    },
    {
        id: STEP_REVIEW,
        label: "Review",
        icon: CheckCircle,
    },
];

function WizardStep({ step, currentStep }) {
    const Icon = step.icon;
    const isActive = currentStep === step.id;
    const isDone = currentStep > step.id;

    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : isDone
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-50 text-slate-400"
            }`}
        >
            <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    isDone ? "bg-emerald-600 text-white" : "bg-white"
                }`}
            >
                {isDone ? <Check size={10} /> : step.id}
            </span>
            <Icon size={12} />
            <span>{step.label}</span>
        </div>
    );
}

function Field({ label, icon: Icon, required, optional, error, children }) {
    return (
        <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                {Icon && <Icon size={13} className="text-slate-400" />}
                {label}
                {required && <span className="text-rose-500">*</span>}
                {optional && (
                    <span className="text-slate-400 text-xs">(Optional)</span>
                )}
            </label>
            {children}
            {error && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <Info size={12} /> {error}
                </p>
            )}
        </div>
    );
}
// Helper for role config
const getRoleConfig = (role) => {
    if (role === "teacher") {
        return {
            label: "Teacher",
            icon: Shield,
        };
    }
    return {
        label: "Student",
        icon: Shield,
    };
};

export default function CreateUserModal({ open, onClose, departments }) {
    const [step, setStep] = useState(STEP_PROFILE);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [clientErrors, setClientErrors] = useState({});

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            first_name: "",
            last_name: "",
            middle_name: "",
            email: "",
            password: "",
            role: "student",
            assign_as_admin: false,
            department_id: "",
        });

    const isTeacher = data.role === "teacher";
    const selectedDepartment = useMemo(
        () =>
            isTeacher && data.department_id
                ? (departments?.find(
                      (dept) => String(dept.id) === String(data.department_id),
                  ) ?? null)
                : null,
        [isTeacher, data.department_id, departments],
    );

    const selectedAdmin = selectedDepartment?.department_admin ?? null;
    const selectedAdminName =
        selectedAdmin?.name ??
        [selectedAdmin?.first_name, selectedAdmin?.last_name]
            .filter(Boolean)
            .join(" ");

    const serverErrorList = useMemo(() => {
        if (!errors || typeof errors !== "object") {
            return [];
        }

        return Object.values(errors)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean);
    }, [errors]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setStep(STEP_PROFILE);
        setClientErrors({});
        setShowPassword(false);
        setCopied(false);
    }, [open]);

    const generatePassword = () => {
        const charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let pw = "";
        for (let i = 0; i < 12; i++)
            pw += charset.charAt(Math.floor(Math.random() * charset.length));
        setData("password", pw);
    };

    const copyPassword = () => {
        if (!data.password) {
            return;
        }

        navigator.clipboard.writeText(data.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const closeModal = () => {
        if (processing) {
            return;
        }

        reset();
        clearErrors();
        setClientErrors({});
        setShowPassword(false);
        setCopied(false);
        setStep(STEP_PROFILE);
        onClose?.();
    };

    const validateProfileStep = () => {
        const nextErrors = {};

        if (!String(data.first_name || "").trim()) {
            nextErrors.first_name = "First name is required.";
        }

        if (!String(data.last_name || "").trim()) {
            nextErrors.last_name = "Last name is required.";
        }

        if (!String(data.email || "").trim()) {
            nextErrors.email = "Email address is required.";
        }

        if (isTeacher && !String(data.department_id || "").trim()) {
            nextErrors.department_id = "Department is required for teachers.";
        }

        setClientErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateSecurityStep = () => {
        const nextErrors = {};

        if (!String(data.password || "").trim()) {
            nextErrors.password = "Password is required.";
        }

        setClientErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const goNext = () => {
        if (step === STEP_PROFILE && !validateProfileStep()) {
            return;
        }

        if (step === STEP_SECURITY && !validateSecurityStep()) {
            return;
        }

        setClientErrors({});
        setStep((prev) => Math.min(prev + 1, STEP_REVIEW));
    };

    const goBack = () => {
        if (step === STEP_PROFILE) {
            closeModal();
            return;
        }

        setStep((prev) => Math.max(prev - 1, STEP_PROFILE));
    };

    const handleCreate = () => {
        if (processing) {
            return;
        }

        const profileIsValid = validateProfileStep();
        const securityIsValid = validateSecurityStep();

        if (!profileIsValid) {
            setStep(STEP_PROFILE);
            return;
        }

        if (!securityIsValid) {
            setStep(STEP_SECURITY);
            return;
        }

        post(route("superadmin.users.store"), {
            onSuccess: () => {
                reset();
                clearErrors();
                setClientErrors({});
                setShowPassword(false);
                setCopied(false);
                setStep(STEP_PROFILE);
                onClose?.();
            },
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 pb-10 sm:items-center">
            <div
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                onClick={closeModal}
            />

            <div className="relative flex h-[calc(100vh-6rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
                <div className="relative shrink-0 overflow-hidden border-b border-emerald-100 bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5">
                    <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                    <button
                        type="button"
                        onClick={closeModal}
                        disabled={processing}
                        className="absolute right-3 top-3 rounded-lg p-1.5 text-emerald-100 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-60"
                    >
                        <X size={16} />
                    </button>

                    <div className="relative flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                            <UserPlus size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">
                                Create User Wizard
                            </h2>
                            <p className="text-xs text-emerald-100">
                                Step {step} of {STEPS.length}:{" "}
                                {STEPS[step - 1].label}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 border-b border-emerald-100 px-6 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {STEPS.map((wizardStep) => (
                            <WizardStep
                                key={wizardStep.id}
                                step={wizardStep}
                                currentStep={step}
                            />
                        ))}
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-emerald-50/40 px-6 py-5">
                    {step === STEP_PROFILE && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Role{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["teacher", "student"].map((role) => {
                                        const cfg = getRoleConfig(role);
                                        const Icon = cfg.icon;
                                        const active = data.role === role;

                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => {
                                                    setData("role", role);

                                                    if (role === "student") {
                                                        setData(
                                                            "department_id",
                                                            "",
                                                        );
                                                        setData(
                                                            "assign_as_admin",
                                                            false,
                                                        );
                                                    }
                                                }}
                                                className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                                                    active
                                                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                                        active
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-slate-300 text-slate-600"
                                                    }`}
                                                >
                                                    <Icon size={14} />
                                                </span>
                                                {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <Field
                                    label="First Name"
                                    icon={Shield}
                                    required
                                    error={
                                        errors.first_name ||
                                        clientErrors.first_name
                                    }
                                >
                                    <input
                                        type="text"
                                        value={data.first_name}
                                        onChange={(event) =>
                                            setData(
                                                "first_name",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="e.g., Juan"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                    />
                                </Field>

                                <Field
                                    label="Last Name"
                                    icon={Shield}
                                    required
                                    error={
                                        errors.last_name ||
                                        clientErrors.last_name
                                    }
                                >
                                    <input
                                        type="text"
                                        value={data.last_name}
                                        onChange={(event) =>
                                            setData(
                                                "last_name",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="e.g., Dela Cruz"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                    />
                                </Field>
                            </div>

                            <Field
                                label="Middle Name"
                                icon={Shield}
                                optional
                                error={errors.middle_name}
                            >
                                <input
                                    type="text"
                                    value={data.middle_name}
                                    onChange={(event) =>
                                        setData(
                                            "middle_name",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g., Rivera"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                />
                            </Field>

                            <Field
                                label="Email Address"
                                icon={Mail}
                                required
                                error={errors.email || clientErrors.email}
                            >
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(event) =>
                                        setData("email", event.target.value)
                                    }
                                    placeholder={
                                        isTeacher
                                            ? "teacher@school.edu"
                                            : "student@school.edu"
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                />
                            </Field>

                            {isTeacher && (
                                <Field
                                    label="Department"
                                    icon={Shield}
                                    required
                                    error={
                                        errors.department_id ||
                                        clientErrors.department_id
                                    }
                                >
                                    <select
                                        value={data.department_id}
                                        onChange={(event) => {
                                            setData(
                                                "department_id",
                                                event.target.value,
                                            );
                                            setData("assign_as_admin", false);
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                    >
                                        <option value="">
                                            Select a department
                                        </option>
                                        {departments?.map((department) => (
                                            <option
                                                key={department.id}
                                                value={department.id}
                                            >
                                                {department.department_name}
                                                {department.department_code
                                                    ? ` (${department.department_code})`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            )}

                            {isTeacher && data.department_id && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Department Admin
                                    </p>

                                    {selectedAdmin ? (
                                        <div className="mt-1.5 space-y-0.5">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {selectedAdminName ||
                                                    "Assigned admin"}
                                            </p>
                                            <p className="text-xs text-slate-600">
                                                {selectedAdmin.email ||
                                                    "No email provided"}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
                                            <p className="text-xs text-amber-800">
                                                No admin is currently assigned
                                                to the{" "}
                                                {
                                                    selectedDepartment?.department_name
                                                }{" "}
                                                department.
                                            </p>
                                            <label className="mt-2 flex cursor-pointer items-start gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        !!data.assign_as_admin
                                                    }
                                                    onChange={(event) =>
                                                        setData(
                                                            "assign_as_admin",
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="text-xs text-amber-900">
                                                    Assign this teacher as the
                                                    admin for this department.
                                                </span>
                                            </label>
                                            {errors.assign_as_admin && (
                                                <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                                                    <Info size={12} />
                                                    {errors.assign_as_admin}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === STEP_SECURITY && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <Field
                                label="Password"
                                icon={Lock}
                                required
                                error={errors.password || clientErrors.password}
                            >
                                <div className="relative">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={data.password}
                                        onChange={(event) =>
                                            setData(
                                                "password",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Enter or generate a password"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-28 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                    />

                                    <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                        >
                                            {showPassword ? (
                                                <EyeOff size={14} />
                                            ) : (
                                                <Eye size={14} />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={copyPassword}
                                            disabled={!data.password}
                                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={generatePassword}
                                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                    </div>
                                </div>

                                {copied && (
                                    <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
                                        <CheckCircle size={12} /> Copied to
                                        clipboard!
                                    </p>
                                )}
                            </Field>

                            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                                <Info
                                    size={15}
                                    className="mt-0.5 shrink-0 text-amber-600"
                                />
                                <p className="text-xs leading-relaxed text-amber-800">
                                    <span className="font-semibold">Note:</span>{" "}
                                    The user will be required to change their
                                    password on first login.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === STEP_REVIEW && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Review User Details
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Confirm account details before creating this
                                    user.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Role
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {data.role === "teacher"
                                            ? "Teacher"
                                            : "Student"}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Full Name
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {[
                                            data.first_name,
                                            data.middle_name,
                                            data.last_name,
                                        ]
                                            .filter(Boolean)
                                            .join(" ") || "-"}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Email
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        {data.email || "-"}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Password
                                    </p>
                                    <p className="text-sm font-semibold text-emerald-700">
                                        {data.password ? "Set" : "Not set"}
                                    </p>
                                </div>
                            </div>

                            {isTeacher && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Department
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        {selectedDepartment
                                            ? `${selectedDepartment.department_name}${selectedDepartment.department_code ? ` (${selectedDepartment.department_code})` : ""}`
                                            : "None"}
                                    </p>

                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Admin:{" "}
                                        {selectedAdminName ||
                                            (data.assign_as_admin
                                                ? "Assign this teacher as admin"
                                                : "None")}
                                    </p>
                                </div>
                            )}

                            {serverErrorList.length > 0 && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                                        Validation Errors
                                    </p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
                                        {serverErrorList.map((error, index) => (
                                            <li key={`${error}-${index}`}>
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="shrink-0 flex items-center justify-between border-t border-emerald-100 bg-white px-6 py-4">
                    <button
                        type="button"
                        onClick={goBack}
                        disabled={processing}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                    >
                        <ChevronLeft size={13} />
                        {step === STEP_PROFILE ? "Cancel" : "Back"}
                    </button>

                    {step < STEP_REVIEW ? (
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={processing}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                        >
                            Next
                            <ChevronRight size={13} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                        >
                            <Save size={13} />
                            {processing ? "Creating..." : "Create User"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

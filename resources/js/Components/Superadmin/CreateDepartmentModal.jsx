import { useEffect, useMemo, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    Building2,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    FileText,
    Hash,
    ListChecks,
    Plus,
    Save,
    Search,
    Shield,
    Sparkles,
    Users,
    X,
} from "lucide-react";

const STEP_DETAILS = 1;
const STEP_SPECIALIZATIONS = 2;
const STEP_ASSIGNMENTS = 3;
const STEP_REVIEW = 4;

const STEPS = [
    {
        id: STEP_DETAILS,
        label: "Department Info",
        icon: Building2,
    },
    {
        id: STEP_SPECIALIZATIONS,
        label: "Specializations",
        icon: Sparkles,
    },
    {
        id: STEP_ASSIGNMENTS,
        label: "Assign Members",
        icon: Users,
    },
    {
        id: STEP_REVIEW,
        label: "Review",
        icon: ListChecks,
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

function FieldError({ error }) {
    if (!error) {
        return null;
    }

    return <p className="mt-1.5 text-xs text-rose-600">{error}</p>;
}

function normalizeTrackOptions(trackOptions = []) {
    if (!Array.isArray(trackOptions) || trackOptions.length === 0) {
        return [];
    }

    return trackOptions
        .map((option) => {
            if (typeof option === "string") {
                return {
                    value: option,
                    label: option,
                };
            }

            if (option && typeof option === "object") {
                const value =
                    option.value || option.key || option.label || option.name;

                if (!value) {
                    return null;
                }

                return {
                    value,
                    label: option.label || option.name || value,
                };
            }

            return null;
        })
        .filter(Boolean);
}

function teacherName(teacher) {
    if (!teacher || typeof teacher !== "object") {
        return "Unnamed teacher";
    }

    if (teacher.name) {
        return teacher.name;
    }

    return (
        [teacher.first_name, teacher.middle_name, teacher.last_name]
            .filter(Boolean)
            .join(" ") || "Unnamed teacher"
    );
}

function teacherEmail(teacher) {
    if (!teacher || typeof teacher !== "object") {
        return "No email";
    }

    return teacher.email || teacher.personal_email || "No email";
}

export default function CreateDepartmentModal({
    isOpen,
    onClose,
    onSuccess,
    trackOptions = [],
    initialTrack = "",
}) {
    const [step, setStep] = useState(STEP_DETAILS);
    const [specializationInput, setSpecializationInput] = useState("");
    const [teachers, setTeachers] = useState([]);
    const [teachersLoaded, setTeachersLoaded] = useState(false);
    const [teachersLoading, setTeachersLoading] = useState(false);
    const [teacherSearch, setTeacherSearch] = useState("");
    const [clientErrors, setClientErrors] = useState({});

    const resolvedTrackOptions = useMemo(
        () => normalizeTrackOptions(trackOptions),
        [trackOptions],
    );

    const resolvedInitialTrack = useMemo(() => {
        if (
            resolvedTrackOptions.some((option) => option.value === initialTrack)
        ) {
            return initialTrack;
        }

        return resolvedTrackOptions[0]?.value || "";
    }, [resolvedTrackOptions, initialTrack]);

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        department_name: "",
        department_code: "",
        school_track_id: "",
        description: "",
        is_active: true,
        specialization_names: [],
        teacher_ids: [],
        admin_id: "",
    });

    const specializationErrors = useMemo(
        () =>
            Object.entries(errors)
                .filter(
                    ([key]) =>
                        key === "specialization_names" ||
                        key.startsWith("specialization_names."),
                )
                .flatMap(([, value]) =>
                    Array.isArray(value) ? value : [value],
                )
                .filter(Boolean),
        [errors],
    );

    const filteredTeachers = useMemo(() => {
        const query = teacherSearch.trim().toLowerCase();

        if (!query) {
            return teachers;
        }

        return teachers.filter((teacher) => {
            const text = `${teacherName(teacher)} ${teacherEmail(teacher)}`
                .trim()
                .toLowerCase();

            return text.includes(query);
        });
    }, [teachers, teacherSearch]);

    const selectedTeachers = useMemo(
        () =>
            teachers.filter((teacher) =>
                (data.teacher_ids || []).some(
                    (id) => String(id) === String(teacher.id),
                ),
            ),
        [teachers, data.teacher_ids],
    );

    const selectedAdmin = useMemo(
        () =>
            teachers.find(
                (teacher) => String(teacher.id) === String(data.admin_id),
            ) || null,
        [teachers, data.admin_id],
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setStep(STEP_DETAILS);
        setSpecializationInput("");
        setTeachers([]);
        setTeachersLoaded(false);
        setTeachersLoading(false);
        setTeacherSearch("");
        setClientErrors({});
        clearErrors();

        setData("department_name", "");
        setData("department_code", "");
        setData("school_track_id", resolvedInitialTrack);
        setData("description", "");
        setData("is_active", true);
        setData("specialization_names", []);
        setData("teacher_ids", []);
        setData("admin_id", "");
    }, [isOpen, clearErrors, setData, resolvedInitialTrack]);

    useEffect(() => {
        if (
            !isOpen ||
            step !== STEP_ASSIGNMENTS ||
            teachersLoaded ||
            teachersLoading
        ) {
            return;
        }

        const loadTeachers = async () => {
            setTeachersLoading(true);

            try {
                const response = await fetch(
                    route("superadmin.departments.unassigned-teachers"),
                );
                const payload = await response.json();

                setTeachers(Array.isArray(payload) ? payload : []);
            } catch {
                setTeachers([]);
            } finally {
                setTeachersLoaded(true);
                setTeachersLoading(false);
            }
        };

        loadTeachers();
    }, [isOpen, step, teachersLoaded, teachersLoading]);

    useEffect(() => {
        if (!isOpen || !errors || typeof errors !== "object") {
            return;
        }

        const errorKeys = Object.keys(errors);

        if (
            errorKeys.some(
                (key) =>
                    key === "department_name" ||
                    key === "department_code" ||
                    key === "school_track_id" ||
                    key === "description",
            )
        ) {
            setStep(STEP_DETAILS);
            return;
        }

        if (
            errorKeys.some(
                (key) =>
                    key === "specialization_names" ||
                    key.startsWith("specialization_names."),
            )
        ) {
            setStep(STEP_SPECIALIZATIONS);
            return;
        }

        if (
            errorKeys.some((key) => key === "teacher_ids" || key === "admin_id")
        ) {
            setStep(STEP_ASSIGNMENTS);
        }
    }, [isOpen, errors]);

    if (!isOpen) {
        return null;
    }

    const closeModal = () => {
        if (processing) {
            return;
        }

        clearErrors();
        setClientErrors({});
        setSpecializationInput("");
        onClose?.();
    };

    const addSpecialization = () => {
        const next = specializationInput.trim();

        if (!next) {
            return;
        }

        const exists = (data.specialization_names || []).some(
            (item) => item.toLowerCase() === next.toLowerCase(),
        );

        if (exists) {
            setSpecializationInput("");
            return;
        }

        setData("specialization_names", [
            ...(data.specialization_names || []),
            next,
        ]);
        setSpecializationInput("");
    };

    const removeSpecialization = (value) => {
        setData(
            "specialization_names",
            (data.specialization_names || []).filter((item) => item !== value),
        );
    };

    const toggleTeacher = (teacherId) => {
        const teacherKey = String(teacherId);
        const currentTeacherIds = data.teacher_ids || [];
        const nextTeacherIds = currentTeacherIds.some(
            (id) => String(id) === teacherKey,
        )
            ? currentTeacherIds.filter((id) => String(id) !== teacherKey)
            : [...currentTeacherIds, teacherId];

        setData("teacher_ids", nextTeacherIds);

        const adminStillSelected = nextTeacherIds.some(
            (id) => String(id) === String(data.admin_id),
        );

        if (!adminStillSelected) {
            setData("admin_id", "");
        }
    };

    const validateStepOne = () => {
        const nextClientErrors = {};

        if (!data.department_name.trim()) {
            nextClientErrors.department_name = "Department name is required.";
        }

        if (!data.department_code.trim()) {
            nextClientErrors.department_code = "Department code is required.";
        }

        if (!String(data.school_track_id || "").trim()) {
            nextClientErrors.school_track_id = "School track is required.";
        }

        setClientErrors(nextClientErrors);

        return Object.keys(nextClientErrors).length === 0;
    };

    const goNext = () => {
        if (step === STEP_DETAILS && !validateStepOne()) {
            return;
        }

        setClientErrors({});
        setStep((prev) => Math.min(prev + 1, STEP_REVIEW));
    };

    const goBack = () => {
        if (step === STEP_DETAILS) {
            closeModal();
            return;
        }

        setStep((prev) => Math.max(prev - 1, STEP_DETAILS));
    };

    const handleSubmit = () => {
        if (processing) {
            return;
        }

        if (!validateStepOne()) {
            setStep(STEP_DETAILS);
            return;
        }

        post(route("superadmin.departments.store"), {
            preserveScroll: true,
            onSuccess: () => {
                setClientErrors({});
                setSpecializationInput("");
                onSuccess?.();
                onClose?.();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 pb-10 sm:items-center">
            <div
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                onClick={closeModal}
            />

            <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
                <div className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5">
                    <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                    <button
                        type="button"
                        onClick={closeModal}
                        disabled={processing}
                        className="absolute right-3 top-3 rounded-lg p-1.5 text-emerald-100 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-60"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                            <Building2 size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">
                                Create Department Wizard
                            </h2>
                            <p className="text-xs text-emerald-100">
                                Step {step} of {STEPS.length}:{" "}
                                {STEPS[step - 1].label}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-b border-emerald-100 px-6 py-3">
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

                <div className="max-h-[64vh] overflow-y-auto bg-emerald-50/40 px-6 py-5">
                    {step === STEP_DETAILS && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <div>
                                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Building2
                                        size={13}
                                        className="text-slate-400"
                                    />
                                    Department Name
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.department_name}
                                    onChange={(event) =>
                                        setData(
                                            "department_name",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g., Information and Communications Technology"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                />
                                <FieldError
                                    error={
                                        errors.department_name ||
                                        clientErrors.department_name
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <Hash
                                            size={13}
                                            className="text-slate-400"
                                        />
                                        Department Code
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.department_code}
                                        onChange={(event) =>
                                            setData(
                                                "department_code",
                                                event.target.value.toUpperCase(),
                                            )
                                        }
                                        placeholder="e.g., ICT"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                    />
                                    <FieldError
                                        error={
                                            errors.department_code ||
                                            clientErrors.department_code
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                                        Track
                                    </label>
                                    <select
                                        value={data.school_track_id}
                                        onChange={(event) =>
                                            setData(
                                                "school_track_id",
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                    >
                                        {resolvedTrackOptions.length === 0 && (
                                            <option value="">
                                                No tracks available
                                            </option>
                                        )}
                                        {resolvedTrackOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError
                                        error={
                                            errors.school_track_id ||
                                            clientErrors.school_track_id
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <FileText
                                        size={13}
                                        className="text-slate-400"
                                    />
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.description}
                                    onChange={(event) =>
                                        setData(
                                            "description",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Brief description of the department..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                />
                                <FieldError error={errors.description} />
                            </div>

                            <label className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">
                                        Active Department
                                    </p>
                                    <p className="text-xs text-emerald-700">
                                        Toggle to set default activation status.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={Boolean(data.is_active)}
                                    onChange={(event) =>
                                        setData(
                                            "is_active",
                                            event.target.checked,
                                        )
                                    }
                                    className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                />
                            </label>
                        </div>
                    )}

                    {step === STEP_SPECIALIZATIONS && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Add Department Specializations
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Add strand or specialization names to group
                                    this department offerings.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={specializationInput}
                                    onChange={(event) =>
                                        setSpecializationInput(
                                            event.target.value,
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            addSpecialization();
                                        }
                                    }}
                                    placeholder="Add specialization"
                                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                />
                                <button
                                    type="button"
                                    onClick={addSpecialization}
                                    className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                                >
                                    <Plus size={12} />
                                    Add
                                </button>
                            </div>

                            {(data.specialization_names || []).length === 0 ? (
                                <p className="text-xs text-slate-500">
                                    No specializations added yet.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {(data.specialization_names || []).map(
                                        (item) => (
                                            <span
                                                key={item}
                                                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                                            >
                                                {item}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeSpecialization(
                                                            item,
                                                        )
                                                    }
                                                    className="text-emerald-700"
                                                >
                                                    <X size={11} />
                                                </button>
                                            </span>
                                        ),
                                    )}
                                </div>
                            )}

                            {specializationErrors.length > 0 && (
                                <div className="space-y-0.5">
                                    {specializationErrors.map(
                                        (message, index) => (
                                            <p
                                                key={`${message}-${index}`}
                                                className="text-xs text-rose-600"
                                            >
                                                {message}
                                            </p>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === STEP_ASSIGNMENTS && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Assign Teacher and/or Admin
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Select teachers for this department. You can
                                    optionally choose one selected teacher as
                                    admin.
                                </p>
                            </div>

                            <div className="relative">
                                <Search
                                    size={14}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    value={teacherSearch}
                                    onChange={(event) =>
                                        setTeacherSearch(event.target.value)
                                    }
                                    placeholder="Search teacher name or email"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                />
                            </div>

                            <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                {teachersLoading ? (
                                    <p className="text-xs text-slate-500">
                                        Loading available teachers...
                                    </p>
                                ) : filteredTeachers.length === 0 ? (
                                    <p className="text-xs text-slate-500">
                                        No available teacher found.
                                    </p>
                                ) : (
                                    filteredTeachers.map((teacher) => {
                                        const isSelected = (
                                            data.teacher_ids || []
                                        ).some(
                                            (id) =>
                                                String(id) ===
                                                String(teacher.id),
                                        );
                                        const isAdmin =
                                            String(data.admin_id) ===
                                            String(teacher.id);

                                        return (
                                            <label
                                                key={teacher.id}
                                                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() =>
                                                        toggleTeacher(
                                                            teacher.id,
                                                        )
                                                    }
                                                    className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-slate-800">
                                                        {teacherName(teacher)}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500">
                                                        {teacherEmail(teacher)}
                                                    </p>
                                                </div>
                                                {isAdmin && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                                        <Shield size={10} />
                                                        Admin
                                                    </span>
                                                )}
                                            </label>
                                        );
                                    })
                                )}
                            </div>

                            <FieldError error={errors.teacher_ids} />

                            <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-3">
                                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700">
                                    Department Admin (Optional)
                                </p>

                                {selectedTeachers.length === 0 ? (
                                    <p className="text-xs text-violet-700">
                                        Select at least one teacher first to
                                        assign an admin.
                                    </p>
                                ) : (
                                    <select
                                        value={data.admin_id}
                                        onChange={(event) =>
                                            setData(
                                                "admin_id",
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:ring-violet-500"
                                    >
                                        <option value="">- No admin -</option>
                                        {selectedTeachers.map((teacher) => (
                                            <option
                                                key={teacher.id}
                                                value={teacher.id}
                                            >
                                                {teacherName(teacher)}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <FieldError error={errors.admin_id} />
                            </div>
                        </div>
                    )}

                    {step === STEP_REVIEW && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Review Department Details
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Confirm the details before creating the new
                                    department.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Name
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {data.department_name || "-"}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Code
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {data.department_code || "-"}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Track
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {resolvedTrackOptions.find(
                                            (option) =>
                                                String(option.value) ===
                                                String(data.school_track_id),
                                        )?.label || "-"}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Status
                                    </p>
                                    <p className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                                        <CheckCircle2 size={14} />
                                        {data.is_active ? "Active" : "Inactive"}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Description
                                </p>
                                <p className="text-sm text-slate-700">
                                    {data.description || "No description"}
                                </p>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Specializations
                                </p>
                                {(data.specialization_names || []).length ===
                                0 ? (
                                    <p className="text-sm text-slate-500">
                                        None
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-700">
                                        {(data.specialization_names || []).join(
                                            ", ",
                                        )}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Assigned Teachers
                                </p>
                                {selectedTeachers.length === 0 ? (
                                    <p className="text-sm text-slate-500">
                                        None
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-700">
                                        {selectedTeachers
                                            .map((teacher) =>
                                                teacherName(teacher),
                                            )
                                            .join(", ")}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Assigned Admin
                                </p>
                                <p className="text-sm text-slate-700">
                                    {selectedAdmin
                                        ? teacherName(selectedAdmin)
                                        : "None"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-emerald-100 bg-white px-6 py-4">
                    <button
                        type="button"
                        onClick={goBack}
                        disabled={processing}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                    >
                        <ChevronLeft size={13} />
                        {step === STEP_DETAILS ? "Cancel" : "Back"}
                    </button>

                    {step < STEP_REVIEW ? (
                        <button
                            type="button"
                            onClick={goNext}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                        >
                            Next
                            <ChevronRight size={13} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                        >
                            <Save size={13} />
                            {processing ? "Creating..." : "Create Department"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

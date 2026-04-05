import { useForm, router } from "@inertiajs/react";
import {
    X,
    Building2,
    Hash,
    FileText,
    Info,
    Save,
    CheckCircle,
    Users,
    Search,
    ChevronRight,
    ChevronLeft,
    UserCog,
    UserPlus,
    Shield,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const STEPS = ["Department Info", "Add Teachers", "Confirmation"];

function StepIndicator({ current }) {
    return (
        <div className="flex items-center justify-center gap-0 px-6 pt-5 pb-4">
            {STEPS.map((label, i) => (
                <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                i < current
                                    ? "bg-blue-600 text-white"
                                    : i === current
                                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                      : "bg-slate-100 text-slate-400"
                            }`}
                        >
                            {i < current ? <CheckCircle size={14} /> : i + 1}
                        </div>
                        <span
                            className={`text-[10px] font-semibold whitespace-nowrap ${i === current ? "text-blue-600" : "text-slate-400"}`}
                        >
                            {label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div
                            className={`h-0.5 w-12 mx-1 mb-4 transition-all ${i < current ? "bg-blue-600" : "bg-slate-200"}`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

function FieldError({ error }) {
    if (!error) return null;
    return (
        <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
            <Info size={12} /> {error}
        </p>
    );
}

export default function CreateDepartmentModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(0);
    const [teachers, setTeachers] = useState([]);
    const [teacherSearch, setTeacherSearch] = useState("");
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            department_name: "",
            department_code: "",
            description: "",
            is_active: true,
            teacher_ids: [],
            admin_id: "",
        });

    useEffect(() => {
        if (isOpen && step === 1 && teachers.length === 0) {
            setLoadingTeachers(true);
            fetch(route("superadmin.departments.unassigned-teachers"))
                .then((r) => r.json())
                .then((d) => setTeachers(d))
                .finally(() => setLoadingTeachers(false));
        }
    }, [isOpen, step]);

    const handleClose = () => {
        clearErrors();
        reset();
        setStep(0);
        setTeachers([]);
        setTeacherSearch("");
        onClose();
    };

    const handleNext = () => {
        if (step === 0) {
            if (!data.department_name.trim() || !data.department_code.trim()) {
                // trigger inline errors manually
                if (!data.department_name.trim())
                    document.getElementById("dept-name-input")?.focus();
                return;
            }
        }
        setStep((s) => s + 1);
    };

    const handleSubmit = () => {
        post(route("superadmin.departments.store"), {
            preserveScroll: true,
            onSuccess: () => {
                handleClose();
                onSuccess?.();
            },
        });
    };

    const toggleTeacher = (id) => {
        setData(
            "teacher_ids",
            data.teacher_ids.includes(id)
                ? data.teacher_ids.filter((t) => t !== id)
                : [...data.teacher_ids, id],
        );
        // clear admin if deselected
        if (data.admin_id === String(id)) setData("admin_id", "");
    };

    const filteredTeachers = useMemo(
        () =>
            teachers.filter((t) => {
                const full =
                    `${t.first_name} ${t.middle_name ?? ""} ${t.last_name} ${t.email}`.toLowerCase();
                return full.includes(teacherSearch.toLowerCase());
            }),
        [teachers, teacherSearch],
    );

    const selectedTeachers = teachers.filter((t) =>
        data.teacher_ids.includes(t.id),
    );

    const adminTeacher = teachers.find(
        (t) => String(t.id) === String(data.admin_id),
    );

    const goToCreateTeacher = () => {
        handleClose();
        router.visit(route("superadmin.users.index"), {
            data: { openCreate: "teacher" },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                            className="absolute top-3 right-3 z-10 rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <X size={18} />
                        </button>
                        <div className="relative flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Create Department
                                </h2>
                                <p className="text-xs text-blue-100 mt-0.5">
                                    {STEPS[step]}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step indicator */}
                    <StepIndicator current={step} />

                    {/* Step content */}
                    <div className="px-6 pb-2 max-h-[52vh] overflow-y-auto space-y-4">
                        {/* ── Step 0: Department Info ── */}
                        {step === 0 && (
                            <>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                                        <Building2
                                            size={13}
                                            className="text-slate-400"
                                        />
                                        Department Name
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="dept-name-input"
                                        type="text"
                                        value={data.department_name}
                                        onChange={(e) =>
                                            setData(
                                                "department_name",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g., Information and Communications Technology"
                                        className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${errors.department_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    <FieldError
                                        error={errors.department_name}
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
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
                                        onChange={(e) =>
                                            setData(
                                                "department_code",
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        placeholder="e.g., ICT"
                                        className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${errors.department_code ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    <FieldError
                                        error={errors.department_code}
                                    />
                                    <p className="mt-1 text-xs text-slate-400">
                                        Short unique identifier (e.g., ICT,
                                        STEM, ABM)
                                    </p>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                                        <FileText
                                            size={13}
                                            className="text-slate-400"
                                        />
                                        Description
                                        <span className="text-slate-400 text-xs">
                                            (Optional)
                                        </span>
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                "description",
                                                e.target.value,
                                            )
                                        }
                                        rows={3}
                                        placeholder="Brief description of the department..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors resize-none"
                                    />
                                </div>

                                <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${data.is_active ? "bg-emerald-100" : "bg-slate-200"}`}
                                            >
                                                <CheckCircle
                                                    size={18}
                                                    className={
                                                        data.is_active
                                                            ? "text-emerald-600"
                                                            : "text-slate-400"
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm">
                                                    Active Department
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Enable or disable this
                                                    department
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.is_active}
                                                onChange={(e) =>
                                                    setData(
                                                        "is_active",
                                                        e.target.checked,
                                                    )
                                                }
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── Step 1: Add Teachers ── */}
                        {step === 1 && (
                            <>
                                <p className="text-xs text-slate-500">
                                    Select teachers with no department assigned.
                                    You can also designate one as the department
                                    admin.
                                </p>

                                {/* Search */}
                                <div className="relative">
                                    <Search
                                        size={14}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search teachers..."
                                        value={teacherSearch}
                                        onChange={(e) =>
                                            setTeacherSearch(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                                    />
                                </div>

                                {loadingTeachers ? (
                                    <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                                        Loading teachers...
                                    </div>
                                ) : teachers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <Users
                                                size={22}
                                                className="text-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">
                                                No unassigned teachers
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                All teachers are already in a
                                                department.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={goToCreateTeacher}
                                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                                        >
                                            <UserPlus size={13} />
                                            Create a Teacher
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Teacher list */}
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                            {filteredTeachers.length === 0 ? (
                                                <p className="text-center text-xs text-slate-400 py-4">
                                                    No teachers match your
                                                    search.
                                                </p>
                                            ) : (
                                                filteredTeachers.map((t) => {
                                                    const checked =
                                                        data.teacher_ids.includes(
                                                            t.id,
                                                        );
                                                    return (
                                                        <label
                                                            key={t.id}
                                                            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${checked ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    checked
                                                                }
                                                                onChange={() =>
                                                                    toggleTeacher(
                                                                        t.id,
                                                                    )
                                                                }
                                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                                                                {
                                                                    t
                                                                        .first_name[0]
                                                                }
                                                                {t.last_name[0]}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-slate-800 truncate">
                                                                    {
                                                                        t.first_name
                                                                    }{" "}
                                                                    {t.middle_name
                                                                        ? t.middle_name +
                                                                          " "
                                                                        : ""}
                                                                    {
                                                                        t.last_name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-slate-400 truncate">
                                                                    {t.email}
                                                                </p>
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* Assign admin — only show if teachers selected */}
                                        {selectedTeachers.length > 0 && (
                                            <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 space-y-2">
                                                <p className="flex items-center gap-2 text-xs font-semibold text-violet-700">
                                                    <UserCog size={13} />
                                                    Assign Department Admin
                                                    <span className="font-normal text-violet-500">
                                                        (Optional)
                                                    </span>
                                                </p>
                                                <select
                                                    value={data.admin_id}
                                                    onChange={(e) =>
                                                        setData(
                                                            "admin_id",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500 transition-colors"
                                                >
                                                    <option value="">
                                                        — No admin —
                                                    </option>
                                                    {selectedTeachers.map(
                                                        (t) => (
                                                            <option
                                                                key={t.id}
                                                                value={t.id}
                                                            >
                                                                {t.first_name}{" "}
                                                                {t.last_name}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                        )}

                                        {/* Create teacher shortcut */}
                                        <button
                                            type="button"
                                            onClick={goToCreateTeacher}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                                        >
                                            <UserPlus size={13} />
                                            Create a new teacher instead
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {/* ── Step 2: Confirmation ── */}
                        {step === 2 && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">
                                    Review the department details before
                                    creating.
                                </p>

                                {/* Dept info summary */}
                                <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-100">
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                            <Building2 size={12} /> Name
                                        </span>
                                        <span className="text-sm font-semibold text-slate-800">
                                            {data.department_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                            <Hash size={12} /> Code
                                        </span>
                                        <span className="inline-flex items-center rounded-lg bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                                            {data.department_code}
                                        </span>
                                    </div>
                                    {data.description && (
                                        <div className="px-4 py-2.5">
                                            <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                                                <FileText size={12} />{" "}
                                                Description
                                            </span>
                                            <p className="text-sm text-slate-700">
                                                {data.description}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-xs text-slate-500">
                                            Status
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${data.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
                                        >
                                            <div
                                                className={`h-1.5 w-1.5 rounded-full ${data.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                                            />
                                            {data.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </div>
                                </div>

                                {/* Teachers summary */}
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-2">
                                        <Users size={12} /> Teachers (
                                        {selectedTeachers.length})
                                    </p>
                                    {selectedTeachers.length === 0 ? (
                                        <p className="text-xs text-slate-400">
                                            No teachers assigned.
                                        </p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {selectedTeachers.map((t) => (
                                                <div
                                                    key={t.id}
                                                    className="flex items-center gap-2"
                                                >
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold">
                                                        {t.first_name[0]}
                                                        {t.last_name[0]}
                                                    </div>
                                                    <span className="text-sm text-slate-700">
                                                        {t.first_name}{" "}
                                                        {t.last_name}
                                                    </span>
                                                    {String(t.id) ===
                                                        String(
                                                            data.admin_id,
                                                        ) && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                                            <Shield size={9} />{" "}
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {adminTeacher && (
                                    <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 flex items-center gap-2">
                                        <UserCog
                                            size={14}
                                            className="text-violet-600 shrink-0"
                                        />
                                        <p className="text-xs text-violet-800">
                                            <span className="font-semibold">
                                                {adminTeacher.first_name}{" "}
                                                {adminTeacher.last_name}
                                            </span>{" "}
                                            will be assigned as department
                                            admin.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 mt-4 bg-slate-50/50 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={
                                step === 0
                                    ? handleClose
                                    : () => setStep((s) => s - 1)
                            }
                            disabled={processing}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {step > 0 && <ChevronLeft size={15} />}
                            {step === 0 ? "Cancel" : "Back"}
                        </button>

                        {step < 2 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={
                                    step === 0 &&
                                    (!data.department_name.trim() ||
                                        !data.department_code.trim())
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight size={15} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {processing ? (
                                    <>
                                        <svg
                                            className="animate-spin h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"
                                            />
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save size={14} />
                                        Create Department
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

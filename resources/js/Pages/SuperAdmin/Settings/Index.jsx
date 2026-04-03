import { Head, useForm, router } from "@inertiajs/react";
import axios from "axios";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import { useState } from "react";
import {
    Settings,
    Save,
    Calendar,
    GraduationCap,
    Info,
    School,
    MapPin,
    CheckCircle,
    Sparkles,
    BookOpen,
    AlertCircle,
    Zap,
    RotateCcw,
    AlertTriangle,
    X,
    Trash2,
} from "lucide-react";

function NewSchoolYearModal({ currentSY, onClose }) {
    const [newSY, setNewSY] = useState("");
    const [confirm, setConfirm] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [progressStep, setProgressStep] = useState("idle");
    const [progressPercent, setProgressPercent] = useState(0);

    const parseSchoolYear = (value) => {
        const match = String(value || "")
            .trim()
            .match(/^(\d{4})-(\d{4})$/);
        if (!match) {
            return null;
        }

        return {
            startYear: Number(match[1]),
            endYear: Number(match[2]),
        };
    };

    const parsedCurrentSY = parseSchoolYear(currentSY);
    const expectedNextSY = parsedCurrentSY
        ? `${parsedCurrentSY.startYear + 1}-${parsedCurrentSY.endYear + 1}`
        : "";
    const suggestedSY =
        expectedNextSY ||
        `${new Date().getFullYear() + 1}-${new Date().getFullYear() + 2}`;

    const trimmedNewSY = newSY.trim();
    const trimmedConfirm = confirm.trim();
    const parsedNewSY = parseSchoolYear(trimmedNewSY);

    const hasValidFormat = Boolean(parsedNewSY);
    const hasConsecutiveYears =
        Boolean(parsedNewSY) &&
        parsedNewSY.endYear === parsedNewSY.startYear + 1;
    const matchesExpectedNext =
        expectedNextSY.length === 0 || trimmedNewSY === expectedNextSY;
    const hasMatchingConfirmation =
        trimmedNewSY.length > 0 && trimmedConfirm === trimmedNewSY;

    const validationMessage = !trimmedNewSY
        ? "Enter a school year in YYYY-YYYY format."
        : !hasValidFormat
          ? "School year must follow YYYY-YYYY format."
          : !hasConsecutiveYears
            ? "School year must be consecutive (e.g., 2026-2027)."
            : !matchesExpectedNext
              ? `Next school year must be ${expectedNextSY}.`
              : !hasMatchingConfirmation
                ? "Confirmation must exactly match the new school year."
                : "";

    const isValid =
        hasValidFormat &&
        hasConsecutiveYears &&
        matchesExpectedNext &&
        hasMatchingConfirmation;

    const isArchiving = submitting && progressStep === "archiving";
    const isCreating = submitting && progressStep === "creating";

    const getFirstErrorMessage = (errorsBag, fallbackMessage) => {
        if (!errorsBag || typeof errorsBag !== "object") {
            return fallbackMessage;
        }

        const firstEntry = Object.values(errorsBag)[0];
        if (Array.isArray(firstEntry) && firstEntry.length > 0) {
            return String(firstEntry[0]);
        }

        if (typeof firstEntry === "string") {
            return firstEntry;
        }

        return fallbackMessage;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) {
            setError(validationMessage || "Please fix validation errors.");
            return;
        }

        setError("");
        setSubmitting(true);
        setProgressStep("archiving");
        setProgressPercent(35);

        try {
            const archiveResponse = await axios.post(
                route("superadmin.settings.archive-current-school-year"),
                {
                    new_school_year: trimmedNewSY,
                },
            );

            const archiveKey = archiveResponse?.data?.archive_key ?? null;

            setProgressStep("creating");
            setProgressPercent(75);

            router.post(
                route("superadmin.settings.rollover"),
                {
                    new_school_year: trimmedNewSY,
                    confirm_school_year: trimmedConfirm,
                    archive_key: archiveKey,
                },
                {
                    onError: (errs) => {
                        setError(
                            getFirstErrorMessage(
                                errs,
                                "Unable to create the new school year.",
                            ),
                        );
                        setProgressStep("idle");
                        setProgressPercent(0);
                        setSubmitting(false);
                    },
                    onSuccess: () => {
                        setProgressPercent(100);
                        onClose();
                    },
                    onFinish: () => setSubmitting(false),
                },
            );
        } catch (archiveError) {
            const responseErrors = archiveError?.response?.data?.errors;
            const backendMessage = getFirstErrorMessage(
                responseErrors,
                archiveError?.response?.data?.message,
            );

            setError(
                backendMessage ||
                    "Unable to archive the current school year. Please try again.",
            );
            setProgressStep("idle");
            setProgressPercent(0);
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={submitting ? undefined : onClose}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
                {/* Modal header */}
                <div className="bg-gradient-to-r from-rose-600 to-red-700 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 dark:bg-gray-900/20">
                                <RotateCcw className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white text-lg">
                                    Start New School Year
                                </h2>
                                <p className="text-rose-200 text-xs mt-0.5">
                                    This rolls over and archives current SY data
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-lg p-1.5 text-white/70 hover:bg-white/20 dark:hover:bg-gray-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Warning */}
                    <div className="flex gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
                        <AlertTriangle
                            size={16}
                            className="text-rose-500 shrink-0 mt-0.5"
                        />
                        <div className="text-xs text-rose-700 space-y-1">
                            <p className="font-semibold">
                                The following current school year data will be
                                archived:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-rose-600">
                                <li>
                                    All class assignments (subject-teacher
                                    records)
                                </li>
                                <li>All student enrollments</li>
                                <li>All grades and attendance records</li>
                                <li>All interventions and tasks</li>
                                <li>All student notifications</li>
                            </ul>
                            <p className="font-semibold mt-1">
                                No records are deleted. You can review old
                                school years in Archive.
                            </p>
                        </div>
                    </div>

                    {/* Current SY info */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                            Current school year
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                            {currentSY}
                        </span>
                    </div>

                    {/* New SY input */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                            New School Year
                            <span className="text-rose-400 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            value={newSY}
                            onChange={(e) => {
                                setNewSY(e.target.value);
                                setError("");
                            }}
                            placeholder={suggestedSY}
                            className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium focus:border-rose-500 focus:ring-rose-500 focus:bg-white dark:bg-gray-900 transition-colors"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                            Format: YYYY-YYYY (e.g. {suggestedSY})
                        </p>
                        {expectedNextSY && (
                            <p className="text-[11px] text-slate-500 mt-1">
                                Expected next school year: {expectedNextSY}
                            </p>
                        )}
                    </div>

                    {/* Confirmation input */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                            Type the new school year to confirm
                            <span className="text-rose-400 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            value={confirm}
                            onChange={(e) => {
                                setConfirm(e.target.value);
                                setError("");
                            }}
                            placeholder={newSY || suggestedSY}
                            className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium focus:ring-rose-500 transition-colors ${
                                confirm && confirm !== newSY
                                    ? "border-rose-300 bg-rose-50/50 focus:border-rose-500"
                                    : confirm && confirm === newSY
                                      ? "border-emerald-300 bg-emerald-50/50 focus:border-emerald-500"
                                      : "focus:border-rose-500"
                            }`}
                        />
                        {confirm && confirm !== newSY && (
                            <p className="text-[11px] text-rose-500 mt-1">
                                Does not match.
                            </p>
                        )}
                    </div>

                    {validationMessage && (
                        <p className="text-xs text-rose-600 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {validationMessage}
                        </p>
                    )}

                    {error && (
                        <p className="text-xs text-rose-600 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {error}
                        </p>
                    )}

                    {submitting && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold text-blue-700">
                                    {isArchiving
                                        ? `Creating ${currentSY || "current school year"} archive...`
                                        : `Creating new school year ${trimmedNewSY || suggestedSY}...`}
                                </p>
                                <span className="text-[11px] font-semibold text-blue-600 tabular-nums">
                                    {progressPercent}%
                                </span>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
                                <div
                                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>

                            <div className="mt-3 space-y-1.5 text-[11px]">
                                <div
                                    className={`flex items-center gap-2 ${
                                        isArchiving
                                            ? "text-blue-700"
                                            : isCreating
                                              ? "text-emerald-700"
                                              : "text-slate-500"
                                    }`}
                                >
                                    {isCreating ? (
                                        <CheckCircle size={12} />
                                    ) : (
                                        <svg
                                            className={`h-3 w-3 ${isArchiving ? "animate-spin" : ""}`}
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
                                    )}
                                    <span>
                                        Creating{" "}
                                        {currentSY || "current school year"}{" "}
                                        archive
                                    </span>
                                </div>
                                <div
                                    className={`flex items-center gap-2 ${
                                        isCreating
                                            ? "text-blue-700"
                                            : "text-slate-500"
                                    }`}
                                >
                                    <svg
                                        className={`h-3 w-3 ${isCreating ? "animate-spin" : ""}`}
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
                                    <span>
                                        Creating new school year{" "}
                                        {trimmedNewSY || suggestedSY}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isValid || submitting}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <svg
                                    className="animate-spin h-4 w-4"
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
                            ) : (
                                <Trash2 size={15} />
                            )}
                            {submitting
                                ? isArchiving
                                    ? "Creating Archive..."
                                    : "Creating School Year..."
                                : "Start New Year"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Index({ settings, schoolYears }) {
    const [showNewSYModal, setShowNewSYModal] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        current_school_year: settings?.current_school_year || "",
        current_semester: settings?.current_semester || "1",
        enrollment_open: settings?.enrollment_open ?? true,
        grade_submission_open: settings?.grade_submission_open ?? true,
        school_name: settings?.school_name || "",
        school_address: settings?.school_address || "",
    });

    const currentYear = new Date().getFullYear();
    const generatedSchoolYears = Array.from({ length: 5 }, (_, i) => {
        const year = currentYear - 2 + i;
        return `${year}-${year + 1}`;
    });

    const availableSchoolYears = schoolYears?.length
        ? schoolYears
        : generatedSchoolYears;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("superadmin.settings.update"));
    };

    const activeControls = [
        data.enrollment_open,
        data.grade_submission_open,
    ].filter(Boolean).length;

    return (
        <>
            <Head title="School Settings" />

            <div className="space-y-6">
                {/* ── Page Header ──────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-7 shadow-xl">
                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-blue-500/10 blur-xl" />

                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                                <Settings className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    School Settings
                                </h1>
                                <p className="text-slate-400 text-sm mt-0.5">
                                    Configure global school system parameters
                                </p>
                            </div>
                        </div>

                        {/* Status Pills */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm ring-1 ring-white/10">
                                <div
                                    className={`h-2 w-2 rounded-full ${data.enrollment_open ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}
                                />
                                <span className="text-xs font-semibold text-white">
                                    Enrollment{" "}
                                    {data.enrollment_open ? "Open" : "Closed"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm ring-1 ring-white/10">
                                <div
                                    className={`h-2 w-2 rounded-full ${data.grade_submission_open ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}
                                />
                                <span className="text-xs font-semibold text-white">
                                    Grades{" "}
                                    {data.grade_submission_open
                                        ? "Open"
                                        : "Closed"}
                                </span>
                            </div>
                            {data.current_school_year && (
                                <div className="flex items-center gap-2 rounded-xl bg-blue-500/20 px-4 py-2 backdrop-blur-sm ring-1 ring-blue-400/30">
                                    <BookOpen
                                        size={12}
                                        className="text-blue-300"
                                    />
                                    <span className="text-xs font-semibold text-blue-200">
                                        {data.current_school_year} · Sem{" "}
                                        {data.current_semester}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* ── LEFT COLUMN (2/3 width) ───────────────────── */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Academic Period Card */}
                            <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-slate-100 overflow-hidden">
                                <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
                                        <Calendar className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            Academic Period
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Current school year and semester
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* School Year */}
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                                <Calendar size={12} />
                                                School Year
                                                <span className="text-rose-400">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                value={data.current_school_year}
                                                onChange={(e) =>
                                                    setData(
                                                        "current_school_year",
                                                        e.target.value,
                                                    )
                                                }
                                                className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium focus:border-blue-500 focus:ring-blue-500 focus:bg-white dark:bg-gray-900 transition-colors ${
                                                    errors.current_school_year
                                                        ? "border-rose-300 bg-rose-50/50"
                                                        : ""
                                                }`}
                                            >
                                                <option value="">
                                                    Select school year
                                                </option>
                                                {availableSchoolYears.map(
                                                    (year) => (
                                                        <option
                                                            key={year}
                                                            value={year}
                                                        >
                                                            {year}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            {errors.current_school_year && (
                                                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                                                    <Info size={12} />
                                                    {errors.current_school_year}
                                                </p>
                                            )}
                                        </div>

                                        {/* Semester */}
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                                <Sparkles size={12} />
                                                Semester
                                                <span className="text-rose-400">
                                                    *
                                                </span>
                                            </label>
                                            {/* Custom toggle-style selector */}
                                            <div className="flex rounded-xl border border-slate-200 bg-slate-50/50 p-1 gap-1">
                                                {["1", "2"].map((sem) => (
                                                    <button
                                                        key={sem}
                                                        type="button"
                                                        onClick={() =>
                                                            setData(
                                                                "current_semester",
                                                                sem,
                                                            )
                                                        }
                                                        className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                                                            data.current_semester ===
                                                            sem
                                                                ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm ring-1 ring-slate-200"
                                                                : "text-slate-500 hover:text-slate-700"
                                                        }`}
                                                    >
                                                        {sem === "1"
                                                            ? "1st Semester"
                                                            : "2nd Semester"}
                                                    </button>
                                                ))}
                                            </div>
                                            {errors.current_semester && (
                                                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                                                    <Info size={12} />
                                                    {errors.current_semester}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info banner */}
                                    <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                                        <AlertCircle
                                            size={16}
                                            className="text-amber-500 shrink-0 mt-0.5"
                                        />
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            <span className="font-semibold">
                                                Heads up:
                                            </span>{" "}
                                            Changing the academic period affects
                                            enrollment records, grade
                                            submissions, and attendance. Ensure
                                            all grades are finalized before
                                            switching periods.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* School Information Card */}
                            <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-slate-100 overflow-hidden">
                                <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
                                        <School className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            School Information
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Used in reports, documents, and
                                            printed materials
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 space-y-5">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                            <School size={12} />
                                            School Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.school_name}
                                            onChange={(e) =>
                                                setData(
                                                    "school_name",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g., Sample Senior High School"
                                            className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white dark:bg-gray-900 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                            <MapPin size={12} />
                                            School Address
                                        </label>
                                        <textarea
                                            value={data.school_address}
                                            onChange={(e) =>
                                                setData(
                                                    "school_address",
                                                    e.target.value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Full school address including barangay, city, and province..."
                                            className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white dark:bg-gray-900 transition-colors resize-none"
                                        />
                                    </div>

                                    {/* Preview */}
                                    {(data.school_name ||
                                        data.school_address) && (
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                                Preview
                                            </p>
                                            <p className="font-semibold text-slate-800 text-sm">
                                                {data.school_name || "—"}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {data.school_address || "—"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN (1/3 width) ──────────────────── */}
                        <div className="space-y-6">
                            {/* System Controls Card */}
                            <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-slate-100 overflow-hidden">
                                <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/20">
                                        <Zap className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            System Controls
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Toggle system features
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5 space-y-3">
                                    {/* Enrollment Toggle */}
                                    <div
                                        className={`rounded-xl p-4 border transition-colors ${
                                            data.enrollment_open
                                                ? "bg-emerald-50 border-emerald-100"
                                                : "bg-slate-50 border-slate-100"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                                                        data.enrollment_open
                                                            ? "bg-emerald-100"
                                                            : "bg-slate-200"
                                                    }`}
                                                >
                                                    <GraduationCap
                                                        size={18}
                                                        className={
                                                            data.enrollment_open
                                                                ? "text-emerald-600"
                                                                : "text-slate-400"
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">
                                                        Enrollment
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {data.enrollment_open
                                                            ? "Students can enroll"
                                                            : "Enrollment disabled"}
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        data.enrollment_open
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "enrollment_open",
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="peer sr-only"
                                                />
                                                <div className="peer h-5 w-9 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white dark:bg-gray-900 after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Grade Submission Toggle */}
                                    <div
                                        className={`rounded-xl p-4 border transition-colors ${
                                            data.grade_submission_open
                                                ? "bg-emerald-50 border-emerald-100"
                                                : "bg-slate-50 border-slate-100"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                                                        data.grade_submission_open
                                                            ? "bg-emerald-100"
                                                            : "bg-slate-200"
                                                    }`}
                                                >
                                                    <CheckCircle
                                                        size={18}
                                                        className={
                                                            data.grade_submission_open
                                                                ? "text-emerald-600"
                                                                : "text-slate-400"
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">
                                                        Grade Submission
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {data.grade_submission_open
                                                            ? "Teachers can submit"
                                                            : "Submission disabled"}
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        data.grade_submission_open
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "grade_submission_open",
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="peer sr-only"
                                                />
                                                <div className="peer h-5 w-9 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white dark:bg-gray-900 after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-slate-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-100">
                                    <h3 className="font-semibold text-slate-900 text-sm">
                                        Configuration Summary
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Current active settings
                                    </p>
                                </div>
                                <div className="p-5 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <Calendar
                                                size={13}
                                                className="text-slate-400"
                                            />
                                            School Year
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            {data.current_school_year || (
                                                <span className="text-slate-300 font-normal">
                                                    Not set
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <BookOpen
                                                size={13}
                                                className="text-slate-400"
                                            />
                                            Semester
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            {data.current_semester === "1"
                                                ? "1st Semester"
                                                : "2nd Semester"}
                                        </span>
                                    </div>
                                    <div className="h-px bg-slate-100" />
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <GraduationCap
                                                size={13}
                                                className="text-slate-400"
                                            />
                                            Enrollment
                                        </span>
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                data.enrollment_open
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            {data.enrollment_open
                                                ? "OPEN"
                                                : "CLOSED"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <CheckCircle
                                                size={13}
                                                className="text-slate-400"
                                            />
                                            Grades
                                        </span>
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                data.grade_submission_open
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            {data.grade_submission_open
                                                ? "OPEN"
                                                : "CLOSED"}
                                        </span>
                                    </div>
                                    {data.school_name && (
                                        <>
                                            <div className="h-px bg-slate-100" />
                                            <div className="flex items-start justify-between text-sm gap-3">
                                                <span className="text-slate-500 flex items-center gap-2 shrink-0">
                                                    <School
                                                        size={13}
                                                        className="text-slate-400"
                                                    />
                                                    School
                                                </span>
                                                <span className="font-semibold text-slate-800 text-right text-xs leading-snug">
                                                    {data.school_name}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Save School Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* ── Danger Zone ───────────────────────────────────── */}
                <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/50 overflow-hidden">
                    <div className="flex items-center gap-4 px-6 py-5 border-b border-rose-200">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-md shadow-rose-500/20">
                            <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-rose-900">
                                Danger Zone
                            </h2>
                            <p className="text-xs text-rose-500">
                                Irreversible system operations
                            </p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="font-semibold text-slate-900 text-sm">
                                    Start New School Year
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                                    Ends{" "}
                                    <span className="font-semibold">
                                        {data.current_school_year}
                                    </span>{" "}
                                    and archives current school year data —
                                    enrollments, grades, attendance,
                                    interventions, and notifications. No records
                                    are deleted.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowNewSYModal(true)}
                                className="shrink-0 inline-flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all"
                            >
                                <RotateCcw size={15} />
                                Start New School Year
                            </button>
                        </div>
                    </div>
                </div>

                {showNewSYModal && (
                    <NewSchoolYearModal
                        currentSY={data.current_school_year}
                        onClose={() => setShowNewSYModal(false)}
                    />
                )}
            </div>
        </>
    );
}

Index.layout = (page) => <SuperAdminLayout children={page} />;

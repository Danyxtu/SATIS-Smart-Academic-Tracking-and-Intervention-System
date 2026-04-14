import { Head, router, useForm } from "@inertiajs/react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import { useState } from "react";
import {
    Save,
    Users,
    UserPlus,
    Pencil,
    Calendar,
    Info,
    School,
    MapPin,
    Sparkles,
    BookOpen,
    AlertCircle,
    RotateCcw,
    AlertTriangle,
    X,
    Trash2,
} from "lucide-react";

const SETTINGS_TABS = [
    {
        id: "school-information",
        label: "School Information",
        icon: School,
    },
    {
        id: "academic-period",
        label: "Academic Period",
        icon: Calendar,
    },
    {
        id: "school-personnel",
        label: "School Personnel",
        icon: Users,
    },
    {
        id: "danger-zone",
        label: "Danger Zone",
        icon: AlertTriangle,
    },
];

const EMPTY_PERSONNEL_FORM = {
    position: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone_number: "",
};

function NewSchoolYearModal({ currentSY, onClose }) {
    const [newSY, setNewSY] = useState("");
    const [confirm, setConfirm] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

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

        router.post(
            route("superadmin.settings.rollover"),
            {
                new_school_year: trimmedNewSY,
                confirm_school_year: trimmedConfirm,
            },
            {
                onError: (errs) => {
                    setError(
                        getFirstErrorMessage(
                            errs,
                            "Unable to create the new school year.",
                        ),
                    );
                },
                onSuccess: () => {
                    onClose();
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 pb-10 sm:items-center">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={submitting ? undefined : onClose}
            />
            <div className="relative w-full max-w-md max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
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
                                    This rolls over current school year data
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="z-10 rounded-lg p-1.5 text-white/70 hover:bg-white/20 dark:hover:bg-gray-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                                The current school year will be closed and a new
                                one will start.
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
                                Existing records are preserved by school year.
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
                                    Creating new school year{" "}
                                    {trimmedNewSY || suggestedSY}...
                                </p>
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
                                ? "Creating School Year..."
                                : "Start New Year"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Index({ settings, schoolPersonnel = [] }) {
    const [showNewSYModal, setShowNewSYModal] = useState(false);
    const [isEditingSemester, setIsEditingSemester] = useState(false);
    const [isEditingSchoolInfo, setIsEditingSchoolInfo] = useState(false);
    const [activeTab, setActiveTab] = useState("school-information");
    const [showPersonnelModal, setShowPersonnelModal] = useState(false);
    const [editingPersonnel, setEditingPersonnel] = useState(null);

    const currentSchoolYear = settings?.current_school_year || "";

    const {
        data: academicData,
        setData: setAcademicData,
        put: putAcademic,
        processing: academicProcessing,
        errors: academicErrors,
        clearErrors: clearAcademicErrors,
    } = useForm({
        current_semester: settings?.current_semester || "1",
    });

    const {
        data: schoolInfoData,
        setData: setSchoolInfoData,
        put: putSchoolInfo,
        processing: schoolInfoProcessing,
        errors: schoolInfoErrors,
        clearErrors: clearSchoolInfoErrors,
    } = useForm({
        school_name: settings?.school_name || "",
        school_address: settings?.school_address || "",
    });

    const {
        data: personnelData,
        setData: setPersonnelData,
        post: postPersonnel,
        put: putPersonnel,
        delete: deletePersonnel,
        processing: personnelProcessing,
        errors: personnelErrors,
        clearErrors: clearPersonnelErrors,
        reset: resetPersonnelData,
        transform: transformPersonnel,
    } = useForm({
        ...EMPTY_PERSONNEL_FORM,
    });

    const handleSaveSemester = (e) => {
        e.preventDefault();
        putAcademic(route("superadmin.settings.academic"), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditingSemester(false);
            },
        });
    };

    const handleCancelSemesterEdit = () => {
        setAcademicData("current_semester", settings?.current_semester || "1");
        clearAcademicErrors();
        setIsEditingSemester(false);
    };

    const handleSaveSchoolInfo = (e) => {
        e.preventDefault();
        putSchoolInfo(route("superadmin.settings.school-info"), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditingSchoolInfo(false);
            },
        });
    };

    const handleCancelSchoolInfoEdit = () => {
        setSchoolInfoData({
            school_name: settings?.school_name || "",
            school_address: settings?.school_address || "",
        });
        clearSchoolInfoErrors();
        setIsEditingSchoolInfo(false);
    };

    const openCreatePersonnelModal = () => {
        setEditingPersonnel(null);
        resetPersonnelData();
        clearPersonnelErrors();
        setShowPersonnelModal(true);
    };

    const openEditPersonnelModal = (person) => {
        setEditingPersonnel(person);
        setPersonnelData({
            position: person?.position || "",
            first_name: person?.first_name || "",
            middle_name: person?.middle_name || "",
            last_name: person?.last_name || "",
            email: person?.email || "",
            phone_number: person?.phone_number || "",
        });
        clearPersonnelErrors();
        setShowPersonnelModal(true);
    };

    const closePersonnelModal = () => {
        if (personnelProcessing) {
            return;
        }

        setShowPersonnelModal(false);
        setEditingPersonnel(null);
        resetPersonnelData();
        clearPersonnelErrors();
    };

    const handleSavePersonnel = (e) => {
        e.preventDefault();

        transformPersonnel((current) => ({
            position: String(current.position || "").trim(),
            first_name: String(current.first_name || "").trim(),
            middle_name: String(current.middle_name || "").trim() || null,
            last_name: String(current.last_name || "").trim(),
            email: String(current.email || "").trim() || null,
            phone_number: String(current.phone_number || "").trim() || null,
        }));

        if (editingPersonnel?.id) {
            putPersonnel(
                route(
                    "superadmin.settings.school-personnel.update",
                    editingPersonnel.id,
                ),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        closePersonnelModal();
                    },
                },
            );
            return;
        }

        postPersonnel(route("superadmin.settings.school-personnel.store"), {
            preserveScroll: true,
            onSuccess: () => {
                closePersonnelModal();
            },
        });
    };

    const handleDeletePersonnel = () => {
        if (!editingPersonnel?.id || personnelProcessing) {
            return;
        }

        const shouldDelete = window.confirm(
            "Are you sure you want to remove this school personnel record?",
        );

        if (!shouldDelete) {
            return;
        }

        deletePersonnel(
            route(
                "superadmin.settings.school-personnel.destroy",
                editingPersonnel.id,
            ),
            {
                preserveScroll: true,
                onSuccess: () => {
                    closePersonnelModal();
                },
            },
        );
    };

    const personnelList = Array.isArray(schoolPersonnel) ? schoolPersonnel : [];

    const formatPersonnelName = (person) =>
        [person?.first_name, person?.middle_name, person?.last_name]
            .filter(Boolean)
            .join(" ");

    return (
        <>
            <Head title="School Settings" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            School Settings
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Configure global school system parameters
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        <BookOpen size={12} />
                        Current Academic Period:{" "}
                        {currentSchoolYear || "Not set"} · Sem{" "}
                        {academicData.current_semester}
                    </div>
                </div>

                <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-4 py-4 border-b border-slate-100 sm:px-6">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            {SETTINGS_TABS.map((tab) => {
                                const TabIcon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                                            isActive
                                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <TabIcon size={16} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6">
                        {activeTab === "school-information" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        School Information
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Used in reports, documents, and printed
                                        materials.
                                    </p>
                                </div>

                                {isEditingSchoolInfo ? (
                                    <>
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                                <School size={12} />
                                                School Name
                                            </label>
                                            <input
                                                type="text"
                                                value={
                                                    schoolInfoData.school_name
                                                }
                                                onChange={(e) =>
                                                    setSchoolInfoData(
                                                        "school_name",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g., Sample Senior High School"
                                                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-emerald-500 focus:ring-emerald-500 focus:bg-white dark:bg-gray-900 transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                                <MapPin size={12} />
                                                School Address
                                            </label>
                                            <textarea
                                                value={
                                                    schoolInfoData.school_address
                                                }
                                                onChange={(e) =>
                                                    setSchoolInfoData(
                                                        "school_address",
                                                        e.target.value,
                                                    )
                                                }
                                                rows={3}
                                                placeholder="Full school address including barangay, city, and province..."
                                                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-emerald-500 focus:ring-emerald-500 focus:bg-white dark:bg-gray-900 transition-colors resize-none"
                                            />
                                        </div>

                                        {(schoolInfoErrors.school_name ||
                                            schoolInfoErrors.school_address) && (
                                            <p className="text-xs text-rose-600 flex items-center gap-1">
                                                <Info size={12} />
                                                {schoolInfoErrors.school_name ||
                                                    schoolInfoErrors.school_address}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="relative rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsEditingSchoolInfo(true)
                                            }
                                            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                                            aria-label="Edit school information"
                                        >
                                            <Pencil size={14} />
                                        </button>

                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                            Preview
                                        </p>
                                        <p className="font-semibold text-slate-800 text-sm">
                                            {schoolInfoData.school_name || "—"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {schoolInfoData.school_address ||
                                                "—"}
                                        </p>
                                    </div>
                                )}

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <h3 className="font-semibold text-slate-900 text-sm">
                                        Configuration Summary
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5 mb-4">
                                        Current active settings
                                    </p>

                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Calendar
                                                    size={13}
                                                    className="text-slate-400"
                                                />
                                                School Year
                                            </span>
                                            <span className="font-semibold text-slate-800">
                                                {currentSchoolYear || (
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
                                                {academicData.current_semester ===
                                                "1"
                                                    ? "1st Semester"
                                                    : "2nd Semester"}
                                            </span>
                                        </div>

                                        <div className="flex items-start justify-between text-sm gap-3">
                                            <span className="text-slate-500 flex items-center gap-2 shrink-0">
                                                <School
                                                    size={13}
                                                    className="text-slate-400"
                                                />
                                                School
                                            </span>
                                            <span className="font-semibold text-slate-800 text-right text-xs leading-snug">
                                                {schoolInfoData.school_name ||
                                                    "Not set"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isEditingSchoolInfo && (
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={handleSaveSchoolInfo}
                                            disabled={schoolInfoProcessing}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {schoolInfoProcessing ? (
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
                                                    Saving School Info...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={16} />
                                                    Save School Information
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCancelSchoolInfoEdit}
                                            disabled={schoolInfoProcessing}
                                            className="w-full rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "academic-period" && (
                            <div className="space-y-5">
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Current Academic Period
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        School year is read-only. Only semester
                                        can be edited here.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                            School Year
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                            {currentSchoolYear || "Not set"}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                            <Sparkles size={12} />
                                            Semester
                                        </label>

                                        {isEditingSemester ? (
                                            <div className="flex rounded-xl border border-slate-200 bg-slate-50/50 p-1 gap-1">
                                                {["1", "2"].map((sem) => (
                                                    <button
                                                        key={sem}
                                                        type="button"
                                                        onClick={() =>
                                                            setAcademicData(
                                                                "current_semester",
                                                                sem,
                                                            )
                                                        }
                                                        className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                                                            academicData.current_semester ===
                                                            sem
                                                                ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600"
                                                                : "text-slate-500 hover:text-slate-700"
                                                        }`}
                                                    >
                                                        {sem === "1"
                                                            ? "1st Semester"
                                                            : "2nd Semester"}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="relative rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIsEditingSemester(
                                                            true,
                                                        )
                                                    }
                                                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                                                    aria-label="Edit semester"
                                                >
                                                    <Pencil size={14} />
                                                </button>

                                                <p className="text-sm font-semibold text-slate-800">
                                                    {academicData.current_semester ===
                                                    "1"
                                                        ? "1st Semester"
                                                        : "2nd Semester"}
                                                </p>
                                            </div>
                                        )}

                                        {academicErrors.current_semester && (
                                            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                                                <Info size={12} />
                                                {
                                                    academicErrors.current_semester
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {isEditingSemester && (
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSaveSemester}
                                            disabled={academicProcessing}
                                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            <Save size={14} />
                                            {academicProcessing
                                                ? "Saving..."
                                                : "Save Semester"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCancelSemesterEdit}
                                            disabled={academicProcessing}
                                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                                    <AlertCircle
                                        size={16}
                                        className="text-amber-500 shrink-0 mt-0.5"
                                    />
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        <span className="font-semibold">
                                            Heads up:
                                        </span>{" "}
                                        School year changes are handled via
                                        Start New School Year in the Danger
                                        Zone. This section only allows semester
                                        switching.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === "school-personnel" && (
                            <div className="space-y-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            School Personnel
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Core contact records for school
                                            operations.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={openCreatePersonnelModal}
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-colors hover:bg-emerald-700"
                                        aria-label="Add school personnel"
                                    >
                                        <UserPlus size={18} />
                                    </button>
                                </div>

                                {personnelList.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                                        <p className="text-sm font-semibold text-slate-700">
                                            No school personnel found.
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Run database seeding to load the
                                            default Principal and Guidance
                                            Counselor records.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {personnelList.map((person) => (
                                            <div
                                                key={person.id}
                                                className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditPersonnelModal(
                                                            person,
                                                        )
                                                    }
                                                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                                                    aria-label="Edit school personnel"
                                                >
                                                    <Pencil size={14} />
                                                </button>

                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                                                    {person.position}
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {formatPersonnelName(
                                                        person,
                                                    )}
                                                </p>
                                                <p className="mt-2 text-xs text-slate-600">
                                                    Email: {person.email || "—"}
                                                </p>
                                                <p className="text-xs text-slate-600">
                                                    Phone:{" "}
                                                    {person.phone_number || "—"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "danger-zone" && (
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
                                                    {currentSchoolYear}
                                                </span>{" "}
                                                and starts the next school year
                                                while preserving existing
                                                records.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowNewSYModal(true)
                                            }
                                            className="shrink-0 inline-flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all"
                                        >
                                            <RotateCcw size={15} />
                                            Start New School Year
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {showPersonnelModal && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 pb-10 sm:items-center">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={
                                personnelProcessing
                                    ? undefined
                                    : closePersonnelModal
                            }
                        />

                        <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">
                                        {editingPersonnel
                                            ? "Edit School Personnel"
                                            : "Add School Personnel"}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Add, update, or remove school personnel
                                        records.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closePersonnelModal}
                                    disabled={personnelProcessing}
                                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form
                                onSubmit={handleSavePersonnel}
                                className="space-y-4 p-6"
                            >
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                                        Position
                                    </label>
                                    <input
                                        type="text"
                                        value={personnelData.position}
                                        onChange={(e) =>
                                            setPersonnelData(
                                                "position",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g., Principal"
                                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-emerald-500 focus:ring-emerald-500 focus:bg-white"
                                    />
                                    {personnelErrors.position && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {personnelErrors.position}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={personnelData.first_name}
                                            onChange={(e) =>
                                                setPersonnelData(
                                                    "first_name",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-emerald-500 focus:ring-emerald-500 focus:bg-white"
                                        />
                                        {personnelErrors.first_name && (
                                            <p className="mt-1 text-xs text-rose-600">
                                                {personnelErrors.first_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={personnelData.last_name}
                                            onChange={(e) =>
                                                setPersonnelData(
                                                    "last_name",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-emerald-500 focus:ring-emerald-500 focus:bg-white"
                                        />
                                        {personnelErrors.last_name && (
                                            <p className="mt-1 text-xs text-rose-600">
                                                {personnelErrors.last_name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                                        Middle Name
                                    </label>
                                    <input
                                        type="text"
                                        value={personnelData.middle_name}
                                        onChange={(e) =>
                                            setPersonnelData(
                                                "middle_name",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-emerald-500 focus:ring-emerald-500 focus:bg-white"
                                    />
                                    {personnelErrors.middle_name && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {personnelErrors.middle_name}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={personnelData.email}
                                            onChange={(e) =>
                                                setPersonnelData(
                                                    "email",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-emerald-500 focus:ring-emerald-500 focus:bg-white"
                                        />
                                        {personnelErrors.email && (
                                            <p className="mt-1 text-xs text-rose-600">
                                                {personnelErrors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            value={personnelData.phone_number}
                                            onChange={(e) =>
                                                setPersonnelData(
                                                    "phone_number",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-emerald-500 focus:ring-emerald-500 focus:bg-white"
                                        />
                                        {personnelErrors.phone_number && (
                                            <p className="mt-1 text-xs text-rose-600">
                                                {personnelErrors.phone_number}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                    <div>
                                        {editingPersonnel && (
                                            <button
                                                type="button"
                                                onClick={handleDeletePersonnel}
                                                disabled={personnelProcessing}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
                                            >
                                                <Trash2 size={14} />
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={closePersonnelModal}
                                            disabled={personnelProcessing}
                                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={personnelProcessing}
                                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            <Save size={14} />
                                            {personnelProcessing
                                                ? "Saving..."
                                                : "Save Changes"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showNewSYModal && (
                    <NewSchoolYearModal
                        currentSY={currentSchoolYear}
                        onClose={() => setShowNewSYModal(false)}
                    />
                )}
            </div>
        </>
    );
}

Index.layout = (page) => <SchoolStaffLayout children={page} />;

import React, { useState, useCallback } from "react";
import Modal from "@/Components/Modal";
import axios from "axios";
import {
    X,
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Bell,
    ClipboardList,
    Clock,
    Users,
    Handshake,
    MessageSquare,
    Plus,
    Trash2,
    Mail,
    MailMinus,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────── */
/*  CONSTANTS                                                               */
/* ────────────────────────────────────────────────────────────────────────── */
const STEP_SELECT_INTERVENTION = 1;
const STEP_CONFIRM = 2;
const STEP_RESULT = 3;

const TIERS = [
    {
        id: "tier1",
        label: "Tier 1 – Early Intervention",
        description:
            "Light-touch reminders for students showing early signs of struggle.",
        icon: ShieldCheck,
        color: "emerald",
        gradient: "from-emerald-500 to-teal-600",
        types: [
            {
                key: "automated_nudge",
                label: "Reminder Nudge",
                description:
                    "Send a friendly reminder to stay on track with academic goals.",
                icon: Bell,
            },
        ],
    },
    {
        id: "tier2",
        label: "Tier 2 – Targeted Support",
        description:
            "Structured support for students who need more focused assistance.",
        icon: Shield,
        color: "amber",
        gradient: "from-amber-500 to-orange-600",
        types: [
            {
                key: "task_list",
                label: "Goal Checklist",
                description:
                    "Assign specific goals and tasks for the student to complete.",
                icon: ClipboardList,
                hasTasks: true,
            },
            {
                key: "extension_grant",
                label: "Deadline Extension",
                description:
                    "Grant additional time for assignments or requirements.",
                icon: Clock,
            },
            {
                key: "parent_contact",
                label: "Parent Contact",
                description:
                    "Notify the parent/guardian about the student's academic status.",
                icon: Users,
            },
        ],
    },
    {
        id: "tier3",
        label: "Tier 3 – Intensive Intervention",
        description:
            "Formal, documented interventions for students in critical need.",
        icon: ShieldAlert,
        color: "red",
        gradient: "from-red-500 to-rose-600",
        types: [
            {
                key: "academic_agreement",
                label: "Academic Agreement",
                description:
                    "Create a formal academic agreement with documented terms.",
                icon: Handshake,
            },
            {
                key: "one_on_one_meeting",
                label: "One-on-One Meeting",
                description:
                    "Schedule and log a personal intervention meeting.",
                icon: MessageSquare,
            },
        ],
    },
];

const LOCKED_TIER_IDS = ["tier1", "tier2"];

const DEADLINE_REQUIRED_TYPES = [
    "task_list",
    "extension_grant",
    "parent_contact",
    "academic_agreement",
    "one_on_one_meeting",
    "counselor_referral",
];

/**
 * StudentInterventionModal – A focused intervention modal for a single student.
 *
 * Designed to be triggered from StudentRiskCard or any component that
 * already knows which student to intervene on.
 *
 * Step 1 → Select tier & intervention type
 * Step 2 → Notes, tasks (if applicable), email toggle → Confirm
 * Step 3 → Result (success / error)
 *
 * All steps are fully reversible.
 *
 * Props:
 *  - show     (boolean)  Whether the modal is visible
 *  - onClose  (function) Callback to close the modal
 *  - student  (object)   Student data with at least { enrollment_id, student_name|name, subject, avatar, intervention }
 */
export default function StudentInterventionModal({
    show,
    onClose,
    student = null,
}) {
    /* ── state ── */
    const [step, setStep] = useState(STEP_SELECT_INTERVENTION);
    const [selectedTier, setSelectedTier] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [notes, setNotes] = useState("");
    const [deadlineAt, setDeadlineAt] = useState("");
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");
    const [sendEmail, setSendEmail] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const fullName = student?.student_name ?? student?.name ?? "Student";
    const hasActiveIntervention = Boolean(student?.intervention);

    /* ── helpers ── */
    const resetAll = useCallback(() => {
        setStep(STEP_SELECT_INTERVENTION);
        setSelectedTier(null);
        setSelectedType(null);
        setNotes("");
        setDeadlineAt("");
        setTasks([]);
        setNewTask("");
        setSendEmail(true);
        setSubmitting(false);
        setResult(null);
    }, []);

    const handleClose = () => {
        resetAll();
        onClose();
    };

    /* ── task management ── */
    const addTask = () => {
        const trimmed = newTask.trim();
        if (trimmed && tasks.length < 10) {
            setTasks((prev) => [...prev, trimmed]);
            setNewTask("");
        }
    };
    const removeTask = (index) => {
        setTasks((prev) => prev.filter((_, i) => i !== index));
    };

    /* ── navigation ── */
    const handleSelectType = (tier, type) => {
        if (LOCKED_TIER_IDS.includes(tier.id)) return;

        setSelectedTier(tier);
        setSelectedType(type);
        if (type.key !== "task_list") setTasks([]);
        setStep(STEP_CONFIRM);
    };
    const handleBackToTiers = () => {
        setSelectedTier(null);
        setSelectedType(null);
        setNotes("");
        setDeadlineAt("");
        setTasks([]);
        setStep(STEP_SELECT_INTERVENTION);
    };

    const deadlineRequired = DEADLINE_REQUIRED_TYPES.includes(
        selectedType?.key ?? "",
    );

    /* ── submit via axios ── */
    const handleSubmit = async () => {
        if (!student?.enrollment_id || !selectedType) return;
        if (deadlineRequired && !deadlineAt) return;

        setSubmitting(true);
        try {
            const payload = {
                enrollment_id: student.enrollment_id,
                type: selectedType.key,
                notes: notes || null,
                deadline_at: deadlineRequired ? deadlineAt : null,
                send_email: sendEmail,
            };
            if (selectedType.key === "task_list" && tasks.length > 0) {
                payload.tasks = tasks;
            }

            const response = await axios.post(
                route("teacher.interventions.store"),
                payload,
            );

            setResult({
                success: true,
                message:
                    response.data?.message ??
                    `Intervention for ${fullName} is now active.`,
            });
            setStep(STEP_RESULT);
        } catch (error) {
            const data = error.response?.data;
            const validationErrors = data?.errors ?? {};
            const flatErrors = Object.values(validationErrors).flat();

            setResult({
                success: false,
                message:
                    data?.message ??
                    "Something went wrong while creating the intervention.",
                errors: flatErrors,
            });
            setStep(STEP_RESULT);
        } finally {
            setSubmitting(false);
        }
    };

    /* ── step labels ── */
    const stepLabels = ["Select", "Confirm", "Result"];

    /* ────────────────────────────────────────────────────────────────────── */
    return (
        <Modal show={show} onClose={handleClose} maxWidth="3xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                {/* ── Header ── */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <ShieldAlert className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {hasActiveIntervention
                                        ? "Update Intervention"
                                        : "Start Intervention"}
                                </h3>
                                <p className="text-sm text-indigo-100">
                                    {step === STEP_SELECT_INTERVENTION &&
                                        `Choose an intervention for ${fullName}`}
                                    {step === STEP_CONFIRM &&
                                        "Review and confirm details"}
                                    {step === STEP_RESULT &&
                                        "Intervention submitted"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="z-10 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        {stepLabels.map((label, idx) => {
                            const stepNum = idx + 1;
                            const isActive = step === stepNum;
                            const isComplete = step > stepNum;
                            return (
                                <div
                                    key={label}
                                    className="flex items-center gap-2"
                                >
                                    <div
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                            isActive
                                                ? "bg-white text-indigo-600"
                                                : isComplete
                                                  ? "bg-white/30 text-white"
                                                  : "bg-white/10 text-indigo-200"
                                        }`}
                                    >
                                        {isComplete ? (
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        ) : (
                                            <span>{stepNum}</span>
                                        )}
                                        <span className="hidden sm:inline">
                                            {label}
                                        </span>
                                    </div>
                                    {idx < stepLabels.length - 1 && (
                                        <ChevronRight className="w-4 h-4 text-indigo-200" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Student Info Badge (always visible) ── */}
                {student && step !== STEP_RESULT && (
                    <div className="px-6 pt-5 pb-0">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                            <img
                                src={
                                    student.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff`
                                }
                                alt={fullName}
                                className="w-9 h-9 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                                    {fullName}
                                </p>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate">
                                    {student.subject ?? "—"}
                                    {typeof student.grade === "number" &&
                                        ` · Grade: ${student.grade}%`}
                                </p>
                            </div>
                            {hasActiveIntervention && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Has Active
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* ─────────── STEP 1 : SELECT INTERVENTION ─────────── */}
                {step === STEP_SELECT_INTERVENTION && (
                    <>
                        <div className="px-6 py-4">
                            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
                                {TIERS.map((tier) => {
                                    const TierIcon = tier.icon;
                                    const isTierLocked =
                                        LOCKED_TIER_IDS.includes(tier.id);
                                    const isRecommendedTier =
                                        tier.id === "tier3";
                                    return (
                                        <div
                                            key={tier.id}
                                            className={`rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${
                                                isTierLocked
                                                    ? "opacity-60 grayscale"
                                                    : ""
                                            } ${
                                                isRecommendedTier
                                                    ? "ring-1 ring-indigo-300 dark:ring-indigo-800"
                                                    : ""
                                            }`}
                                        >
                                            <div
                                                className={`px-4 py-3 bg-gradient-to-r ${tier.gradient} flex items-start justify-between gap-3`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <TierIcon className="w-5 h-5 text-white" />
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-white">
                                                            {tier.label}
                                                        </h4>
                                                        <p className="text-xs text-white/70">
                                                            {tier.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isRecommendedTier && (
                                                    <span className="inline-flex items-center rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                        Recommended
                                                    </span>
                                                )}
                                                {!isRecommendedTier &&
                                                    isTierLocked && (
                                                        <span className="inline-flex items-center rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                            Disabled
                                                        </span>
                                                    )}
                                            </div>
                                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {tier.types.map((type) => {
                                                    const TypeIcon = type.icon;
                                                    return (
                                                        <button
                                                            key={type.key}
                                                            type="button"
                                                            disabled={
                                                                isTierLocked
                                                            }
                                                            onClick={() =>
                                                                handleSelectType(
                                                                    tier,
                                                                    type,
                                                                )
                                                            }
                                                            className={`w-full group flex items-center gap-3 px-4 py-3 text-left ${
                                                                isTierLocked
                                                                    ? "cursor-not-allowed opacity-70"
                                                                    : "hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                                                            }`}
                                                        >
                                                            <div
                                                                className={`flex-shrink-0 w-9 h-9 rounded-lg bg-${tier.color}-50 dark:bg-${tier.color}-900/20 flex items-center justify-center`}
                                                            >
                                                                <TypeIcon
                                                                    className={`w-4.5 h-4.5 text-${tier.color}-600 dark:text-${tier.color}-400`}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p
                                                                    className={`text-sm font-medium text-gray-900 dark:text-white ${
                                                                        isTierLocked
                                                                            ? ""
                                                                            : "group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors"
                                                                    }`}
                                                                >
                                                                    {type.label}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {
                                                                        type.description
                                                                    }
                                                                </p>
                                                            </div>
                                                            <ChevronRight
                                                                className={`w-4 h-4 text-gray-400 flex-shrink-0 ${
                                                                    isTierLocked
                                                                        ? ""
                                                                        : "group-hover:text-indigo-500 transition-colors"
                                                                }`}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}

                {/* ─────────── STEP 2 : CONFIRM ─────────── */}
                {step === STEP_CONFIRM && (
                    <>
                        <div className="px-6 py-5 space-y-5 max-h-[460px] overflow-y-auto">
                            {/* Selected intervention summary */}
                            <div
                                className={`p-3 rounded-xl bg-${selectedTier?.color}-50 dark:bg-${selectedTier?.color}-900/20 border border-${selectedTier?.color}-100 dark:border-${selectedTier?.color}-800`}
                            >
                                <p
                                    className={`text-[10px] uppercase tracking-wider font-semibold text-${selectedTier?.color}-500 dark:text-${selectedTier?.color}-400 mb-1`}
                                >
                                    {selectedTier?.label}
                                </p>
                                <div className="flex items-center gap-2">
                                    {selectedType?.icon && (
                                        <selectedType.icon
                                            className={`w-5 h-5 text-${selectedTier?.color}-600 dark:text-${selectedTier?.color}-400`}
                                        />
                                    )}
                                    <div>
                                        <p
                                            className={`text-sm font-semibold text-${selectedTier?.color}-900 dark:text-${selectedTier?.color}-200`}
                                        >
                                            {selectedType?.label}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {selectedType?.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Notes{" "}
                                    <span className="text-gray-400 font-normal">
                                        (optional)
                                    </span>
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Add any additional notes or context for this intervention…"
                                    className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all"
                                />
                            </div>

                            {/* Deadline (Tier 2 and Tier 3) */}
                            {deadlineRequired && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Intervention Deadline{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={deadlineAt}
                                        onChange={(e) =>
                                            setDeadlineAt(e.target.value)
                                        }
                                        className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-all"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Required for Tier 2 and Tier 3
                                        interventions.
                                    </p>
                                </div>
                            )}

                            {/* Tasks (only for task_list) */}
                            {selectedType?.hasTasks && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Goal Checklist{" "}
                                        <span className="text-gray-400 font-normal">
                                            (add up to 10 tasks)
                                        </span>
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newTask}
                                            onChange={(e) =>
                                                setNewTask(e.target.value)
                                            }
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                (e.preventDefault(), addTask())
                                            }
                                            placeholder="e.g. Complete missing homework for Chapter 3"
                                            maxLength={500}
                                            className="flex-1 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={addTask}
                                            disabled={
                                                !newTask.trim() ||
                                                tasks.length >= 10
                                            }
                                            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add
                                        </button>
                                    </div>
                                    {tasks.length > 0 && (
                                        <ul className="space-y-1.5">
                                            {tasks.map((task, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200"
                                                >
                                                    <ClipboardList className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                                    <span className="flex-1 truncate">
                                                        {task}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeTask(i)
                                                        }
                                                        className="flex-shrink-0 p-0.5 text-red-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {/* Email toggle */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2.5">
                                    {sendEmail ? (
                                        <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    ) : (
                                        <MailMinus className="w-4 h-4 text-gray-400" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            Email Notification
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {sendEmail
                                                ? "Student will receive an email notification"
                                                : "No email will be sent"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSendEmail(!sendEmail)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        sendEmail
                                            ? "bg-indigo-600"
                                            : "bg-gray-300 dark:bg-gray-600"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                            sendEmail
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                            <button
                                onClick={handleBackToTiers}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={
                                    submitting ||
                                    (deadlineRequired && !deadlineAt)
                                }
                                className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                    submitting ||
                                    (deadlineRequired && !deadlineAt)
                                        ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                                }`}
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                {submitting
                                    ? "Creating…"
                                    : hasActiveIntervention
                                      ? "Update Intervention"
                                      : "Start Intervention"}
                            </button>
                        </div>
                    </>
                )}

                {/* ─────────── STEP 3 : RESULT ─────────── */}
                {step === STEP_RESULT && result && (
                    <>
                        <div className="px-6 py-8">
                            <div className="text-center">
                                <div
                                    className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                                        result.success
                                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                                            : "bg-red-100 dark:bg-red-900/30"
                                    }`}
                                >
                                    {result.success ? (
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                                    )}
                                </div>

                                <h4
                                    className={`text-lg font-bold mb-2 ${
                                        result.success
                                            ? "text-emerald-900 dark:text-emerald-200"
                                            : "text-red-900 dark:text-red-200"
                                    }`}
                                >
                                    {result.success
                                        ? "Intervention Created!"
                                        : "Failed to Create Intervention"}
                                </h4>

                                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                                    {result.message}
                                </p>

                                {result.errors?.length > 0 && (
                                    <div className="mt-5 text-left max-h-40 overflow-y-auto rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Errors
                                        </div>
                                        <ul className="space-y-1">
                                            {result.errors.map((err, i) => (
                                                <li
                                                    key={i}
                                                    className="text-xs text-red-600 dark:text-red-400"
                                                >
                                                    • {err}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                            <button
                                onClick={() => {
                                    setResult(null);
                                    setNotes("");
                                    setDeadlineAt("");
                                    setTasks([]);
                                    setNewTask("");
                                    setSelectedTier(null);
                                    setSelectedType(null);
                                    setStep(STEP_SELECT_INTERVENTION);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Try Another
                            </button>
                            <button
                                onClick={handleClose}
                                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

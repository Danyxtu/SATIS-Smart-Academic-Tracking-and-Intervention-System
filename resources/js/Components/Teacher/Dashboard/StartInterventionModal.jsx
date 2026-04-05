import React, { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/Components/ui/dialog";
import axios from "axios";
import {
    X,
    Search,
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
const STEP_SELECT_STUDENT = 1;
const STEP_SELECT_INTERVENTION = 2;
const STEP_CONFIRM = 3;
const STEP_RESULT = 4;

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

/**
 * StartInterventionModal – A reusable multi-step modal for creating interventions.
 *
 * Step 1 → Select a student from the priority list
 * Step 2 → Select tier and intervention type
 * Step 3 → Add notes, optional tasks, and confirm
 * Step 4 → Result (success / error)
 *
 * All steps are fully reversible.
 *
 * Props:
 *  - show              (boolean)  Whether the modal is visible
 *  - onClose           (function) Callback to close the modal
 *  - attentionStudents (array)    Flat list with { at_risk, needs_attention, recent_decline }
 */
export default function StartInterventionModal({
    show,
    onClose,
    attentionStudents = [],
}) {
    /* ── shared state ── */
    const [step, setStep] = useState(STEP_SELECT_STUDENT);
    const [searchQuery, setSearchQuery] = useState("");

    /* ── selection state ── */
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedTier, setSelectedTier] = useState(null);
    const [selectedType, setSelectedType] = useState(null);

    /* ── form state ── */
    const [notes, setNotes] = useState("");
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");
    const [sendEmail, setSendEmail] = useState(true);

    /* ── submission state ── */
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    /* ── derived: flatten all students ── */
    const allStudents = useMemo(() => {
        const students = Array.isArray(attentionStudents)
            ? attentionStudents
            : [];

        return students.map((student) => {
            // Use a deterministic primary category for badge display.
            let riskLevel = "needs_attention";
            if (student.at_risk) {
                riskLevel = "at_risk";
            } else if (student.recent_decline) {
                riskLevel = "recent_decline";
            }

            return {
                ...student,
                riskLevel,
            };
        });
    }, [attentionStudents]);

    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return allStudents;
        const q = searchQuery.toLowerCase();
        return allStudents.filter(
            (s) =>
                (s.student_name ?? s.name ?? "").toLowerCase().includes(q) ||
                (s.subject ?? "").toLowerCase().includes(q),
        );
    }, [allStudents, searchQuery]);

    /* ── helpers ── */
    const resetAll = useCallback(() => {
        setStep(STEP_SELECT_STUDENT);
        setSearchQuery("");
        setSelectedStudent(null);
        setSelectedTier(null);
        setSelectedType(null);
        setNotes("");
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

    const riskBadge = (level) => {
        const map = {
            at_risk: {
                bg: "bg-red-100 dark:bg-red-900/30",
                text: "text-red-700 dark:text-red-400",
                label: "At Risk",
            },
            needs_attention: {
                bg: "bg-amber-100 dark:bg-amber-900/30",
                text: "text-amber-700 dark:text-amber-400",
                label: "Needs Attention",
            },
            recent_decline: {
                bg: "bg-blue-100 dark:bg-blue-900/30",
                text: "text-blue-700 dark:text-blue-400",
                label: "Recent Decline",
            },
        };
        return map[level] ?? map.needs_attention;
    };

    const recommendationForStudent = useMemo(() => {
        if (!selectedStudent) {
            return null;
        }

        if (selectedStudent.at_risk) {
            return {
                tierId: "tier3",
                label: "Tier 3 – Intensive Intervention",
                reason: "Student is currently At Risk.",
            };
        }

        if (selectedStudent.recent_decline && selectedStudent.needs_attention) {
            return {
                tierId: "tier2",
                label: "Tier 2 – Targeted Support",
                reason: "Student has declining grades and absences under Needs Attention.",
            };
        }

        if (selectedStudent.recent_decline) {
            return {
                tierId: "tier1",
                label: "Tier 1 – Early Intervention",
                reason: "Student has declining grades.",
            };
        }

        return null;
    }, [selectedStudent]);

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
    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setStep(STEP_SELECT_INTERVENTION);
    };
    const handleSelectType = (tier, type) => {
        setSelectedTier(tier);
        setSelectedType(type);
        // Reset tasks if switching away from task_list
        if (type.key !== "task_list") setTasks([]);
        setStep(STEP_CONFIRM);
    };
    const handleBackToStudents = () => {
        setSelectedStudent(null);
        setSelectedTier(null);
        setSelectedType(null);
        setNotes("");
        setTasks([]);
        setStep(STEP_SELECT_STUDENT);
    };
    const handleBackToIntervention = () => {
        setSelectedTier(null);
        setSelectedType(null);
        setNotes("");
        setTasks([]);
        setStep(STEP_SELECT_INTERVENTION);
    };

    /* ── submit via axios ── */
    const handleSubmit = async () => {
        if (!selectedStudent || !selectedType) return;

        setSubmitting(true);
        try {
            const payload = {
                enrollment_id: selectedStudent.enrollment_id,
                type: selectedType.key,
                notes: notes || null,
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
                    `Intervention for ${selectedStudent.student_name ?? selectedStudent.name ?? "the student"} is now active.`,
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
    const stepLabels = ["Student", "Intervention", "Confirm", "Result"];

    /* ────────────────────────────────────────────────────────────────────── */
    /*  RENDER                                                              */
    /* ────────────────────────────────────────────────────────────────────── */
    return (
        <Dialog
            open={show}
            onOpenChange={(open) => {
                if (!open) handleClose();
            }}
        >
            <DialogContent className="max-w-2xl p-0">
                <DialogTitle className="sr-only">
                    Start Intervention
                </DialogTitle>
                <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                    {/* ── Header ── */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <ShieldAlert className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">
                                        Start Intervention
                                    </h3>
                                    <p className="text-sm text-indigo-100">
                                        {step === STEP_SELECT_STUDENT &&
                                            "Select a student to intervene"}
                                        {step === STEP_SELECT_INTERVENTION &&
                                            `Choose intervention for ${selectedStudent?.student_name ?? selectedStudent?.name}`}
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

                    {/* ─────────── STEP 1 : SELECT STUDENT ─────────── */}
                    {step === STEP_SELECT_STUDENT && (
                        <>
                            <div className="px-6 pt-5 pb-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        placeholder="Search students by name or subject…"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    {filteredStudents.length}{" "}
                                    {filteredStudents.length === 1
                                        ? "student"
                                        : "students"}{" "}
                                    needing attention
                                </p>
                            </div>

                            <div className="px-6 pb-2 max-h-[440px] overflow-y-auto">
                                {filteredStudents.length > 0 ? (
                                    <div className="space-y-2">
                                        {filteredStudents.map(
                                            (student, idx) => {
                                                const badge = riskBadge(
                                                    student.riskLevel,
                                                );
                                                const fullName =
                                                    student.student_name ??
                                                    student.name ??
                                                    "Student";
                                                const gradeDisplay =
                                                    typeof student.grade ===
                                                    "number"
                                                        ? `${student.grade}%`
                                                        : "N/A";
                                                return (
                                                    <button
                                                        key={`${student.enrollment_id}-${idx}`}
                                                        type="button"
                                                        onClick={() =>
                                                            handleSelectStudent(
                                                                student,
                                                            )
                                                        }
                                                        disabled={
                                                            !student.enrollment_id
                                                        }
                                                        className="w-full group flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-200 cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {/* Avatar */}
                                                        <img
                                                            src={
                                                                student.avatar ||
                                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff`
                                                            }
                                                            alt={fullName}
                                                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                                        />
                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 truncate">
                                                                    {fullName}
                                                                </h4>
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg} ${badge.text}`}
                                                                >
                                                                    {
                                                                        badge.label
                                                                    }
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                                {student.subject ??
                                                                    "—"}{" "}
                                                                · Grade:{" "}
                                                                {gradeDisplay}
                                                            </p>
                                                        </div>
                                                        {/* Active intervention indicator */}
                                                        {student.intervention && (
                                                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Active
                                                            </span>
                                                        )}
                                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 flex-shrink-0 transition-colors" />
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                            {searchQuery
                                                ? "No Matching Students"
                                                : "No Students Need Intervention"}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                            {searchQuery
                                                ? "Try a different search term."
                                                : "All students are performing well!"}
                                        </p>
                                        {searchQuery && (
                                            <button
                                                onClick={() =>
                                                    setSearchQuery("")
                                                }
                                                className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                Clear search
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}

                    {/* ─────────── STEP 2 : SELECT INTERVENTION ─────────── */}
                    {step === STEP_SELECT_INTERVENTION && (
                        <>
                            <div className="px-6 py-4">
                                {/* Selected student badge */}
                                <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                    <img
                                        src={
                                            selectedStudent?.avatar ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent?.student_name ?? selectedStudent?.name ?? "S")}&background=6366f1&color=fff`
                                        }
                                        alt=""
                                        className="w-9 h-9 rounded-full object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                                            {selectedStudent?.student_name ??
                                                selectedStudent?.name}
                                        </p>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate">
                                            {selectedStudent?.subject ?? "—"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleBackToStudents}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        Change
                                    </button>
                                </div>

                                {/* Recommendation */}
                                <div
                                    className={`mb-3 rounded-lg border px-3 py-2 ${
                                        recommendationForStudent
                                            ? "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20"
                                            : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/30"
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2
                                            className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                                                recommendationForStudent
                                                    ? "text-indigo-600 dark:text-indigo-400"
                                                    : "text-gray-500 dark:text-gray-400"
                                            }`}
                                        />
                                        <div>
                                            <p
                                                className={`text-xs font-semibold ${
                                                    recommendationForStudent
                                                        ? "text-indigo-900 dark:text-indigo-200"
                                                        : "text-gray-700 dark:text-gray-300"
                                                }`}
                                            >
                                                {recommendationForStudent
                                                    ? `Recommended: ${recommendationForStudent.label}`
                                                    : "No tier recommendation from current rules"}
                                            </p>
                                            <p
                                                className={`text-xs ${
                                                    recommendationForStudent
                                                        ? "text-indigo-700 dark:text-indigo-300"
                                                        : "text-gray-500 dark:text-gray-400"
                                                }`}
                                            >
                                                {recommendationForStudent
                                                    ? recommendationForStudent.reason
                                                    : "Rules apply only to At Risk students, or students with declining grades."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tiers */}
                                <div className="max-h-[46vh] overflow-y-auto pr-1">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        {TIERS.map((tier) => {
                                            const TierIcon = tier.icon;
                                            const tierStyles = {
                                                tier1: {
                                                    cardBg: "bg-emerald-50/60 dark:bg-emerald-900/10",
                                                    cardBorder:
                                                        "border-emerald-200 dark:border-emerald-800",
                                                    cardHover:
                                                        "hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
                                                    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
                                                    iconText:
                                                        "text-emerald-700 dark:text-emerald-400",
                                                },
                                                tier2: {
                                                    cardBg: "bg-amber-50/60 dark:bg-amber-900/10",
                                                    cardBorder:
                                                        "border-amber-200 dark:border-amber-800",
                                                    cardHover:
                                                        "hover:bg-amber-50 dark:hover:bg-amber-900/20",
                                                    iconBg: "bg-amber-100 dark:bg-amber-900/30",
                                                    iconText:
                                                        "text-amber-700 dark:text-amber-400",
                                                },
                                                tier3: {
                                                    cardBg: "bg-red-50/60 dark:bg-red-900/10",
                                                    cardBorder:
                                                        "border-red-200 dark:border-red-800",
                                                    cardHover:
                                                        "hover:bg-red-50 dark:hover:bg-red-900/20",
                                                    iconBg: "bg-red-100 dark:bg-red-900/30",
                                                    iconText:
                                                        "text-red-700 dark:text-red-400",
                                                },
                                            };
                                            const style =
                                                tierStyles[tier.id] ??
                                                tierStyles.tier2;
                                            const isRecommendedTier =
                                                recommendationForStudent?.tierId ===
                                                tier.id;

                                            return (
                                                <div
                                                    key={tier.id}
                                                    className={`flex min-h-[220px] flex-col overflow-hidden rounded-xl border ${
                                                        isRecommendedTier
                                                            ? "border-indigo-400 ring-1 ring-indigo-300 dark:border-indigo-500 dark:ring-indigo-800"
                                                            : "border-gray-200 dark:border-gray-700"
                                                    }`}
                                                >
                                                    {/* Tier header */}
                                                    <div
                                                        className={`px-4 py-3 bg-gradient-to-r ${tier.gradient} flex items-start justify-between gap-2`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <TierIcon className="w-5 h-5 text-white" />
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-white">
                                                                    {tier.label}
                                                                </h4>
                                                                <p className="text-xs text-white/70">
                                                                    {
                                                                        tier.description
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {isRecommendedTier && (
                                                            <span className="inline-flex items-center rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                                Recommended
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Types */}
                                                    <div className="flex-1 space-y-2 p-3">
                                                        {tier.types.map(
                                                            (type) => {
                                                                const TypeIcon =
                                                                    type.icon;
                                                                return (
                                                                    <button
                                                                        key={
                                                                            type.key
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleSelectType(
                                                                                tier,
                                                                                type,
                                                                            )
                                                                        }
                                                                        className={`group flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all hover:shadow-sm ${style.cardBg} ${style.cardBorder} ${style.cardHover}`}
                                                                    >
                                                                        <div
                                                                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}
                                                                        >
                                                                            <TypeIcon
                                                                                className={`h-4 w-4 ${style.iconText}`}
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-medium text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                                                                                {
                                                                                    type.label
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                {
                                                                                    type.description
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 flex-shrink-0 transition-colors" />
                                                                    </button>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                                <button
                                    onClick={handleBackToStudents}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}

                    {/* ─────────── STEP 3 : CONFIRM ─────────── */}
                    {step === STEP_CONFIRM && (
                        <>
                            <div className="px-6 py-5 space-y-5 max-h-[520px] overflow-y-auto">
                                {/* Summary cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Student */}
                                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                        <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-500 dark:text-indigo-400 mb-1">
                                            Student
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={
                                                    selectedStudent?.avatar ||
                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent?.student_name ?? selectedStudent?.name ?? "S")}&background=6366f1&color=fff`
                                                }
                                                alt=""
                                                className="w-7 h-7 rounded-full object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                                                    {selectedStudent?.student_name ??
                                                        selectedStudent?.name}
                                                </p>
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate">
                                                    {selectedStudent?.subject ??
                                                        "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Intervention */}
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
                                            <p
                                                className={`text-sm font-semibold text-${selectedTier?.color}-900 dark:text-${selectedTier?.color}-200`}
                                            >
                                                {selectedType?.label}
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
                                        onChange={(e) =>
                                            setNotes(e.target.value)
                                        }
                                        rows={3}
                                        placeholder="Add any additional notes or context for this intervention…"
                                        className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all"
                                    />
                                </div>

                                {/* Tasks (only for task_list type) */}
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
                                                    (e.preventDefault(),
                                                    addTask())
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
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
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
                                    onClick={handleBackToIntervention}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                        submitting
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
                                        : "Confirm Intervention"}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ─────────── STEP 4 : RESULT ─────────── */}
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
                                        setTasks([]);
                                        setNewTask("");
                                        setStep(STEP_SELECT_STUDENT);
                                        setSelectedStudent(null);
                                        setSelectedTier(null);
                                        setSelectedType(null);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Start Another
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

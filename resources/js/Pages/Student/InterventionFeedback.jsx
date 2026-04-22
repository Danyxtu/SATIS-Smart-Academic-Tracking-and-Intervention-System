import React, { useState, useEffect, useRef } from "react";
import StudentLayout from "@/Layouts/StudentLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    AlertTriangle,
    BarChart2,
    CheckSquare,
    Square,
    MessageSquare,
    Bell,
    ChevronDown,
    ChevronUp,
    ListTodo,
    CheckCircle2,
    Clock,
    User,
    BookOpen,
    Inbox,
    Target,
    TrendingUp,
    AlertCircle,
    Loader2,
    Paperclip,
    FileText,
} from "lucide-react";

// --- Filter Tabs Component ---
const FilterTabs = ({ activeTab, setActiveTab, counts }) => {
    const tabs = [
        { key: "all", label: "All", count: counts.all },
        { key: "active", label: "Active", count: counts.active },
        { key: "completed", label: "Completed", count: counts.completed },
    ];

    return (
        <div className="flex items-center space-x-2 rounded-full bg-pink-100 dark:bg-pink-900/25 p-1.5">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                        activeTab === tab.key
                            ? "bg-white dark:bg-gray-900 text-pink-700 dark:text-pink-300 shadow-md"
                            : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800"
                    }`}
                >
                    {tab.label}
                    {tab.count > 0 && (
                        <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${
                                activeTab === tab.key
                                    ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            }`}
                        >
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

// --- Stat Card Component ---
const StatCard = ({ label, value, icon: Icon, color = "pink" }) => {
    const colorClasses = {
        pink: "text-pink-600 bg-pink-100 dark:text-pink-300 dark:bg-pink-900/30",
        green: "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30",
        blue: "text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30",
        orange: "text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30",
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-3.5 flex items-center gap-3 border border-transparent dark:border-gray-700">
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {value}
                </p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {label}
                </p>
            </div>
        </div>
    );
};

// --- Priority Tag Component ---
const PriorityTag = ({ level }) => {
    const colors = {
        High: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50",
        Medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700/50",
        Low: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50",
    };
    const icons = {
        High: AlertTriangle,
        Medium: BarChart2,
        Low: CheckCircle2,
    };
    const Icon = icons[level];

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${colors[level]}`}
        >
            <Icon size={12} />
            {level}
        </span>
    );
};

// --- Status Badge Component ---
const StatusBadge = ({ status }) => {
    const styles = {
        active: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50",
        completed:
            "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50",
        pending:
            "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50",
    };

    return (
        <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                styles[status] || styles.pending
            }`}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

// --- Mini Stat Component ---
const MiniStat = ({ label, value, color = "pink" }) => {
    const bgColors = {
        pink: "bg-pink-50 dark:bg-pink-900/20 border-pink-100 dark:border-pink-700/40",
        red: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-700/40",
        yellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-700/40",
        green: "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-700/40",
    };

    const textColors = {
        pink: "text-pink-700",
        red: "text-red-700",
        yellow: "text-yellow-700",
        green: "text-green-700",
    };

    return (
        <div
            className={`flex-1 rounded-lg p-3 text-center border ${bgColors[color]}`}
        >
            <p className={`text-xl font-bold ${textColors[color]}`}>
                {value ?? "N/A"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">{label}</p>
        </div>
    );
};

// --- Task Item Component ---
const TaskItem = ({ task }) => {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleComplete = () => {
        if (task.completed || isLoading || task.isPendingReview) return;

        if (task.delivery_mode === "remote") {
            fileInputRef.current?.click();
            return;
        }

        setIsLoading(true);
        router.post(
            route("interventions.tasks.complete", { task: task.id }),
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
        if (!allowedTypes.includes(file.type)) {
            alert("Please upload a PDF or an image (JPG, PNG).");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("File size should be less than 5MB.");
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append("proof", file);

        router.post(route("interventions.tasks.complete", { task: task.id }), formData, {
            preserveScroll: true,
            onFinish: () => {
                setIsLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            },
        });
    };

    return (
        <div className="flex flex-col border-b border-gray-100 dark:border-gray-800/50 last:border-0">
            <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 flex-1">
                    <button
                        onClick={handleComplete}
                        disabled={task.completed || isLoading || task.isPendingReview}
                        className={`flex-shrink-0 transition-colors ${
                            task.completed
                                ? "text-green-600"
                                : task.isPendingReview
                                  ? "text-amber-500"
                                  : "text-gray-400 dark:text-gray-500 hover:text-pink-500"
                        }`}
                        title={
                            task.delivery_mode === "remote"
                                ? "Upload proof of completion"
                                : "Mark as completed"
                        }
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : task.completed ? (
                            <CheckSquare size={20} />
                        ) : task.isPendingReview ? (
                            <Clock size={20} />
                        ) : (
                            <Square size={20} />
                        )}
                    </button>
                    <div className="flex flex-col">
                        <span
                            className={`text-sm font-medium ${
                                task.completed
                                    ? "line-through text-gray-400 dark:text-gray-500"
                                    : "text-gray-700 dark:text-gray-200"
                            }`}
                        >
                            {task.text}
                        </span>
                        {task.delivery_mode === "remote" && !task.completed && (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                                <Paperclip size={10} />
                                Remote Submission Required
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {task.isPendingReview && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-tight border border-amber-200 dark:border-amber-800/50">
                            Pending Review
                        </span>
                    )}
                    
                    {task.delivery_mode === "remote" && !task.completed && !task.isPendingReview && (
                        <button
                            onClick={handleComplete}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                        >
                            <Paperclip size={14} />
                            Submit Proof
                        </button>
                    )}
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,image/*"
                    />
                </div>
            </div>
            
            {task.description && task.description !== task.text && (
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-8 pb-3 -mt-1 pr-4 italic">
                    {task.description}
                </p>
            )}
        </div>
    );
};

// --- Intervention Card Component ---
const InterventionCard = ({ intervention }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [completionNotes, setCompletionNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const gradeColor =
        intervention.currentGrade !== null
            ? intervention.currentGrade < 70
                ? "red"
                : intervention.currentGrade < 75
                  ? "yellow"
                  : "green"
            : "pink";

    const attendanceColor =
        intervention.attendanceRate < 80
            ? "red"
            : intervention.attendanceRate < 90
              ? "yellow"
              : "green";

    const handleRequestCompletion = () => {
        setIsSubmitting(true);
        router.post(
            route("interventions.request-completion", {
                intervention: intervention.id,
            }),
            { notes: completionNotes },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowCompletionModal(false);
                    setCompletionNotes("");
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                {intervention.subjectName}
                            </h3>
                            <StatusBadge status={intervention.status} />
                            {intervention.isTier3 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                    Tier 3
                                </span>
                            )}
                        </div>
                        {intervention.subjectSection && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Section: {intervention.subjectSection}
                            </p>
                        )}
                    </div>
                    <PriorityTag level={intervention.priority} />
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                        <User size={12} />
                        {intervention.teacherName}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {intervention.startDate}
                    </span>
                    <span className="flex items-center gap-1 text-pink-600 font-medium">
                        <Target size={12} />
                        {intervention.typeLabel}
                    </span>
                    {intervention.deadlineLabel && (
                        <span
                            className={`flex items-center gap-1 font-medium ${
                                intervention.isDeadlineOverdue
                                    ? "text-red-600"
                                    : "text-amber-600"
                            }`}
                        >
                            {intervention.isDeadlineOverdue ? (
                                <AlertCircle size={12} />
                            ) : (
                                <Clock size={12} />
                            )}
                            {intervention.isDeadlineOverdue
                                ? "Deadline overdue"
                                : `Deadline: ${intervention.deadlineLabel}`}
                        </span>
                    )}
                </div>
            </div>

            {/* Completion Status Banner for Tier 3 */}
            {intervention.isTier3 && intervention.isPendingApproval && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-5 py-3">
                    <div className="flex items-center gap-2 text-yellow-700">
                        <Clock size={16} className="animate-pulse" />
                        <p className="text-sm font-medium">
                            Completion request pending teacher approval
                        </p>
                    </div>
                    {intervention.completionRequestNotes && (
                        <p className="text-xs text-yellow-600 mt-1 pl-6">
                            Your notes: "{intervention.completionRequestNotes}"
                        </p>
                    )}
                </div>
            )}

            {intervention.isTier3 &&
                intervention.rejectedAt &&
                !intervention.completionRequestedAt && (
                    <div className="bg-red-50 border-b border-red-200 px-5 py-3">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle size={16} />
                            <p className="text-sm font-medium">
                                Previous completion request was not approved
                            </p>
                        </div>
                        {intervention.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1 pl-6">
                                Reason: "{intervention.rejectionReason}"
                            </p>
                        )}
                    </div>
                )}

            {/* Content */}
            <div className="p-5">
                {/* Notes */}
                {intervention.notes && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        {intervention.notes}
                    </p>
                )}

                {intervention.deadlineLabel && (
                    <div
                        className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                            intervention.isDeadlineOverdue
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                    >
                        <p className="font-medium">
                            {intervention.isDeadlineOverdue
                                ? "This intervention deadline has passed. Please contact your teacher immediately."
                                : "Complete this intervention on or before:"}
                        </p>
                        <p className="mt-0.5">{intervention.deadlineLabel}</p>
                    </div>
                )}

                {/* Stats */}
                <div className="flex gap-3 mb-4">
                    <MiniStat
                        label="Current Grade"
                        value={
                            intervention.currentGrade !== null
                                ? `${intervention.currentGrade}%`
                                : "N/A"
                        }
                        color={gradeColor}
                    />
                    <MiniStat
                        label="Attendance"
                        value={`${intervention.attendanceRate}%`}
                        color={attendanceColor}
                    />
                    <MiniStat
                        label="Missing Work"
                        value={intervention.missingWork}
                        color={intervention.missingWork > 0 ? "red" : "green"}
                    />
                </div>

                {/* Tasks */}
                {intervention.tasks.length > 0 && (
                    <div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2 hover:text-pink-600 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <ListTodo size={16} />
                                Action Plan ({intervention.completedTasks}/
                                {intervention.totalTasks})
                            </span>
                            {isExpanded ? (
                                <ChevronUp size={16} />
                            ) : (
                                <ChevronDown size={16} />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="space-y-1 pl-1">
                                {intervention.tasks.map((task) => (
                                    <TaskItem key={task.id} task={task} />
                                ))}
                            </div>
                        )}

                        {/* Progress bar */}
                        <div className="mt-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                    className="bg-pink-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${
                                            intervention.totalTasks > 0
                                                ? (intervention.completedTasks /
                                                      intervention.totalTasks) *
                                                  100
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {intervention.tasks.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No action plan assigned yet.
                    </p>
                )}

                {/* Tier 3 Completion Request Button */}
                {intervention.isTier3 && intervention.canRequestCompletion && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => setShowCompletionModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium shadow-lg shadow-green-200"
                        >
                            <CheckCircle2 size={18} />
                            Request Intervention Completion
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                            Your teacher will review and approve your completion
                            request
                        </p>
                    </div>
                )}

                {/* Completed Badge */}
                {intervention.status === "completed" &&
                    intervention.approvedAt && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle2 size={20} />
                                    <p className="font-semibold">
                                        Intervention Completed!
                                    </p>
                                </div>
                                <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                                    Approved on {intervention.approvedAt}
                                </p>
                            </div>
                        </div>
                    )}
            </div>

            {/* Completion Request Modal */}
            {showCompletionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-transparent dark:border-gray-700">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <CheckCircle2 size={20} />
                                Request Completion
                            </h3>
                            <p className="text-green-100 text-sm">
                                {intervention.subjectName}
                            </p>
                        </div>
                        <div className="p-5">
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                You're requesting to mark this Tier 3
                                intervention as complete. Your teacher will
                                review and approve your request.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notes for your teacher (optional)
                                </label>
                                <textarea
                                    value={completionNotes}
                                    onChange={(e) =>
                                        setCompletionNotes(e.target.value)
                                    }
                                    placeholder="Describe what you've accomplished or any additional information..."
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    maxLength={1000}
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-1">
                                    {completionNotes.length}/1000
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowCompletionModal(false);
                                        setCompletionNotes("");
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestCompletion}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} />
                                            Submit Request
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Feedback Item Component ---
const FeedbackItem = ({ feedback, isHighlighted }) => {
    const [isLoading, setIsLoading] = useState(false);
    const itemRef = useRef(null);

    // Scroll into view and animate when highlighted
    useEffect(() => {
        if (isHighlighted && itemRef.current) {
            itemRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [isHighlighted]);

    const typeIcons = {
        feedback: MessageSquare,
        nudge: Bell,
        task: ListTodo,
        alert: AlertCircle,
        extension: Clock,
    };

    const typeColors = {
        feedback:
            "text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30",
        nudge: "text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30",
        task: "text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900/30",
        alert: "text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/30",
        extension:
            "text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30",
    };

    const Icon = typeIcons[feedback.type] || MessageSquare;
    const colorClass = typeColors[feedback.type] || typeColors.feedback;

    const handleMarkRead = () => {
        if (feedback.isRead || isLoading) return;

        setIsLoading(true);
        router.post(
            route("feedback.read", { notification: feedback.id }),
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <div
            ref={itemRef}
            className={`p-4 rounded-xl border transition-colors ${
                feedback.isRead
                    ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700"
                    : "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700/50"
            } ${
                isHighlighted
                    ? "animate-highlight-blink ring-2 ring-pink-500"
                    : ""
            }`}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                {feedback.senderName}
                            </p>
                            {feedback.subjectName && (
                                <p className="text-xs text-pink-600">
                                    {feedback.subjectName}
                                </p>
                            )}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {feedback.time}
                        </span>
                    </div>
                    {feedback.title && (
                        <p className="font-medium text-gray-700 dark:text-gray-200 text-sm mt-1">
                            {feedback.title}
                        </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {feedback.message}
                    </p>
                    {feedback.type === "extension" &&
                        feedback.deadlineLabel && (
                            <p className="text-xs text-amber-600 dark:text-amber-300 font-medium mt-1.5">
                                Updated deadline: {feedback.deadlineLabel}
                            </p>
                        )}
                    {!feedback.isRead && (
                        <button
                            onClick={handleMarkRead}
                            disabled={isLoading}
                            className="text-xs text-pink-600 hover:text-pink-700 mt-2 font-medium flex items-center gap-1"
                        >
                            {isLoading ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <CheckCircle2 size={12} />
                            )}
                            Mark as read
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Recent Feedback Card Component ---
const RecentFeedbackCard = ({ feedback, highlightId }) => {
    const [showAll, setShowAll] = useState(false);

    // Auto-expand if highlighted feedback is in the hidden portion
    useEffect(() => {
        if (highlightId && feedback.length > 3) {
            const highlightIndex = feedback.findIndex(
                (fb) => fb.id.toString() === highlightId,
            );
            if (highlightIndex >= 3) {
                setShowAll(true);
            }
        }
    }, [highlightId, feedback]);

    const displayedFeedback = showAll ? feedback : feedback.slice(0, 3);

    if (feedback.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 border border-transparent dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <MessageSquare size={20} className="text-pink-600" />
                    Recent Feedback
                </h3>
                <div className="text-center py-6">
                    <Inbox
                        size={40}
                        className="mx-auto text-gray-300 dark:text-gray-500 mb-2"
                    />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No feedback yet
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                        Teacher feedback will appear here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 border border-transparent dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <MessageSquare size={20} className="text-pink-600" />
                Recent Feedback
            </h3>
            <div className="space-y-3">
                {displayedFeedback.map((fb) => (
                    <FeedbackItem
                        key={fb.id}
                        feedback={fb}
                        isHighlighted={highlightId === fb.id.toString()}
                    />
                ))}
            </div>
            {feedback.length > 3 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="flex items-center gap-1.5 justify-center w-full mt-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors"
                >
                    {showAll ? "Show Less" : `View All (${feedback.length})`}
                    {showAll ? (
                        <ChevronUp size={16} />
                    ) : (
                        <ChevronDown size={16} />
                    )}
                </button>
            )}
        </div>
    );
};

// --- Empty State Component ---
const EmptyState = ({ filter }) => {
    const messages = {
        all: {
            title: "No Interventions Yet",
            description:
                "You're doing great! No interventions have been assigned to you.",
            icon: CheckCircle2,
            iconColor: "text-green-500",
        },
        active: {
            title: "No Active Interventions",
            description:
                "You have no active interventions at the moment. Keep up the good work!",
            icon: TrendingUp,
            iconColor: "text-blue-500",
        },
        completed: {
            title: "No Completed Interventions",
            description: "Completed interventions will appear here.",
            icon: Clock,
            iconColor: "text-gray-400",
        },
    };

    const msg = messages[filter] || messages.all;
    const Icon = msg.icon;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-12 text-center border border-transparent dark:border-gray-700">
            <Icon size={64} className={`mx-auto ${msg.iconColor} mb-4`} />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {msg.title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
                {msg.description}
            </p>
        </div>
    );
};

// --- Main Page Component ---
const InterventionFeedback = ({
    interventions = [],
    stats = {},
    recentFeedback = [],
}) => {
    const [activeTab, setActiveTab] = useState("all");
    const { url } = usePage();

    // Extract highlight parameter from URL
    const urlParams = new URLSearchParams(url.split("?")[1] || "");
    const highlightId = urlParams.get("highlight");

    // Filter interventions based on active tab
    const filteredInterventions = interventions.filter((intervention) => {
        if (activeTab === "all") return true;
        return intervention.status === activeTab;
    });

    // Calculate tab counts
    const counts = {
        all: interventions.length,
        active: interventions.filter((i) => i.status === "active").length,
        completed: interventions.filter((i) => i.status === "completed").length,
    };

    return (
        <>
            <Head title="Interventions & Feedback" />

            {/* Custom CSS for blink animation */}
            <style>{`
                @keyframes highlight-blink {
                    0%, 100% { 
                        background-color: rgb(253 242 248); 
                        box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.3);
                    }
                    25%, 75% { 
                        background-color: rgb(252 231 243); 
                        box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.6);
                    }
                    50% { 
                        background-color: rgb(251 207 232); 
                        box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.8);
                    }
                }
                .animate-highlight-blink {
                    animation: highlight-blink 0.5s ease-in-out 2;
                }
            `}</style>

            <div className="max-w-7xl mx-auto space-y-5">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
                            <ListTodo size={20} className="text-pink-600" />
                            Interventions & Feedback
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Track your academic interventions and teacher
                            feedback
                        </p>
                    </div>
                    <FilterTabs
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        counts={counts}
                    />
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Active Interventions"
                        value={stats.activeInterventions || 0}
                        icon={AlertTriangle}
                        color="pink"
                    />
                    <StatCard
                        label="Completed"
                        value={stats.completedInterventions || 0}
                        icon={CheckCircle2}
                        color="green"
                    />
                    <StatCard
                        label="Feedback Messages"
                        value={stats.totalFeedback || 0}
                        icon={MessageSquare}
                        color="blue"
                    />
                    <StatCard
                        label="Task Success Rate"
                        value={`${stats.taskSuccessRate || 0}%`}
                        icon={TrendingUp}
                        color="orange"
                    />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                    {/* Left Column: Interventions */}
                    <div className="lg:col-span-2 space-y-4">
                        {filteredInterventions.length > 0 ? (
                            filteredInterventions.map((intervention) => (
                                <InterventionCard
                                    key={intervention.id}
                                    intervention={intervention}
                                />
                            ))
                        ) : (
                            <EmptyState filter={activeTab} />
                        )}
                    </div>

                    {/* Right Column: Feedback */}
                    <div className="space-y-4">
                        <RecentFeedbackCard
                            feedback={recentFeedback}
                            highlightId={highlightId}
                        />

                        {/* Tips Card */}
                        <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-md p-5 text-white">
                            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                <BookOpen size={18} />
                                Quick Tips
                            </h3>
                            <ul className="space-y-2 text-sm text-pink-100">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2
                                        size={16}
                                        className="flex-shrink-0 mt-0.5"
                                    />
                                    Complete tasks to improve your progress
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2
                                        size={16}
                                        className="flex-shrink-0 mt-0.5"
                                    />
                                    Communicate with your teachers regularly
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2
                                        size={16}
                                        className="flex-shrink-0 mt-0.5"
                                    />
                                    Check feedback daily for updates
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

InterventionFeedback.layout = (page) => <StudentLayout children={page} />;

export default InterventionFeedback;

import React, { useEffect, useState, useMemo, useRef } from "react";
import EmptyStudentState from "@/Components/Teacher/MyClasses/EmptyStudentState";
import { router } from "@inertiajs/react";

import {
    Search,
    FileDown,
    Upload,
    Plus,
    Settings,
    ChevronUp,
    ChevronDown,
    ChevronRight,
    Users,
    X,
} from "lucide-react";
// Utils
import {
    calculateFinalGrade,
    calculateOverallFinalGrade,
    calculateExpectedQuarterlyGrade,
    hasQuarterlyExamScores,
    isQuarterComplete,
} from "@/Utils/Teacher/MyClasses/gradeCalculations";
// Modals
import {
    AddStudentModal,
    DeleteGradeTaskModal,
    EditGradeCategoriesModal,
    StudentStatusModal,
    TemporaryPasswordModal,
    ClassList,
    GradeSubmissionModal,
    StartQ2ConfirmModal,
} from "@/Components/Teacher/MyClasses";

// Fallback Grade Categories
const FALLBACK_GRADE_CATEGORIES = [
    { id: "written_works", label: "Written Works", weight: 0.3, tasks: [] },
    {
        id: "performance_task",
        label: "Performance Task",
        weight: 0.4,
        tasks: [],
    },
    { id: "quarterly_exam", label: "Quarterly Exam", weight: 0.3, tasks: [] },
];

// Helper Functions
const buildStudentKey = (student, index) => {
    const enrollmentPart = student?.enrollment_id ?? student?.pivot?.id;
    const idPart = student?.id;
    const lrnPart = student?.lrn;
    const fallback = `student-${index}`;
    return `${enrollmentPart ?? idPart ?? lrnPart ?? fallback}:${index}`;
};

const getGradeRowColors = (grade) => {
    const numericGrade = parseFloat(grade);
    let colors = {
        row: "bg-white dark:bg-gray-900",
        hoverRow: "hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50",
        leftCell: "bg-white dark:bg-gray-900",
        rightCell: "bg-white dark:bg-gray-900",
    };

    if (grade === "N/A" || isNaN(numericGrade)) {
        colors = {
            row: "bg-gray-50 dark:bg-gray-800",
            hoverRow:
                "hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700/50",
            leftCell: "bg-gray-50 dark:bg-gray-800",
            rightCell: "bg-gray-50 dark:bg-gray-800",
        };
    } else if (numericGrade >= 90) {
        colors = {
            row: "bg-green-50",
            hoverRow: "hover:bg-green-100/50",
            leftCell: "bg-green-50",
            rightCell: "bg-green-50",
        };
    } else if (numericGrade >= 85) {
        colors = {
            row: "bg-blue-50",
            hoverRow: "hover:bg-blue-100/50",
            leftCell: "bg-blue-50",
            rightCell: "bg-blue-50",
        };
    } else if (numericGrade >= 80) {
        colors = {
            row: "bg-yellow-50",
            hoverRow: "hover:bg-yellow-100/50",
            leftCell: "bg-yellow-50",
            rightCell: "bg-yellow-50",
        };
    } else if (numericGrade >= 75) {
        colors = {
            row: "bg-orange-50",
            hoverRow: "hover:bg-orange-100/50",
            leftCell: "bg-orange-50",
            rightCell: "bg-orange-50",
        };
    } else {
        colors = {
            row: "bg-red-50",
            hoverRow: "hover:bg-red-100/50",
            leftCell: "bg-red-50",
            rightCell: "bg-red-50",
        };
    }

    return colors;
};

const formatAcademicMeta = (student) => {
    return [student?.grade_level, student?.strand, student?.track]
        .filter(Boolean)
        .join(" • ");
};

const stripGradePrefix = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/^grade\s+/i, "")
        .trim();
};

const VIEW_QUERY_PARAM = "view";
const TAB_QUERY_PARAM = "tab";
const GRADES_VIEW_QUERY_VALUE = "grades";

const resolveTabFromQuery = ({ tabValue, isQ2Unlocked, isFinalUnlocked }) => {
    if (tabValue === "q2" && isQ2Unlocked) {
        return "q2";
    }

    if (tabValue === "final" && isFinalUnlocked) {
        return "final";
    }

    return "q1";
};

const applyQuarterCategoriesToGradeStructure = ({
    currentGradeStructure,
    quarter,
    categories,
}) => {
    const quarterKey = String(quarter ?? 1);
    const baseStructure =
        currentGradeStructure && typeof currentGradeStructure === "object"
            ? currentGradeStructure
            : {};

    const nextStructure = { ...baseStructure };
    const existingQuarterEntry = nextStructure[quarterKey];

    if (
        existingQuarterEntry &&
        typeof existingQuarterEntry === "object" &&
        !Array.isArray(existingQuarterEntry)
    ) {
        nextStructure[quarterKey] = {
            ...existingQuarterEntry,
            categories,
        };
    } else {
        nextStructure[quarterKey] = { categories };
    }

    // Legacy shape fallback: some views still read from top-level categories.
    if (quarterKey === "1") {
        nextStructure.categories = categories;
    }

    return nextStructure;
};

const GRADE_INPUT_PATTERN = /^\d*(?:\.\d{0,2})?$/;

const normalizeGradeInput = (rawValue, maxScore) => {
    if (rawValue === "" || rawValue === null || rawValue === undefined) {
        return "";
    }

    const value = String(rawValue).trim();

    if (value === "." || !GRADE_INPUT_PATTERN.test(value)) {
        return null;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
        return null;
    }

    const parsedMaxScore = Number(maxScore);
    const maxNumericScore = Number.isFinite(parsedMaxScore)
        ? parsedMaxScore
        : Number.POSITIVE_INFINITY;
    const clampedValue = Math.max(0, Math.min(maxNumericScore, numericValue));

    return clampedValue !== numericValue ? String(clampedValue) : value;
};

const DEFAULT_DELETE_TASK_MODAL_STATE = {
    isOpen: false,
    categoryId: null,
    categoryLabel: "",
    taskId: null,
    taskLabel: "",
    gradedStudentCount: 0,
    requiresTypedConfirmation: false,
};

const DEFAULT_TASK_COLUMN_MODAL_STATE = {
    isOpen: false,
    categoryId: null,
    taskId: null,
};

const escapeRegex = (value = "") =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAutoTaskPrefix = (category = {}) => {
    const categoryId = String(category.id ?? "").toLowerCase();

    if (categoryId.includes("written")) {
        return "ww";
    }

    if (categoryId.includes("performance")) {
        return "pt";
    }

    if (categoryId.includes("quarterly")) {
        return "qe";
    }

    const labelWords = String(category.label ?? "")
        .toLowerCase()
        .match(/[a-z0-9]+/g);

    if (!labelWords || labelWords.length === 0) {
        return "task";
    }

    return labelWords
        .map((word) => word[0])
        .join("")
        .slice(0, 3);
};

const getNextAutoTaskLabel = (category = {}) => {
    const prefix = getAutoTaskPrefix(category);
    const matcher = new RegExp(`^${escapeRegex(prefix)}\\s*(\\d+)$`, "i");

    const maxUsedIndex = (category.tasks ?? []).reduce((maxValue, task) => {
        const currentLabel = String(task?.label ?? "")
            .trim()
            .toLowerCase();
        const matched = currentLabel.match(matcher);

        if (!matched) {
            return maxValue;
        }

        const numericSuffix = Number(matched[1]);
        return Number.isFinite(numericSuffix)
            ? Math.max(maxValue, numericSuffix)
            : maxValue;
    }, 0);

    return `${prefix}${maxUsedIndex + 1}`;
};

const isQuarterlyExamCategory = (category = {}) => {
    const categoryId = String(category.id ?? "").toLowerCase();
    const categoryLabel = String(category.label ?? "").toLowerCase();

    return (
        categoryId === "quarterly_exam" ||
        categoryLabel.includes("quarterly exam")
    );
};

const TaskColumnSummaryModal = ({
    isOpen,
    task,
    categoryLabel,
    summary,
    isSubmitting = false,
    isReadOnly = false,
    onClose,
    onSave,
    onDelete,
    canDelete = true,
}) => {
    const [label, setLabel] = useState("");
    const [total, setTotal] = useState("100");

    useEffect(() => {
        if (!isOpen || !task) {
            return;
        }

        setLabel(String(task.label ?? ""));
        setTotal(String(task.total ?? 100));
    }, [isOpen, task?.id, task?.label, task?.total]);

    if (!isOpen || !task) {
        return null;
    }

    const normalizedLabel = label.trim();
    const normalizedTotal = Number(total);
    const canSave =
        normalizedLabel.length > 0 &&
        Number.isFinite(normalizedTotal) &&
        normalizedTotal > 0;

    const averageScore = summary?.averageScore;
    const highestScore = summary?.highestScore;
    const lowestScore = summary?.lowestScore;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-gray-200 p-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                            Activity Summary
                        </p>
                        <h3 className="text-lg font-bold text-gray-900">
                            {task.label}
                        </h3>
                        <p className="text-xs text-gray-500">{categoryLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close activity summary modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                        <div>
                            <p className="font-semibold text-gray-500">
                                Scored
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                                {summary?.gradedCount ?? 0} /{" "}
                                {summary?.totalStudents ?? 0}
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-500">
                                Total Points
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                                {task.total}
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-500">
                                Average Score
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                                {averageScore == null ? "-" : averageScore}
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-500">Range</p>
                            <p className="text-sm font-bold text-gray-900">
                                {highestScore == null || lowestScore == null
                                    ? "-"
                                    : `${lowestScore} - ${highestScore}`}
                            </p>
                        </div>
                    </div>

                    <form
                        className="space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (isReadOnly || isSubmitting || !canSave) {
                                return;
                            }

                            onSave?.({
                                label: normalizedLabel,
                                total: normalizedTotal,
                            });
                        }}
                    >
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                Activity Name
                            </label>
                            <input
                                type="text"
                                value={label}
                                onChange={(event) =>
                                    setLabel(event.target.value)
                                }
                                disabled={isReadOnly || isSubmitting}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-gray-100"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                Total Points
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="0.5"
                                value={total}
                                onChange={(event) =>
                                    setTotal(event.target.value)
                                }
                                disabled={isReadOnly || isSubmitting}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-gray-100"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Close
                            </button>
                            {!isReadOnly && (
                                <>
                                    {canDelete && (
                                        <button
                                            type="button"
                                            onClick={onDelete}
                                            disabled={isSubmitting}
                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Delete
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={!canSave || isSubmitting}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting ? "Saving..." : "Save"}
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Main Component
const MyClass = (props) => {
    const {
        selectedClassHeading,
        selectedClass,
        roster = [],
        gradeStructure,
        gradeSummaries = {},
        onRefreshClassData,
        isReadOnly = false,
        readOnlyModeLabel = "Archive View Only",
        readOnlyActionMessage = "This class is view-only.",
    } = props;

    // State Management
    const [studentViewMode, setStudentViewMode] = useState("classList");
    const isGradeView = studentViewMode === "gradeOverview";
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [selectedTab, setSelectedTab] = useState("q1");
    const [showFinalUnlockInfo, setShowFinalUnlockInfo] = useState(false);
    const [isStartQ2ModalOpen, setIsStartQ2ModalOpen] = useState(false);
    const currentQuarter = selectedClass?.current_quarter ?? 1;
    const isArchiveReadOnly = Boolean(isReadOnly);
    const readOnlyBadgeLabel = String(readOnlyModeLabel || "View Only");
    const readOnlyHint = String(
        readOnlyActionMessage || "This class is view-only.",
    );
    const isQ2Unlocked = isArchiveReadOnly || currentQuarter >= 2;
    const [searchTerm, setSearchTerm] = useState("");
    const [gradesExpanded, setGradesExpanded] = useState(false);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isEditCategoriesModalOpen, setIsEditCategoriesModalOpen] =
        useState(false);
    const [isStudentStatusModalOpen, setIsStudentStatusModalOpen] =
        useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordModalData, setPasswordModalData] = useState(null);
    const [selectedStudentForStatus, setSelectedStudentForStatus] =
        useState(null);
    const [gradeSubmissionModal, setGradeSubmissionModal] = useState({
        isOpen: false,
        status: null,
        message: "",
    });
    const [dirtyGrades, setDirtyGrades] = useState({});
    const [isImportingGrades, setIsImportingGrades] = useState(false);
    const [isSavingGrades, setIsSavingGrades] = useState(false);
    const [isSavingCategoryTask, setIsSavingCategoryTask] = useState(false);
    const [deleteTaskModal, setDeleteTaskModal] = useState(
        DEFAULT_DELETE_TASK_MODAL_STATE,
    );
    const [taskColumnModal, setTaskColumnModal] = useState(
        DEFAULT_TASK_COLUMN_MODAL_STATE,
    );
    const [collapsedCategories, setCollapsedCategories] = useState({});
    const [sortConfig, setSortConfig] = useState({
        column: null,
        order: "asc",
    });
    const [isUploadingClasslist, setIsUploadingClasslist] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(null);
    const classlistUploadRef = useRef(null);
    const gradeUploadRef = useRef(null);
    const hasHydratedViewFromUrl = useRef(false);
    const [localGradeStructure, setLocalGradeStructure] =
        useState(gradeStructure);

    // Helper Functions
    const isCategoryCollapsed = (categoryId) =>
        collapsedCategories[categoryId] === true;
    const toggleCategoryCollapse = (categoryId) => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };
    const isQuarterlyExam = (category) => {
        return (
            category.id === "quarterly_exam" ||
            category.label?.toLowerCase().includes("quarterly exam")
        );
    };
    const getLatestTask = (category) => {
        const tasks = category?.tasks ?? [];
        if (tasks.length === 0) return null;
        return tasks[tasks.length - 1];
    };
    const handleSortToggle = (column) => {
        setSortConfig((prev) => {
            if (prev.column === column) {
                if (prev.order === "asc") return { column, order: "desc" };
                return { column: null, order: "asc" };
            }
            return { column, order: "asc" };
        });
    };

    // Computed Values
    const dirtyGradeCount = Object.keys(dirtyGrades).length;
    const hasGradeChanges = dirtyGradeCount > 0;
    const quarterStructure =
        localGradeStructure?.[selectedQuarter] ??
        localGradeStructure?.[String(selectedQuarter)];
    const gradeCategories =
        quarterStructure?.categories ||
        localGradeStructure?.categories ||
        FALLBACK_GRADE_CATEGORIES;
    const students = roster;

    const q1Categories = useMemo(
        () =>
            localGradeStructure?.["1"]?.categories ??
            localGradeStructure?.[1]?.categories ??
            localGradeStructure?.categories ??
            FALLBACK_GRADE_CATEGORIES,
        [localGradeStructure],
    );
    const q2Categories = useMemo(
        () =>
            localGradeStructure?.["2"]?.categories ??
            localGradeStructure?.[2]?.categories ??
            localGradeStructure?.categories ??
            FALLBACK_GRADE_CATEGORIES,
        [localGradeStructure],
    );

    const q1HasQuarterlyExam = useMemo(() => {
        return students.some((student) =>
            hasQuarterlyExamScores(student.grades, q1Categories, 1),
        );
    }, [students, q1Categories]);

    const q2HasQuarterlyExam = useMemo(() => {
        return students.some((student) =>
            hasQuarterlyExamScores(student.grades, q2Categories, 2),
        );
    }, [students, q2Categories]);

    const hasEligibleFinalGradeData = useMemo(() => {
        return Object.values(gradeSummaries).some(
            (s) => s.q1_grade != null && s.q2_grade != null,
        );
    }, [gradeSummaries]);

    const isFinalUnlocked = useMemo(() => {
        if (isArchiveReadOnly) return true;
        if (currentQuarter < 2) return false;
        return hasEligibleFinalGradeData;
    }, [isArchiveReadOnly, currentQuarter, hasEligibleFinalGradeData]);

    const filteredStudents = useMemo(() => {
        if (!searchTerm.trim()) return students;
        const lowerSearch = searchTerm.toLowerCase();
        return students.filter((student) => {
            const name = (student.name || "").toLowerCase();
            const lrn = (student.lrn || "").toLowerCase();
            return name.includes(lowerSearch) || lrn.includes(lowerSearch);
        });
    }, [students, searchTerm]);

    const sortedStudents = useMemo(() => {
        if (!sortConfig.column) return filteredStudents;
        return [...filteredStudents].sort((a, b) => {
            const summaryA = gradeSummaries[a.id] ?? {};
            const summaryB = gradeSummaries[b.id] ?? {};
            let valA = 0;
            let valB = 0;

            if (sortConfig.column === "quarterly") {
                valA =
                    parseFloat(
                        selectedQuarter === 1
                            ? summaryA.initial_grade_q1
                            : summaryA.initial_grade_q2,
                    ) || 0;
                valB =
                    parseFloat(
                        selectedQuarter === 1
                            ? summaryB.initial_grade_q1
                            : summaryB.initial_grade_q2,
                    ) || 0;
            } else if (sortConfig.column === "expected") {
                valA =
                    parseFloat(
                        selectedQuarter === 1
                            ? summaryA.expected_grade_q1
                            : summaryA.expected_grade_q2,
                    ) || 0;
                valB =
                    parseFloat(
                        selectedQuarter === 1
                            ? summaryB.expected_grade_q1
                            : summaryB.expected_grade_q2,
                    ) || 0;
            } else if (sortConfig.column === "final") {
                valA =
                    parseFloat(
                        selectedQuarter === 1
                            ? summaryA.q1_grade
                            : summaryA.q2_grade,
                    ) || 0;
                valB =
                    parseFloat(
                        selectedQuarter === 1
                            ? summaryB.q1_grade
                            : summaryB.q2_grade,
                    ) || 0;
            }

            return sortConfig.order === "asc" ? valA - valB : valB - valA;
        });
    }, [filteredStudents, sortConfig, gradeSummaries, selectedQuarter]);

    const assignmentColumns = useMemo(() => {
        const columns = [];
        gradeCategories.forEach((category) => {
            (category.tasks || []).forEach((task) => {
                columns.push({
                    id: task.id,
                    label: task.label,
                    total: task.total,
                    categoryId: category.id,
                    categoryLabel: category.label,
                });
            });
        });
        return columns;
    }, [gradeCategories]);

    const classTitleName = stripGradePrefix(selectedClass?.name);
    const classTitleSection =
        selectedClass?.section?.trim?.() ?? selectedClass?.section ?? "";
    const classTitleLabel =
        [classTitleName, classTitleSection].filter(Boolean).join(" ").trim() ||
        stripGradePrefix(selectedClassHeading);

    const selectedSubjectLabel = (() => {
        const rawSubject = selectedClass?.subject;

        if (typeof rawSubject === "string" && rawSubject.trim()) {
            return rawSubject.trim();
        }

        if (rawSubject && typeof rawSubject === "object") {
            const nestedSubject =
                rawSubject.subject_name ??
                rawSubject.name ??
                rawSubject.subject ??
                "";

            if (typeof nestedSubject === "string" && nestedSubject.trim()) {
                return nestedSubject.trim();
            }
        }

        if (
            typeof selectedClass?.subject_name === "string" &&
            selectedClass.subject_name.trim()
        ) {
            return selectedClass.subject_name.trim();
        }

        return "";
    })();

    const hasAssignments = assignmentColumns.length > 0;

    const selectedTaskColumnData = useMemo(() => {
        if (!taskColumnModal.isOpen) {
            return null;
        }

        const category = gradeCategories.find(
            (item) => item.id === taskColumnModal.categoryId,
        );
        const task = category?.tasks?.find(
            (item) => item.id === taskColumnModal.taskId,
        );

        if (!category || !task) {
            return null;
        }

        const scoredValues = students.reduce((values, student) => {
            const draftValue = dirtyGrades?.[student.id]?.[task.id];
            const persistedValue =
                student?.grades?.[selectedQuarter]?.[task.id];
            const value =
                draftValue !== undefined ? draftValue : persistedValue;

            if (value === "" || value === null || value === undefined) {
                return values;
            }

            const numericValue = Number(value);

            if (!Number.isFinite(numericValue)) {
                return values;
            }

            values.push(numericValue);
            return values;
        }, []);

        const totalScore = scoredValues.reduce(
            (runningTotal, currentValue) => runningTotal + currentValue,
            0,
        );
        const averageScore =
            scoredValues.length > 0
                ? Number((totalScore / scoredValues.length).toFixed(2))
                : null;
        const highestScore =
            scoredValues.length > 0 ? Math.max(...scoredValues) : null;
        const lowestScore =
            scoredValues.length > 0 ? Math.min(...scoredValues) : null;

        return {
            category,
            task,
            summary: {
                gradedCount: scoredValues.length,
                totalStudents: students.length,
                averageScore,
                highestScore,
                lowestScore,
            },
        };
    }, [
        taskColumnModal,
        gradeCategories,
        students,
        dirtyGrades,
        selectedQuarter,
    ]);

    useEffect(() => {
        if (taskColumnModal.isOpen && !selectedTaskColumnData) {
            setTaskColumnModal(DEFAULT_TASK_COLUMN_MODAL_STATE);
        }
    }, [taskColumnModal.isOpen, selectedTaskColumnData]);

    const refreshCurrentClassData = async () => {
        if (!selectedClass?.id || typeof onRefreshClassData !== "function") {
            return;
        }

        await onRefreshClassData(selectedClass.id);
    };

    useEffect(() => {
        setLocalGradeStructure(gradeStructure);
    }, [gradeStructure, selectedClass?.id]);

    const applyCategoriesForQuarter = (
        quarterToUpdate,
        categoriesForQuarter,
    ) => {
        setLocalGradeStructure((prevGradeStructure) =>
            applyQuarterCategoriesToGradeStructure({
                currentGradeStructure: prevGradeStructure,
                quarter: quarterToUpdate,
                categories: categoriesForQuarter,
            }),
        );
    };

    useEffect(() => {
        if (!selectedClass?.id) {
            hasHydratedViewFromUrl.current = false;
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const requestedView = params.get(VIEW_QUERY_PARAM);
        const requestedTab = params.get(TAB_QUERY_PARAM);

        const shouldUseGradesView = requestedView === GRADES_VIEW_QUERY_VALUE;

        if (!shouldUseGradesView) {
            setStudentViewMode("classList");
            setSelectedTab("q1");
            setSelectedQuarter(1);
            hasHydratedViewFromUrl.current = true;
            return;
        }

        const resolvedTab = resolveTabFromQuery({
            tabValue: requestedTab,
            isQ2Unlocked,
            isFinalUnlocked,
        });

        setStudentViewMode("gradeOverview");
        setSelectedTab(resolvedTab);
        setSelectedQuarter(resolvedTab === "q2" ? 2 : 1);
        hasHydratedViewFromUrl.current = true;
    }, [selectedClass?.id, isQ2Unlocked, isFinalUnlocked]);

    useEffect(() => {
        if (!selectedClass?.id || !hasHydratedViewFromUrl.current) {
            return;
        }

        const params = new URLSearchParams(window.location.search);

        if (studentViewMode === "gradeOverview") {
            params.set(VIEW_QUERY_PARAM, GRADES_VIEW_QUERY_VALUE);

            const tabForUrl = resolveTabFromQuery({
                tabValue: selectedTab,
                isQ2Unlocked,
                isFinalUnlocked,
            });

            params.set(TAB_QUERY_PARAM, tabForUrl);
        } else {
            params.delete(VIEW_QUERY_PARAM);
            params.delete(TAB_QUERY_PARAM);
        }

        const nextQuery = params.toString();
        const nextUrl = nextQuery
            ? `${window.location.pathname}?${nextQuery}`
            : window.location.pathname;

        const currentUrl = `${window.location.pathname}${window.location.search}`;

        if (nextUrl !== currentUrl) {
            window.history.replaceState({}, "", nextUrl);
        }
    }, [
        selectedClass?.id,
        studentViewMode,
        selectedTab,
        isQ2Unlocked,
        isFinalUnlocked,
    ]);

    // Event Handlers
    const handleSaveGrades = async () => {
        if (isArchiveReadOnly) return;
        if (!hasGradeChanges || !selectedClass) return;

        const payload = [];
        Object.entries(dirtyGrades).forEach(([studentId, assignmentValues]) => {
            Object.entries(assignmentValues).forEach(
                ([assignmentId, score]) => {
                    payload.push({
                        enrollment_id: Number(studentId),
                        assignment_id: assignmentId,
                        score:
                            score === "" ||
                            score === null ||
                            score === undefined
                                ? null
                                : Number(score),
                        quarter: selectedQuarter || 1,
                    });
                },
            );
        });

        if (!payload.length) return;

        setIsSavingGrades(true);

        router.post(
            `/teacher/classes/${selectedClass.id}/grades/bulk`,
            { grades: payload },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: async () => {
                    setDirtyGrades({});
                    setGradeSubmissionModal({
                        isOpen: true,
                        status: "success",
                        message: "The grades have been submitted successfully!",
                    });
                    await refreshCurrentClassData();
                },
                onError: (errors) => {
                    console.error("Error saving grades:", errors);
                    const errorMessage = errors.grades
                        ? Array.isArray(errors.grades)
                            ? errors.grades.join(", ")
                            : errors.grades
                        : "Please try again.";
                    setGradeSubmissionModal({
                        isOpen: true,
                        status: "error",
                        message: `Grades could not be submitted. ${errorMessage}`,
                    });
                },
                onFinish: () => {
                    setIsSavingGrades(false);
                },
            },
        );
    };

    const handleGradeChange = (studentId, assignmentId, maxScore, rawValue) => {
        if (isArchiveReadOnly) {
            return;
        }

        const nextValue = normalizeGradeInput(rawValue, maxScore);

        if (nextValue === null) {
            return;
        }

        setDirtyGrades((prev) => {
            const updated = { ...prev };
            const studentGrades = { ...(updated[studentId] || {}) };
            studentGrades[assignmentId] = nextValue;
            updated[studentId] = studentGrades;
            return updated;
        });
    };

    const handleCloseGradeModal = () => {
        setGradeSubmissionModal({ isOpen: false, status: null, message: "" });
    };

    const closeDeleteTaskModal = () => {
        setDeleteTaskModal(DEFAULT_DELETE_TASK_MODAL_STATE);
    };

    const clearTaskFromDirtyGrades = (taskId) => {
        setDirtyGrades((prev) => {
            const next = {};

            Object.entries(prev).forEach(([studentId, studentGrades]) => {
                if (!studentGrades || typeof studentGrades !== "object") {
                    return;
                }

                if (
                    !Object.prototype.hasOwnProperty.call(studentGrades, taskId)
                ) {
                    next[studentId] = studentGrades;
                    return;
                }

                const remainingGrades = { ...studentGrades };
                delete remainingGrades[taskId];

                if (Object.keys(remainingGrades).length > 0) {
                    next[studentId] = remainingGrades;
                }
            });

            return next;
        });
    };

    const handleCategoryTaskSave = async (categoryId, taskData) => {
        if (isArchiveReadOnly) return;
        if (!selectedClass) return;
        setIsSavingCategoryTask(true);

        try {
            const updatedCategories = gradeCategories.map((category) => {
                if (category.id === categoryId) {
                    const taskId = `${categoryId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const newTask = {
                        id: taskId,
                        label: taskData.label,
                        total: taskData.total,
                    };
                    return {
                        ...category,
                        tasks: [...(category.tasks || []), newTask],
                    };
                }
                return {
                    id: category.id,
                    label: category.label,
                    weight: category.weight,
                    tasks: category.tasks || [],
                };
            });

            router.post(
                `/teacher/classes/${selectedClass.id}/grade-structure`,
                { categories: updatedCategories, quarter: selectedQuarter },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onSuccess: () => {
                        applyCategoriesForQuarter(
                            selectedQuarter,
                            updatedCategories,
                        );
                    },
                    onError: (errors) => {
                        console.error("Failed to add task:", errors);
                        alert("Failed to add task. Please try again.");
                    },
                    onFinish: () => {
                        setIsSavingCategoryTask(false);
                    },
                },
            );
        } catch (error) {
            console.error("Error saving task:", error);
            alert("An error occurred while adding the task.");
            setIsSavingCategoryTask(false);
        }
    };

    const handleAutoAddCategoryTask = (category) => {
        if (isArchiveReadOnly) return;
        if (!category || isSavingCategoryTask) return;

        if (
            isQuarterlyExamCategory(category) &&
            (category.tasks?.length ?? 0) >= 1
        ) {
            return;
        }

        handleCategoryTaskSave(category.id, {
            label: getNextAutoTaskLabel(category),
            total: 100,
        });
    };

    const handleOpenTaskColumnModal = (categoryId, taskId) => {
        setTaskColumnModal({
            isOpen: true,
            categoryId,
            taskId,
        });
    };

    const handleTaskColumnUpdate = async ({ label, total }) => {
        if (isArchiveReadOnly) return;
        if (!selectedClass || !selectedTaskColumnData || isSavingCategoryTask)
            return;

        const { category, task } = selectedTaskColumnData;
        setIsSavingCategoryTask(true);

        try {
            const updatedCategories = gradeCategories.map((item) => {
                const tasks = item.tasks || [];

                if (item.id !== category.id) {
                    return {
                        id: item.id,
                        label: item.label,
                        weight: item.weight,
                        tasks,
                    };
                }

                return {
                    id: item.id,
                    label: item.label,
                    weight: item.weight,
                    tasks: tasks.map((existingTask) => {
                        if (existingTask.id !== task.id) {
                            return existingTask;
                        }

                        return {
                            ...existingTask,
                            label,
                            total,
                        };
                    }),
                };
            });

            router.post(
                `/teacher/classes/${selectedClass.id}/grade-structure`,
                {
                    categories: updatedCategories,
                    quarter: selectedQuarter,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onSuccess: () => {
                        applyCategoriesForQuarter(
                            selectedQuarter,
                            updatedCategories,
                        );
                        setTaskColumnModal(DEFAULT_TASK_COLUMN_MODAL_STATE);
                    },
                    onError: (errors) => {
                        console.error("Failed to update task:", errors);
                        alert("Failed to update activity. Please try again.");
                    },
                    onFinish: () => {
                        setIsSavingCategoryTask(false);
                    },
                },
            );
        } catch (error) {
            console.error("Error updating task:", error);
            alert("An error occurred while updating the activity.");
            setIsSavingCategoryTask(false);
        }
    };

    const handleTaskColumnDeleteRequest = () => {
        if (isArchiveReadOnly) return;
        if (!selectedTaskColumnData) return;
        if (isQuarterlyExamCategory(selectedTaskColumnData.category)) {
            alert("Quarterly Exam activity cannot be deleted.");
            return;
        }

        handleCategoryTaskDelete(
            selectedTaskColumnData.category.id,
            selectedTaskColumnData.task.id,
        );
        setTaskColumnModal(DEFAULT_TASK_COLUMN_MODAL_STATE);
    };

    const handleCategoryTaskDelete = (categoryId, taskId) => {
        if (isArchiveReadOnly) return;
        if (!selectedClass || isSavingCategoryTask) return;

        const category = gradeCategories.find((item) => item.id === categoryId);
        const task = category?.tasks?.find((item) => item.id === taskId);

        if (!category || !task) {
            return;
        }

        if (isQuarterlyExamCategory(category)) {
            alert("Quarterly Exam activity cannot be deleted.");
            return;
        }

        const gradedStudentCount = students.reduce((count, student) => {
            const draftValue = dirtyGrades?.[student.id]?.[taskId];
            const persistedValue = student?.grades?.[selectedQuarter]?.[taskId];
            const value =
                draftValue !== undefined ? draftValue : persistedValue;

            if (value !== "" && value !== null && value !== undefined) {
                return count + 1;
            }

            return count;
        }, 0);

        setDeleteTaskModal({
            isOpen: true,
            categoryId,
            categoryLabel: category.label,
            taskId,
            taskLabel: task.label,
            gradedStudentCount,
            requiresTypedConfirmation: gradedStudentCount > 0,
        });
    };

    const handleConfirmCategoryTaskDelete = async () => {
        if (isArchiveReadOnly) return;
        if (!selectedClass || !deleteTaskModal.isOpen) return;

        const categoryId = deleteTaskModal.categoryId;
        const taskId = deleteTaskModal.taskId;

        if (!categoryId || !taskId) {
            closeDeleteTaskModal();
            return;
        }

        const category = gradeCategories.find((item) => item.id === categoryId);
        const task = category?.tasks?.find((item) => item.id === taskId);

        if (!category || !task) {
            closeDeleteTaskModal();
            return;
        }

        if (isQuarterlyExamCategory(category)) {
            alert("Quarterly Exam activity cannot be deleted.");
            closeDeleteTaskModal();
            return;
        }

        setIsSavingCategoryTask(true);

        try {
            const updatedCategories = gradeCategories.map((item) => {
                const tasks = item.tasks || [];

                if (item.id !== categoryId) {
                    return {
                        id: item.id,
                        label: item.label,
                        weight: item.weight,
                        tasks,
                    };
                }

                return {
                    id: item.id,
                    label: item.label,
                    weight: item.weight,
                    tasks: tasks.filter(
                        (existingTask) => existingTask.id !== taskId,
                    ),
                };
            });

            router.post(
                `/teacher/classes/${selectedClass.id}/grade-structure`,
                {
                    categories: updatedCategories,
                    quarter: selectedQuarter,
                    delete_task_grades: true,
                    deleted_task_ids: [taskId],
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onSuccess: () => {
                        applyCategoriesForQuarter(
                            selectedQuarter,
                            updatedCategories,
                        );
                        clearTaskFromDirtyGrades(taskId);
                        closeDeleteTaskModal();
                        setTaskColumnModal((previousState) => {
                            if (previousState.taskId !== taskId) {
                                return previousState;
                            }

                            return DEFAULT_TASK_COLUMN_MODAL_STATE;
                        });
                    },
                    onError: (errors) => {
                        console.error("Failed to delete task:", errors);
                        alert("Failed to delete activity. Please try again.");
                    },
                    onFinish: () => {
                        setIsSavingCategoryTask(false);
                    },
                },
            );
        } catch (error) {
            console.error("Error deleting task:", error);
            alert("An error occurred while deleting the activity.");
            setIsSavingCategoryTask(false);
        }
    };

    const handleClasslistUploadClick = () => {
        if (isArchiveReadOnly) return;
        classlistUploadRef.current?.click();
    };

    const handleClasslistFileChange = async (event) => {
        if (isArchiveReadOnly) return;
        const file = event.target.files?.[0];
        if (!file || !selectedClass) return;

        setUploadError(null);
        setUploadSuccess(null);
        setIsUploadingClasslist(true);

        const formData = new FormData();
        formData.append("classlist", file);

        try {
            router.post(
                `/teacher/classes/${selectedClass.id}/classlist`,
                formData,
                {
                    forceFormData: true,
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onSuccess: async () => {
                        setUploadSuccess(
                            "Classlist uploaded successfully! Students have been added.",
                        );
                        if (classlistUploadRef.current) {
                            classlistUploadRef.current.value = "";
                        }
                        await refreshCurrentClassData();
                    },
                    onError: (errors) => {
                        const errorMsg =
                            errors.classlist ||
                            "Failed to upload classlist. Please check the file format.";
                        setUploadError(errorMsg);
                    },
                    onFinish: () => {
                        setIsUploadingClasslist(false);
                    },
                },
            );
        } catch (error) {
            console.error("Error uploading classlist:", error);
            setUploadError("An unexpected error occurred during upload.");
            setIsUploadingClasslist(false);
        }
    };

    const handleGradesUploadClick = () => {
        if (isArchiveReadOnly) return;
        gradeUploadRef.current?.click();
    };

    const handleGradesFileChange = async (event) => {
        if (isArchiveReadOnly) return;
        const file = event.target.files?.[0];
        if (!file || !selectedClass) return;

        setUploadError(null);
        setUploadSuccess(null);
        setIsImportingGrades(true);

        const formData = new FormData();
        formData.append("grades_file", file);

        try {
            router.post(
                `/teacher/classes/${selectedClass.id}/grades/import`,
                formData,
                {
                    forceFormData: true,
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onSuccess: async () => {
                        setUploadSuccess("Grades imported successfully!");
                        if (gradeUploadRef.current) {
                            gradeUploadRef.current.value = "";
                        }
                        await refreshCurrentClassData();
                    },
                    onError: (errors) => {
                        const errorMsg =
                            errors.grades_file ||
                            errors.grades ||
                            "Failed to import grades. Please check the file format.";
                        setUploadError(errorMsg);
                    },
                    onFinish: () => {
                        setIsImportingGrades(false);
                    },
                },
            );
        } catch (error) {
            console.error("Error importing grades:", error);
            setUploadError("An unexpected error occurred during import.");
            setIsImportingGrades(false);
        }
    };

    const handleDownloadClasslistTemplate = () => {
        const headers = [
            "name",
            "lrn",
            "grade_level",
            "section",
            "personal_email",
        ];
        const sampleRow = [
            "Juan Dela Cruz",
            "123456789012",
            "11",
            "Section A",
            "juan.personal@example.com",
        ];
        const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `classlist_template_${selectedClass?.section || "class"}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadGradeTemplate = () => {
        if (!selectedClass || assignmentColumns.length === 0) return;

        const headers = [
            "lrn",
            "name",
            ...assignmentColumns.map((col) => col.id),
        ];
        const rows = sortedStudents.slice(0, 3).map((student) => {
            const row = [student.lrn || "", student.name || ""];
            assignmentColumns.forEach((col) => {
                row.push(student.grades?.[selectedQuarter]?.[col.id] || "");
            });
            return row.join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `grade_template_${selectedClass?.section || "class"}_Q${selectedQuarter}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Render
    return (
        <>
            {/* Hidden File Inputs */}
            <input
                ref={classlistUploadRef}
                type="file"
                className="hidden"
                accept=".csv,text/csv"
                onChange={handleClasslistFileChange}
            />
            <input
                ref={gradeUploadRef}
                type="file"
                className="hidden"
                accept=".csv,text/csv"
                onChange={handleGradesFileChange}
            />

            {/* My Class Container - More Compact */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                {/* Upload Status Messages - Compact */}
                {(uploadError || uploadSuccess) && (
                    <div className="mb-3">
                        {uploadError && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center justify-between">
                                <span>{uploadError}</span>
                                <button
                                    onClick={() => setUploadError(null)}
                                    className="ml-2 text-red-500 hover:text-red-700 font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        {uploadSuccess && (
                            <div className="p-2 bg-green-50 border border-green-200 rounded text-green-700 text-xs flex items-center justify-between">
                                <span>{uploadSuccess}</span>
                                <button
                                    onClick={() => setUploadSuccess(null)}
                                    className="ml-2 text-green-500 hover:text-green-700 font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Header Section - More Compact */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {classTitleLabel}
                                {selectedSubjectLabel && (
                                    <>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            :{" "}
                                        </span>
                                        <span className="text-indigo-600 dark:text-indigo-400">
                                            {selectedSubjectLabel}
                                        </span>
                                    </>
                                )}
                            </h2>
                            {selectedClass?.current_quarter && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                    Q{selectedClass.current_quarter}
                                </span>
                            )}
                            {isArchiveReadOnly && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
                                    {readOnlyBadgeLabel}
                                </span>
                            )}
                            {/* View Mode Toggle - Compact */}
                            <div className="flex items-center p-0.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                                <button
                                    onClick={() =>
                                        setStudentViewMode("classList")
                                    }
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                        studentViewMode === "classList"
                                            ? "bg-white dark:bg-gray-900 text-indigo-700 shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                                    }`}
                                >
                                    List
                                </button>
                                <button
                                    onClick={() =>
                                        setStudentViewMode("gradeOverview")
                                    }
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                        studentViewMode === "gradeOverview"
                                            ? "bg-white dark:bg-gray-900 text-indigo-700 shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                                    }`}
                                >
                                    Grades
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons - More Compact */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            onClick={handleClasslistUploadClick}
                            disabled={
                                !selectedClass ||
                                isUploadingClasslist ||
                                isArchiveReadOnly
                            }
                            className="flex items-center gap-1 rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                            title={
                                isArchiveReadOnly
                                    ? readOnlyHint
                                    : "Upload students from CSV"
                            }
                        >
                            <Users size={14} />
                            {isUploadingClasslist ? "Uploading…" : "Upload"}
                        </button>

                        <button
                            onClick={
                                isGradeView
                                    ? handleDownloadGradeTemplate
                                    : handleDownloadClasslistTemplate
                            }
                            disabled={!selectedClass}
                            className="flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FileDown size={14} />
                            Template
                        </button>

                        {isGradeView && (
                            <>
                                <button
                                    onClick={handleGradesUploadClick}
                                    disabled={
                                        !selectedClass ||
                                        isImportingGrades ||
                                        isArchiveReadOnly
                                    }
                                    className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-1.5 px-2.5 rounded-md hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 text-xs"
                                    title={
                                        isArchiveReadOnly
                                            ? readOnlyHint
                                            : "Upload grades from CSV"
                                    }
                                >
                                    <Upload size={14} />
                                    {isImportingGrades
                                        ? "Uploading…"
                                        : "Upload Grades"}
                                </button>
                                <button
                                    onClick={handleSaveGrades}
                                    disabled={
                                        !hasGradeChanges ||
                                        isSavingGrades ||
                                        isArchiveReadOnly
                                    }
                                    className="flex items-center gap-1 bg-emerald-600 text-white font-medium py-1.5 px-2.5 rounded-md hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 text-xs"
                                    title={
                                        isArchiveReadOnly
                                            ? readOnlyHint
                                            : "Save updated grades"
                                    }
                                >
                                    {isSavingGrades
                                        ? "Saving…"
                                        : hasGradeChanges
                                          ? `Save (${dirtyGradeCount})`
                                          : "Save"}
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => {
                                if (isArchiveReadOnly) return;
                                setIsAddStudentModalOpen(true);
                            }}
                            className="flex items-center gap-1 bg-indigo-600 text-white font-medium py-1.5 px-2.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-xs"
                            disabled={!selectedClass || isArchiveReadOnly}
                            title={
                                isArchiveReadOnly ? readOnlyHint : "Add student"
                            }
                        >
                            <Plus size={14} />
                            Add
                        </button>
                    </div>
                </div>

                {/* Search Bar - More Compact */}
                <div className="relative mb-3">
                    <input
                        type="text"
                        placeholder="Search student by name or LRN..."
                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search
                        size={16}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    />
                </div>

                {/* Conditional Rendering based on studentViewMode */}
                {studentViewMode === "classList" ? (
                    <div className="overflow-x-auto">
                        <ClassList
                            filteredStudents={sortedStudents}
                            setSelectedStudentForStatus={
                                setSelectedStudentForStatus
                            }
                            setIsStudentStatusModalOpen={
                                setIsStudentStatusModalOpen
                            }
                            buildStudentKey={buildStudentKey}
                        />
                        {sortedStudents.length === 0 && (
                            <EmptyStudentState
                                hasSearchTerm={Boolean(searchTerm)}
                                searchTerm={searchTerm}
                                onAddStudent={() => {
                                    if (isArchiveReadOnly) return;
                                    setIsAddStudentModalOpen(true);
                                }}
                            />
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Grade View Controls - More Compact */}
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    View:
                                </span>
                                <div className="flex items-center p-0.5 bg-gray-100 dark:bg-gray-700 rounded-md ring-1 ring-gray-200">
                                    <button
                                        onClick={() => {
                                            setSelectedTab("q1");
                                            setSelectedQuarter(1);
                                            setDirtyGrades({});
                                        }}
                                        aria-pressed={selectedTab === "q1"}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${
                                            selectedTab === "q1"
                                                ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 hover:text-indigo-700"
                                        }`}
                                    >
                                        Q1
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (isQ2Unlocked) {
                                                setSelectedTab("q2");
                                                setSelectedQuarter(2);
                                                setDirtyGrades({});
                                            }
                                        }}
                                        disabled={!isQ2Unlocked}
                                        aria-pressed={selectedTab === "q2"}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${
                                            selectedTab === "q2"
                                                ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
                                                : !isQ2Unlocked
                                                  ? "text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-75"
                                                  : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 hover:text-indigo-700"
                                        }`}
                                        title={
                                            !isQ2Unlocked
                                                ? "Start Quarter 2 first"
                                                : ""
                                        }
                                    >
                                        Q2
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (isFinalUnlocked) {
                                                setSelectedTab("final");
                                            }
                                        }}
                                        disabled={!isFinalUnlocked}
                                        aria-pressed={selectedTab === "final"}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${
                                            selectedTab === "final"
                                                ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
                                                : !isFinalUnlocked
                                                  ? "text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-75"
                                                  : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 hover:text-indigo-700"
                                        }`}
                                        title={
                                            !isFinalUnlocked
                                                ? "Final Grade requires both Q1 and Q2 quarterly exam grades"
                                                : ""
                                        }
                                    >
                                        Final
                                    </button>
                                    <div className="relative ml-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowFinalUnlockInfo(
                                                    (prev) => !prev,
                                                )
                                            }
                                            aria-expanded={showFinalUnlockInfo}
                                            aria-controls="final-unlock-conditions"
                                            className="flex h-5 w-5 items-center justify-center rounded-full border border-indigo-300 bg-indigo-50 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                                            title="Show Final tab conditions"
                                        >
                                            ?
                                        </button>

                                        {showFinalUnlockInfo && (
                                            <div
                                                id="final-unlock-conditions"
                                                role="status"
                                                className="absolute left-full top-1/2 z-30 ml-2 w-72 -translate-y-1/2 rounded-lg border border-indigo-200 bg-white dark:bg-gray-900 px-3 py-2 pr-8 text-xs text-indigo-900 shadow-lg"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowFinalUnlockInfo(
                                                            false,
                                                        )
                                                    }
                                                    className="absolute right-2 top-2 rounded p-0.5 text-indigo-500 transition hover:bg-indigo-100 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
                                                    aria-label="Close final tab conditions"
                                                >
                                                    <X size={11} />
                                                </button>
                                                <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-indigo-200 bg-white dark:bg-gray-900" />
                                                <p className="font-semibold">
                                                    Final opens when:
                                                </p>
                                                <ul className="mt-1 list-disc space-y-1 pl-4">
                                                    <li>
                                                        Quarter 2 is started.
                                                        <span className="ml-1 font-medium text-indigo-800">
                                                            (
                                                            {currentQuarter >= 2
                                                                ? "Met"
                                                                : "Pending"}
                                                            )
                                                        </span>
                                                    </li>
                                                    <li>
                                                        At least one student has
                                                        both Q1 and Q2 quarterly
                                                        exam grades.
                                                        <span className="ml-1 font-medium text-indigo-800">
                                                            (
                                                            {hasEligibleFinalGradeData
                                                                ? "Met"
                                                                : "Pending"}
                                                            )
                                                        </span>
                                                    </li>
                                                </ul>
                                                <p className="mt-1 font-medium">
                                                    Status:{" "}
                                                    {isFinalUnlocked
                                                        ? "Final tab is open."
                                                        : "Final tab is locked."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {currentQuarter < 2 && !isArchiveReadOnly && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsStartQ2ModalOpen(true)
                                        }
                                        className="px-2.5 py-1 rounded-md text-xs bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                                    >
                                        Start Q2
                                    </button>
                                )}
                            </div>

                            {selectedTab !== "final" && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => {
                                            if (isArchiveReadOnly) return;
                                            setIsEditCategoriesModalOpen(true);
                                        }}
                                        disabled={isArchiveReadOnly}
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 transition disabled:cursor-not-allowed disabled:opacity-60"
                                        title={
                                            isArchiveReadOnly
                                                ? readOnlyHint
                                                : "Edit grade category percentages"
                                        }
                                    >
                                        <Settings size={12} />
                                        Edit %
                                    </button>
                                    <button
                                        onClick={() =>
                                            setGradesExpanded(!gradesExpanded)
                                        }
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 transition"
                                    >
                                        {gradesExpanded ? (
                                            <ChevronUp size={12} />
                                        ) : (
                                            <ChevronDown size={12} />
                                        )}
                                        {gradesExpanded ? "Collapse" : "Expand"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Grade Tables with reduced padding and text sizes */}
                        {selectedTab !== "final" ? (
                            <div className="relative border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-xs">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            {/* Compact header with smaller text */}
                                            <tr>
                                                <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[160px]">
                                                    Student Name
                                                </th>
                                                <th className="sticky left-[160px] z-20 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[100px]">
                                                    LRN
                                                </th>

                                                {/* Category Headers - Compact */}
                                                {gradeCategories.map(
                                                    (category) => {
                                                        const percent =
                                                            Math.round(
                                                                (category.weight ??
                                                                    0) * 100,
                                                            );
                                                        const tasks =
                                                            category.tasks ??
                                                            [];
                                                        const isCollapsed =
                                                            isCategoryCollapsed(
                                                                category.id,
                                                            );
                                                        const isQE =
                                                            isQuarterlyExam(
                                                                category,
                                                            );
                                                        const latestTask =
                                                            getLatestTask(
                                                                category,
                                                            );
                                                        const visibleTaskCount =
                                                            isCollapsed &&
                                                            latestTask
                                                                ? 1
                                                                : Math.max(
                                                                      tasks.length,
                                                                      1,
                                                                  );
                                                        const canAddTask =
                                                            !isArchiveReadOnly &&
                                                            (!isQE ||
                                                                tasks.length ===
                                                                    0);
                                                        const colSpan =
                                                            visibleTaskCount +
                                                            (canAddTask
                                                                ? 1
                                                                : 0);

                                                        return (
                                                            <th
                                                                key={
                                                                    category.id
                                                                }
                                                                colSpan={
                                                                    colSpan
                                                                }
                                                                className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700"
                                                            >
                                                                <div className="flex items-center gap-1.5">
                                                                    {!isQE &&
                                                                        tasks.length >
                                                                            1 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    toggleCategoryCollapse(
                                                                                        category.id,
                                                                                    )
                                                                                }
                                                                                className="p-0.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 dark:text-gray-300 transition"
                                                                                title={
                                                                                    isCollapsed
                                                                                        ? "Expand"
                                                                                        : "Collapse"
                                                                                }
                                                                            >
                                                                                {isCollapsed ? (
                                                                                    <ChevronRight
                                                                                        size={
                                                                                            12
                                                                                        }
                                                                                    />
                                                                                ) : (
                                                                                    <ChevronDown
                                                                                        size={
                                                                                            12
                                                                                        }
                                                                                    />
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    <span className="flex-1 truncate">
                                                                        {
                                                                            category.label
                                                                        }{" "}
                                                                        (
                                                                        {
                                                                            percent
                                                                        }
                                                                        %)
                                                                        {isCollapsed &&
                                                                            tasks.length >
                                                                                1 && (
                                                                                <span className="ml-1 text-[9px] text-gray-400 dark:text-gray-500">
                                                                                    (
                                                                                    {
                                                                                        tasks.length
                                                                                    }

                                                                                    )
                                                                                </span>
                                                                            )}
                                                                    </span>
                                                                </div>
                                                            </th>
                                                        );
                                                    },
                                                )}

                                                {/* Grade Columns - Compact */}
                                                {gradesExpanded ? (
                                                    <>
                                                        <th
                                                            className="sticky right-[160px] z-20 bg-indigo-50 px-3 py-2 text-left text-[10px] font-semibold text-indigo-700 uppercase tracking-wider border-l border-indigo-200 min-w-[80px] cursor-pointer hover:bg-indigo-100"
                                                            onClick={() =>
                                                                handleSortToggle(
                                                                    "quarterly",
                                                                )
                                                            }
                                                        >
                                                            Initial
                                                        </th>
                                                        <th
                                                            className="sticky right-[80px] z-20 bg-indigo-50 px-3 py-2 text-left text-[10px] font-semibold text-indigo-700 uppercase tracking-wider border-l border-indigo-100 min-w-[80px] cursor-pointer hover:bg-indigo-100"
                                                            onClick={() =>
                                                                handleSortToggle(
                                                                    "expected",
                                                                )
                                                            }
                                                        >
                                                            Expected
                                                        </th>
                                                        <th
                                                            className="sticky right-0 z-20 bg-indigo-50 px-3 py-2 text-left text-[10px] font-semibold text-indigo-700 uppercase tracking-wider border-l border-indigo-100 min-w-[80px] cursor-pointer hover:bg-indigo-100"
                                                            onClick={() =>
                                                                handleSortToggle(
                                                                    "final",
                                                                )
                                                            }
                                                        >
                                                            Q{selectedQuarter}
                                                        </th>
                                                    </>
                                                ) : (
                                                    <th className="sticky right-0 z-20 bg-indigo-50 px-3 py-2 text-left text-[10px] font-semibold text-indigo-700 uppercase tracking-wider border-l border-indigo-200 min-w-[80px]">
                                                        Grade
                                                    </th>
                                                )}
                                            </tr>

                                            {/* Sub-header for task labels - Compact */}
                                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700"></th>
                                                <th className="sticky left-[160px] z-20 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700"></th>

                                                {gradeCategories.map(
                                                    (category) => {
                                                        const tasks =
                                                            category.tasks ??
                                                            [];
                                                        const isCollapsed =
                                                            isCategoryCollapsed(
                                                                category.id,
                                                            );
                                                        const latestTask =
                                                            getLatestTask(
                                                                category,
                                                            );

                                                        const taskHeaderCells =
                                                            [];

                                                        if (!tasks.length) {
                                                            taskHeaderCells.push(
                                                                <th
                                                                    key={`${category.id}-empty`}
                                                                    className={`px-3 py-1.5 text-left text-[10px] font-medium text-gray-400 dark:text-gray-500 ${
                                                                        isArchiveReadOnly
                                                                            ? "border-r border-gray-200 dark:border-gray-700"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    No tasks
                                                                </th>,
                                                            );
                                                        } else if (
                                                            isCollapsed &&
                                                            latestTask
                                                        ) {
                                                            taskHeaderCells.push(
                                                                <th
                                                                    key={`${category.id}-collapsed`}
                                                                    className={`px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-indigo-50/30 dark:bg-indigo-900/10 transition-colors hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 ${
                                                                        isArchiveReadOnly
                                                                            ? "border-r border-gray-200 dark:border-gray-700"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleOpenTaskColumnModal(
                                                                                category.id,
                                                                                latestTask.id,
                                                                            )
                                                                        }
                                                                        className="w-full rounded-md px-1 py-0.5 text-left transition-colors hover:bg-indigo-100/70 hover:text-indigo-700 dark:hover:bg-indigo-900/30"
                                                                    >
                                                                        <span className="block truncate max-w-[96px]">
                                                                            {
                                                                                latestTask.label
                                                                            }
                                                                        </span>
                                                                        <span className="text-[9px] font-normal text-gray-400 dark:text-gray-500">
                                                                            /{" "}
                                                                            {
                                                                                latestTask.total
                                                                            }{" "}
                                                                            pts
                                                                        </span>
                                                                    </button>
                                                                </th>,
                                                            );
                                                        } else {
                                                            tasks.forEach(
                                                                (
                                                                    task,
                                                                    taskIndex,
                                                                ) => {
                                                                    const hasRightBorder =
                                                                        isArchiveReadOnly &&
                                                                        taskIndex ===
                                                                            tasks.length -
                                                                                1;

                                                                    taskHeaderCells.push(
                                                                        <th
                                                                            key={`${category.id}-${task.id}`}
                                                                            className={`px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-indigo-50/30 dark:bg-indigo-900/10 transition-colors hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 ${
                                                                                hasRightBorder
                                                                                    ? "border-r border-gray-200 dark:border-gray-700"
                                                                                    : ""
                                                                            }`}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleOpenTaskColumnModal(
                                                                                        category.id,
                                                                                        task.id,
                                                                                    )
                                                                                }
                                                                                className="w-full rounded-md px-1 py-0.5 text-left transition-colors hover:bg-indigo-100/70 hover:text-indigo-700 dark:hover:bg-indigo-900/30"
                                                                            >
                                                                                <span className="block truncate max-w-[96px]">
                                                                                    {
                                                                                        task.label
                                                                                    }
                                                                                </span>
                                                                                <span className="text-[9px] font-normal text-gray-400 dark:text-gray-500">
                                                                                    /{" "}
                                                                                    {
                                                                                        task.total
                                                                                    }{" "}
                                                                                    pts
                                                                                </span>
                                                                            </button>
                                                                        </th>,
                                                                    );
                                                                },
                                                            );
                                                        }

                                                        if (
                                                            !isArchiveReadOnly
                                                        ) {
                                                            const isQECategory =
                                                                isQuarterlyExam(
                                                                    category,
                                                                );
                                                            const canAddTask =
                                                                !isQECategory ||
                                                                tasks.length ===
                                                                    0;

                                                            if (canAddTask) {
                                                                taskHeaderCells.push(
                                                                    <th
                                                                        key={`${category.id}-add-cell`}
                                                                        className="border-r border-gray-200 dark:border-gray-700 px-2 py-1.5"
                                                                    >
                                                                        <div className="flex items-center justify-center">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleAutoAddCategoryTask(
                                                                                        category,
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    isSavingCategoryTask
                                                                                }
                                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-200 hover:text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 dark:ring-indigo-800 dark:hover:bg-indigo-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                                title={`Add activity to ${category.label}`}
                                                                                aria-label={`Add activity to ${category.label}`}
                                                                            >
                                                                                <Plus
                                                                                    size={
                                                                                        15
                                                                                    }
                                                                                />
                                                                            </button>
                                                                        </div>
                                                                    </th>,
                                                                );
                                                            }
                                                        }

                                                        return taskHeaderCells;
                                                    },
                                                )}

                                                {gradesExpanded ? (
                                                    <>
                                                        <th className="sticky right-[160px] z-20 bg-indigo-50/50 border-l border-indigo-200"></th>
                                                        <th className="sticky right-[80px] z-20 bg-indigo-50/50 border-l border-indigo-100"></th>
                                                        <th className="sticky right-0 z-20 bg-indigo-50/50 border-l border-indigo-100"></th>
                                                    </>
                                                ) : (
                                                    <th className="sticky right-0 z-20 bg-indigo-50/50 border-l border-indigo-200"></th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                                            {sortedStudents.map(
                                                (student, index) => {
                                                    const draftValues = {
                                                        ...(student.grades?.[
                                                            selectedQuarter
                                                        ] ?? {}),
                                                        ...(dirtyGrades[
                                                            student.id
                                                        ] ?? {}),
                                                    };
                                                    const studentKey =
                                                        buildStudentKey(
                                                            student,
                                                            index,
                                                        );
                                                    const studentDraft =
                                                        dirtyGrades[
                                                            student.id
                                                        ] ?? {};
                                                    const summary =
                                                        gradeSummaries[
                                                            student.id
                                                        ] ?? {};

                                                    const initialGrade =
                                                        selectedQuarter === 1
                                                            ? summary.initial_grade_q1
                                                            : summary.initial_grade_q2;
                                                    const expectedGrade =
                                                        selectedQuarter === 1
                                                            ? summary.expected_grade_q1
                                                            : summary.expected_grade_q2;

                                                    const draftGradesGrouped = {
                                                        ...student.grades,
                                                        [selectedQuarter]:
                                                            draftValues,
                                                    };
                                                    const studentHasQE =
                                                        hasQuarterlyExamScores(
                                                            draftGradesGrouped,
                                                            gradeCategories,
                                                            selectedQuarter,
                                                        );
                                                    const quarterGrade =
                                                        studentHasQE
                                                            ? selectedQuarter ===
                                                              1
                                                                ? summary.q1_grade
                                                                : summary.q2_grade
                                                            : null;

                                                    const gradeColors =
                                                        getGradeRowColors(
                                                            quarterGrade != null
                                                                ? String(
                                                                      quarterGrade,
                                                                  )
                                                                : "N/A",
                                                        );

                                                    return (
                                                        <tr
                                                            key={studentKey}
                                                            className={`${gradeColors.row} ${gradeColors.hoverRow} transition-colors`}
                                                        >
                                                            {/* Student Name - Compact */}
                                                            <td
                                                                className={`sticky left-0 z-10 ${gradeColors.leftCell} px-3 py-2 border-r border-gray-200 dark:border-gray-700 min-w-[160px]`}
                                                            >
                                                                <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                    {
                                                                        student.name
                                                                    }
                                                                </div>
                                                                {formatAcademicMeta(
                                                                    student,
                                                                ) && (
                                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                                        {formatAcademicMeta(
                                                                            student,
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            {/* LRN - Compact */}
                                                            <td
                                                                className={`sticky left-[160px] z-10 ${gradeColors.leftCell} px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 min-w-[100px]`}
                                                            >
                                                                {student.lrn}
                                                            </td>

                                                            {/* Grade Inputs - Smaller */}
                                                            {gradeCategories.map(
                                                                (category) => {
                                                                    const tasks =
                                                                        category.tasks ??
                                                                        [];
                                                                    const isCollapsed =
                                                                        isCategoryCollapsed(
                                                                            category.id,
                                                                        );
                                                                    const latestTask =
                                                                        getLatestTask(
                                                                            category,
                                                                        );

                                                                    const gradeInputCells =
                                                                        [];

                                                                    if (
                                                                        !tasks.length
                                                                    ) {
                                                                        gradeInputCells.push(
                                                                            <td
                                                                                key={`${studentKey}-${category.id}-placeholder`}
                                                                                className={`px-3 py-2 text-center text-xs text-gray-400 dark:text-gray-500 ${
                                                                                    isArchiveReadOnly
                                                                                        ? "border-r border-gray-200 dark:border-gray-700"
                                                                                        : ""
                                                                                }`}
                                                                            >
                                                                                —
                                                                            </td>,
                                                                        );
                                                                    } else if (
                                                                        isCollapsed &&
                                                                        latestTask
                                                                    ) {
                                                                        const rawValue =
                                                                            studentDraft[
                                                                                latestTask
                                                                                    .id
                                                                            ] !==
                                                                            undefined
                                                                                ? studentDraft[
                                                                                      latestTask
                                                                                          .id
                                                                                  ]
                                                                                : student
                                                                                      .grades?.[
                                                                                      selectedQuarter
                                                                                  ]?.[
                                                                                      latestTask
                                                                                          .id
                                                                                  ];
                                                                        const inputValue =
                                                                            rawValue ===
                                                                                "" ||
                                                                            rawValue ===
                                                                                null ||
                                                                            rawValue ===
                                                                                undefined
                                                                                ? ""
                                                                                : `${rawValue}`;

                                                                        gradeInputCells.push(
                                                                            <td
                                                                                key={`${studentKey}-${category.id}-collapsed`}
                                                                                className={`px-3 py-2 text-xs text-gray-700 dark:text-gray-300 ${
                                                                                    isArchiveReadOnly
                                                                                        ? "border-r border-gray-200 dark:border-gray-700"
                                                                                        : ""
                                                                                }`}
                                                                            >
                                                                                <input
                                                                                    type="text"
                                                                                    inputMode="decimal"
                                                                                    pattern="^\\d*(\\.\\d{0,2})?$"
                                                                                    value={
                                                                                        inputValue
                                                                                    }
                                                                                    disabled={
                                                                                        isArchiveReadOnly
                                                                                    }
                                                                                    onChange={(
                                                                                        event,
                                                                                    ) =>
                                                                                        handleGradeChange(
                                                                                            student.id,
                                                                                            latestTask.id,
                                                                                            latestTask.total,
                                                                                            event
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    autoComplete="off"
                                                                                    className="w-16 rounded border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-gray-700 disabled:text-gray-500 dark:text-gray-400"
                                                                                />
                                                                            </td>,
                                                                        );
                                                                    } else {
                                                                        tasks.forEach(
                                                                            (
                                                                                task,
                                                                                taskIndex,
                                                                            ) => {
                                                                                const rawValue =
                                                                                    studentDraft[
                                                                                        task
                                                                                            .id
                                                                                    ] !==
                                                                                    undefined
                                                                                        ? studentDraft[
                                                                                              task
                                                                                                  .id
                                                                                          ]
                                                                                        : student
                                                                                              .grades?.[
                                                                                              selectedQuarter
                                                                                          ]?.[
                                                                                              task
                                                                                                  .id
                                                                                          ];
                                                                                const inputValue =
                                                                                    rawValue ===
                                                                                        "" ||
                                                                                    rawValue ===
                                                                                        null ||
                                                                                    rawValue ===
                                                                                        undefined
                                                                                        ? ""
                                                                                        : `${rawValue}`;
                                                                                const hasRightBorder =
                                                                                    isArchiveReadOnly &&
                                                                                    taskIndex ===
                                                                                        tasks.length -
                                                                                            1;

                                                                                gradeInputCells.push(
                                                                                    <td
                                                                                        key={`${studentKey}-${task.id}`}
                                                                                        className={`px-3 py-2 text-xs text-gray-700 dark:text-gray-300 ${
                                                                                            hasRightBorder
                                                                                                ? "border-r border-gray-200 dark:border-gray-700"
                                                                                                : ""
                                                                                        }`}
                                                                                    >
                                                                                        <input
                                                                                            type="text"
                                                                                            inputMode="decimal"
                                                                                            pattern="^\\d*(\\.\\d{0,2})?$"
                                                                                            value={
                                                                                                inputValue
                                                                                            }
                                                                                            disabled={
                                                                                                isArchiveReadOnly
                                                                                            }
                                                                                            onChange={(
                                                                                                event,
                                                                                            ) =>
                                                                                                handleGradeChange(
                                                                                                    student.id,
                                                                                                    task.id,
                                                                                                    task.total,
                                                                                                    event
                                                                                                        .target
                                                                                                        .value,
                                                                                                )
                                                                                            }
                                                                                            autoComplete="off"
                                                                                            className="w-16 rounded border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-gray-700 disabled:text-gray-500 dark:text-gray-400"
                                                                                        />
                                                                                    </td>,
                                                                                );
                                                                            },
                                                                        );
                                                                    }

                                                                    if (
                                                                        !isArchiveReadOnly
                                                                    ) {
                                                                        const canAddTask =
                                                                            !isQuarterlyExamCategory(
                                                                                category,
                                                                            ) ||
                                                                            tasks.length ===
                                                                                0;

                                                                        if (
                                                                            canAddTask
                                                                        ) {
                                                                            gradeInputCells.push(
                                                                                <td
                                                                                    key={`${studentKey}-${category.id}-add-slot`}
                                                                                    className="border-r border-gray-200 dark:border-gray-700 px-2 py-2"
                                                                                />,
                                                                            );
                                                                        }
                                                                    }

                                                                    return gradeInputCells;
                                                                },
                                                            )}

                                                            {/* Grade Columns - Compact */}
                                                            {gradesExpanded ? (
                                                                <>
                                                                    <td
                                                                        className={`sticky right-[160px] z-10 ${gradeColors.rightCell} px-3 py-2 whitespace-nowrap text-xs font-semibold text-gray-900 dark:text-gray-100 border-l border-gray-300 dark:border-gray-600 min-w-[80px]`}
                                                                    >
                                                                        {initialGrade !=
                                                                        null
                                                                            ? `${parseFloat(initialGrade).toFixed(1)}%`
                                                                            : "—"}
                                                                    </td>
                                                                    <td
                                                                        className={`sticky right-[80px] z-10 ${gradeColors.rightCell} px-3 py-2 whitespace-nowrap text-xs font-semibold text-indigo-600 border-l border-gray-200 dark:border-gray-700 min-w-[80px]`}
                                                                    >
                                                                        {expectedGrade !=
                                                                        null
                                                                            ? `${parseFloat(expectedGrade).toFixed(1)}%`
                                                                            : "—"}
                                                                    </td>
                                                                    <td
                                                                        className={`sticky right-0 z-10 ${gradeColors.rightCell} px-3 py-2 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700 min-w-[80px]`}
                                                                    >
                                                                        {quarterGrade !=
                                                                        null
                                                                            ? quarterGrade
                                                                            : "—"}
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <td
                                                                    className={`sticky right-0 z-10 ${gradeColors.rightCell} px-3 py-2 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-gray-100 border-l border-gray-300 dark:border-gray-600 min-w-[80px]`}
                                                                >
                                                                    {quarterGrade !=
                                                                    null
                                                                        ? quarterGrade
                                                                        : "—"}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                },
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {sortedStudents.length === 0 && (
                                    <EmptyStudentState
                                        hasSearchTerm={Boolean(searchTerm)}
                                        searchTerm={searchTerm}
                                        onAddStudent={() => {
                                            if (isArchiveReadOnly) return;
                                            setIsAddStudentModalOpen(true);
                                        }}
                                    />
                                )}
                            </div>
                        ) : (
                            /* Final Grade Table - Compact */
                            <div className="relative border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-xs">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[160px]">
                                                    Student Name
                                                </th>
                                                <th className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[100px]">
                                                    LRN
                                                </th>
                                                <th className="bg-indigo-50 px-3 py-2 text-center text-[10px] font-semibold text-indigo-700 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[80px]">
                                                    Q1
                                                </th>
                                                <th className="bg-indigo-50 px-3 py-2 text-center text-[10px] font-semibold text-indigo-700 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[80px]">
                                                    Q2
                                                </th>
                                                <th className="bg-emerald-50 px-3 py-2 text-center text-[10px] font-semibold text-emerald-700 uppercase tracking-wider min-w-[100px]">
                                                    Final
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                                            {sortedStudents.map(
                                                (student, index) => {
                                                    const summary =
                                                        gradeSummaries[
                                                            student.id
                                                        ] ?? {};
                                                    const q1 = summary.q1_grade;
                                                    const q2 = summary.q2_grade;
                                                    const final_grade =
                                                        summary.final_grade;
                                                    const gradeColors =
                                                        getGradeRowColors(
                                                            final_grade != null
                                                                ? String(
                                                                      final_grade,
                                                                  )
                                                                : "N/A",
                                                        );

                                                    return (
                                                        <tr
                                                            key={buildStudentKey(
                                                                student,
                                                                index,
                                                            )}
                                                            className={`${gradeColors.row} ${gradeColors.hoverRow} transition-colors`}
                                                        >
                                                            <td
                                                                className={`sticky left-0 z-10 ${gradeColors.leftCell} px-3 py-2 border-r border-gray-200 dark:border-gray-700 min-w-[160px]`}
                                                            >
                                                                <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                    {
                                                                        student.name
                                                                    }
                                                                </div>
                                                                {formatAcademicMeta(
                                                                    student,
                                                                ) && (
                                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                                        {formatAcademicMeta(
                                                                            student,
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 min-w-[100px]">
                                                                {student.lrn}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-center text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 min-w-[80px]">
                                                                {q1 != null
                                                                    ? q1
                                                                    : "—"}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-center text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 min-w-[80px]">
                                                                {q2 != null
                                                                    ? q2
                                                                    : "—"}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-center text-gray-900 dark:text-gray-100 min-w-[100px]">
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                        final_grade ==
                                                                        null
                                                                            ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                                                            : final_grade >=
                                                                                75
                                                                              ? "bg-green-100 text-green-800"
                                                                              : "bg-red-100 text-red-800"
                                                                    }`}
                                                                >
                                                                    {final_grade !=
                                                                    null
                                                                        ? final_grade
                                                                        : "—"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                },
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {sortedStudents.length === 0 && (
                                    <EmptyStudentState
                                        hasSearchTerm={Boolean(searchTerm)}
                                        searchTerm={searchTerm}
                                        onAddStudent={() => {
                                            if (isArchiveReadOnly) return;
                                            setIsAddStudentModalOpen(true);
                                        }}
                                    />
                                )}
                            </div>
                        )}
                        {selectedTab !== "final" && !hasAssignments && (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-xs">
                                {isArchiveReadOnly
                                    ? "No activity records are available for this quarter."
                                    : "Add your first activity under Written Works, Performance Task, or Quarterly Exam to begin encoding scores."}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showPasswordModal && passwordModalData && (
                <TemporaryPasswordModal
                    studentInfo={passwordModalData}
                    onClose={() => {
                        setShowPasswordModal(false);
                        setPasswordModalData(null);
                    }}
                />
            )}
            {!isArchiveReadOnly && (
                <EditGradeCategoriesModal
                    isOpen={isEditCategoriesModalOpen}
                    onClose={() => setIsEditCategoriesModalOpen(false)}
                    subjectId={selectedClass?.id}
                    categories={gradeCategories}
                    quarter={selectedQuarter}
                    onSuccess={({ categories: updatedCategories, quarter }) => {
                        applyCategoriesForQuarter(quarter, updatedCategories);
                    }}
                />
            )}
            {!isArchiveReadOnly && isAddStudentModalOpen && selectedClass && (
                <AddStudentModal
                    subjectId={selectedClass.id}
                    subjectLabel={selectedClassHeading}
                    existingLrns={students
                        .map((student) => student?.lrn)
                        .filter(Boolean)}
                    onSuccess={refreshCurrentClassData}
                    onClose={() => setIsAddStudentModalOpen(false)}
                />
            )}
            <TaskColumnSummaryModal
                isOpen={taskColumnModal.isOpen}
                task={selectedTaskColumnData?.task}
                categoryLabel={selectedTaskColumnData?.category?.label}
                summary={selectedTaskColumnData?.summary}
                isSubmitting={isSavingCategoryTask}
                isReadOnly={isArchiveReadOnly}
                canDelete={
                    !isQuarterlyExamCategory(selectedTaskColumnData?.category)
                }
                onClose={() =>
                    setTaskColumnModal(DEFAULT_TASK_COLUMN_MODAL_STATE)
                }
                onSave={handleTaskColumnUpdate}
                onDelete={handleTaskColumnDeleteRequest}
            />
            {isStudentStatusModalOpen && (
                <StudentStatusModal
                    onClose={() => setIsStudentStatusModalOpen(false)}
                    calculateFinalGrade={calculateFinalGrade}
                    calculateExpectedQuarterlyGrade={
                        calculateExpectedQuarterlyGrade
                    }
                    calculateOverallFinalGrade={calculateOverallFinalGrade}
                    hasQuarterlyExamScores={hasQuarterlyExamScores}
                    student={selectedStudentForStatus}
                    assignments={assignmentColumns}
                    gradeCategories={gradeCategories}
                    gradeStructure={localGradeStructure}
                />
            )}
            <GradeSubmissionModal
                isOpen={gradeSubmissionModal.isOpen}
                onClose={handleCloseGradeModal}
                status={gradeSubmissionModal.status}
                message={gradeSubmissionModal.message}
            />
            {!isArchiveReadOnly && (
                <DeleteGradeTaskModal
                    isOpen={deleteTaskModal.isOpen}
                    categoryLabel={deleteTaskModal.categoryLabel}
                    taskLabel={deleteTaskModal.taskLabel}
                    gradedStudentCount={deleteTaskModal.gradedStudentCount}
                    requiresTypedConfirmation={
                        deleteTaskModal.requiresTypedConfirmation
                    }
                    isSubmitting={isSavingCategoryTask}
                    onClose={closeDeleteTaskModal}
                    onConfirm={handleConfirmCategoryTaskDelete}
                />
            )}
            {!isArchiveReadOnly && (
                <StartQ2ConfirmModal
                    isOpen={isStartQ2ModalOpen}
                    onClose={() => setIsStartQ2ModalOpen(false)}
                    classId={selectedClass?.id}
                    hasQuarterlyExam={q1HasQuarterlyExam}
                    onSuccess={async () => {
                        setSelectedTab("q2");
                        setSelectedQuarter(2);
                        await refreshCurrentClassData();
                    }}
                />
            )}
        </>
    );
};

export default MyClass;

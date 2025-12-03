import React, { useEffect, useMemo, useRef, useState } from "react";
import TeacherLayout from "../../Layouts/TeacherLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useLoading } from "@/Context/LoadingContext";
import {
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Search,
    Plus,
    Upload,
    UploadCloud,
    FileDown,
} from "lucide-react";
import AddNewClassModal from "@/Components/AddNewClassModal";
import ClassCard from "@/Components/ClassCard";
import AddStudentModal from "@/Components/AddStudentModal";
import StudentStatusModal from "@/Components/StudentStatusModal";
import AddGradeTaskModal from "@/Components/AddGradeTaskModal";
import SendNudgeModal from "@/Components/SendNudgeModal";

const COLOR_OPTIONS = [
    {
        name: "indigo",
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        icon: "text-indigo-500",
    },
    {
        name: "blue",
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: "text-blue-500",
    },
    {
        name: "red",
        bg: "bg-red-100",
        text: "text-red-700",
        icon: "text-red-500",
    },
    {
        name: "green",
        bg: "bg-green-100",
        text: "text-green-700",
        icon: "text-green-500",
    },
    {
        name: "amber",
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: "text-amber-500",
    },
    {
        name: "purple",
        bg: "bg-purple-100",
        text: "text-purple-700",
        icon: "text-purple-500",
    },
    {
        name: "teal",
        bg: "bg-teal-100",
        text: "text-teal-700",
        icon: "text-teal-500",
    },
];

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

const normalizeLabel = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase();
};
const getColorClasses = (colorName) => {
    return COLOR_OPTIONS.find((c) => c.name === colorName) || COLOR_OPTIONS[0];
};

const buildClassKey = (cls, index) => {
    const idPart = cls?.id ?? `class-${index}`;
    const sectionPart = cls?.section ?? `section-${index}`;
    const namePart = cls?.name ?? `name-${index}`;
    return `${idPart}:${sectionPart}:${namePart}:${index}`;
};

const buildStudentKey = (student, index) => {
    const enrollmentPart = student?.enrollment_id ?? student?.pivot?.id;
    const idPart = student?.id;
    const lrnPart = student?.lrn;
    const fallback = `student-${index}`;
    return `${enrollmentPart ?? idPart ?? lrnPart ?? fallback}:${index}`;
};

const calculateFinalGrade = (grades = {}, categories = [], quarter = 1) => {
    if (!categories.length) return "N/A";

    // Filter grades for the specific quarter
    const quarterGrades = {};
    Object.entries(grades).forEach(([key, value]) => {
        // Grades are stored with quarter prefix like "q1_taskId" or just "taskId" for Q1
        const isQ1Grade = !key.startsWith("q2_");
        const isQ2Grade = key.startsWith("q2_");

        if (quarter === 1 && isQ1Grade) {
            quarterGrades[key] = value;
        } else if (quarter === 2 && isQ2Grade) {
            quarterGrades[key.replace("q2_", "")] = value;
        } else if (quarter === 1) {
            // For backward compatibility, use raw grades for Q1
            quarterGrades[key] = value;
        }
    });

    let totalWeight = 0;
    let weightedScore = 0;

    categories.forEach((category) => {
        const tasks = category?.tasks ?? [];
        if (!tasks.length || !category.weight) {
            return;
        }

        let earned = 0;
        let possible = 0;

        tasks.forEach((task) => {
            const rawValue = quarterGrades?.[task.id];

            if (
                rawValue === "" ||
                rawValue === null ||
                rawValue === undefined
            ) {
                return;
            }

            const numericValue = Number(rawValue);

            if (Number.isNaN(numericValue)) {
                return;
            }

            earned += numericValue;
            possible += Number(task.total ?? 0);
        });

        if (!possible) {
            return;
        }

        const categoryAverage = earned / possible;
        weightedScore += categoryAverage * category.weight;
        totalWeight += category.weight;
    });

    if (!totalWeight) {
        return "—";
    }

    const percentage = (weightedScore / totalWeight) * 100;
    return `${percentage.toFixed(1)}%`;
};

// Check if a quarter has quarterly exam scores (indicates quarter is started/finished)
const hasQuarterlyExamScores = (grades = {}, categories = [], quarter = 1) => {
    const quarterlyExamCategory = categories.find(
        (cat) =>
            cat.id === "quarterly_exam" ||
            cat.label?.toLowerCase().includes("quarterly exam")
    );

    if (!quarterlyExamCategory || !quarterlyExamCategory.tasks?.length) {
        return false;
    }

    return quarterlyExamCategory.tasks.some((task) => {
        const gradeKey = quarter === 2 ? `q2_${task.id}` : task.id;
        const value = grades?.[gradeKey];
        return value !== "" && value !== null && value !== undefined;
    });
};

// Check if quarter is complete (all categories have at least some scores)
const isQuarterComplete = (grades = {}, categories = [], quarter = 1) => {
    if (!categories.length) return false;

    return categories.every((category) => {
        const tasks = category?.tasks ?? [];
        if (!tasks.length) return false;

        return tasks.some((task) => {
            const gradeKey = quarter === 2 ? `q2_${task.id}` : task.id;
            const value = grades?.[gradeKey];
            return value !== "" && value !== null && value !== undefined;
        });
    });
};

// Calculate the overall final grade (average of Q1 and Q2)
const calculateOverallFinalGrade = (grades = {}, categories = []) => {
    const q1Complete = isQuarterComplete(grades, categories, 1);
    const q2Complete = isQuarterComplete(grades, categories, 2);

    // Final grade is only available when both quarters are complete
    if (!q1Complete || !q2Complete) {
        return "—";
    }

    const q1Grade = calculateFinalGrade(grades, categories, 1);
    const q2Grade = calculateFinalGrade(grades, categories, 2);

    if (q1Grade === "—" || q2Grade === "—") {
        return "—";
    }

    const q1Numeric = parseFloat(q1Grade);
    const q2Numeric = parseFloat(q2Grade);

    if (isNaN(q1Numeric) || isNaN(q2Numeric)) {
        return "—";
    }

    const average = (q1Numeric + q2Numeric) / 2;
    return `${average.toFixed(1)}%`;
};

// Calculate Expected Quarterly Grade - projects what the grade would be if all remaining tasks are completed at current performance level
const calculateExpectedQuarterlyGrade = (
    grades = {},
    categories = [],
    quarter = 1
) => {
    if (!categories.length) return "N/A";

    // Filter grades for the specific quarter
    const quarterGrades = {};
    Object.entries(grades).forEach(([key, value]) => {
        const isQ1Grade = !key.startsWith("q2_");
        const isQ2Grade = key.startsWith("q2_");

        if (quarter === 1 && isQ1Grade) {
            quarterGrades[key] = value;
        } else if (quarter === 2 && isQ2Grade) {
            quarterGrades[key.replace("q2_", "")] = value;
        } else if (quarter === 1) {
            quarterGrades[key] = value;
        }
    });

    let totalEarned = 0;
    let totalPossible = 0;
    let completedTasksCount = 0;
    let totalTasksCount = 0;

    // First pass: calculate current performance rate
    categories.forEach((category) => {
        const tasks = category?.tasks ?? [];
        tasks.forEach((task) => {
            totalTasksCount++;
            const rawValue = quarterGrades?.[task.id];

            if (
                rawValue === "" ||
                rawValue === null ||
                rawValue === undefined
            ) {
                return;
            }

            const numericValue = Number(rawValue);
            if (Number.isNaN(numericValue)) {
                return;
            }

            completedTasksCount++;
            totalEarned += numericValue;
            totalPossible += Number(task.total ?? 0);
        });
    });

    // If no tasks completed yet, return N/A
    if (!completedTasksCount || !totalPossible) {
        return "—";
    }

    // Calculate current performance rate
    const currentPerformanceRate = totalEarned / totalPossible;

    // Now calculate expected grade assuming same performance on remaining tasks
    let weightedScore = 0;
    let totalWeight = 0;

    categories.forEach((category) => {
        const tasks = category?.tasks ?? [];
        if (!tasks.length || !category.weight) {
            return;
        }

        let earned = 0;
        let possible = 0;

        tasks.forEach((task) => {
            const taskTotal = Number(task.total ?? 0);
            const rawValue = quarterGrades?.[task.id];

            if (
                rawValue === "" ||
                rawValue === null ||
                rawValue === undefined
            ) {
                // Project score based on current performance
                earned += taskTotal * currentPerformanceRate;
                possible += taskTotal;
            } else {
                const numericValue = Number(rawValue);
                if (!Number.isNaN(numericValue)) {
                    earned += numericValue;
                    possible += taskTotal;
                }
            }
        });

        if (!possible) {
            return;
        }

        const categoryAverage = earned / possible;
        weightedScore += categoryAverage * category.weight;
        totalWeight += category.weight;
    });

    if (!totalWeight) {
        return "—";
    }

    const percentage = (weightedScore / totalWeight) * 100;
    return `${percentage.toFixed(1)}%`;
};

const MyClasses = ({
    classes = [],
    rosters = {},
    gradeStructures = {},
    defaultSchoolYear,
}) => {
    const page = usePage();
    const flash = page?.props?.flash ?? {};
    const importSummary =
        typeof flash.import_summary === "object" ? flash.import_summary : null;
    const newStudentPassword =
        typeof flash.new_student_password === "object"
            ? flash.new_student_password
            : null;
    const gradeUpdateSummary =
        typeof flash.grade_update_summary === "object"
            ? flash.grade_update_summary
            : null;
    const gradeImportSummary =
        typeof flash.grade_import_summary === "object"
            ? flash.grade_import_summary
            : null;
    const importSummaryErrors = importSummary?.errors ?? [];

    const { startLoading, stopLoading } = useLoading();

    const [selectedClassId, setSelectedClassId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [studentViewMode, setStudentViewMode] = useState("classList");
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isStudentStatusModalOpen, setIsStudentStatusModalOpen] =
        useState(false);
    const [selectedStudentForStatus, setSelectedStudentForStatus] =
        useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [droppedFile, setDroppedFile] = useState(null);
    const [gradeDrafts, setGradeDrafts] = useState({});
    const [dirtyGrades, setDirtyGrades] = useState({});
    const [isSavingGrades, setIsSavingGrades] = useState(false);
    const [isImportingGrades, setIsImportingGrades] = useState(false);
    const [activeGradeCategoryId, setActiveGradeCategoryId] = useState(null);
    const [isSavingCategoryTask, setIsSavingCategoryTask] = useState(false);
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [collapsedCategories, setCollapsedCategories] = useState({});
    const [gradesExpanded, setGradesExpanded] = useState(true);
    const [sortConfig, setSortConfig] = useState({ column: null, order: null }); // column: 'quarterly' | 'expected' | 'final', order: 'asc' | 'desc'
    const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
    const [nudgeTargetClass, setNudgeTargetClass] = useState(null);
    const gradeUploadInputRef = useRef(null);

    // Handle send nudge button click
    const handleSendNudge = (cls) => {
        setNudgeTargetClass(cls);
        setIsNudgeModalOpen(true);
    };

    // Handle sort toggle for grade columns
    const handleSortToggle = (column) => {
        setSortConfig((prev) => {
            if (prev.column !== column) {
                // Different column, start with ascending
                return { column, order: "asc" };
            } else if (prev.order === "asc") {
                // Same column, ascending -> descending
                return { column, order: "desc" };
            } else {
                // Same column, descending -> null (clear sort)
                return { column: null, order: null };
            }
        });
    };

    const formatAcademicMeta = (student) => {
        return [student?.grade_level, student?.strand, student?.track]
            .filter(Boolean)
            .join(" • ");
    };

    const toggleCategoryCollapse = (categoryId) => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };

    const isCategoryCollapsed = (categoryId) => {
        return collapsedCategories[categoryId] ?? false;
    };

    // Check if category is Quarterly Exam (should not have Add button)
    const isQuarterlyExam = (category) => {
        return (
            category.id === "quarterly_exam" ||
            category.label?.toLowerCase().includes("quarterly exam")
        );
    };

    // Get latest task for a category (shown when collapsed)
    const getLatestTask = (category) => {
        const tasks = category?.tasks ?? [];
        return tasks.length > 0 ? tasks[tasks.length - 1] : null;
    };

    // Get row color classes based on grade percentage
    const getGradeRowColors = (gradeString) => {
        if (!gradeString || gradeString === "—" || gradeString === "N/A") {
            return {
                row: "",
                leftCell: "bg-white",
                rightCell: "bg-gray-50",
            };
        }

        const numericGrade = parseFloat(gradeString);
        if (isNaN(numericGrade)) {
            return {
                row: "",
                leftCell: "bg-white",
                rightCell: "bg-gray-50",
            };
        }

        if (numericGrade < 75) {
            // Failing - Intense Red
            return {
                row: "bg-red-300",
                leftCell: "bg-red-300",
                rightCell: "bg-red-400",
                hoverRow: "hover:bg-red-400",
            };
        } else if (numericGrade < 80) {
            // Warning - Intense Orange
            return {
                row: "bg-orange-300",
                leftCell: "bg-orange-300",
                rightCell: "bg-orange-400",
                hoverRow: "hover:bg-orange-400",
            };
        } else {
            // Safe - Intense Green
            return {
                row: "bg-green-300",
                leftCell: "bg-green-300",
                rightCell: "bg-green-400",
                hoverRow: "hover:bg-green-400",
            };
        }
    };

    const selectedClass = useMemo(
        () => classes.find((cls) => cls.id === selectedClassId) || null,
        [classes, selectedClassId]
    );

    const selectedGradeStructure = useMemo(() => {
        if (!selectedClass) return null;

        return gradeStructures?.[selectedClass.id] ?? null;
    }, [selectedClass, gradeStructures]);

    const gradeCategories = useMemo(() => {
        if (!selectedGradeStructure) {
            return FALLBACK_GRADE_CATEGORIES;
        }

        return selectedGradeStructure.categories ?? FALLBACK_GRADE_CATEGORIES;
    }, [selectedGradeStructure]);

    const assignmentColumns = useMemo(() => {
        if (selectedGradeStructure?.assignments?.length) {
            return selectedGradeStructure.assignments;
        }

        return gradeCategories.flatMap((category) => category.tasks ?? []);
    }, [selectedGradeStructure, gradeCategories]);

    const selectedTaskCategory = useMemo(() => {
        if (!activeGradeCategoryId) return null;

        return (
            gradeCategories.find(
                (category) => category.id === activeGradeCategoryId
            ) || null
        );
    }, [gradeCategories, activeGradeCategoryId]);

    const students = useMemo(() => {
        if (!selectedClass) return [];
        return rosters[selectedClass.id] || [];
    }, [rosters, selectedClass]);

    const selectedClassName = selectedClass?.name?.trim() ?? "";
    const selectedClassSection = selectedClass?.section?.trim() ?? "";
    const normalizedClassName = normalizeLabel(selectedClassName);
    const normalizedClassSection = normalizeLabel(selectedClassSection);
    const shouldShowClassSection =
        Boolean(selectedClassSection) &&
        normalizedClassName !== normalizedClassSection;
    const selectedClassHeading = selectedClass
        ? shouldShowClassSection && selectedClassName
            ? `${selectedClassName} • ${selectedClassSection}`
            : selectedClassName || selectedClassSection || "Class"
        : "My Classes";

    useEffect(() => {
        if (!selectedClass) {
            setGradeDrafts({});
            setDirtyGrades({});
            return;
        }

        const nextDrafts = {};

        students.forEach((student) => {
            nextDrafts[student.id] = assignmentColumns.reduce(
                (acc, assignment) => {
                    const currentValue = student.grades?.[assignment.id];

                    if (
                        currentValue === null ||
                        currentValue === undefined ||
                        currentValue === ""
                    ) {
                        acc[assignment.id] = "";
                    } else {
                        acc[assignment.id] = Number(currentValue);
                    }

                    return acc;
                },
                {}
            );
        });

        setGradeDrafts(nextDrafts);
        setDirtyGrades({});
    }, [selectedClass, students, assignmentColumns]);

    useEffect(() => {
        setActiveGradeCategoryId(null);
    }, [selectedClassId]);

    const dirtyGradeCount = Object.keys(dirtyGrades).length;
    const hasGradeChanges = dirtyGradeCount > 0;
    const isGradeView = studentViewMode === "gradeOverview";
    const hasAssignments = assignmentColumns.length > 0;
    const selectedClassMeta = selectedClass
        ? [selectedClass.strand, selectedClass.track]
              .filter(Boolean)
              .join(" • ")
        : null;
    const hasSelectedClass = Boolean(selectedClass);
    const pageTitle = selectedClassHeading;
    const pageSubtitle = hasSelectedClass
        ? selectedClass.subject
        : "Monitor rosters, imports, and grades from a single workspace.";

    const filteredStudents = useMemo(() => {
        let result = students;

        // Apply search filter
        if (searchTerm) {
            result = result.filter((student) => {
                const matchesName = student.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());
                const matchesLrn = student.lrn?.includes(searchTerm);
                return matchesName || matchesLrn;
            });
        }

        // Apply grade sorting
        if (sortConfig.column && sortConfig.order && selectedClass) {
            result = [...result].sort((a, b) => {
                let gradeA, gradeB;

                if (sortConfig.column === "quarterly") {
                    gradeA = calculateFinalGrade(
                        a.grades,
                        selectedClass.categories,
                        selectedQuarter
                    );
                    gradeB = calculateFinalGrade(
                        b.grades,
                        selectedClass.categories,
                        selectedQuarter
                    );
                } else if (sortConfig.column === "expected") {
                    gradeA = calculateExpectedQuarterlyGrade(
                        a.grades,
                        selectedClass.categories,
                        selectedQuarter
                    );
                    gradeB = calculateExpectedQuarterlyGrade(
                        b.grades,
                        selectedClass.categories,
                        selectedQuarter
                    );
                } else if (sortConfig.column === "final") {
                    gradeA = calculateOverallFinalGrade(
                        a.grades,
                        selectedClass.categories
                    );
                    gradeB = calculateOverallFinalGrade(
                        b.grades,
                        selectedClass.categories
                    );
                }

                // Handle null/undefined grades
                const numA =
                    gradeA !== null && gradeA !== undefined
                        ? parseFloat(gradeA)
                        : -1;
                const numB =
                    gradeB !== null && gradeB !== undefined
                        ? parseFloat(gradeB)
                        : -1;

                if (sortConfig.order === "asc") {
                    return numA - numB;
                } else {
                    return numB - numA;
                }
            });
        }

        return result;
    }, [students, searchTerm, sortConfig, selectedClass, selectedQuarter]);

    const handleClassSelect = (classObj) => {
        startLoading();
        setTimeout(() => {
            setSelectedClassId(classObj.id);
            setStudentViewMode("classList");
            setSearchTerm("");
            stopLoading();
        }, 150);
    };

    const handleGoBack = () => {
        startLoading();
        setTimeout(() => {
            setSelectedClassId(null);
            setSearchTerm("");
            setStudentViewMode("classList");
            stopLoading();
        }, 150);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];

        if (!file) return;

        const isCsv = file.type === "text/csv" || file.name.endsWith(".csv");
        if (!isCsv) {
            alert("Please drop a CSV class list file.");
            return;
        }

        setDroppedFile(file);
        setIsAddClassModalOpen(true);
    };

    const handleGradeChange = (
        enrollmentId,
        assignmentId,
        maxScore,
        rawValue
    ) => {
        let nextValue = rawValue;

        if (rawValue === "") {
            nextValue = "";
        } else {
            const numericValue = Number(rawValue);

            if (Number.isNaN(numericValue)) {
                return;
            }

            nextValue = Math.max(0, Math.min(maxScore, numericValue));
        }

        setGradeDrafts((prev) => {
            const updated = { ...prev };
            const studentGrades = { ...(updated[enrollmentId] || {}) };
            studentGrades[assignmentId] = nextValue;
            updated[enrollmentId] = studentGrades;
            return updated;
        });

        setDirtyGrades((prev) => ({
            ...prev,
            [`${enrollmentId}:${assignmentId}`]: true,
        }));
    };

    const handleSaveGrades = () => {
        if (!selectedClass || !hasGradeChanges || !assignmentColumns.length)
            return;

        const payload = [];

        Object.entries(gradeDrafts).forEach(
            ([enrollmentId, assignmentValues]) => {
                Object.entries(assignmentValues).forEach(
                    ([assignmentId, value]) => {
                        const key = `${enrollmentId}:${assignmentId}`;

                        if (!dirtyGrades[key]) {
                            return;
                        }

                        payload.push({
                            enrollment_id: Number(enrollmentId),
                            assignment_id: assignmentId,
                            score:
                                value === "" ||
                                value === null ||
                                value === undefined
                                    ? null
                                    : Number(value),
                            quarter: selectedQuarter,
                        });
                    }
                );
            }
        );

        if (!payload.length) {
            return;
        }

        setIsSavingGrades(true);

        router.post(
            route("teacher.classes.grades.bulk", selectedClass.id),
            { grades: payload },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDirtyGrades({});
                    router.reload({ only: ["classes", "rosters"] });
                },
                onFinish: () => {
                    setIsSavingGrades(false);
                },
            }
        );
    };

    const handleGradesUploadClick = () => {
        if (!selectedClass) return;
        gradeUploadInputRef.current?.click();
    };

    const handleGradesFileSelected = (event) => {
        if (!selectedClass) return;

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setIsImportingGrades(true);

        router.post(
            route("teacher.classes.grades.import", selectedClass.id),
            { grades_file: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => {
                    setIsImportingGrades(false);
                    event.target.value = "";
                },
            }
        );
    };

    const handleDownloadGradeTemplate = () => {
        const headers = [
            "Student Name",
            "LRN",
            ...gradeCategories.map((category) => {
                const percent = Math.round((category.weight ?? 0) * 100);
                return `${category.label} (${percent}%)`;
            }),
        ];

        const csvContent = `${headers.join(",")}\n`;
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.setAttribute(
            "download",
            `${
                selectedClass
                    ? `${selectedClass.name}-${selectedClass.section}`
                    : "grades"
            }-template.csv`
        );
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
    };

    const handleCategoryTaskSave = (newTask) => {
        if (!selectedClass || !selectedTaskCategory) return;

        const categoriesPayload = gradeCategories.map((category) => ({
            id: category.id,
            label: category.label,
            weight: category.weight,
            tasks: (category.tasks ?? []).map((task) => ({
                id: task.id,
                label: task.label,
                total: task.total,
            })),
        }));

        const targetCategory = categoriesPayload.find(
            (category) => category.id === selectedTaskCategory.id
        );

        if (!targetCategory) return;

        targetCategory.tasks.push({
            id: null,
            label: newTask.label,
            total: newTask.total,
        });

        setIsSavingCategoryTask(true);

        router.post(
            route("teacher.classes.grade-structure.update", selectedClass.id),
            { categories: categoriesPayload },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setActiveGradeCategoryId(null);
                    router.reload({
                        only: ["classes", "rosters", "gradeStructures"],
                    });
                },
                onFinish: () => {
                    setIsSavingCategoryTask(false);
                },
            }
        );
    };

    return (
        <>
            <Head title="My Classes" />
            <input
                ref={gradeUploadInputRef}
                type="file"
                className="hidden"
                accept=".csv,text/csv"
                onChange={handleGradesFileSelected}
            />

            <header className="mb-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-2">
                        {hasSelectedClass && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <button
                                    type="button"
                                    onClick={handleGoBack}
                                    className="font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    My Classes
                                </button>
                                <ChevronRight
                                    size={16}
                                    className="text-gray-400"
                                />
                            </div>
                        )}
                        <h1 className="text-3xl font-bold text-gray-900">
                            {pageTitle}
                        </h1>
                        {pageSubtitle && (
                            <p className="text-gray-500">{pageSubtitle}</p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {!hasSelectedClass && (
                            <button
                                type="button"
                                onClick={() => setIsAddClassModalOpen(true)}
                                className="flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                            >
                                <Plus size={16} /> Add New Class
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {(importSummary || gradeUpdateSummary || gradeImportSummary) && (
                <section className="mb-8 grid gap-4 lg:grid-cols-2">
                    {importSummary && (
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900 shadow-sm">
                            <div className="flex flex-wrap items-center gap-4">
                                <div>
                                    <p className="font-semibold">
                                        Recent classlist upload summary
                                    </p>
                                    {selectedClassMeta && (
                                        <p className="text-sm text-gray-500">
                                            {selectedClassMeta}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <span>
                                        Added: {importSummary.imported ?? 0}
                                    </span>
                                    <span>
                                        Updated: {importSummary.updated ?? 0}
                                    </span>
                                    <span>
                                        Skipped: {importSummary.skipped ?? 0}
                                    </span>
                                </div>
                            </div>
                            {importSummaryErrors.length > 0 && (
                                <details className="mt-3">
                                    <summary className="cursor-pointer font-medium text-red-700">
                                        View {importSummaryErrors.length} error
                                        {importSummaryErrors.length > 1
                                            ? "s"
                                            : ""}
                                    </summary>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-red-700">
                                        {importSummaryErrors.map(
                                            (error, index) => (
                                                <li key={index}>{error}</li>
                                            )
                                        )}
                                    </ul>
                                </details>
                            )}
                            {/* Created students with generated passwords (shown once) */}
                            {(importSummary.created_students?.length ?? 0) >
                                0 && (
                                <details className="mt-3">
                                    <summary className="cursor-pointer font-medium text-indigo-800">
                                        View generated passwords for{" "}
                                        {importSummary.created_students.length}{" "}
                                        newly created student(s)
                                    </summary>
                                    <ul className="mt-2 space-y-2 text-indigo-900">
                                        {importSummary.created_students.map(
                                            (s, idx) => (
                                                <li
                                                    key={idx}
                                                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center p-2 bg-white rounded-md border border-indigo-100"
                                                >
                                                    <div className="col-span-1 font-medium">
                                                        {s.name ??
                                                            s.email ??
                                                            "Student"}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        LRN: {s.lrn ?? "N/A"}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Email:{" "}
                                                        {s.email ?? "N/A"}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-mono bg-indigo-50 px-2 py-1 rounded">
                                                            {s.password}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigator.clipboard.writeText(
                                                                    s.password
                                                                )
                                                            }
                                                            className="text-sm text-indigo-700 hover:underline"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </details>
                            )}
                        </div>
                    )}

                    {newStudentPassword && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm">
                            <p className="font-semibold">New student created</p>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Name
                                    </p>
                                    <p className="font-medium">
                                        {newStudentPassword.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Email
                                    </p>
                                    <p className="font-medium">
                                        {newStudentPassword.email ?? "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Password
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono bg-green-50 px-2 py-1 rounded">
                                            {newStudentPassword.password}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigator.clipboard.writeText(
                                                    newStudentPassword.password
                                                )
                                            }
                                            className="text-sm text-emerald-700 hover:underline"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {gradeUpdateSummary && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm">
                            <div className="flex flex-wrap items-center gap-4">
                                <p className="font-semibold">
                                    Recent manual grade updates
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <span>
                                        Saved: {gradeUpdateSummary.updated ?? 0}
                                    </span>
                                    <span>
                                        Cleared:{" "}
                                        {gradeUpdateSummary.cleared ?? 0}
                                    </span>
                                    <span>
                                        Skipped:{" "}
                                        {gradeUpdateSummary.skipped ?? 0}
                                    </span>
                                </div>
                            </div>
                            {(gradeUpdateSummary.errors?.length ?? 0) > 0 && (
                                <details className="mt-3">
                                    <summary className="cursor-pointer font-medium text-red-700">
                                        View {gradeUpdateSummary.errors.length}{" "}
                                        issue
                                        {gradeUpdateSummary.errors.length > 1
                                            ? "s"
                                            : ""}
                                    </summary>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-red-700">
                                        {gradeUpdateSummary.errors.map(
                                            (error, index) => (
                                                <li key={index}>{error}</li>
                                            )
                                        )}
                                    </ul>
                                </details>
                            )}
                        </div>
                    )}

                    {gradeImportSummary && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 shadow-sm">
                            <div className="flex flex-wrap items-center gap-4">
                                <p className="font-semibold">
                                    Recent grade CSV upload
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <span>
                                        Updated:{" "}
                                        {gradeImportSummary.updated ?? 0}
                                    </span>
                                    <span>
                                        Skipped:{" "}
                                        {gradeImportSummary.skipped ?? 0}
                                    </span>
                                </div>
                            </div>
                            {(gradeImportSummary.errors?.length ?? 0) > 0 && (
                                <details className="mt-3">
                                    <summary className="cursor-pointer font-medium text-red-700">
                                        View {gradeImportSummary.errors.length}{" "}
                                        issue
                                        {gradeImportSummary.errors.length > 1
                                            ? "s"
                                            : ""}
                                    </summary>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-red-700">
                                        {gradeImportSummary.errors.map(
                                            (error, index) => (
                                                <li key={index}>{error}</li>
                                            )
                                        )}
                                    </ul>
                                </details>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* --- Conditional View: Grid or Classlist --- */}

            {!selectedClass ? (
                // Class Grid View (Main Page)
                <div
                    className="relative"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Dropzone Overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-indigo-500 bg-opacity-75 rounded-xl border-4 border-dashed border-white">
                            <UploadCloud
                                size={64}
                                className="text-white mb-4"
                            />
                            <p className="text-2xl font-bold text-white">
                                Drop CSV classlist here
                            </p>
                        </div>
                    )}

                    {/* Class Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((cls, index) => {
                            const colors = getColorClasses(cls.color);
                            const classKey = buildClassKey(cls, index);
                            return (
                                <ClassCard
                                    key={classKey}
                                    colors={colors}
                                    cls={cls}
                                    handleClassSelect={handleClassSelect}
                                    onSendNudge={handleSendNudge}
                                />
                            );
                        })}
                    </div>
                </div>
            ) : (
                // Classlist / Grade View
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {selectedClassHeading}
                                </h2>
                                {selectedClass?.current_quarter && (
                                    <span className="px-2 py-0.5 text-sm rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                        Current: Q
                                        {selectedClass.current_quarter}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-600">
                                {selectedClass.subject}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Toggle Buttons for Student View Mode */}
                            <div className="flex items-center p-1 bg-gray-100 rounded-lg">
                                <button
                                    onClick={() =>
                                        setStudentViewMode("classList")
                                    }
                                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                                        studentViewMode === "classList"
                                            ? "bg-white text-indigo-700 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    Student List
                                </button>
                                <button
                                    onClick={() =>
                                        setStudentViewMode("gradeOverview")
                                    }
                                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                                        studentViewMode === "gradeOverview"
                                            ? "bg-white text-indigo-700 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    Grade Overview
                                </button>
                            </div>

                            <button
                                onClick={handleDownloadGradeTemplate}
                                disabled={!selectedClass}
                                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FileDown size={18} /> CSV Template
                            </button>

                            <button
                                onClick={handleGradesUploadClick}
                                disabled={!selectedClass || isImportingGrades}
                                className="flex items-center gap-2 bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Upload size={18} />
                                {isImportingGrades
                                    ? "Uploading…"
                                    : "Upload Grades"}
                            </button>
                            {isGradeView && (
                                <button
                                    onClick={handleSaveGrades}
                                    disabled={
                                        !hasGradeChanges || isSavingGrades
                                    }
                                    className="flex items-center gap-2 bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSavingGrades
                                        ? "Saving…"
                                        : hasGradeChanges
                                        ? `Save Grades (${dirtyGradeCount})`
                                        : "Save Grades"}
                                </button>
                            )}
                            <button
                                onClick={() => setIsAddStudentModalOpen(true)}
                                className="flex items-center gap-2 bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                disabled={!selectedClass}
                            >
                                <Plus size={18} />
                                Add Student
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Search student by name or LRN..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search
                            size={20}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                    </div>

                    {/* Conditional Rendering based on studentViewMode */}
                    {studentViewMode === "classList" ? (
                        // Student List (No Grades)
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Student Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            LRN
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStudents.map((student, index) => {
                                        const studentKey = buildStudentKey(
                                            student,
                                            index
                                        );

                                        return (
                                            <tr
                                                key={studentKey}
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedStudentForStatus(
                                                        student
                                                    );
                                                    setIsStudentStatusModalOpen(
                                                        true
                                                    );
                                                }}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.name}
                                                    </div>
                                                    {formatAcademicMeta(
                                                        student
                                                    ) && (
                                                        <div className="text-xs text-gray-500">
                                                            {formatAcademicMeta(
                                                                student
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {student.lrn}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {student.email}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <p className="text-center text-gray-500 py-8">
                                    No students found.
                                </p>
                            )}
                        </div>
                    ) : (
                        // Grade Overview Table (With Grades)
                        <div>
                            {/* Quarter Toggle and Collapse Controls */}
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700">
                                            Quarter:
                                        </span>
                                        <div className="flex items-center p-1 bg-gray-100 rounded-lg">
                                            <button
                                                onClick={() =>
                                                    setSelectedQuarter(1)
                                                }
                                                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                                                    selectedQuarter === 1
                                                        ? "bg-white text-indigo-700 shadow-sm"
                                                        : "text-gray-600 hover:bg-gray-200"
                                                }`}
                                            >
                                                Q1
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const q1Finished =
                                                        students.some(
                                                            (student) =>
                                                                hasQuarterlyExamScores(
                                                                    student.grades,
                                                                    gradeCategories,
                                                                    1
                                                                )
                                                        );
                                                    const canOpenQ2 =
                                                        selectedClass?.current_quarter >=
                                                            2 || q1Finished;
                                                    if (canOpenQ2) {
                                                        setSelectedQuarter(2);
                                                    }
                                                }}
                                                disabled={
                                                    !(
                                                        selectedClass?.current_quarter >=
                                                            2 ||
                                                        students.some(
                                                            (student) =>
                                                                hasQuarterlyExamScores(
                                                                    student.grades,
                                                                    gradeCategories,
                                                                    1
                                                                )
                                                        )
                                                    )
                                                }
                                                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                                                    selectedQuarter === 2
                                                        ? "bg-white text-indigo-700 shadow-sm"
                                                        : !(
                                                              selectedClass?.current_quarter >=
                                                                  2 ||
                                                              students.some(
                                                                  (student) =>
                                                                      hasQuarterlyExamScores(
                                                                          student.grades,
                                                                          gradeCategories,
                                                                          1
                                                                      )
                                                              )
                                                          )
                                                        ? "text-gray-400 cursor-not-allowed"
                                                        : "text-gray-600 hover:bg-gray-200"
                                                }`}
                                                title={
                                                    !(
                                                        selectedClass?.current_quarter >=
                                                            2 ||
                                                        students.some(
                                                            (student) =>
                                                                hasQuarterlyExamScores(
                                                                    student.grades,
                                                                    gradeCategories,
                                                                    1
                                                                )
                                                        )
                                                    )
                                                        ? "Complete Quarter 1 quarterly exam first or start Quarter 2"
                                                        : ""
                                                }
                                            >
                                                Q2
                                            </button>
                                        </div>
                                        {/* Start Quarter 2 */}
                                        {selectedClass?.current_quarter < 2 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!selectedClass) return;
                                                    if (
                                                        !confirm(
                                                            "Start Quarter 2 for this class?\nThis will allow you to view Q2 grades and begin entering Q2 data."
                                                        )
                                                    )
                                                        return;
                                                    router.post(
                                                        route(
                                                            "teacher.classes.quarter.start",
                                                            selectedClass.id
                                                        ),
                                                        { quarter: 2 },
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                setSelectedQuarter(
                                                                    2
                                                                );
                                                                router.reload({
                                                                    only: [
                                                                        "classes",
                                                                        "rosters",
                                                                    ],
                                                                });
                                                            },
                                                        }
                                                    );
                                                }}
                                                className="ml-2 px-3 py-1.5 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700"
                                            >
                                                Start Q2
                                            </button>
                                        )}
                                    </div>

                                    {/* Grades Column Toggle */}
                                    <button
                                        onClick={() =>
                                            setGradesExpanded(!gradesExpanded)
                                        }
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                    >
                                        {gradesExpanded ? (
                                            <ChevronUp size={14} />
                                        ) : (
                                            <ChevronDown size={14} />
                                        )}
                                        {gradesExpanded
                                            ? "Collapse Grades"
                                            : "Expand Grades"}
                                    </button>
                                </div>

                                {selectedQuarter === 2 &&
                                    selectedClass?.current_quarter < 2 &&
                                    !students.some((student) =>
                                        hasQuarterlyExamScores(
                                            student.grades,
                                            gradeCategories,
                                            1
                                        )
                                    ) && (
                                        <p className="text-sm text-amber-600">
                                            Quarter 2 is locked until Quarter 1
                                            quarterly exam scores are entered.
                                        </p>
                                    )}
                            </div>

                            {/* Scrollable Table Container */}
                            <div className="relative border border-gray-200 rounded-lg">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-gray-50">
                                            {/* Main Header Row */}
                                            <tr>
                                                {/* Fixed Left: Student Name */}
                                                <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[200px]">
                                                    Student Name
                                                </th>
                                                {/* Fixed Left: LRN */}
                                                <th className="sticky left-[200px] z-20 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[120px]">
                                                    LRN
                                                </th>

                                                {/* Category Headers */}
                                                {gradeCategories.map(
                                                    (category) => {
                                                        const percent =
                                                            Math.round(
                                                                (category.weight ??
                                                                    0) * 100
                                                            );
                                                        const tasks =
                                                            category.tasks ??
                                                            [];
                                                        const isCollapsed =
                                                            isCategoryCollapsed(
                                                                category.id
                                                            );
                                                        const isQE =
                                                            isQuarterlyExam(
                                                                category
                                                            );
                                                        const latestTask =
                                                            getLatestTask(
                                                                category
                                                            );

                                                        // Determine colspan based on collapse state
                                                        const colSpan =
                                                            isCollapsed &&
                                                            latestTask
                                                                ? 1
                                                                : Math.max(
                                                                      tasks.length,
                                                                      1
                                                                  );

                                                        return (
                                                            <th
                                                                key={
                                                                    category.id
                                                                }
                                                                colSpan={
                                                                    colSpan
                                                                }
                                                                className="bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {/* Collapse Toggle (not for Quarterly Exam) */}
                                                                    {!isQE &&
                                                                        tasks.length >
                                                                            1 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    toggleCategoryCollapse(
                                                                                        category.id
                                                                                    )
                                                                                }
                                                                                className="p-0.5 text-gray-500 hover:text-gray-700 transition"
                                                                                title={
                                                                                    isCollapsed
                                                                                        ? "Expand"
                                                                                        : "Collapse"
                                                                                }
                                                                            >
                                                                                {isCollapsed ? (
                                                                                    <ChevronRight
                                                                                        size={
                                                                                            14
                                                                                        }
                                                                                    />
                                                                                ) : (
                                                                                    <ChevronDown
                                                                                        size={
                                                                                            14
                                                                                        }
                                                                                    />
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    <span className="flex-1">
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
                                                                                <span className="ml-1 text-[10px] text-gray-400">
                                                                                    (
                                                                                    {
                                                                                        tasks.length
                                                                                    }{" "}
                                                                                    items)
                                                                                </span>
                                                                            )}
                                                                    </span>
                                                                    {/* Add button (not for Quarterly Exam) */}
                                                                    {!isQE && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setActiveGradeCategoryId(
                                                                                    category.id
                                                                                )
                                                                            }
                                                                            className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                                                                        >
                                                                            +
                                                                            Add
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </th>
                                                        );
                                                    }
                                                )}

                                                {/* Fixed Right: Grade Columns (Collapsible) */}
                                                {gradesExpanded ? (
                                                    <>
                                                        <th
                                                            className="sticky right-[200px] z-20 bg-indigo-50 px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider border-l border-indigo-200 min-w-[100px] cursor-pointer hover:bg-indigo-100 transition-colors select-none"
                                                            onClick={() =>
                                                                handleSortToggle(
                                                                    "quarterly"
                                                                )
                                                            }
                                                            title="Click to sort by quarterly grade"
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                Q
                                                                {
                                                                    selectedQuarter
                                                                }{" "}
                                                                Grade
                                                                {sortConfig.column ===
                                                                    "quarterly" &&
                                                                    sortConfig.order ===
                                                                        "asc" && (
                                                                        <svg
                                                                            className="w-3 h-3"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M5 15l7-7 7 7"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                {sortConfig.column ===
                                                                    "quarterly" &&
                                                                    sortConfig.order ===
                                                                        "desc" && (
                                                                        <svg
                                                                            className="w-3 h-3"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M19 9l-7 7-7-7"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                {sortConfig.column !==
                                                                    "quarterly" && (
                                                                    <svg
                                                                        className="w-3 h-3 opacity-50"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                                                        />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th
                                                            className="sticky right-[100px] z-20 bg-indigo-50 px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider border-l border-indigo-100 min-w-[100px] cursor-pointer hover:bg-indigo-100 transition-colors select-none"
                                                            onClick={() =>
                                                                handleSortToggle(
                                                                    "expected"
                                                                )
                                                            }
                                                            title="Click to sort by expected grade"
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                Expected
                                                                {sortConfig.column ===
                                                                    "expected" &&
                                                                    sortConfig.order ===
                                                                        "asc" && (
                                                                        <svg
                                                                            className="w-3 h-3"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M5 15l7-7 7 7"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                {sortConfig.column ===
                                                                    "expected" &&
                                                                    sortConfig.order ===
                                                                        "desc" && (
                                                                        <svg
                                                                            className="w-3 h-3"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M19 9l-7 7-7-7"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                {sortConfig.column !==
                                                                    "expected" && (
                                                                    <svg
                                                                        className="w-3 h-3 opacity-50"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                                                        />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th
                                                            className="sticky right-0 z-20 bg-indigo-50 px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider border-l border-indigo-100 min-w-[100px] cursor-pointer hover:bg-indigo-100 transition-colors select-none"
                                                            onClick={() =>
                                                                handleSortToggle(
                                                                    "final"
                                                                )
                                                            }
                                                            title="Click to sort by final grade"
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                Final
                                                                {sortConfig.column ===
                                                                    "final" &&
                                                                    sortConfig.order ===
                                                                        "asc" && (
                                                                        <svg
                                                                            className="w-3 h-3"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M5 15l7-7 7 7"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                {sortConfig.column ===
                                                                    "final" &&
                                                                    sortConfig.order ===
                                                                        "desc" && (
                                                                        <svg
                                                                            className="w-3 h-3"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M19 9l-7 7-7-7"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                {sortConfig.column !==
                                                                    "final" && (
                                                                    <svg
                                                                        className="w-3 h-3 opacity-50"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                                                        />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </th>
                                                    </>
                                                ) : (
                                                    <th className="sticky right-0 z-20 bg-indigo-50 px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider border-l border-indigo-200 min-w-[100px]">
                                                        <div className="flex items-center gap-1">
                                                            <ChevronRight
                                                                size={14}
                                                            />
                                                            Grades
                                                        </div>
                                                    </th>
                                                )}
                                            </tr>

                                            {/* Sub-header Row for Task Labels */}
                                            <tr className="bg-gray-50/50">
                                                <th className="sticky left-0 z-20 bg-gray-50/50 border-r border-gray-200"></th>
                                                <th className="sticky left-[200px] z-20 bg-gray-50/50 border-r border-gray-200"></th>

                                                {gradeCategories.map(
                                                    (category) => {
                                                        const tasks =
                                                            category.tasks ??
                                                            [];
                                                        const isCollapsed =
                                                            isCategoryCollapsed(
                                                                category.id
                                                            );
                                                        const latestTask =
                                                            getLatestTask(
                                                                category
                                                            );

                                                        if (!tasks.length) {
                                                            return (
                                                                <th
                                                                    key={`${category.id}-empty`}
                                                                    className="px-4 py-2 text-left text-xs font-medium text-gray-400 border-r border-gray-200"
                                                                >
                                                                    No
                                                                    activities
                                                                    yet
                                                                </th>
                                                            );
                                                        }

                                                        // If collapsed, show only latest task
                                                        if (
                                                            isCollapsed &&
                                                            latestTask
                                                        ) {
                                                            return (
                                                                <th
                                                                    key={`${category.id}-collapsed`}
                                                                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-r border-gray-200"
                                                                >
                                                                    <span className="block">
                                                                        {
                                                                            latestTask.label
                                                                        }
                                                                    </span>
                                                                    <span className="text-[10px] font-normal text-gray-400">
                                                                        /{" "}
                                                                        {
                                                                            latestTask.total
                                                                        }{" "}
                                                                        pts
                                                                        (latest)
                                                                    </span>
                                                                </th>
                                                            );
                                                        }

                                                        return tasks.map(
                                                            (
                                                                task,
                                                                taskIndex
                                                            ) => (
                                                                <th
                                                                    key={
                                                                        task.id
                                                                    }
                                                                    className={`px-4 py-2 text-left text-xs font-medium text-gray-500 ${
                                                                        taskIndex ===
                                                                        tasks.length -
                                                                            1
                                                                            ? "border-r border-gray-200"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    <span className="block">
                                                                        {
                                                                            task.label
                                                                        }
                                                                    </span>
                                                                    <span className="text-[10px] font-normal text-gray-400">
                                                                        /{" "}
                                                                        {
                                                                            task.total
                                                                        }{" "}
                                                                        pts
                                                                    </span>
                                                                </th>
                                                            )
                                                        );
                                                    }
                                                )}

                                                {/* Empty cells for grade columns */}
                                                {gradesExpanded ? (
                                                    <>
                                                        <th className="sticky right-[200px] z-20 bg-indigo-50/50 border-l border-indigo-200"></th>
                                                        <th className="sticky right-[100px] z-20 bg-indigo-50/50 border-l border-indigo-100"></th>
                                                        <th className="sticky right-0 z-20 bg-indigo-50/50 border-l border-indigo-100"></th>
                                                    </>
                                                ) : (
                                                    <th className="sticky right-0 z-20 bg-indigo-50/50 border-l border-indigo-200"></th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredStudents.map(
                                                (student, index) => {
                                                    const draftValues =
                                                        gradeDrafts[
                                                            student.id
                                                        ] ??
                                                        student.grades ??
                                                        {};
                                                    const studentKey =
                                                        buildStudentKey(
                                                            student,
                                                            index
                                                        );
                                                    const studentDraft =
                                                        gradeDrafts[
                                                            student.id
                                                        ] ?? {};

                                                    // Calculate grade for row coloring
                                                    const currentGrade =
                                                        calculateExpectedQuarterlyGrade(
                                                            draftValues,
                                                            gradeCategories,
                                                            selectedQuarter
                                                        );
                                                    const gradeColors =
                                                        getGradeRowColors(
                                                            currentGrade
                                                        );

                                                    return (
                                                        <tr
                                                            key={studentKey}
                                                            className={`${
                                                                gradeColors.row
                                                            } ${
                                                                gradeColors.hoverRow ||
                                                                "hover:bg-gray-50/50"
                                                            } transition-colors`}
                                                        >
                                                            {/* Fixed Left: Student Name */}
                                                            <td
                                                                className={`sticky left-0 z-10 ${gradeColors.leftCell} px-4 py-3 border-r border-gray-200 min-w-[200px]`}
                                                            >
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {
                                                                        student.name
                                                                    }
                                                                </div>
                                                                {formatAcademicMeta(
                                                                    student
                                                                ) && (
                                                                    <div className="text-xs text-gray-500">
                                                                        {formatAcademicMeta(
                                                                            student
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            {/* Fixed Left: LRN */}
                                                            <td
                                                                className={`sticky left-[200px] z-10 ${gradeColors.leftCell} px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200 min-w-[120px]`}
                                                            >
                                                                {student.lrn}
                                                            </td>

                                                            {/* Grade Input Cells */}
                                                            {gradeCategories.map(
                                                                (category) => {
                                                                    const tasks =
                                                                        category.tasks ??
                                                                        [];
                                                                    const isCollapsed =
                                                                        isCategoryCollapsed(
                                                                            category.id
                                                                        );
                                                                    const latestTask =
                                                                        getLatestTask(
                                                                            category
                                                                        );

                                                                    if (
                                                                        !tasks.length
                                                                    ) {
                                                                        return (
                                                                            <td
                                                                                key={`${studentKey}-${category.id}-placeholder`}
                                                                                className="px-4 py-3 text-center text-xs text-gray-400 border-r border-gray-200"
                                                                            >
                                                                                —
                                                                            </td>
                                                                        );
                                                                    }

                                                                    // If collapsed, show only latest task input
                                                                    if (
                                                                        isCollapsed &&
                                                                        latestTask
                                                                    ) {
                                                                        const rawValue =
                                                                            studentDraft[
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

                                                                        return (
                                                                            <td
                                                                                key={`${studentKey}-${category.id}-collapsed`}
                                                                                className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200"
                                                                            >
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    max={
                                                                                        latestTask.total
                                                                                    }
                                                                                    step="0.01"
                                                                                    value={
                                                                                        inputValue
                                                                                    }
                                                                                    onChange={(
                                                                                        event
                                                                                    ) =>
                                                                                        handleGradeChange(
                                                                                            student.id,
                                                                                            latestTask.id,
                                                                                            latestTask.total,
                                                                                            event
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    }
                                                                                    className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                                                                                />
                                                                                <span className="mt-0.5 block text-[10px] text-gray-400">
                                                                                    /{" "}
                                                                                    {
                                                                                        latestTask.total
                                                                                    }
                                                                                </span>
                                                                            </td>
                                                                        );
                                                                    }

                                                                    return tasks.map(
                                                                        (
                                                                            task,
                                                                            taskIndex
                                                                        ) => {
                                                                            const rawValue =
                                                                                studentDraft[
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

                                                                            return (
                                                                                <td
                                                                                    key={`${studentKey}-${task.id}`}
                                                                                    className={`px-4 py-3 text-sm text-gray-700 ${
                                                                                        taskIndex ===
                                                                                        tasks.length -
                                                                                            1
                                                                                            ? "border-r border-gray-200"
                                                                                            : ""
                                                                                    }`}
                                                                                >
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max={
                                                                                            task.total
                                                                                        }
                                                                                        step="0.01"
                                                                                        value={
                                                                                            inputValue
                                                                                        }
                                                                                        onChange={(
                                                                                            event
                                                                                        ) =>
                                                                                            handleGradeChange(
                                                                                                student.id,
                                                                                                task.id,
                                                                                                task.total,
                                                                                                event
                                                                                                    .target
                                                                                                    .value
                                                                                            )
                                                                                        }
                                                                                        className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                                                                                    />
                                                                                    <span className="mt-0.5 block text-[10px] text-gray-400">
                                                                                        /{" "}
                                                                                        {
                                                                                            task.total
                                                                                        }
                                                                                    </span>
                                                                                </td>
                                                                            );
                                                                        }
                                                                    );
                                                                }
                                                            )}

                                                            {/* Fixed Right: Grade Columns */}
                                                            {gradesExpanded ? (
                                                                <>
                                                                    <td
                                                                        className={`sticky right-[200px] z-10 ${gradeColors.rightCell} px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 border-l border-gray-300 min-w-[100px]`}
                                                                    >
                                                                        {hasQuarterlyExamScores(
                                                                            draftValues,
                                                                            gradeCategories,
                                                                            selectedQuarter
                                                                        )
                                                                            ? calculateFinalGrade(
                                                                                  draftValues,
                                                                                  gradeCategories,
                                                                                  selectedQuarter
                                                                              )
                                                                            : "—"}
                                                                    </td>
                                                                    <td
                                                                        className={`sticky right-[100px] z-10 ${gradeColors.rightCell} px-4 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600 border-l border-gray-200 min-w-[100px]`}
                                                                    >
                                                                        {
                                                                            currentGrade
                                                                        }
                                                                    </td>
                                                                    <td
                                                                        className={`sticky right-0 z-10 ${gradeColors.rightCell} px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 border-l border-gray-200 min-w-[100px]`}
                                                                    >
                                                                        {calculateOverallFinalGrade(
                                                                            draftValues,
                                                                            gradeCategories
                                                                        )}
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <td
                                                                    className={`sticky right-0 z-10 ${gradeColors.rightCell} px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 border-l border-gray-300 min-w-[100px]`}
                                                                >
                                                                    {calculateOverallFinalGrade(
                                                                        draftValues,
                                                                        gradeCategories
                                                                    )}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredStudents.length === 0 && (
                                    <p className="text-center text-gray-500 py-8">
                                        No students found.
                                    </p>
                                )}
                            </div>
                            {!hasAssignments && (
                                <p className="text-center text-gray-500 py-6">
                                    Add your first activity under Written Works,
                                    Performance Task, or Quarterly Exam to begin
                                    encoding scores.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* --- (NEW) Add Class Modal --- */}
            {isAddClassModalOpen && (
                <AddNewClassModal
                    onClose={() => {
                        setIsAddClassModalOpen(false);
                        setDroppedFile(null);
                    }}
                    defaultSchoolYear={defaultSchoolYear}
                    initialFile={droppedFile}
                />
            )}

            {/* --- Add Student Modal --- */}
            {isAddStudentModalOpen && selectedClass && (
                <AddStudentModal
                    subjectId={selectedClass.id}
                    subjectLabel={selectedClassHeading}
                    onClose={() => setIsAddStudentModalOpen(false)}
                />
            )}
            {selectedTaskCategory && selectedClass && (
                <AddGradeTaskModal
                    category={selectedTaskCategory}
                    onClose={() => setActiveGradeCategoryId(null)}
                    onSave={handleCategoryTaskSave}
                    isSubmitting={isSavingCategoryTask}
                />
            )}
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
                />
            )}

            {/* --- Send Nudge Modal --- */}
            <SendNudgeModal
                isOpen={isNudgeModalOpen}
                onClose={() => {
                    setIsNudgeModalOpen(false);
                    setNudgeTargetClass(null);
                }}
                subject={nudgeTargetClass}
            />
        </>
    );
};

MyClasses.layout = (page) => <TeacherLayout children={page} />;

export default MyClasses;

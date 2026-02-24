import React, { useState, useMemo, useRef } from "react";
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
} from "lucide-react";

// Modals
import {
    AddGradeTaskModal,
    AddStudentModal,
    EditGradeCategoriesModal,
    StudentStatusModal,
    TemporaryPasswordModal,
    ClassList,
} from "@/Components/Teacher/MyClasses";

// Fallback Grade Categories (in case the class doesn't have any defined)
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build a unique key for a student in a list
 */
const buildStudentKey = (student, index) => {
    const enrollmentPart = student?.enrollment_id ?? student?.pivot?.id;
    const idPart = student?.id;
    const lrnPart = student?.lrn;
    const fallback = `student-${index}`;
    return `${enrollmentPart ?? idPart ?? lrnPart ?? fallback}:${index}`;
};

/**
 * Calculate final grade for a quarter based on grades and categories
 */
const calculateFinalGrade = (grades = {}, categories = [], quarter = 1) => {
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
        }
    });

    let totalWeight = 0;
    let weightedScore = 0;

    categories.forEach((category) => {
        const tasks = category?.tasks ?? [];
        if (!tasks.length || !category.weight) return;

        let earned = 0;
        let possible = 0;

        tasks.forEach((task) => {
            const gradeKey = task.id;
            const value = quarterGrades[gradeKey];
            if (value !== "" && value !== null && value !== undefined) {
                earned += parseFloat(value) || 0;
                possible += parseFloat(task.total) || 0;
            }
        });

        if (!possible) return;

        const categoryAverage = earned / possible;
        weightedScore += categoryAverage * category.weight;
        totalWeight += category.weight;
    });

    if (!totalWeight) return "—";

    const percentage = (weightedScore / totalWeight) * 100;
    return `${percentage.toFixed(1)}%`;
};

/**
 * Check if a quarter has quarterly exam scores
 */
const hasQuarterlyExamScores = (grades = {}, categories = [], quarter = 1) => {
    const quarterlyExamCategory = categories.find(
        (cat) =>
            cat.id === "quarterly_exam" ||
            cat.label?.toLowerCase().includes("quarterly exam"),
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

/**
 * Check if quarter is complete (all categories have at least some scores)
 */
const isQuarterComplete = (grades = {}, categories = [], quarter = 1) => {
    if (!categories.length) return false;

    return categories.every((category) => {
        const tasks = category?.tasks ?? [];
        if (!tasks.length) return true;

        return tasks.some((task) => {
            const gradeKey = quarter === 2 ? `q2_${task.id}` : task.id;
            const value = grades?.[gradeKey];
            return value !== "" && value !== null && value !== undefined;
        });
    });
};

/**
 * Calculate the overall final grade (average of Q1 and Q2)
 */
const calculateOverallFinalGrade = (grades = {}, categories = []) => {
    const q1Complete = isQuarterComplete(grades, categories, 1);
    const q2Complete = isQuarterComplete(grades, categories, 2);

    if (!q1Complete || !q2Complete) return "—";

    const q1Grade = calculateFinalGrade(grades, categories, 1);
    const q2Grade = calculateFinalGrade(grades, categories, 2);

    if (q1Grade === "—" || q2Grade === "—") return "—";

    const q1Numeric = parseFloat(q1Grade);
    const q2Numeric = parseFloat(q2Grade);

    if (isNaN(q1Numeric) || isNaN(q2Numeric)) return "—";

    const average = (q1Numeric + q2Numeric) / 2;
    return `${average.toFixed(1)}%`;
};

/**
 * Calculate Expected Quarterly Grade - projects grade based on current performance
 */
const calculateExpectedQuarterlyGrade = (
    grades = {},
    categories = [],
    quarter = 1,
) => {
    if (!categories.length) return "N/A";

    const quarterGrades = {};
    Object.entries(grades).forEach(([key, value]) => {
        const isQ1Grade = !key.startsWith("q2_");
        const isQ2Grade = key.startsWith("q2_");

        if (quarter === 1 && isQ1Grade) {
            quarterGrades[key] = value;
        } else if (quarter === 2 && isQ2Grade) {
            quarterGrades[key.replace("q2_", "")] = value;
        }
    });

    let totalEarned = 0;
    let totalPossible = 0;
    let completedTasksCount = 0;

    categories.forEach((category) => {
        const tasks = category?.tasks ?? [];
        tasks.forEach((task) => {
            const gradeKey = task.id;
            const value = quarterGrades[gradeKey];
            if (value !== "" && value !== null && value !== undefined) {
                totalEarned += parseFloat(value) || 0;
                totalPossible += parseFloat(task.total) || 0;
                completedTasksCount++;
            }
        });
    });

    if (!completedTasksCount || !totalPossible) return "N/A";

    const currentPerformanceRate = totalEarned / totalPossible;
    let weightedScore = 0;
    let totalWeight = 0;

    categories.forEach((category) => {
        const tasks = category?.tasks ?? [];
        if (!tasks.length || !category.weight) return;

        let categoryScore = 0;
        let categoryTotal = 0;

        tasks.forEach((task) => {
            const gradeKey = task.id;
            const value = quarterGrades[gradeKey];
            const taskTotal = parseFloat(task.total) || 0;

            if (value !== "" && value !== null && value !== undefined) {
                categoryScore += parseFloat(value) || 0;
            } else {
                categoryScore += taskTotal * currentPerformanceRate;
            }
            categoryTotal += taskTotal;
        });

        if (categoryTotal > 0) {
            const categoryAverage = categoryScore / categoryTotal;
            weightedScore += categoryAverage * category.weight;
            totalWeight += category.weight;
        }
    });

    if (!totalWeight) return "N/A";

    const percentage = (weightedScore / totalWeight) * 100;
    return `${percentage.toFixed(1)}%`;
};

/**
 * Get color classes for grade rows based on the grade value
 */
const getGradeRowColors = (grade) => {
    // Parse grade to get numeric value
    const numericGrade = parseFloat(grade);

    // Default colors
    let colors = {
        row: "bg-white",
        hoverRow: "hover:bg-gray-50/50",
        leftCell: "bg-white",
        rightCell: "bg-white",
    };

    // Apply colors based on grade ranges (assuming 75% is passing)
    if (grade === "N/A" || isNaN(numericGrade)) {
        colors = {
            row: "bg-gray-50",
            hoverRow: "hover:bg-gray-100/50",
            leftCell: "bg-gray-50",
            rightCell: "bg-gray-50",
        };
    } else if (numericGrade >= 90) {
        // Excellent (90-100%)
        colors = {
            row: "bg-green-50",
            hoverRow: "hover:bg-green-100/50",
            leftCell: "bg-green-50",
            rightCell: "bg-green-50",
        };
    } else if (numericGrade >= 85) {
        // Very Good (85-89%)
        colors = {
            row: "bg-blue-50",
            hoverRow: "hover:bg-blue-100/50",
            leftCell: "bg-blue-50",
            rightCell: "bg-blue-50",
        };
    } else if (numericGrade >= 80) {
        // Good (80-84%)
        colors = {
            row: "bg-yellow-50",
            hoverRow: "hover:bg-yellow-100/50",
            leftCell: "bg-yellow-50",
            rightCell: "bg-yellow-50",
        };
    } else if (numericGrade >= 75) {
        // Satisfactory (75-79%)
        colors = {
            row: "bg-orange-50",
            hoverRow: "hover:bg-orange-100/50",
            leftCell: "bg-orange-50",
            rightCell: "bg-orange-50",
        };
    } else {
        // Below 75% - needs improvement
        colors = {
            row: "bg-red-50",
            hoverRow: "hover:bg-red-100/50",
            leftCell: "bg-red-50",
            rightCell: "bg-red-50",
        };
    }

    return colors;
};

/**
 * Format academic metadata for display
 */
const formatAcademicMeta = (student) => {
    return [student?.grade_level, student?.strand, student?.track]
        .filter(Boolean)
        .join(" • ");
};

// ============================================================================
// Main Component
// ============================================================================

const MyClass = (props) => {
    const {
        selectedClassHeading,
        selectedClass,
        roster = [],
        gradeStructure,
    } = props;

    // ========================================================================
    // State Management
    // ========================================================================

    // View mode state
    const [studentViewMode, setStudentViewMode] = useState("classList");
    const isGradeView = studentViewMode === "gradeOverview";
    const [selectedQuarter, setSelectedQuarter] = useState(1);

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState("");

    // Grade view state
    const [gradesExpanded, setGradesExpanded] = useState(false);

    // Modal State
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isEditCategoriesModalOpen, setIsEditCategoriesModalOpen] =
        useState(false);
    const [isStudentStatusModalOpen, setIsStudentStatusModalOpen] =
        useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordModalData, setPasswordModalData] = useState(null);
    const [activeGradeCategoryId, setActiveGradeCategoryId] = useState(null);
    const [selectedStudentForStatus, setSelectedStudentForStatus] =
        useState(null);

    // Grade management state
    const [dirtyGrades, setDirtyGrades] = useState({});
    const [isImportingGrades, setIsImportingGrades] = useState(false);
    const [isSavingGrades, setIsSavingGrades] = useState(false);
    const [isSavingCategoryTask, setIsSavingCategoryTask] = useState(false);

    // Category collapse state (for grade overview table)
    const [collapsedCategories, setCollapsedCategories] = useState({});

    // Classlist upload state
    const [isUploadingClasslist, setIsUploadingClasslist] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(null);
    const classlistUploadRef = useRef(null);
    const gradeUploadRef = useRef(null);
    // ========================================================================
    // Helper Functions
    // ========================================================================

    /**
     * Check if a category is collapsed in the grade table
     */
    const isCategoryCollapsed = (categoryId) => {
        return collapsedCategories[categoryId] === true;
    };

    /**
     * Toggle the collapsed state of a category
     */
    const toggleCategoryCollapse = (categoryId) => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };

    /**
     * Check if a category is a Quarterly Exam
     */
    const isQuarterlyExam = (category) => {
        return (
            category.id === "quarterly_exam" ||
            category.label?.toLowerCase().includes("quarterly exam")
        );
    };

    /**
     * Get the latest (most recent) task from a category
     */
    const getLatestTask = (category) => {
        const tasks = category?.tasks ?? [];
        if (tasks.length === 0) return null;
        return tasks[tasks.length - 1];
    };

    // ========================================================================
    // Computed Values
    // ========================================================================

    const dirtyGradeCount = Object.keys(dirtyGrades).length;
    const hasGradeChanges = dirtyGradeCount > 0;

    // Use passed gradeStructure or fallback
    const gradeCategories =
        gradeStructure?.categories || FALLBACK_GRADE_CATEGORIES;
    const categories = gradeCategories;
    const students = roster;

    // Filter students based on search term
    const filteredStudents = useMemo(() => {
        if (!searchTerm.trim()) return students;

        const lowerSearch = searchTerm.toLowerCase();
        return students.filter((student) => {
            const name = (student.name || "").toLowerCase();
            const lrn = (student.lrn || "").toLowerCase();
            return name.includes(lowerSearch) || lrn.includes(lowerSearch);
        });
    }, [students, searchTerm]);

    // Get assignment columns from grade categories
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

    // Check if there are any assignments defined
    const hasAssignments = assignmentColumns.length > 0;

    // Get selected task category for add task modal
    const selectedTaskCategory = useMemo(() => {
        if (!activeGradeCategoryId) return null;
        return gradeCategories.find((cat) => cat.id === activeGradeCategoryId);
    }, [activeGradeCategoryId, gradeCategories]);

    // ========================================================================
    // Event Handlers
    // ========================================================================

    /**
     * Handle saving grades to the server
     */
    const handleSaveGrades = async () => {
        if (!hasGradeChanges || !selectedClass) return;
        setIsSavingGrades(true);
        try {
            const response = await fetch(
                `/teacher/classes/${selectedClass.id}/grades/bulk`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN":
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                    },
                    body: JSON.stringify({ grades: dirtyGrades }),
                },
            );

            if (!response.ok) {
                throw new Error("Failed to save grades");
            }

            setDirtyGrades({});
            console.log("Grades saved successfully");
        } catch (error) {
            console.error("Error saving grades:", error);
        } finally {
            setIsSavingGrades(false);
        }
    };

    /**
     * Handle saving a new task/assignment to a category
     */
    const handleCategoryTaskSave = async (categoryId, taskData) => {
        if (!selectedClass) return;
        setIsSavingCategoryTask(true);
        try {
            // TODO: Implement actual API call to save the task
            console.log("Saving task:", { categoryId, taskData });
            setActiveGradeCategoryId(null);
        } catch (error) {
            console.error("Error saving task:", error);
        } finally {
            setIsSavingCategoryTask(false);
        }
    };

    /**
     * Trigger the hidden classlist file input
     */
    const handleClasslistUploadClick = () => {
        classlistUploadRef.current?.click();
    };

    /**
     * Handle classlist CSV file selection and upload
     */
    const handleClasslistFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !selectedClass) return;

        // Reset previous messages
        setUploadError(null);
        setUploadSuccess(null);
        setIsUploadingClasslist(true);

        const formData = new FormData();
        formData.append("classlist", file);

        try {
            // Use Inertia router to post the file
            router.post(
                `/teacher/classes/${selectedClass.id}/classlist`,
                formData,
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        setUploadSuccess(
                            "Classlist uploaded successfully! Students have been added.",
                        );
                        // Reset file input
                        if (classlistUploadRef.current) {
                            classlistUploadRef.current.value = "";
                        }
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

    /**
     * Trigger the hidden grade file input
     */
    const handleGradesUploadClick = () => {
        gradeUploadRef.current?.click();
    };

    /**
     * Handle grades CSV file selection and upload
     */
    const handleGradesFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !selectedClass) return;

        setUploadError(null);
        setUploadSuccess(null);
        setIsImportingGrades(true);

        const formData = new FormData();
        formData.append("grades", file);

        try {
            router.post(
                `/teacher/classes/${selectedClass.id}/grades/import`,
                formData,
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        setUploadSuccess("Grades imported successfully!");
                        if (gradeUploadRef.current) {
                            gradeUploadRef.current.value = "";
                        }
                    },
                    onError: (errors) => {
                        const errorMsg =
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

    /**
     * Download classlist CSV template
     */
    const handleDownloadClasslistTemplate = () => {
        const headers = ["name", "lrn", "grade_level", "section", "email"];
        const sampleRow = [
            "Juan Dela Cruz",
            "123456789012",
            "Grade 11",
            "Section A",
            "juan@example.com",
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

    /**
     * Download grade template CSV
     */
    const handleDownloadGradeTemplate = () => {
        if (!selectedClass || assignmentColumns.length === 0) return;

        const headers = [
            "lrn",
            "name",
            ...assignmentColumns.map((col) => col.id),
        ];

        // Create sample rows from current students
        const rows = filteredStudents.slice(0, 3).map((student) => {
            const row = [student.lrn || "", student.name || ""];
            assignmentColumns.forEach((col) => {
                row.push(student.grades?.[col.id] || "");
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

    // ========================================================================
    // Render
    // ========================================================================

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

            {/* My Class */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                {/* Upload Status Messages */}
                {(uploadError || uploadSuccess) && (
                    <div className="mb-4">
                        {uploadError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {uploadError}
                                <button
                                    onClick={() => setUploadError(null)}
                                    className="ml-2 text-red-500 hover:text-red-700"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        {uploadSuccess && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                {uploadSuccess}
                                <button
                                    onClick={() => setUploadSuccess(null)}
                                    className="ml-2 text-green-500 hover:text-green-700"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {selectedClassHeading}
                            </h2>
                            {selectedClass?.current_quarter && (
                                <span className="px-2 py-0.5 text-sm rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                    Current: Q{selectedClass.current_quarter}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600">{selectedClass.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Toggle Buttons for Student View Mode */}
                        <div className="flex items-center p-1 bg-gray-100 rounded-lg">
                            {/* Classlist */}
                            <button
                                onClick={() => setStudentViewMode("classList")}
                                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                                    studentViewMode === "classList"
                                        ? "bg-white text-indigo-700 shadow-sm"
                                        : "text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                Student List
                            </button>
                            {/* Grade Overview */}
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

                        {/* Upload Classlist CSV */}
                        <button
                            onClick={handleClasslistUploadClick}
                            disabled={!selectedClass || isUploadingClasslist}
                            className="flex items-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Upload students from CSV file"
                        >
                            <Users size={18} />
                            {isUploadingClasslist
                                ? "Uploading…"
                                : "Upload Classlist"}
                        </button>

                        {/* Download CSV Template */}
                        <button
                            onClick={
                                isGradeView
                                    ? handleDownloadGradeTemplate
                                    : handleDownloadClasslistTemplate
                            }
                            disabled={!selectedClass}
                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title={
                                isGradeView
                                    ? "Download grade template CSV"
                                    : "Download classlist template CSV"
                            }
                        >
                            <FileDown size={18} />{" "}
                            {isGradeView ? "Grade Template" : "CSV Template"}
                        </button>

                        {/* Upload Grades (only shown in grade view) */}
                        {isGradeView && (
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
                        )}
                        {isGradeView && (
                            <button
                                onClick={handleSaveGrades}
                                disabled={!hasGradeChanges || isSavingGrades}
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
                        <ClassList
                            filteredStudents={filteredStudents}
                            setSelectedStudentForStatus={
                                setSelectedStudentForStatus
                            }
                            setIsStudentStatusModalOpen={
                                setIsStudentStatusModalOpen
                            }
                            buildStudentKey={buildStudentKey}
                        />
                        {filteredStudents.length === 0 && (
                            <EmptyStudentState
                                hasSearchTerm={Boolean(searchTerm)}
                                searchTerm={searchTerm}
                                onAddStudent={() =>
                                    setIsAddStudentModalOpen(true)
                                }
                            />
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
                                        {/* <button
                                            onClick={() => {
                                                const q1Finished =
                                                    students.some((student) =>
                                                        hasQuarterlyExamScores(
                                                            student.grades,
                                                            gradeCategories,
                                                            1,
                                                        ),
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
                                                    students.some((student) =>
                                                        hasQuarterlyExamScores(
                                                            student.grades,
                                                            gradeCategories,
                                                            1,
                                                        ),
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
                                                                        1,
                                                                    ),
                                                            )
                                                        )
                                                      ? "text-gray-400 cursor-not-allowed"
                                                      : "text-gray-600 hover:bg-gray-200"
                                            }`}
                                            title={
                                                !(
                                                    selectedClass?.current_quarter >=
                                                        2 ||
                                                    students.some((student) =>
                                                        hasQuarterlyExamScores(
                                                            student.grades,
                                                            gradeCategories,
                                                            1,
                                                        ),
                                                    )
                                                )
                                                    ? "Complete Quarter 1 quarterly exam first or start Quarter 2"
                                                    : ""
                                            }
                                        >
                                            Q2
                                        </button> */}
                                    </div>
                                    {/* Start Quarter 2 */}
                                    {/* {selectedClass?.current_quarter < 2 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!selectedClass) return;
                                                if (
                                                    !confirm(
                                                        "Start Quarter 2 for this class?\nThis will allow you to view Q2 grades and begin entering Q2 data.",
                                                    )
                                                )
                                                    return;
                                                router.post(
                                                    route(
                                                        "teacher.classes.quarter.start",
                                                        selectedClass.id,
                                                    ),
                                                    { quarter: 2 },
                                                    {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            setSelectedQuarter(
                                                                2,
                                                            );
                                                            router.reload({
                                                                only: [
                                                                    "classes",
                                                                    "rosters",
                                                                ],
                                                            });
                                                        },
                                                    },
                                                );
                                            }}
                                            className="ml-2 px-3 py-1.5 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700"
                                        >
                                            Start Q2
                                        </button>
                                    )} */}
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Edit Grade Categories Button */}
                                    <button
                                        onClick={() =>
                                            setIsEditCategoriesModalOpen(true)
                                        }
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                        title="Edit grade category percentages"
                                    >
                                        <Settings size={14} />
                                        Edit Percentages
                                    </button>

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
                            </div>

                            {selectedQuarter === 2 &&
                                selectedClass?.current_quarter < 2 &&
                                !students.some((student) =>
                                    hasQuarterlyExamScores(
                                        student.grades,
                                        gradeCategories,
                                        1,
                                    ),
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
                                            {gradeCategories.map((category) => {
                                                const percent = Math.round(
                                                    (category.weight ?? 0) *
                                                        100,
                                                );
                                                const tasks =
                                                    category.tasks ?? [];
                                                const isCollapsed =
                                                    isCategoryCollapsed(
                                                        category.id,
                                                    );
                                                const isQE =
                                                    isQuarterlyExam(category);
                                                const latestTask =
                                                    getLatestTask(category);

                                                // Determine colspan based on collapse state
                                                const colSpan =
                                                    isCollapsed && latestTask
                                                        ? 1
                                                        : Math.max(
                                                              tasks.length,
                                                              1,
                                                          );

                                                return (
                                                    <th
                                                        key={category.id}
                                                        colSpan={colSpan}
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
                                                                                category.id,
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
                                                                {category.label}{" "}
                                                                ({percent}
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
                                                                            category.id,
                                                                        )
                                                                    }
                                                                    className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                                                                >
                                                                    + Add
                                                                </button>
                                                            )}
                                                        </div>
                                                    </th>
                                                );
                                            })}

                                            {/* Fixed Right: Grade Columns (Collapsible) */}
                                            {gradesExpanded ? (
                                                <>
                                                    <th
                                                        className="sticky right-[200px] z-20 bg-indigo-50 px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider border-l border-indigo-200 min-w-[100px] cursor-pointer hover:bg-indigo-100 transition-colors select-none"
                                                        onClick={() =>
                                                            handleSortToggle(
                                                                "quarterly",
                                                            )
                                                        }
                                                        title="Click to sort by quarterly grade"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Q{selectedQuarter}{" "}
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
                                                                "expected",
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
                                                                "final",
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

                                            {gradeCategories.map((category) => {
                                                const tasks =
                                                    category.tasks ?? [];
                                                const isCollapsed =
                                                    isCategoryCollapsed(
                                                        category.id,
                                                    );
                                                const latestTask =
                                                    getLatestTask(category);

                                                if (!tasks.length) {
                                                    return (
                                                        <th
                                                            key={`${category.id}-empty`}
                                                            className="px-4 py-2 text-left text-xs font-medium text-gray-400 border-r border-gray-200"
                                                        >
                                                            No activities yet
                                                        </th>
                                                    );
                                                }

                                                // If collapsed, show only latest task
                                                if (isCollapsed && latestTask) {
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
                                                                pts (latest)
                                                            </span>
                                                        </th>
                                                    );
                                                }

                                                return tasks.map(
                                                    (task, taskIndex) => (
                                                        <th
                                                            key={task.id}
                                                            className={`px-4 py-2 text-left text-xs font-medium text-gray-500 ${
                                                                taskIndex ===
                                                                tasks.length - 1
                                                                    ? "border-r border-gray-200"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <span className="block">
                                                                {task.label}
                                                            </span>
                                                            <span className="text-[10px] font-normal text-gray-400">
                                                                / {task.total}{" "}
                                                                pts
                                                            </span>
                                                        </th>
                                                    ),
                                                );
                                            })}

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
                                                    dirtyGrades[student.id] ??
                                                    student.grades ??
                                                    {};
                                                const studentKey =
                                                    buildStudentKey(
                                                        student,
                                                        index,
                                                    );
                                                const studentDraft =
                                                    dirtyGrades[student.id] ??
                                                    {};

                                                // Calculate grade for row coloring
                                                const currentGrade =
                                                    calculateExpectedQuarterlyGrade(
                                                        draftValues,
                                                        gradeCategories,
                                                        selectedQuarter,
                                                    );
                                                const gradeColors =
                                                    getGradeRowColors(
                                                        currentGrade,
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
                                                                {student.name}
                                                            </div>
                                                            {formatAcademicMeta(
                                                                student,
                                                            ) && (
                                                                <div className="text-xs text-gray-500">
                                                                    {formatAcademicMeta(
                                                                        student,
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
                                                                        category.id,
                                                                    );
                                                                const latestTask =
                                                                    getLatestTask(
                                                                        category,
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
                                                                        taskIndex,
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
                                                                    },
                                                                );
                                                            },
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
                                                                        selectedQuarter,
                                                                    )
                                                                        ? calculateFinalGrade(
                                                                              draftValues,
                                                                              gradeCategories,
                                                                              selectedQuarter,
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
                                                                        gradeCategories,
                                                                    )}
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <td
                                                                className={`sticky right-0 z-10 ${gradeColors.rightCell} px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 border-l border-gray-300 min-w-[100px]`}
                                                            >
                                                                {calculateOverallFinalGrade(
                                                                    draftValues,
                                                                    gradeCategories,
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {filteredStudents.length === 0 && (
                                <EmptyStudentState
                                    hasSearchTerm={Boolean(searchTerm)}
                                    searchTerm={searchTerm}
                                    onAddStudent={() =>
                                        setIsAddStudentModalOpen(true)
                                    }
                                />
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
            {/* Modals */}
            {/* --- Temporary Password Modal --- */}
            {showPasswordModal && passwordModalData && (
                <TemporaryPasswordModal
                    studentInfo={passwordModalData}
                    onClose={() => {
                        setShowPasswordModal(false);
                        setPasswordModalData(null);
                    }}
                />
            )}
            {/* --- Edit Grade Categories Modal --- */}
            <EditGradeCategoriesModal
                isOpen={isEditCategoriesModalOpen}
                onClose={() => setIsEditCategoriesModalOpen(false)}
                subjectId={selectedClass?.id}
                categories={gradeCategories}
            />
            {/* --- Add Student Modal --- */}
            {isAddStudentModalOpen && selectedClass && (
                <AddStudentModal
                    subjectId={selectedClass.id}
                    subjectLabel={selectedClassHeading}
                    onClose={() => setIsAddStudentModalOpen(false)}
                />
            )}
            {/* --- Add Grade Task Modal --- */}
            {selectedTaskCategory && selectedClass && (
                <AddGradeTaskModal
                    category={selectedTaskCategory}
                    onClose={() => setActiveGradeCategoryId(null)}
                    onSave={handleCategoryTaskSave}
                    isSubmitting={isSavingCategoryTask}
                />
            )}
            {/* --- Student Status Modal --- */}
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
        </>
    );
};

export default MyClass;

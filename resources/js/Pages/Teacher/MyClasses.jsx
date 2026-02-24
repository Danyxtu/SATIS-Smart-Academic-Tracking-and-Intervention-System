import React, { useEffect, useMemo, useRef, useState } from "react";
import TeacherLayout from "../../Layouts/TeacherLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useLoading } from "@/Context/LoadingContext";
import {
    ChevronRight,
    Plus,
    UploadCloud,
    BookOpen,
    Calendar,
} from "lucide-react";

/**
 * Components for My Classes page
 */
import {
    AddNewClassModal,
    ClassCard,
    SendNudgeModal,
} from "@/Components/Teacher/MyClasses";
import MyClass from "./MyClasses/MyClass";
import { COLOR_OPTIONS } from "@/Data/teacherColorOptions";

const normalizeLabel = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase();
};

const buildStudentKey = (student, index) => {
    const enrollmentPart = student?.enrollment_id ?? student?.pivot?.id;
    const idPart = student?.id;
    const lrnPart = student?.lrn;
    const fallback = `student-${index}`;
    return `${enrollmentPart ?? idPart ?? lrnPart ?? fallback}:${index}`;
};

// Grades for each quarter
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
    quarter = 1,
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
// Functions for this class
const getColorClasses = (colorName) => {
    const class_color =
        COLOR_OPTIONS.find((c) => c.name === colorName) || COLOR_OPTIONS;
    return class_color;
};

const buildClassKey = (cls, index) => {
    const idPart = cls?.id ?? `class-${index}`;
    const sectionPart = cls?.section ?? `section-${index}`;
    const namePart = cls?.name ?? `name-${index}`;

    const classKey = `${idPart}:${sectionPart}:${namePart}:${index}`;
    return classKey;
};

const MyClasses = ({
    classes = [],
    rosters = {},
    gradeStructures = {},
    defaultSchoolYear,
    currentSemester = 1,
    selectedSemester = 1,
    semester1Count = 0,
    semester2Count = 0,
}) => {
    /**
     * Debugging purposes: Log the received props to verify data structure and values.
     * This will be removed or commented out in production.
     */
    console.log("Rendering MyClasses with props:", classes);
    console.log("Rosters:", rosters);
    console.log("Grade Structures:", gradeStructures);
    console.log("Default School Year:", defaultSchoolYear);
    console.log("Current Semester:", currentSemester);
    console.log("Selected Semester:", selectedSemester);
    console.log("Semester 1 Count:", semester1Count);
    console.log("Semester 2 Count:", semester2Count);

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
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [droppedFile, setDroppedFile] = useState(null);
    const [highlightAddClass, setHighlightAddClass] = useState(false);

    // State for fetched class data (click-to-fetch pattern)
    const [selectedClassData, setSelectedClassData] = useState({});
    const [loadingClassId, setLoadingClassId] = useState(null);

    // Check for highlight query parameter from tutorial
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("highlight") === "addclass") {
            setHighlightAddClass(true);
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
            setTimeout(() => {
                setHighlightAddClass(false);
            }, 2000);
        }
    }, []);

    const [dirtyGrades, setDirtyGrades] = useState({});
    const [isImportingGrades, setIsImportingGrades] = useState(false);
    const [activeGradeCategoryId, setActiveGradeCategoryId] = useState(null);
    const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
    const [nudgeTargetClass, setNudgeTargetClass] = useState(null);
    const gradeUploadInputRef = useRef(null);

    // Show password modal when new student is created with password
    useEffect(() => {
        if (newStudentPassword) {
            setPasswordModalData(newStudentPassword);
            setShowPasswordModal(true);
        }
    }, [newStudentPassword]);

    // Handle send nudge button click
    const handleSendNudge = (cls) => {
        setNudgeTargetClass(cls);
        setIsNudgeModalOpen(true);
    };

    // Get selected class from fetched data or from classes list
    const selectedClass = useMemo(() => {
        if (!selectedClassId) return null;
        // Use fetched data if available
        if (selectedClassData[selectedClassId]?.class) {
            return selectedClassData[selectedClassId].class;
        }
        // Fallback to classes list
        return classes.find((cls) => cls.id === selectedClassId) || null;
    }, [classes, selectedClassId, selectedClassData]);

    // Get roster from fetched data
    const roster = useMemo(() => {
        if (!selectedClassId || !selectedClassData[selectedClassId]) return [];
        return selectedClassData[selectedClassId].roster || [];
    }, [selectedClassId, selectedClassData]);

    // Get grade structure from fetched data
    const gradeStructure = useMemo(() => {
        if (!selectedClassId || !selectedClassData[selectedClassId])
            return null;
        return selectedClassData[selectedClassId].gradeStructure || null;
    }, [selectedClassId, selectedClassData]);

    const students = useMemo(() => {
        if (!selectedClass) return [];
        return roster;
    }, [roster, selectedClass]);

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
        setActiveGradeCategoryId(null);
    }, [selectedClassId]);

    const dirtyGradeCount = Object.keys(dirtyGrades).length;
    const hasGradeChanges = dirtyGradeCount > 0;
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

    const handleClassSelect = async (classId) => {
        // If already fetched, just select it
        if (selectedClassData[classId]) {
            setSelectedClassId(classId);
            return;
        }

        setLoadingClassId(classId);
        startLoading();

        try {
            const res = await fetch(`/teacher/classes/${classId}`);
            if (!res.ok) {
                throw new Error("Failed to fetch class data");
            }
            const data = await res.json();

            setSelectedClassData((prev) => ({
                ...prev,
                [classId]: data,
            }));
            setSelectedClassId(classId);
        } catch (err) {
            console.error("Error fetching class data:", err);
        } finally {
            setLoadingClassId(null);
            stopLoading();
        }
    };

    const handleGoBack = () => {
        startLoading();
        setTimeout(() => {
            setSelectedClassId(null);
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
            },
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
            <header className="mb-6 space-y-4">
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
                                className={`flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 ${
                                    highlightAddClass
                                        ? "animate-pulse-twice"
                                        : ""
                                }`}
                                style={
                                    highlightAddClass
                                        ? {
                                              animation:
                                                  "pulse-highlight 0.5s ease-in-out 4",
                                              boxShadow:
                                                  "0 0 20px rgba(99, 102, 241, 0.5)",
                                          }
                                        : {}
                                }
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
                                            ),
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
                                                                    s.password,
                                                                )
                                                            }
                                                            className="text-sm text-indigo-700 hover:underline"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </li>
                                            ),
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
                                                    newStudentPassword.password,
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
                                            ),
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
                                            ),
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
                    {/* Semester Navigation Toggle */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
                        {/* Header with School Year */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar
                                    size={20}
                                    className="text-indigo-600"
                                />
                                <span className="font-semibold text-gray-700">
                                    Academic Year {defaultSchoolYear}
                                </span>
                            </div>
                            {selectedSemester !== currentSemester && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                    Viewing past semester
                                </span>
                            )}
                        </div>

                        {/* Semester Tabs */}
                        <div className="flex gap-2">
                            {[
                                {
                                    id: 1,
                                    label: "1st Semester",
                                    shortLabel: "Sem 1",
                                    count: semester1Count,
                                },
                                {
                                    id: 2,
                                    label: "2nd Semester",
                                    shortLabel: "Sem 2",
                                    count: semester2Count,
                                },
                            ].map((semester) => {
                                const isActive =
                                    selectedSemester === semester.id;
                                const isCurrentSemester =
                                    currentSemester === semester.id;
                                // Semester tab button with count badge and current semester indicator
                                return (
                                    <button
                                        key={semester.id}
                                        onClick={() => {
                                            router.get(
                                                window.location.pathname,
                                                { semester: semester.id },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            );
                                        }}
                                        className={`
                                            flex-1 relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all
                                            ${
                                                isActive
                                                    ? "bg-indigo-600 text-white shadow-md"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }
                                        `}
                                    >
                                        <BookOpen size={18} />
                                        <span className="hidden sm:inline">
                                            {semester.label}
                                        </span>
                                        <span className="sm:hidden">
                                            {semester.shortLabel}
                                        </span>

                                        {/* Class Count Badge */}
                                        <span
                                            className={`
                                                ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                                                ${
                                                    isActive
                                                        ? "bg-white/20 text-white"
                                                        : "bg-gray-200 text-gray-600"
                                                }
                                            `}
                                        >
                                            {semester.count}
                                        </span>

                                        {/* Current Semester Indicator */}
                                        {isCurrentSemester && (
                                            <span
                                                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                                                    isActive
                                                        ? "bg-green-400"
                                                        : "bg-green-500"
                                                } border-2 border-white`}
                                                title="Current Semester"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Info Text */}
                        <p className="text-center text-xs text-gray-500 mt-3">
                            Viewing{" "}
                            {selectedSemester === 1 ? "First" : "Second"}{" "}
                            Semester classes
                            {semester1Count + semester2Count > 0 && (
                                <span className="ml-1">
                                    ({classes.length} of{" "}
                                    {semester1Count + semester2Count} total)
                                </span>
                            )}
                        </p>
                    </div>

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
                    {classes.length === 0 ? (
                        // State if no classes for the semester
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No classes for{" "}
                                {selectedSemester === 1 ? "1st" : "2nd"}{" "}
                                Semester
                            </h3>
                            <p className="text-gray-500 mb-4">
                                {selectedSemester === currentSemester
                                    ? "Add your first class to get started with this semester."
                                    : "No classes were created during this semester."}
                            </p>
                            {selectedSemester === currentSemester && (
                                <button
                                    onClick={() => setIsAddClassModalOpen(true)}
                                    className="inline-flex items-center gap-2 bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus size={18} />
                                    Add Class
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classes.map((cls, index) => {
                                const colors = getColorClasses(cls.color);
                                const classKey = buildClassKey(cls, index);
                                const isLoading = loadingClassId === cls.id;
                                return (
                                    <ClassCard
                                        key={classKey}
                                        colors={colors}
                                        cls={cls}
                                        handleClassSelect={() =>
                                            handleClassSelect(cls.id)
                                        }
                                        onSendNudge={handleSendNudge}
                                        isLoading={isLoading}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                // This will be a separate component for the classlist and grade management view
                <MyClass
                    selectedClassHeading={selectedClassHeading}
                    selectedClass={selectedClass}
                    roster={roster}
                    gradeStructure={gradeStructure}
                />
            )}

            {/* --- (NEW) Add Class Modal --- */}
            {isAddClassModalOpen && (
                <AddNewClassModal
                    onClose={() => {
                        setIsAddClassModalOpen(false);
                        setDroppedFile(null);
                    }}
                    defaultSchoolYear={defaultSchoolYear}
                    currentSemester={currentSemester}
                    initialFile={droppedFile}
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

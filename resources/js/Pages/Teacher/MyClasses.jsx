import React, { useEffect, useMemo, useRef, useState } from "react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useLoading } from "@/Context/LoadingContext";
import {
    ChevronRight,
    Plus,
    UploadCloud,
    BookOpen,
    Calendar,
    CheckCircle,
    AlertCircle,
    XCircle,
    Copy,
    Users,
} from "lucide-react";

// Utils
import {
    calculateFinalGrade,
    calculateOverallFinalGrade,
    calculateExpectedQuarterlyGrade,
    hasQuarterlyExamScores,
    isQuarterComplete,
} from "@/Utils/Teacher/MyClasses/gradeCalculations";
/**
 * Components for My Classes page
 */
import {
    AddNewClassModal,
    BulkStudentImportSummaryModal,
    ClassCard,
    ClassCreateSummaryModal,
    DeleteClassModal,
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

const stripGradePrefix = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/^grade\s+/i, "")
        .trim();
};

const buildStudentKey = (student, index) => {
    const enrollmentPart = student?.enrollment_id ?? student?.pivot?.id;
    const idPart = student?.id;
    const lrnPart = student?.lrn;
    const fallback = `student-${index}`;
    return `${enrollmentPart ?? idPart ?? lrnPart ?? fallback}:${index}`;
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
    departments = [],
    availableSubjects = [],
    availableSections = [],
    rosters = {},
    gradeStructures = {},
    defaultSchoolYear,
    currentSemester = 1,
    selectedSemester = 1,
    semester1Count = 0,
    semester2Count = 0,
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
    const classCreateSummary =
        typeof flash.class_create_summary === "object"
            ? flash.class_create_summary
            : null;

    const { startLoading, stopLoading } = useLoading();

    // Initialize selectedClassId from URL parameters
    const [selectedClassId, setSelectedClassId] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const classIdFromUrl = urlParams.get("class");
        return classIdFromUrl ? parseInt(classIdFromUrl) : null;
    });
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    const [editClassModal, setEditClassModal] = useState({
        open: false,
        classData: null,
    });
    const [deleteClassModal, setDeleteClassModal] = useState({
        open: false,
        classData: null,
    });
    const [isImportSummaryModalOpen, setIsImportSummaryModalOpen] = useState(
        Boolean(importSummary),
    );
    const [isClassCreateSummaryOpen, setIsClassCreateSummaryOpen] = useState(
        Boolean(classCreateSummary),
    );
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

    // Load class data on component mount if URL has class parameter
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const classIdFromUrl = urlParams.get("class");

        if (classIdFromUrl) {
            const classId = parseInt(classIdFromUrl);
            const classExistsInList = classes.some((cls) => cls.id === classId);

            if (!classExistsInList) {
                urlParams.delete("class");
                urlParams.delete("view");
                urlParams.delete("tab");
                const newUrl = urlParams.toString()
                    ? `${window.location.pathname}?${urlParams.toString()}`
                    : window.location.pathname;
                window.history.replaceState({}, "", newUrl);
                setSelectedClassId(null);
                return;
            }

            // If we have a class ID in URL but haven't loaded the data yet, load it
            if (classId && !selectedClassData[classId] && !loadingClassId) {
                const loadClassData = async () => {
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
                        // Remove invalid class parameter from URL on error
                        const urlParams = new URLSearchParams(
                            window.location.search,
                        );
                        urlParams.delete("class");
                        urlParams.delete("view");
                        urlParams.delete("tab");
                        const newUrl = urlParams.toString()
                            ? `${window.location.pathname}?${urlParams.toString()}`
                            : window.location.pathname;
                        window.history.replaceState({}, "", newUrl);
                        setSelectedClassId(null);
                    } finally {
                        setLoadingClassId(null);
                        stopLoading();
                    }
                };

                loadClassData();
            }
        }
    }, []); // Empty dependency array - only run on mount

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const classIdFromUrl = urlParams.get("class");

            if (classIdFromUrl) {
                const classId = parseInt(classIdFromUrl);
                const classExistsInList = classes.some(
                    (cls) => cls.id === classId,
                );
                setSelectedClassId(classExistsInList ? classId : null);
            } else {
                setSelectedClassId(null);
            }
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [classes]);

    const [dirtyGrades, setDirtyGrades] = useState({});
    const [isImportingGrades, setIsImportingGrades] = useState(false);
    const [activeGradeCategoryId, setActiveGradeCategoryId] = useState(null);
    const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
    const [nudgeTargetClass, setNudgeTargetClass] = useState(null);
    const gradeUploadInputRef = useRef(null);

    // Handle send nudge button click
    const handleSendNudge = (cls) => {
        setNudgeTargetClass(cls);
        setIsNudgeModalOpen(true);
    };

    // Get selected class from fetched data or from the currently visible list.
    const selectedClass = useMemo(() => {
        if (!selectedClassId) return null;
        // Use fetched data if available
        if (selectedClassData[selectedClassId]?.class) {
            return selectedClassData[selectedClassId].class;
        }
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

    // Get grade summaries from fetched data (server-computed grades per enrollment)
    const gradeSummaries = useMemo(() => {
        if (!selectedClassId || !selectedClassData[selectedClassId]) return {};
        return selectedClassData[selectedClassId].gradeSummaries || {};
    }, [selectedClassId, selectedClassData]);

    const students = useMemo(() => {
        if (!selectedClass) return [];
        return roster;
    }, [roster, selectedClass]);

    const selectedClassName = stripGradePrefix(selectedClass?.name?.trim());
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

    const resolveClassForEditFromSummary = (summary) => {
        if (!summary) {
            return null;
        }

        const existingClass = classes.find(
            (cls) => cls.id === summary.class_id,
        );
        if (existingClass) {
            return existingClass;
        }

        if (!summary.class_id) {
            return null;
        }

        return {
            id: summary.class_id,
            name: summary.grade_level,
            section: summary.section,
            strand: summary.strand,
            subject_name: summary.subject_name,
            color: summary.color || "indigo",
            track: summary.track || "",
            school_year: summary.school_year,
        };
    };

    useEffect(() => {
        setActiveGradeCategoryId(null);
    }, [selectedClassId]);

    useEffect(() => {
        setIsImportSummaryModalOpen(Boolean(importSummary));
    }, [importSummary]);

    useEffect(() => {
        if (!classCreateSummary) {
            setIsClassCreateSummaryOpen(false);
            return;
        }

        if (classCreateSummary.duplicate_section) {
            setIsClassCreateSummaryOpen(false);

            const classForEdit =
                resolveClassForEditFromSummary(classCreateSummary);

            if (classForEdit) {
                setEditClassModal({ open: true, classData: classForEdit });
            }

            return;
        }

        setIsClassCreateSummaryOpen(true);
    }, [classCreateSummary, classes]);

    const dirtyGradeCount = Object.keys(dirtyGrades).length;
    const hasGradeChanges = dirtyGradeCount > 0;
    const selectedClassMeta = selectedClass
        ? [selectedClass.strand, selectedClass.track]
              .filter(Boolean)
              .join(" • ")
        : null;
    const hasSelectedClass = Boolean(selectedClass);
    const myClassesLabel = "My Classes";
    const pageTitle = selectedClassHeading;
    const pageSubtitle = hasSelectedClass
        ? selectedClass.subject
        : "Monitor rosters, imports, and grades from a single workspace.";
    const isSemesterViewOnly =
        Number(selectedSemester) < Number(currentSemester);
    const isReadOnlyMode = isSemesterViewOnly;
    const readOnlySemesterMessage =
        "Past semesters are view-only while the current semester is active.";

    useEffect(() => {
        if (!isSemesterViewOnly) {
            return;
        }

        setIsAddClassModalOpen(false);
        setDroppedFile(null);
        setEditClassModal({ open: false, classData: null });
        setDeleteClassModal({ open: false, classData: null });
    }, [isSemesterViewOnly]);

    const refreshClassData = async (
        classId,
        { showGlobalLoading = false } = {},
    ) => {
        const targetClassId = Number(classId ?? selectedClassId);

        if (!Number.isInteger(targetClassId) || targetClassId <= 0) {
            return null;
        }

        if (showGlobalLoading) {
            setLoadingClassId(targetClassId);
            startLoading();
        }

        try {
            const res = await fetch(`/teacher/classes/${targetClassId}`, {
                headers: {
                    Accept: "application/json",
                },
            });

            if (!res.ok) {
                throw new Error("Failed to fetch class data");
            }

            const data = await res.json();

            setSelectedClassData((prev) => ({
                ...prev,
                [targetClassId]: data,
            }));

            return data;
        } catch (error) {
            console.error("Error refreshing class data:", error);
            return null;
        } finally {
            if (showGlobalLoading) {
                setLoadingClassId(null);
                stopLoading();
            }
        }
    };

    const handleClassSelect = async (classId) => {
        // Update URL with selected class ID
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set("class", classId.toString());
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.pushState({}, "", newUrl);

        // If already fetched, just select it
        if (selectedClassData[classId]) {
            setSelectedClassId(classId);
            return;
        }

        try {
            const data = await refreshClassData(classId, {
                showGlobalLoading: true,
            });

            if (data) {
                setSelectedClassId(classId);
            }
        } catch (err) {
            console.error("Error fetching class data:", err);
        }
    };

    const handleGoBack = () => {
        // Remove class parameter from URL
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete("class");
        urlParams.delete("view");
        urlParams.delete("tab");
        const newUrl = urlParams.toString()
            ? `${window.location.pathname}?${urlParams.toString()}`
            : window.location.pathname;
        window.history.pushState({}, "", newUrl);

        startLoading();
        setTimeout(() => {
            setSelectedClassId(null);
            stopLoading();
        }, 150);
    };

    const handleDragOver = (e) => {
        e.preventDefault();

        if (isSemesterViewOnly) {
            setIsDragging(false);
            return;
        }

        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (isSemesterViewOnly) {
            return;
        }

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
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => {
                    setIsImportingGrades(false);
                    event.target.value = "";
                },
            },
        );
    };

    const handleEditClass = (cls) => {
        if (isReadOnlyMode) {
            return;
        }

        setEditClassModal({ open: true, classData: cls });
    };

    const handleDeleteClass = (cls) => {
        if (isReadOnlyMode) {
            return;
        }

        setDeleteClassModal({ open: true, classData: cls });
    };

    const handleDeletedClass = (cls) => {
        if (selectedClassId === cls.id) {
            handleGoBack();
        }
    };

    const handleSummarySaveChanges = () => {
        if (!classCreateSummary) {
            setIsClassCreateSummaryOpen(false);
            return;
        }

        const classForEdit = resolveClassForEditFromSummary(classCreateSummary);

        setIsClassCreateSummaryOpen(false);

        if (classForEdit) {
            setEditClassModal({ open: true, classData: classForEdit });
        }
    };

    const handleSummarySkip = () => {
        setIsClassCreateSummaryOpen(false);
    };

    return (
        <>
            <Head title={myClassesLabel} />
            <input
                ref={gradeUploadInputRef}
                type="file"
                className="hidden"
                accept=".csv,text/csv"
                onChange={handleGradesFileSelected}
            />

            <div className="space-y-4">
                {/* Compact Header */}
                <header className="flex items-start justify-between gap-3">
                    {hasSelectedClass ? (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleGoBack}
                                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                                {myClassesLabel}
                            </button>
                            <ChevronRight size={14} className="text-gray-400" />
                            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                                Class Details
                            </span>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {myClassesLabel}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Select a class card to manage class details and
                                student records.
                            </p>
                        </div>
                    )}

                    {!hasSelectedClass && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (isSemesterViewOnly) {
                                        return;
                                    }

                                    setIsAddClassModalOpen(true);
                                }}
                                disabled={isSemesterViewOnly}
                                title={
                                    isSemesterViewOnly
                                        ? readOnlySemesterMessage
                                        : "Add class"
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    isSemesterViewOnly
                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                                } ${
                                    highlightAddClass && !isSemesterViewOnly
                                        ? "animate-pulse"
                                        : ""
                                }`}
                                style={
                                    highlightAddClass && !isSemesterViewOnly
                                        ? {
                                              boxShadow:
                                                  "0 0 20px rgba(99, 102, 241, 0.5)",
                                          }
                                        : {}
                                }
                            >
                                <Plus size={16} /> Add Class
                            </button>
                        </div>
                    )}
                </header>

                {/* Compact Flash Messages */}
                {(gradeUpdateSummary ||
                    gradeImportSummary ||
                    newStudentPassword) && (
                    <div className="grid gap-3">
                        {/* New Student Password */}
                        {newStudentPassword && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle
                                        size={16}
                                        className="text-emerald-600 mt-0.5 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                                            New Student Created
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-xs text-emerald-700 dark:text-emerald-300">
                                                {newStudentPassword.name}
                                            </span>
                                            {newStudentPassword.username && (
                                                <code className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 rounded text-[10px] font-mono">
                                                    @
                                                    {
                                                        newStudentPassword.username
                                                    }
                                                </code>
                                            )}
                                            <code className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 rounded text-[10px] font-mono">
                                                {newStudentPassword.password}
                                            </code>
                                            <button
                                                onClick={() =>
                                                    navigator.clipboard.writeText(
                                                        newStudentPassword.password,
                                                    )
                                                }
                                                className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded transition-colors"
                                                title="Copy password"
                                            >
                                                <Copy
                                                    size={12}
                                                    className="text-emerald-600 dark:text-emerald-400"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grade Update Summary */}
                        {gradeUpdateSummary && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle
                                        size={16}
                                        className="text-emerald-600 mt-0.5 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                                            Grade Updates
                                        </p>
                                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                                            <span>
                                                Saved:{" "}
                                                {gradeUpdateSummary.updated ??
                                                    0}
                                            </span>
                                            <span>
                                                Cleared:{" "}
                                                {gradeUpdateSummary.cleared ??
                                                    0}
                                            </span>
                                            <span>
                                                Skipped:{" "}
                                                {gradeUpdateSummary.skipped ??
                                                    0}
                                            </span>
                                        </div>
                                        {(gradeUpdateSummary.errors?.length ??
                                            0) > 0 && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-xs font-medium text-red-700 dark:text-red-400 hover:underline">
                                                    View{" "}
                                                    {
                                                        gradeUpdateSummary
                                                            .errors.length
                                                    }{" "}
                                                    issue
                                                    {gradeUpdateSummary.errors
                                                        .length > 1
                                                        ? "s"
                                                        : ""}
                                                </summary>
                                                <ul className="mt-1 space-y-0.5 pl-4 text-xs text-red-700 dark:text-red-400 list-disc">
                                                    {gradeUpdateSummary.errors.map(
                                                        (error, index) => (
                                                            <li key={index}>
                                                                {error}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grade Import Summary */}
                        {gradeImportSummary && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle
                                        size={16}
                                        className="text-blue-600 mt-0.5 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                            Grade CSV Upload
                                        </p>
                                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-blue-700 dark:text-blue-300">
                                            <span>
                                                Updated:{" "}
                                                {gradeImportSummary.updated ??
                                                    0}
                                            </span>
                                            <span>
                                                Skipped:{" "}
                                                {gradeImportSummary.skipped ??
                                                    0}
                                            </span>
                                        </div>
                                        {(gradeImportSummary.errors?.length ??
                                            0) > 0 && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-xs font-medium text-red-700 dark:text-red-400 hover:underline">
                                                    View{" "}
                                                    {
                                                        gradeImportSummary
                                                            .errors.length
                                                    }{" "}
                                                    issue
                                                    {gradeImportSummary.errors
                                                        .length > 1
                                                        ? "s"
                                                        : ""}
                                                </summary>
                                                <ul className="mt-1 space-y-0.5 pl-4 text-xs text-red-700 dark:text-red-400 list-disc">
                                                    {gradeImportSummary.errors.map(
                                                        (error, index) => (
                                                            <li key={index}>
                                                                {error}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Content */}
                {!selectedClass ? (
                    <div
                        className="relative"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* Compact Semester Navigation */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <Calendar
                                        size={16}
                                        className="text-indigo-600"
                                    />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Current School Year:{" "}
                                        <span className="text-indigo-600 dark:text-indigo-400">
                                            {defaultSchoolYear}
                                        </span>
                                    </span>
                                </div>
                                {selectedSemester !== currentSemester && (
                                    <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                                        Viewing past
                                    </span>
                                )}
                            </div>

                            {/* Compact Semester Tabs */}
                            <div className="flex gap-2">
                                {[
                                    {
                                        id: 1,
                                        label: "1st Sem",
                                        count: semester1Count,
                                    },
                                    {
                                        id: 2,
                                        label: "2nd Sem",
                                        count: semester2Count,
                                    },
                                ].map((semester) => {
                                    const isActive =
                                        selectedSemester === semester.id;
                                    const isCurrentSemester =
                                        currentSemester === semester.id;
                                    const isFutureSemester =
                                        semester.id > currentSemester;

                                    return (
                                        <button
                                            key={semester.id}
                                            onClick={() => {
                                                if (isFutureSemester) return;
                                                router.get(
                                                    window.location.pathname,
                                                    {
                                                        semester: semester.id,
                                                    },
                                                    {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    },
                                                );
                                            }}
                                            disabled={isFutureSemester}
                                            className={`
                                                flex-1 relative flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all
                                                ${
                                                    isFutureSemester
                                                        ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                                                        : isActive
                                                          ? "bg-indigo-600 text-white shadow-sm"
                                                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }
                                            `}
                                        >
                                            <BookOpen size={14} />
                                            {semester.label}
                                            <span
                                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    isFutureSemester
                                                        ? "bg-gray-200 text-gray-400"
                                                        : isActive
                                                          ? "bg-white/20 text-white"
                                                          : "bg-gray-200 text-gray-600"
                                                }`}
                                            >
                                                {isFutureSemester
                                                    ? "—"
                                                    : semester.count}
                                            </span>
                                            {isCurrentSemester && (
                                                <span
                                                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-white"
                                                    title="Current"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Dropzone Overlay */}
                        {isDragging && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-indigo-500/90 rounded-xl border-4 border-dashed border-white">
                                <UploadCloud
                                    size={48}
                                    className="text-white mb-3"
                                />
                                <p className="text-xl font-bold text-white">
                                    Drop CSV classlist here
                                </p>
                            </div>
                        )}

                        {/* Class Grid */}
                        {classes.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <BookOpen
                                        size={24}
                                        className="text-gray-400"
                                    />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                    No classes for{" "}
                                    {selectedSemester === 1 ? "1st" : "2nd"}{" "}
                                    Semester
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    {selectedSemester === currentSemester
                                        ? "Add your first class to get started."
                                        : isSemesterViewOnly
                                          ? "This semester is currently in view mode."
                                          : "No classes were created this semester."}
                                </p>
                                {(selectedSemester === currentSemester ||
                                    isSemesterViewOnly) && (
                                    <button
                                        onClick={() => {
                                            if (isSemesterViewOnly) {
                                                return;
                                            }

                                            setIsAddClassModalOpen(true);
                                        }}
                                        disabled={isSemesterViewOnly}
                                        title={
                                            isSemesterViewOnly
                                                ? readOnlySemesterMessage
                                                : "Add class"
                                        }
                                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isSemesterViewOnly
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                                        }`}
                                    >
                                        <Plus size={16} />
                                        Add Class
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                                            onEditClass={handleEditClass}
                                            onDeleteClass={handleDeleteClass}
                                            isLoading={isLoading}
                                            showActions={!isReadOnlyMode}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <MyClass
                        selectedClassHeading={selectedClassHeading}
                        selectedClass={selectedClass}
                        roster={roster}
                        gradeStructure={gradeStructure}
                        gradeSummaries={gradeSummaries}
                        onRefreshClassData={refreshClassData}
                        isReadOnly={isReadOnlyMode}
                        readOnlyModeLabel="Semester View Only"
                        readOnlyActionMessage={readOnlySemesterMessage}
                    />
                )}
            </div>

            {/* Modals */}
            {isAddClassModalOpen && (
                <AddNewClassModal
                    onClose={() => {
                        setIsAddClassModalOpen(false);
                        setDroppedFile(null);
                    }}
                    defaultSchoolYear={defaultSchoolYear}
                    currentSemester={currentSemester}
                    initialFile={droppedFile}
                    departments={departments}
                    availableSubjects={availableSubjects}
                    availableSections={availableSections}
                    existingClasses={classes}
                />
            )}

            {editClassModal.open && editClassModal.classData && (
                <AddNewClassModal
                    mode="edit"
                    classData={editClassModal.classData}
                    onClose={() => {
                        setEditClassModal({ open: false, classData: null });
                    }}
                    defaultSchoolYear={defaultSchoolYear}
                    currentSemester={currentSemester}
                    departments={departments}
                    availableSubjects={availableSubjects}
                    availableSections={availableSections}
                    existingClasses={classes}
                />
            )}

            <ClassCreateSummaryModal
                isOpen={isClassCreateSummaryOpen}
                summary={classCreateSummary}
                onClose={() => setIsClassCreateSummaryOpen(false)}
                onSaveChanges={handleSummarySaveChanges}
                onSkip={handleSummarySkip}
            />

            <DeleteClassModal
                isOpen={deleteClassModal.open}
                classData={deleteClassModal.classData}
                onClose={() =>
                    setDeleteClassModal({ open: false, classData: null })
                }
                onDeleted={handleDeletedClass}
            />

            <SendNudgeModal
                isOpen={isNudgeModalOpen}
                onClose={() => {
                    setIsNudgeModalOpen(false);
                    setNudgeTargetClass(null);
                }}
                subject={nudgeTargetClass}
            />

            {isImportSummaryModalOpen &&
                importSummary &&
                !isClassCreateSummaryOpen &&
                !editClassModal.open && (
                    <BulkStudentImportSummaryModal
                        summary={importSummary}
                        onClose={() => setIsImportSummaryModalOpen(false)}
                    />
                )}
        </>
    );
};

MyClasses.layout = (page) => <SchoolStaffLayout children={page} />;

export default MyClasses;

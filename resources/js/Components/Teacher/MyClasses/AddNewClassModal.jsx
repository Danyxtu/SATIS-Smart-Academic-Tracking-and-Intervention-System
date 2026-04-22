import {
    BookOpen,
    ClipboardList,
    Check,
    ChevronLeft,
    ChevronRight,
    FileText,
    Palette,
    Plus,
    Save,
    Search,
    Loader2,
    Trash2,
    Upload,
    Users,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@inertiajs/react";

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

const GRADE_LEVEL_OPTIONS = ["11", "12"];

const normalizeGradeLevel = (value) => {
    const match = String(value ?? "").match(/(^|\D)(11|12)(\D|$)/);

    return match?.[2] ?? "";
};

const WIZARD_STEPS = [
    { id: 1, title: "Subject", icon: BookOpen },
    { id: 2, title: "Sections", icon: Users },
    { id: 3, title: "Students", icon: Users },
    { id: 4, title: "Color", icon: Palette },
    { id: 5, title: "Review and Save", icon: ClipboardList },
];

const parseSectionSuffix = (sectionValue, strandValue) => {
    const section = String(sectionValue ?? "").trim();
    const strand = String(strandValue ?? "").trim();

    if (!section) return "";
    if (!strand) return section;

    const prefix = `${strand}-`;
    if (section.toUpperCase().startsWith(prefix.toUpperCase())) {
        return section.slice(prefix.length);
    }

    return section;
};

const sanitizeLrn = (value) => String(value ?? "").replace(/[^0-9]/g, "");
const normalizeDepartmentCode = (value) =>
    String(value ?? "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .trim();

const sanitizeSectionName = (value) =>
    String(value ?? "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .trim();

const sanitizeSpecialization = (value) =>
    String(value ?? "")
        .toUpperCase()
        .replace(/[^A-Z0-9\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim();

const normalizeSearchValue = (value) =>
    String(value ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

const buildSectionFullLabel = (gradeLevel, specialization, sectionName) => {
    const parts = [
        normalizeGradeLevel(gradeLevel),
        String(specialization ?? "").trim(),
        String(sectionName ?? "").trim(),
    ].filter((part) => part !== "");

    return parts.join(" - ");
};

const DEFAULT_STUDENT_DRAFT = {
    student_name: "",
    lrn: "",
    personal_email: "",
};

const createSectionWorkflowState = (color = "indigo") => ({
    manualStudents: [],
    studentDraft: { ...DEFAULT_STUDENT_DRAFT },
    studentDraftError: "",
    bulkRows: "",
    bulkErrors: [],
    classlist: null,
    color,
    studentsDone: false,
    colorDone: false,
    reviewDone: false,
});

const StepBadge = ({ step, currentStep }) => {
    const Icon = step.icon;
    const isActive = currentStep === step.id;
    const isDone = currentStep > step.id;

    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isActive
                    ? "bg-blue-100 text-blue-700"
                    : isDone
                      ? "bg-blue-50 text-blue-700"
                      : "bg-slate-50 text-slate-400"
            }`}
        >
            <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    isDone ? "bg-blue-600 text-white" : "bg-white"
                }`}
            >
                {isDone ? <Check size={10} /> : step.id}
            </span>
            <Icon size={12} />
            <span>{step.title}</span>
        </div>
    );
};

const AddNewClassModal = ({
    onClose,
    defaultSchoolYear,
    currentSemester = 1,
    mode = "create",
    classData = null,
    departments = [],
    availableSubjects = [],
    availableSections = [],
    existingClasses = [],
}) => {
    const isEditMode = mode === "edit";
    const [step, setStep] = useState(1);
    const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false);
    const [isDepartmentMenuOpen, setIsDepartmentMenuOpen] = useState(false);
    const [sectionMode, setSectionMode] = useState("existing");
    const [selectedExistingSectionId, setSelectedExistingSectionId] =
        useState(null);
    const [existingSectionQuery, setExistingSectionQuery] = useState("");
    const [manualStudents, setManualStudents] = useState([]);
    const [studentDraft, setStudentDraft] = useState({
        ...DEFAULT_STUDENT_DRAFT,
    });
    const [studentDraftError, setStudentDraftError] = useState("");
    const [bulkRows, setBulkRows] = useState("");
    const [bulkErrors, setBulkErrors] = useState([]);
    const [sectionQueue, setSectionQueue] = useState([]);
    const [activeQueueSectionKey, setActiveQueueSectionKey] = useState(null);
    const [sectionWorkflowMap, setSectionWorkflowMap] = useState({});
    const [studentInputMode, setStudentInputMode] = useState("single");
    const [isSearchingStudent, setIsSearchingStudent] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const submitLockRef = useRef(false);

    const {
        data,
        setData,
        post,
        put,
        transform,
        processing,
        errors,
        reset,
        progress,
        clearErrors,
        setError,
    } = useForm({
        grade_level: normalizeGradeLevel(
            classData?.name ?? classData?.grade_level,
        ),
        section: parseSectionSuffix(classData?.section, classData?.strand),
        subject_name: classData?.subject_name ?? classData?.subject ?? "",
        color: classData?.color ?? "indigo",
        school_year: classData?.school_year ?? defaultSchoolYear,
        strand: classData?.strand ?? "",
        specialization: sanitizeSpecialization(classData?.specialization ?? ""),
        classlist: null,
        manual_students: [],
    });

    const departmentOptions = useMemo(() => {
        return departments
            .map((department) => ({
                id: department?.id,
                department_code: normalizeDepartmentCode(
                    department?.department_code,
                ),
                department_name: String(
                    department?.department_name ?? "",
                ).trim(),
                track: String(department?.track ?? "")
                    .trim()
                    .toLowerCase(),
                description: String(department?.description ?? "").trim(),
                specializations: Array.isArray(department?.specializations)
                    ? department.specializations
                          .map((item) =>
                              sanitizeSpecialization(
                                  item?.specialization_name ?? item,
                              ),
                          )
                          .filter(
                              (value, index, arr) =>
                                  value !== "" && arr.indexOf(value) === index,
                          )
                    : [],
            }))
            .filter((department) => department.department_code);
    }, [departments]);

    const validDepartmentCodeSet = useMemo(
        () => new Set(departmentOptions.map((item) => item.department_code)),
        [departmentOptions],
    );

    const normalizedStrand = normalizeDepartmentCode(data.strand);
    const hasValidStrand = validDepartmentCodeSet.has(normalizedStrand);

    const sectionOptions = useMemo(() => {
        return availableSections
            .map((section, index) => {
                const strand = normalizeDepartmentCode(
                    section?.department_code ?? section?.strand,
                );
                const sectionSource =
                    section?.section_name ??
                    section?.section ??
                    section?.section_code ??
                    "";
                const sectionName = sanitizeSectionName(
                    parseSectionSuffix(sectionSource, strand),
                );
                const gradeLevel = normalizeGradeLevel(section?.grade_level);
                const specialization =
                    [
                        section?.specialization,
                        section?.strand,
                        section?.department_code,
                    ]
                        .map((value) => sanitizeSpecialization(value))
                        .find((value) => value !== "") ?? "";
                const sectionFullLabel = String(
                    section?.section_full_label ??
                        buildSectionFullLabel(
                            gradeLevel,
                            specialization,
                            sectionName,
                        ),
                ).trim();

                return {
                    id: section?.id ?? `section-${index}`,
                    key: `${section?.id ?? `section-${index}`}::${strand}::${sectionName}`,
                    strand,
                    section: sectionName,
                    grade_level: gradeLevel,
                    specialization,
                    section_label:
                        sectionFullLabel ||
                        String(
                            section?.section_name ??
                                section?.section_code ??
                                "",
                        ).trim(),
                    section_full_label: sectionFullLabel,
                };
            })
            .filter(
                (section) =>
                    section.strand && section.section && section.grade_level,
            );
    }, [availableSections]);

    const selectedExistingSection = useMemo(
        () =>
            sectionOptions.find(
                (section) => section.id === selectedExistingSectionId,
            ) ?? null,
        [sectionOptions, selectedExistingSectionId],
    );

    const filteredDepartments = useMemo(() => {
        const query = normalizeSearchValue(data.strand);

        if (!query) {
            return departmentOptions;
        }

        return departmentOptions.filter((department) => {
            const code = normalizeSearchValue(department.department_code);
            const name = normalizeSearchValue(department.department_name);

            return code.includes(query) || name.includes(query);
        });
    }, [data.strand, departmentOptions]);

    const selectedDepartment = useMemo(
        () =>
            departmentOptions.find(
                (department) => department.department_code === normalizedStrand,
            ) ?? null,
        [departmentOptions, normalizedStrand],
    );

    const specializationOptions = useMemo(() => {
        if (!selectedDepartment) {
            return [];
        }

        if (selectedDepartment.specializations.length > 0) {
            return selectedDepartment.specializations;
        }

        return [selectedDepartment.department_code];
    }, [selectedDepartment]);

    const filteredExistingSections = useMemo(() => {
        const query = normalizeSearchValue(existingSectionQuery);

        const sectionsByStrand = hasValidStrand
            ? sectionOptions.filter(
                  (section) => section.strand === normalizedStrand,
              )
            : [];

        if (!query) {
            return sectionsByStrand.slice(0, 20);
        }

        return sectionsByStrand
            .filter((section) => {
                const sectionLabel = normalizeSearchValue(
                    section.section_full_label || section.section_label,
                );
                const gradeLevel = normalizeSearchValue(section.grade_level);
                const sectionName = normalizeSearchValue(section.section);
                const specialization = normalizeSearchValue(
                    section.specialization,
                );

                return (
                    sectionLabel.includes(query) ||
                    gradeLevel.includes(query) ||
                    sectionName.includes(query) ||
                    specialization.includes(query)
                );
            })
            .slice(0, 20);
    }, [
        existingSectionQuery,
        hasValidStrand,
        normalizedStrand,
        sectionOptions,
    ]);

    const canContinueStepOne = useMemo(() => {
        return Boolean(data.subject_name && data.school_year);
    }, [data.subject_name, data.school_year]);

    const canContinueStepTwo = useMemo(() => {
        if (!isEditMode) {
            return sectionQueue.length > 0;
        }

        const hasBasicSectionDetails =
            data.grade_level && data.section && hasValidStrand;

        if (sectionMode === "existing") {
            return Boolean(selectedExistingSectionId && hasBasicSectionDetails);
        }

        return Boolean(hasBasicSectionDetails && data.specialization);
    }, [
        isEditMode,
        sectionQueue.length,
        data.grade_level,
        data.section,
        data.specialization,
        hasValidStrand,
        sectionMode,
        selectedExistingSectionId,
    ]);

    const activeQueuedSection = useMemo(
        () =>
            sectionQueue.find(
                (section) => section.queueKey === activeQueueSectionKey,
            ) ?? null,
        [sectionQueue, activeQueueSectionKey],
    );

    const activeSectionWorkflow = useMemo(() => {
        if (!activeQueuedSection) {
            return null;
        }

        return (
            sectionWorkflowMap[activeQueuedSection.queueKey] ??
            createSectionWorkflowState(data.color)
        );
    }, [activeQueuedSection, sectionWorkflowMap, data.color]);

    const areAllSectionsStudentsDone = useMemo(() => {
        return (
            sectionQueue.length > 0 &&
            sectionQueue.every(
                (section) => sectionWorkflowMap[section.queueKey]?.studentsDone,
            )
        );
    }, [sectionQueue, sectionWorkflowMap]);

    const areAllSectionsColorDone = useMemo(() => {
        return (
            sectionQueue.length > 0 &&
            sectionQueue.every(
                (section) => sectionWorkflowMap[section.queueKey]?.colorDone,
            )
        );
    }, [sectionQueue, sectionWorkflowMap]);

    const areAllSectionsReviewDone = useMemo(() => {
        return (
            sectionQueue.length > 0 &&
            sectionQueue.every(
                (section) => sectionWorkflowMap[section.queueKey]?.reviewDone,
            )
        );
    }, [sectionQueue, sectionWorkflowMap]);

    const sortedActiveQueuedStudents = useMemo(() => {
        if (!activeSectionWorkflow) {
            return [];
        }

        return [...activeSectionWorkflow.manualStudents].sort((a, b) => {
            const nameA = normalizeSearchValue(a.student_name);
            const nameB = normalizeSearchValue(b.student_name);

            if (nameA === nameB) {
                return String(a.lrn ?? "").localeCompare(String(b.lrn ?? ""));
            }

            return nameA.localeCompare(nameB);
        });
    }, [activeSectionWorkflow]);

    const combinedSectionValue = useMemo(() => {
        const sectionSuffix = sanitizeSectionName(data.section);

        if (!normalizedStrand || !sectionSuffix) {
            return "";
        }

        return `${normalizedStrand}-${sectionSuffix}`;
    }, [data.section, normalizedStrand]);

    const hasLocalDuplicateClass = useMemo(() => {
        if (!data.grade_level || !data.subject_name || !combinedSectionValue) {
            return false;
        }

        const gradeLevelKey = normalizeSearchValue(data.grade_level);
        const subjectKey = normalizeSearchValue(data.subject_name);
        const sectionKey = normalizeSearchValue(combinedSectionValue);

        return existingClasses.some((existingClass) => {
            if (
                isEditMode &&
                classData?.id &&
                String(existingClass?.id) === String(classData.id)
            ) {
                return false;
            }

            const existingGradeLevel = normalizeSearchValue(
                normalizeGradeLevel(
                    existingClass?.name ?? existingClass?.grade_level,
                ),
            );
            const existingSubject = normalizeSearchValue(
                existingClass?.subject_name ?? existingClass?.subject,
            );
            const existingSection = normalizeSearchValue(
                existingClass?.section,
            );

            return (
                existingGradeLevel === gradeLevelKey &&
                existingSubject === subjectKey &&
                existingSection === sectionKey
            );
        });
    }, [
        data.grade_level,
        data.subject_name,
        combinedSectionValue,
        existingClasses,
        isEditMode,
        classData?.id,
    ]);

    const selectedColor = useMemo(() => {
        return COLOR_OPTIONS.find((item) => item.name === data.color);
    }, [data.color]);

    const subjectOptions = useMemo(() => {
        const seenNames = new Set();

        return availableSubjects
            .map((subject, index) => {
                if (typeof subject === "string") {
                    const subjectName = subject.trim();

                    if (!subjectName) {
                        return null;
                    }

                    return {
                        id: `subject-${index}`,
                        subject_name: subjectName,
                        subject_code: "",
                    };
                }

                const subjectName = String(
                    subject?.subject_name ?? subject?.name ?? "",
                ).trim();

                if (!subjectName) {
                    return null;
                }

                return {
                    id: subject?.id ?? `subject-${index}`,
                    subject_name: subjectName,
                    subject_code: String(
                        subject?.subject_code ?? subject?.code ?? "",
                    ).trim(),
                };
            })
            .filter((subject) => subject !== null)
            .filter((subject) => {
                const key = normalizeSearchValue(subject.subject_name);

                if (!key || seenNames.has(key)) {
                    return false;
                }

                seenNames.add(key);
                return true;
            });
    }, [availableSubjects]);

    const filteredSubjects = useMemo(() => {
        const query = normalizeSearchValue(data.subject_name);

        if (!query) {
            return subjectOptions.slice(0, 50);
        }

        return subjectOptions
            .filter((subject) => {
                const subjectName = normalizeSearchValue(subject.subject_name);
                const subjectCode = normalizeSearchValue(subject.subject_code);

                return (
                    subjectName.includes(query) || subjectCode.includes(query)
                );
            })
            .slice(0, 50);
    }, [subjectOptions, data.subject_name]);

    const activeStudentDraft =
        activeSectionWorkflow?.studentDraft ?? DEFAULT_STUDENT_DRAFT;
    const activeStudentDraftError =
        activeSectionWorkflow?.studentDraftError ?? "";
    const activeBulkRows = activeSectionWorkflow?.bulkRows ?? "";
    const activeBulkErrors = activeSectionWorkflow?.bulkErrors ?? [];
    const activeClasslist = activeSectionWorkflow?.classlist ?? null;
    const activeSectionColorName = activeSectionWorkflow?.color ?? data.color;
    const activeQueuedStudents = activeSectionWorkflow?.manualStudents ?? [];
    const canMarkStudentsDone =
        Boolean(activeQueuedSection) &&
        (activeQueuedStudents.length > 0 || Boolean(activeClasslist));
    const canMarkColorDone =
        Boolean(activeQueuedSection) && Boolean(activeSectionColorName);

    const canContinueStepThree = useMemo(() => {
        if (isEditMode) {
            return true;
        }

        return areAllSectionsStudentsDone;
    }, [isEditMode, areAllSectionsStudentsDone]);

    const canContinueStepFour = useMemo(() => {
        if (isEditMode) {
            return true;
        }

        return areAllSectionsColorDone;
    }, [isEditMode, areAllSectionsColorDone]);

    const canSubmitStepFive = useMemo(() => {
        if (isEditMode) {
            return true;
        }

        return areAllSectionsReviewDone;
    }, [isEditMode, areAllSectionsReviewDone]);

    const resetWizardState = () => {
        setStep(1);
        setIsSubjectMenuOpen(false);
        setIsDepartmentMenuOpen(false);
        setSectionMode("existing");
        setSelectedExistingSectionId(null);
        setExistingSectionQuery("");
        setManualStudents([]);
        setStudentDraft({ ...DEFAULT_STUDENT_DRAFT });
        setStudentDraftError("");
        setBulkRows("");
        setBulkErrors([]);
        setSectionQueue([]);
        setActiveQueueSectionKey(null);
        setSectionWorkflowMap({});
        setStudentInputMode("single");
        setIsSummaryModalOpen(false);
    };

    useEffect(() => {
        if (isEditMode && classData) {
            resetWizardState();
            setData({
                grade_level: normalizeGradeLevel(
                    classData?.name ?? classData?.grade_level,
                ),
                section: sanitizeSectionName(
                    parseSectionSuffix(classData?.section, classData?.strand),
                ),
                subject_name:
                    classData?.subject_name ?? classData?.subject ?? "",
                color: classData?.color ?? "indigo",
                school_year: classData?.school_year ?? defaultSchoolYear,
                strand: normalizeDepartmentCode(classData?.strand),
                specialization: sanitizeSpecialization(
                    classData?.specialization ?? "",
                ),
                classlist: null,
                manual_students: [],
            });

            setSectionMode("manual");
            return;
        }

        resetWizardState();

        setData({
            grade_level: "",
            section: "",
            subject_name: "",
            color: "indigo",
            school_year: defaultSchoolYear,
            strand: "",
            specialization: "",
            classlist: null,
            manual_students: [],
        });
    }, [defaultSchoolYear, isEditMode, classData]);

    useEffect(() => {
        if (sectionMode !== "existing" || !selectedExistingSectionId) {
            return;
        }

        const currentSelection = sectionOptions.find(
            (section) => section.id === selectedExistingSectionId,
        );

        if (!currentSelection || currentSelection.strand !== normalizedStrand) {
            setSelectedExistingSectionId(null);
            setData("grade_level", "");
            setData("section", "");
        }
    }, [
        normalizedStrand,
        sectionMode,
        sectionOptions,
        selectedExistingSectionId,
        setData,
    ]);

    useEffect(() => {
        if (sectionMode !== "manual") {
            return;
        }

        const normalizedSpecialization = sanitizeSpecialization(
            data.specialization,
        );

        if (!selectedDepartment) {
            if (normalizedSpecialization !== "") {
                setData("specialization", "");
            }
            return;
        }

        if (specializationOptions.includes(normalizedSpecialization)) {
            return;
        }

        if (specializationOptions.length === 1) {
            setData("specialization", specializationOptions[0]);
            return;
        }

        if (normalizedSpecialization !== "") {
            setData("specialization", "");
        }
    }, [
        sectionMode,
        selectedDepartment,
        specializationOptions,
        data.specialization,
        setData,
    ]);

    useEffect(() => {
        if (isEditMode) {
            setData("manual_students", manualStudents);
        }
    }, [isEditMode, manualStudents, setData]);

    useEffect(() => {
        if (isEditMode || sectionQueue.length === 0 || activeQueueSectionKey) {
            return;
        }

        setActiveQueueSectionKey(sectionQueue[0].queueKey);
    }, [isEditMode, sectionQueue, activeQueueSectionKey]);

    useEffect(() => {
        if (isEditMode || !activeQueuedSection) {
            return;
        }

        const workflow =
            sectionWorkflowMap[activeQueuedSection.queueKey] ??
            createSectionWorkflowState(data.color);

        setData("strand", activeQueuedSection.strand);
        setData("grade_level", activeQueuedSection.grade_level);
        setData("section", activeQueuedSection.section);
        setData("specialization", activeQueuedSection.specialization ?? "");
        setData("color", workflow.color);
    }, [
        isEditMode,
        activeQueuedSection,
        sectionWorkflowMap,
        data.color,
        setData,
    ]);

    useEffect(() => {
        if (isEditMode) {
            setIsSummaryModalOpen(false);
            return;
        }

        if (step === 5) {
            setIsSummaryModalOpen(true);
            return;
        }

        setIsSummaryModalOpen(false);
    }, [isEditMode, step]);

    const handleClose = () => {
        submitLockRef.current = false;
        reset();
        clearErrors();
        resetWizardState();

        if (!isEditMode) {
            setData({
                grade_level: "",
                section: "",
                subject_name: "",
                color: "indigo",
                school_year: defaultSchoolYear,
                strand: "",
                specialization: "",
                classlist: null,
                manual_students: [],
            });
        }

        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        clearErrors("class_duplicate");

        if (name === "section") {
            setData("section", sanitizeSectionName(value));
            return;
        }

        if (name === "subject_name") {
            setData("subject_name", value);
            setIsSubjectMenuOpen(true);
            return;
        }

        if (name === "strand") {
            setData("strand", normalizeDepartmentCode(value));
            setIsDepartmentMenuOpen(true);
            return;
        }

        if (name === "specialization") {
            setData("specialization", sanitizeSpecialization(value));
            return;
        }

        setData(name, value);
    };

    const handleSubjectSelect = (subjectName) => {
        clearErrors("class_duplicate");
        setData("subject_name", subjectName);
        setIsSubjectMenuOpen(false);
    };

    const handleDepartmentSelect = (departmentCode) => {
        clearErrors("class_duplicate");
        const normalizedCode = normalizeDepartmentCode(departmentCode);

        setData("strand", normalizedCode);
        setIsDepartmentMenuOpen(false);
        setExistingSectionQuery("");

        if (sectionMode === "manual") {
            setData("specialization", "");
        }

        if (isEditMode && sectionMode === "existing") {
            setSelectedExistingSectionId(null);
            setData("grade_level", "");
            setData("section", "");
        }
    };

    const handleSectionModeChange = (mode) => {
        clearErrors("class_duplicate");
        setSectionMode(mode);

        if (mode === "manual") {
            setSelectedExistingSectionId(null);
            if (isEditMode) {
                setData("grade_level", "");
                setData("section", "");
            }
            return;
        }

        if (isEditMode) {
            setData("grade_level", "");
            setData("section", "");
        }
    };

    const ensureSectionWorkflowEntry = (queueKey, color = data.color) => {
        setSectionWorkflowMap((prev) => {
            if (prev[queueKey]) {
                return prev;
            }

            return {
                ...prev,
                [queueKey]: createSectionWorkflowState(color),
            };
        });
    };

    const updateSectionWorkflow = (queueKey, updater) => {
        setSectionWorkflowMap((prev) => {
            const current =
                prev[queueKey] ?? createSectionWorkflowState(data.color);
            const nextValue =
                typeof updater === "function"
                    ? updater(current)
                    : {
                          ...current,
                          ...updater,
                      };

            return {
                ...prev,
                [queueKey]: nextValue,
            };
        });
    };

    const syncQueueSectionToForm = (queueSection) => {
        setData("strand", queueSection.strand);
        setData("grade_level", queueSection.grade_level);
        setData("section", queueSection.section);
        setData("specialization", queueSection.specialization ?? "");

        const workflow = sectionWorkflowMap[queueSection.queueKey];
        if (workflow?.color) {
            setData("color", workflow.color);
        }
    };

    const getSectionQueueKey = (section) => {
        return (
            section.queueKey ??
            `${section.strand}-${section.grade_level}-${section.specialization ?? ""}-${section.section}`
        );
    };

    const addSectionToQueue = (section) => {
        const queueKey = getSectionQueueKey(section);

        if (sectionQueue.some((item) => item.queueKey === queueKey)) {
            setError("section_queue", "Section is already in the queue.");
            return;
        }

        const queuedSection = {
            ...section,
            queueKey,
        };

        clearErrors("section_queue");
        setSectionQueue((prev) => [...prev, queuedSection]);
        setActiveQueueSectionKey(queueKey);
        syncQueueSectionToForm(queuedSection);
        ensureSectionWorkflowEntry(queueKey, data.color);
    };

    const addManualSectionToQueue = () => {
        clearErrors("section_queue");

        const gradeLevel = normalizeGradeLevel(data.grade_level);
        const sectionName = sanitizeSectionName(data.section);

        if (!hasValidStrand) {
            setError(
                "section_queue",
                "Select a valid department code before queuing sections.",
            );
            return;
        }

        if (!gradeLevel || !sectionName) {
            setError(
                "section_queue",
                "Grade level and section name are required before adding a section card.",
            );
            return;
        }

        const specialization = sanitizeSpecialization(data.specialization);

        if (!specialization) {
            setError(
                "section_queue",
                "Strand/Specialization is required before adding a section card.",
            );
            return;
        }

        const sectionLabel = buildSectionFullLabel(
            gradeLevel,
            specialization,
            sectionName,
        );

        addSectionToQueue({
            id: `manual-${normalizedStrand}-${gradeLevel}-${specialization}-${sectionName}`,
            key: `manual-${normalizedStrand}-${gradeLevel}-${specialization}-${sectionName}`,
            strand: normalizedStrand,
            section: sectionName,
            grade_level: gradeLevel,
            specialization,
            section_label: sectionLabel,
            section_full_label: sectionLabel,
        });

        setData("section", "");
    };

    const removeQueuedSection = (queueKey) => {
        setSectionQueue((prev) => {
            const targetIndex = prev.findIndex(
                (section) => section.queueKey === queueKey,
            );

            if (targetIndex < 0) {
                return prev;
            }

            const next = prev.filter(
                (section) => section.queueKey !== queueKey,
            );

            if (next.length === 0) {
                setActiveQueueSectionKey(null);
                setData("grade_level", "");
                setData("section", "");
                return next;
            }

            if (activeQueueSectionKey === queueKey) {
                const fallback = next[targetIndex] ?? next[targetIndex - 1];

                if (fallback) {
                    setActiveQueueSectionKey(fallback.queueKey);
                    syncQueueSectionToForm(fallback);
                }
            }

            return next;
        });

        setSectionWorkflowMap((prev) => {
            if (!prev[queueKey]) {
                return prev;
            }

            const next = { ...prev };
            delete next[queueKey];
            return next;
        });
    };

    const getDoneFieldForStep = (currentStep) => {
        if (currentStep === 3) return "studentsDone";
        if (currentStep === 4) return "colorDone";
        if (currentStep === 5) return "reviewDone";
        return null;
    };

    const isQueueSectionLocked = (queueSection, currentStep = step) => {
        const doneField = getDoneFieldForStep(currentStep);

        if (!doneField) {
            return false;
        }

        const sectionIndex = sectionQueue.findIndex(
            (item) => item.queueKey === queueSection.queueKey,
        );

        if (sectionIndex <= 0) {
            return false;
        }

        return sectionQueue
            .slice(0, sectionIndex)
            .some((item) => !sectionWorkflowMap[item.queueKey]?.[doneField]);
    };

    const selectQueuedSectionCard = (queueSection) => {
        if (isQueueSectionLocked(queueSection)) {
            return;
        }

        setActiveQueueSectionKey(queueSection.queueKey);
        syncQueueSectionToForm(queueSection);
    };

    const markActiveSectionDone = (doneField) => {
        if (!activeQueuedSection) {
            return;
        }

        const activeKey = activeQueuedSection.queueKey;

        setSectionWorkflowMap((prev) => {
            const current =
                prev[activeKey] ?? createSectionWorkflowState(data.color);
            const nextState = {
                ...prev,
                [activeKey]: {
                    ...current,
                    [doneField]: true,
                },
            };

            const currentIndex = sectionQueue.findIndex(
                (section) => section.queueKey === activeKey,
            );

            for (let i = currentIndex + 1; i < sectionQueue.length; i += 1) {
                const canOpen = sectionQueue
                    .slice(0, i)
                    .every(
                        (section) => nextState[section.queueKey]?.[doneField],
                    );

                if (canOpen) {
                    const nextSection = sectionQueue[i];

                    window.requestAnimationFrame(() => {
                        setActiveQueueSectionKey(nextSection.queueKey);
                        syncQueueSectionToForm(nextSection);
                    });
                    break;
                }
            }

            return nextState;
        });
    };

    const handleExistingSectionSelect = (section) => {
        if (!isEditMode) {
            setSelectedExistingSectionId(section.id);
            addSectionToQueue(section);
            return;
        }

        clearErrors("class_duplicate");
        setSectionMode("existing");
        setSelectedExistingSectionId(section.id);
        setData("strand", section.strand);
        setData("grade_level", section.grade_level);
        setData("section", section.section);
        setData("specialization", section.specialization ?? "");
    };

    const handleFileChange = (file) => {
        if (!isEditMode && activeQueuedSection) {
            updateSectionWorkflow(activeQueuedSection.queueKey, {
                classlist: file || null,
                studentsDone: false,
                reviewDone: false,
            });
            return;
        }

        setData("classlist", file || null);
    };

    const addSingleStudent = async () => {
        if (!isEditMode) {
            if (!activeQueuedSection || !activeSectionWorkflow) {
                setError(
                    "section_queue",
                    "Select a section card first before adding students.",
                );
                return;
            }

            const draft = activeSectionWorkflow.studentDraft;
            const lrn = sanitizeLrn(draft.lrn);

            if (!lrn || lrn.length !== 12) {
                updateSectionWorkflow(activeQueuedSection.queueKey, {
                    studentDraftError: "Please enter a valid 12-digit LRN.",
                });
                return;
            }

            if (
                activeSectionWorkflow.manualStudents.some(
                    (student) => student.lrn === lrn,
                )
            ) {
                updateSectionWorkflow(activeQueuedSection.queueKey, {
                    studentDraftError: "This student is already in the queue.",
                });
                return;
            }

            setIsSearchingStudent(true);
            try {
                const response = await fetch(
                    `/teacher/students/search-by-lrn?lrn=${lrn}`,
                );
                const result = await response.json();

                if (response.ok && result.student) {
                    updateSectionWorkflow(
                        activeQueuedSection.queueKey,
                        (current) => ({
                            ...current,
                            studentsDone: false,
                            reviewDone: false,
                            studentDraftError: "",
                            studentDraft: { ...DEFAULT_STUDENT_DRAFT },
                            manualStudents: [
                                ...current.manualStudents,
                                {
                                    student_name: result.student.name,
                                    lrn: result.student.lrn,
                                    personal_email:
                                        result.student.personal_email || null,
                                },
                            ],
                        }),
                    );
                } else {
                    updateSectionWorkflow(activeQueuedSection.queueKey, {
                        studentDraftError:
                            result.message || "No student found with this LRN.",
                    });
                }
            } catch (error) {
                updateSectionWorkflow(activeQueuedSection.queueKey, {
                    studentDraftError:
                        "An error occurred while searching for the student.",
                });
            } finally {
                setIsSearchingStudent(false);
            }
            return;
        }

        const lrn = sanitizeLrn(studentDraft.lrn);

        if (!lrn || lrn.length !== 12) {
            setStudentDraftError("Please enter a valid 12-digit LRN.");
            return;
        }

        if (manualStudents.some((student) => student.lrn === lrn)) {
            setStudentDraftError("This student is already in the queue.");
            return;
        }

        setIsSearchingStudent(true);
        try {
            const response = await fetch(
                `/teacher/students/search-by-lrn?lrn=${lrn}`,
            );
            const result = await response.json();

            if (response.ok && result.student) {
                setManualStudents((prev) => [
                    ...prev,
                    {
                        student_name: result.student.name,
                        lrn: result.student.lrn,
                        personal_email: result.student.personal_email || null,
                    },
                ]);

                setStudentDraft({
                    student_name: "",
                    lrn: "",
                    personal_email: "",
                });
                setStudentDraftError("");
            } else {
                setStudentDraftError(
                    result.message || "No student found with this LRN.",
                );
            }
        } catch (error) {
            setStudentDraftError(
                "An error occurred while searching for the student.",
            );
        } finally {
            setIsSearchingStudent(false);
        }
    };

    const removeQueuedStudent = (index) => {
        if (!isEditMode && activeQueuedSection) {
            updateSectionWorkflow(activeQueuedSection.queueKey, (current) => ({
                ...current,
                studentsDone: false,
                reviewDone: false,
                manualStudents: current.manualStudents.filter(
                    (_, itemIndex) => itemIndex !== index,
                ),
            }));
            return;
        }

        setManualStudents((prev) => prev.filter((_, i) => i !== index));
    };

    const handleActiveStudentDraftChange = (field, value) => {
        if (!activeQueuedSection) {
            return;
        }

        updateSectionWorkflow(activeQueuedSection.queueKey, (current) => ({
            ...current,
            studentDraftError: "",
            studentDraft: {
                ...current.studentDraft,
                [field]: field === "lrn" ? sanitizeLrn(value) : value,
            },
        }));
    };

    const handleActiveBulkRowsChange = (value) => {
        if (!activeQueuedSection) {
            return;
        }

        updateSectionWorkflow(activeQueuedSection.queueKey, (current) => ({
            ...current,
            bulkRows: value,
            bulkErrors: [],
        }));
    };

    const handleActiveSectionColorSelect = (colorName) => {
        if (!activeQueuedSection) {
            return;
        }

        updateSectionWorkflow(activeQueuedSection.queueKey, (current) => ({
            ...current,
            color: colorName,
            colorDone: false,
            reviewDone: false,
        }));
        setData("color", colorName);
    };

    const getQueueSectionWorkflow = (queueSection) => {
        if (!queueSection) {
            return createSectionWorkflowState(data.color);
        }

        return (
            sectionWorkflowMap[queueSection.queueKey] ??
            createSectionWorkflowState(data.color)
        );
    };

    const renderSectionCardList = (
        doneField,
        lockStep = null,
        showRemoveButton = false,
    ) => {
        if (sectionQueue.length === 0) {
            return (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                    No sections queued yet.
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {sectionQueue.map((queueSection, index) => {
                    const workflow = getQueueSectionWorkflow(queueSection);
                    const isDone = doneField
                        ? Boolean(workflow[doneField])
                        : false;
                    const isLocked =
                        lockStep === null
                            ? false
                            : isQueueSectionLocked(queueSection, lockStep);
                    const isActive =
                        activeQueueSectionKey === queueSection.queueKey;

                    return (
                        <div key={queueSection.queueKey} className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    selectQueuedSectionCard(queueSection)
                                }
                                disabled={isLocked}
                                className={`w-full rounded-xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                                    isActive
                                        ? "border-indigo-500 bg-indigo-50"
                                        : "border-gray-200 bg-white hover:border-indigo-300"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {queueSection.section_full_label ||
                                                queueSection.section_label}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {queueSection.strand}-
                                            {queueSection.section}
                                            {queueSection.specialization
                                                ? ` • ${queueSection.specialization}`
                                                : ""}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                                            isDone
                                                ? "bg-emerald-600 text-white"
                                                : "bg-gray-200 text-gray-700"
                                        }`}
                                    >
                                        {isDone ? (
                                            <Check size={12} />
                                        ) : (
                                            <p>
                                                Strand/Specialization:{" "}
                                                {activeQueuedSection.specialization ||
                                                    "-"}
                                            </p>
                                        )}
                                    </span>
                                </div>

                                {isLocked && (
                                    <p className="mt-2 text-[11px] font-medium text-amber-700">
                                        Locked until earlier sections are done.
                                    </p>
                                )}
                            </button>

                            {showRemoveButton && (
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        removeQueuedSection(
                                            queueSection.queueKey,
                                        );
                                    }}
                                    className="absolute right-2 top-2 rounded-lg p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                    aria-label="Remove queued section"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderActiveSectionSummaryPanel = () => {
        if (!activeQueuedSection || !activeSectionWorkflow) {
            return (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
                    Select a section card to preview its summary.
                </div>
            );
        }

        const sectionColor =
            COLOR_OPTIONS.find(
                (option) => option.name === activeSectionWorkflow.color,
            ) ?? selectedColor;

        return (
            <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-800">
                        {activeQueuedSection.section_full_label ||
                            activeQueuedSection.section_label}
                    </p>
                    <div className="mt-2 grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
                        <p>Subject: {data.subject_name || "-"}</p>
                        <p>School year: {data.school_year || "-"}</p>
                        <p>
                            Grade level:{" "}
                            {activeQueuedSection.grade_level || "-"}
                        </p>
                        <p>
                            Section: {activeQueuedSection.strand}-
                            {activeQueuedSection.section}
                        </p>
                        <p>
                            Strand/Specialization:{" "}
                            {activeQueuedSection.specialization || "-"}
                        </p>
                        <p>
                            Color:{" "}
                            {sectionColor?.name ||
                                activeSectionWorkflow.color ||
                                "indigo"}
                        </p>
                        <p>
                            CSV classlist:{" "}
                            {activeSectionWorkflow.classlist?.name || "None"}
                        </p>
                        <p>
                            Queued students:{" "}
                            {activeSectionWorkflow.manualStudents.length}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-indigo-800">
                            Student Queue Summary
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-indigo-700">
                            <Users size={12} />
                            {sortedActiveQueuedStudents.length}
                        </span>
                    </div>
                    <p className="text-xs text-indigo-700">
                        Includes students queued one-by-one and bulk text
                        import, sorted alphabetically.
                    </p>

                    {sortedActiveQueuedStudents.length === 0 ? (
                        <p className="mt-2 text-xs text-indigo-700">
                            No queued students for this section.
                        </p>
                    ) : (
                        <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                            {sortedActiveQueuedStudents.map(
                                (student, index) => (
                                    <div
                                        key={`${student.lrn}-${index}`}
                                        className="rounded-md bg-white px-3 py-2"
                                    >
                                        <p className="text-xs font-medium text-gray-800">
                                            {student.student_name}
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            {student.lrn}
                                            {student.personal_email
                                                ? ` • ${student.personal_email}`
                                                : ""}
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (submitLockRef.current || processing) {
            return;
        }

        if (!isEditMode && step !== 5) {
            return;
        }

        let createPayload = null;

        if (!isEditMode) {
            if (!areAllSectionsReviewDone) {
                return;
            }

            const submitSection =
                activeQueuedSection ?? sectionQueue[0] ?? null;

            if (!submitSection) {
                setError(
                    "section_queue",
                    "Add at least one section to the queue before creating a class.",
                );
                return;
            }

            const submitWorkflow =
                sectionWorkflowMap[submitSection.queueKey] ??
                createSectionWorkflowState(data.color);
            const sectionCombined = `${submitSection.strand}-${submitSection.section}`;
            const gradeLevelKey = normalizeSearchValue(
                submitSection.grade_level,
            );
            const subjectKey = normalizeSearchValue(data.subject_name);
            const sectionKey = normalizeSearchValue(sectionCombined);

            const duplicateExists = existingClasses.some((existingClass) => {
                const existingGradeLevel = normalizeSearchValue(
                    normalizeGradeLevel(
                        existingClass?.name ?? existingClass?.grade_level,
                    ),
                );
                const existingSubject = normalizeSearchValue(
                    existingClass?.subject_name ?? existingClass?.subject,
                );
                const existingSection = normalizeSearchValue(
                    existingClass?.section,
                );

                return (
                    existingGradeLevel === gradeLevelKey &&
                    existingSubject === subjectKey &&
                    existingSection === sectionKey
                );
            });

            if (duplicateExists) {
                setStep(5);
                setError(
                    "class_duplicate",
                    "Duplicate class detected. A class with the same grade level, subject, and section already exists. Please edit the class details or cancel.",
                );
                return;
            }

            createPayload = {
                grade_level: submitSection.grade_level,
                section: submitSection.section,
                subject_name: data.subject_name,
                color: submitWorkflow.color || data.color,
                school_year: data.school_year,
                strand: submitSection.strand,
                specialization:
                    submitSection.specialization ?? submitSection.strand,
                classlist: submitWorkflow.classlist,
                manual_students: submitWorkflow.manualStudents,
            };
        } else if (hasLocalDuplicateClass) {
            setError(
                "class_duplicate",
                "Duplicate class detected. A class with the same grade level, subject, and section already exists. Please edit the class details or cancel.",
            );
            return;
        }

        submitLockRef.current = true;

        if (isEditMode && classData?.id) {
            put(route("teacher.classes.update", classData.id), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: () => {
                    handleClose();
                },
                onFinish: () => {
                    submitLockRef.current = false;
                },
            });
            return;
        }

        transform(() => createPayload ?? data);

        post(route("teacher.classes.store"), {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onError: (formErrors) => {
                if (formErrors?.class_duplicate) {
                    setStep(5);
                }
            },
            onSuccess: () => {
                handleClose();
            },
            onFinish: () => {
                transform((formData) => formData);
                submitLockRef.current = false;
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                onClick={handleClose}
            />

            <div className="flex min-h-full items-end justify-center p-3 pb-10 sm:items-center sm:p-4">
                <div className="relative flex h-[calc(100vh-6rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl">
                    <form
                        onSubmit={handleSubmit}
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    >
                        {/* Modal Header */}
                        <div className="relative shrink-0 overflow-hidden border-b border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-4 sm:px-6 sm:py-5">
                            <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                            <div className="relative flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                                    <Plus size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">
                                        {isEditMode
                                            ? "Edit Class"
                                            : "Add New Class Wizard"}
                                    </h3>
                                    <p className="text-xs text-blue-100">
                                        {isEditMode
                                            ? `Showing subjects for Semester ${currentSemester}`
                                            : `Step ${step} of ${WIZARD_STEPS.length}: ${WIZARD_STEPS[step - 1].title}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="absolute right-3 top-3 rounded-lg p-1.5 text-blue-100 transition-colors hover:bg-white/15 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {!isEditMode && (
                            <div className="shrink-0 border-b border-blue-100 px-4 py-3 sm:px-6 sm:py-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    {WIZARD_STEPS.map((wizardStep) => (
                                        <StepBadge
                                            key={wizardStep.id}
                                            step={wizardStep}
                                            currentStep={step}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Modal Body (Form) */}
                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-blue-50/40 px-4 py-4 sm:px-6 sm:py-5">
                            {(isEditMode || step === 1) && (
                                <div className="space-y-4">
                                    {!isEditMode && (
                                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                                            <p className="text-sm font-semibold text-indigo-800">
                                                Step 1: Subject Selection
                                            </p>
                                            <p className="mt-1 text-xs text-indigo-700">
                                                Pick or type the subject first,
                                                then continue to section setup.
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Subject
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="subject_name"
                                                    required
                                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    value={data.subject_name}
                                                    onChange={handleChange}
                                                    onFocus={() =>
                                                        setIsSubjectMenuOpen(
                                                            true,
                                                        )
                                                    }
                                                    onBlur={() => {
                                                        setTimeout(() => {
                                                            setIsSubjectMenuOpen(
                                                                false,
                                                            );
                                                        }, 120);
                                                    }}
                                                    placeholder="Type to search subjects"
                                                    autoComplete="off"
                                                />

                                                {isSubjectMenuOpen &&
                                                    subjectOptions.length >
                                                        0 && (
                                                        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                                            {filteredSubjects.length ===
                                                            0 ? (
                                                                <p className="px-3 py-2 text-sm text-gray-500">
                                                                    No matching
                                                                    subjects.
                                                                </p>
                                                            ) : (
                                                                filteredSubjects.map(
                                                                    (
                                                                        subject,
                                                                    ) => (
                                                                        <button
                                                                            key={`${subject.id}-${subject.subject_name}`}
                                                                            type="button"
                                                                            onMouseDown={(
                                                                                event,
                                                                            ) => {
                                                                                event.preventDefault();
                                                                                handleSubjectSelect(
                                                                                    subject.subject_name,
                                                                                );
                                                                            }}
                                                                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50"
                                                                        >
                                                                            <span className="font-medium text-gray-700">
                                                                                {
                                                                                    subject.subject_name
                                                                                }
                                                                            </span>
                                                                            <span className="ml-2 text-xs text-gray-500">
                                                                                {subject.subject_code ||
                                                                                    "No code"}
                                                                            </span>
                                                                        </button>
                                                                    ),
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                            </div>

                                            {subjectOptions.length > 0 ? (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {`Available subjects: ${subjectOptions.length}. Type to filter.`}
                                                </p>
                                            ) : (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    No subjects found in the
                                                    system yet. You may enter
                                                    one manually.
                                                </p>
                                            )}

                                            {errors.subject_name && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    {errors.subject_name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                School Year
                                            </label>
                                            <input
                                                type="text"
                                                name="school_year"
                                                required
                                                className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 text-gray-600 shadow-sm"
                                                value={data.school_year}
                                                readOnly
                                                placeholder="e.g., 2025-2026"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                School year is managed in system
                                                settings.
                                            </p>
                                            {errors.school_year && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    {errors.school_year}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(isEditMode || step === 2) && (
                                <div className="space-y-5">
                                    {!isEditMode && (
                                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                                            <p className="text-sm font-semibold text-indigo-800">
                                                Step 2: Section Setup and Queue
                                            </p>
                                            <p className="mt-1 text-xs text-indigo-700">
                                                Select an existing section from the list below.
                                            </p>
                                        </div>
                                    )}

                                    <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Department
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="strand"
                                                    required
                                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    value={data.strand}
                                                    onChange={handleChange}
                                                    onFocus={() =>
                                                        setIsDepartmentMenuOpen(
                                                            true,
                                                        )
                                                    }
                                                    onBlur={() => {
                                                        setTimeout(() => {
                                                            setIsDepartmentMenuOpen(
                                                                false,
                                                            );
                                                        }, 120);
                                                    }}
                                                    placeholder="Type department code (e.g., STEM, ABM, TVL)"
                                                    autoComplete="off"
                                                />

                                                {isDepartmentMenuOpen &&
                                                    departmentOptions.length >
                                                        0 && (
                                                        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                                            {filteredDepartments.length ===
                                                            0 ? (
                                                                <p className="px-3 py-2 text-sm text-gray-500">
                                                                    No matching
                                                                    department
                                                                    codes.
                                                                </p>
                                                            ) : (
                                                                filteredDepartments.map(
                                                                    (
                                                                        department,
                                                                    ) => (
                                                                        <button
                                                                            key={
                                                                                department.department_code
                                                                            }
                                                                            type="button"
                                                                            onMouseDown={(
                                                                                event,
                                                                            ) => {
                                                                                event.preventDefault();
                                                                                handleDepartmentSelect(
                                                                                    department.department_code,
                                                                                );
                                                                            }}
                                                                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50"
                                                                        >
                                                                            <span className="font-semibold text-gray-700">
                                                                                {
                                                                                    department.department_code
                                                                                }
                                                                            </span>
                                                                            <span className="ml-2 text-xs text-gray-500">
                                                                                {
                                                                                    department.department_name
                                                                                }
                                                                            </span>
                                                                        </button>
                                                                    ),
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Select the department first to see available sections.
                                            </p>
                                            {selectedDepartment && (
                                                <p className="mt-1 text-xs text-emerald-700">
                                                    Linked department:{" "}
                                                    {
                                                        selectedDepartment.department_code
                                                    }
                                                    {" - "}
                                                    {
                                                        selectedDepartment.department_name
                                                    }
                                                </p>
                                            )}
                                            {errors.strand && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    {errors.strand}
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    Existing Sections
                                                </p>
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                                    {hasValidStrand
                                                        ? filteredExistingSections.length
                                                        : 0}{" "}
                                                    results
                                                </span>
                                            </div>

                                            <input
                                                type="text"
                                                value={existingSectionQuery}
                                                onChange={(event) =>
                                                    setExistingSectionQuery(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={!hasValidStrand}
                                                className="w-full rounded-lg border-gray-300 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                                placeholder="Filter section by full label, grade level, or specialization"
                                            />

                                            {!hasValidStrand ? (
                                                <p className="text-xs text-amber-700">
                                                    Enter a valid department
                                                    code first.
                                                </p>
                                            ) : filteredExistingSections.length ===
                                                0 ? (
                                                <p className="text-xs text-gray-500">
                                                    No existing section
                                                    matched this strand.
                                                </p>
                                            ) : (
                                                <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                                                    {filteredExistingSections.map(
                                                        (section) => (
                                                            <button
                                                                key={
                                                                    section.key
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    handleExistingSectionSelect(
                                                                        section,
                                                                    )
                                                                }
                                                                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                                                                    selectedExistingSectionId ===
                                                                    section.id
                                                                        ? "border-indigo-500 bg-indigo-50"
                                                                        : "border-gray-200 bg-white hover:border-indigo-300"
                                                                }`}
                                                            >
                                                                <p className="text-sm font-semibold text-gray-800">
                                                                    {section.section_full_label ||
                                                                        section.section_label}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Section
                                                                    key:{" "}
                                                                    {
                                                                        section.strand
                                                                    }
                                                                    -
                                                                    {
                                                                        section.section
                                                                    }
                                                                    {section.specialization
                                                                        ? ` • Specialization: ${section.specialization}`
                                                                        : ""}
                                                                </p>
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            )}

                                            {(errors.grade_level ||
                                                errors.section) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.grade_level ||
                                                        errors.section}
                                                </p>
                                            )}
                                        </div>

                                        {selectedExistingSection && (
                                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                                                Selected section:{" "}
                                                {selectedExistingSection.section_full_label ||
                                                    selectedExistingSection.section_label}
                                            </div>
                                        )}
                                    </div>

                                    {!isEditMode && (
                                        <div className="space-y-4">
                                            {errors.section_queue && (
                                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                                    {errors.section_queue}
                                                </div>
                                            )}

                                            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-indigo-800">
                                                        Queued Sections
                                                    </p>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                                        <Users size={12} />
                                                        {sectionQueue.length}
                                                    </span>
                                                </div>
                                                {renderSectionCardList(
                                                    null,
                                                    null,
                                                    true,
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isEditMode && step === 3 && (
                                <div className="space-y-5">
                                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-indigo-800">
                                            Step 3: Add Students Per Section
                                        </p>
                                        <p className="mt-1 text-xs text-indigo-700">
                                            Select a section card on the left,
                                            add students on the right, then
                                            click done for that section.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                                            <p className="mb-3 text-sm font-semibold text-gray-800">
                                                Section Cards
                                            </p>
                                            {renderSectionCardList(
                                                "studentsDone",
                                                3,
                                                false,
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {!activeQueuedSection ? (
                                                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
                                                    Select a section card to add
                                                    students.
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            Active Section
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-600">
                                                            {activeQueuedSection.section_full_label ||
                                                                activeQueuedSection.section_label}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            Search and Add Student
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Enter the student's LRN to find them in the system.
                                                        </p>
                                                        <div className="mt-3 flex gap-2">
                                                            <div className="relative flex-1">
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        activeStudentDraft.lrn
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        handleActiveStudentDraftChange(
                                                                            "lrn",
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    onKeyDown={(
                                                                        e,
                                                                    ) => {
                                                                        if (
                                                                            e.key ===
                                                                            "Enter"
                                                                        ) {
                                                                            e.preventDefault();
                                                                            addSingleStudent();
                                                                        }
                                                                    }}
                                                                    placeholder="LRN (12 digits)"
                                                                    className="w-full rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                                    maxLength={
                                                                        12
                                                                    }
                                                                />
                                                                {isSearchingStudent && (
                                                                    <div className="absolute right-3 top-2.5">
                                                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    addSingleStudent
                                                                }
                                                                disabled={
                                                                    isSearchingStudent ||
                                                                    activeStudentDraft
                                                                        .lrn
                                                                        .length !==
                                                                        12
                                                                }
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                                                            >
                                                                <Search
                                                                    size={14}
                                                                />
                                                                Search
                                                            </button>
                                                        </div>
                                                        {activeStudentDraftError && (
                                                            <p className="mt-2 text-xs text-red-600">
                                                                {
                                                                    activeStudentDraftError
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <p className="text-sm font-semibold text-indigo-800">
                                                                Queued Students
                                                            </p>
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                                                <Users
                                                                    size={12}
                                                                />
                                                                {
                                                                    activeQueuedStudents.length
                                                                }
                                                            </span>
                                                        </div>

                                                        {activeQueuedStudents.length ===
                                                        0 ? (
                                                            <p className="text-xs text-indigo-700">
                                                                No queued
                                                                students yet.
                                                            </p>
                                                        ) : (
                                                            <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                                                                {activeQueuedStudents.map(
                                                                    (
                                                                        student,
                                                                        index,
                                                                    ) => (
                                                                        <div
                                                                            key={`${student.lrn}-${index}`}
                                                                            className="flex items-center justify-between rounded-md bg-white px-3 py-2"
                                                                        >
                                                                            <div>
                                                                                <p className="text-xs font-medium text-gray-800">
                                                                                    {
                                                                                        student.student_name
                                                                                    }
                                                                                </p>
                                                                                <p className="text-[11px] text-gray-500">
                                                                                    {
                                                                                        student.lrn
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    removeQueuedStudent(
                                                                                        index,
                                                                                    )
                                                                                }
                                                                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                                            >
                                                                                <Trash2
                                                                                    size={
                                                                                        13
                                                                                    }
                                                                                />
                                                                            </button>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                markActiveSectionDone(
                                                                    "studentsDone",
                                                                )
                                                            }
                                                            disabled={
                                                                !canMarkStudentsDone
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                                                        >
                                                            <Check size={13} />
                                                            Done for This
                                                            Section
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isEditMode && step === 4 && (
                                <div className="space-y-5">
                                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-indigo-800">
                                            Step 4: Pick Color Per Section
                                        </p>
                                        <p className="mt-1 text-xs text-indigo-700">
                                            Select a section card then choose
                                            its color theme and mark it done.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                                            <p className="mb-3 text-sm font-semibold text-gray-800">
                                                Section Cards
                                            </p>
                                            {renderSectionCardList(
                                                "colorDone",
                                                4,
                                                false,
                                            )}
                                        </div>

                                        <div>
                                            {!activeQueuedSection ? (
                                                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
                                                    Select a section card to set
                                                    its color.
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        Color for{" "}
                                                        {activeQueuedSection.section_full_label ||
                                                            activeQueuedSection.section_label}
                                                    </p>

                                                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                        {COLOR_OPTIONS.map(
                                                            (color) => (
                                                                <button
                                                                    key={
                                                                        color.name
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleActiveSectionColorSelect(
                                                                            color.name,
                                                                        )
                                                                    }
                                                                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition hover:border-indigo-400 ${
                                                                        activeSectionColorName ===
                                                                        color.name
                                                                            ? "border-indigo-500 bg-indigo-50"
                                                                            : "border-gray-200"
                                                                    }`}
                                                                >
                                                                    <span
                                                                        className={`inline-flex items-center gap-2 capitalize ${color.text}`}
                                                                    >
                                                                        <span
                                                                            className={`h-4 w-4 rounded-full ${color.bg}`}
                                                                        ></span>
                                                                        {
                                                                            color.name
                                                                        }
                                                                    </span>
                                                                    {activeSectionColorName ===
                                                                        color.name && (
                                                                        <Check
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="text-indigo-600"
                                                                        />
                                                                    )}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                markActiveSectionDone(
                                                                    "colorDone",
                                                                )
                                                            }
                                                            disabled={
                                                                !canMarkColorDone
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                                                        >
                                                            <Check size={13} />
                                                            Done for This
                                                            Section
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isEditMode && step === 5 && (
                                <div className="space-y-5">
                                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-indigo-800">
                                            Step 5: Review and Save
                                        </p>
                                        <p className="mt-1 text-xs text-indigo-700">
                                            Review each section summary and mark
                                            it done before adding class.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                                            <p className="mb-3 text-sm font-semibold text-gray-800">
                                                Section Cards
                                            </p>
                                            {renderSectionCardList(
                                                "reviewDone",
                                                5,
                                                false,
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {renderActiveSectionSummaryPanel()}

                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIsSummaryModalOpen(
                                                            true,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                                                >
                                                    Open Summary Modal
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        markActiveSectionDone(
                                                            "reviewDone",
                                                        )
                                                    }
                                                    disabled={
                                                        !activeQueuedSection
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                                                >
                                                    <Check size={13} /> Done for
                                                    This Section
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isEditMode && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Color Theme
                                        </label>
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                            {COLOR_OPTIONS.map((color) => (
                                                <label
                                                    key={color.name}
                                                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition hover:border-indigo-400 ${
                                                        data.color ===
                                                        color.name
                                                            ? "border-indigo-500 bg-indigo-50"
                                                            : "border-gray-200"
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-flex items-center gap-2 capitalize ${color.text}`}
                                                    >
                                                        <span
                                                            className={`h-4 w-4 rounded-full ${color.bg}`}
                                                        ></span>
                                                        {color.name}
                                                    </span>
                                                    <input
                                                        type="radio"
                                                        name="color"
                                                        value={color.name}
                                                        checked={
                                                            data.color ===
                                                            color.name
                                                        }
                                                        onChange={handleChange}
                                                        className="h-4 w-4 accent-indigo-600"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {!isEditMode && (
                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                            <p className="text-sm font-semibold text-gray-800">
                                                Create Summary
                                            </p>
                                            <div className="mt-2 grid gap-2 text-xs text-gray-700 sm:grid-cols-2">
                                                <p>
                                                    Grade Level:{" "}
                                                    {data.grade_level || "-"}
                                                </p>
                                                <p>
                                                    Section:{" "}
                                                    {data.section || "-"}
                                                </p>
                                                <p>
                                                    Subject:{" "}
                                                    {data.subject_name || "-"}
                                                </p>
                                                <p>
                                                    Strand: {data.strand || "-"}
                                                </p>
                                                <p>
                                                    Queued students:{" "}
                                                    {manualStudents.length}
                                                </p>
                                                <p>
                                                    Classlist file:{" "}
                                                    {data.classlist?.name ||
                                                        "None"}
                                                </p>
                                                <p>
                                                    Color:{" "}
                                                    {selectedColor?.name ||
                                                        "indigo"}
                                                </p>
                                                <p>
                                                    School year:{" "}
                                                    {data.school_year || "-"}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {!isEditMode && isSummaryModalOpen && (
                                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                                    <div
                                        className="absolute inset-0 bg-slate-950/45"
                                        onClick={() =>
                                            setIsSummaryModalOpen(false)
                                        }
                                    />
                                    <div className="relative z-10 max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl">
                                        <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 text-white">
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Section Review Summary
                                                </p>
                                                <p className="text-xs text-blue-100">
                                                    Review queued sections and
                                                    close when done.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsSummaryModalOpen(false)
                                                }
                                                className="rounded-lg p-1.5 text-blue-100 transition-colors hover:bg-white/15 hover:text-white"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div className="max-h-[calc(85vh-4rem)] overflow-y-auto bg-blue-50/40 p-4">
                                            <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                                    <p className="mb-3 text-sm font-semibold text-gray-800">
                                                        Section Cards
                                                    </p>
                                                    {renderSectionCardList(
                                                        "reviewDone",
                                                        5,
                                                        false,
                                                    )}
                                                </div>

                                                <div>
                                                    {renderActiveSectionSummaryPanel()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-sm text-blue-700">
                                    <strong>Note:</strong> Only existing students can be added to the class by searching their LRN. Teachers cannot create new student accounts.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="shrink-0 border-t border-blue-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
                            <div className="space-y-2">
                                {errors.class_duplicate && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                        <p className="font-semibold">
                                            Duplicate class detected
                                        </p>
                                        <p className="mt-1">
                                            {errors.class_duplicate}
                                        </p>
                                    </div>
                                )}
                                {(errors.grade_level ||
                                    errors.section ||
                                    errors.subject_name ||
                                    errors.color ||
                                    errors.school_year ||
                                    errors.strand ||
                                    errors.specialization ||
                                    errors.manual_students ||
                                    errors.class_duplicate) && (
                                    <div className="text-sm text-red-600">
                                        Please fix the highlighted errors before
                                        submitting.
                                    </div>
                                )}
                                {progress && (
                                    <div className="text-sm text-gray-600">
                                        Uploading… {progress.percentage}%
                                    </div>
                                )}
                                <div
                                    className={`flex items-center gap-3 ${
                                        isEditMode
                                            ? "justify-end"
                                            : "justify-between"
                                    }`}
                                >
                                    {isEditMode ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                                                disabled={
                                                    processing ||
                                                    !canContinueStepOne ||
                                                    !canContinueStepTwo
                                                }
                                            >
                                                {processing
                                                    ? "Saving..."
                                                    : "Save Changes"}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={
                                                    step === 1
                                                        ? handleClose
                                                        : () =>
                                                              setStep(
                                                                  (current) =>
                                                                      Math.max(
                                                                          current -
                                                                              1,
                                                                          1,
                                                                      ),
                                                              )
                                                }
                                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                                            >
                                                <ChevronLeft size={13} />
                                                {step === 1 ? "Cancel" : "Back"}
                                            </button>

                                            {step < 5 ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setStep((current) =>
                                                            Math.min(
                                                                current + 1,
                                                                5,
                                                            ),
                                                        )
                                                    }
                                                    disabled={
                                                        (step === 1 &&
                                                            !canContinueStepOne) ||
                                                        (step === 2 &&
                                                            !canContinueStepTwo) ||
                                                        (step === 3 &&
                                                            !canContinueStepThree) ||
                                                        (step === 4 &&
                                                            !canContinueStepFour)
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                                                >
                                                    Next
                                                    <ChevronRight size={13} />
                                                </button>
                                            ) : (
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                                                    disabled={
                                                        processing ||
                                                        !canContinueStepOne ||
                                                        !canContinueStepTwo ||
                                                        !canContinueStepThree ||
                                                        !canContinueStepFour ||
                                                        !canSubmitStepFive
                                                    }
                                                >
                                                    {processing
                                                        ? "Creating..."
                                                        : "Create Class"}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddNewClassModal;

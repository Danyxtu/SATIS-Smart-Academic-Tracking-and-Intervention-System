import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    FileText,
    Plus,
    Trash2,
    Upload,
    Users,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

const GRADE_LEVEL_OPTIONS = ["Grade 11", "Grade 12"];

const WIZARD_STEPS = [
    { id: 1, title: "Subject" },
    { id: 2, title: "Section and Students" },
    { id: 3, title: "Color and Save" },
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

const normalizeSearchValue = (value) =>
    String(value ?? "")
        .toLowerCase()
        .trim();

const StepBadge = ({ step, currentStep }) => {
    const isActive = currentStep === step.id;
    const isDone = currentStep > step.id;

    return (
        <div className="flex items-center gap-2">
            <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                        ? "bg-emerald-600 text-white"
                        : isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-600"
                }`}
            >
                {isDone ? <CheckCircle2 size={13} /> : step.id}
            </div>
            <span
                className={`text-xs font-semibold ${
                    isActive ? "text-indigo-700" : "text-gray-500"
                }`}
            >
                {step.title}
            </span>
        </div>
    );
};

const AddNewClassModal = ({
    onClose,
    defaultSchoolYear,
    currentSemester = 1,
    initialFile = null,
    mode = "create",
    classData = null,
    departments = [],
    availableSubjects = [],
    availableSections = [],
}) => {
    const isEditMode = mode === "edit";
    const [step, setStep] = useState(1);
    const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false);
    const [isDepartmentMenuOpen, setIsDepartmentMenuOpen] = useState(false);
    const [sectionMode, setSectionMode] = useState("existing");
    const [selectedExistingSectionId, setSelectedExistingSectionId] =
        useState(null);
    const [existingSectionQuery, setExistingSectionQuery] = useState("");
    const [isStepThreeSubmitReady, setIsStepThreeSubmitReady] = useState(false);
    const [manualStudents, setManualStudents] = useState([]);
    const [studentDraft, setStudentDraft] = useState({
        student_name: "",
        lrn: "",
        personal_email: "",
    });
    const [studentDraftError, setStudentDraftError] = useState("");
    const [bulkRows, setBulkRows] = useState("");
    const [bulkErrors, setBulkErrors] = useState([]);

    const { data, setData, post, put, processing, errors, reset, progress } =
        useForm({
            grade_level: classData?.name ?? "",
            section: parseSectionSuffix(classData?.section, classData?.strand),
            subject_name: classData?.subject_name ?? classData?.subject ?? "",
            color: classData?.color ?? "indigo",
            school_year: classData?.school_year ?? defaultSchoolYear,
            strand: classData?.strand ?? "",
            track: classData?.track ?? "",
            classlist: null,
            manual_students: [],
        });

    const departmentOptions = useMemo(() => {
        return departments
            .map((department) => ({
                department_code: normalizeDepartmentCode(
                    department?.department_code,
                ),
                department_name: String(
                    department?.department_name ?? "",
                ).trim(),
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
                    section?.strand ?? section?.department_code,
                );
                const sectionSource =
                    section?.section_code ?? section?.section_name ?? "";
                const sectionName = sanitizeSectionName(
                    parseSectionSuffix(sectionSource, strand),
                );

                return {
                    id: section?.id ?? `section-${index}`,
                    key: `${section?.id ?? `section-${index}`}::${strand}::${sectionName}`,
                    strand,
                    section: sectionName,
                    grade_level: String(section?.grade_level ?? "").trim(),
                    track: String(section?.track ?? "").trim(),
                    section_label: String(
                        section?.section_name ?? section?.section_code ?? "",
                    ).trim(),
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
            return departmentOptions.slice(0, 20);
        }

        return departmentOptions
            .filter((department) => {
                const code = normalizeSearchValue(department.department_code);
                const name = normalizeSearchValue(department.department_name);

                return code.includes(query) || name.includes(query);
            })
            .slice(0, 20);
    }, [data.strand, departmentOptions]);

    const selectedDepartment = useMemo(
        () =>
            departmentOptions.find(
                (department) => department.department_code === normalizedStrand,
            ) ?? null,
        [departmentOptions, normalizedStrand],
    );

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
                    section.section_label,
                );
                const gradeLevel = normalizeSearchValue(section.grade_level);
                const sectionName = normalizeSearchValue(section.section);
                const track = normalizeSearchValue(section.track);

                return (
                    sectionLabel.includes(query) ||
                    gradeLevel.includes(query) ||
                    sectionName.includes(query) ||
                    track.includes(query)
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
        const hasBasicSectionDetails =
            data.grade_level && data.section && hasValidStrand;

        if (sectionMode === "existing") {
            return Boolean(selectedExistingSectionId && hasBasicSectionDetails);
        }

        return Boolean(hasBasicSectionDetails);
    }, [
        data.grade_level,
        data.section,
        hasValidStrand,
        sectionMode,
        selectedExistingSectionId,
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

    const resetWizardState = () => {
        setStep(1);
        setIsSubjectMenuOpen(false);
        setIsDepartmentMenuOpen(false);
        setSectionMode("existing");
        setSelectedExistingSectionId(null);
        setExistingSectionQuery("");
        setIsStepThreeSubmitReady(false);
        setManualStudents([]);
        setStudentDraft({
            student_name: "",
            lrn: "",
            personal_email: "",
        });
        setStudentDraftError("");
        setBulkRows("");
        setBulkErrors([]);
    };

    useEffect(() => {
        if (isEditMode && classData) {
            resetWizardState();
            setData({
                grade_level: classData?.name ?? "",
                section: sanitizeSectionName(
                    parseSectionSuffix(classData?.section, classData?.strand),
                ),
                subject_name:
                    classData?.subject_name ?? classData?.subject ?? "",
                color: classData?.color ?? "indigo",
                school_year: classData?.school_year ?? defaultSchoolYear,
                strand: normalizeDepartmentCode(classData?.strand),
                track: classData?.track ?? "",
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
            track: "",
            classlist: null,
            manual_students: [],
        });
    }, [defaultSchoolYear, isEditMode, classData]);

    useEffect(() => {
        if (!isEditMode && initialFile) {
            setData("classlist", initialFile);
        }
    }, [initialFile, isEditMode]);

    useEffect(() => {
        if (isEditMode) {
            setIsStepThreeSubmitReady(true);
            return;
        }

        if (step !== 3) {
            setIsStepThreeSubmitReady(false);
            return;
        }

        const animationFrameId = window.requestAnimationFrame(() => {
            setIsStepThreeSubmitReady(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [isEditMode, step]);

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
        setData("manual_students", manualStudents);
    }, [manualStudents, setData]);

    const handleClose = () => {
        reset();
        resetWizardState();

        if (!isEditMode) {
            setData({
                grade_level: "",
                section: "",
                subject_name: "",
                color: "indigo",
                school_year: defaultSchoolYear,
                strand: "",
                track: "",
                classlist: null,
                manual_students: [],
            });
        }

        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

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

        setData(name, value);
    };

    const handleSubjectSelect = (subjectName) => {
        setData("subject_name", subjectName);
        setIsSubjectMenuOpen(false);
    };

    const handleDepartmentSelect = (departmentCode) => {
        const normalizedCode = normalizeDepartmentCode(departmentCode);

        setData("strand", normalizedCode);
        setIsDepartmentMenuOpen(false);

        if (sectionMode === "existing") {
            setSelectedExistingSectionId(null);
            setData("grade_level", "");
            setData("section", "");
        }
    };

    const handleSectionModeChange = (mode) => {
        setSectionMode(mode);

        if (mode === "manual") {
            setSelectedExistingSectionId(null);
            setData("grade_level", "");
            setData("section", "");
            return;
        }

        setData("grade_level", "");
        setData("section", "");
    };

    const handleExistingSectionSelect = (section) => {
        setSectionMode("existing");
        setSelectedExistingSectionId(section.id);
        setData("strand", section.strand);
        setData("grade_level", section.grade_level);
        setData("section", section.section);

        if (!data.track && section.track) {
            setData("track", section.track);
        }
    };

    const handleFileChange = (file) => {
        setData("classlist", file || null);
    };

    const addSingleStudent = () => {
        const name = String(studentDraft.student_name ?? "")
            .replace(/\s+/g, " ")
            .trim();
        const lrn = sanitizeLrn(studentDraft.lrn);
        const personalEmail = String(studentDraft.personal_email ?? "")
            .trim()
            .toLowerCase();

        if (!name || !lrn) {
            setStudentDraftError("Student name and LRN are required.");
            return;
        }

        if (lrn.length !== 12) {
            setStudentDraftError("LRN must be exactly 12 digits.");
            return;
        }

        if (manualStudents.some((student) => student.lrn === lrn)) {
            setStudentDraftError("This LRN is already in the queue.");
            return;
        }

        setManualStudents((prev) => [
            ...prev,
            {
                student_name: name,
                lrn,
                personal_email: personalEmail || null,
            },
        ]);

        setStudentDraft({
            student_name: "",
            lrn: "",
            personal_email: "",
        });
        setStudentDraftError("");
    };

    const addBulkStudents = () => {
        const lines = bulkRows
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line !== "");

        if (lines.length === 0) {
            setBulkErrors(["Paste at least one line before bulk queue."]);
            return;
        }

        const errorsFromBulk = [];
        const seenLrns = new Set(manualStudents.map((student) => student.lrn));
        const queued = [];

        lines.forEach((line, lineIndex) => {
            const parts = line.split(",").map((item) => item.trim());

            if (parts.length < 2) {
                errorsFromBulk.push(
                    `Line ${lineIndex + 1}: Use student_name,lrn,email(optional).`,
                );
                return;
            }

            const name = parts[0]?.replace(/\s+/g, " ").trim();
            const lrn = sanitizeLrn(parts[1]);
            const personalEmail = (parts[2] ?? "").trim().toLowerCase();

            if (!name || !lrn) {
                errorsFromBulk.push(
                    `Line ${lineIndex + 1}: Missing student name or LRN.`,
                );
                return;
            }

            if (lrn.length !== 12) {
                errorsFromBulk.push(
                    `Line ${lineIndex + 1}: LRN must be exactly 12 digits.`,
                );
                return;
            }

            if (seenLrns.has(lrn)) {
                errorsFromBulk.push(
                    `Line ${lineIndex + 1}: Duplicate LRN ${lrn} skipped.`,
                );
                return;
            }

            seenLrns.add(lrn);
            queued.push({
                student_name: name,
                lrn,
                personal_email: personalEmail || null,
            });
        });

        if (queued.length > 0) {
            setManualStudents((prev) => [...prev, ...queued]);
            setBulkRows("");
        }

        setBulkErrors(errorsFromBulk);
    };

    const removeQueuedStudent = (index) => {
        setManualStudents((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!isEditMode && (!isStepThreeSubmitReady || step !== 3)) {
            return;
        }

        if (isEditMode && classData?.id) {
            put(route("teacher.classes.update", classData.id), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: () => {
                    handleClose();
                },
            });
            return;
        }

        post(route("teacher.classes.store"), {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => {
                handleClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-1 flex-col overflow-hidden"
                >
                    {/* Modal Header */}
                    <div className="flex justify-between items-center p-6 border-b">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {isEditMode ? "Edit Class" : "Add New Class"}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Showing subjects for{" "}
                                <span className="font-semibold text-indigo-600">
                                    Semester {currentSemester}
                                </span>
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="z-10 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {!isEditMode && (
                        <div className="border-b px-6 py-3 bg-gray-50">
                            <div className="flex items-center justify-between gap-3">
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
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        {(isEditMode || step === 1) && (
                            <div className="space-y-4">
                                {!isEditMode && (
                                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-indigo-800">
                                            Step 1: Subject Selection
                                        </p>
                                        <p className="mt-1 text-xs text-indigo-700">
                                            Pick or type the subject first, then
                                            continue to section setup.
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
                                                    setIsSubjectMenuOpen(true)
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
                                                subjectOptions.length > 0 && (
                                                    <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                                        {filteredSubjects.length ===
                                                        0 ? (
                                                            <p className="px-3 py-2 text-sm text-gray-500">
                                                                No matching
                                                                subjects.
                                                            </p>
                                                        ) : (
                                                            filteredSubjects.map(
                                                                (subject) => (
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
                                                No subjects found in the system
                                                yet. You may enter one manually.
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
                                            Step 2: Section Setup and Student
                                            Queue
                                        </p>
                                        <p className="mt-1 text-xs text-indigo-700">
                                            First select an existing section. If
                                            none fits, switch to manual section
                                            details and continue below.
                                        </p>
                                    </div>
                                )}

                                <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Strand (Department Code)
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
                                            Strand is the department code. New
                                            sections created here are linked to
                                            that department.
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

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSectionModeChange(
                                                    "existing",
                                                )
                                            }
                                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                                sectionMode === "existing"
                                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            1. Select Existing Section
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSectionModeChange(
                                                    "manual",
                                                )
                                            }
                                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                                sectionMode === "manual"
                                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            2. Create New Section
                                        </button>
                                    </div>

                                    {sectionMode === "existing" ? (
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
                                                placeholder="Filter section by name, grade level, or track"
                                            />

                                            {!hasValidStrand ? (
                                                <p className="text-xs text-amber-700">
                                                    Enter a valid strand
                                                    department code first.
                                                </p>
                                            ) : filteredExistingSections.length ===
                                              0 ? (
                                                <p className="text-xs text-gray-500">
                                                    No existing section matched
                                                    this strand. Switch to
                                                    Create New Section.
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
                                                                    {
                                                                        section.grade_level
                                                                    }
                                                                    {" - "}
                                                                    {
                                                                        section.section_label
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Section key:{" "}
                                                                    {
                                                                        section.strand
                                                                    }
                                                                    -
                                                                    {
                                                                        section.section
                                                                    }
                                                                    {section.track
                                                                        ? ` • Track: ${section.track}`
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
                                    ) : (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Grade Level
                                                </label>
                                                <select
                                                    name="grade_level"
                                                    required
                                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    value={data.grade_level}
                                                    onChange={handleChange}
                                                >
                                                    <option value="" disabled>
                                                        Select Grade Level
                                                    </option>
                                                    {GRADE_LEVEL_OPTIONS.map(
                                                        (option) => (
                                                            <option
                                                                key={option}
                                                                value={option}
                                                            >
                                                                {option}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                {errors.grade_level && (
                                                    <p className="text-sm text-red-600 mt-1">
                                                        {errors.grade_level}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Section Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="section"
                                                    required
                                                    value={data.section}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    placeholder="e.g., A"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Letters only. The system
                                                    saves section as
                                                    strand-section (example:
                                                    STEM-A).
                                                </p>
                                                {errors.section && (
                                                    <p className="text-sm text-red-600 mt-1">
                                                        {errors.section}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {sectionMode === "existing" &&
                                        selectedExistingSection && (
                                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                                                Selected section:{" "}
                                                {
                                                    selectedExistingSection.grade_level
                                                }
                                                {" - "}
                                                {
                                                    selectedExistingSection.section_label
                                                }
                                            </div>
                                        )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Track (optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="track"
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                            value={data.track}
                                            onChange={handleChange}
                                            placeholder="e.g., Academic"
                                        />
                                        {errors.track && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {errors.track}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {!isEditMode && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Bulk Upload Classlist (CSV or
                                                Excel)
                                            </label>
                                            {data.classlist ? (
                                                <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                        <FileText
                                                            size={18}
                                                            className="text-gray-500"
                                                        />
                                                        {data.classlist.name}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleFileChange(
                                                                null,
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 px-6 py-7 text-center text-sm text-gray-500 transition hover:border-indigo-400 hover:bg-indigo-50">
                                                    <input
                                                        type="file"
                                                        name="file"
                                                        className="hidden"
                                                        accept=".csv,text/csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                                        onChange={(e) =>
                                                            handleFileChange(
                                                                e.target
                                                                    .files[0],
                                                            )
                                                        }
                                                    />
                                                    <Upload
                                                        size={26}
                                                        className="text-indigo-400"
                                                    />
                                                    <span className="mt-2 font-semibold text-gray-700">
                                                        Drop classlist or click
                                                        to browse
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        CSV, XLS, XLSX up to 4MB
                                                    </span>
                                                </label>
                                            )}
                                            {errors.classlist && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    {errors.classlist}
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-gray-200 p-4">
                                            <p className="text-sm font-semibold text-gray-800">
                                                Add Student One-by-One
                                            </p>
                                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                                <input
                                                    type="text"
                                                    value={
                                                        studentDraft.student_name
                                                    }
                                                    onChange={(event) =>
                                                        setStudentDraft(
                                                            (prev) => ({
                                                                ...prev,
                                                                student_name:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    placeholder="Student name"
                                                    className="rounded-lg border-gray-300 text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    value={studentDraft.lrn}
                                                    onChange={(event) =>
                                                        setStudentDraft(
                                                            (prev) => ({
                                                                ...prev,
                                                                lrn: sanitizeLrn(
                                                                    event.target
                                                                        .value,
                                                                ),
                                                            }),
                                                        )
                                                    }
                                                    placeholder="LRN (12 digits)"
                                                    className="rounded-lg border-gray-300 text-sm"
                                                    maxLength={12}
                                                />
                                                <input
                                                    type="email"
                                                    value={
                                                        studentDraft.personal_email
                                                    }
                                                    onChange={(event) =>
                                                        setStudentDraft(
                                                            (prev) => ({
                                                                ...prev,
                                                                personal_email:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    placeholder="Personal email (optional)"
                                                    className="rounded-lg border-gray-300 text-sm"
                                                />
                                            </div>
                                            {studentDraftError && (
                                                <p className="mt-2 text-xs text-red-600">
                                                    {studentDraftError}
                                                </p>
                                            )}
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={addSingleStudent}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                                >
                                                    <Plus size={14} /> Queue
                                                    Student
                                                </button>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-gray-200 p-4">
                                            <p className="text-sm font-semibold text-gray-800">
                                                Bulk Queue by Text
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                One line per student:
                                                student_name,lrn,email(optional)
                                            </p>
                                            <textarea
                                                value={bulkRows}
                                                onChange={(event) =>
                                                    setBulkRows(
                                                        event.target.value,
                                                    )
                                                }
                                                rows={4}
                                                className="mt-2 w-full rounded-lg border-gray-300 text-sm"
                                                placeholder="Juan Dela Cruz,123456789012,juan@email.com"
                                            />
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={addBulkStudents}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                                                >
                                                    <Upload size={14} /> Bulk
                                                    Queue
                                                </button>
                                            </div>
                                            {bulkErrors.length > 0 && (
                                                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                                    <div className="space-y-1 text-xs text-amber-700">
                                                        {bulkErrors.map(
                                                            (error) => (
                                                                <p key={error}>
                                                                    - {error}
                                                                </p>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <p className="text-sm font-semibold text-indigo-800">
                                                    Queued Students
                                                </p>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                                    <Users size={12} />
                                                    {manualStudents.length}
                                                </span>
                                            </div>
                                            {manualStudents.length === 0 ? (
                                                <p className="text-xs text-indigo-700">
                                                    No manually queued students
                                                    yet.
                                                </p>
                                            ) : (
                                                <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                                                    {manualStudents.map(
                                                        (student, index) => (
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
                                    </>
                                )}
                            </div>
                        )}

                        {(isEditMode || step === 3) && (
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
                                                    data.color === color.name
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
                                                Section: {data.section || "-"}
                                            </p>
                                            <p>
                                                Subject:{" "}
                                                {data.subject_name || "-"}
                                            </p>
                                            <p>Strand: {data.strand || "-"}</p>
                                            <p>
                                                Queued students:{" "}
                                                {manualStudents.length}
                                            </p>
                                            <p>
                                                Classlist file:{" "}
                                                {data.classlist?.name || "None"}
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

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-sm text-blue-700">
                                <strong>Note:</strong> Student accounts are
                                created only when LRN is new. Existing LRNs are
                                matched and assigned to this class.
                            </p>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex flex-col space-y-2 p-6 border-t bg-gray-50">
                        {(errors.grade_level ||
                            errors.section ||
                            errors.subject_name ||
                            errors.color ||
                            errors.school_year ||
                            errors.strand ||
                            errors.track ||
                            errors.manual_students) && (
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
                        <div className="flex items-center justify-end gap-3">
                            {isEditMode ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
                                                      setStep((current) =>
                                                          Math.max(
                                                              current - 1,
                                                              1,
                                                          ),
                                                      )
                                        }
                                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        <ChevronLeft size={14} />
                                        {step === 1 ? "Cancel" : "Back"}
                                    </button>

                                    {step < 3 ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setStep((current) =>
                                                    Math.min(current + 1, 3),
                                                )
                                            }
                                            disabled={
                                                (step === 1 &&
                                                    !canContinueStepOne) ||
                                                (step === 2 &&
                                                    !canContinueStepTwo)
                                            }
                                            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            Next
                                            <ChevronRight size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                            disabled={
                                                processing ||
                                                !canContinueStepOne ||
                                                !canContinueStepTwo ||
                                                !data.color ||
                                                !isStepThreeSubmitReady
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
                </form>
            </div>
        </div>
    );
};

export default AddNewClassModal;

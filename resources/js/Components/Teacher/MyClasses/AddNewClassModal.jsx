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
    { id: 1, title: "Class Info" },
    { id: 2, title: "Students" },
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
}) => {
    const isEditMode = mode === "edit";
    const [step, setStep] = useState(1);
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

    const canContinueStepOne = useMemo(() => {
        return Boolean(
            data.grade_level &&
            data.section &&
            data.subject_name &&
            data.school_year &&
            data.strand,
        );
    }, [
        data.grade_level,
        data.section,
        data.subject_name,
        data.school_year,
        data.strand,
    ]);

    const selectedColor = useMemo(() => {
        return COLOR_OPTIONS.find((item) => item.name === data.color);
    }, [data.color]);

    const resetWizardState = () => {
        setStep(1);
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
                section: parseSectionSuffix(
                    classData?.section,
                    classData?.strand,
                ),
                subject_name:
                    classData?.subject_name ?? classData?.subject ?? "",
                color: classData?.color ?? "indigo",
                school_year: classData?.school_year ?? defaultSchoolYear,
                strand: classData?.strand ?? "",
                track: classData?.track ?? "",
                classlist: null,
                manual_students: [],
            });
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
            setStep(2);
        }
    }, [initialFile, isEditMode]);

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
            setData("section", value.toUpperCase().replace(/[^A-Z]/g, ""));
            return;
        }
        setData(name, value);
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
                            <>
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
                                            Section Letter
                                        </label>
                                        <input
                                            type="text"
                                            name="section"
                                            required
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                            value={data.section}
                                            onChange={handleChange}
                                            placeholder="e.g., A"
                                            maxLength={5}
                                        />
                                        {errors.section && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {errors.section}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            name="subject_name"
                                            required
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                            value={data.subject_name}
                                            onChange={handleChange}
                                            placeholder="e.g., General Mathematics"
                                        />
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

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Strand (Department Code)
                                        </label>
                                        <select
                                            name="strand"
                                            required
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                            value={data.strand}
                                            onChange={handleChange}
                                        >
                                            <option value="" disabled>
                                                Select Department Code
                                            </option>
                                            {departments.map((dept) => (
                                                <option
                                                    key={dept.department_code}
                                                    value={dept.department_code}
                                                >
                                                    {dept.department_code} -{" "}
                                                    {dept.department_name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.strand && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {errors.strand}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Track
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
                            </>
                        )}

                        {!isEditMode && step === 2 && (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Bulk Upload Classlist (CSV or Excel)
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
                                                    handleFileChange(null)
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
                                                        e.target.files[0],
                                                    )
                                                }
                                            />
                                            <Upload
                                                size={26}
                                                className="text-indigo-400"
                                            />
                                            <span className="mt-2 font-semibold text-gray-700">
                                                Drop classlist or click to
                                                browse
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
                                            value={studentDraft.student_name}
                                            onChange={(event) =>
                                                setStudentDraft((prev) => ({
                                                    ...prev,
                                                    student_name:
                                                        event.target.value,
                                                }))
                                            }
                                            placeholder="Student name"
                                            className="rounded-lg border-gray-300 text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={studentDraft.lrn}
                                            onChange={(event) =>
                                                setStudentDraft((prev) => ({
                                                    ...prev,
                                                    lrn: sanitizeLrn(
                                                        event.target.value,
                                                    ),
                                                }))
                                            }
                                            placeholder="LRN (12 digits)"
                                            className="rounded-lg border-gray-300 text-sm"
                                            maxLength={12}
                                        />
                                        <input
                                            type="email"
                                            value={studentDraft.personal_email}
                                            onChange={(event) =>
                                                setStudentDraft((prev) => ({
                                                    ...prev,
                                                    personal_email:
                                                        event.target.value,
                                                }))
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
                                            <Plus size={14} /> Queue Student
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
                                            setBulkRows(event.target.value)
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
                                            <Upload size={14} /> Bulk Queue
                                        </button>
                                    </div>
                                    {bulkErrors.length > 0 && (
                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                            <div className="space-y-1 text-xs text-amber-700">
                                                {bulkErrors.map((error) => (
                                                    <p key={error}>- {error}</p>
                                                ))}
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
                                            No manually queued students yet.
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
                                                                {student.lrn}
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
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
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
                                            !data.grade_level ||
                                            !data.section ||
                                            !data.subject_name ||
                                            !data.strand
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
                                                step === 1 &&
                                                !canContinueStepOne
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
                                                !data.color
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

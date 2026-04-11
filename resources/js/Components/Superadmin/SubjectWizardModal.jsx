import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    ClipboardList,
    Layers,
    ListChecks,
    Plus,
    Sparkles,
    X,
    ChevronRight,
    ChevronLeft,
    Trash2,
} from "lucide-react";

const STEP_SELECT_TYPE = 1;
const STEP_QUEUE_SUBJECTS = 2;
const STEP_SUMMARY = 3;
const DEFAULT_SEMESTER_OPTIONS = ["1", "2"];
const DEFAULT_GRADE_LEVEL_OPTIONS = ["Grade 11", "Grade 12"];

const initialDraft = {
    subject_name: "",
    subject_code: "",
    total_hours: "",
};

function toTypeLabelMap(typeOptions = []) {
    return typeOptions.reduce((acc, option) => {
        if (option?.key) {
            acc[option.key] = option.label ?? option.key;
        }

        return acc;
    }, {});
}

function getResolvedTypeKey(baseType, specializedTrack) {
    if (baseType !== "specialized") {
        return baseType;
    }

    return specializedTrack === "tvl"
        ? "specialized_tvl"
        : "specialized_academic";
}

function toSemesterLabel(semester) {
    if (String(semester) === "1") {
        return "1st Semester";
    }

    if (String(semester) === "2") {
        return "2nd Semester";
    }

    return "Selected Semester";
}

export default function SubjectWizardModal({
    isOpen,
    onClose,
    onSubmit,
    processing,
    errors = {},
    typeOptions = [],
    semesterOptions = DEFAULT_SEMESTER_OPTIONS,
    gradeLevelOptions = DEFAULT_GRADE_LEVEL_OPTIONS,
}) {
    const [step, setStep] = useState(STEP_SELECT_TYPE);
    const [semester, setSemester] = useState("");
    const [gradeLevel, setGradeLevel] = useState("");
    const [baseType, setBaseType] = useState("core");
    const [specializedTrack, setSpecializedTrack] = useState("academic");
    const [draft, setDraft] = useState(initialDraft);
    const [draftErrors, setDraftErrors] = useState({});
    const [queue, setQueue] = useState([]);

    const typeLabelMap = useMemo(
        () => toTypeLabelMap(typeOptions),
        [typeOptions],
    );

    const resolvedTypeKey = useMemo(
        () => getResolvedTypeKey(baseType, specializedTrack),
        [baseType, specializedTrack],
    );

    const resolvedTypeLabel =
        typeLabelMap[resolvedTypeKey] || "Selected Subject Type";

    const selectedSemesterLabel = semester
        ? toSemesterLabel(semester)
        : "the selected semester";

    const subjectTypeExample =
        baseType === "specialized" ? "specialized" : baseType;

    const serverErrorList = useMemo(() => {
        if (!errors || typeof errors !== "object") {
            return [];
        }

        return Object.values(errors).filter(Boolean);
    }, [errors]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setStep(STEP_SELECT_TYPE);
        setSemester("");
        setGradeLevel("");
        setBaseType("core");
        setSpecializedTrack("academic");
        setDraft(initialDraft);
        setDraftErrors({});
        setQueue([]);
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const validateDraft = () => {
        const nextErrors = {};
        const subjectName = draft.subject_name.trim();
        const subjectCode = draft.subject_code.trim().toUpperCase();
        const totalHours = Number.parseInt(String(draft.total_hours), 10);

        if (!subjectName) {
            nextErrors.subject_name = "Subject name is required.";
        }

        if (!subjectCode) {
            nextErrors.subject_code = "Subject code is required.";
        }

        if (!Number.isInteger(totalHours) || totalHours <= 0) {
            nextErrors.total_hours = "Hours must be a positive whole number.";
        }

        if (
            queue.some(
                (item) =>
                    item.subject_code.toLowerCase() ===
                    subjectCode.toLowerCase(),
            )
        ) {
            nextErrors.subject_code =
                "This subject code already exists in the queue.";
        }

        if (
            queue.some(
                (item) =>
                    item.subject_name.toLowerCase() ===
                    subjectName.toLowerCase(),
            )
        ) {
            nextErrors.subject_name =
                "This subject name already exists in the queue.";
        }

        setDraftErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return null;
        }

        return {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            subject_name: subjectName,
            subject_code: subjectCode,
            total_hours: totalHours,
        };
    };

    const handleAddSubject = () => {
        const nextItem = validateDraft();

        if (!nextItem) {
            return;
        }

        setQueue((prev) => [...prev, nextItem]);
        setDraft(initialDraft);
        setDraftErrors({});
    };

    const handleRemoveSubject = (id) => {
        setQueue((prev) => prev.filter((item) => item.id !== id));
    };

    const handleQueueFormSubmit = (event) => {
        event.preventDefault();
        handleAddSubject();
    };

    const handleSubmit = () => {
        if (queue.length === 0 || processing) {
            return;
        }

        onSubmit({
            type_key: resolvedTypeKey,
            semester,
            grade_level: gradeLevel,
            subjects: queue.map(
                ({ subject_name, subject_code, total_hours }) => ({
                    subject_name,
                    subject_code,
                    total_hours,
                }),
            ),
        });
    };

    const stepLabels = ["Type", "Queue", "Summary"];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-200">
                            <BookOpen size={16} className="text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                New Subject Wizard
                            </h2>
                            <p className="text-xs text-slate-500">
                                Step {step} of 3: {stepLabels[step - 1]}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="border-b border-slate-100 px-6 py-3">
                    <div className="flex items-center gap-2">
                        {stepLabels.map((label, index) => {
                            const current = index + 1;
                            const active = current === step;
                            const done = current < step;

                            return (
                                <div
                                    key={label}
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                        active
                                            ? "bg-emerald-100 text-emerald-700"
                                            : done
                                              ? "bg-slate-100 text-slate-600"
                                              : "bg-slate-50 text-slate-400"
                                    }`}
                                >
                                    <span>{current}</span>
                                    <span>{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                    {step === STEP_SELECT_TYPE && (
                        <div className="space-y-5">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    1) Choose Semester, Grade Level, and Subject
                                    Type
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    First pick 1st or 2nd semester, then Grade
                                    11 or Grade 12. After that, pick the subject
                                    classification. If you select specialized,
                                    choose whether it belongs to Academic Track
                                    or TVL Track.
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Semester
                                </p>
                                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                                    {(Array.isArray(semesterOptions) &&
                                    semesterOptions.length > 0
                                        ? semesterOptions
                                        : DEFAULT_SEMESTER_OPTIONS
                                    ).map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() =>
                                                setSemester(String(option))
                                            }
                                            className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                                                semester === String(option)
                                                    ? "border-emerald-400 bg-white text-emerald-700"
                                                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                                            }`}
                                        >
                                            {toSemesterLabel(option)}
                                        </button>
                                    ))}
                                </div>
                                {!semester && (
                                    <p className="mt-2 text-xs text-rose-600">
                                        Please select a semester before moving
                                        to the next step.
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Grade Level
                                </p>
                                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                                    {(Array.isArray(gradeLevelOptions) &&
                                    gradeLevelOptions.length > 0
                                        ? gradeLevelOptions
                                        : DEFAULT_GRADE_LEVEL_OPTIONS
                                    ).map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() =>
                                                setGradeLevel(option)
                                            }
                                            className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                                                gradeLevel === option
                                                    ? "border-emerald-400 bg-white text-emerald-700"
                                                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                                {!gradeLevel && (
                                    <p className="mt-2 text-xs text-rose-600">
                                        Please select a grade level before
                                        moving to the next step.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <button
                                    type="button"
                                    onClick={() => setBaseType("core")}
                                    className={`rounded-xl border p-4 text-left transition ${
                                        baseType === "core"
                                            ? "border-emerald-400 bg-emerald-50"
                                            : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Layers
                                            size={16}
                                            className="text-slate-700"
                                        />
                                        <p className="text-sm font-semibold text-slate-900">
                                            Core Subjects
                                        </p>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Foundational senior high school
                                        subjects.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setBaseType("applied")}
                                    className={`rounded-xl border p-4 text-left transition ${
                                        baseType === "applied"
                                            ? "border-emerald-400 bg-emerald-50"
                                            : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <ClipboardList
                                            size={16}
                                            className="text-slate-700"
                                        />
                                        <p className="text-sm font-semibold text-slate-900">
                                            Applied Subjects
                                        </p>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Contextualized and practical
                                        applications.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setBaseType("specialized")}
                                    className={`rounded-xl border p-4 text-left transition ${
                                        baseType === "specialized"
                                            ? "border-emerald-400 bg-emerald-50"
                                            : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Sparkles
                                            size={16}
                                            className="text-slate-700"
                                        />
                                        <p className="text-sm font-semibold text-slate-900">
                                            Specialized Subjects
                                        </p>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Strand or track-specific
                                        specializations.
                                    </p>
                                </button>
                            </div>

                            {baseType === "specialized" && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                        Specialized Track
                                    </p>
                                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSpecializedTrack("academic")
                                            }
                                            className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                                                specializedTrack === "academic"
                                                    ? "border-emerald-400 bg-white text-emerald-700"
                                                    : "border-amber-200 bg-white text-slate-700 hover:border-amber-300"
                                            }`}
                                        >
                                            Academic Track Specialized
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSpecializedTrack("tvl")
                                            }
                                            className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                                                specializedTrack === "tvl"
                                                    ? "border-emerald-400 bg-white text-emerald-700"
                                                    : "border-amber-200 bg-white text-slate-700 hover:border-amber-300"
                                            }`}
                                        >
                                            TVL Track Specialized
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === STEP_QUEUE_SUBJECTS && (
                        <div className="space-y-5">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    2) Add Subjects to Queue
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Add one or more{" "}
                                    {resolvedTypeLabel.toLowerCase()} for{" "}
                                    {selectedSemesterLabel},{" "}
                                    {gradeLevel || "the selected grade level"}.
                                    Example: CSS (160 hours), code ICT-CSS.
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Note: Add {resolvedTypeLabel.toLowerCase()}{" "}
                                    (e.g., {subjectTypeExample}) subjects to{" "}
                                    {selectedSemesterLabel.toLowerCase()} for{" "}
                                    {gradeLevel || "Grade 11 or Grade 12"}.
                                </p>
                            </div>

                            <form
                                onSubmit={handleQueueFormSubmit}
                                className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-12"
                            >
                                <div className="md:col-span-5">
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Subject Name
                                    </label>
                                    <input
                                        type="text"
                                        value={draft.subject_name}
                                        onChange={(event) =>
                                            setDraft((prev) => ({
                                                ...prev,
                                                subject_name:
                                                    event.target.value,
                                            }))
                                        }
                                        placeholder="e.g., Computer Systems Servicing"
                                        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition ${
                                            draftErrors.subject_name
                                                ? "border-rose-300 bg-rose-50"
                                                : "border-slate-300 bg-white focus:border-emerald-500"
                                        }`}
                                    />
                                    {draftErrors.subject_name && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {draftErrors.subject_name}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-3">
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Subject Code
                                    </label>
                                    <input
                                        type="text"
                                        value={draft.subject_code}
                                        onChange={(event) =>
                                            setDraft((prev) => ({
                                                ...prev,
                                                subject_code:
                                                    event.target.value.toUpperCase(),
                                            }))
                                        }
                                        placeholder="e.g., ICT-CSS"
                                        className={`w-full rounded-lg border px-3 py-2 font-mono text-sm text-slate-900 outline-none transition ${
                                            draftErrors.subject_code
                                                ? "border-rose-300 bg-rose-50"
                                                : "border-slate-300 bg-white focus:border-emerald-500"
                                        }`}
                                    />
                                    {draftErrors.subject_code && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {draftErrors.subject_code}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Hours
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={draft.total_hours}
                                        onChange={(event) =>
                                            setDraft((prev) => ({
                                                ...prev,
                                                total_hours: event.target.value,
                                            }))
                                        }
                                        placeholder="160"
                                        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition ${
                                            draftErrors.total_hours
                                                ? "border-rose-300 bg-rose-50"
                                                : "border-slate-300 bg-white focus:border-emerald-500"
                                        }`}
                                    />
                                    {draftErrors.total_hours && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {draftErrors.total_hours}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-end md:col-span-2">
                                    <button
                                        type="submit"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        <Plus size={14} /> Add
                                    </button>
                                </div>
                            </form>

                            <div className="rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-800">
                                        Queue ({queue.length})
                                    </p>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                        {resolvedTypeLabel}
                                    </span>
                                </div>

                                {queue.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                                        No subjects in queue yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {queue.map((item) => (
                                            <div
                                                key={item.id}
                                                className="grid grid-cols-12 items-center gap-3 px-4 py-3"
                                            >
                                                <div className="col-span-5">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {item.subject_name}
                                                    </p>
                                                </div>
                                                <div className="col-span-3">
                                                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                                                        {item.subject_code}
                                                    </span>
                                                </div>
                                                <div className="col-span-3 text-sm text-slate-600">
                                                    {item.total_hours} hours
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveSubject(
                                                                item.id,
                                                            )
                                                        }
                                                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === STEP_SUMMARY && (
                        <div className="space-y-5">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    3) Review and Submit
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Confirm queue details before creating these
                                    subjects.
                                </p>
                            </div>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                    Selected Type
                                </p>
                                <p className="mt-1 text-sm font-semibold text-emerald-800">
                                    {resolvedTypeLabel}
                                </p>
                                <p className="mt-1 text-xs font-medium text-emerald-700">
                                    Semester:{" "}
                                    {semester ? toSemesterLabel(semester) : "-"}
                                </p>
                                <p className="mt-1 text-xs font-medium text-emerald-700">
                                    Grade Level: {gradeLevel || "-"}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-800">
                                        Subject Summary
                                    </p>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                        <ListChecks size={12} />
                                        {queue.length} total
                                    </span>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {queue.map((item) => (
                                        <div
                                            key={item.id}
                                            className="grid grid-cols-12 items-center gap-3 px-4 py-3"
                                        >
                                            <p className="col-span-6 text-sm font-semibold text-slate-900">
                                                {item.subject_name}
                                            </p>
                                            <p className="col-span-3 font-mono text-xs font-semibold text-slate-600">
                                                {item.subject_code}
                                            </p>
                                            <p className="col-span-3 text-sm text-slate-600">
                                                {item.total_hours} hours
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {serverErrorList.length > 0 && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                                        Validation Errors
                                    </p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
                                        {serverErrorList.map((error, index) => (
                                            <li key={`${error}-${index}`}>
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={() =>
                            setStep((prev) =>
                                Math.max(STEP_SELECT_TYPE, prev - 1),
                            )
                        }
                        disabled={step === STEP_SELECT_TYPE || processing}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronLeft size={14} />
                        Back
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        {step < STEP_SUMMARY ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (
                                        step === STEP_QUEUE_SUBJECTS &&
                                        queue.length === 0
                                    ) {
                                        return;
                                    }
                                    setStep((prev) =>
                                        Math.min(STEP_SUMMARY, prev + 1),
                                    );
                                }}
                                disabled={
                                    processing ||
                                    (step === STEP_SELECT_TYPE && !semester) ||
                                    (step === STEP_SELECT_TYPE &&
                                        !gradeLevel) ||
                                    (step === STEP_QUEUE_SUBJECTS &&
                                        queue.length === 0)
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Next
                                <ChevronRight size={14} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing || queue.length === 0}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing && (
                                    <svg
                                        className="h-3.5 w-3.5 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8z"
                                        />
                                    </svg>
                                )}
                                Create Subjects
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Layers3,
    Plus,
    Save,
    School,
    Search,
    Trash2,
    Upload,
    UserCheck,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import showToast from "@/Utils/toast";

const STEPS = [
    {
        id: 1,
        title: "Section Information",
        description: "Set section, cohort, and academic details",
    },
    {
        id: 2,
        title: "Student Assignment",
        description: "Assign existing or create new students",
    },
    {
        id: 3,
        title: "Summary",
        description: "Review issues and save",
    },
];

function WizardStep({ step, currentStep }) {
    const isActive = currentStep === step.id;
    const isComplete = currentStep > step.id;

    return (
        <div className="flex items-center gap-2">
            <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isComplete
                        ? "bg-emerald-600 text-white"
                        : isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-600"
                }`}
            >
                {isComplete ? <CheckCircle2 size={14} /> : step.id}
            </div>
            <div className="hidden sm:block">
                <p
                    className={`text-xs font-semibold ${
                        isActive ? "text-indigo-700" : "text-slate-600"
                    }`}
                >
                    {step.title}
                </p>
                <p className="text-[11px] text-slate-500">{step.description}</p>
            </div>
        </div>
    );
}

function FieldError({ message }) {
    if (!message) return null;

    return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}

export default function Index({
    sections,
    availableStudents = [],
    teachers = [],
    currentSchoolYear,
    department,
    filters,
}) {
    const { flash } = usePage().props;

    const [search, setSearch] = useState(filters.search || "");

    const [showWizard, setShowWizard] = useState(false);
    const [step, setStep] = useState(1);
    const [wizardNotice, setWizardNotice] = useState("");

    const [existingSearch, setExistingSearch] = useState("");
    const [selectedExistingIds, setSelectedExistingIds] = useState([]);
    const [queuedExistingStudents, setQueuedExistingStudents] = useState([]);

    const [newStudentDraft, setNewStudentDraft] = useState({
        first_name: "",
        last_name: "",
        middle_name: "",
        lrn: "",
        personal_email: "",
    });
    const [newStudentsQueue, setNewStudentsQueue] = useState([]);
    const [bulkLines, setBulkLines] = useState("");
    const [bulkImportErrors, setBulkImportErrors] = useState([]);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            section_name: "",
            section_code: "",
            cohort: String(new Date().getFullYear()),
            grade_level: "",
            strand: department?.code || "",
            track: "Academic",
            school_year: currentSchoolYear || "",
            description: "",
            advisor_teacher_id: "",
            assigned_student_ids: [],
            new_students: [],
        });

    useEffect(() => {
        setData(
            "assigned_student_ids",
            queuedExistingStudents.map((student) => student.id),
        );
    }, [queuedExistingStudents, setData]);

    useEffect(() => {
        setData(
            "new_students",
            newStudentsQueue.map((student) => ({
                first_name: student.first_name,
                last_name: student.last_name,
                middle_name: student.middle_name || null,
                lrn: student.lrn,
                personal_email: student.personal_email || null,
            })),
        );
    }, [newStudentsQueue, setData]);

    const queuedExistingIdSet = useMemo(
        () => new Set(queuedExistingStudents.map((student) => student.id)),
        [queuedExistingStudents],
    );

    const filteredAvailableStudents = useMemo(() => {
        const keyword = existingSearch.trim().toLowerCase();

        return availableStudents.filter((student) => {
            if (queuedExistingIdSet.has(student.id)) {
                return false;
            }

            if (keyword === "") {
                return true;
            }

            const haystack = [
                student.student_name,
                student.lrn,
                student.grade_level,
                student.strand,
                student.personal_email,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(keyword);
        });
    }, [availableStudents, existingSearch, queuedExistingIdSet]);

    const selectedAvailableCount = useMemo(
        () =>
            selectedExistingIds.filter((id) =>
                filteredAvailableStudents.some((student) => student.id === id),
            ).length,
        [filteredAvailableStudents, selectedExistingIds],
    );

    const assignmentCount =
        queuedExistingStudents.length + newStudentsQueue.length;

    const stepOneIssues = useMemo(() => {
        const issues = [];

        if (!data.section_name.trim()) {
            issues.push("Section name is required.");
        }

        if (!data.cohort.trim()) {
            issues.push("Cohort is required.");
        }

        if (!department?.id) {
            issues.push(
                "Your admin account has no department assignment. Contact Superadmin.",
            );
        }

        return issues;
    }, [data.section_name, data.cohort, department?.id]);

    const summaryIssues = useMemo(() => {
        const issues = [...stepOneIssues];

        const lrnCounts = new Map();
        newStudentsQueue.forEach((student) => {
            const normalizedLrn = String(student.lrn || "").trim();
            if (!normalizedLrn) return;
            lrnCounts.set(
                normalizedLrn,
                (lrnCounts.get(normalizedLrn) || 0) + 1,
            );
        });

        const duplicateLrns = [...lrnCounts.entries()]
            .filter(([, count]) => count > 1)
            .map(([lrn]) => lrn);

        if (duplicateLrns.length > 0) {
            issues.push(
                `Duplicate LRNs in new student queue: ${duplicateLrns.join(", ")}`,
            );
        }

        return issues;
    }, [newStudentsQueue, stepOneIssues]);

    const handleSearchSections = (event) => {
        event.preventDefault();

        router.get(
            route("admin.sections.index"),
            { search },
            { preserveState: true, replace: true },
        );
    };

    const clearSectionSearch = () => {
        setSearch("");
        router.get(
            route("admin.sections.index"),
            {},
            { preserveState: true, replace: true },
        );
    };

    const openWizard = () => {
        clearErrors();
        setWizardNotice("");
        setStep(1);
        setSelectedExistingIds([]);
        setQueuedExistingStudents([]);
        setNewStudentsQueue([]);
        setBulkLines("");
        setBulkImportErrors([]);
        setNewStudentDraft({
            first_name: "",
            last_name: "",
            middle_name: "",
            lrn: "",
            personal_email: "",
        });
        reset();
        setData({
            section_name: "",
            section_code: "",
            cohort: String(new Date().getFullYear()),
            grade_level: "",
            strand: department?.code || "",
            track: "Academic",
            school_year: currentSchoolYear || "",
            description: "",
            advisor_teacher_id: "",
            assigned_student_ids: [],
            new_students: [],
        });
        setShowWizard(true);
    };

    const closeWizard = () => {
        setShowWizard(false);
        setWizardNotice("");
        clearErrors();
    };

    const handleNext = () => {
        if (step === 1 && stepOneIssues.length > 0) {
            setWizardNotice(
                "Please resolve the section information issues before continuing.",
            );
            return;
        }

        setWizardNotice("");
        setStep((prev) => Math.min(prev + 1, 3));
    };

    const handleBack = () => {
        setWizardNotice("");
        setStep((prev) => Math.max(prev - 1, 1));
    };

    const toggleExistingSelection = (studentId) => {
        setSelectedExistingIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId],
        );
    };

    const queueSingleExisting = (student) => {
        setQueuedExistingStudents((prev) => {
            if (prev.some((item) => item.id === student.id)) {
                return prev;
            }
            return [...prev, student];
        });
        setSelectedExistingIds((prev) =>
            prev.filter((id) => id !== student.id),
        );
    };

    const queueSelectedExisting = () => {
        if (selectedExistingIds.length === 0) {
            setWizardNotice("Select students first before using bulk assign.");
            return;
        }

        const selectedSet = new Set(selectedExistingIds);
        const studentsToAdd = filteredAvailableStudents.filter((student) =>
            selectedSet.has(student.id),
        );

        setQueuedExistingStudents((prev) => {
            const currentIds = new Set(prev.map((item) => item.id));
            const nextItems = studentsToAdd.filter(
                (item) => !currentIds.has(item.id),
            );
            return [...prev, ...nextItems];
        });

        setSelectedExistingIds([]);
        setWizardNotice("");
    };

    const removeQueuedExisting = (studentId) => {
        setQueuedExistingStudents((prev) =>
            prev.filter((student) => student.id !== studentId),
        );
    };

    const resetSingleNewStudentDraft = () => {
        setNewStudentDraft({
            first_name: "",
            last_name: "",
            middle_name: "",
            lrn: "",
            personal_email: "",
        });
    };

    const queueSingleNewStudent = () => {
        const firstName = newStudentDraft.first_name.trim();
        const lastName = newStudentDraft.last_name.trim();
        const middleName = newStudentDraft.middle_name.trim();
        const lrn = newStudentDraft.lrn.trim();
        const personalEmail = newStudentDraft.personal_email
            .trim()
            .toLowerCase();

        if (!firstName || !lastName || !lrn) {
            setWizardNotice(
                "Single create requires first name, last name, and LRN.",
            );
            return;
        }

        if (newStudentsQueue.some((student) => student.lrn === lrn)) {
            setWizardNotice(`LRN ${lrn} is already in the new student queue.`);
            return;
        }

        setNewStudentsQueue((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                first_name: firstName,
                last_name: lastName,
                middle_name: middleName,
                lrn,
                personal_email: personalEmail,
            },
        ]);

        resetSingleNewStudentDraft();
        setWizardNotice("");
    };

    const queueBulkNewStudents = () => {
        const lines = bulkLines
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line !== "");

        if (lines.length === 0) {
            setWizardNotice("Paste at least one row for bulk add.");
            return;
        }

        const parseErrors = [];
        const parsedRows = [];

        lines.forEach((line, index) => {
            const parts = line.split(",").map((item) => item.trim());

            if (parts.length < 3) {
                parseErrors.push(
                    `Line ${index + 1}: Expected format first_name,last_name,lrn,email(optional),middle_name(optional).`,
                );
                return;
            }

            const [
                firstName,
                lastName,
                lrn,
                personalEmail = "",
                middleName = "",
            ] = parts;

            if (!firstName || !lastName || !lrn) {
                parseErrors.push(
                    `Line ${index + 1}: First name, last name, and lrn are required.`,
                );
                return;
            }

            parsedRows.push({
                id: crypto.randomUUID(),
                first_name: firstName,
                last_name: lastName,
                middle_name: middleName,
                lrn,
                personal_email: personalEmail.toLowerCase(),
            });
        });

        const existingLrnSet = new Set(
            newStudentsQueue.map((student) => student.lrn),
        );
        const dedupedRows = parsedRows.filter((row) => {
            if (existingLrnSet.has(row.lrn)) {
                parseErrors.push(`Bulk row skipped: duplicate lrn ${row.lrn}.`);
                return false;
            }
            existingLrnSet.add(row.lrn);
            return true;
        });

        if (dedupedRows.length > 0) {
            setNewStudentsQueue((prev) => [...prev, ...dedupedRows]);
            setBulkLines("");
        }

        setBulkImportErrors(parseErrors);

        if (parseErrors.length === 0) {
            setWizardNotice("");
        }
    };

    const removeQueuedNewStudent = (id) => {
        setNewStudentsQueue((prev) =>
            prev.filter((student) => student.id !== id),
        );
    };

    const saveSection = () => {
        clearErrors();

        if (summaryIssues.length > 0) {
            setWizardNotice("Fix summary issues before saving.");
            return;
        }

        post(route("admin.sections.store"), {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = page?.props?.flash;

                closeWizard();

                if (flash?.success) {
                    showToast.success(flash.success);
                } else {
                    showToast.success("Section saved successfully.");
                }
            },
            onError: () => {
                showToast.error(
                    "Unable to save section. Please check the form and try again.",
                );
                setStep(3);
            },
        });
    };

    return (
        <>
            <Head title="Section Management" />

            <div className="space-y-5">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-700 px-7 py-6 shadow-lg shadow-indigo-500/20">
                    <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-blue-300/20 blur-xl" />

                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/20">
                                <Layers3 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">
                                    Section Management
                                </h1>
                                <p className="mt-0.5 text-sm text-indigo-100">
                                    Create sections by cohort and assign
                                    students in guided steps
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15 backdrop-blur-sm">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-100">
                                    Department
                                </p>
                                <p className="text-sm font-bold text-white">
                                    {department?.name || "Unassigned"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={openWizard}
                                disabled={!department?.id}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Plus size={16} />
                                New Section
                            </button>
                        </div>
                    </div>
                </div>

                {flash?.section_create_summary && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-semibold text-emerald-800">
                            Section created:{" "}
                            {flash.section_create_summary.section_name} (
                            {flash.section_create_summary.section_code})
                        </p>
                        <p className="mt-1 text-xs text-emerald-700">
                            Cohort {flash.section_create_summary.cohort} |
                            Existing assigned:{" "}
                            {
                                flash.section_create_summary
                                    .existing_assigned_count
                            }{" "}
                            | New students created:{" "}
                            {
                                flash.section_create_summary
                                    .new_students_created_count
                            }{" "}
                            | Total:{" "}
                            {flash.section_create_summary.total_students}
                        </p>
                    </div>
                )}

                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <form
                        onSubmit={handleSearchSections}
                        className="flex flex-col gap-3 sm:flex-row"
                    >
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                size={16}
                            />
                            <input
                                type="text"
                                placeholder="Search section name, code, or cohort..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-10 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSectionSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                        >
                            Search
                        </button>
                    </form>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    {sections.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                <School className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900">
                                No sections found
                            </h3>
                            <p className="mt-1 max-w-md text-sm text-slate-600">
                                Create your first section under your assigned
                                department using the wizard.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-3">
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    Section
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    Cohort
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    Grade/Strand
                                </div>
                                <div className="col-span-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    Students
                                </div>
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    Created
                                </div>
                            </div>

                            <div className="divide-y divide-slate-50">
                                {sections.data.map((section) => (
                                    <div
                                        key={section.id}
                                        className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/60"
                                    >
                                        <div className="col-span-3 min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {section.section_name}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Code: {section.section_code}
                                            </p>
                                        </div>

                                        <div className="col-span-2">
                                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                                                {section.cohort}
                                            </span>
                                        </div>

                                        <div className="col-span-2 text-xs text-slate-700">
                                            <p className="font-medium">
                                                {section.grade_level || "-"}
                                            </p>
                                            <p className="text-slate-500">
                                                {section.strand || "-"}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                Adviser:{" "}
                                                {section.advisor_teacher_name ||
                                                    "N/A"}
                                            </p>
                                        </div>

                                        <div className="col-span-2 flex justify-center">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                                                <Users size={11} />
                                                {section.students_count}
                                            </span>
                                        </div>

                                        <div className="col-span-3 text-xs text-slate-600">
                                            {new Date(
                                                section.created_at,
                                            ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {sections.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                                    <p className="text-xs text-slate-600">
                                        Showing {sections.from}-{sections.to} of{" "}
                                        {sections.total} sections
                                    </p>
                                    <div className="flex gap-1">
                                        {sections.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || "#"}
                                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                    link.active
                                                        ? "bg-indigo-600 text-white shadow-sm"
                                                        : link.url
                                                          ? "text-slate-600 hover:bg-slate-100"
                                                          : "cursor-not-allowed text-slate-300"
                                                }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showWizard && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={closeWizard}
                    />

                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-5">
                                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                                <button
                                    type="button"
                                    onClick={closeWizard}
                                    className="absolute right-3 top-3 z-10 rounded-xl p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                                <div className="relative">
                                    <h2 className="text-lg font-bold text-white">
                                        New Section Wizard
                                    </h2>
                                    <p className="mt-0.5 text-xs text-indigo-100">
                                        Department:{" "}
                                        {department?.name || "Unassigned"}
                                    </p>
                                </div>
                            </div>

                            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    {STEPS.map((wizardStep) => (
                                        <WizardStep
                                            key={wizardStep.id}
                                            step={wizardStep}
                                            currentStep={step}
                                        />
                                    ))}
                                </div>
                            </div>

                            {wizardNotice && (
                                <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                                    {wizardNotice}
                                </div>
                            )}

                            <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
                                {step === 1 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                                    Section Name{" "}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.section_name}
                                                    onChange={(event) =>
                                                        setData(
                                                            "section_name",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g., STEM-A"
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                                />
                                                <FieldError
                                                    message={
                                                        errors.section_name
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                                    Section Code
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.section_code}
                                                    onChange={(event) =>
                                                        setData(
                                                            "section_code",
                                                            event.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    placeholder="Auto-generated when empty"
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                                />
                                                <FieldError
                                                    message={
                                                        errors.section_code
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                                    Cohort{" "}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.cohort}
                                                    onChange={(event) =>
                                                        setData(
                                                            "cohort",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g., 2026"
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                                />
                                                <FieldError
                                                    message={errors.cohort}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                                    Grade Level
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.grade_level}
                                                    onChange={(event) =>
                                                        setData(
                                                            "grade_level",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g., Grade 11"
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                                />
                                                <FieldError
                                                    message={errors.grade_level}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                                    Strand
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.strand}
                                                    onChange={(event) =>
                                                        setData(
                                                            "strand",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g., STEM"
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                                />
                                                <FieldError
                                                    message={errors.strand}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                                    Track
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.track}
                                                    onChange={(event) =>
                                                        setData(
                                                            "track",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g., Academic"
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                                />
                                                <FieldError
                                                    message={errors.track}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                                    Adviser Teacher
                                                </label>
                                                <select
                                                    value={
                                                        data.advisor_teacher_id
                                                    }
                                                    onChange={(event) =>
                                                        setData(
                                                            "advisor_teacher_id",
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                                >
                                                    <option value="">
                                                        Unassigned (N/A)
                                                    </option>
                                                    {teachers.map((teacher) => (
                                                        <option
                                                            key={teacher.id}
                                                            value={teacher.id}
                                                        >
                                                            {teacher.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <FieldError
                                                    message={
                                                        errors.advisor_teacher_id
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                                    School Year
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.school_year}
                                                    readOnly
                                                    disabled
                                                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
                                                />
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Loaded from School Settings
                                                    (read-only).
                                                </p>
                                                <FieldError
                                                    message={errors.school_year}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                                Description
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={data.description}
                                                onChange={(event) =>
                                                    setData(
                                                        "description",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Optional notes for this section"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                            />
                                            <FieldError
                                                message={errors.description}
                                            />
                                        </div>

                                        {stepOneIssues.length > 0 && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                                                    Fix Before Next Step
                                                </p>
                                                <ul className="space-y-1 text-sm text-amber-700">
                                                    {stepOneIssues.map(
                                                        (issue) => (
                                                            <li key={issue}>
                                                                - {issue}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                                        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900">
                                                        Assign Existing Students
                                                    </h3>
                                                    <p className="text-xs text-slate-600">
                                                        Single assign or bulk
                                                        assign students not yet
                                                        in a section.
                                                    </p>
                                                </div>
                                                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                                                    Pool:{" "}
                                                    {
                                                        filteredAvailableStudents.length
                                                    }
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Search
                                                        size={14}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={existingSearch}
                                                        onChange={(event) =>
                                                            setExistingSearch(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Search student, lrn, strand"
                                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={
                                                        queueSelectedExisting
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                                                >
                                                    <UserCheck size={13} />
                                                    Bulk Assign (
                                                    {selectedAvailableCount})
                                                </button>
                                            </div>

                                            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
                                                {filteredAvailableStudents.length ===
                                                0 ? (
                                                    <p className="px-2 py-5 text-center text-sm text-slate-500">
                                                        No available students in
                                                        pool.
                                                    </p>
                                                ) : (
                                                    filteredAvailableStudents.map(
                                                        (student) => {
                                                            const checked =
                                                                selectedExistingIds.includes(
                                                                    student.id,
                                                                );
                                                            return (
                                                                <div
                                                                    key={
                                                                        student.id
                                                                    }
                                                                    className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            checked
                                                                        }
                                                                        onChange={() =>
                                                                            toggleExistingSelection(
                                                                                student.id,
                                                                            )
                                                                        }
                                                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="truncate text-sm font-medium text-slate-800">
                                                                            {
                                                                                student.student_name
                                                                            }
                                                                        </p>
                                                                        <p className="truncate text-xs text-slate-500">
                                                                            LRN:{" "}
                                                                            {student.lrn ||
                                                                                "-"}{" "}
                                                                            |{" "}
                                                                            {student.grade_level ||
                                                                                "-"}{" "}
                                                                            |{" "}
                                                                            {student.strand ||
                                                                                "-"}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            queueSingleExisting(
                                                                                student,
                                                                            )
                                                                        }
                                                                        className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                                                    >
                                                                        Assign
                                                                    </button>
                                                                </div>
                                                            );
                                                        },
                                                    )
                                                )}
                                            </div>

                                            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                                                        Queued Existing
                                                        Assignments
                                                    </p>
                                                    <span className="text-xs font-bold text-indigo-700">
                                                        {
                                                            queuedExistingStudents.length
                                                        }
                                                    </span>
                                                </div>
                                                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                                                    {queuedExistingStudents.length ===
                                                    0 ? (
                                                        <p className="text-xs text-indigo-600">
                                                            No existing students
                                                            queued yet.
                                                        </p>
                                                    ) : (
                                                        queuedExistingStudents.map(
                                                            (student) => (
                                                                <div
                                                                    key={
                                                                        student.id
                                                                    }
                                                                    className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2"
                                                                >
                                                                    <div>
                                                                        <p className="text-xs font-medium text-slate-800">
                                                                            {
                                                                                student.student_name
                                                                            }
                                                                        </p>
                                                                        <p className="text-[11px] text-slate-500">
                                                                            {student.lrn ||
                                                                                "No LRN"}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeQueuedExisting(
                                                                                student.id,
                                                                            )
                                                                        }
                                                                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            ),
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Create New Students
                                                </h3>
                                                <p className="text-xs text-slate-600">
                                                    Add one student at a time or
                                                    bulk paste rows.
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                    Single Create
                                                </p>

                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    <input
                                                        type="text"
                                                        value={
                                                            newStudentDraft.first_name
                                                        }
                                                        onChange={(event) =>
                                                            setNewStudentDraft(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    first_name:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="First name"
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={
                                                            newStudentDraft.last_name
                                                        }
                                                        onChange={(event) =>
                                                            setNewStudentDraft(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    last_name:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="Last name"
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={
                                                            newStudentDraft.middle_name
                                                        }
                                                        onChange={(event) =>
                                                            setNewStudentDraft(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    middle_name:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="Middle name (optional)"
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={
                                                            newStudentDraft.lrn
                                                        }
                                                        onChange={(event) =>
                                                            setNewStudentDraft(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    lrn: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="LRN"
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <input
                                                        type="email"
                                                        value={
                                                            newStudentDraft.personal_email
                                                        }
                                                        onChange={(event) =>
                                                            setNewStudentDraft(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    personal_email:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="Email (optional)"
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500 sm:col-span-2"
                                                    />
                                                </div>

                                                <div className="mt-3 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            queueSingleNewStudent
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                                    >
                                                        <UserPlus size={13} />
                                                        Add Single Student
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                    Bulk Add
                                                </p>
                                                <p className="mb-2 text-[11px] text-slate-500">
                                                    Format per line:
                                                    first_name,last_name,lrn,email(optional),middle_name(optional)
                                                </p>
                                                <textarea
                                                    rows={5}
                                                    value={bulkLines}
                                                    onChange={(event) =>
                                                        setBulkLines(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Juan,Dela Cruz,123456789012,juan@example.com"
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                                <div className="mt-3 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            queueBulkNewStudents
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                                                    >
                                                        <Upload size={13} />
                                                        Bulk Queue
                                                    </button>
                                                </div>

                                                {bulkImportErrors.length >
                                                    0 && (
                                                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                                        <p className="mb-1 text-xs font-semibold text-amber-700">
                                                            Bulk import notes
                                                        </p>
                                                        <div className="max-h-24 space-y-1 overflow-y-auto text-[11px] text-amber-700">
                                                            {bulkImportErrors.map(
                                                                (error) => (
                                                                    <p
                                                                        key={
                                                                            error
                                                                        }
                                                                    >
                                                                        -{" "}
                                                                        {error}
                                                                    </p>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                                        Queued New Students
                                                    </p>
                                                    <span className="text-xs font-bold text-emerald-700">
                                                        {
                                                            newStudentsQueue.length
                                                        }
                                                    </span>
                                                </div>

                                                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                                                    {newStudentsQueue.length ===
                                                    0 ? (
                                                        <p className="text-xs text-emerald-700">
                                                            No new students
                                                            queued yet.
                                                        </p>
                                                    ) : (
                                                        newStudentsQueue.map(
                                                            (student) => (
                                                                <div
                                                                    key={
                                                                        student.id
                                                                    }
                                                                    className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2"
                                                                >
                                                                    <div>
                                                                        <p className="text-xs font-medium text-slate-800">
                                                                            {
                                                                                student.first_name
                                                                            }{" "}
                                                                            {
                                                                                student.middle_name
                                                                            }{" "}
                                                                            {
                                                                                student.last_name
                                                                            }
                                                                        </p>
                                                                        <p className="text-[11px] text-slate-500">
                                                                            LRN:{" "}
                                                                            {
                                                                                student.lrn
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeQueuedNewStudent(
                                                                                student.id,
                                                                            )
                                                                        }
                                                                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            ),
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Existing Assigned
                                                </p>
                                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                                    {
                                                        queuedExistingStudents.length
                                                    }
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    New Students
                                                </p>
                                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                                    {newStudentsQueue.length}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Total After Save
                                                </p>
                                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                                    {assignmentCount}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Section Summary
                                            </p>
                                            <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-2">
                                                <p>
                                                    <span className="font-semibold">
                                                        Section:
                                                    </span>{" "}
                                                    {data.section_name || "-"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">
                                                        Code:
                                                    </span>{" "}
                                                    {data.section_code ||
                                                        "Auto"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">
                                                        Cohort:
                                                    </span>{" "}
                                                    {data.cohort || "-"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">
                                                        Grade/Strand:
                                                    </span>{" "}
                                                    {data.grade_level || "-"} /{" "}
                                                    {data.strand || "-"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">
                                                        Track:
                                                    </span>{" "}
                                                    {data.track || "-"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">
                                                        School Year:
                                                    </span>{" "}
                                                    {data.school_year || "-"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">
                                                        Adviser:
                                                    </span>{" "}
                                                    {teachers.find(
                                                        (teacher) =>
                                                            String(
                                                                teacher.id,
                                                            ) ===
                                                            String(
                                                                data.advisor_teacher_id,
                                                            ),
                                                    )?.name || "N/A"}
                                                </p>
                                            </div>
                                        </div>

                                        {summaryIssues.length > 0 ? (
                                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                                                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
                                                    <AlertTriangle size={14} />
                                                    Fix these issues before
                                                    saving
                                                </p>
                                                <div className="space-y-1 text-sm text-rose-700">
                                                    {summaryIssues.map(
                                                        (issue) => (
                                                            <p key={issue}>
                                                                - {issue}
                                                            </p>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                                    <CheckCircle2 size={15} />
                                                    No issues found. You can
                                                    save this section.
                                                </p>
                                            </div>
                                        )}

                                        {(errors.student_assignment ||
                                            errors.assigned_student_ids ||
                                            errors.new_students) && (
                                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                                <p>
                                                    {errors.student_assignment}
                                                </p>
                                                <p>
                                                    {
                                                        errors.assigned_student_ids
                                                    }
                                                </p>
                                                <p>{errors.new_students}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={
                                        step === 1 ? closeWizard : handleBack
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                                >
                                    <ChevronLeft size={16} />
                                    {step === 1 ? "Cancel" : "Back"}
                                </button>

                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                    >
                                        Next
                                        <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={saveSection}
                                        disabled={
                                            processing ||
                                            summaryIssues.length > 0
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Save size={15} />
                                        {processing
                                            ? "Saving..."
                                            : "Save Section"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Index.layout = (page) => <SchoolStaffLayout children={page} />;

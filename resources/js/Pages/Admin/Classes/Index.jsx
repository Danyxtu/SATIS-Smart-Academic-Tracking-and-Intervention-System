import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import DeleteConfirmModal from "@/Components/Superadmin/DeleteConfirmModal";
import {
    AlertTriangle,
    BookOpen,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Layers,
    Pencil,
    Plus,
    Save,
    School,
    Search,
    Trash2,
    UserCog,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

const STEPS = [
    {
        id: 1,
        title: "Subject",
        description: "Choose what subject will be taught",
    },
    {
        id: 2,
        title: "Section",
        description: "Assign which section will take this class",
    },
    {
        id: 3,
        title: "Teacher",
        description: "Select teacher and finalize",
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

function StatCard({ icon: Icon, label, value, accent = "emerald" }) {
    const accents = {
        emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
        blue: "bg-blue-50 text-blue-600 ring-blue-200",
        violet: "bg-violet-50 text-violet-600 ring-violet-200",
    };

    return (
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accents[accent]}`}
            >
                <Icon size={17} />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">
                    {value}
                </p>
            </div>
        </div>
    );
}

export default function Index({
    classes,
    subjects = [],
    sections = [],
    teachers = [],
    currentSchoolYear,
    department,
    filters,
}) {
    const { flash } = usePage().props;

    const [search, setSearch] = useState(filters.search || "");
    const [showWizard, setShowWizard] = useState(false);
    const [wizardMode, setWizardMode] = useState("create");
    const [classToEdit, setClassToEdit] = useState(null);
    const [classToDelete, setClassToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [step, setStep] = useState(1);
    const [wizardNotice, setWizardNotice] = useState("");

    const { data, setData, post, put, processing, errors, clearErrors } =
        useForm({
            subject_id: "",
            section_id: "",
            teacher_id: "",
            school_year: currentSchoolYear || "",
        });

    const selectedSubject = useMemo(
        () =>
            subjects.find(
                (subject) => Number(subject.id) === Number(data.subject_id),
            ) || null,
        [subjects, data.subject_id],
    );

    const selectedSection = useMemo(
        () =>
            sections.find(
                (section) => Number(section.id) === Number(data.section_id),
            ) || null,
        [sections, data.section_id],
    );

    const selectedTeacher = useMemo(
        () =>
            teachers.find(
                (teacher) => Number(teacher.id) === Number(data.teacher_id),
            ) || null,
        [teachers, data.teacher_id],
    );

    const summary = useMemo(() => {
        const classesCount = classes.total || 0;
        const subjectsCovered = new Set(
            classes.data.map((item) => String(item.subject_id || "")),
        ).size;
        const teachersAssigned = new Set(
            classes.data.map((item) => String(item.teacher_id || "")),
        ).size;

        return {
            classesCount,
            subjectsCovered,
            teachersAssigned,
        };
    }, [classes.data, classes.total]);

    const stepOneIssues = useMemo(() => {
        const issues = [];

        if (!data.subject_id) {
            issues.push("Select a subject before continuing.");
        }

        if (subjects.length === 0) {
            issues.push(
                "No subjects found. Ask Superadmin to add subjects first.",
            );
        }

        return issues;
    }, [data.subject_id, subjects.length]);

    const stepTwoIssues = useMemo(() => {
        const issues = [];

        if (!data.section_id) {
            issues.push("Select a section before continuing.");
        }

        if (sections.length === 0) {
            issues.push("No active sections available in your department.");
        }

        return issues;
    }, [data.section_id, sections.length]);

    const stepThreeIssues = useMemo(() => {
        const issues = [];

        if (!data.teacher_id) {
            issues.push("Select a teacher before saving.");
        }

        if (!data.school_year.trim()) {
            issues.push("School year is required.");
        } else if (!/^\d{4}-\d{4}$/.test(data.school_year.trim())) {
            issues.push("School year format must be YYYY-YYYY.");
        }

        if (teachers.length === 0) {
            issues.push("No teachers found in your department.");
        }

        return issues;
    }, [data.teacher_id, data.school_year, teachers.length]);

    const summaryIssues = useMemo(
        () => [...stepOneIssues, ...stepTwoIssues, ...stepThreeIssues],
        [stepOneIssues, stepTwoIssues, stepThreeIssues],
    );

    const handleSearch = (event) => {
        event.preventDefault();

        router.get(
            route("admin.classes.index"),
            { search },
            { preserveState: true, replace: true },
        );
    };

    const clearSearch = () => {
        setSearch("");

        router.get(
            route("admin.classes.index"),
            {},
            { preserveState: true, replace: true },
        );
    };

    const resetWizardData = () => {
        setData({
            subject_id: "",
            section_id: "",
            teacher_id: "",
            school_year: currentSchoolYear || "",
        });
    };

    const openCreateWizard = () => {
        clearErrors();
        setWizardNotice("");
        setWizardMode("create");
        setClassToEdit(null);
        setStep(1);
        resetWizardData();
        setShowWizard(true);
    };

    const openEditWizard = (item) => {
        clearErrors();
        setWizardNotice("");
        setWizardMode("edit");
        setClassToEdit(item);
        setStep(1);
        setData({
            subject_id: String(item.subject_id || ""),
            section_id: String(item.section_id || ""),
            teacher_id: String(item.teacher_id || ""),
            school_year: item.school_year || currentSchoolYear || "",
        });
        setShowWizard(true);
    };

    const closeWizard = () => {
        if (processing) return;

        clearErrors();
        setWizardNotice("");
        setClassToEdit(null);
        setStep(1);
        setShowWizard(false);
    };

    const goNext = () => {
        if (step === 1 && stepOneIssues.length > 0) {
            setWizardNotice(
                "Please resolve subject step issues before continuing.",
            );
            return;
        }

        if (step === 2 && stepTwoIssues.length > 0) {
            setWizardNotice(
                "Please resolve section step issues before continuing.",
            );
            return;
        }

        setWizardNotice("");
        setStep((current) => Math.min(current + 1, 3));
    };

    const goBack = () => {
        setWizardNotice("");
        setStep((current) => Math.max(current - 1, 1));
    };

    const saveClass = () => {
        if (summaryIssues.length > 0) {
            setWizardNotice(
                "Please resolve all wizard issues before saving this class.",
            );
            return;
        }

        setWizardNotice("");

        const requestConfig = {
            preserveScroll: true,
            onSuccess: () => {
                closeWizard();
                resetWizardData();
            },
        };

        if (wizardMode === "edit" && classToEdit) {
            put(route("admin.classes.update", classToEdit.id), requestConfig);
            return;
        }

        post(route("admin.classes.store"), requestConfig);
    };

    const handleDelete = () => {
        if (!classToDelete) return;

        router.delete(route("admin.classes.destroy", classToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setShowDeleteModal(false);
                setClassToDelete(null);
            },
        });
    };

    return (
        <>
            <Head title="Class Management" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Class Management
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Create and manage class assignments for subject,
                            section, and teacher.
                        </p>
                        {department?.name && (
                            <p className="mt-1 text-xs font-medium text-slate-500">
                                Department: {department.name}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={openCreateWizard}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                    >
                        <Plus size={16} />
                        New Class Wizard
                    </button>
                </div>

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {flash.error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatCard
                        icon={BookOpen}
                        label="Total Classes"
                        value={summary.classesCount}
                        accent="emerald"
                    />
                    <StatCard
                        icon={Layers}
                        label="Subjects Covered"
                        value={summary.subjectsCovered}
                        accent="blue"
                    />
                    <StatCard
                        icon={UserCog}
                        label="Teachers Assigned"
                        value={summary.teachersAssigned}
                        accent="violet"
                    />
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            size={15}
                        />
                        <input
                            type="text"
                            placeholder="Search subject, section, teacher, or school year..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:text-slate-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Search
                    </button>
                </form>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {classes.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                <School size={28} className="text-slate-400" />
                            </div>
                            <h3 className="mb-1 text-base font-semibold text-slate-800">
                                No classes found
                            </h3>
                            <p className="mb-6 max-w-xs text-sm text-slate-500">
                                {search
                                    ? "Try a different search term."
                                    : "Start by creating your first class assignment."}
                            </p>
                            {!search && (
                                <button
                                    type="button"
                                    onClick={openCreateWizard}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                >
                                    <Plus size={16} />
                                    Create First Class
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3">
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Subject
                                </div>
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Section
                                </div>
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Teacher
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    School Year
                                </div>
                                <div className="col-span-1 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Actions
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {classes.data.map((item) => (
                                    <div
                                        key={item.id}
                                        className="grid grid-cols-12 items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70"
                                    >
                                        <div className="col-span-3 min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {item.subject_name || "N/A"}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {item.subject_code || "-"}
                                            </p>
                                        </div>

                                        <div className="col-span-3 min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {item.section_name || "N/A"}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {item.section_code || "-"}
                                                {item.cohort
                                                    ? ` • Cohort ${item.cohort}`
                                                    : ""}
                                            </p>
                                        </div>

                                        <div className="col-span-3 min-w-0">
                                            <p className="truncate text-sm text-slate-800">
                                                {item.teacher_name || "N/A"}
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                                <Calendar size={11} />
                                                {item.updated_at
                                                    ? new Date(
                                                          item.updated_at,
                                                      ).toLocaleDateString(
                                                          "en-US",
                                                          {
                                                              year: "numeric",
                                                              month: "short",
                                                              day: "numeric",
                                                          },
                                                      )
                                                    : "No recent update"}
                                            </p>
                                        </div>

                                        <div className="col-span-2">
                                            <span className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                                {item.school_year}
                                            </span>
                                        </div>

                                        <div className="col-span-1 flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditWizard(item)
                                                }
                                                title="Edit class"
                                                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setClassToDelete(item);
                                                    setShowDeleteModal(true);
                                                }}
                                                title="Delete class"
                                                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {classes.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                                    <p className="text-xs text-slate-500">
                                        Showing {classes.from}–{classes.to} of{" "}
                                        {classes.total} classes
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {classes.links.map((link, index) => {
                                            const isPrev = index === 0;
                                            const isNext =
                                                index ===
                                                classes.links.length - 1;
                                            const isNav = isPrev || isNext;

                                            return (
                                                <Link
                                                    key={index}
                                                    href={link.url || "#"}
                                                    className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors ${
                                                        link.active
                                                            ? "bg-indigo-600 text-white"
                                                            : link.url
                                                              ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                              : "cursor-not-allowed border border-slate-100 text-slate-300"
                                                    }`}
                                                    dangerouslySetInnerHTML={
                                                        isNav
                                                            ? undefined
                                                            : {
                                                                  __html: link.label,
                                                              }
                                                    }
                                                >
                                                    {isNav ? (
                                                        isPrev ? (
                                                            <ChevronLeft
                                                                size={14}
                                                            />
                                                        ) : (
                                                            <ChevronRight
                                                                size={14}
                                                            />
                                                        )
                                                    ) : null}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showWizard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                        onClick={closeWizard}
                    />

                    <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {wizardMode === "edit"
                                        ? "Edit Class Wizard"
                                        : "New Class Wizard"}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Follow the steps: Subject, Section, Teacher,
                                    then save.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeWizard}
                                disabled={processing}
                                className="z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                            <div className="flex items-center justify-between gap-3">
                                {STEPS.map((wizardStep) => (
                                    <WizardStep
                                        key={wizardStep.id}
                                        step={wizardStep}
                                        currentStep={step}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            {wizardNotice && (
                                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                    {wizardNotice}
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Subject to be taught
                                            <span className="text-rose-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={data.subject_id}
                                            onChange={(event) =>
                                                setData(
                                                    "subject_id",
                                                    event.target.value,
                                                )
                                            }
                                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
                                                errors.subject_id
                                                    ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                    : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                                            }`}
                                        >
                                            <option value="">
                                                Select a subject
                                            </option>
                                            {subjects.map((subject) => (
                                                <option
                                                    key={subject.id}
                                                    value={subject.id}
                                                >
                                                    {subject.subject_name} (
                                                    {subject.subject_code})
                                                </option>
                                            ))}
                                        </select>
                                        <FieldError
                                            message={errors.subject_id}
                                        />
                                    </div>

                                    {selectedSubject && (
                                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                                            Selected subject:{" "}
                                            <strong>
                                                {selectedSubject.subject_name}
                                            </strong>{" "}
                                            ({selectedSubject.subject_code})
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Section assignment
                                            <span className="text-rose-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={data.section_id}
                                            onChange={(event) =>
                                                setData(
                                                    "section_id",
                                                    event.target.value,
                                                )
                                            }
                                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
                                                errors.section_id
                                                    ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                    : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                                            }`}
                                        >
                                            <option value="">
                                                Select a section
                                            </option>
                                            {sections.map((section) => (
                                                <option
                                                    key={section.id}
                                                    value={section.id}
                                                >
                                                    {section.section_name} (
                                                    {section.section_code})
                                                    {section.cohort
                                                        ? ` - Cohort ${section.cohort}`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <FieldError
                                            message={errors.section_id}
                                        />
                                    </div>

                                    {selectedSection && (
                                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                                            <p>
                                                Selected section:{" "}
                                                <strong>
                                                    {
                                                        selectedSection.section_name
                                                    }
                                                </strong>
                                            </p>
                                            <p className="mt-1 text-xs text-indigo-600">
                                                {selectedSection.section_code} •
                                                Cohort{" "}
                                                {selectedSection.cohort || "-"}
                                                {selectedSection.grade_level
                                                    ? ` • ${selectedSection.grade_level}`
                                                    : ""}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Teacher assignment
                                            <span className="text-rose-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={data.teacher_id}
                                            onChange={(event) =>
                                                setData(
                                                    "teacher_id",
                                                    event.target.value,
                                                )
                                            }
                                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
                                                errors.teacher_id
                                                    ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                    : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                                            }`}
                                        >
                                            <option value="">
                                                Select a teacher
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
                                            message={errors.teacher_id}
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            School year
                                            <span className="text-rose-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.school_year}
                                            onChange={(event) =>
                                                setData(
                                                    "school_year",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="YYYY-YYYY"
                                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
                                                errors.school_year
                                                    ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                    : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                                            }`}
                                        />
                                        <FieldError
                                            message={errors.school_year}
                                        />
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                                        <h3 className="mb-3 text-sm font-semibold text-slate-700">
                                            Class Summary
                                        </h3>
                                        <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
                                            <p>
                                                Subject:{" "}
                                                {selectedSubject?.subject_name ||
                                                    "-"}
                                            </p>
                                            <p>
                                                Section:{" "}
                                                {selectedSection?.section_name ||
                                                    "-"}
                                            </p>
                                            <p>
                                                Teacher:{" "}
                                                {selectedTeacher?.name || "-"}
                                            </p>
                                            <p>
                                                School Year:{" "}
                                                {data.school_year || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    {summaryIssues.length > 0 ? (
                                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                                            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
                                                <AlertTriangle size={15} />
                                                Fix these issues before saving
                                            </p>
                                            <div className="space-y-1 text-sm text-rose-700">
                                                {summaryIssues.map((issue) => (
                                                    <p key={issue}>- {issue}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                                <CheckCircle2 size={15} />
                                                No issues found. You can save
                                                this class.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                            <button
                                type="button"
                                onClick={step === 1 ? closeWizard : goBack}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                            >
                                <ChevronLeft size={16} />
                                {step === 1 ? "Cancel" : "Back"}
                            </button>

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={saveClass}
                                    disabled={
                                        processing || summaryIssues.length > 0
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Save size={15} />
                                    {processing
                                        ? "Saving..."
                                        : wizardMode === "edit"
                                          ? "Update Class"
                                          : "Create Class"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setClassToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Delete Class"
                itemName={classToDelete?.subject_name}
                description="This class assignment will be permanently removed. This action cannot be undone."
                isLoading={processing}
            />
        </>
    );
}

Index.layout = (page) => <SuperAdminLayout children={page} />;

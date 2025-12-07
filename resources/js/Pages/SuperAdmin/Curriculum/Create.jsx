import { Head, Link, useForm } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    BookOpen,
    ArrowLeft,
    Save,
    Plus,
    X,
    Hash,
    Layers,
    GraduationCap,
    FileText,
    GitBranch,
    Info,
} from "lucide-react";
import { useState } from "react";

export default function Create({ availablePrerequisites }) {
    const [prerequisiteSearch, setPrerequisiteSearch] = useState("");

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        code: "",
        description: "",
        grade_level: "11",
        strand: "",
        track: "",
        semester: "1",
        units: "3",
        is_active: true,
        prerequisites: [],
    });

    const gradeLevels = [
        { value: "11", label: "Grade 11" },
        { value: "12", label: "Grade 12" },
    ];

    const strands = [
        { value: "", label: "None (Core Subject)" },
        { value: "STEM", label: "STEM" },
        { value: "ABM", label: "ABM" },
        { value: "HUMSS", label: "HUMSS" },
        { value: "GAS", label: "GAS" },
        { value: "TVL-ICT", label: "TVL-ICT" },
        { value: "TVL-HE", label: "TVL-HE" },
    ];

    const semesters = [
        { value: "1", label: "1st Semester" },
        { value: "2", label: "2nd Semester" },
    ];

    const filteredPrerequisites = availablePrerequisites?.filter(
        (prereq) =>
            !data.prerequisites.some((p) => p.id === prereq.id) &&
            (prereq.name
                .toLowerCase()
                .includes(prerequisiteSearch.toLowerCase()) ||
                prereq.code
                    .toLowerCase()
                    .includes(prerequisiteSearch.toLowerCase()))
    );

    const addPrerequisite = (prereq) => {
        setData("prerequisites", [
            ...data.prerequisites,
            { ...prereq, minimum_grade: 75 },
        ]);
        setPrerequisiteSearch("");
    };

    const removePrerequisite = (id) => {
        setData(
            "prerequisites",
            data.prerequisites.filter((p) => p.id !== id)
        );
    };

    const updateMinimumGrade = (id, grade) => {
        setData(
            "prerequisites",
            data.prerequisites.map((p) =>
                p.id === id ? { ...p, minimum_grade: parseInt(grade) || 75 } : p
            )
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("superadmin.curriculum.store"));
    };

    return (
        <>
            <Head title="Add Subject" />

            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route("superadmin.curriculum.index")}
                        className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Add Subject
                        </h1>
                        <p className="text-slate-500">
                            Add a new subject to the curriculum
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Subject Details
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Basic subject information
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Name */}
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <BookOpen
                                            size={14}
                                            className="text-slate-400"
                                        />
                                        Subject Name
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        placeholder="e.g., General Mathematics"
                                        className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                            errors.name
                                                ? "border-rose-300 bg-rose-50/50"
                                                : ""
                                        }`}
                                    />
                                    {errors.name && (
                                        <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                            <Info size={14} />
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Code */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <Hash
                                            size={14}
                                            className="text-slate-400"
                                        />
                                        Subject Code
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) =>
                                            setData(
                                                "code",
                                                e.target.value.toUpperCase()
                                            )
                                        }
                                        placeholder="e.g., MATH101"
                                        className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                            errors.code
                                                ? "border-rose-300 bg-rose-50/50"
                                                : ""
                                        }`}
                                    />
                                    {errors.code && (
                                        <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                            <Info size={14} />
                                            {errors.code}
                                        </p>
                                    )}
                                </div>

                                {/* Units */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <Layers
                                            size={14}
                                            className="text-slate-400"
                                        />
                                        Units
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={data.units}
                                        onChange={(e) =>
                                            setData("units", e.target.value)
                                        }
                                        min="1"
                                        max="6"
                                        className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                            errors.units
                                                ? "border-rose-300 bg-rose-50/50"
                                                : ""
                                        }`}
                                    />
                                    {errors.units && (
                                        <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                            <Info size={14} />
                                            {errors.units}
                                        </p>
                                    )}
                                </div>

                                {/* Grade Level */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <GraduationCap
                                            size={14}
                                            className="text-slate-400"
                                        />
                                        Grade Level
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.grade_level}
                                        onChange={(e) =>
                                            setData(
                                                "grade_level",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                                    >
                                        {gradeLevels.map((level) => (
                                            <option
                                                key={level.value}
                                                value={level.value}
                                            >
                                                {level.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Semester */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <Layers
                                            size={14}
                                            className="text-slate-400"
                                        />
                                        Semester
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.semester}
                                        onChange={(e) =>
                                            setData("semester", e.target.value)
                                        }
                                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                                    >
                                        {semesters.map((sem) => (
                                            <option
                                                key={sem.value}
                                                value={sem.value}
                                            >
                                                {sem.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Strand */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <GitBranch
                                            size={14}
                                            className="text-slate-400"
                                        />
                                        Strand/Track
                                    </label>
                                    <select
                                        value={data.strand}
                                        onChange={(e) =>
                                            setData("strand", e.target.value)
                                        }
                                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                                    >
                                        {strands.map((s) => (
                                            <option
                                                key={s.value}
                                                value={s.value}
                                            >
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Track */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <FileText
                                            size={14}
                                            className="text-slate-400"
                                        />
                                        Track (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.track}
                                        onChange={(e) =>
                                            setData("track", e.target.value)
                                        }
                                        placeholder="e.g., Academic, TVL"
                                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                                    />
                                </div>

                                {/* Description */}
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <FileText
                                            size={14}
                                            className="text-slate-400"
                                        />
                                        Description
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        rows={3}
                                        placeholder="Brief description of the subject..."
                                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors resize-none"
                                    />
                                </div>

                                {/* Active Status */}
                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                                    data.is_active
                                                        ? "bg-emerald-100"
                                                        : "bg-slate-200"
                                                }`}
                                            >
                                                <BookOpen
                                                    size={20}
                                                    className={
                                                        data.is_active
                                                            ? "text-emerald-600"
                                                            : "text-slate-400"
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    Active Subject
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    Enable to allow enrollment
                                                    in this subject
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.is_active}
                                                onChange={(e) =>
                                                    setData(
                                                        "is_active",
                                                        e.target.checked
                                                    )
                                                }
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prerequisites */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600">
                                <GitBranch size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">
                                    Prerequisites
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Add subjects that must be completed before
                                    this one
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Search Prerequisites */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={prerequisiteSearch}
                                    onChange={(e) =>
                                        setPrerequisiteSearch(e.target.value)
                                    }
                                    placeholder="Search for subjects to add as prerequisites..."
                                    className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                                />
                                {prerequisiteSearch &&
                                    filteredPrerequisites?.length > 0 && (
                                        <div className="absolute z-10 mt-2 w-full rounded-xl bg-white shadow-lg border border-slate-200 max-h-48 overflow-y-auto">
                                            {filteredPrerequisites
                                                .slice(0, 5)
                                                .map((prereq) => (
                                                    <button
                                                        key={prereq.id}
                                                        type="button"
                                                        onClick={() =>
                                                            addPrerequisite(
                                                                prereq
                                                            )
                                                        }
                                                        className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors"
                                                    >
                                                        <span>
                                                            <span className="font-semibold text-slate-900">
                                                                {prereq.name}
                                                            </span>
                                                            <span className="text-slate-500 ml-2">
                                                                ({prereq.code})
                                                            </span>
                                                        </span>
                                                        <div className="h-6 w-6 rounded-md bg-blue-100 flex items-center justify-center">
                                                            <Plus
                                                                size={14}
                                                                className="text-blue-600"
                                                            />
                                                        </div>
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                            </div>

                            {/* Selected Prerequisites */}
                            {data.prerequisites.length > 0 ? (
                                <div className="space-y-2">
                                    {data.prerequisites.map((prereq) => (
                                        <div
                                            key={prereq.id}
                                            className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 border border-slate-100 p-4"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                                    <BookOpen
                                                        size={18}
                                                        className="text-amber-600"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">
                                                        {prereq.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {prereq.code}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="text-xs font-medium text-slate-500">
                                                    Min. Grade:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={prereq.minimum_grade}
                                                    onChange={(e) =>
                                                        updateMinimumGrade(
                                                            prereq.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    min="60"
                                                    max="100"
                                                    className="w-16 rounded-lg border-slate-200 bg-white text-sm text-center focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removePrerequisite(
                                                        prereq.id
                                                    )
                                                }
                                                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                        <GitBranch
                                            size={24}
                                            className="text-slate-400"
                                        />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">
                                        No prerequisites added
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Students can enroll without prior
                                        requirements
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Link
                            href={route("superadmin.curriculum.index")}
                            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
                        >
                            <Save size={18} />
                            {processing ? "Saving..." : "Add Subject"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Create.layout = (page) => <SuperAdminLayout children={page} />;

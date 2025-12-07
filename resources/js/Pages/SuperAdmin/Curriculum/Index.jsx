import { Head, Link, router } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    BookOpen,
    Plus,
    Search,
    Pencil,
    Trash2,
    Filter,
    GitBranch,
    GraduationCap,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Layers,
} from "lucide-react";
import { useState } from "react";

export default function Index({ subjects, filters }) {
    const [search, setSearch] = useState(filters?.search || "");
    const [gradeLevel, setGradeLevel] = useState(filters?.grade_level || "");
    const [strand, setStrand] = useState(filters?.strand || "");
    const [deleteModal, setDeleteModal] = useState({
        open: false,
        subject: null,
    });

    const gradeLevels = [
        { value: "11", label: "Grade 11" },
        { value: "12", label: "Grade 12" },
    ];

    const strands = [
        { value: "STEM", label: "STEM" },
        { value: "ABM", label: "ABM" },
        { value: "HUMSS", label: "HUMSS" },
        { value: "GAS", label: "GAS" },
        { value: "TVL-ICT", label: "TVL-ICT" },
        { value: "TVL-HE", label: "TVL-HE" },
        { value: "CORE", label: "Core Subjects" },
    ];

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("superadmin.curriculum.index"),
            { search, grade_level: gradeLevel, strand },
            { preserveState: true }
        );
    };

    const handleFilterChange = (key, value) => {
        const params = { search, grade_level: gradeLevel, strand };
        params[key] = value;
        if (key === "grade_level") setGradeLevel(value);
        if (key === "strand") setStrand(value);
        router.get(route("superadmin.curriculum.index"), params, {
            preserveState: true,
        });
    };

    const handleDelete = () => {
        if (deleteModal.subject) {
            router.delete(
                route("superadmin.curriculum.destroy", deleteModal.subject.id),
                {
                    onSuccess: () =>
                        setDeleteModal({ open: false, subject: null }),
                }
            );
        }
    };

    return (
        <>
            <Head title="Curriculum Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Curriculum Management
                            </h1>
                            <p className="text-slate-500">
                                Manage master subjects and prerequisites
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route("superadmin.curriculum.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                    >
                        <Plus size={18} />
                        Add Subject
                    </Link>
                </div>

                {/* Filters */}
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col lg:flex-row gap-4"
                    >
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={18}
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or code..."
                                className="w-full rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Filter size={16} className="text-slate-500" />
                            </div>
                            <select
                                value={gradeLevel}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "grade_level",
                                        e.target.value
                                    )
                                }
                                className="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                            >
                                <option value="">All Grades</option>
                                {gradeLevels.map((level) => (
                                    <option
                                        key={level.value}
                                        value={level.value}
                                    >
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={strand}
                                onChange={(e) =>
                                    handleFilterChange("strand", e.target.value)
                                }
                                className="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                            >
                                <option value="">All Strands</option>
                                {strands.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Subjects List */}
                <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                    {subjects?.data?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Subject
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Code
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Grade/Strand
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Semester
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Prerequisites
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {subjects.data.map((subject) => (
                                        <tr
                                            key={subject.id}
                                            className="hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600">
                                                        <BookOpen size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {subject.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {subject.units}{" "}
                                                            units
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                    {subject.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap
                                                        size={16}
                                                        className="text-slate-400"
                                                    />
                                                    <span className="text-sm text-slate-600">
                                                        Grade{" "}
                                                        {subject.grade_level}
                                                    </span>
                                                    {subject.strand && (
                                                        <span className="inline-flex rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                                            {subject.strand}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Layers
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
                                                    {subject.semester === 1
                                                        ? "1st Sem"
                                                        : subject.semester === 2
                                                        ? "2nd Sem"
                                                        : "Both"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {subject.prerequisites_count >
                                                0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-md bg-amber-100 flex items-center justify-center">
                                                            <GitBranch
                                                                size={14}
                                                                className="text-amber-600"
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {
                                                                subject.prerequisites_count
                                                            }{" "}
                                                            required
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400">
                                                        None
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        subject.is_active
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-rose-100 text-rose-700"
                                                    }`}
                                                >
                                                    {subject.is_active ? (
                                                        <CheckCircle
                                                            size={12}
                                                        />
                                                    ) : (
                                                        <XCircle size={12} />
                                                    )}
                                                    {subject.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route(
                                                            "superadmin.curriculum.edit",
                                                            subject.id
                                                        )}
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    >
                                                        <Pencil size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            setDeleteModal({
                                                                open: true,
                                                                subject,
                                                            })
                                                        }
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
                                <BookOpen size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                No subjects found
                            </h3>
                            <p className="text-slate-500 mb-4 max-w-sm">
                                {search || gradeLevel || strand
                                    ? "Try adjusting your search or filters"
                                    : "Get started by adding a subject to the curriculum"}
                            </p>
                            {!search && !gradeLevel && !strand && (
                                <Link
                                    href={route("superadmin.curriculum.create")}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                                >
                                    <Plus size={18} />
                                    Add Subject
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {subjects?.links && subjects.links.length > 3 && (
                        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                            <p className="text-sm text-slate-500">
                                Showing{" "}
                                <span className="font-semibold text-slate-700">
                                    {subjects.from}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold text-slate-700">
                                    {subjects.to}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-slate-700">
                                    {subjects.total}
                                </span>{" "}
                                subjects
                            </p>
                            <div className="flex gap-1">
                                {subjects.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || "#"}
                                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                            link.active
                                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                                                : link.url
                                                ? "text-slate-600 hover:bg-slate-100"
                                                : "text-slate-300 cursor-not-allowed"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-4">
                            <AlertTriangle size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            Delete Subject
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-slate-900">
                                {deleteModal.subject?.name}
                            </span>
                            ? This will also remove all prerequisite
                            associations.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() =>
                                    setDeleteModal({
                                        open: false,
                                        subject: null,
                                    })
                                }
                                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all"
                            >
                                Delete Subject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Index.layout = (page) => <SuperAdminLayout children={page} />;

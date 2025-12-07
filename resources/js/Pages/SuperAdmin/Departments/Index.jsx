import { Head, Link, router } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    Building2,
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    ToggleLeft,
    ToggleRight,
    Users,
    GraduationCap,
    UserCog,
    Filter,
    ChevronRight,
    AlertTriangle,
    X,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { useState } from "react";

export default function Index({ departments, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("superadmin.departments.index"),
            { search, status },
            { preserveState: true }
        );
    };

    const handleDelete = (department) => {
        if (
            confirm(
                `Are you sure you want to delete "${department.name}"? This action cannot be undone.`
            )
        ) {
            router.delete(
                route("superadmin.departments.destroy", department.id)
            );
        }
    };

    const handleToggleStatus = (department) => {
        router.post(
            route("superadmin.departments.toggle-status", department.id),
            {},
            { preserveState: true }
        );
    };

    return (
        <>
            <Head title="Departments" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Departments
                            </h1>
                            <p className="text-slate-500">
                                Manage academic departments and their settings
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route("superadmin.departments.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5"
                    >
                        <Plus size={18} />
                        Add Department
                    </Link>
                </div>

                {/* Filters */}
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col md:flex-row gap-4"
                    >
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search departments..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border-slate-200 bg-slate-50/50 pl-11 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
                                <Filter size={16} className="text-slate-400" />
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="border-0 bg-transparent text-sm focus:ring-0 text-slate-600 font-medium pr-8"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                            >
                                Filter
                            </button>
                        </div>
                    </form>
                </div>

                {/* Departments List */}
                <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                    {departments.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <Building2 className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                No departments found
                            </h3>
                            <p className="text-slate-500 mb-6">
                                Get started by creating your first department
                            </p>
                            <Link
                                href={route("superadmin.departments.create")}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25"
                            >
                                <Plus size={18} />
                                Create Department
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Department
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Code
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Admins
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Teachers
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Students
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {departments.data.map((dept) => (
                                        <tr
                                            key={dept.id}
                                            className="hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                                                        <Building2 size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {dept.name}
                                                        </p>
                                                        {dept.description && (
                                                            <p className="text-xs text-slate-500 truncate max-w-xs">
                                                                {
                                                                    dept.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                    {dept.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="h-6 w-6 rounded-md bg-violet-100 flex items-center justify-center">
                                                        <UserCog
                                                            size={12}
                                                            className="text-violet-600"
                                                        />
                                                    </div>
                                                    <span className="font-semibold text-slate-900">
                                                        {dept.admins_count}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="h-6 w-6 rounded-md bg-emerald-100 flex items-center justify-center">
                                                        <Users
                                                            size={12}
                                                            className="text-emerald-600"
                                                        />
                                                    </div>
                                                    <span className="font-semibold text-slate-900">
                                                        {dept.teachers_count}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="h-6 w-6 rounded-md bg-amber-100 flex items-center justify-center">
                                                        <GraduationCap
                                                            size={12}
                                                            className="text-amber-600"
                                                        />
                                                    </div>
                                                    <span className="font-semibold text-slate-900">
                                                        {dept.students_count}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() =>
                                                        handleToggleStatus(dept)
                                                    }
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                                        dept.is_active
                                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                    }`}
                                                >
                                                    {dept.is_active ? (
                                                        <>
                                                            <CheckCircle
                                                                size={12}
                                                            />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle
                                                                size={12}
                                                            />
                                                            Inactive
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route(
                                                            "superadmin.departments.show",
                                                            dept.id
                                                        )}
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                    <Link
                                                        href={route(
                                                            "superadmin.departments.edit",
                                                            dept.id
                                                        )}
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(dept)
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
                    )}

                    {/* Pagination */}
                    {departments.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                            <p className="text-sm text-slate-500">
                                Showing{" "}
                                <span className="font-medium text-slate-700">
                                    {departments.from}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium text-slate-700">
                                    {departments.to}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-slate-700">
                                    {departments.total}
                                </span>{" "}
                                departments
                            </p>
                            <div className="flex gap-1">
                                {departments.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || "#"}
                                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                            link.active
                                                ? "bg-blue-600 text-white"
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
        </>
    );
}

Index.layout = (page) => <SuperAdminLayout children={page} />;

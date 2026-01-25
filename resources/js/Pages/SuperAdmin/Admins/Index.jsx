import { Head, Link, router } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    UserCog,
    Plus,
    Search,
    Pencil,
    Trash2,
    Building2,
    Mail,
    Calendar,
    Filter,
    Users,
    Shield,
    ChevronRight,
    X,
    AlertTriangle,
    Eye,
} from "lucide-react";
import { useState } from "react";

export default function Index({ admins, departments, filters }) {
    const [search, setSearch] = useState(filters?.search || "");
    const [departmentFilter, setDepartmentFilter] = useState(
        filters?.department || "",
    );
    const [deleteModal, setDeleteModal] = useState({
        open: false,
        admin: null,
        password: "",
    });
    const [deleteErrors, setDeleteErrors] = useState({});

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("superadmin.admins.index"),
            { search, department: departmentFilter },
            { preserveState: true },
        );
    };

    const handleDepartmentChange = (value) => {
        setDepartmentFilter(value);
        router.get(
            route("superadmin.admins.index"),
            { search, department: value },
            { preserveState: true },
        );
    };

    const handleDelete = () => {
        if (deleteModal.admin) {
            router.delete(
                route("superadmin.admins.destroy", deleteModal.admin.id),
                {
                    data: { password: deleteModal.password },
                    onSuccess: () => {
                        setDeleteModal({
                            open: false,
                            admin: null,
                            password: "",
                        });
                        setDeleteErrors({});
                    },
                    onError: (errors) => {
                        setDeleteErrors(errors);
                    },
                },
            );
        }
    };

    return (
        <>
            <Head title="Admin Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <UserCog className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Admin Management
                            </h1>
                            <p className="text-slate-500">
                                Manage department administrators across the
                                system
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route("superadmin.admins.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5"
                    >
                        <Plus size={18} />
                        Add Admin
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
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full rounded-xl border-slate-200 bg-slate-50/50 pl-11 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
                                <Filter size={16} className="text-slate-400" />
                                <select
                                    value={departmentFilter}
                                    onChange={(e) =>
                                        handleDepartmentChange(e.target.value)
                                    }
                                    className="border-0 bg-transparent text-sm focus:ring-0 text-slate-600 font-medium pr-8"
                                >
                                    <option value="">All Departments</option>
                                    {departments?.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>

                {/* Admins List */}
                <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                    {admins?.data?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Admin
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Department
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Created
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {admins.data.map((admin) => (
                                        <tr
                                            key={admin.id}
                                            className="hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold shadow-sm">
                                                        {admin.name
                                                            ?.charAt(0)
                                                            .toUpperCase() ||
                                                            "A"}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {admin.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Shield size={10} />
                                                            {admin.role}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                        <Building2
                                                            size={14}
                                                            className="text-blue-600"
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {admin.department
                                                            ?.name ||
                                                            "Unassigned"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Mail
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
                                                    <span className="text-sm text-slate-600">
                                                        {admin.email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
                                                    <span className="text-sm text-slate-500">
                                                        {new Date(
                                                            admin.created_at,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route(
                                                            "superadmin.admins.show",
                                                            admin.id,
                                                        )}
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                    <Link
                                                        href={route(
                                                            "superadmin.admins.edit",
                                                            admin.id,
                                                        )}
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                        title="Edit Admin"
                                                    >
                                                        <Pencil size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setDeleteModal({
                                                                open: true,
                                                                admin,
                                                                password: "",
                                                            });
                                                            setDeleteErrors({});
                                                        }}
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                        title="Delete Admin"
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
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <UserCog size={36} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                No admins found
                            </h3>
                            <p className="text-slate-500 mb-6 max-w-sm">
                                {search || departmentFilter
                                    ? "Try adjusting your search or filter criteria"
                                    : "Get started by creating a new department administrator"}
                            </p>
                            {!search && !departmentFilter && (
                                <Link
                                    href={route("superadmin.admins.create")}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                                >
                                    <Plus size={18} />
                                    Add Admin
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {admins?.links && admins.links.length > 3 && (
                        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                            <p className="text-sm text-slate-500">
                                Showing{" "}
                                <span className="font-medium text-slate-700">
                                    {admins.from}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium text-slate-700">
                                    {admins.to}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-slate-700">
                                    {admins.total}
                                </span>{" "}
                                results
                            </p>
                            <div className="flex gap-1">
                                {admins.links.map((link, index) => (
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

            {/* Delete Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() =>
                            setDeleteModal({
                                open: false,
                                admin: null,
                                password: "",
                            })
                        }
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <button
                            onClick={() => {
                                setDeleteModal({
                                    open: false,
                                    admin: null,
                                    password: "",
                                });
                                setDeleteErrors({});
                            }}
                            className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-5">
                            <AlertTriangle size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            Delete Admin
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-slate-700">
                                {deleteModal.admin?.first_name}{" "}
                                {deleteModal.admin?.last_name}
                            </span>
                            ? This action cannot be undone.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Enter your password to confirm deletion *
                            </label>
                            <input
                                type="password"
                                value={deleteModal.password}
                                onChange={(e) =>
                                    setDeleteModal({
                                        ...deleteModal,
                                        password: e.target.value,
                                    })
                                }
                                placeholder="Your password"
                                className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                                    deleteErrors.password
                                        ? "border-rose-500 focus:ring-rose-500/50"
                                        : "border-slate-200 focus:ring-blue-500/50"
                                }`}
                            />
                            {deleteErrors.password && (
                                <p className="text-sm text-rose-600 mt-2">
                                    {deleteErrors.password}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setDeleteModal({
                                        open: false,
                                        admin: null,
                                        password: "",
                                    });
                                    setDeleteErrors({});
                                }}
                                className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/25"
                            >
                                Delete Admin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Index.layout = (page) => <SuperAdminLayout children={page} />;

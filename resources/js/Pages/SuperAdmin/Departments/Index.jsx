import { Head, Link, router } from "@inertiajs/react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import {
    Building2,
    Plus,
    Search,
    Users,
    GraduationCap,
    UserCog,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";

import DepartmentDetailModal from "@/Components/Superadmin/DepartmentDetailModal";

export default function Index({ departments, filters, trackOptions = [] }) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");
    const [activeTrack, setActiveTrack] = useState(filters.track || "Academic");
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [departmentModalMode, setDepartmentModalMode] = useState("view");

    useEffect(() => {
        setSearch(filters.search || "");
        setStatus(filters.status || "");
        setActiveTrack(filters.track || "Academic");
    }, [filters.search, filters.status, filters.track]);

    const openModal = (dept) => {
        setSelectedDepartment(dept);
        setDepartmentModalMode("view");
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
        setSelectedDepartment(null);
        setDepartmentModalMode("view");
    };

    const openCreateModal = () => {
        setSelectedDepartment(null);
        setDepartmentModalMode("create");
        setShowModal(true);
    };

    const openEditModal = (dept) => {
        setSelectedDepartment(dept);
        setDepartmentModalMode("edit");
        setShowModal(true);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("superadmin.departments.index"),
            { search, status, track: activeTrack },
            { preserveState: true },
        );
    };

    const handleToggleStatus = (department) => {
        router.post(
            route("superadmin.departments.toggle-status", department.id),
            {},
            { preserveState: true },
        );
    };

    // Summary stats from current page data
    const totalActive = departments.data.filter((d) => d.is_active).length;
    const totalInactive = departments.data.filter((d) => !d.is_active).length;
    const totalMembers = departments.data.reduce(
        (sum, d) =>
            sum +
            (d.admins_count || 0) +
            (d.teachers_count || 0) +
            (d.students_count || 0),
        0,
    );

    return (
        <>
            <Head title="Departments" />

            <div className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Departments
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage academic departments and their settings
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            {totalActive} Active
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                            {totalInactive} Inactive
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <Users size={12} />
                            {totalMembers} Members
                        </div>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                        >
                            <Plus size={16} />
                            Add Department
                        </button>
                    </div>
                </div>

                {/* ── Search & Filter Bar ──────────────────────────────── */}
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4">
                    <div className="mb-3 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                        {(trackOptions.length > 0
                            ? trackOptions
                            : ["Academic", "TVL"]
                        ).map((track) => (
                            <button
                                key={track}
                                type="button"
                                onClick={() => {
                                    setActiveTrack(track);
                                    router.get(
                                        route("superadmin.departments.index"),
                                        {
                                            search,
                                            status,
                                            track,
                                        },
                                        { preserveState: true },
                                    );
                                }}
                                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                                    activeTrack === track
                                        ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {track}
                            </button>
                        ))}
                    </div>

                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col sm:flex-row gap-3"
                    >
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                size={16}
                            />
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-10 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        router.get(
                                            route(
                                                "superadmin.departments.index",
                                            ),
                                            {
                                                status,
                                                track: activeTrack,
                                            },
                                            { preserveState: true },
                                        );
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Status filter as tabs */}
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 gap-0.5">
                            {[
                                { value: "", label: "All" },
                                { value: "active", label: "Active" },
                                { value: "inactive", label: "Inactive" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        setStatus(opt.value);
                                        router.get(
                                            route(
                                                "superadmin.departments.index",
                                            ),
                                            {
                                                search,
                                                status: opt.value,
                                                track: activeTrack,
                                            },
                                            { preserveState: true },
                                        );
                                    }}
                                    className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                                        status === opt.value
                                            ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* ── Departments Table ────────────────────────────────── */}
                <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                    {departments.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                            <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <Building2 className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 mb-1">
                                No departments found
                            </h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-xs">
                                {search || status
                                    ? "Try adjusting your search or filter."
                                    : "Get started by creating your first department."}
                            </p>
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                            >
                                <Plus size={16} />
                                Create Department
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100">
                                <div className="col-span-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Department
                                </div>
                                <div className="col-span-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Code
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                                    Members
                                </div>
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                                    Status
                                </div>
                                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                                    Actions
                                </div>
                            </div>

                            {/* Table rows */}
                            <div className="divide-y divide-slate-50">
                                {departments.data.map((dept) => (
                                    <div
                                        key={dept.id}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/60 transition-colors group cursor-pointer"
                                        onClick={() => openModal(dept)}
                                    >
                                        {/* Department name */}
                                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                                <Building2 size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm truncate">
                                                    {dept.department_name}
                                                </p>
                                                {dept.description && (
                                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                                        {dept.description}
                                                    </p>
                                                )}
                                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                                    Track:{" "}
                                                    {dept.track || "Academic"}
                                                </p>
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    {Array.isArray(
                                                        dept.specializations,
                                                    ) &&
                                                    dept.specializations
                                                        .length > 0
                                                        ? `Specializations: ${dept.specializations
                                                              .map(
                                                                  (item) =>
                                                                      item.specialization_name,
                                                              )
                                                              .join(", ")}`
                                                        : "Specializations: None"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Code */}
                                        <div className="col-span-1">
                                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 tracking-wide">
                                                {dept.department_code}
                                            </span>
                                        </div>

                                        {/* Members — compact icon trio */}
                                        <div className="col-span-2 flex items-center justify-center gap-3">
                                            <div
                                                className="flex items-center gap-1"
                                                title="Admins"
                                            >
                                                <div className="h-5 w-5 rounded-md bg-violet-100 flex items-center justify-center">
                                                    <UserCog
                                                        size={10}
                                                        className="text-violet-600"
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">
                                                    {dept.admins_count}
                                                </span>
                                            </div>
                                            <div
                                                className="flex items-center gap-1"
                                                title="Teachers"
                                            >
                                                <div className="h-5 w-5 rounded-md bg-emerald-100 flex items-center justify-center">
                                                    <Users
                                                        size={10}
                                                        className="text-emerald-600"
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">
                                                    {dept.teachers_count}
                                                </span>
                                            </div>
                                            <div
                                                className="flex items-center gap-1"
                                                title="Students"
                                            >
                                                <div className="h-5 w-5 rounded-md bg-amber-100 flex items-center justify-center">
                                                    <GraduationCap
                                                        size={10}
                                                        className="text-amber-600"
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">
                                                    {dept.students_count}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status toggle */}
                                        <div className="col-span-2 flex justify-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleStatus(dept);
                                                }}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                                                    dept.is_active
                                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                }`}
                                            >
                                                <div
                                                    className={`h-1.5 w-1.5 rounded-full ${dept.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                                                />
                                                {dept.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </button>
                                        </div>

                                        {/* Actions */}
                                        <div
                                            className="col-span-3 flex items-center justify-end gap-1.5"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => openModal(dept)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() =>
                                                    openEditModal(dept)
                                                }
                                                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {departments.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                                    <p className="text-xs text-slate-500">
                                        Showing{" "}
                                        <span className="font-semibold text-slate-700">
                                            {departments.from}–{departments.to}
                                        </span>{" "}
                                        of{" "}
                                        <span className="font-semibold text-slate-700">
                                            {departments.total}
                                        </span>{" "}
                                        departments
                                    </p>
                                    <div className="flex gap-1">
                                        {departments.links.map(
                                            (link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || "#"}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                        link.active
                                                            ? "bg-emerald-600 text-white shadow-sm"
                                                            : link.url
                                                              ? "text-slate-600 hover:bg-slate-100"
                                                              : "text-slate-300 cursor-not-allowed"
                                                    }`}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <DepartmentDetailModal
                show={showModal}
                onClose={closeModal}
                payload={
                    selectedDepartment
                        ? {
                              department: {
                                  id: selectedDepartment.id,
                                  name: selectedDepartment.department_name,
                                  code: selectedDepartment.department_code,
                                  track: selectedDepartment.track || "Academic",
                                  description:
                                      selectedDepartment.description || null,
                                  is_active: Boolean(
                                      selectedDepartment.is_active,
                                  ),
                                  specializations: Array.isArray(
                                      selectedDepartment.specializations,
                                  )
                                      ? selectedDepartment.specializations
                                      : [],
                                  admins: Array.isArray(
                                      selectedDepartment.department_admins,
                                  )
                                      ? selectedDepartment.department_admins
                                      : [],
                                  teachers: Array.isArray(
                                      selectedDepartment.department_teachers,
                                  )
                                      ? selectedDepartment.department_teachers
                                      : [],
                                  classes_count:
                                      selectedDepartment.classes_count ?? 0,
                              },
                              sections: [],
                          }
                        : {
                              department: {
                                  id: null,
                                  name: "",
                                  code: "",
                                  track: activeTrack || "Academic",
                                  description: "",
                                  is_active: true,
                                  specializations: [],
                                  admins: [],
                                  teachers: [],
                                  classes_count: 0,
                              },
                              sections: [],
                          }
                }
                loading={false}
                error=""
                row={selectedDepartment}
                mode={departmentModalMode}
                onSaved={() => router.reload({ only: ["departments"] })}
            />
        </>
    );
}

Index.layout = (page) => <SchoolStaffLayout children={page} />;

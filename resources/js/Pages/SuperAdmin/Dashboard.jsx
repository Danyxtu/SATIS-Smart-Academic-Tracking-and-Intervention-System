import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import UnifiedDashboardSwitcher from "@/Components/UnifiedDashboardSwitcher";
import {
    Building2,
    Users,
    GraduationCap,
    BookOpen,
    UserCog,
    Calendar,
    ArrowRight,
    Settings,
    ChevronRight,
    Zap,
    CheckCircle2,
    AlertCircle,
    BarChart3,
} from "lucide-react";

export default function Dashboard({
    stats,
    recentAdmins = [],
    departments = [],
    currentSettings,
    currentYearStatus = {},
}) {
    const [activeTab, setActiveTab] = useState("overview");

    const formatCount = (value) =>
        new Intl.NumberFormat().format(Number(value || 0));

    const schoolYearLabel =
        currentYearStatus.school_year || currentSettings?.school_year || "N/A";
    const semesterLabel =
        currentYearStatus.semester || currentSettings?.semester || "-";

    const departmentAssignments =
        currentYearStatus.department_assignments || [];
    const totalDepartments = Number(currentYearStatus.departments_total || 0);
    const departmentsWithAdmin = Number(
        currentYearStatus.departments_with_admin || 0,
    );
    const adminCoverage =
        totalDepartments > 0
            ? Math.round((departmentsWithAdmin / totalDepartments) * 100)
            : 0;

    const statCards = [
        {
            name: "Departments",
            value: stats.total_departments,
            subtext: `${stats.active_departments} active`,
            icon: Building2,
            gradient: "from-emerald-500 to-green-600",
            bgLight: "bg-emerald-50",
            textColor: "text-emerald-600",
            shadowColor: "shadow-emerald-500/20",
            href: route("superadmin.departments.index"),
        },
        {
            name: "Admins",
            value: stats.total_admins,
            subtext: "Department admins",
            icon: UserCog,
            gradient: "from-green-500 to-emerald-600",
            bgLight: "bg-green-50",
            textColor: "text-green-600",
            shadowColor: "shadow-green-500/20",
            href: route("superadmin.users.index", { role: "admin" }),
        },
        {
            name: "Teachers",
            value: stats.total_teachers,
            subtext: "All departments",
            icon: Users,
            gradient: "from-teal-500 to-emerald-600",
            bgLight: "bg-emerald-50",
            textColor: "text-emerald-600",
            shadowColor: "shadow-emerald-500/20",
            href: route("superadmin.users.index", { role: "teacher" }),
        },
        {
            name: "Students",
            value: stats.total_students,
            subtext: "All departments",
            icon: GraduationCap,
            gradient: "from-lime-500 to-emerald-600",
            bgLight: "bg-lime-50",
            textColor: "text-lime-700",
            shadowColor: "shadow-lime-500/20",
            href: route("superadmin.users.index", { role: "student" }),
        },
        {
            name: "Pending Password Requests",
            value: stats.pending_password_reset_requests,
            subtext: "Teacher and student requests",
            icon: AlertCircle,
            gradient: "from-rose-500 to-red-600",
            bgLight: "bg-rose-50",
            textColor: "text-rose-600",
            shadowColor: "shadow-rose-500/20",
            href: route("superadmin.password-reset-requests"),
        },
    ];

    const quickActions = [
        {
            name: "Add Department",
            description: "Create a new academic department",
            icon: Building2,
            href: route("superadmin.departments.index"),
            color: "from-emerald-500 to-green-600",
            shadow: "shadow-emerald-500/30",
        },
        {
            name: "Add Admin",
            description: "Assign a department administrator",
            icon: UserCog,
            href: route("superadmin.admins.create"),
            color: "from-green-500 to-emerald-600",
            shadow: "shadow-green-500/30",
        },
        {
            name: "School Settings",
            description: "Configure school-wide settings",
            icon: Settings,
            href: route("superadmin.settings.index"),
            color: "from-emerald-600 to-teal-600",
            shadow: "shadow-emerald-500/30",
        },
    ];

    const currentYearCards = useMemo(
        () => [
            {
                name: "Students Enrolled",
                value: currentYearStatus.students_enrolled,
                subtext: `SY ${schoolYearLabel}`,
                icon: GraduationCap,
                gradient: "from-amber-500 to-orange-500",
            },
            {
                name: "Teachers Handling Classes",
                value: currentYearStatus.teachers_handling_classes,
                subtext: `${formatCount(currentYearStatus.overall_teachers)} total teachers`,
                icon: Users,
                gradient: "from-emerald-500 to-teal-600",
            },
            {
                name: "Classes Created",
                value: currentYearStatus.classes_created,
                subtext: "Active class offerings",
                icon: BookOpen,
                gradient: "from-blue-500 to-indigo-600",
            },
            {
                name: "Departments Added",
                value: currentYearStatus.departments_total,
                subtext: `${formatCount(
                    currentYearStatus.departments_with_admin,
                )} with assigned admin`,
                icon: Building2,
                gradient: "from-fuchsia-500 to-pink-600",
            },
            {
                name: "Overall Admins",
                value: currentYearStatus.overall_admins,
                subtext: "System-wide admins",
                icon: UserCog,
                gradient: "from-violet-500 to-purple-600",
            },
            {
                name: "Admin Coverage",
                value: `${adminCoverage}%`,
                subtext: `${formatCount(departmentsWithAdmin)} of ${formatCount(totalDepartments)} departments covered`,
                icon: CheckCircle2,
                gradient: "from-slate-700 to-slate-900",
            },
        ],
        [
            adminCoverage,
            currentYearStatus.classes_created,
            currentYearStatus.departments_total,
            currentYearStatus.departments_with_admin,
            currentYearStatus.overall_admins,
            currentYearStatus.overall_teachers,
            currentYearStatus.students_enrolled,
            currentYearStatus.teachers_handling_classes,
            departmentsWithAdmin,
            schoolYearLabel,
            totalDepartments,
        ],
    );

    const dashboardTabs = [
        {
            id: "overview",
            label: "System Overview",
            description: "Global totals and latest activity",
            icon: BarChart3,
        },
        {
            id: "current-year",
            label: "Current School Year",
            description: `${schoolYearLabel} · Semester ${semesterLabel}`,
            icon: Calendar,
        },
    ];

    const heroTitle =
        activeTab === "overview"
            ? "System Overview"
            : "Current School Year Status";
    const heroSubtitle =
        activeTab === "overview"
            ? "Manage departments, administrators, and system-wide settings"
            : "Track enrollment, teaching load, class creation, and admin assignment coverage";

    return (
        <>
            <Head title="Super Admin Dashboard" />

            <div className="space-y-6">
                <UnifiedDashboardSwitcher />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {heroTitle}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {heroSubtitle}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <Calendar size={13} />
                            {schoolYearLabel} · Sem {semesterLabel}
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Enrollment Open
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Grades Open
                        </div>
                    </div>
                </div>

                {/* ── Dashboard Tabs ─────────────────────────────────── */}
                <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {dashboardTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                                        isActive
                                            ? "border-emerald-200 bg-emerald-50 shadow-sm"
                                            : "border-slate-100 bg-white hover:bg-slate-50"
                                    }`}
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                            isActive
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-slate-100 text-slate-500"
                                        }`}
                                    >
                                        <Icon size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p
                                            className={`text-sm font-semibold ${
                                                isActive
                                                    ? "text-slate-900"
                                                    : "text-slate-700"
                                            }`}
                                        >
                                            {tab.label}
                                        </p>
                                        <p className="truncate text-xs text-slate-500">
                                            {tab.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {activeTab === "overview" ? (
                    <>
                        {/* ── Stat Cards ─────────────────────────────── */}
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
                            {statCards.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <Link
                                        key={stat.name}
                                        href={stat.href}
                                        className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
                                    >
                                        <div className="mb-4 flex items-start justify-between">
                                            <div
                                                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md ${stat.shadowColor}`}
                                            >
                                                <Icon className="h-5 w-5 text-white" />
                                            </div>
                                            <ChevronRight
                                                size={16}
                                                className="mt-0.5 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-500"
                                            />
                                        </div>

                                        <p className="text-3xl font-bold tabular-nums text-slate-900">
                                            {formatCount(stat.value)}
                                        </p>
                                        <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                            {stat.name}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {stat.subtext}
                                        </p>

                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
                                            <div
                                                className={`h-full w-3/5 bg-gradient-to-r ${stat.gradient} transition-all duration-500 group-hover:w-full`}
                                            />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* ── Main Content Grid ─────────────────────── */}
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                            <div className="xl:col-span-2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                                            <Building2 className="h-5 w-5 text-emerald-700" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-slate-900">
                                                Departments
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                Academic departments overview
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route(
                                            "superadmin.departments.index",
                                        )}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
                                    >
                                        View all <ArrowRight size={13} />
                                    </Link>
                                </div>

                                {departments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                            <Building2 className="h-7 w-7 text-slate-400" />
                                        </div>
                                        <p className="mb-3 text-sm text-slate-500">
                                            No departments yet
                                        </p>
                                        <Link
                                            href={route(
                                                "superadmin.departments.index",
                                            )}
                                            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                                        >
                                            Create your first department
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {departments.map((dept) => (
                                            <div
                                                key={dept.id}
                                                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/60"
                                            >
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                                    <Building2 size={18} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold text-slate-900">
                                                        {dept.name}
                                                    </p>
                                                    <span className="mt-0.5 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                        {dept.code}
                                                    </span>
                                                </div>

                                                <div className="hidden items-center gap-6 md:flex">
                                                    <div className="text-center">
                                                        <p className="text-base font-bold text-slate-900">
                                                            {formatCount(
                                                                dept.admins_count,
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                            Admins
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-base font-bold text-slate-900">
                                                            {formatCount(
                                                                dept.teachers_count,
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                            Teachers
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-base font-bold text-slate-900">
                                                            {formatCount(
                                                                dept.students_count,
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                            Students
                                                        </p>
                                                    </div>
                                                </div>

                                                <div
                                                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                                        dept.is_active
                                                            ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                                                            : "bg-slate-300"
                                                    }`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                                            <UserCog className="h-5 w-5 text-emerald-700" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-slate-900">
                                                Recent Admins
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                Latest accounts
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route("superadmin.admins.index")}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
                                    >
                                        View all <ArrowRight size={13} />
                                    </Link>
                                </div>

                                {recentAdmins.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                            <UserCog className="h-7 w-7 text-slate-400" />
                                        </div>
                                        <p className="mb-3 text-sm text-slate-500">
                                            No admins yet
                                        </p>
                                        <Link
                                            href={route(
                                                "superadmin.admins.create",
                                            )}
                                            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                                        >
                                            Add your first admin
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-2 p-4">
                                        {recentAdmins.map((admin) => (
                                            <div
                                                key={admin.id}
                                                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100/80"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm">
                                                    {(admin.name || "A")
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                        {admin.name ||
                                                            "Unknown"}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-400">
                                                        {admin.email}
                                                    </p>
                                                </div>
                                                <span className="inline-flex shrink-0 items-center rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                                    {admin.department}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* ── Current School Year KPI Cards ─────────── */}
                        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                            {currentYearCards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <div
                                        key={card.name}
                                        className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                                    >
                                        <div className="mb-4 flex items-start justify-between">
                                            <div
                                                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-md`}
                                            >
                                                <Icon size={18} />
                                            </div>
                                        </div>

                                        <p className="text-3xl font-bold tabular-nums text-slate-900">
                                            {typeof card.value === "string"
                                                ? card.value
                                                : formatCount(card.value)}
                                        </p>
                                        <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                            {card.name}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {card.subtext}
                                        </p>

                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
                                            <div
                                                className={`h-full w-4/5 bg-gradient-to-r ${card.gradient}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Department/Admin Assignment ───────────── */}
                        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                                        <Building2 className="h-5 w-5 text-emerald-700" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            Department Admin Assignment
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Department coverage for SY{" "}
                                            {schoolYearLabel}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 size={14} />
                                        {formatCount(departmentsWithAdmin)} with
                                        admin
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                        <AlertCircle size={14} />
                                        {formatCount(
                                            currentYearStatus.departments_without_admin,
                                        )}{" "}
                                        no admin
                                    </span>
                                </div>
                            </div>

                            {departmentAssignments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                                        <Building2 className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        No department records yet.
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Add a department and assign an admin to
                                        improve governance visibility.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                    Department
                                                </th>
                                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                    Assigned Admin
                                                </th>
                                                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                    Classes
                                                </th>
                                                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                    Enrolled Students
                                                </th>
                                                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {departmentAssignments.map(
                                                (dept) => (
                                                    <tr
                                                        key={dept.id}
                                                        className="transition-colors hover:bg-slate-50/70"
                                                    >
                                                        <td className="px-6 py-4 align-top">
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {dept.name}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                {dept.code}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 align-top">
                                                            {dept.admin_count >
                                                            0 ? (
                                                                <div className="space-y-1">
                                                                    {dept.admins.map(
                                                                        (
                                                                            admin,
                                                                        ) => (
                                                                            <p
                                                                                key={`${dept.id}-${admin.id}`}
                                                                                className="text-sm text-slate-700"
                                                                            >
                                                                                {
                                                                                    admin.name
                                                                                }
                                                                            </p>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                                                                    Unassigned
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right align-top text-sm font-semibold tabular-nums text-slate-900">
                                                            {formatCount(
                                                                dept.classes_count,
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right align-top text-sm font-semibold tabular-nums text-slate-900">
                                                            {formatCount(
                                                                dept.students_enrolled_count,
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right align-top">
                                                            <span
                                                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                                                                    dept.is_active
                                                                        ? "bg-emerald-50 text-emerald-700"
                                                                        : "bg-slate-100 text-slate-600"
                                                                }`}
                                                            >
                                                                {dept.is_active
                                                                    ? "Active"
                                                                    : "Inactive"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ── Quick Actions ────────────────────────────────────── */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                            <Zap size={16} className="text-emerald-700" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Quick Actions
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link
                                    key={action.name}
                                    href={action.href}
                                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
                                >
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-md ${action.shadow}`}
                                    >
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {action.name}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-slate-500">
                                            {action.description}
                                        </p>
                                    </div>
                                    <ArrowRight
                                        size={16}
                                        className="shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-slate-600"
                                    />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page) => <SchoolStaffLayout children={page} />;

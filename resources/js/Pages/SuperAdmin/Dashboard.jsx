import { Head, Link } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    Building2,
    Users,
    GraduationCap,
    BookOpen,
    UserCog,
    Calendar,
    TrendingUp,
    ArrowRight,
    Sparkles,
    Activity,
    Shield,
    Settings,
    ChevronRight,
    Plus,
    Zap,
    CheckCircle,
    XCircle,
    BarChart3,
    Globe,
} from "lucide-react";

export default function Dashboard({
    stats,
    recentAdmins = [],
    departments = [],
    currentSettings,
}) {
    const statCards = [
        {
            name: "Departments",
            value: stats.total_departments,
            subtext: `${stats.active_departments} active`,
            icon: Building2,
            gradient: "from-blue-500 to-indigo-600",
            bgLight: "bg-blue-50",
            textColor: "text-blue-600",
            shadowColor: "shadow-blue-500/20",
            href: route("superadmin.departments.index"),
        },
        {
            name: "Admins",
            value: stats.total_admins,
            subtext: "Department admins",
            icon: UserCog,
            gradient: "from-violet-500 to-purple-600",
            bgLight: "bg-violet-50",
            textColor: "text-violet-600",
            shadowColor: "shadow-violet-500/20",
            href: route("superadmin.users.index", { role: "admin" }),
        },
        {
            name: "Teachers",
            value: stats.total_teachers,
            subtext: "All departments",
            icon: Users,
            gradient: "from-emerald-500 to-teal-600",
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
            gradient: "from-amber-500 to-orange-500",
            bgLight: "bg-amber-50",
            textColor: "text-amber-600",
            shadowColor: "shadow-amber-500/20",
            href: route("superadmin.users.index", { role: "student" }),
        },
    ];

    const quickActions = [
        {
            name: "Add Department",
            description: "Create a new academic department",
            icon: Building2,
            href: route("superadmin.departments.index"),
            color: "from-blue-500 to-indigo-600",
            shadow: "shadow-blue-500/30",
        },
        {
            name: "Add Admin",
            description: "Assign a department administrator",
            icon: UserCog,
            href: route("superadmin.admins.create"),
            color: "from-violet-500 to-purple-600",
            shadow: "shadow-violet-500/30",
        },
        {
            name: "System Settings",
            description: "Configure global settings",
            icon: Settings,
            href: route("superadmin.settings.index"),
            color: "from-slate-600 to-slate-700",
            shadow: "shadow-slate-500/30",
        },
    ];

    return (
        <>
            <Head title="Super Admin Dashboard" />

            <div className="space-y-6">
                {/* ── Hero Banner ──────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-7 shadow-xl">
                    <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl" />
                    <div className="absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl" />

                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Left: Title */}
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                                <Shield className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">
                                    Super Admin Panel
                                </p>
                                <h1 className="text-2xl font-bold text-white">
                                    System Overview
                                </h1>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    Manage departments, administrators, and
                                    system-wide settings
                                </p>
                            </div>
                        </div>

                        {/* Right: Academic Period + System Status */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Academic period pill */}
                            <div className="flex items-center gap-3 rounded-xl bg-white/8 border border-white/10 px-4 py-3 backdrop-blur-sm">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
                                    <Calendar
                                        className="h-4.5 w-4.5 text-blue-300"
                                        size={18}
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Academic Period
                                    </p>
                                    <p className="text-sm font-bold text-white">
                                        {currentSettings.school_year} · Sem{" "}
                                        {currentSettings.semester}
                                    </p>
                                </div>
                            </div>

                            {/* System status pills */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 rounded-lg bg-white/8 border border-white/10 px-3 py-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-xs font-medium text-slate-300">
                                        Enrollment Open
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg bg-white/8 border border-white/10 px-3 py-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-xs font-medium text-slate-300">
                                        Grades Open
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards ──────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Link
                                key={stat.name}
                                href={stat.href}
                                className="group relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
                            >
                                {/* Top row: icon + arrow */}
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md ${stat.shadowColor}`}
                                    >
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <ChevronRight
                                        size={16}
                                        className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all mt-0.5"
                                    />
                                </div>

                                {/* Value */}
                                <p className="text-3xl font-bold text-slate-900 tabular-nums">
                                    {stat.value ?? 0}
                                </p>
                                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                    {stat.name}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {stat.subtext}
                                </p>

                                {/* Bottom accent bar */}
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
                                    <div
                                        className={`h-full w-3/5 bg-gradient-to-r ${stat.gradient} group-hover:w-full transition-all duration-500`}
                                    />
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* ── Main Content Grid ────────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Departments (2/3) */}
                    <div className="xl:col-span-2 rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                                    <Building2 className="h-5 w-5 text-blue-600" />
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
                                href={route("superadmin.departments.index")}
                                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                View all <ArrowRight size={13} />
                            </Link>
                        </div>

                        {departments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                    <Building2 className="h-7 w-7 text-slate-400" />
                                </div>
                                <p className="text-slate-500 text-sm mb-3">
                                    No departments yet
                                </p>
                                <Link
                                    href={route("superadmin.departments.index")}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    Create your first department
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {departments.map((dept) => {
                                    const total =
                                        (dept.admins_count || 0) +
                                        (dept.teachers_count || 0) +
                                        (dept.students_count || 0);
                                    return (
                                        <div
                                            key={dept.id}
                                            className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors"
                                        >
                                            {/* Icon */}
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                                                <Building2 size={18} />
                                            </div>

                                            {/* Name + code */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">
                                                    {dept.name}
                                                </p>
                                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 mt-0.5">
                                                    {dept.code}
                                                </span>
                                            </div>

                                            {/* Stats */}
                                            <div className="hidden md:flex items-center gap-6">
                                                <div className="text-center">
                                                    <p className="text-base font-bold text-slate-900">
                                                        {dept.admins_count ?? 0}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                        Admins
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-base font-bold text-slate-900">
                                                        {dept.teachers_count ??
                                                            0}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                        Teachers
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-base font-bold text-slate-900">
                                                        {dept.students_count ??
                                                            0}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                        Students
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status dot */}
                                            <div
                                                className={`h-2.5 w-2.5 rounded-full shrink-0 ${dept.is_active ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-300"}`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Recent Admins (1/3) */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                                    <UserCog className="h-5 w-5 text-violet-600" />
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
                                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                View all <ArrowRight size={13} />
                            </Link>
                        </div>

                        {recentAdmins.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                    <UserCog className="h-7 w-7 text-slate-400" />
                                </div>
                                <p className="text-slate-500 text-sm mb-3">
                                    No admins yet
                                </p>
                                <Link
                                    href={route("superadmin.admins.create")}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    Add your first admin
                                </Link>
                            </div>
                        ) : (
                            <div className="p-4 space-y-2">
                                {recentAdmins.map((admin) => (
                                    <div
                                        key={admin.id}
                                        className="flex items-center gap-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 p-3 transition-colors"
                                    >
                                        {/* Avatar */}
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-bold shadow-sm">
                                            {(admin.name || "A")
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 text-sm truncate">
                                                {admin.name || "Unknown"}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">
                                                {admin.email}
                                            </p>
                                        </div>
                                        <span className="shrink-0 inline-flex items-center rounded-lg bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700">
                                            {admin.department}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Quick Actions ────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-7 shadow-xl">
                    <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

                    <div className="relative">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                                <Zap size={16} className="text-amber-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">
                                Quick Actions
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {quickActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={action.name}
                                        href={action.href}
                                        className="group flex items-center gap-4 rounded-2xl bg-white/6 border border-white/10 p-5 backdrop-blur-sm transition-all duration-200 hover:bg-white/12 hover:border-white/20 hover:-translate-y-0.5"
                                    >
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg ${action.shadow} group-hover:scale-105 transition-transform`}
                                        >
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white text-sm">
                                                {action.name}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                                                {action.description}
                                            </p>
                                        </div>
                                        <ArrowRight
                                            size={16}
                                            className="text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all shrink-0"
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page) => <SuperAdminLayout children={page} />;

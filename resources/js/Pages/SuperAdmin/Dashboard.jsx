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
} from "lucide-react";

export default function Dashboard({
    stats,
    recentAdmins,
    departments,
    currentSettings,
}) {
    const statCards = [
        {
            name: "Departments",
            value: stats.total_departments,
            subtext: `${stats.active_departments} active`,
            icon: Building2,
            gradient: "from-blue-500 to-blue-600",
            bgLight: "bg-blue-50",
            textColor: "text-blue-600",
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
            href: route("superadmin.admins.index"),
        },
        {
            name: "Teachers",
            value: stats.total_teachers,
            subtext: "All departments",
            icon: Users,
            gradient: "from-emerald-500 to-teal-600",
            bgLight: "bg-emerald-50",
            textColor: "text-emerald-600",
            href: "#",
        },
        {
            name: "Students",
            value: stats.total_students,
            subtext: "All departments",
            icon: GraduationCap,
            gradient: "from-amber-500 to-orange-600",
            bgLight: "bg-amber-50",
            textColor: "text-amber-600",
            href: "#",
        },
        {
            name: "Subjects",
            value: stats.total_subjects,
            subtext: `${stats.active_subjects} active`,
            icon: BookOpen,
            gradient: "from-rose-500 to-pink-600",
            bgLight: "bg-rose-50",
            textColor: "text-rose-600",
            href: route("superadmin.curriculum.index"),
        },
    ];

    const quickActions = [
        {
            name: "Add Department",
            description: "Create a new academic department",
            icon: Building2,
            href: route("superadmin.departments.create"),
            color: "from-blue-500 to-indigo-600",
        },
        {
            name: "Add Admin",
            description: "Assign a department administrator",
            icon: UserCog,
            href: route("superadmin.admins.create"),
            color: "from-violet-500 to-purple-600",
        },
        {
            name: "Add Subject",
            description: "Add to master curriculum",
            icon: BookOpen,
            href: route("superadmin.curriculum.create"),
            color: "from-emerald-500 to-teal-600",
        },
        {
            name: "Settings",
            description: "Configure system settings",
            icon: Settings,
            href: route("superadmin.settings.index"),
            color: "from-slate-600 to-slate-700",
        },
    ];

    return (
        <>
            <Head title="Super Admin Dashboard" />

            <div className="space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
                    <div className="absolute inset-0 bg-grid-white/5" />
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                                    <Shield className="h-4 w-4 text-blue-400" />
                                </div>
                                <span className="text-sm font-medium text-blue-400">
                                    Super Admin Panel
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                System Overview
                            </h1>
                            <p className="text-slate-400 max-w-lg">
                                Manage departments, administrators, curriculum,
                                and system-wide settings for SATIS.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Academic Period
                                        </p>
                                        <p className="text-white font-semibold">
                                            {currentSettings.school_year} • Sem{" "}
                                            {currentSettings.semester}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Link
                                key={stat.name}
                                href={stat.href}
                                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1"
                            >
                                <div
                                    className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity"
                                    style={{
                                        background: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                                    }}
                                />

                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className={`p-2.5 rounded-xl ${stat.bgLight}`}
                                    >
                                        <Icon
                                            className={`h-5 w-5 ${stat.textColor}`}
                                        />
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                                </div>

                                <p className="text-3xl font-bold text-slate-900 mb-1">
                                    {stat.value}
                                </p>
                                <p className="text-sm font-medium text-slate-600 mb-0.5">
                                    {stat.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {stat.subtext}
                                </p>

                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
                                    <div
                                        className={`h-full bg-gradient-to-r ${stat.gradient} transition-all duration-500 group-hover:w-full`}
                                        style={{ width: "60%" }}
                                    />
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Content Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Admins */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                                    <UserCog className="h-5 w-5 text-violet-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Recent Admins
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Latest administrator accounts
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route("superadmin.admins.index")}
                                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                View all
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="p-4">
                            {recentAdmins.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                        <UserCog className="h-7 w-7 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 mb-3">
                                        No admins yet
                                    </p>
                                    <Link
                                        href={route("superadmin.admins.create")}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Add your first admin
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recentAdmins.map((admin, index) => (
                                        <div
                                            key={admin.id}
                                            className="flex items-center justify-between rounded-xl bg-slate-50/80 hover:bg-slate-100/80 p-4 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold shadow-sm">
                                                    {admin.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {admin.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {admin.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-flex items-center rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                    {admin.department}
                                                </span>
                                                <p className="text-xs text-slate-400 mt-1.5">
                                                    {admin.created_at}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Departments Overview */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Departments
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Academic departments overview
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route("superadmin.departments.index")}
                                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                View all
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="p-4">
                            {departments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                        <Building2 className="h-7 w-7 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 mb-3">
                                        No departments yet
                                    </p>
                                    <Link
                                        href={route(
                                            "superadmin.departments.create"
                                        )}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Create your first department
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {departments.map((dept) => (
                                        <div
                                            key={dept.id}
                                            className="flex items-center justify-between rounded-xl bg-slate-50/80 hover:bg-slate-100/80 p-4 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {dept.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Code: {dept.code}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-5">
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-slate-900">
                                                        {dept.admins_count}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                        Admins
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-slate-900">
                                                        {dept.teachers_count}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                        Teachers
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-slate-900">
                                                        {dept.students_count}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                        Students
                                                    </p>
                                                </div>
                                                <div
                                                    className={`h-2.5 w-2.5 rounded-full ${
                                                        dept.is_active
                                                            ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                                                            : "bg-slate-300"
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 overflow-hidden relative">
                    <div className="absolute inset-0 bg-grid-white/5" />
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

                    <div className="relative">
                        <div className="flex items-center gap-2 mb-6">
                            <Zap className="h-5 w-5 text-amber-400" />
                            <h2 className="text-xl font-bold text-white">
                                Quick Actions
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={action.name}
                                        href={action.href}
                                        className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1"
                                    >
                                        <div
                                            className={`h-12 w-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                                        >
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="text-white font-semibold mb-1">
                                            {action.name}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            {action.description}
                                        </p>
                                        <ArrowRight className="absolute bottom-5 right-5 h-5 w-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
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

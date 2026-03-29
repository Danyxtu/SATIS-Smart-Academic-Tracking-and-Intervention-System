import { Head, Link } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    Archive,
    ArrowLeft,
    Calendar,
    Users,
    GraduationCap,
    BookOpen,
    TrendingUp,
    TrendingDown,
    Building2,
    Sparkles,
    AlertTriangle,
    CheckCircle,
    CircleDashed,
} from "lucide-react";

const INTERVENTION_LABELS = {
    automated_nudge: "Tier 1: Reminder Nudge",
    task_list: "Tier 2: Goal Checklist",
    extension_grant: "Tier 2: Deadline Extension",
    parent_contact: "Tier 2: Parent Contact",
    academic_agreement: "Tier 3: Academic Agreement",
    one_on_one_meeting: "Tier 3: One-on-One Meeting",
};

export default function Show({ schoolYear, isCurrent, stats, departments }) {
    const passRateValue =
        stats.total_graded > 0 ? (stats.passed / stats.total_graded) * 100 : 0;
    const failRateValue =
        stats.total_graded > 0 ? (stats.failed / stats.total_graded) * 100 : 0;
    const passRate = stats.total_graded > 0 ? passRateValue.toFixed(1) : null;
    const totalClasses = Number(stats.total_classes ?? 0);
    const sem1Share =
        totalClasses > 0
            ? ((Number(stats.sem1_classes ?? 0) / totalClasses) * 100).toFixed(
                  1,
              )
            : "0.0";
    const sem2Share =
        totalClasses > 0
            ? ((Number(stats.sem2_classes ?? 0) / totalClasses) * 100).toFixed(
                  1,
              )
            : "0.0";

    const statCards = [
        {
            label: "Students",
            value: stats.students,
            icon: GraduationCap,
            color: "from-amber-500 to-orange-500",
            shadow: "shadow-amber-500/20",
            note: "Enrolled in this school year",
        },
        {
            label: "Teachers",
            value: stats.teachers,
            icon: Users,
            color: "from-violet-500 to-purple-600",
            shadow: "shadow-violet-500/20",
            note: "Handled at least one class",
        },
        {
            label: "Total Classes",
            value: stats.total_classes,
            icon: BookOpen,
            color: "from-blue-500 to-indigo-600",
            shadow: "shadow-blue-500/20",
            note: "Semester 1 and 2 combined",
        },
    ];

    const totalInterventions = Object.values(stats.interventions).reduce(
        (a, b) => a + b,
        0,
    );
    const interventionEntries = Object.entries(stats.interventions).sort(
        (a, b) => b[1] - a[1],
    );
    const topInterventionCount = interventionEntries[0]?.[1] ?? 0;

    return (
        <>
            <Head title={`Archive — ${schoolYear}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-7 shadow-xl">
                    <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute -bottom-12 left-1/4 h-36 w-36 rounded-full bg-blue-500/15 blur-2xl" />
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                                <Archive className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h1 className="text-2xl font-bold text-white tracking-tight">
                                        {schoolYear}
                                    </h1>
                                    {isCurrent && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 uppercase tracking-wide ring-1 ring-emerald-500/30">
                                            <Sparkles size={10} />
                                            Current
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-400 text-sm">
                                    Academic year overview
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
                                <CircleDashed
                                    size={14}
                                    className="text-slate-300"
                                />
                                {stats.total_graded} graded enrollments
                            </div>
                            <Link
                                href={route("superadmin.archive.index")}
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-sm ring-1 ring-white/10 self-start lg:self-auto"
                            >
                                <ArrowLeft size={15} />
                                Back to Archive
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statCards.map((s) => {
                        const Icon = s.icon;
                        return (
                            <div
                                key={s.label}
                                className="group rounded-2xl bg-white border border-slate-100 shadow-sm p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div
                                        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} shadow-md ${s.shadow} mb-4`}
                                    >
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Archived
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900 tabular-nums">
                                    {s.value}
                                </p>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {s.label}
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    {s.note}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left: Grade & Semester breakdown */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Performance Snapshot */}
                        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-md shadow-slate-500/20">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Performance Snapshot
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Quick indicators for this archived year
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                    <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">
                                        Pass Rate
                                    </p>
                                    <p className="text-2xl font-bold text-emerald-700 mt-1">
                                        {passRate !== null
                                            ? `${passRate}%`
                                            : "-"}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">
                                        Graded Records
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                                        {stats.total_graded}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                                    <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">
                                        Interventions
                                    </p>
                                    <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
                                        {totalInterventions}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Semester Breakdown */}
                        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Semester Breakdown
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Classes per semester
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-4">
                                {[
                                    {
                                        label: "1st Semester",
                                        value: stats.sem1_classes,
                                        share: sem1Share,
                                    },
                                    {
                                        label: "2nd Semester",
                                        value: stats.sem2_classes,
                                        share: sem2Share,
                                    },
                                ].map((sem) => (
                                    <div
                                        key={sem.label}
                                        className="rounded-xl bg-slate-50 border border-slate-100 p-5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {sem.label}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {sem.share}% of yearly
                                                    classes
                                                </p>
                                            </div>
                                            <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">
                                                {sem.value}
                                            </p>
                                        </div>
                                        <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                                style={{
                                                    width: `${sem.share}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grade Outcomes */}
                        {stats.total_graded > 0 && (
                            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            Grade Outcomes
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Based on {stats.total_graded} graded
                                            enrollments
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Pass rate bar */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium text-slate-700">
                                                Pass Rate
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {passRate}%
                                            </span>
                                        </div>
                                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                                                style={{
                                                    width: `${passRate}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs">
                                            <span className="text-emerald-600 font-medium">
                                                Passed:{" "}
                                                {passRateValue.toFixed(1)}%
                                            </span>
                                            <span className="text-rose-600 font-medium">
                                                Failed:{" "}
                                                {failRateValue.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                                            <CheckCircle
                                                size={20}
                                                className="text-emerald-500 shrink-0"
                                            />
                                            <div>
                                                <p className="text-2xl font-bold text-emerald-700">
                                                    {stats.passed}
                                                </p>
                                                <p className="text-xs text-emerald-600">
                                                    Passed
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl bg-rose-50 border border-rose-100 p-4">
                                            <TrendingDown
                                                size={20}
                                                className="text-rose-500 shrink-0"
                                            />
                                            <div>
                                                <p className="text-2xl font-bold text-rose-700">
                                                    {stats.failed}
                                                </p>
                                                <p className="text-xs text-rose-600">
                                                    Failed
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Interventions */}
                        {totalInterventions > 0 && (
                            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/20">
                                        <AlertTriangle className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            Interventions
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            {totalInterventions} total
                                            interventions
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-2">
                                    {interventionEntries.map(
                                        ([type, count]) => (
                                            <div
                                                key={type}
                                                className="rounded-xl bg-slate-50 px-4 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-sm text-slate-700">
                                                        {INTERVENTION_LABELS[
                                                            type
                                                        ] ?? type}
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                                                        {count}
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                                                        style={{
                                                            width: `${topInterventionCount > 0 ? (count / topInterventionCount) * 100 : 0}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Departments */}
                    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden self-start xl:sticky xl:top-6">
                        <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-md shadow-slate-500/20">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Departments
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {departments.length} departments
                                </p>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-[560px] overflow-y-auto">
                            {departments.length === 0 ? (
                                <div className="px-6 py-8 text-center">
                                    <p className="text-sm text-slate-500">
                                        No department data available.
                                    </p>
                                </div>
                            ) : (
                                departments.map((d) => (
                                    <div
                                        key={d.id}
                                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-900 text-sm">
                                                {d.name}
                                            </p>
                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 mt-0.5">
                                                {d.code}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-bold text-slate-900 tabular-nums">
                                                {d.teachers_count}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                Teachers
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = (page) => <SuperAdminLayout children={page} />;

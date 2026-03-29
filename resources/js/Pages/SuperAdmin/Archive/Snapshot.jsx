import { Head, Link } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    Archive,
    ArrowLeft,
    ArrowRight,
    Calendar,
    Database,
    Users,
    GraduationCap,
    BookOpen,
    ClipboardList,
    CheckCircle2,
    Clock3,
    Bell,
    UserCog,
    Building2,
} from "lucide-react";

export default function Snapshot({ snapshot }) {
    const formatSnapshotDate = (isoDate) => {
        if (!isoDate) {
            return "Unknown date";
        }

        const parsed = new Date(isoDate);
        return Number.isNaN(parsed.getTime())
            ? String(isoDate)
            : parsed.toLocaleString();
    };

    const summaryCards = [
        {
            label: "Students",
            value: snapshot.stats.students,
            icon: GraduationCap,
            color: "from-amber-500 to-orange-500",
            shadow: "shadow-amber-500/20",
        },
        {
            label: "Teachers",
            value: snapshot.stats.teachers,
            icon: Users,
            color: "from-violet-500 to-purple-600",
            shadow: "shadow-violet-500/20",
        },
        {
            label: "Classes",
            value: snapshot.totals.classes,
            icon: BookOpen,
            color: "from-blue-500 to-indigo-600",
            shadow: "shadow-blue-500/20",
        },
        {
            label: "Enrollments",
            value: snapshot.totals.enrollments,
            icon: ClipboardList,
            color: "from-emerald-500 to-teal-600",
            shadow: "shadow-emerald-500/20",
        },
    ];

    const detailRows = [
        {
            label: "Grades",
            value: snapshot.totals.grades,
            icon: CheckCircle2,
        },
        {
            label: "Attendance Records",
            value: snapshot.totals.attendance_records,
            icon: Calendar,
        },
        {
            label: "Interventions",
            value: snapshot.totals.interventions,
            icon: UserCog,
        },
        {
            label: "Intervention Tasks",
            value: snapshot.totals.intervention_tasks,
            icon: ClipboardList,
        },
        {
            label: "Student Notifications",
            value: snapshot.totals.student_notifications,
            icon: Bell,
        },
        {
            label: "Departments",
            value: snapshot.stats.departments,
            icon: Building2,
        },
        {
            label: "Admins",
            value: snapshot.stats.admins,
            icon: Users,
        },
    ];

    return (
        <>
            <Head title={`Snapshot - ${snapshot.school_year}`} />

            <div className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-7 shadow-xl">
                    <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute -bottom-12 left-1/4 h-36 w-36 rounded-full bg-blue-500/15 blur-2xl" />

                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                                <Database className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-200 ring-1 ring-blue-400/30">
                                    <Archive size={10} />
                                    Rollover Snapshot
                                </p>
                                <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
                                    <span>{snapshot.school_year}</span>
                                    <ArrowRight
                                        size={18}
                                        className="text-slate-300"
                                    />
                                    <span>
                                        {snapshot.next_school_year || "-"}
                                    </span>
                                </h1>
                                <p className="mt-1 text-sm text-slate-400">
                                    Captured before starting the new school year
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
                                <Clock3 size={14} className="text-slate-300" />
                                {formatSnapshotDate(snapshot.created_at)}
                            </p>
                            <p className="rounded-xl bg-white/10 px-4 py-2 text-[11px] text-slate-300 ring-1 ring-white/10">
                                Key: {snapshot.archive_key}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {summaryCards.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                            >
                                <div
                                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-md ${item.shadow}`}
                                >
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <p className="text-3xl font-bold tabular-nums text-slate-900">
                                    {item.value}
                                </p>
                                <p className="mt-0.5 text-sm text-slate-500">
                                    {item.label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="font-semibold text-slate-900">
                            Snapshot Details
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Captured system totals at rollover time
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-6">
                        {detailRows.map((row) => {
                            const Icon = row.icon;
                            return (
                                <div
                                    key={row.label}
                                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                                            <Icon
                                                size={13}
                                                className="text-slate-400"
                                            />
                                            <span>{row.label}</span>
                                        </div>
                                        <span className="text-lg font-bold tabular-nums text-slate-900">
                                            {row.value}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href={route("superadmin.archive.index")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <ArrowLeft size={14} />
                        Back to Archive
                    </Link>
                    <Link
                        href={route("superadmin.archive.show", {
                            schoolYear: snapshot.school_year,
                        })}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Open School Year Details
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </>
    );
}

Snapshot.layout = (page) => <SuperAdminLayout children={page} />;

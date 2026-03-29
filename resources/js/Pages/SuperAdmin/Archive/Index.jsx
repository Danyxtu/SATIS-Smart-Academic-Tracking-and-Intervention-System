import { Head, Link } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    Archive,
    Calendar,
    Users,
    GraduationCap,
    BookOpen,
    ChevronRight,
    Sparkles,
    Database,
    Clock3,
} from "lucide-react";

export default function Index({ years, currentSY, snapshots = [] }) {
    const hasYears = years.length > 0;
    const hasSnapshots = snapshots.length > 0;

    const formatSnapshotDate = (isoDate) => {
        if (!isoDate) {
            return "Unknown date";
        }

        const parsed = new Date(isoDate);
        return Number.isNaN(parsed.getTime())
            ? String(isoDate)
            : parsed.toLocaleString();
    };

    return (
        <>
            <Head title="Archive" />

            <div className="space-y-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-7 shadow-xl">
                    <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
                    <div className="flex items-center gap-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                            <Archive className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                School Year Archive
                            </h1>
                            <p className="text-slate-400 text-sm mt-0.5">
                                View historical and current academic year data
                            </p>
                        </div>
                    </div>
                </div>

                {/* Year Cards */}
                {!hasYears && !hasSnapshots ? (
                    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
                        <Archive className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">
                            No academic data found.
                        </p>
                    </div>
                ) : (
                    <>
                        {hasSnapshots && (
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900">
                                            Rollover Snapshots
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Saved right before each new school
                                            year starts
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                        {snapshots.length} entries
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {snapshots.map((snapshot) => (
                                        <div
                                            key={snapshot.archive_key}
                                            className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                                                        <Database
                                                            size={15}
                                                            className="text-blue-600"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                                                            Snapshot
                                                        </p>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {
                                                                snapshot.school_year
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-medium text-slate-500">
                                                    to{" "}
                                                    {snapshot.next_school_year ||
                                                        "-"}
                                                </span>
                                            </div>

                                            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                                                <Clock3
                                                    size={12}
                                                    className="text-slate-400"
                                                />
                                                {formatSnapshotDate(
                                                    snapshot.created_at,
                                                )}
                                            </p>

                                            <div className="mt-4 grid grid-cols-3 gap-2">
                                                <div className="rounded-lg bg-slate-50 p-2 text-center">
                                                    <p className="text-base font-bold text-slate-900">
                                                        {snapshot.students}
                                                    </p>
                                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                        Students
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-slate-50 p-2 text-center">
                                                    <p className="text-base font-bold text-slate-900">
                                                        {snapshot.teachers}
                                                    </p>
                                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                        Teachers
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-slate-50 p-2 text-center">
                                                    <p className="text-base font-bold text-slate-900">
                                                        {snapshot.classes}
                                                    </p>
                                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                        Classes
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                                                <p>
                                                    Enrollments:{" "}
                                                    <span className="font-semibold">
                                                        {snapshot.enrollments}
                                                    </span>
                                                </p>
                                                <p>
                                                    Grades:{" "}
                                                    <span className="font-semibold">
                                                        {snapshot.grades}
                                                    </span>
                                                </p>
                                                <p>
                                                    Attendance:{" "}
                                                    <span className="font-semibold">
                                                        {
                                                            snapshot.attendance_records
                                                        }
                                                    </span>
                                                </p>
                                                <p>
                                                    Interventions:{" "}
                                                    <span className="font-semibold">
                                                        {snapshot.interventions}
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="mt-4 flex items-center justify-end">
                                                <Link
                                                    href={route(
                                                        "superadmin.archive.snapshot.show",
                                                        {
                                                            archiveKey:
                                                                snapshot.archive_key,
                                                        },
                                                    )}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                                >
                                                    Open Snapshot
                                                    <ChevronRight size={14} />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {hasYears && (
                            <section className="space-y-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        School Year Records
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Data grouped by school year
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {years.map((y) => (
                                        <Link
                                            key={y.school_year}
                                            href={route(
                                                "superadmin.archive.show",
                                                {
                                                    schoolYear: y.school_year,
                                                },
                                            )}
                                            className="group relative rounded-2xl bg-white border border-slate-100 shadow-sm p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 overflow-hidden"
                                        >
                                            {/* Current badge */}
                                            {y.is_current && (
                                                <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                                                    <Sparkles size={10} />
                                                    Current
                                                </span>
                                            )}

                                            <div className="flex items-center gap-3 mb-5">
                                                <div
                                                    className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-md ${y.is_current ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20" : "bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-500/20"}`}
                                                >
                                                    <Calendar className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-lg leading-none">
                                                        {y.school_year}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        School Year
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="rounded-xl bg-slate-50 p-3 text-center">
                                                    <GraduationCap
                                                        size={14}
                                                        className="text-slate-400 mx-auto mb-1"
                                                    />
                                                    <p className="text-lg font-bold text-slate-900">
                                                        {y.students}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                        Students
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 p-3 text-center">
                                                    <Users
                                                        size={14}
                                                        className="text-slate-400 mx-auto mb-1"
                                                    />
                                                    <p className="text-lg font-bold text-slate-900">
                                                        {y.teachers}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                        Teachers
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 p-3 text-center">
                                                    <BookOpen
                                                        size={14}
                                                        className="text-slate-400 mx-auto mb-1"
                                                    />
                                                    <p className="text-lg font-bold text-slate-900">
                                                        {y.classes}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                        Classes
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-end text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                                                View Details{" "}
                                                <ChevronRight
                                                    size={14}
                                                    className="ml-1 group-hover:translate-x-0.5 transition-transform"
                                                />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

Index.layout = (page) => <SuperAdminLayout children={page} />;

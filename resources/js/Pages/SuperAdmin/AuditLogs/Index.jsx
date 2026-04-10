import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    CalendarClock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Eye,
    Search,
    X,
    XCircle,
} from "lucide-react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import Modal from "@/Components/Modal";

const ROLE_LABELS = {
    super_admin: "Super Admin",
    teacher: "Teacher",
    student: "Student",
};

const ROLE_BADGE_STYLES = {
    super_admin: "bg-amber-100 text-amber-700 border border-amber-200",
    teacher: "bg-blue-100 text-blue-700 border border-blue-200",
    student: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

const ACTION_BADGE_STYLES = {
    view: "bg-slate-100 text-slate-700 border border-slate-200",
    create: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    update: "bg-blue-100 text-blue-700 border border-blue-200",
    delete: "bg-rose-100 text-rose-700 border border-rose-200",
    approve: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    reject: "bg-red-100 text-red-700 border border-red-200",
    export: "bg-violet-100 text-violet-700 border border-violet-200",
    import: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    login: "bg-teal-100 text-teal-700 border border-teal-200",
    logout: "bg-orange-100 text-orange-700 border border-orange-200",
};

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatJson(value) {
    if (
        !value ||
        (typeof value === "object" && Object.keys(value).length === 0)
    ) {
        return "No data";
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return "Unable to render data";
    }
}

export default function Index({ logs, filters, options }) {
    const [search, setSearch] = useState(filters?.search || "");
    const [roleFilter, setRoleFilter] = useState(filters?.role || "");
    const [actionFilter, setActionFilter] = useState(filters?.action || "");
    const [schoolYearFilter, setSchoolYearFilter] = useState(
        filters?.school_year || "",
    );
    const [selectedLog, setSelectedLog] = useState(null);

    const totalLogs = Number(logs?.total || 0);
    const rows = logs?.data || [];

    const summary = useMemo(() => {
        const successCount = rows.filter((row) => row.is_success).length;
        const failureCount = rows.length - successCount;

        return {
            successCount,
            failureCount,
        };
    }, [rows]);

    const runFilters = (overrides = {}) => {
        const payload = {
            search,
            role: roleFilter,
            action: actionFilter,
            school_year: schoolYearFilter,
            ...overrides,
        };

        router.get(route("superadmin.audit-logs.index"), payload, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (event) => {
        event.preventDefault();
        runFilters();
    };

    const clearFilters = () => {
        setSearch("");
        setRoleFilter("");
        setActionFilter("");
        setSchoolYearFilter("");

        router.get(
            route("superadmin.audit-logs.index"),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <>
            <Head title="Audit Logs" />

            <div className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-7 py-6 shadow-xl">
                    <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-cyan-500/15 blur-3xl" />
                    <div className="absolute -bottom-10 left-1/4 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl" />

                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 ring-1 ring-cyan-300/20">
                                <ClipboardList className="h-6 w-6 text-cyan-200" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                                    Super Admin
                                </p>
                                <h1 className="text-2xl font-bold text-white">
                                    Activity Audit Logs
                                </h1>
                                <p className="mt-0.5 text-sm text-slate-300">
                                    Track teacher, student, and super admin
                                    tasks per school year
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white">
                                {totalLogs} Total Logs
                            </div>
                            <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200">
                                {summary.successCount} Success
                            </div>
                            <div className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200">
                                {summary.failureCount} Failed
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="flex flex-col gap-2 lg:flex-row">
                            <div className="relative flex-1">
                                <Search
                                    size={15}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by user, task, module, route, or school year"
                                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-9 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("");
                                            runFilters({ search: "" });
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                            >
                                Search
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                            <select
                                value={roleFilter}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    setRoleFilter(next);
                                    runFilters({ role: next });
                                }}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                            >
                                <option value="">All Roles</option>
                                {(options?.roles || []).map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={actionFilter}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    setActionFilter(next);
                                    runFilters({ action: next });
                                }}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                            >
                                <option value="">All Actions</option>
                                {(options?.actions || []).map((actionValue) => (
                                    <option
                                        key={actionValue}
                                        value={actionValue}
                                    >
                                        {actionValue}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={schoolYearFilter}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    setSchoolYearFilter(next);
                                    runFilters({ school_year: next });
                                }}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                            >
                                <option value="">All School Years</option>
                                {(options?.school_years || []).map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </form>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {rows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                <CalendarClock
                                    size={26}
                                    className="text-slate-400"
                                />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800">
                                No audit logs found
                            </h3>
                            <p className="mt-1 max-w-sm text-sm text-slate-500">
                                Try adjusting your filters or perform actions as
                                teacher, student, or super admin to populate
                                this table.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                                <div className="col-span-2">Date</div>
                                <div className="col-span-2">User</div>
                                <div className="col-span-1">Role</div>
                                <div className="col-span-3">Task</div>
                                <div className="col-span-1">Module</div>
                                <div className="col-span-1">School Year</div>
                                <div className="col-span-1 text-center">
                                    Status
                                </div>
                                <div className="col-span-1 text-right">
                                    Details
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {rows.map((log) => (
                                    <div
                                        key={log.id}
                                        className="grid grid-cols-12 items-center gap-3 px-4 py-3.5 text-xs transition-colors hover:bg-slate-50 sm:px-5"
                                    >
                                        <div className="col-span-2 text-slate-600">
                                            {formatDateTime(log.logged_at)}
                                        </div>

                                        <div className="col-span-2 min-w-0">
                                            <p className="truncate font-semibold text-slate-800">
                                                {log.user?.name || "Unknown"}
                                            </p>
                                            <p className="truncate text-[11px] text-slate-500">
                                                {log.user?.username || "-"}
                                            </p>
                                        </div>

                                        <div className="col-span-1">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                                                    ROLE_BADGE_STYLES[
                                                        log.user_role
                                                    ] ||
                                                    "bg-slate-100 text-slate-700 border border-slate-200"
                                                }`}
                                            >
                                                {ROLE_LABELS[log.user_role] ||
                                                    log.user_role ||
                                                    "-"}
                                            </span>
                                        </div>

                                        <div className="col-span-3 min-w-0">
                                            <p className="truncate font-medium text-slate-800">
                                                {log.task}
                                            </p>
                                            <div className="mt-1 flex items-center gap-1.5">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                        ACTION_BADGE_STYLES[
                                                            log.action
                                                        ] ||
                                                        "bg-slate-100 text-slate-700 border border-slate-200"
                                                    }`}
                                                >
                                                    {log.action}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-500">
                                                    {log.method}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-span-1 text-slate-600">
                                            {log.module || "-"}
                                        </div>

                                        <div className="col-span-1 text-slate-600">
                                            {log.school_year || "-"}
                                        </div>

                                        <div className="col-span-1 flex justify-center">
                                            {log.is_success ? (
                                                <CheckCircle2
                                                    size={16}
                                                    className="text-emerald-600"
                                                />
                                            ) : (
                                                <XCircle
                                                    size={16}
                                                    className="text-rose-600"
                                                />
                                            )}
                                        </div>

                                        <div className="col-span-1 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedLog(log)
                                                }
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                <Eye size={12} />
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {logs?.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-5">
                                    <p className="text-xs text-slate-500">
                                        Showing
                                        <span className="mx-1 font-semibold text-slate-700">
                                            {logs.from}–{logs.to}
                                        </span>
                                        of
                                        <span className="mx-1 font-semibold text-slate-700">
                                            {logs.total}
                                        </span>
                                        entries
                                    </p>

                                    <div className="flex items-center gap-1">
                                        {logs.links.map((link, index) => {
                                            const isPrev = index === 0;
                                            const isNext =
                                                index === logs.links.length - 1;
                                            const isNav = isPrev || isNext;

                                            return (
                                                <Link
                                                    key={index}
                                                    href={link.url || "#"}
                                                    className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors ${
                                                        link.active
                                                            ? "bg-cyan-600 text-white"
                                                            : link.url
                                                              ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                              : "cursor-not-allowed border border-slate-100 text-slate-300"
                                                    }`}
                                                    dangerouslySetInnerHTML={
                                                        isNav
                                                            ? undefined
                                                            : {
                                                                  __html: link.label,
                                                              }
                                                    }
                                                >
                                                    {isNav ? (
                                                        isPrev ? (
                                                            <ChevronLeft
                                                                size={14}
                                                            />
                                                        ) : (
                                                            <ChevronRight
                                                                size={14}
                                                            />
                                                        )
                                                    ) : null}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Modal
                show={Boolean(selectedLog)}
                onClose={() => setSelectedLog(null)}
                maxWidth="3xl"
            >
                {selectedLog && (
                    <div className="space-y-5 p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Audit Log Details
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {selectedLog.task}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Date and Time
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {formatDateTime(selectedLog.logged_at)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    User
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {selectedLog.user?.name || "Unknown"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {selectedLog.user?.username || "-"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Role and School Year
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {ROLE_LABELS[selectedLog.user_role] ||
                                        selectedLog.user_role ||
                                        "-"}
                                    {" · "}
                                    {selectedLog.school_year || "N/A"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Method / Status
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {selectedLog.method} ·{" "}
                                    {selectedLog.status_code || "-"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Route and Path
                                </p>
                                <p className="mt-1 break-all font-mono text-xs text-slate-700">
                                    {selectedLog.route_name || "-"}
                                </p>
                                <p className="mt-1 break-all font-mono text-xs text-slate-600">
                                    {selectedLog.path}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Source
                                </p>
                                <p className="mt-1 text-xs text-slate-700">
                                    IP: {selectedLog.ip_address || "N/A"}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                    Target: {selectedLog.target_type || "N/A"}
                                    {selectedLog.target_id
                                        ? ` #${selectedLog.target_id}`
                                        : ""}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-950 p-3">
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                                    Query Parameters
                                </p>
                                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-slate-100">
                                    {formatJson(selectedLog.query_params)}
                                </pre>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-950 p-3">
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                                    Request Payload
                                </p>
                                <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-slate-100">
                                    {formatJson(selectedLog.request_payload)}
                                </pre>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-950 p-3">
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                                    Metadata
                                </p>
                                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-slate-100">
                                    {formatJson(selectedLog.metadata)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

Index.layout = (page) => <SchoolStaffLayout children={page} />;

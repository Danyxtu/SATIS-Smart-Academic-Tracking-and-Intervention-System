import { Link, usePage } from "@inertiajs/react";
import { LayoutDashboard } from "lucide-react";

const DASHBOARD_SWITCH_OPTIONS = [
    {
        role: "teacher",
        label: "Teacher",
        routeName: "teacher.dashboard",
    },
    {
        role: "admin",
        label: "Admin",
        routeName: "admin.dashboard",
    },
    {
        role: "super_admin",
        label: "Super Admin",
        routeName: "superadmin.dashboard",
    },
];

export default function UnifiedDashboardSwitcher({ className = "" }) {
    const { auth } = usePage().props;
    const userRoles = auth?.user?.roles?.map((role) => role.name) || [];

    const hasTeacherRole = userRoles.includes("teacher");
    const hasAdminRole = userRoles.includes("admin");
    const hasSuperAdminRole = userRoles.includes("super_admin");

    const shouldShowUnifiedSwitch =
        hasTeacherRole && (hasAdminRole || hasSuperAdminRole);

    if (!shouldShowUnifiedSwitch) {
        return null;
    }

    const availableDashboards = DASHBOARD_SWITCH_OPTIONS.filter(
        ({ role, routeName }) =>
            userRoles.includes(role) && route().has(routeName),
    );

    if (availableDashboards.length < 2) {
        return null;
    }

    return (
        <div
            className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className}`}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        <LayoutDashboard size={16} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Unified Dashboard
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Switch between your assigned dashboards.
                        </p>
                    </div>
                </div>

                <div className="inline-flex max-w-full flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-600 dark:bg-slate-900/60">
                    {availableDashboards.map((dashboard) => {
                        const isActive = route().current(dashboard.routeName);

                        return (
                            <Link
                                key={dashboard.routeName}
                                href={route(dashboard.routeName)}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                                }`}
                            >
                                {dashboard.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

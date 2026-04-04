import { useEffect, useRef, useState } from "react";
import SATISHeader from "@/Components/SATISHeader";
import ConfirmationDialog from "@/Components/ConfirmationDialog";
import { Link, usePage, router } from "@inertiajs/react";
import getInitials from "@/utils/initialsHelper";
import { X, ChevronRight, LogOut, CheckCircle, XCircle } from "lucide-react";
import { superAdminRoutes } from "@/routes/superadmin";
import { adminRoutes } from "@/routes/admin";
import { teachersRoutes } from "@/routes/teachers";

// ── Role section config ──────────────────────────────────────────
const ROLE_SECTIONS = [
    {
        key: "teacher",
        label: "Teacher",
        routes: teachersRoutes,
        labelColor: "text-blue-400",
        activeLabelColor: "text-blue-300",
        activeGradient: "from-blue-600/30 to-blue-500/10",
        activeRing: "ring-blue-500/30",
        activeIcon: "bg-blue-500/20 text-blue-400",
        activeChevron: "text-blue-400/60",
        activeBar: "bg-blue-400",
        indicator: "bg-blue-500",
        headerHover: "hover:bg-blue-500/10",
        headerActive: "bg-blue-500/10",
    },
    {
        key: "admin",
        label: "Admin",
        routes: adminRoutes,
        labelColor: "text-emerald-400",
        activeLabelColor: "text-emerald-300",
        activeGradient: "from-emerald-600/30 to-emerald-500/10",
        activeRing: "ring-emerald-500/30",
        activeIcon: "bg-emerald-500/20 text-emerald-400",
        activeChevron: "text-emerald-400/60",
        activeBar: "bg-emerald-400",
        indicator: "bg-emerald-500",
        headerHover: "hover:bg-emerald-500/10",
        headerActive: "bg-emerald-500/10",
    },
    {
        key: "superadmin",
        label: "Superadmin",
        routes: superAdminRoutes,
        labelColor: "text-amber-400",
        activeLabelColor: "text-amber-300",
        activeGradient: "from-amber-600/30 to-amber-500/10",
        activeRing: "ring-amber-500/30",
        activeIcon: "bg-amber-500/20 text-amber-400",
        activeChevron: "text-amber-400/60",
        activeBar: "bg-amber-400",
        indicator: "bg-amber-500",
        headerHover: "hover:bg-amber-500/10",
        headerActive: "bg-amber-500/10",
    },
];

// ── Nav item ─────────────────────────────────────────────────────
function NavItem({ item, section, onLinkClick }) {
    const label = item.label ?? item.name;
    const dest = item.destination ?? item.path;
    const activeCheck = item.activeCheck ?? dest;
    const Icon = item.icon;

    const routeExists = route().has(dest);
    const isActive = routeExists ? route().current(activeCheck) : false;

    return (
        <Link
            href={routeExists ? route(dest) : "#"}
            onClick={onLinkClick}
            className={`
                group relative flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium
                transition-all duration-150
                ${
                    isActive
                        ? `bg-gradient-to-r ${section.activeGradient} text-white ring-1 ${section.activeRing}`
                        : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                }
                ${!routeExists ? "cursor-not-allowed opacity-40" : ""}
            `}
        >
            {/* Active left bar */}
            <div
                className={`absolute left-0 h-5 w-0.5 rounded-r-full transition-all ${section.activeBar} ${
                    isActive ? "opacity-100" : "opacity-0"
                }`}
            />

            {/* Icon */}
            <div
                className={`flex h-5 w-5 items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                    isActive
                        ? section.activeIcon
                        : "bg-slate-700/50 text-slate-400 group-hover:bg-slate-600/50 group-hover:text-slate-200"
                }`}
            >
                <Icon size={12} />
            </div>

            <span className="truncate">{label}</span>

            {isActive && (
                <ChevronRight
                    size={14}
                    className={`ml-auto flex-shrink-0 ${section.activeChevron}`}
                />
            )}
        </Link>
    );
}

const sectionRoleMap = {
    teacher: "teacher",
    admin: "admin",
    superadmin: "super_admin",
};

const dashboardRoleConfig = {
    teacher: {
        label: "Teacher",
        routeName: "teacher.dashboard",
        sectionKey: "teacher",
    },
    admin: {
        label: "Admin",
        routeName: "admin.dashboard",
        sectionKey: "admin",
    },
    super_admin: {
        label: "Super admin",
        routeName: "superadmin.dashboard",
        sectionKey: "superadmin",
    },
};

// ── Sidebar content ───────────────────────────────────────────────

function SidebarContent({ initials, fullName, onLinkClick, onLogout }) {
    const { auth } = usePage().props;
    const userRoles = auth.user.roles?.map((r) => r.name) || [];
    const visibleSections = ROLE_SECTIONS.filter((section) =>
        userRoles.includes(sectionRoleMap[section.key]),
    );

    const roleConfig = {
        teacher: {
            label: "Teacher",
            color: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
        },
        admin: {
            label: "Admin",
            color: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
        },
        super_admin: {
            label: "Super Admin",
            color: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
        },
    };

    const getItemLabel = (item) =>
        (item.label ?? item.name ?? "").toLowerCase();
    const isDashboardItem = (item) => getItemLabel(item) === "dashboard";

    const hasTeacherRole = userRoles.includes("teacher");
    const hasAdminRole = userRoles.includes("admin");
    const hasSuperAdminRole = userRoles.includes("super_admin");
    const shouldMoveDashboardSwitcherToPage =
        hasTeacherRole && (hasAdminRole || hasSuperAdminRole);

    const availableDashboardRoles = userRoles
        .map((role) => dashboardRoleConfig[role])
        .filter((config) => config && route().has(config.routeName));

    const activeDashboardRole =
        availableDashboardRoles.find((config) =>
            route().current(config.routeName),
        ) ??
        availableDashboardRoles[0] ??
        null;

    const dashboardEntryByActiveRole = activeDashboardRole
        ? visibleSections
              .filter(
                  (section) => section.key === activeDashboardRole.sectionKey,
              )
              .map((section) => ({
                  section,
                  item: section.routes.find((routeItem) =>
                      isDashboardItem(routeItem),
                  ),
              }))
              .find((entry) => entry.item)
        : null;

    const dashboardEntry =
        dashboardEntryByActiveRole ??
        visibleSections
            .map((section) => ({
                section,
                item: section.routes.find((routeItem) =>
                    isDashboardItem(routeItem),
                ),
            }))
            .find((entry) => entry.item);

    const teachingEntries = visibleSections
        .filter((section) => section.key === "teacher")
        .flatMap((section) =>
            section.routes
                .filter((item) => !isDashboardItem(item))
                .map((item) => ({ section, item })),
        );

    const administrationEntries = visibleSections
        .filter(
            (section) =>
                section.key === "admin" || section.key === "superadmin",
        )
        .flatMap((section) =>
            section.routes
                .filter((item) => !isDashboardItem(item))
                .map((item) => ({ section, item })),
        );

    const profileLinkRoute =
        activeDashboardRole?.routeName ?? dashboardEntry?.item?.path;

    return (
        <div className="flex flex-col h-full text-xs">
            {/* Brand / User */}
            <div className="flex flex-col gap-2 px-4 py-3 border-b border-slate-700/60">
                <Link
                    href={
                        profileLinkRoute && route().has(profileLinkRoute)
                            ? route(profileLinkRoute)
                            : "#"
                    }
                    className="flex items-center gap-3 min-w-0"
                    onClick={onLinkClick}
                >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
                        <span className="text-white font-bold text-xs uppercase">
                            {initials}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-white tracking-tight leading-none truncate">
                            {fullName}
                        </p>
                    </div>
                </Link>

                {/* Role badges + dashboard switcher */}
                <div className="space-y-2 pl-0.5">
                    <div className="flex flex-wrap gap-1">
                        {userRoles.map((role) => {
                            const config = roleConfig[role];
                            if (!config) return null;

                            return (
                                <span
                                    key={role}
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide ring-1 ${config.color}`}
                                >
                                    {config.label}
                                </span>
                            );
                        })}
                    </div>

                    {availableDashboardRoles.length > 1 &&
                        !shouldMoveDashboardSwitcherToPage && (
                            <div className="inline-flex w-full rounded-md border border-slate-700/80 bg-slate-800/60 p-0.5">
                                {availableDashboardRoles.map(
                                    (dashboardRole) => {
                                        const isActiveRole = route().current(
                                            dashboardRole.routeName,
                                        );

                                        return (
                                            <Link
                                                key={dashboardRole.routeName}
                                                href={route(
                                                    dashboardRole.routeName,
                                                )}
                                                onClick={onLinkClick}
                                                className={`flex-1 rounded px-2 py-1 text-center text-[10px] font-semibold transition-colors ${
                                                    isActiveRole
                                                        ? "bg-blue-600 text-white"
                                                        : "text-slate-300 hover:bg-slate-700/70"
                                                }`}
                                            >
                                                {dashboardRole.label}
                                            </Link>
                                        );
                                    },
                                )}
                            </div>
                        )}
                </div>
            </div>

            {/* Grouped nav items */}
            <nav className="flex-1 px-2 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {!!dashboardEntry && (
                    <div>
                        <p className="px-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                            Main
                        </p>
                        <div className="space-y-0.5">
                            <NavItem
                                key={`main-${dashboardEntry.section.key}-${dashboardEntry.item.label ?? dashboardEntry.item.name}`}
                                item={dashboardEntry.item}
                                section={dashboardEntry.section}
                                onLinkClick={onLinkClick}
                            />
                        </div>
                    </div>
                )}

                {teachingEntries.length > 0 && (
                    <div className="mt-3">
                        <p className="px-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                            Teaching
                        </p>
                        <div className="space-y-0.5">
                            {teachingEntries.map(({ section, item }) => (
                                <NavItem
                                    key={`teaching-${section.key}-${item.label ?? item.name}`}
                                    item={item}
                                    section={section}
                                    onLinkClick={onLinkClick}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {administrationEntries.length > 0 && (
                    <div className="mt-3">
                        <p className="px-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                            Administration
                        </p>
                        <div className="space-y-0.5">
                            {administrationEntries.map(({ section, item }) => (
                                <NavItem
                                    key={`administration-${section.key}-${item.label ?? item.name}`}
                                    item={item}
                                    section={section}
                                    onLinkClick={onLinkClick}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            {/* Logout */}
            <div className="p-2 border-t border-slate-700/60">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors group"
                >
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-slate-700/50 group-hover:bg-rose-500/20 transition-colors">
                        <LogOut size={12} />
                    </div>
                    Log Out
                </button>
            </div>
        </div>
    );
}

// ── Layout ────────────────────────────────────────────────────────
export default function SuperAdminLayout({ children }) {
    const { auth, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
        useState(false);
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
    const [flashVisible, setFlashVisible] = useState(true);
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const [routeProgress, setRouteProgress] = useState(0);

    const progressIntervalRef = useRef(null);
    const progressHideTimeoutRef = useRef(null);

    const handleLogoutClick = () => setShowLogoutConfirmation(true);
    const handleConfirmLogout = () => router.post(route("logout"));
    const handleToggleDesktopSidebar = () =>
        setIsDesktopSidebarCollapsed((prev) => !prev);

    const fullName =
        `${auth.user.first_name} ${auth.user.last_name}`.trim() || "Superadmin";
    const initials = getInitials(auth.user.first_name, auth.user.last_name);

    useEffect(() => {
        const clearProgressTimers = () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }

            if (progressHideTimeoutRef.current) {
                clearTimeout(progressHideTimeoutRef.current);
                progressHideTimeoutRef.current = null;
            }
        };

        const startProgress = () => {
            clearProgressTimers();
            setIsRouteLoading(true);
            setRouteProgress(14);

            progressIntervalRef.current = setInterval(() => {
                setRouteProgress((prev) => {
                    const next = prev + Math.random() * 10;
                    return next >= 88 ? 88 : next;
                });
            }, 160);
        };

        const finishProgress = () => {
            clearProgressTimers();
            setRouteProgress(100);

            progressHideTimeoutRef.current = setTimeout(() => {
                setIsRouteLoading(false);
                setRouteProgress(0);
            }, 260);
        };

        const removeStart = router.on("start", startProgress);
        const removeProgress = router.on("progress", (event) => {
            const pct = event?.detail?.progress?.percentage;

            if (typeof pct === "number") {
                setRouteProgress((prev) => {
                    const normalized = Math.max(20, Math.min(pct, 95));
                    return normalized > prev ? normalized : prev;
                });
            }
        });
        const removeFinish = router.on("finish", finishProgress);
        const removeCancel = router.on("cancel", finishProgress);
        const removeError = router.on("error", finishProgress);
        const removeInvalid = router.on("invalid", finishProgress);
        const removeException = router.on("exception", finishProgress);

        return () => {
            removeStart();
            removeProgress();
            removeFinish();
            removeCancel();
            removeError();
            removeInvalid();
            removeException();
            clearProgressTimers();
        };
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 text-[13px]">
            {isRouteLoading && (
                <>
                    <div className="pointer-events-none fixed inset-0 z-[70] bg-slate-900/15 backdrop-blur-[1px]" />

                    <div className="pointer-events-none fixed left-0 top-0 z-[80] h-1 w-full">
                        <div
                            className="h-full rounded-r-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_14px_rgba(37,99,235,0.65)] transition-all duration-200 ease-out"
                            style={{ width: `${routeProgress}%` }}
                        />
                    </div>

                    <div className="pointer-events-none fixed right-5 top-4 z-[85] flex items-center gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                            Loading page...
                        </span>
                    </div>
                </>
            )}

            {/* ── Desktop Sidebar ── */}
            <aside
                className={`relative hidden shrink-0 overflow-hidden bg-slate-900 transition-all duration-300 ease-in-out lg:flex lg:flex-col ${
                    isDesktopSidebarCollapsed
                        ? "w-0 -translate-x-3 opacity-0"
                        : "w-56 translate-x-0 opacity-100"
                }`}
                aria-hidden={isDesktopSidebarCollapsed}
            >
                <div
                    className={`h-full w-56 transition-opacity duration-200 ${
                        isDesktopSidebarCollapsed
                            ? "pointer-events-none opacity-0"
                            : "opacity-100 delay-100"
                    }`}
                >
                    <SidebarContent
                        initials={initials}
                        fullName={fullName}
                        onLinkClick={undefined}
                        onLogout={handleLogoutClick}
                    />
                </div>
            </aside>

            {/* ── Mobile Sidebar Overlay ── */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 shadow-2xl animate-in slide-in-from-left-6 duration-200">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <SidebarContent
                            initials={initials}
                            fullName={fullName}
                            onLinkClick={() => setSidebarOpen(false)}
                            onLogout={handleLogoutClick}
                        />
                    </aside>
                </div>
            )}

            {/* ── Main Area ── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden text-[13px]">
                <SATISHeader
                    user={{
                        name: fullName,
                        role: "Superadmin",
                        initials: initials,
                        email: auth.user.email,
                        roles:
                            auth.user.roles?.map((roleObj) => roleObj.name) ||
                            [],
                    }}
                    onOpenMobileSidebar={() => setSidebarOpen(true)}
                    onToggleDesktopSidebar={handleToggleDesktopSidebar}
                    isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
                    onLogout={handleLogoutClick}
                />

                {/* Flash Messages */}
                {flashVisible && flash?.success && (
                    <div className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle
                                size={16}
                                className="text-emerald-500 shrink-0"
                            />
                            <p className="text-sm font-medium text-emerald-800">
                                {flash.success}
                            </p>
                        </div>
                        <button
                            onClick={() => setFlashVisible(false)}
                            className="rounded-md p-1 text-emerald-500 hover:bg-emerald-100 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {flashVisible && flash?.error && (
                    <div className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <XCircle
                                size={16}
                                className="text-red-500 shrink-0"
                            />
                            <p className="text-sm font-medium text-red-800">
                                {flash.error}
                            </p>
                        </div>
                        <button
                            onClick={() => setFlashVisible(false)}
                            className="rounded-md p-1 text-red-400 hover:bg-red-100 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-3 md:p-4">
                    <div className="max-w-6xl mx-auto">{children}</div>
                </main>
            </div>

            {/* Logout Confirmation */}
            <ConfirmationDialog
                show={showLogoutConfirmation}
                title="Log Out"
                message="Are you sure you want to log out of your account?"
                dangerButtonText="Log Out"
                cancelButtonText="Cancel"
                onConfirm={handleConfirmLogout}
                onCancel={() => setShowLogoutConfirmation(false)}
                isDangerous={true}
            />
        </div>
    );
}

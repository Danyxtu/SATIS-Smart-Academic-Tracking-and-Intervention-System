import { useState } from "react";
import SATISHeader from "@/Components/SATISHeader";
import ConfirmationDialog from "@/Components/ConfirmationDialog";
import { Link, usePage, router } from "@inertiajs/react";
import getInitials from "@/utils/initialsHelper";
import {
    X,
    ChevronRight,
    ChevronDown,
    LogOut,
    CheckCircle,
    XCircle,
    Menu,
} from "lucide-react";
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

// ── Collapsible section ───────────────────────────────────────────
// ── Collapsible section ───────────────────────────────────────────
function NavSection({ section, onLinkClick }) {
    // Auto-open if a child route is currently active
    const hasActiveRoute = section.routes.some((item) => {
        const dest = item.destination ?? item.path;
        const activeCheck = item.activeCheck ?? dest;
        return route().has(dest) && route().current(activeCheck);
    });

    const [isOpen, setIsOpen] = useState(hasActiveRoute);

    // Check if user has the role for this section
    const { auth } = usePage().props;
    const userRoles = auth.user.roles?.map((r) => r.name) || [];
    console.log("User roles:", userRoles);

    // Map section keys to role names
    const roleMapping = {
        teacher: "teacher",
        admin: "admin",
        superadmin: "super_admin",
    };

    // Check if user has this section's role
    const requiredRole = roleMapping[section.key];
    const isDisabled = !userRoles.includes(requiredRole);

    return (
        <div>
            {/* Toggle header */}
            <button
                onClick={isDisabled ? undefined : () => setIsOpen((v) => !v)}
                className={`
                    w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                    transition-all duration-150
                    ${isOpen ? section.headerActive : section.headerHover}
                    ${isDisabled ? "opacity-50 cursor-not-allowed hover:bg-slate-800/40" : ""}
                `}
                disabled={isDisabled}
                style={isDisabled ? { pointerEvents: "auto" } : {}}
                title={
                    isDisabled
                        ? "You cannot access this role's portal"
                        : undefined
                }
            >
                {/* Dot */}
                <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-opacity ${
                        section.indicator
                    } ${isOpen ? "opacity-100" : "opacity-50"}`}
                />

                {/* Label + Stop sign if disabled */}
                <span
                    className={`text-[9px] font-bold uppercase tracking-widest flex-1 text-left transition-colors flex items-center gap-1 ${
                        isOpen
                            ? section.activeLabelColor
                            : `${section.labelColor} opacity-70`
                    }`}
                >
                    {section.label}
                    {isDisabled && (
                        <span
                            className="ml-1 text-slate-400 group-hover:text-red-400"
                            style={{ fontSize: "1.1em" }}
                            role="img"
                            aria-label="No entry"
                        >
                            &#128683;
                        </span>
                    )}
                </span>

                {/* Chevron rotates on open */}
                <ChevronDown
                    size={11}
                    className={`flex-shrink-0 transition-transform duration-200 ${
                        isOpen
                            ? `rotate-0 ${section.activeLabelColor}`
                            : `-rotate-90 ${section.labelColor} opacity-50`
                    }`}
                />
            </button>

            {/* Items — CSS max-height transition */}
            <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isOpen && !isDisabled
                        ? "max-h-96 opacity-100 mt-0.5"
                        : "max-h-0 opacity-0"
                }`}
            >
                <div className="space-y-0.5 pl-1">
                    {!isDisabled &&
                        section.routes.map((item) => (
                            <NavItem
                                key={item.label ?? item.name}
                                item={item}
                                section={section}
                                onLinkClick={onLinkClick}
                            />
                        ))}
                </div>
            </div>
        </div>
    );
}

// ── Sidebar content ───────────────────────────────────────────────

function SidebarContent({ initials, fullName, onLinkClick, onLogout }) {
    const { auth } = usePage().props;
    const userRoles = auth.user.roles?.map((r) => r.name) || [];

    // Map role names to display labels and colors
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

    return (
        <div className="flex flex-col h-full text-xs">
            {/* Brand / User */}
            <div className="flex flex-col gap-2 px-4 py-3 border-b border-slate-700/60">
                <Link
                    href={route("superadmin.dashboard")}
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

                {/* Role Badges */}
                <div className="flex flex-wrap gap-1 pl-0.5">
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
            </div>

            {/* Collapsible nav sections */}
            <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {ROLE_SECTIONS.map((section) => (
                    <NavSection
                        key={section.key}
                        section={section}
                        onLinkClick={onLinkClick}
                    />
                ))}
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
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
    const [flashVisible, setFlashVisible] = useState(true);

    const handleLogoutClick = () => setShowLogoutConfirmation(true);
    const handleConfirmLogout = () => router.post(route("logout"));

    const fullName =
        `${auth.user.first_name} ${auth.user.last_name}`.trim() || "Superadmin";
    const initials = getInitials(auth.user.first_name, auth.user.last_name);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 text-[13px]">
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex lg:flex-col w-56 shrink-0 bg-slate-900 relative">
                <SidebarContent
                    initials={initials}
                    fullName={fullName}
                    onLinkClick={undefined}
                    onLogout={handleLogoutClick}
                />
            </aside>

            {/* ── Mobile Sidebar Overlay ── */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 shadow-2xl">
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
                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700/60">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <Menu size={18} />
                    </button>
                    <span className="text-xs font-bold text-white tracking-tight">
                        {fullName}
                    </span>
                    <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-widest">
                        · Super Admin
                    </span>
                </div>

                <SATISHeader
                    user={{
                        name: fullName,
                        role: "Superadmin",
                        initials: initials,
                    }}
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

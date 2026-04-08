import React, { useMemo } from "react";
import { router, usePage } from "@inertiajs/react";
import Dropdown from "@/Components/Dropdown";
import DarkModeToggle from "@/Components/DarkModeToggle";
import NotificationBadge from "@/Components/NotificationBadge";
import {
    Bell,
    ChevronDown,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
} from "lucide-react";
import systemLogo from "../../assets/satis-logo.png";

const ROLE_LABELS = {
    super_admin: "Super Admin",
    admin: "Admin",
    teacher: "Teacher",
    student: "Student",
};

const ROLE_THEMES = {
    super_admin: {
        avatar: "from-amber-500 to-orange-500",
        chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    },
    admin: {
        avatar: "from-emerald-500 to-teal-500",
        chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    teacher: {
        avatar: "from-blue-500 to-indigo-500",
        chip: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    student: {
        avatar: "from-violet-500 to-purple-500",
        chip: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    },
};

const formatRoleLabel = (role) =>
    ROLE_LABELS[role] ??
    role
        ?.replace(/_/g, " ")
        ?.replace(/\b\w/g, (letter) => letter.toUpperCase()) ??
    "User";

export default function SATISHeader({
    user,
    onOpenMobileSidebar,
    onToggleDesktopSidebar,
    isDesktopSidebarCollapsed = false,
    onLogout,
}) {
    const { auth, notifications } = usePage().props;
    const authUser = auth?.user || {};

    const userRoles =
        user?.roles || authUser.roles?.map((roleObj) => roleObj.name) || [];

    const primaryRole = useMemo(() => {
        if (userRoles.includes("super_admin")) return "super_admin";
        if (userRoles.includes("admin")) return "admin";
        if (userRoles.includes("teacher")) return "teacher";
        if (userRoles.includes("student")) return "student";
        return "teacher";
    }, [userRoles]);

    const roleTheme = ROLE_THEMES[primaryRole] || ROLE_THEMES.teacher;

    const fullName =
        user?.name ||
        authUser.name ||
        `${authUser.first_name || ""} ${authUser.last_name || ""}`.trim() ||
        "User";

    const email = user?.email || authUser.email || "";

    const notificationCount = userRoles.includes("teacher")
        ? notifications?.pendingInterventions || 0
        : notifications?.unreadCount || 0;

    const notificationRouteName = userRoles.includes("teacher")
        ? route().has("teacher.interventions.index")
            ? "teacher.interventions.index"
            : null
        : userRoles.includes("student")
          ? route().has("interventions-feed")
              ? "interventions-feed"
              : null
          : null;

    const profileRouteName = useMemo(() => {
        if (
            userRoles.includes("student") &&
            route().has("student.profile.edit")
        ) {
            return "student.profile.edit";
        }

        if (
            (userRoles.includes("teacher") ||
                userRoles.includes("admin") ||
                userRoles.includes("super_admin")) &&
            route().has("schoolstaff.profile.edit")
        ) {
            return "schoolstaff.profile.edit";
        }

        return null;
    }, [userRoles]);

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
            return;
        }

        if (route().has("logout")) {
            router.post(route("logout"));
        }
    };

    return (
        <header className="w-full border-b border-slate-200 bg-white shadow-sm">
            <div className="flex min-h-[56px] items-center justify-between gap-2 px-3 py-2 sm:px-4 lg:px-6">
                {/* Logo and System Name */}
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onOpenMobileSidebar}
                        className="inline-flex rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden"
                        aria-label="Open sidebar"
                    >
                        <Menu size={18} />
                    </button>

                    <button
                        type="button"
                        onClick={onToggleDesktopSidebar}
                        className="hidden rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:inline-flex"
                        aria-label={
                            isDesktopSidebarCollapsed
                                ? "Expand sidebar"
                                : "Collapse sidebar"
                        }
                        title={
                            isDesktopSidebarCollapsed
                                ? "Expand sidebar"
                                : "Collapse sidebar"
                        }
                    >
                        {isDesktopSidebarCollapsed ? (
                            <PanelLeftOpen size={18} />
                        ) : (
                            <PanelLeftClose size={18} />
                        )}
                    </button>

                    <img
                        src={systemLogo}
                        alt="System Logo"
                        className="h-7 w-7 rounded-full object-cover sm:h-8 sm:w-8"
                    />

                    <div className="min-w-0">
                        <span className="block truncate text-sm font-extrabold tracking-tight text-slate-800 sm:text-lg">
                            SATIS
                            <span className="text-indigo-500">-FACTION</span>
                        </span>
                        <span className="hidden uppercase text-[10px] font-semibold leading-tight tracking-widest text-slate-400 lg:block">
                            Smart Academic Tracking and Intervention System
                        </span>
                    </div>
                </div>

                {/* Right side: actions and user */}
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button
                                type="button"
                                aria-label="Open notifications"
                                className="relative rounded-full p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 sm:p-2"
                            >
                                <Bell size={17} />
                                <NotificationBadge count={notificationCount} />
                            </button>
                        </Dropdown.Trigger>

                        <Dropdown.Content
                            width="48"
                            contentClasses="py-1 bg-white"
                        >
                            <div className="border-b border-slate-100 px-4 py-2">
                                <p className="text-sm font-semibold text-slate-800">
                                    Notifications
                                </p>
                                <p className="text-xs text-slate-500">
                                    {notificationCount > 0
                                        ? `${notificationCount} pending update${
                                              notificationCount > 1 ? "s" : ""
                                          }`
                                        : "No pending updates"}
                                </p>
                            </div>

                            {notificationRouteName ? (
                                <Dropdown.Link
                                    href={route(notificationRouteName)}
                                >
                                    Open Notification Center
                                </Dropdown.Link>
                            ) : (
                                <div className="px-4 py-3 text-xs text-slate-500">
                                    Notifications are not available for this
                                    role.
                                </div>
                            )}
                        </Dropdown.Content>
                    </Dropdown>

                    <DarkModeToggle className="p-1.5 sm:p-2" />

                    <Dropdown>
                        <Dropdown.Trigger>
                            <button
                                type="button"
                                aria-label="Open profile menu"
                                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-1 transition-colors hover:bg-slate-200 sm:gap-2 sm:px-2"
                            >
                                <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${roleTheme.avatar} text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm`}
                                >
                                    {user?.initials || "SA"}
                                </div>

                                <div className="hidden min-w-0 flex-col md:flex">
                                    <span className="max-w-[132px] truncate text-xs font-semibold text-slate-800">
                                        {fullName}
                                    </span>
                                    <span className="text-[10px] leading-tight text-slate-500">
                                        {formatRoleLabel(primaryRole)}
                                    </span>
                                </div>

                                <ChevronDown
                                    size={14}
                                    className="hidden text-slate-500 md:block"
                                />
                            </button>
                        </Dropdown.Trigger>

                        <Dropdown.Content
                            width="48"
                            contentClasses="py-1 bg-white"
                        >
                            <div className="border-b border-slate-100 px-4 py-3">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                    {fullName}
                                </p>
                                {email && (
                                    <p className="truncate text-xs text-slate-500">
                                        {email}
                                    </p>
                                )}

                                <div className="mt-2 flex flex-wrap gap-1">
                                    {userRoles.length > 0 ? (
                                        userRoles.map((roleName) => (
                                            <span
                                                key={roleName}
                                                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                                            >
                                                {formatRoleLabel(roleName)}
                                            </span>
                                        ))
                                    ) : (
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleTheme.chip}`}
                                        >
                                            {formatRoleLabel(primaryRole)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {profileRouteName && (
                                <Dropdown.Link href={route(profileRouteName)}>
                                    <span className="inline-flex items-center gap-2">
                                        <Settings size={14} />
                                        Profile Settings
                                    </span>
                                </Dropdown.Link>
                            )}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="block w-full px-4 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <LogOut size={14} />
                                    Log Out
                                </span>
                            </button>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </div>
        </header>
    );
}

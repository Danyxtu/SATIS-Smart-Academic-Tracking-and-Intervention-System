import { useState } from "react";
import SATISHeader from "@/Components/SATISHeader";
import ConfirmationDialog from "@/Components/ConfirmationDialog";
import { Link, usePage, router } from "@inertiajs/react";
import getInitials from "@/utils/initialsHelper";
import {
    Book,
    House,
    Lightbulb,
    LogOut,
    Newspaper,
    PenLine,
    X,
    BarChart3,
} from "lucide-react";

export default function StudentLayout({ children }) {
    const { auth, notifications } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
        useState(false);
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

    // Get unread notification count from shared notifications
    const unreadCount = notifications?.unreadCount || 0;
    const user = auth?.user || {};
    const displayName =
        user.name ||
        [user.first_name, user.middle_name, user.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() ||
        user.student?.student_name ||
        user.username ||
        "Student";
    const displayEmail = user.email || user.personal_email || "No email";
    const roleNames = Array.isArray(user.roles)
        ? user.roles
              .map((roleObj) =>
                  typeof roleObj === "string" ? roleObj : roleObj?.name,
              )
              .filter(Boolean)
        : ["student"];
    const initials =
        getInitials(user.first_name || "S", user.last_name || "T") || "ST";

    // Handle logout confirmation
    const handleLogoutClick = () => {
        setShowLogoutConfirmation(true);
    };

    const handleConfirmLogout = () => {
        router.post(route("logout"));
    };

    const menuItems = [
        {
            icon: <House size={19} />,
            label: "Dashboard",
            destination: "dashboard",
            activeCheck: "dashboard",
            showBadge: false,
        },
        {
            icon: <Lightbulb size={19} />,
            label: "Learn More",
            destination: "learn-more",
            activeCheck: "learn-more",
            showBadge: false,
        },
        {
            icon: <PenLine size={19} />,
            label: "Attendance",
            destination: "attendance",
            activeCheck: "attendance",
            showBadge: false,
        },
        {
            icon: <BarChart3 size={19} />,
            label: "Performance Analytics",
            destination: "analytics.index",
            activeCheck: "analytics.*",
            showBadge: false,
        },
        {
            icon: <Newspaper size={19} />,
            label: "Interventions & Feed",
            destination: "interventions-feed",
            activeCheck: "interventions-feed",
            showBadge: true,
            badgeCount: unreadCount,
        },
        {
            icon: <Book size={19} />,
            label: "Subject at Risk",
            destination: "subject-at-risk",
            activeCheck: "subject-at-risk",
            showBadge: false,
        },
    ];

    const SidebarContent = ({ onLinkClick }) => (
        <div className="flex h-full flex-col">
            <Link
                href={route("profile.edit")}
                onClick={onLinkClick}
                className="mx-3 mt-3 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/70"
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white">
                    {initials}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight text-gray-800 dark:text-gray-100">
                        {displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Student
                    </p>
                </div>
            </Link>

            <nav className="flex-1 space-y-0.5 py-4">
                {menuItems.map((item) => {
                    const isActive = route().current(item.activeCheck);

                    return (
                        <Link
                            key={item.label}
                            href={route(item.destination)}
                            onClick={onLinkClick}
                            className={`flex w-full items-center gap-2.5 border-r-4 px-4 py-2.5 text-sm transition-all duration-150 ${
                                isActive
                                    ? "border-pink-600 bg-pink-100 font-medium text-pink-700 dark:border-pink-400 dark:bg-pink-900/40 dark:text-pink-200"
                                    : "border-transparent text-gray-600 hover:border-pink-300 hover:bg-gray-100 hover:text-pink-700 dark:text-gray-300 dark:hover:border-pink-500/60 dark:hover:bg-gray-700/70 dark:hover:text-pink-200"
                            }`}
                        >
                            <div className="relative">{item.icon}</div>
                            <p className="flex-1 truncate leading-tight">
                                {item.label}
                            </p>
                            {item.showBadge && item.badgeCount > 0 && (
                                <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white animate-pulse">
                                    {item.badgeCount > 99
                                        ? "99+"
                                        : item.badgeCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-gray-200 p-2 dark:border-gray-700">
                <button
                    onClick={handleLogoutClick}
                    className="flex h-11 w-full items-center justify-start gap-2.5 rounded-lg px-3 text-sm text-gray-600 transition-all duration-150 hover:bg-red-600 hover:text-white dark:text-gray-300"
                >
                    <LogOut size={20} />
                    <p className="font-medium">Log out</p>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            <aside
                className={`relative hidden shrink-0 overflow-hidden border-r border-gray-200 bg-white text-black transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 lg:flex lg:flex-col ${
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
                    <SidebarContent onLinkClick={undefined} />
                </div>
            </aside>

            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />

                    <aside className="absolute bottom-0 left-0 top-0 w-64 bg-white shadow-2xl dark:bg-gray-900">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        >
                            <X size={18} />
                        </button>

                        <SidebarContent
                            onLinkClick={() => setSidebarOpen(false)}
                        />
                    </aside>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <SATISHeader
                    user={{
                        name: displayName,
                        role: "Student",
                        initials,
                        email: displayEmail,
                        roles: roleNames.length > 0 ? roleNames : ["student"],
                    }}
                    onOpenMobileSidebar={() => setSidebarOpen(true)}
                    onToggleDesktopSidebar={() =>
                        setIsDesktopSidebarCollapsed((prev) => !prev)
                    }
                    isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
                    onLogout={handleLogoutClick}
                />

                <main className="flex-1 overflow-y-auto p-4 sm:p-5 dark:text-gray-100">
                    {children}
                </main>
            </div>

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

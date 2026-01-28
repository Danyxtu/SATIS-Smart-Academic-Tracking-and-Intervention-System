import { useState } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { NotificationDot } from "@/Components/NotificationBadge";
import NotificationDropdown from "@/Components/NotificationDropdown";
import DarkModeToggle from "@/Components/DarkModeToggle";
import ConfirmationDialog from "@/Components/ConfirmationDialog";
import { Link, usePage, router } from "@inertiajs/react";
import UserPicture from "../../assets/user.png";
import {
    Bell,
    Book,
    House,
    Lightbulb,
    LogOut,
    Newspaper,
    PenLine,
    Menu,
    X,
    BarChart3,
} from "lucide-react";

export default function AuthenticatedLayout({ children }) {
    const { auth, notifications } = usePage().props;
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

    // Get unread notification count from shared notifications
    const unreadCount = notifications?.unreadCount || 0;

    // Handle logout confirmation
    const handleLogoutClick = () => {
        setShowLogoutConfirmation(true);
    };

    const handleConfirmLogout = () => {
        router.post(route("logout"));
    };

    const menuItems = [
        {
            icon: <House size={24} />,
            label: "Dashboard",
            destination: "dashboard",
            activeCheck: "dashboard",
            showBadge: false,
        },
        {
            icon: <Lightbulb size={24} />,
            label: "Learn More",
            destination: "learn-more",
            activeCheck: "learn-more",
            showBadge: false,
        },
        {
            icon: <PenLine size={24} />,
            label: "Attendance",
            destination: "attendance",
            activeCheck: "attendance",
            showBadge: false,
        },
        {
            icon: <BarChart3 size={24} />,
            label: "Performance Analytics",
            destination: "analytics.index",
            activeCheck: "analytics.*",
            showBadge: false,
        },
        {
            icon: <Newspaper size={24} />,
            label: "Interventions & Feed",
            destination: "interventions-feed",
            activeCheck: "interventions-feed",
            showBadge: true,
            badgeCount: unreadCount,
        },
        {
            icon: <Book size={24} />,
            label: "Subject at Risk",
            destination: "subject-at-risk",
            activeCheck: "subject-at-risk",
            showBadge: false,
        },
    ];

    const Sidebar = () => (
        <aside className="fixed left-0 top-0 w-64 h-screen flex-col bg-white dark:bg-gray-800 text-black dark:text-gray-100 shadow-lg z-40 hidden lg:flex">
            {/* Logo Section */}
            <div className="flex items-center justify-center h-20 border-b-2 border-primary">
                <Link href={route("dashboard")}>
                    <ApplicationLogo className="block h-12 w-auto fill-current" />
                </Link>
            </div>

            {/* Profile Section */}
            <Link
                href={route("profile.edit")}
                className="flex items-center gap-4 p-4 mt-4 mx-4 rounded-lg hover:bg-gray-100"
            >
                <img
                    src={UserPicture}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border-2 border-primary"
                />
                <div>
                    <p className="font-semibold text-gray-800">
                        {auth.user.name}
                    </p>
                    <p className="text-sm text-gray-500">Student</p>
                </div>
            </Link>

            {/* Menu Items (FIXED) */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item, i) => {
                    const isActive = route().current(item.activeCheck);

                    return (
                        <NavLink
                            key={i}
                            href={route(item.destination)}
                            active={isActive}
                            className={`flex items-center gap-3 px-4 py-3 text-gray-600 w-full rounded-lg transition-all duration-150
                                ${
                                    isActive
                                        ? "bg-pink-100 text-pink-700 font-medium"
                                        : "hover:bg-gray-100"
                                }
                            `}
                        >
                            <div className="relative">
                                {item.icon}
                                {item.showBadge && item.badgeCount > 0 && (
                                    <NotificationDot
                                        show={true}
                                        className="absolute -top-1 -right-1"
                                    />
                                )}
                            </div>
                            <p className="flex-1">{item.label}</p>
                            {item.showBadge && item.badgeCount > 0 && (
                                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                                    {item.badgeCount > 99
                                        ? "99+"
                                        : item.badgeCount}
                                </span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="border-t-2 border-primary p-2">
                <button
                    onClick={handleLogoutClick}
                    className="w-full px-4 h-[50px] flex items-center justify-start gap-3 rounded-lg text-gray-600 hover:bg-red-600 hover:text-white cursor-pointer transition-all duration-150"
                >
                    <LogOut size={24} />
                    <p className="font-medium">Log out</p>
                </button>
            </div>
        </aside>
    );

    // Main Layout
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <div className="flex flex-col flex-1 lg:pl-64">
                {/* Top Navigation */}
                <nav className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-end h-16">
                            {/* Right Side: Icons & User Dropdown */}
                            <div className="hidden sm:flex sm:items-center sm:ml-6">
                                <DarkModeToggle className="mr-3" />
                                <NotificationDropdown />

                                <div className="ml-3 relative">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <button
                                                type="button"
                                                className="flex items-center text-sm rounded-full focus:outline-none"
                                            >
                                                <img
                                                    className="w-10 h-10 rounded-full border-2 border-gray-300"
                                                    src={UserPicture}
                                                    alt="User"
                                                />
                                            </button>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <div className="px-4 py-2">
                                                <div className="font-medium text-base text-gray-800">
                                                    {auth.user.name}
                                                </div>
                                                <div className="font-medium text-sm text-gray-500">
                                                    {auth.user.email}
                                                </div>
                                            </div>
                                            <Dropdown.Link
                                                href={route("profile.edit")}
                                            >
                                                Profile
                                            </Dropdown.Link>
                                            <button
                                                onClick={handleLogoutClick}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                                            >
                                                Log Out
                                            </button>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>

                            {/* Hamburger Menu (Mobile) */}
                            <div className="-mr-2 flex items-center lg:hidden">
                                <button
                                    onClick={() =>
                                        setShowingNavigationDropdown(
                                            (previousState) => !previousState,
                                        )
                                    }
                                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                                >
                                    {showingNavigationDropdown ? (
                                        <X size={24} />
                                    ) : (
                                        <Menu size={24} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Responsive Navigation Menu (Mobile)*/}
                    <div
                        className={
                            (showingNavigationDropdown ? "block" : "hidden") +
                            " lg:hidden border-t"
                        }
                    >
                        <div className="pt-2 pb-3 space-y-1">
                            {menuItems.map((item) => (
                                <ResponsiveNavLink
                                    key={item.label}
                                    href={route(item.destination)}
                                    active={route().current(item.activeCheck)}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>{item.label}</span>
                                        {item.showBadge &&
                                            item.badgeCount > 0 && (
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                                    {item.badgeCount > 99
                                                        ? "99+"
                                                        : item.badgeCount}
                                                </span>
                                            )}
                                    </div>
                                </ResponsiveNavLink>
                            ))}
                        </div>

                        {/* Responsive User Settings */}
                        <div className="pt-4 pb-1 border-t border-gray-200">
                            <div className="px-4">
                                <div className="font-medium text-base text-gray-800">
                                    {auth.user.name}
                                </div>
                                <div className="font-medium text-sm text-gray-500">
                                    {auth.user.email}
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <ResponsiveNavLink href={route("profile.edit")}>
                                    Profile
                                </ResponsiveNavLink>
                                <button
                                    onClick={handleLogoutClick}
                                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-md"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Page Content */}
                <main className="flex-1 p-6 dark:text-gray-100">
                    {children}
                </main>
            </div>

            {/* Logout Confirmation Dialog */}
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

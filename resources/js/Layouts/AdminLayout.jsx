import { useState } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import DarkModeToggle from "@/Components/DarkModeToggle";
import ConfirmationDialog from "@/Components/ConfirmationDialog";
import { Link, usePage, router } from "@inertiajs/react";
import UserPicture from "../../assets/user.png";
import {
    House,
    LogOut,
    Menu,
    X,
    Users,
    Shield,
    Settings,
    Key,
    Building2,
    UserPlus,
} from "lucide-react";

export default function AdminLayout({ children }) {
    const { auth, flash } = usePage().props;
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

    // Handle logout confirmation
    const handleLogoutClick = () => {
        setShowLogoutConfirmation(true);
    };

    const handleConfirmLogout = () => {
        router.post(route("logout"));
    };

    // Admin Navigation Items
    const menuItems = [
        {
            icon: <House size={18} />,
            label: "Dashboard",
            destination: "admin.dashboard",
            activeCheck: "admin.dashboard",
        },
        {
            icon: <Users size={18} />,
            label: "User Management",
            destination: "admin.users.index",
            activeCheck: "admin.users.*",
        },
        {
            icon: <UserPlus size={18} />,
            label: "Teacher Registrations",
            destination: "admin.teacher-registrations.index",
            activeCheck: "admin.teacher-registrations.*",
        },
        {
            icon: <Key size={18} />,
            label: "Password Requests",
            destination: "admin.password-reset-requests",
            activeCheck: "admin.password-reset-requests",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Flash Messages */}
            {flash?.success && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-down">
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        {flash.success}
                    </div>
                </div>
            )}
            {flash?.error && (
                <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-down">
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                        {flash.error}
                    </div>
                </div>
            )}

            {/* Top Navigation Bar */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo & Main Nav Links */}
                        <div className="flex">
                            {/* Logo */}
                            <div className="flex-shrink-0 flex items-center">
                                <Link href={route("admin.dashboard")}>
                                    <ApplicationLogo className="block h-10 w-auto fill-current text-gray-800" />
                                </Link>
                                <div className="ml-3 hidden sm:flex items-center">
                                    <span className="font-semibold text-xl text-gray-700 dark:text-gray-200">
                                        SATIS
                                    </span>
                                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                                        <Shield size={12} />
                                        Admin
                                    </span>
                                </div>
                            </div>

                            {/* Desktop Nav Links */}
                            <div className="hidden space-x-4 sm:-my-px sm:ml-10 sm:flex">
                                {menuItems.map((item) => {
                                    const routeExists = route().has(
                                        item.destination,
                                    );
                                    const isActive = routeExists
                                        ? route().current(item.activeCheck)
                                        : false;

                                    return (
                                        <NavLink
                                            key={item.label}
                                            href={
                                                routeExists
                                                    ? route(item.destination)
                                                    : "#"
                                            }
                                            active={isActive}
                                            className={`relative inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium transition-colors
                                                ${
                                                    isActive
                                                        ? "border-purple-500 text-purple-600 dark:text-purple-400"
                                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                                                }
                                                ${
                                                    !routeExists
                                                        ? "cursor-not-allowed opacity-50"
                                                        : ""
                                                }
                                            `}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Side: User Dropdown */}
                        <div className="hidden sm:flex sm:items-center sm:ml-6">
                            <DarkModeToggle className="mr-3" />

                            <div className="ml-3 relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                        >
                                            <div className="relative">
                                                <img
                                                    className="w-10 h-10 rounded-full border-2 border-purple-300"
                                                    src={UserPicture}
                                                    alt="User"
                                                />
                                                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                                                    <Shield
                                                        size={8}
                                                        className="text-white"
                                                    />
                                                </span>
                                            </div>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <div className="font-medium text-base text-gray-800 dark:text-gray-200">
                                                {auth.user.name}
                                            </div>
                                            <div className="font-medium text-sm text-gray-500 dark:text-gray-400">
                                                {auth.user.email}
                                            </div>
                                            <div className="mt-2 flex flex-col gap-1">
                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full w-fit">
                                                    <Shield
                                                        size={10}
                                                        className="mr-1"
                                                    />
                                                    Administrator
                                                </span>
                                                {auth.user.department && (
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full w-fit">
                                                        <Building2
                                                            size={10}
                                                            className="mr-1"
                                                        />
                                                        {
                                                            auth.user.department
                                                                .name
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Dropdown.Link
                                            href={route("profile.edit")}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Settings size={16} />
                                                Profile Settings
                                            </div>
                                        </Dropdown.Link>
                                        <button
                                            onClick={handleLogoutClick}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400"
                                        >
                                            <div className="flex items-center gap-2">
                                                <LogOut size={16} />
                                                Log Out
                                            </div>
                                        </button>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Hamburger Menu (Mobile) */}
                        <div className="-mr-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
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

                {/* Responsive Navigation Menu (Mobile) */}
                <div
                    className={
                        (showingNavigationDropdown ? "block" : "hidden") +
                        " sm:hidden border-t"
                    }
                >
                    <div className="pt-2 pb-3 space-y-1">
                        {menuItems.map((item) => {
                            const routeExists = route().has(item.destination);
                            const isActive = routeExists
                                ? route().current(item.activeCheck)
                                : false;
                            return (
                                <ResponsiveNavLink
                                    key={item.label}
                                    href={
                                        routeExists
                                            ? route(item.destination)
                                            : "#"
                                    }
                                    active={isActive}
                                    className={
                                        !routeExists
                                            ? "cursor-not-allowed opacity-50"
                                            : ""
                                    }
                                >
                                    <div className="flex items-center gap-2">
                                        {item.icon} {item.label}
                                    </div>
                                </ResponsiveNavLink>
                            );
                        })}
                    </div>

                    {/* Responsive User Settings */}
                    <div className="pt-4 pb-1 border-t border-gray-200">
                        <div className="px-4">
                            <div className="font-medium text-base text-gray-800 dark:text-gray-200">
                                {auth.user.name}
                            </div>
                            <div className="font-medium text-sm text-gray-500">
                                {auth.user.email}
                            </div>
                            <div className="mt-2 flex flex-col gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full w-fit">
                                    <Shield size={10} className="mr-1" />
                                    Administrator
                                </span>
                                {auth.user.department && (
                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full w-fit">
                                        <Building2 size={10} className="mr-1" />
                                        {auth.user.department.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route("profile.edit")}>
                                Profile Settings
                            </ResponsiveNavLink>
                            <button
                                onClick={handleLogoutClick}
                                className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Page Content */}
            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">{children}</div>
            </main>

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

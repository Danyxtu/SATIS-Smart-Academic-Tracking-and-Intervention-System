import { useState } from "react";
import ApplicationLogo from "../Components/ApplicationLogo";
import Dropdown from "../Components/Dropdown";
import NavLink from "../Components/NavLink";
import ResponsiveNavLink from "../Components/ResponsiveNavLink";
import NotificationBadge, {
    NotificationDot,
} from "../Components/NotificationBadge";
import DarkModeToggle from "@/Components/DarkModeToggle";
import { Link, usePage } from "@inertiajs/react";
import UserPicture from "../../assets/user.png";
import { LoadingProvider } from "../Context/LoadingContext";
import LoadingOverlay from "../Components/LoadingOverlay";
import {
    Bell,
    House,
    LogOut,
    Menu,
    X,
    ClipboardList, // For Interventions
    CalendarCheck, // For Attendance
    BookOpen, // For My Classes
} from "lucide-react";

export default function TeacherLayout({ children }) {
    const { auth, notifications } = usePage().props;
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    // Get pending interventions count from shared notifications
    const pendingInterventions = notifications?.pendingInterventions || 0;

    // --- (NEW) Teacher Navigation Items (Based on our discussion) ---
    const menuItems = [
        {
            icon: <House size={18} />,
            label: "Dashboard",
            destination: "teacher.dashboard",
            activeCheck: "teacher.dashboard",
            showBadge: false,
        },
         {
            icon: <BookOpen size={18} />,
            label: "My Classes",
            // We will need to create this route
            destination: "teacher.classes.index",
            activeCheck: "teacher.classes.*",
            showBadge: false,
        },
        {
            icon: <CalendarCheck size={18} />,
            label: "Attendance",
            // We will need to create this route
            destination: "teacher.attendance.index",
            activeCheck: "teacher.attendance.*",
            showBadge: false,
        },
       
        {
            icon: <ClipboardList size={18} />,
            label: "Interventions",
            // We will need to create this route
            destination: "teacher.interventions.index",
            activeCheck: "teacher.interventions.*",
            showBadge: true, // Show notification badge on interventions
            badgeCount: pendingInterventions,
        },
    ];

    return (
        <LoadingProvider>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                {/* --- Top Navigation Bar --- */}
                <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            {/* 1. Logo & Main Nav Links */}
                            <div className="flex">
                                {/* Logo */}
                                <div className="flex-shrink-0 flex items-center">
                                    <Link href={route("teacher.dashboard")}>
                                        <ApplicationLogo className="block h-10 w-auto fill-current text-gray-800" />
                                    </Link>
                                    <span className="font-semibold text-xl text-gray-700 ml-2 hidden sm:block">
                                        SATIS | Teacher
                                    </span>
                                </div>

                                {/* Desktop Nav Links */}
                                <div className="hidden space-x-4 sm:-my-px sm:ml-10 sm:flex">
                                    {menuItems.map((item) => {
                                        // Check if the route exists before trying to render a link
                                        const routeExists = route().has(
                                            item.destination
                                        );
                                        const isActive = routeExists
                                            ? route().current(item.activeCheck)
                                            : false;

                                        return (
                                            <NavLink
                                                key={item.label}
                                                href={
                                                    routeExists
                                                        ? route(
                                                              item.destination
                                                          )
                                                        : "#"
                                                }
                                                active={isActive}
                                                // This className logic is correct for the Breeze NavLink
                                                className={`relative inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium
                                                ${
                                                    isActive
                                                        ? "border-indigo-500 text-indigo-600" // Active
                                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" // Inactive
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
                                                {item.showBadge &&
                                                    item.badgeCount > 0 && (
                                                        <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                                            {item.badgeCount >
                                                            99
                                                                ? "99+"
                                                                : item.badgeCount}
                                                        </span>
                                                    )}
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. Right Side: Bell & Profile */}
                            <div className="hidden sm:flex sm:items-center sm:ml-6">
                                <Link
                                    href={
                                        route().has(
                                            "teacher.interventions.index"
                                        )
                                            ? route(
                                                  "teacher.interventions.index"
                                              )
                                            : "#"
                                    }
                                    className="relative p-2 rounded-full text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700"
                                >
                                    <Bell size={24} />
                                    <NotificationBadge
                                        count={pendingInterventions}
                                    />
                                </Link>

                                <DarkModeToggle className="ml-3" />

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
                                            <Dropdown.Link
                                                href={route("logout")}
                                                method="post"
                                                as="button"
                                            >
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>

                            {/* 3. Hamburger Menu (Mobile) */}
                            <div className="-mr-2 flex items-center sm:hidden">
                                <button
                                    onClick={() =>
                                        setShowingNavigationDropdown(
                                            (previousState) => !previousState
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

                    {/* Responsive Navigation Menu (Mobile) */}
                    <div
                        className={
                            (showingNavigationDropdown ? "block" : "hidden") +
                            " sm:hidden border-t"
                        }
                    >
                        <div className="pt-2 pb-3 space-y-1">
                            {menuItems.map((item) => {
                                const routeExists = route().has(
                                    item.destination
                                );
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
                                            {item.showBadge &&
                                                item.badgeCount > 0 && (
                                                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                                        {item.badgeCount > 99
                                                            ? "99+"
                                                            : item.badgeCount}
                                                    </span>
                                                )}
                                        </div>
                                    </ResponsiveNavLink>
                                );
                            })}
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
                                <ResponsiveNavLink
                                    method="post"
                                    href={route("logout")}
                                    as="button"
                                >
                                    Log Out
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* --- (NEW) Page Content (Full Width) --- */}
                <main className="flex-1 p-6">
                    {/* We use max-w-full to allow tables to use the whole screen */}
                    <div className="max-w-full mx-auto">{children}</div>
                </main>
                <LoadingOverlay />
            </div>
        </LoadingProvider>
    );
}

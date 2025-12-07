import { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    LayoutDashboard,
    Building2,
    Users,
    BookOpen,
    Settings,
    ChevronDown,
    Menu,
    X,
    LogOut,
    User,
    Bell,
    Shield,
    Sparkles,
} from "lucide-react";

const navigation = [
    {
        name: "Dashboard",
        href: route("superadmin.dashboard"),
        icon: LayoutDashboard,
    },
    {
        name: "Departments",
        href: route("superadmin.departments.index"),
        icon: Building2,
    },
    {
        name: "Admins",
        href: route("superadmin.admins.index"),
        icon: Users,
    },
    {
        name: "Curriculum",
        href: route("superadmin.curriculum.index"),
        icon: BookOpen,
    },
    {
        name: "Settings",
        href: route("superadmin.settings.index"),
        icon: Settings,
    },
];

export default function SuperAdminLayout({ children }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const currentPath = window.location.pathname;

    const isActive = (href) => {
        const url = new URL(href, window.location.origin);
        return currentPath.startsWith(url.pathname);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-full flex-col">
                    {/* Logo Section */}
                    <div className="flex h-20 items-center justify-between px-5 border-b border-slate-700/50">
                        <Link
                            href={route("superadmin.dashboard")}
                            className="flex items-center gap-3 group"
                        >
                            <div className="relative">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
                            </div>
                            <div>
                                <span className="text-lg font-bold text-white tracking-tight">
                                    SATIS
                                </span>
                                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                                    Super Admin Panel
                                </p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700/50 hover:text-white lg:hidden transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
                        <p className="px-3 mb-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Main Menu
                        </p>
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                                        active
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25"
                                            : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                    }`}
                                >
                                    <div
                                        className={`p-1 rounded-lg transition-colors ${
                                            active
                                                ? "bg-white/20"
                                                : "bg-slate-800/50 group-hover:bg-slate-700/50"
                                        }`}
                                    >
                                        <Icon size={18} />
                                    </div>
                                    {item.name}
                                    {active && (
                                        <Sparkles
                                            size={14}
                                            className="ml-auto text-blue-200"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="border-t border-slate-700/50 p-4">
                        <div className="rounded-xl bg-slate-800/50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                                        {auth.user?.name
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-slate-800" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">
                                        {auth.user?.name}
                                    </p>
                                    <p className="truncate text-xs text-slate-400 flex items-center gap-1">
                                        <Shield size={10} />
                                        Super Administrator
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Top navbar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 lg:hidden transition-colors"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="hidden md:block">
                            <h2 className="text-sm font-medium text-slate-600">
                                Welcome back,
                            </h2>
                            <p className="text-lg font-semibold text-slate-900">
                                {auth.user?.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500" />
                        </button>

                        {/* User dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-3 rounded-xl p-2 pr-3 text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium text-sm">
                                    {auth.user?.name?.charAt(0).toUpperCase() ||
                                        "U"}
                                </div>
                                <span className="hidden text-sm font-medium md:block">
                                    {auth.user?.name?.split(" ")[0]}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ${
                                        userMenuOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {userMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setUserMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl bg-white p-2 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                                        <div className="px-3 py-2 border-b border-slate-100 mb-2">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {auth.user?.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {auth.user?.email}
                                            </p>
                                        </div>
                                        <Link
                                            href={route("profile.edit")}
                                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            <User size={16} />
                                            Profile Settings
                                        </Link>
                                        <Link
                                            href={route("logout")}
                                            method="post"
                                            as="button"
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">{children}</main>
            </div>
        </div>
    );
}

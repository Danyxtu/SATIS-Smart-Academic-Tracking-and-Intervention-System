import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Users,
    GraduationCap,
    UserCog,
    Shield,
    TrendingUp,
    UserPlus,
    ArrowRight,
    Clock,
} from "lucide-react";

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, iconBgColor, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {value}
                </p>
                {subtitle && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-xl ${iconBgColor}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

// Recent User Row Component
const RecentUserRow = ({ user }) => {
    const roleColors = {
        student: "bg-blue-100 text-blue-700",
        teacher: "bg-green-100 text-green-700",
        admin: "bg-purple-100 text-purple-700",
    };

    const roleIcons = {
        student: GraduationCap,
        teacher: UserCog,
        admin: Shield,
    };

    const RoleIcon = roleIcons[user.role] || Users;

    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {user.name.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                        roleColors[user.role]
                    }`}
                >
                    <RoleIcon size={12} />
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(user.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};

// Mini Chart Component for User Trends
const MiniTrendChart = ({ data }) => {
    const maxCount = Math.max(...data.map((d) => d.count), 1);

    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                        className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                        style={{
                            height: `${Math.max(
                                (item.count / maxCount) * 100,
                                8
                            )}%`,
                            minHeight: "4px",
                        }}
                        title={`${item.date}: ${item.count} users`}
                    />
                    <span className="text-[10px] text-gray-400 mt-1 truncate w-full text-center">
                        {item.date.split(" ")[1]}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default function Dashboard({ auth, stats, userTrends }) {
    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const statCards = [
        {
            title: "Total Users",
            value: stats.totalUsers,
            icon: Users,
            iconBgColor: "bg-indigo-500",
            subtitle: "All registered accounts",
        },
        {
            title: "Students",
            value: stats.totalStudents,
            icon: GraduationCap,
            iconBgColor: "bg-blue-500",
            subtitle: `${(
                (stats.totalStudents / stats.totalUsers) * 100 || 0
            ).toFixed(1)}% of users`,
        },
        {
            title: "Teachers",
            value: stats.totalTeachers,
            icon: UserCog,
            iconBgColor: "bg-green-500",
            subtitle: `${(
                (stats.totalTeachers / stats.totalUsers) * 100 || 0
            ).toFixed(1)}% of users`,
        },
        {
            title: "Administrators",
            value: stats.totalAdmins,
            icon: Shield,
            iconBgColor: "bg-purple-500",
            subtitle: "System administrators",
        },
    ];

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Welcome, {auth.user.name}!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {currentDate} • Admin Dashboard
                        </p>
                    </div>
                    <Link
                        href={route("admin.users.create")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        <UserPlus size={18} />
                        Add New User
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Users */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users size={20} className="text-purple-500" />
                            Recent Users
                        </h2>
                        <Link
                            href={route("admin.users.index")}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                            View All
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                    {stats.recentUsers && stats.recentUsers.length > 0 ? (
                        <div>
                            {stats.recentUsers.map((user) => (
                                <RecentUserRow key={user.id} user={user} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Users
                                size={48}
                                className="mx-auto mb-3 opacity-50"
                            />
                            <p>No users registered yet.</p>
                        </div>
                    )}
                </div>

                {/* User Creation Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <TrendingUp size={20} className="text-green-500" />
                        User Registrations
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Last 7 days
                    </p>

                    {userTrends && userTrends.length > 0 ? (
                        <MiniTrendChart data={userTrends} />
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>No trend data available.</p>
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                                Total this week
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {userTrends?.reduce(
                                    (sum, d) => sum + d.count,
                                    0
                                ) || 0}{" "}
                                users
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-xl font-bold mb-2">Quick Actions</h2>
                <p className="text-purple-100 mb-4">
                    Manage your users efficiently with these common tasks.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href={route("admin.users.create")}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                    >
                        <UserPlus size={18} />
                        Create Student
                    </Link>
                    <Link
                        href={route("admin.users.create")}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                    >
                        <UserCog size={18} />
                        Create Teacher
                    </Link>
                    <Link
                        href={route("admin.users.index")}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                    >
                        <Users size={18} />
                        Manage All Users
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
}

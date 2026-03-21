import { House, Users, UserPlus, Key } from "lucide-react";

export const adminRoutes = [
    {
        name: "Dashboard",
        path: "admin.dashboard",
        icon: House,
    },
    {
        name: "User Management",
        path: "admin.teachers.index",
        icon: Users,
    },
    {
        name: "Teacher Registration",
        path: "admin.teachers-registration.index",
        icon: UserPlus,
    },
    {
        name: "Password Request",
        path: "admin.password-reset-requests",
        icon: Key,
    },
];

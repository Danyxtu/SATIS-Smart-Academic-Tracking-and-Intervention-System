import { House, Users, Key, Layers3, BookOpen } from "lucide-react";

export const adminRoutes = [
    {
        name: "Dashboard",
        path: "admin.dashboard",
        icon: House,
    },
    {
        name: "User Management",
        path: "admin.users.index",
        icon: Users,
    },
    {
        name: "Section Management",
        path: "admin.sections.index",
        icon: Layers3,
    },
    {
        name: "Class Management",
        path: "admin.classes.index",
        icon: BookOpen,
    },
    {
        name: "Password Request",
        path: "admin.password-reset-requests",
        icon: Key,
    },
];

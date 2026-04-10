import {
    House,
    Building2,
    Users,
    Settings,
    Archive,
    BookOpen,
    Layers,
    Key,
} from "lucide-react";

export const superAdminRoutes = [
    {
        label: "Dashboard",
        path: "superadmin.dashboard",
        icon: House,
    },
    {
        label: "Departments",
        path: "superadmin.departments.index",
        icon: Building2,
    },
    {
        label: "Subject Management",
        path: "superadmin.subjects.index",
        icon: BookOpen,
    },
    {
        label: "Section & Class Management",
        path: "superadmin.academic-management.index",
        activeCheck: "superadmin.academic-management.*",
        icon: Layers,
    },
    {
        label: "User Management",
        path: "superadmin.users.index",
        icon: Users,
    },
    {
        label: "Password Request",
        path: "superadmin.password-reset-requests",
        icon: Key,
    },
    {
        label: "Archive",
        path: "superadmin.archive.index",
        activeCheck: "superadmin.archive.*",
        icon: Archive,
    },
    {
        label: "School Settings",
        path: "superadmin.settings.index",
        icon: Settings,
    },
];

import {
    House,
    Building2,
    GitBranch,
    Users,
    Settings,
    BookOpen,
    Layers,
    Key,
    ClipboardList,
    Archive,
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
        label: "School Tracks Management",
        path: "superadmin.school-tracks.index",
        icon: GitBranch,
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
        label: "School Settings",
        path: "superadmin.settings.index",
        icon: Settings,
    },
    {
        label: "Activity Logs",
        path: "superadmin.activity-logs.index",
        icon: ClipboardList,
    },
    {
        label: "Archive",
        path: "superadmin.archive.index",
        icon: Archive,
    },
];

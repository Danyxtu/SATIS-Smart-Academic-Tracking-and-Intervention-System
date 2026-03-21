import { House, Building2, Users, Settings } from "lucide-react";

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
        label: "User Management",
        path: "superadmin.users.index",
        icon: Users,
    },
    {
        label: "Settings",
        path: "superadmin.settings.index",
        icon: Settings,
    },
];

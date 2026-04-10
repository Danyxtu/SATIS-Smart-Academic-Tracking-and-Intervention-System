import {
    House,
    BookOpen,
    CalendarCheck,
    ClipboardList,
    SlidersHorizontal,
} from "lucide-react";

export const teachersRoutes = [
    {
        name: "Dashboard",
        path: "teacher.dashboard",
        icon: House,
    },
    {
        name: "My Classes",
        path: "teacher.classes.index",
        icon: BookOpen,
    },
    {
        name: "Attendance",
        path: "teacher.attendance.index",
        icon: CalendarCheck,
    },
    {
        name: "Interventions",
        path: "teacher.interventions.index",
        icon: ClipboardList,
    },
    {
        name: "Class Settings",
        path: "teacher.class-settings.index",
        icon: SlidersHorizontal,
    },
];

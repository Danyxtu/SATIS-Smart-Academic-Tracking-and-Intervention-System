import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Building2,
    CalendarRange,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Eye,
    GraduationCap,
    Search,
    Shield,
    Users,
    X,
} from "lucide-react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import ArchiveDetailModal from "@/Components/Superadmin/ArchiveDetailModal";

const TAB_OPTIONS = [
    {
        key: "students",
        label: "Students",
        summaryKey: "students",
        icon: GraduationCap,
        accent: "emerald",
    },
    {
        key: "teachers",
        label: "Teachers",
        summaryKey: "teachers",
        icon: Users,
        accent: "blue",
    },
    {
        key: "super-admins",
        label: "Super Admins",
        summaryKey: "super_admins",
        icon: Shield,
        accent: "violet",
    },
    {
        key: "departments",
        label: "Departments",
        summaryKey: "departments",
        icon: Building2,
        accent: "amber",
    },
    {
        key: "classes",
        label: "Classes",
        summaryKey: "classes",
        icon: BookOpen,
        accent: "rose",
    },
    {
        key: "activity-logs",
        label: "Activity Logs",
        summaryKey: "audit_logs",
        icon: ClipboardList,
        accent: "emerald",
    },
];

const SEMESTER_OPTIONS = [
    { value: "all", label: "All Semesters" },
    { value: "1", label: "1st Semester" },
    { value: "2", label: "2nd Semester" },
];

const ROLE_LABELS = {
    super_admin: "Super Admin",
    admin: "Admin",
    teacher: "Teacher",
    student: "Student",
};

const ARCHIVE_AUDIT_ROLES = [
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "teacher", label: "Teacher" },
    { value: "student", label: "Student" },
];

function formatDateTime(value) {
    if (!value) return "-";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }

    return parsed.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function roleLabel(value) {
    if (!value) return "-";
    return ROLE_LABELS[value] ?? value;
}

function roleArrayLabel(roles) {
    if (!Array.isArray(roles) || roles.length === 0) {
        return "-";
    }

    return roles.map((role) => roleLabel(role)).join(", ");
}

function StatCard({ icon: Icon, label, value, accent, active, onClick }) {
    const accents = {
        emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
        blue: "bg-blue-50 text-blue-600 ring-blue-200",
        violet: "bg-violet-50 text-violet-600 ring-violet-200",
        amber: "bg-amber-50 text-amber-600 ring-amber-200",
        rose: "bg-rose-50 text-rose-600 ring-rose-200",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-4 rounded-xl border bg-white px-5 py-4 text-left transition ${
                active
                    ? "border-emerald-300 ring-2 ring-emerald-100"
                    : "border-slate-200 hover:border-slate-300"
            }`}
        >
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accents[accent]}`}
            >
                <Icon size={17} />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">
                    {value}
                </p>
            </div>
        </button>
    );
}

function Badge({ children }) {
    return (
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {children}
        </span>
    );
}

export default function Index({
    archives = [],
    selectedArchive = null,
    summary = {},
    options = {},
    panelData = {},
    filters = {},
}) {
    const [search, setSearch] = useState(filters.search || "");
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailRow, setDetailRow] = useState(null);
    const [detailPayload, setDetailPayload] = useState(null);
    const [detailError, setDetailError] = useState("");
    const [detailLoading, setDetailLoading] = useState(false);

    const activeTab = filters.tab || "students";
    const semester = filters.semester || "all";

    const rows = panelData?.rows?.data || [];

    const selectedArchiveKey =
        filters.archive || selectedArchive?.archive_key || "";
    const hasSelectedArchive = Boolean(selectedArchive?.archive_key);

    const studentOptions = options?.student_filters || {};
    const classOptions = options?.class_filters || {};
    const departmentOptions = Array.isArray(options?.department_codes)
        ? options.department_codes
        : [];
    const trackOptions = Array.isArray(options?.tracks) ? options.tracks : [];

    const studentGradeLevels = useMemo(() => {
        if (
            Array.isArray(studentOptions.grade_levels) &&
            studentOptions.grade_levels.length > 0
        ) {
            return studentOptions.grade_levels.map((grade) => String(grade));
        }

        return [];
    }, [studentOptions.grade_levels]);

    const classGradeLevels = useMemo(() => {
        if (
            Array.isArray(classOptions.grade_levels) &&
            classOptions.grade_levels.length > 0
        ) {
            return classOptions.grade_levels.map((grade) => String(grade));
        }

        return [];
    }, [classOptions.grade_levels]);

    const availableGradeLevels = useMemo(() => {
        if (activeTab === "classes") {
            if (classGradeLevels.length > 0) {
                return classGradeLevels;
            }

            return studentGradeLevels;
        }

        if (activeTab === "students") {
            if (studentGradeLevels.length > 0) {
                return studentGradeLevels;
            }

            return classGradeLevels;
        }

        const merged = Array.from(
            new Set([...studentGradeLevels, ...classGradeLevels]),
        );

        if (merged.length > 0) {
            return merged;
        }

        return ["11", "12"];
    }, [activeTab, studentGradeLevels, classGradeLevels]);

    const activeGradeLevelFilter = useMemo(() => {
        if (activeTab === "classes") {
            return filters.class_grade_level || "all";
        }

        if (activeTab === "students") {
            return filters.grade_level || "all";
        }

        return filters.grade_level || filters.class_grade_level || "all";
    }, [activeTab, filters.class_grade_level, filters.grade_level]);

    const activeDepartmentFilter = filters.department || "all";
    const activeTrackFilter = filters.track || "all";
    const activeAuditRoleFilter = filters.audit_role || "all";

    const resolvedSummary = useMemo(
        () => ({
            students: Number(summary?.students || 0),
            teachers: Number(summary?.teachers || 0),
            super_admins: Number(summary?.super_admins || 0),
            departments: Number(summary?.departments || 0),
            classes: Number(summary?.classes || 0),
            audit_logs: Number(summary?.audit_logs || 0),
        }),
        [summary],
    );

    useEffect(() => {
        setSearch(filters.search || "");
    }, [filters.search]);

    const applyFilters = (overrides = {}) => {
        router.get(
            route("superadmin.archive.index"),
            {
                ...filters,
                archive: selectedArchiveKey,
                ...overrides,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        applyFilters({ search });
    };

    const clearSearch = () => {
        setSearch("");
        applyFilters({ search: "" });
    };

    const switchTab = (nextTab) => {
        const nextFilters = {
            tab: nextTab,
            grade_level: "",
            class_grade_level: "",
            section: "",
            strand: "",
            department: "",
            track: "",
            audit_role: "",
        };

        if (nextTab === "students") {
            nextFilters.grade_level = filters.grade_level || "";
        }

        if (nextTab === "classes") {
            nextFilters.class_grade_level = filters.class_grade_level || "";
            nextFilters.track = filters.track || "";
        }

        if (nextTab === "teachers") {
            nextFilters.department = filters.department || "";
        }

        if (nextTab === "departments") {
            nextFilters.track = filters.track || "";
        }

        if (nextTab === "activity-logs") {
            nextFilters.audit_role = filters.audit_role || "";
        }

        applyFilters(nextFilters);
    };

    const applyGradeLevelFilter = (nextGradeLevel) => {
        const nextValue =
            nextGradeLevel === "all" ? "" : String(nextGradeLevel);

        if (activeTab === "students") {
            applyFilters({
                grade_level: nextValue,
                section: "",
                strand: "",
            });

            return;
        }

        if (activeTab === "classes") {
            applyFilters({ class_grade_level: nextValue });

            return;
        }

        applyFilters({
            grade_level: nextValue,
            class_grade_level: nextValue,
        });
    };

    const applyDepartmentFilter = (nextDepartment) => {
        applyFilters({
            department: nextDepartment === "all" ? "" : nextDepartment,
        });
    };

    const applyTrackFilter = (nextTrack) => {
        applyFilters({
            track: nextTrack === "all" ? "" : nextTrack,
        });
    };

    const applyAuditRoleFilter = (nextRole) => {
        applyFilters({
            audit_role: nextRole === "all" ? "" : nextRole,
        });
    };

    const closeDetails = () => {
        setDetailModalOpen(false);
        setDetailRow(null);
        setDetailPayload(null);
        setDetailError("");
        setDetailLoading(false);
    };

    const openDetails = async (row) => {
        setDetailRow(row);
        setDetailError("");
        setDetailLoading(false);
        setDetailPayload(null);

        if (!selectedArchiveKey) {
            setDetailError("Select an archive first.");
            setDetailModalOpen(true);
            return;
        }

        if (activeTab === "super-admins") {
            setDetailPayload(row);
            setDetailModalOpen(true);
            return;
        }

        if (activeTab === "activity-logs") {
            setDetailPayload(row);
            setDetailModalOpen(true);
            return;
        }

        let endpoint = "";

        if (activeTab === "students") {
            endpoint = route("superadmin.archive.students.show", {
                archive: selectedArchiveKey,
                studentUserId: row.student_user_id,
            });
        } else if (activeTab === "teachers") {
            endpoint = route("superadmin.archive.teachers.show", {
                archive: selectedArchiveKey,
                teacherUserId: row.teacher_user_id,
            });
        } else if (activeTab === "departments") {
            endpoint = route("superadmin.archive.departments.show", {
                archive: selectedArchiveKey,
                archiveDepartment: row.id,
            });
        } else if (activeTab === "classes") {
            endpoint = route("superadmin.archive.classes.show", {
                archive: selectedArchiveKey,
                archiveClass: row.id,
            });
        }

        if (!endpoint) {
            setDetailError("No detail endpoint is configured for this tab.");
            setDetailModalOpen(true);
            return;
        }

        setDetailModalOpen(true);
        setDetailLoading(true);

        try {
            const url = new URL(endpoint, window.location.origin);
            if (semester) {
                url.searchParams.set("semester", semester);
            }

            const response = await fetch(url.toString(), {
                headers: { Accept: "application/json" },
            });

            if (!response.ok) {
                throw new Error("Unable to load details.");
            }

            const payload = await response.json();
            setDetailPayload(payload);
        } catch (error) {
            setDetailError(error?.message || "Unable to load details.");
        } finally {
            setDetailLoading(false);
        }
    };

    const renderRowCells = (row) => {
        if (activeTab === "students") {
            return (
                <>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {row.student_name}
                        <p className="text-xs font-normal text-slate-500">
                            {row.student_username || "-"}
                        </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        <div>{row.grade_level || "-"}</div>
                        <div className="text-xs text-slate-500">
                            {row.section_name || "-"}
                        </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.strand || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.classes_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.average_grade ?? "-"}
                    </td>
                </>
            );
        }

        if (activeTab === "teachers") {
            return (
                <>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {row.teacher_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.teacher_department_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.classes_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.students_total}
                    </td>
                </>
            );
        }

        if (activeTab === "super-admins") {
            return (
                <>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {row.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.username || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.personal_email || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {roleArrayLabel(row.roles)}
                    </td>
                </>
            );
        }

        if (activeTab === "departments") {
            return (
                <>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {row.department_name}
                        <p className="text-xs font-normal text-slate-500">
                            {row.department_code}
                        </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.track || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.specializations_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.admins_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.teachers_count}
                    </td>
                </>
            );
        }

        if (activeTab === "classes") {
            return (
                <>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {row.subject_name}
                        <p className="text-xs font-normal text-slate-500">
                            {row.subject_code || "-"}
                        </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.teacher_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        <div>Grade {row.grade_level || "-"}</div>
                        <div className="text-xs text-slate-500">
                            {row.section_name || "-"}
                        </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.track || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.semester ? `Sem ${row.semester}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                        {row.students_total ?? 0}
                    </td>
                </>
            );
        }

        return (
            <>
                <td className="px-4 py-3 text-sm text-slate-700">
                    {formatDateTime(row.logged_at)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    {row.task}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                    {row.user_name || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                    {roleArrayLabel(row.user_roles)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                    {row.semester ? `Sem ${row.semester}` : "All"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                    <Badge>{row.is_success ? "Success" : "Failed"}</Badge>
                </td>
            </>
        );
    };

    const columnHeaders = () => {
        if (activeTab === "students") {
            return ["Student", "Grade/Section", "Strand", "Classes", "Average"];
        }

        if (activeTab === "teachers") {
            return ["Teacher", "Department", "Classes", "Students"];
        }

        if (activeTab === "super-admins") {
            return ["Name", "Username", "Email", "Roles"];
        }

        if (activeTab === "departments") {
            return [
                "Department",
                "Track",
                "Specializations",
                "Admins",
                "Teachers",
            ];
        }

        if (activeTab === "classes") {
            return [
                "Subject",
                "Teacher",
                "Grade/Section",
                "Track",
                "Semester",
                "Students",
            ];
        }

        return ["Date", "Task", "User", "Roles", "Semester", "Status"];
    };

    const renderTabFilters = () => {
        if (activeTab === "students") {
            return (
                <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Grade Level
                        </span>
                        <button
                            type="button"
                            onClick={() => applyGradeLevelFilter("all")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeGradeLevelFilter === "all"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            All Grade Levels
                        </button>
                        {availableGradeLevels.map((gradeLevel) => (
                            <button
                                key={gradeLevel}
                                type="button"
                                onClick={() =>
                                    applyGradeLevelFilter(gradeLevel)
                                }
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    activeGradeLevelFilter === gradeLevel
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {gradeLevel}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeTab === "teachers") {
            return (
                <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Department
                        </span>
                        <button
                            type="button"
                            onClick={() => applyDepartmentFilter("all")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeDepartmentFilter === "all"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            All Departments
                        </button>
                        {departmentOptions.map((department) => (
                            <button
                                key={department.code}
                                type="button"
                                onClick={() =>
                                    applyDepartmentFilter(department.code)
                                }
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    activeDepartmentFilter === department.code
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                                title={department.name}
                            >
                                {department.code}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeTab === "departments") {
            return (
                <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Track
                        </span>
                        <button
                            type="button"
                            onClick={() => applyTrackFilter("all")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeTrackFilter === "all"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            All Tracks
                        </button>
                        {trackOptions.map((track) => (
                            <button
                                key={track}
                                type="button"
                                onClick={() => applyTrackFilter(track)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    activeTrackFilter === track
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {track}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeTab === "classes") {
            return (
                <div className="space-y-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Grade Level
                            </span>
                            <button
                                type="button"
                                onClick={() => applyGradeLevelFilter("all")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    activeGradeLevelFilter === "all"
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                All Grade Levels
                            </button>
                            {availableGradeLevels.map((gradeLevel) => (
                                <button
                                    key={gradeLevel}
                                    type="button"
                                    onClick={() =>
                                        applyGradeLevelFilter(gradeLevel)
                                    }
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        activeGradeLevelFilter === gradeLevel
                                            ? "bg-emerald-600 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    {gradeLevel}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Track
                            </span>
                            <button
                                type="button"
                                onClick={() => applyTrackFilter("all")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    activeTrackFilter === "all"
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                All Tracks
                            </button>
                            {trackOptions.map((track) => (
                                <button
                                    key={track}
                                    type="button"
                                    onClick={() => applyTrackFilter(track)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        activeTrackFilter === track
                                            ? "bg-emerald-600 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    {track}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === "activity-logs") {
            return (
                <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            User Role
                        </span>
                        <button
                            type="button"
                            onClick={() => applyAuditRoleFilter("all")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeAuditRoleFilter === "all"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            All Roles
                        </button>
                        {ARCHIVE_AUDIT_ROLES.map((role) => (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() => applyAuditRoleFilter(role.value)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    activeAuditRoleFilter === role.value
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                Search and semester filters are available for this view.
            </div>
        );
    };

    return (
        <>
            <Head title="Archive" />

            <div className="space-y-6">
                <div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            School Year Archive
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Browse ended school years with semester-aware
                            history.
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Archived School Years
                    </div>

                    {archives.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                            No archived school years available.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {archives.map((archive) => {
                                const isActive =
                                    selectedArchiveKey === archive.archive_key;

                                return (
                                    <button
                                        key={archive.archive_key}
                                        type="button"
                                        onClick={() =>
                                            applyFilters({
                                                archive: archive.archive_key,
                                            })
                                        }
                                        className={`rounded-xl border px-4 py-3 text-left transition ${
                                            isActive
                                                ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                                                : "border-slate-200 bg-white hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {archive.school_year}
                                            </p>
                                            {isActive && (
                                                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                                    Selected
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Captured:{" "}
                                            {formatDateTime(
                                                archive.captured_at,
                                            )}
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Next S.Y.:{" "}
                                            {archive.next_school_year || "-"}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {hasSelectedArchive ? (
                    <>
                        <div className="w-full rounded-xl border border-slate-200 bg-white p-2">
                            <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Semester
                            </div>
                            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
                                {SEMESTER_OPTIONS.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() =>
                                            applyFilters({
                                                semester: item.value,
                                            })
                                        }
                                        className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                            semester === item.value
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                            {TAB_OPTIONS.map((tab) => (
                                <StatCard
                                    key={tab.key}
                                    icon={tab.icon}
                                    label={tab.label}
                                    value={resolvedSummary[tab.summaryKey]}
                                    accent={tab.accent}
                                    active={activeTab === tab.key}
                                    onClick={() => switchTab(tab.key)}
                                />
                            ))}
                        </div>

                        {renderTabFilters()}

                        <div className="rounded-xl border border-slate-200 bg-white p-2">
                            <div className="flex flex-wrap gap-2">
                                {TAB_OPTIONS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => switchTab(tab.key)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                            activeTab === tab.key
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex gap-2"
                        >
                            <div className="relative flex-1">
                                <Search
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={15}
                                />
                                <input
                                    type="text"
                                    placeholder="Search archived records..."
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:text-slate-600"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Search
                            </button>
                        </form>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            {rows.length === 0 ? (
                                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                        <CalendarRange
                                            size={24}
                                            className="text-slate-400"
                                        />
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-800">
                                        No records found
                                    </h3>
                                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                                        Adjust filters or change semester to
                                        view archived data.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    {columnHeaders().map(
                                                        (header) => (
                                                            <th
                                                                key={header}
                                                                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                                            >
                                                                {header}
                                                            </th>
                                                        ),
                                                    )}
                                                    <th className="w-44 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                        Details
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {rows.map((row, index) => (
                                                    <tr
                                                        key={
                                                            row.id ||
                                                            row.student_user_id ||
                                                            row.teacher_user_id ||
                                                            index
                                                        }
                                                    >
                                                        {renderRowCells(row)}
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDetails(
                                                                        row,
                                                                    )
                                                                }
                                                                className="inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
                                                            >
                                                                <Eye
                                                                    size={14}
                                                                />
                                                                View Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {panelData?.rows?.last_page > 1 && (
                                        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 py-3">
                                            <p className="text-xs text-slate-500">
                                                Showing
                                                <span className="mx-1 font-semibold text-slate-700">
                                                    {panelData.rows.from} -{" "}
                                                    {panelData.rows.to}
                                                </span>
                                                of
                                                <span className="mx-1 font-semibold text-slate-700">
                                                    {panelData.rows.total}
                                                </span>
                                            </p>

                                            <div className="flex items-center gap-1">
                                                {panelData.rows.links.map(
                                                    (link, index) => {
                                                        const isPrev =
                                                            index === 0;
                                                        const isNext =
                                                            index ===
                                                            panelData.rows.links
                                                                .length -
                                                                1;
                                                        const isNav =
                                                            isPrev || isNext;

                                                        return (
                                                            <Link
                                                                key={`${link.label}-${index}`}
                                                                href={
                                                                    link.url ||
                                                                    "#"
                                                                }
                                                                className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors ${
                                                                    link.active
                                                                        ? "bg-cyan-600 text-white"
                                                                        : link.url
                                                                          ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                                          : "cursor-not-allowed border border-slate-100 text-slate-300"
                                                                }`}
                                                                dangerouslySetInnerHTML={
                                                                    isNav
                                                                        ? undefined
                                                                        : {
                                                                              __html: link.label,
                                                                          }
                                                                }
                                                            >
                                                                {isNav ? (
                                                                    isPrev ? (
                                                                        <ChevronLeft
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <ChevronRight
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    )
                                                                ) : null}
                                                            </Link>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                        Select an archived school year card first to open and
                        view its data.
                    </div>
                )}
            </div>

            <ArchiveDetailModal
                show={detailModalOpen}
                onClose={closeDetails}
                activeTab={activeTab}
                payload={detailPayload}
                loading={detailLoading}
                error={detailError}
                row={detailRow}
            />
        </>
    );
}

Index.layout = (page) => <SchoolStaffLayout children={page} />;

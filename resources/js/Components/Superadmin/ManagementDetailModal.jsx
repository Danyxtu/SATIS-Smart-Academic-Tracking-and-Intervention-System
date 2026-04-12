import { useForm } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Building2,
    CheckCircle,
    ClipboardList,
    Layers,
    Pencil,
    Save,
    Search,
    Shield,
    User,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import Modal from "@/Components/Modal";

const TRACK_OPTIONS = ["Academic", "TVL"];

const ROLE_LABELS = {
    super_admin: "Super Admin",
    admin: "Admin",
    teacher: "Teacher",
    student: "Student",
};

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

function toLabelRole(value) {
    if (!value) return "-";
    return ROLE_LABELS[value] ?? String(value);
}

function normalizeRoles(roles) {
    if (!Array.isArray(roles)) {
        return [];
    }

    return roles
        .map((role) => (role ? String(role) : ""))
        .filter((role) => role !== "");
}

function initials(value) {
    if (!value) return "--";

    const chunks = String(value)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((chunk) => chunk[0]?.toUpperCase() || "");

    return chunks.join("") || "--";
}

function personName(person) {
    if (!person) return "Unnamed user";

    if (person.name) return person.name;

    return (
        [person.first_name, person.middle_name, person.last_name]
            .filter(Boolean)
            .join(" ") || "Unnamed user"
    );
}

function personEmail(person) {
    return person?.email || person?.personal_email || "No email";
}

function personInitials(person) {
    const first = person?.first_name?.[0] ?? person?.name?.[0] ?? "U";
    const last = person?.last_name?.[0] ?? "";

    return `${first}${last}`.toUpperCase();
}

function gradeTone(grade) {
    const score = Number(grade);

    if (score >= 85) {
        return {
            pill: "bg-emerald-200 text-emerald-900",
            bar: "#059669",
        };
    }

    if (score >= 75) {
        return {
            pill: "bg-emerald-50 text-emerald-700",
            bar: "#10b981",
        };
    }

    return {
        pill: "bg-rose-100 text-rose-700",
        bar: "#ef4444",
    };
}

function asNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function formatJson(value) {
    if (
        value === null ||
        value === undefined ||
        (typeof value === "object" && Object.keys(value).length === 0)
    ) {
        return "No data";
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return "Unable to render data";
    }
}

function FieldRow({ label, value, mono = false }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-emerald-200 py-2.5 last:border-b-0">
            <span className="text-xs font-medium text-emerald-700">
                {label}
            </span>
            <span
                className={`text-right text-[13px] font-semibold text-emerald-900 ${mono ? "font-mono" : ""}`}
            >
                {value || "-"}
            </span>
        </div>
    );
}

function SummaryCard({ label, value, muted = false }) {
    return (
        <div
            className={`rounded-md px-3 py-2 ${
                muted ? "bg-emerald-200" : "bg-emerald-50"
            }`}
        >
            <p
                className={`text-[11px] ${
                    muted ? "text-emerald-700" : "text-emerald-700"
                }`}
            >
                {label}
            </p>
            <p className="text-xl font-semibold text-emerald-900">{value}</p>
        </div>
    );
}

function EmptyCard({ message }) {
    return (
        <div className="rounded-md border border-dashed border-emerald-200 bg-white px-4 py-5 text-sm text-emerald-700">
            {message}
        </div>
    );
}

function SidebarButton({ active, onClick, icon: Icon, label, count }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold transition ${
                active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-emerald-50"
            }`}
        >
            <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${
                    active ? "bg-emerald-200" : "bg-slate-100"
                }`}
            >
                <Icon size={14} className="text-emerald-700" />
            </span>
            <span>{label}</span>
            {typeof count === "number" && (
                <span className="ml-auto rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700">
                    {count}
                </span>
            )}
        </button>
    );
}

export default function ManagementDetailModal({
    show,
    onClose,
    activeTab,
    payload,
    loading,
    error,
    row,
    departmentManageMode = "view",
    onDepartmentSaved,
}) {
    const [panel, setPanel] = useState("info");
    const [deptEditMode, setDeptEditMode] = useState(false);
    const [deptTeachers, setDeptTeachers] = useState([]);
    const [deptTeachersLoaded, setDeptTeachersLoaded] = useState(false);
    const [deptTeachersLoading, setDeptTeachersLoading] = useState(false);
    const [deptTeacherSearch, setDeptTeacherSearch] = useState("");
    const [deptSpecializationInput, setDeptSpecializationInput] = useState("");

    const isDepartmentTab = activeTab === "departments";
    const isDepartmentCreateMode = departmentManageMode === "create";

    const {
        data: deptData,
        setData: setDeptData,
        post: postDepartment,
        put: putDepartment,
        processing: departmentSaving,
        errors: departmentErrors,
        clearErrors: clearDepartmentErrors,
    } = useForm({
        department_name: "",
        department_code: "",
        track: "Academic",
        description: "",
        is_active: true,
        specialization_names: [],
        teacher_ids: [],
        admin_id: "",
    });

    const sourceDepartment = useMemo(() => {
        if (!isDepartmentTab) {
            return null;
        }

        const fallback = {
            id: row?.id,
            name: row?.department_name,
            code: row?.department_code,
            track: row?.track,
            description: row?.description,
            is_active: row?.is_active,
            classes_count: row?.classes_count,
            admins_count: row?.admins_count,
            teachers_count: row?.teachers_count,
            students_count: row?.students_count,
            specializations: [],
            admins: [],
            teachers: [],
        };

        const incoming = payload?.department || {};
        const merged = {
            ...fallback,
            ...incoming,
        };

        const admins = Array.isArray(merged.admins)
            ? merged.admins
            : Array.isArray(merged.department_admins)
              ? merged.department_admins
              : merged.department_admin
                ? [merged.department_admin]
                : [];

        const teachers = Array.isArray(merged.teachers)
            ? merged.teachers
            : Array.isArray(merged.department_teachers)
              ? merged.department_teachers
              : [];

        const specializations = (
            Array.isArray(merged.specializations) ? merged.specializations : []
        )
            .map((item) => {
                if (typeof item === "string") {
                    return item;
                }

                if (item && typeof item === "object") {
                    return (
                        item.specialization_name ||
                        item.name ||
                        item.label ||
                        ""
                    );
                }

                return "";
            })
            .filter(Boolean);

        return {
            id: merged.id ?? null,
            name: merged.name ?? merged.department_name ?? "",
            code: merged.code ?? merged.department_code ?? "",
            track: merged.track || "Academic",
            description: merged.description || "",
            is_active: merged.is_active ?? true,
            classes_count: asNumber(merged.classes_count, 0),
            admins_count: asNumber(merged.admins_count, admins.length),
            teachers_count: asNumber(merged.teachers_count, teachers.length),
            students_count: asNumber(merged.students_count, 0),
            specializations,
            admins,
            teachers,
        };
    }, [isDepartmentTab, payload, row]);

    const hydrateDepartmentForm = (department) => {
        if (!department) {
            return;
        }

        const combinedTeacherIds = [
            ...department.teachers.map((teacher) => teacher.id),
            ...department.admins.map((admin) => admin.id),
        ]
            .filter(Boolean)
            .map((id) => String(id));

        const teacherIds = Array.from(new Set(combinedTeacherIds));
        const adminId = department.admins[0]?.id
            ? String(department.admins[0].id)
            : "";

        setDeptData({
            department_name: department.name || "",
            department_code: department.code || "",
            track: department.track || "Academic",
            description: department.description || "",
            is_active: department.is_active ?? true,
            specialization_names: department.specializations || [],
            teacher_ids: teacherIds,
            admin_id: adminId,
        });
    };

    useEffect(() => {
        if (!show || !isDepartmentTab) {
            return;
        }

        hydrateDepartmentForm(sourceDepartment);
        setDeptEditMode(
            departmentManageMode === "edit" ||
                departmentManageMode === "create",
        );
        setDeptTeachers([]);
        setDeptTeachersLoaded(false);
        setDeptTeachersLoading(false);
        setDeptTeacherSearch("");
        setDeptSpecializationInput("");
        clearDepartmentErrors();
    }, [
        show,
        isDepartmentTab,
        sourceDepartment,
        departmentManageMode,
        clearDepartmentErrors,
    ]);

    useEffect(() => {
        if (
            !show ||
            !isDepartmentTab ||
            panel !== "assign" ||
            deptTeachersLoaded
        ) {
            return;
        }

        const loadTeachers = async () => {
            setDeptTeachersLoading(true);

            try {
                if (sourceDepartment?.id) {
                    const response = await fetch(
                        route(
                            "superadmin.departments.teachers",
                            sourceDepartment.id,
                        ),
                    );
                    const payloadData = await response.json();
                    const list = Array.isArray(payloadData?.teachers)
                        ? payloadData.teachers
                        : [];

                    setDeptTeachers(list);
                } else {
                    const response = await fetch(
                        route("superadmin.departments.unassigned-teachers"),
                    );
                    const payloadData = await response.json();

                    setDeptTeachers(
                        Array.isArray(payloadData) ? payloadData : [],
                    );
                }
            } catch {
                setDeptTeachers([]);
            } finally {
                setDeptTeachersLoaded(true);
                setDeptTeachersLoading(false);
            }
        };

        loadTeachers();
    }, [
        show,
        isDepartmentTab,
        panel,
        deptTeachersLoaded,
        sourceDepartment?.id,
    ]);

    useEffect(() => {
        setPanel("info");
    }, [activeTab, show, payload]);

    const data = useMemo(() => {
        if (activeTab === "students") {
            const student = payload?.student || {
                user_id: row?.student_user_id,
                name: row?.student_name,
                username: row?.student_username,
                grade_level: row?.grade_level,
                section_name: row?.section_name,
                strand: row?.strand,
            };

            const classes = Array.isArray(payload?.classes)
                ? payload.classes
                : [];
            const average =
                classes.length > 0
                    ? Math.round(
                          classes.reduce(
                              (sum, entry) => sum + asNumber(entry.final_grade),
                              0,
                          ) / classes.length,
                      )
                    : asNumber(row?.average_grade, 0);

            const passedCount = classes.filter((entry) => {
                const remarks = String(entry?.remarks || "").toLowerCase();
                return remarks === "passed" || entry?.passed === true;
            }).length;

            return {
                identity: {
                    title: student.name || "Archived Student",
                    subtitle: student.username || "student",
                    tags: [
                        student.grade_level
                            ? `Grade ${student.grade_level}`
                            : null,
                        student.section_name || null,
                    ].filter(Boolean),
                    keyLabel: "LRN",
                    keyValue: student.lrn || row?.student_lrn || "-",
                },
                headerTitle: "Student information",
                headerSubtitle: "Personal and academic details",
                infoLabel: "Student info",
                secondaryLabel: "Classes",
                secondaryCount: classes.length,
                infoPanel: (
                    <div className="space-y-3">
                        <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Personal
                            </p>
                            <div className="rounded-md bg-emerald-50 px-4">
                                <FieldRow
                                    label="Full name"
                                    value={student.name}
                                />
                                <FieldRow
                                    label="User ID"
                                    value={student.user_id}
                                    mono
                                />
                                <FieldRow
                                    label="Username"
                                    value={student.username}
                                />
                                <FieldRow
                                    label="Email"
                                    value={student.personal_email}
                                />
                                <FieldRow
                                    label="Role"
                                    value={toLabelRole(
                                        normalizeRoles(student.roles)[0] ||
                                            "student",
                                    )}
                                />
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Academic
                            </p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <SummaryCard
                                    label="Grade level"
                                    value={student.grade_level || "-"}
                                />
                                <SummaryCard
                                    label="Section"
                                    value={student.section_name || "-"}
                                />
                                <SummaryCard
                                    label="Strand"
                                    value={student.strand || "-"}
                                />
                                <SummaryCard
                                    label="Track"
                                    value={student.track || "-"}
                                />
                            </div>
                        </div>
                    </div>
                ),
                secondaryPanel:
                    classes.length === 0 ? (
                        <EmptyCard message="No archived class records available for this student." />
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <SummaryCard
                                    label="Subjects"
                                    value={classes.length}
                                />
                                <SummaryCard label="Average" value={average} />
                                <SummaryCard
                                    label="Status"
                                    value={`${passedCount}/${classes.length} passed`}
                                    muted
                                />
                            </div>

                            {classes.map((entry) => {
                                const score = asNumber(entry.final_grade, 0);
                                const tone = gradeTone(score);
                                const statusLabel =
                                    entry.remarks || "No Remarks";

                                return (
                                    <div
                                        key={`${entry.id || entry.subject_code || entry.subject_name}`}
                                        className="rounded-lg border border-emerald-200 bg-white p-3"
                                    >
                                        <div className="mb-2 flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                                                        {entry.subject_code ||
                                                            "N/A"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {entry.semester
                                                            ? `Sem ${entry.semester}`
                                                            : "Sem -"}
                                                    </span>
                                                </div>
                                                <p className="truncate text-[13px] font-semibold text-slate-900">
                                                    {entry.subject_name ||
                                                        "Unknown Subject"}
                                                </p>
                                                <p className="text-[11px] text-slate-500">
                                                    {entry.teacher_name ||
                                                        "No teacher assigned"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-semibold leading-none text-emerald-900">
                                                    {score}
                                                </p>
                                                <span
                                                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.pill}`}
                                                >
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="rounded bg-emerald-50 px-2 py-1.5 text-center">
                                                <p className="text-[10px] text-emerald-700">
                                                    Q1
                                                </p>
                                                <p className="text-sm font-semibold text-emerald-900">
                                                    {entry.q1_grade ?? "-"}
                                                </p>
                                            </div>
                                            <div className="rounded bg-emerald-50 px-2 py-1.5 text-center">
                                                <p className="text-[10px] text-emerald-700">
                                                    Q2
                                                </p>
                                                <p className="text-sm font-semibold text-emerald-900">
                                                    {entry.q2_grade ?? "-"}
                                                </p>
                                            </div>
                                            <div className="rounded bg-emerald-50 px-2 py-1.5">
                                                <div className="mb-1 flex items-center justify-between text-[10px] text-emerald-700">
                                                    <span>Final</span>
                                                    <span className="font-semibold text-emerald-900">
                                                        {score}/100
                                                    </span>
                                                </div>
                                                <div className="h-1 w-full overflow-hidden rounded bg-emerald-100">
                                                    <div
                                                        className="h-1 rounded"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                Math.max(
                                                                    0,
                                                                    score,
                                                                ),
                                                            )}%`,
                                                            backgroundColor:
                                                                tone.bar,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ),
            };
        }

        if (activeTab === "teachers") {
            const teacher = payload?.teacher || {
                user_id: row?.teacher_user_id,
                name: row?.teacher_name,
                username: row?.teacher_username,
                department_name: row?.teacher_department_name,
                department_code: row?.teacher_department_code,
                roles: ["teacher"],
            };

            const classes = Array.isArray(payload?.classes)
                ? payload.classes
                : [];
            const studentsTotal =
                classes.length > 0
                    ? classes.reduce(
                          (sum, entry) =>
                              sum + asNumber(entry.students_total, 0),
                          0,
                      )
                    : asNumber(row?.students_total, 0);

            const passedTotal = classes.reduce(
                (sum, entry) => sum + asNumber(entry.passed_count, 0),
                0,
            );
            const failedTotal = classes.reduce(
                (sum, entry) => sum + asNumber(entry.failed_count, 0),
                0,
            );

            return {
                identity: {
                    title: teacher.name || "Archived Teacher",
                    subtitle: teacher.username || "teacher",
                    tags: [
                        teacher.department_code,
                        teacher.department_name,
                    ].filter(Boolean),
                    keyLabel: "Role",
                    keyValue: "Teacher",
                },
                headerTitle: "Teacher information",
                headerSubtitle: "Handled classes and student outcomes",
                infoLabel: "Teacher info",
                secondaryLabel: "Classes",
                secondaryCount: classes.length,
                infoPanel: (
                    <div className="space-y-3">
                        <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Profile
                            </p>
                            <div className="rounded-md bg-emerald-50 px-4">
                                <FieldRow
                                    label="Full name"
                                    value={teacher.name}
                                />
                                <FieldRow
                                    label="User ID"
                                    value={teacher.user_id}
                                    mono
                                />
                                <FieldRow
                                    label="Username"
                                    value={teacher.username}
                                />
                                <FieldRow
                                    label="Email"
                                    value={teacher.personal_email}
                                />
                                <FieldRow
                                    label="Department"
                                    value={
                                        teacher.department_name
                                            ? `${teacher.department_name} (${teacher.department_code || "-"})`
                                            : teacher.department_code || "-"
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <SummaryCard
                                label="Classes"
                                value={
                                    classes.length ||
                                    asNumber(row?.classes_count, 0)
                                }
                            />
                            <SummaryCard
                                label="Students"
                                value={studentsTotal}
                            />
                            <SummaryCard
                                label="Passed"
                                value={passedTotal}
                                muted
                            />
                        </div>
                    </div>
                ),
                secondaryPanel:
                    classes.length === 0 ? (
                        <EmptyCard message="No archived classes found for this teacher in the selected filters." />
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                                <SummaryCard
                                    label="Classes"
                                    value={classes.length}
                                />
                                <SummaryCard
                                    label="Students"
                                    value={studentsTotal}
                                />
                                <SummaryCard
                                    label="Passed"
                                    value={passedTotal}
                                />
                                <SummaryCard
                                    label="Failed"
                                    value={failedTotal}
                                    muted
                                />
                            </div>

                            {classes.map((entry) => {
                                const students = asNumber(
                                    entry.students_total,
                                    0,
                                );
                                const passed = asNumber(entry.passed_count, 0);
                                const passRate =
                                    students > 0
                                        ? Math.round((passed / students) * 100)
                                        : 0;

                                return (
                                    <div
                                        key={`${entry.id || entry.subject_code || entry.subject_name}`}
                                        className="rounded-lg border border-emerald-200 bg-white p-3"
                                    >
                                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                            <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono font-semibold text-emerald-700">
                                                {entry.subject_code || "N/A"}
                                            </span>
                                            <span>
                                                Grade {entry.grade_level || "-"}
                                            </span>
                                            <span>
                                                {entry.section_name || "-"}
                                            </span>
                                            <span>
                                                {entry.semester
                                                    ? `Sem ${entry.semester}`
                                                    : "Sem -"}
                                            </span>
                                        </div>
                                        <p className="text-[13px] font-semibold text-slate-900">
                                            {entry.subject_name ||
                                                "Unknown Subject"}
                                        </p>
                                        <p className="mb-2 text-[11px] text-slate-500">
                                            {entry.strand || "-"} ·{" "}
                                            {entry.track || "-"}
                                        </p>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="rounded bg-emerald-50 px-2 py-1.5 text-center">
                                                <p className="text-[10px] text-emerald-700">
                                                    Students
                                                </p>
                                                <p className="text-sm font-semibold text-emerald-900">
                                                    {students}
                                                </p>
                                            </div>
                                            <div className="rounded bg-emerald-50 px-2 py-1.5 text-center">
                                                <p className="text-[10px] text-emerald-700">
                                                    Passed
                                                </p>
                                                <p className="text-sm font-semibold text-emerald-900">
                                                    {entry.passed_count}
                                                </p>
                                            </div>
                                            <div className="rounded bg-emerald-50 px-2 py-1.5">
                                                <div className="mb-1 flex items-center justify-between text-[10px] text-emerald-700">
                                                    <span>Pass rate</span>
                                                    <span className="font-semibold text-emerald-900">
                                                        {passRate}%
                                                    </span>
                                                </div>
                                                <div className="h-1 w-full overflow-hidden rounded bg-emerald-100">
                                                    <div
                                                        className="h-1 rounded bg-emerald-600"
                                                        style={{
                                                            width: `${passRate}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ),
            };
        }

        if (activeTab === "super-admins") {
            const roles = normalizeRoles(payload?.roles || row?.roles || []);
            const superAdmin = {
                user_id: payload?.user_id || row?.user_id,
                name: payload?.name || row?.name,
                username: payload?.username || row?.username,
                personal_email: payload?.personal_email || row?.personal_email,
                roles,
            };

            return {
                identity: {
                    title: superAdmin.name || "Archived Super Admin",
                    subtitle: superAdmin.username || "super-admin",
                    tags:
                        roles.length > 0
                            ? roles.slice(0, 2).map((role) => toLabelRole(role))
                            : ["Super Admin"],
                    keyLabel: "User ID",
                    keyValue: superAdmin.user_id || "-",
                },
                headerTitle: "Super Admin information",
                headerSubtitle: "Identity and assigned authority",
                infoLabel: "Profile",
                secondaryLabel: "Roles",
                secondaryCount: roles.length,
                infoPanel: (
                    <div className="space-y-3">
                        <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Profile
                            </p>
                            <div className="rounded-md bg-emerald-50 px-4">
                                <FieldRow
                                    label="Full name"
                                    value={superAdmin.name}
                                />
                                <FieldRow
                                    label="User ID"
                                    value={superAdmin.user_id}
                                    mono
                                />
                                <FieldRow
                                    label="Username"
                                    value={superAdmin.username}
                                />
                                <FieldRow
                                    label="Email"
                                    value={superAdmin.personal_email}
                                />
                                <FieldRow
                                    label="Role count"
                                    value={roles.length}
                                />
                            </div>
                        </div>
                    </div>
                ),
                secondaryPanel:
                    roles.length === 0 ? (
                        <EmptyCard message="No role records were attached to this archived user." />
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <SummaryCard
                                    label="Roles"
                                    value={roles.length}
                                />
                                <SummaryCard
                                    label="Primary"
                                    value={toLabelRole(roles[0])}
                                />
                                <SummaryCard
                                    label="Account"
                                    value="Active in archive"
                                    muted
                                />
                            </div>

                            <div className="rounded-lg border border-emerald-200 bg-white p-3">
                                <p className="mb-2 text-xs font-semibold text-emerald-900">
                                    Assigned roles
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {roles.map((role) => (
                                        <span
                                            key={role}
                                            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                        >
                                            {toLabelRole(role)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ),
            };
        }

        if (activeTab === "users") {
            const current = payload?.user || row || {};
            const userRoles = normalizeRoles(
                current.roles_list ||
                    current.roles ||
                    (current.role ? [current.role] : []),
            );
            const userName =
                current.name ||
                [current.first_name, current.middle_name, current.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                "User";
            const departmentName =
                current.department_name || current.department?.department_name;
            const departmentCode =
                current.department_code || current.department?.department_code;

            return {
                identity: {
                    title: userName,
                    subtitle: current.username || current.email || "user",
                    tags: [
                        toLabelRole(userRoles[0] || current.role),
                        current.status || null,
                    ].filter(Boolean),
                    keyLabel: "User ID",
                    keyValue: current.user_id || current.id || "-",
                },
                headerTitle: "User information",
                headerSubtitle: "Profile details and assigned access",
                infoLabel: "Profile",
                secondaryLabel: "Roles",
                secondaryCount: userRoles.length,
                infoPanel: (
                    <div className="space-y-3">
                        <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Account profile
                            </p>
                            <div className="rounded-md bg-emerald-50 px-4">
                                <FieldRow label="Full name" value={userName} />
                                <FieldRow
                                    label="Username"
                                    value={current.username}
                                />
                                <FieldRow
                                    label="Email"
                                    value={
                                        current.email || current.personal_email
                                    }
                                />
                                <FieldRow
                                    label="Primary role"
                                    value={toLabelRole(
                                        userRoles[0] || current.role,
                                    )}
                                />
                                <FieldRow
                                    label="Department"
                                    value={
                                        departmentName
                                            ? `${departmentName} (${departmentCode || "-"})`
                                            : departmentCode || "-"
                                    }
                                />
                                <FieldRow
                                    label="Status"
                                    value={current.status || "-"}
                                />
                            </div>
                        </div>
                    </div>
                ),
                secondaryPanel:
                    userRoles.length === 0 ? (
                        <EmptyCard message="No role assignments were attached to this user." />
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <SummaryCard
                                    label="Role count"
                                    value={userRoles.length}
                                />
                                <SummaryCard
                                    label="Status"
                                    value={current.status || "-"}
                                />
                                <SummaryCard
                                    label="User ID"
                                    value={current.user_id || current.id || "-"}
                                    muted
                                />
                            </div>

                            <div className="rounded-lg border border-emerald-200 bg-white p-3">
                                <p className="mb-2 text-xs font-semibold text-emerald-900">
                                    Assigned roles
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {userRoles.map((role) => (
                                        <span
                                            key={role}
                                            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                        >
                                            {toLabelRole(role)}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-lg border border-emerald-200 bg-white p-3">
                                <p className="text-xs font-semibold text-emerald-900">
                                    Timeline
                                </p>
                                <p className="mt-1 text-[11px] text-slate-700">
                                    Created:{" "}
                                    {formatDateTime(current.created_at)}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-700">
                                    Updated:{" "}
                                    {formatDateTime(current.updated_at)}
                                </p>
                            </div>
                        </div>
                    ),
            };
        }

        if (activeTab === "departments") {
            const dept = payload?.department || {
                id: row?.id,
                name: row?.department_name,
                code: row?.department_code,
                track: row?.track,
                specializations: [],
                admins: [],
                teachers: [],
                classes_count: 0,
                is_active: true,
            };

            const sections = Array.isArray(payload?.sections)
                ? payload.sections
                : [];
            const specializations = (
                Array.isArray(dept.specializations) ? dept.specializations : []
            )
                .map((item) => {
                    if (typeof item === "string") {
                        return item;
                    }

                    if (item && typeof item === "object") {
                        return (
                            item.specialization_name ||
                            item.name ||
                            item.label ||
                            ""
                        );
                    }

                    return "";
                })
                .filter(Boolean);

            const adminCount = Array.isArray(dept.admins)
                ? dept.admins.length
                : asNumber(row?.admins_count, 0);
            const teacherCount = Array.isArray(dept.teachers)
                ? dept.teachers.length
                : asNumber(row?.teachers_count, 0);
            const specializationCount =
                specializations.length ||
                asNumber(row?.specializations_count, 0);

            return {
                identity: {
                    title:
                        dept.name ||
                        (isDepartmentCreateMode
                            ? "New Department"
                            : "Department"),
                    subtitle: dept.code || "department",
                    tags: [
                        dept.track,
                        dept.is_active ? "Active" : "Inactive",
                    ].filter(Boolean),
                    keyLabel: "Code",
                    keyValue: dept.code || "-",
                },
                headerTitle: "Department information",
                headerSubtitle: isDepartmentCreateMode
                    ? "Set up department details and assignments"
                    : "Academic structure, sections, and staffing",
                infoLabel: "Department info",
                secondaryLabel: "Sections",
                secondaryCount: sections.length,
                infoPanel: (
                    <div className="space-y-3">
                        <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Department
                            </p>
                            <div className="rounded-md bg-emerald-50 px-4">
                                <FieldRow
                                    label="Department"
                                    value={dept.name}
                                />
                                <FieldRow label="Code" value={dept.code} mono />
                                <FieldRow label="Track" value={dept.track} />
                                <FieldRow
                                    label="Status"
                                    value={
                                        dept.is_active ? "Active" : "Inactive"
                                    }
                                />
                                <FieldRow
                                    label="Classes"
                                    value={
                                        dept.classes_count ??
                                        asNumber(row?.classes_count, 0)
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <SummaryCard label="Admins" value={adminCount} />
                            <SummaryCard
                                label="Teachers"
                                value={teacherCount}
                            />
                            <SummaryCard
                                label="Specializations"
                                value={specializationCount}
                                muted
                            />
                        </div>

                        {dept.description && (
                            <div className="rounded-md border border-emerald-200 bg-white p-3">
                                <p className="text-xs font-semibold text-emerald-900">
                                    Description
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                                    {dept.description}
                                </p>
                            </div>
                        )}

                        {specializations.length > 0 && (
                            <div className="rounded-md border border-emerald-200 bg-white p-3">
                                <p className="mb-2 text-xs font-semibold text-emerald-900">
                                    Specializations
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {specializations.map((item) => (
                                        <span
                                            key={item}
                                            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ),
                secondaryPanel:
                    sections.length === 0 ? (
                        <EmptyCard message="No archived sections available for this department." />
                    ) : (
                        <div className="space-y-3">
                            {sections.map((section) => (
                                <div
                                    key={`${section.id || section.section_code || section.section_name}`}
                                    className="rounded-lg border border-emerald-200 bg-white p-3"
                                >
                                    <div className="mb-1 flex items-center gap-2">
                                        <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                                            {section.section_code || "N/A"}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            Grade {section.grade_level || "-"}
                                        </span>
                                    </div>
                                    <p className="text-[13px] font-semibold text-slate-900">
                                        {section.section_name ||
                                            "Unnamed Section"}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-600">
                                        {section.strand || "-"} ·{" "}
                                        {section.track || "-"}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Adviser:{" "}
                                        {section.advisor_name || "Unassigned"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ),
            };
        }

        if (activeTab === "subjects") {
            const subject = payload?.subject || row || {};
            const relatedClasses = Array.isArray(payload?.classes)
                ? payload.classes
                : [];
            const classCount =
                relatedClasses.length || asNumber(subject.classes_count, 0);

            return {
                identity: {
                    title: subject.subject_name || subject.name || "Subject",
                    subtitle: subject.subject_code || subject.code || "subject",
                    tags: [
                        subject.subject_type_name ||
                            subject.type_name ||
                            subject.subject_type_key ||
                            null,
                        subject.grade_level || null,
                        subject.semester ? `Sem ${subject.semester}` : null,
                    ].filter(Boolean),
                    keyLabel: "Subject ID",
                    keyValue: subject.id || "-",
                },
                headerTitle: "Subject information",
                headerSubtitle: "Catalog details and class usage",
                infoLabel: "Subject info",
                secondaryLabel: "Classes",
                secondaryCount: classCount,
                infoPanel: (
                    <div className="space-y-3">
                        <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Subject profile
                            </p>
                            <div className="rounded-md bg-emerald-50 px-4">
                                <FieldRow
                                    label="Subject"
                                    value={subject.subject_name || subject.name}
                                />
                                <FieldRow
                                    label="Code"
                                    value={subject.subject_code || subject.code}
                                    mono
                                />
                                <FieldRow
                                    label="Type"
                                    value={
                                        subject.subject_type_name ||
                                        subject.type_name ||
                                        subject.subject_type_key ||
                                        "-"
                                    }
                                />
                                <FieldRow
                                    label="Semester"
                                    value={
                                        subject.semester
                                            ? `Semester ${subject.semester}`
                                            : "-"
                                    }
                                />
                                <FieldRow
                                    label="Grade level"
                                    value={subject.grade_level || "-"}
                                />
                                <FieldRow
                                    label="Total hours"
                                    value={
                                        subject.total_hours
                                            ? `${subject.total_hours}h`
                                            : "-"
                                    }
                                />
                                <FieldRow label="Classes" value={classCount} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <SummaryCard
                                label="Created"
                                value={formatDateTime(subject.created_at)}
                            />
                            <SummaryCard
                                label="Updated"
                                value={formatDateTime(subject.updated_at)}
                                muted
                            />
                        </div>
                    </div>
                ),
                secondaryPanel:
                    relatedClasses.length === 0 ? (
                        <EmptyCard message="No related class records were provided for this subject." />
                    ) : (
                        <div className="space-y-3">
                            {relatedClasses.map((entry) => (
                                <div
                                    key={`${entry.id || entry.class_id || entry.section_name || entry.teacher_name}`}
                                    className="rounded-lg border border-emerald-200 bg-white p-3"
                                >
                                    <p className="text-[13px] font-semibold text-slate-900">
                                        {entry.section_name ||
                                            "Unnamed section"}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-600">
                                        Teacher: {entry.teacher_name || "-"}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {entry.school_year || "-"} · Grade{" "}
                                        {entry.grade_level || "-"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ),
            };
        }

        if (activeTab === "sections") {
            const section = payload?.section || row || {};
            const sectionClasses = Array.isArray(payload?.classes)
                ? payload.classes
                : [];
            const departmentName =
                section.department?.department_name || section.department_name;
            const departmentCode =
                section.department?.department_code || section.department_code;

            return {
                identity: {
                    title:
                        section.section_full_label ||
                        section.section_name ||
                        "Section",
                    subtitle: section.section_code || "section",
                    tags: [
                        section.grade_level || null,
                        section.cohort ? `Cohort ${section.cohort}` : null,
                        section.is_active ? "Active" : "Inactive",
                    ].filter(Boolean),
                    keyLabel: "Section ID",
                    keyValue: section.id || "-",
                },
                headerTitle: "Section information",
                headerSubtitle: "Academic grouping and assigned classes",
                infoLabel: "Section info",
                secondaryLabel: "Classes",
                secondaryCount:
                    sectionClasses.length || asNumber(section.classes_count, 0),
                infoPanel: (
                    <div className="space-y-3">
                        <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Section profile
                            </p>
                            <div className="rounded-md bg-emerald-50 px-4">
                                <FieldRow
                                    label="Section"
                                    value={
                                        section.section_full_label ||
                                        section.section_name
                                    }
                                />
                                <FieldRow
                                    label="Code"
                                    value={section.section_code}
                                    mono
                                />
                                <FieldRow
                                    label="Department"
                                    value={
                                        departmentName
                                            ? `${departmentName} (${departmentCode || "-"})`
                                            : departmentCode || "-"
                                    }
                                />
                                <FieldRow
                                    label="Cohort"
                                    value={section.cohort || "-"}
                                />
                                <FieldRow
                                    label="Grade"
                                    value={section.grade_level || "-"}
                                />
                                <FieldRow
                                    label="Strand / Track"
                                    value={
                                        [section.strand, section.track]
                                            .filter(Boolean)
                                            .join(" · ") || "-"
                                    }
                                />
                                <FieldRow
                                    label="School year"
                                    value={section.school_year || "-"}
                                />
                                <FieldRow
                                    label="Adviser"
                                    value={
                                        section.advisor_teacher_name ||
                                        section.advisor_name ||
                                        "Not assigned"
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <SummaryCard
                                label="Students"
                                value={asNumber(section.students_count, 0)}
                            />
                            <SummaryCard
                                label="Classes"
                                value={
                                    sectionClasses.length ||
                                    asNumber(section.classes_count, 0)
                                }
                            />
                            <SummaryCard
                                label="Status"
                                value={
                                    section.is_active ? "Active" : "Inactive"
                                }
                                muted
                            />
                        </div>
                    </div>
                ),
                secondaryPanel:
                    sectionClasses.length === 0 ? (
                        <EmptyCard message="No class records were provided for this section." />
                    ) : (
                        <div className="space-y-3">
                            {sectionClasses.map((entry) => (
                                <div
                                    key={`${entry.id || entry.class_id || entry.subject_code || entry.subject_name}`}
                                    className="rounded-lg border border-emerald-200 bg-white p-3"
                                >
                                    <div className="mb-1 flex items-center gap-2">
                                        <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                                            {entry.subject_code || "N/A"}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {entry.semester
                                                ? `Sem ${entry.semester}`
                                                : "Sem -"}
                                        </span>
                                    </div>
                                    <p className="text-[13px] font-semibold text-slate-900">
                                        {entry.subject_name ||
                                            "Unknown Subject"}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-600">
                                        Teacher: {entry.teacher_name || "-"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ),
            };
        }

        if (activeTab === "classes") {
            const classInfo = payload?.class || {
                id: row?.id,
                subject_name: row?.subject_name,
                subject_code: row?.subject_code,
                teacher_name: row?.teacher_name,
                teacher_department_name:
                    row?.teacher_department_name ||
                    row?.department?.department_name,
                teacher_department_code:
                    row?.teacher_department_code ||
                    row?.department?.department_code,
                grade_level: row?.grade_level,
                section_name: row?.section_name,
                strand: row?.strand,
                track: row?.track,
                semester: row?.semester,
                school_year: row?.school_year,
                color: row?.color,
                students_total: row?.students_total ?? row?.students_count,
            };

            const students = Array.isArray(payload?.students)
                ? payload.students
                : [];
            const passed = students.filter((entry) => {
                if (typeof entry?.passed === "boolean") {
                    return entry.passed;
                }

                const remarks = String(entry?.remarks || "").toLowerCase();
                return remarks === "passed";
            }).length;

            return {
                identity: {
                    title: classInfo.subject_name || "Archived Class",
                    subtitle: classInfo.subject_code || "class",
                    tags: [
                        classInfo.semester ? `Sem ${classInfo.semester}` : null,
                        classInfo.grade_level
                            ? `Grade ${classInfo.grade_level}`
                            : null,
                    ].filter(Boolean),
                    keyLabel: "Teacher",
                    keyValue: classInfo.teacher_name || "-",
                },
                headerTitle: "Class information",
                headerSubtitle: "Subject setup and enrolled students",
                infoLabel: "Class info",
                secondaryLabel: "Students",
                secondaryCount:
                    students.length || asNumber(classInfo.students_total, 0),
                infoPanel: (
                    <div className="space-y-3">
                        <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Class profile
                            </p>
                            <div className="rounded-md bg-emerald-50 px-4">
                                <FieldRow
                                    label="Subject"
                                    value={classInfo.subject_name}
                                />
                                <FieldRow
                                    label="Subject code"
                                    value={classInfo.subject_code}
                                    mono
                                />
                                <FieldRow
                                    label="Teacher"
                                    value={classInfo.teacher_name}
                                />
                                <FieldRow
                                    label="Department"
                                    value={
                                        classInfo.teacher_department_name
                                            ? `${classInfo.teacher_department_name} (${classInfo.teacher_department_code || "-"})`
                                            : classInfo.teacher_department_code ||
                                              "-"
                                    }
                                />
                                <FieldRow
                                    label="Grade / Section"
                                    value={`Grade ${classInfo.grade_level || "-"} - ${classInfo.section_name || "-"}`}
                                />
                                <FieldRow
                                    label="Track"
                                    value={classInfo.track || "-"}
                                />
                                <FieldRow
                                    label="Semester"
                                    value={
                                        classInfo.semester
                                            ? `Semester ${classInfo.semester}`
                                            : "-"
                                    }
                                />
                                <FieldRow
                                    label="School year"
                                    value={classInfo.school_year || "-"}
                                />
                                <FieldRow
                                    label="Color tag"
                                    value={classInfo.color || "-"}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <SummaryCard
                                label="Students"
                                value={
                                    students.length ||
                                    asNumber(classInfo.students_total, 0)
                                }
                            />
                            <SummaryCard label="Passed" value={passed} />
                            <SummaryCard
                                label="Failed"
                                value={Math.max(
                                    0,
                                    (students.length ||
                                        asNumber(classInfo.students_total, 0)) -
                                        passed,
                                )}
                                muted
                            />
                        </div>
                    </div>
                ),
                secondaryPanel:
                    students.length === 0 ? (
                        <EmptyCard message="No archived enrollment records found for this class." />
                    ) : (
                        <div className="space-y-3">
                            {students.map((entry) => {
                                const score = asNumber(entry.final_grade, 0);
                                const tone = gradeTone(score);
                                const status = entry.remarks || "No Remarks";

                                return (
                                    <div
                                        key={`${entry.enrollment_id || entry.student_user_id || entry.student_name}`}
                                        className="rounded-lg border border-emerald-200 bg-white p-3"
                                    >
                                        <div className="mb-2 flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[13px] font-semibold text-slate-900">
                                                    {entry.student_name ||
                                                        "Unknown Student"}
                                                </p>
                                                <p className="text-[11px] text-slate-500">
                                                    {entry.student_username ||
                                                        "-"}
                                                </p>
                                                <p className="font-mono text-[10px] text-slate-500">
                                                    {entry.student_lrn || "-"}
                                                </p>
                                            </div>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.pill}`}
                                            >
                                                {status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="rounded bg-emerald-50 px-2 py-1.5 text-center">
                                                <p className="text-[10px] text-emerald-700">
                                                    Q1
                                                </p>
                                                <p className="text-sm font-semibold text-emerald-900">
                                                    {entry.q1_grade ?? "-"}
                                                </p>
                                            </div>
                                            <div className="rounded bg-emerald-50 px-2 py-1.5 text-center">
                                                <p className="text-[10px] text-emerald-700">
                                                    Q2
                                                </p>
                                                <p className="text-sm font-semibold text-emerald-900">
                                                    {entry.q2_grade ?? "-"}
                                                </p>
                                            </div>
                                            <div className="rounded bg-emerald-50 px-2 py-1.5 text-center">
                                                <p className="text-[10px] text-emerald-700">
                                                    Final
                                                </p>
                                                <p className="text-sm font-semibold text-emerald-900">
                                                    {score}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ),
            };
        }

        const log = payload || row || {};

        return {
            identity: {
                title: log.task || "Activity Log",
                subtitle: log.user_name || log.user?.name || "system",
                tags: [
                    log.module || null,
                    log.is_success ? "Success" : "Failed",
                ].filter(Boolean),
                keyLabel: "Logged At",
                keyValue: formatDateTime(log.logged_at),
            },
            headerTitle: "Activity log details",
            headerSubtitle: "Action context and request metadata",
            infoLabel: "Activity",
            secondaryLabel: "Technical",
            secondaryCount: undefined,
            infoPanel: (
                <div className="space-y-3">
                    <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            Activity
                        </p>
                        <div className="rounded-md bg-emerald-50 px-4">
                            <FieldRow label="Task" value={log.task || "-"} />
                            <FieldRow
                                label="Date and time"
                                value={formatDateTime(log.logged_at)}
                            />
                            <FieldRow
                                label="User"
                                value={
                                    log.user_name || log.user?.name || "Unknown"
                                }
                            />
                            <FieldRow
                                label="Role"
                                value={toLabelRole(log.user_role)}
                            />
                            <FieldRow
                                label="Semester"
                                value={
                                    log.semester
                                        ? `Semester ${log.semester}`
                                        : "All"
                                }
                            />
                            <FieldRow
                                label="Outcome"
                                value={log.is_success ? "Success" : "Failed"}
                            />
                        </div>
                    </div>
                </div>
            ),
            secondaryPanel: (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <SummaryCard label="Method" value={log.method || "-"} />
                        <SummaryCard
                            label="Status"
                            value={log.status_code || "-"}
                        />
                        <SummaryCard
                            label="Action"
                            value={log.action || "-"}
                            muted
                        />
                    </div>

                    <div className="rounded-lg border border-emerald-200 bg-white p-3">
                        <p className="text-xs font-semibold text-emerald-900">
                            Path
                        </p>
                        <p className="mt-1 break-all font-mono text-[11px] text-slate-700">
                            {log.path || "-"}
                        </p>
                        <p className="mt-1 break-all font-mono text-[11px] text-slate-500">
                            Route: {log.route_name || "-"}
                        </p>
                    </div>

                    <div className="rounded-lg border border-emerald-200 bg-white p-3">
                        <p className="text-xs font-semibold text-emerald-900">
                            Source
                        </p>
                        <p className="mt-1 text-[11px] text-slate-700">
                            Module: {log.module || "-"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-700">
                            User: {log.user_name || log.user?.name || "Unknown"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-700">
                            IP: {log.ip_address || "-"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-700">
                            Target: {log.target_type || "-"}
                            {log.target_id ? ` #${log.target_id}` : ""}
                        </p>
                    </div>

                    <div className="rounded-lg border border-emerald-200 bg-white p-3">
                        <p className="mb-2 text-xs font-semibold text-emerald-900">
                            Query Parameters
                        </p>
                        <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-all rounded bg-emerald-50 p-2 text-[11px] text-slate-700">
                            {formatJson(log.query_params)}
                        </pre>
                    </div>

                    <div className="rounded-lg border border-emerald-200 bg-white p-3">
                        <p className="mb-2 text-xs font-semibold text-emerald-900">
                            Request Payload
                        </p>
                        <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-all rounded bg-emerald-50 p-2 text-[11px] text-slate-700">
                            {formatJson(log.request_payload)}
                        </pre>
                    </div>

                    <div className="rounded-lg border border-emerald-200 bg-white p-3">
                        <p className="mb-2 text-xs font-semibold text-emerald-900">
                            Metadata
                        </p>
                        <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-all rounded bg-emerald-50 p-2 text-[11px] text-slate-700">
                            {formatJson(log.metadata)}
                        </pre>
                    </div>
                </div>
            ),
        };
    }, [activeTab, payload, row, isDepartmentCreateMode]);

    const departmentSpecializationErrors = Object.entries(departmentErrors)
        .filter(
            ([key]) =>
                key === "specialization_names" ||
                key.startsWith("specialization_names."),
        )
        .flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
        .filter(Boolean);

    const departmentKnownPeople = useMemo(() => {
        const peopleMap = new Map();

        const register = (person) => {
            if (!person?.id) {
                return;
            }

            peopleMap.set(String(person.id), person);
        };

        deptTeachers.forEach(register);
        sourceDepartment?.teachers?.forEach(register);
        sourceDepartment?.admins?.forEach(register);

        return Array.from(peopleMap.values());
    }, [deptTeachers, sourceDepartment]);

    const departmentSelectedTeachers = useMemo(
        () =>
            (Array.isArray(deptData.teacher_ids)
                ? deptData.teacher_ids
                : []
            ).map((teacherId) => {
                const found = departmentKnownPeople.find(
                    (person) => String(person.id) === String(teacherId),
                );

                return (
                    found || {
                        id: teacherId,
                        first_name: "Unknown",
                        last_name: "User",
                        personal_email: "",
                    }
                );
            }),
        [deptData.teacher_ids, departmentKnownPeople],
    );

    const departmentSelectedAdmin = useMemo(() => {
        if (!deptData.admin_id) {
            return null;
        }

        return (
            departmentSelectedTeachers.find(
                (teacher) => String(teacher.id) === String(deptData.admin_id),
            ) ||
            departmentKnownPeople.find(
                (person) => String(person.id) === String(deptData.admin_id),
            ) ||
            null
        );
    }, [deptData.admin_id, departmentSelectedTeachers, departmentKnownPeople]);

    const sourceAdminIdSet = new Set(
        (sourceDepartment?.admins || []).map((admin) => String(admin.id)),
    );

    const departmentMembersAdmins = deptEditMode
        ? departmentSelectedAdmin
            ? [departmentSelectedAdmin]
            : []
        : sourceDepartment?.admins || [];

    const departmentMembersTeachers = deptEditMode
        ? departmentSelectedTeachers.filter(
              (teacher) => String(teacher.id) !== String(deptData.admin_id),
          )
        : (sourceDepartment?.teachers || []).filter(
              (teacher) => !sourceAdminIdSet.has(String(teacher.id)),
          );

    const departmentFilteredTeachers = useMemo(
        () =>
            deptTeachers.filter((teacher) => {
                const fullText =
                    `${teacher.first_name ?? ""} ${teacher.middle_name ?? ""} ${teacher.last_name ?? ""} ${teacher.email ?? teacher.personal_email ?? ""}`.toLowerCase();

                return fullText.includes(deptTeacherSearch.toLowerCase());
            }),
        [deptTeachers, deptTeacherSearch],
    );

    const addDepartmentSpecialization = () => {
        const value = deptSpecializationInput.trim();

        if (!value) {
            return;
        }

        const exists = (deptData.specialization_names || []).some(
            (item) => String(item).toLowerCase() === value.toLowerCase(),
        );

        if (exists) {
            setDeptSpecializationInput("");
            return;
        }

        setDeptData("specialization_names", [
            ...(deptData.specialization_names || []),
            value,
        ]);
        setDeptSpecializationInput("");
    };

    const removeDepartmentSpecialization = (value) => {
        setDeptData(
            "specialization_names",
            (deptData.specialization_names || []).filter(
                (item) => item !== value,
            ),
        );
    };

    const toggleDepartmentTeacher = (teacherId) => {
        const teacherKey = String(teacherId);
        const nextTeacherIds = (deptData.teacher_ids || []).some(
            (id) => String(id) === teacherKey,
        )
            ? (deptData.teacher_ids || []).filter(
                  (id) => String(id) !== teacherKey,
              )
            : [...(deptData.teacher_ids || []), teacherId];

        setDeptData("teacher_ids", nextTeacherIds);

        const adminStillSelected = nextTeacherIds.some(
            (id) => String(id) === String(deptData.admin_id),
        );

        if (!adminStillSelected) {
            setDeptData("admin_id", "");
        }
    };

    const exitDepartmentEditMode = () => {
        if (!sourceDepartment) {
            setDeptEditMode(false);
            return;
        }

        hydrateDepartmentForm(sourceDepartment);
        clearDepartmentErrors();
        setDeptEditMode(false);
        setPanel("info");
    };

    const handleDepartmentSave = () => {
        const isCreate = isDepartmentCreateMode || !sourceDepartment?.id;
        const endpoint = isCreate
            ? route("superadmin.departments.store")
            : route("superadmin.departments.update", sourceDepartment.id);

        const submit = isCreate ? postDepartment : putDepartment;

        submit(endpoint, {
            preserveScroll: true,
            onSuccess: () => {
                setDeptEditMode(false);
                onDepartmentSaved?.();
                onClose?.();
            },
        });
    };

    const renderDepartmentPanel = () => {
        if (!sourceDepartment) {
            return (
                <EmptyCard message="Department details are unavailable for this record." />
            );
        }

        if (panel === "members") {
            return (
                <div className="space-y-3">
                    {departmentMembersAdmins.length === 0 &&
                    departmentMembersTeachers.length === 0 ? (
                        <EmptyCard message="No teacher or admin is assigned to this department." />
                    ) : (
                        <>
                            <div className="rounded-md border border-violet-200 bg-violet-50 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-xs font-semibold text-violet-700">
                                        Admins
                                    </p>
                                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                        {departmentMembersAdmins.length}
                                    </span>
                                </div>

                                {departmentMembersAdmins.length === 0 ? (
                                    <p className="text-xs text-violet-600">
                                        No admin assigned.
                                    </p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {departmentMembersAdmins.map(
                                            (admin) => (
                                                <div
                                                    key={`dept-admin-${admin.id}`}
                                                    className="flex items-center gap-3 rounded-md border border-violet-200 bg-white px-3 py-2"
                                                >
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-700">
                                                        {personInitials(admin)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-semibold text-slate-800">
                                                            {personName(admin)}
                                                        </p>
                                                        <p className="truncate text-[11px] text-slate-500">
                                                            {personEmail(admin)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-md border border-emerald-200 bg-white p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-xs font-semibold text-emerald-700">
                                        Teachers
                                    </p>
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                        {departmentMembersTeachers.length}
                                    </span>
                                </div>

                                {departmentMembersTeachers.length === 0 ? (
                                    <p className="text-xs text-emerald-600">
                                        No teacher assigned.
                                    </p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {departmentMembersTeachers.map(
                                            (teacher) => (
                                                <div
                                                    key={`dept-teacher-${teacher.id}`}
                                                    className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2"
                                                >
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-700">
                                                        {personInitials(
                                                            teacher,
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-semibold text-slate-800">
                                                            {personName(
                                                                teacher,
                                                            )}
                                                        </p>
                                                        <p className="truncate text-[11px] text-slate-500">
                                                            {personEmail(
                                                                teacher,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            );
        }

        if (panel === "assign") {
            return (
                <div className="space-y-3">
                    {!deptEditMode && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            Click the floating edit button to modify teacher and
                            admin assignments.
                        </div>
                    )}

                    <div className="relative">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={deptTeacherSearch}
                            onChange={(event) =>
                                setDeptTeacherSearch(event.target.value)
                            }
                            placeholder="Search teachers..."
                            className="w-full rounded-md border border-emerald-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                        />
                    </div>

                    {deptTeachersLoading ? (
                        <div className="rounded-md border border-emerald-200 bg-white px-3 py-4 text-xs text-emerald-700">
                            Loading teachers...
                        </div>
                    ) : departmentFilteredTeachers.length === 0 ? (
                        <EmptyCard message="No available teachers found." />
                    ) : (
                        <div className="max-h-56 space-y-1.5 overflow-y-auto">
                            {departmentFilteredTeachers.map((teacher) => {
                                const teacherKey = String(teacher.id);
                                const checked = (
                                    deptData.teacher_ids || []
                                ).some((id) => String(id) === teacherKey);
                                const isAdmin =
                                    String(deptData.admin_id) === teacherKey;

                                return (
                                    <label
                                        key={`assign-teacher-${teacher.id}`}
                                        className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                                            checked
                                                ? "border-emerald-300 bg-emerald-50"
                                                : "border-emerald-200 bg-white"
                                        } ${deptEditMode ? "cursor-pointer" : "opacity-80"}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                                toggleDepartmentTeacher(
                                                    teacher.id,
                                                )
                                            }
                                            disabled={!deptEditMode}
                                            className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-700">
                                            {personInitials(teacher)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-slate-800">
                                                {personName(teacher)}
                                            </p>
                                            <p className="truncate text-[11px] text-slate-500">
                                                {personEmail(teacher)}
                                            </p>
                                        </div>
                                        {isAdmin && (
                                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                                Admin
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    {departmentSelectedTeachers.length > 0 && (
                        <div className="rounded-md border border-violet-200 bg-violet-50 p-3">
                            <p className="mb-2 text-xs font-semibold text-violet-700">
                                Department Admin
                            </p>
                            <select
                                value={deptData.admin_id}
                                onChange={(event) =>
                                    setDeptData("admin_id", event.target.value)
                                }
                                disabled={!deptEditMode}
                                className="w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-xs focus:border-violet-500 focus:ring-violet-500 disabled:opacity-60"
                            >
                                <option value="">- No admin -</option>
                                {departmentSelectedTeachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {personName(teacher)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-3">
                <div className="rounded-md bg-emerald-50 p-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                Department Name
                            </p>
                            {deptEditMode ? (
                                <input
                                    type="text"
                                    value={deptData.department_name}
                                    onChange={(event) =>
                                        setDeptData(
                                            "department_name",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                />
                            ) : (
                                <p className="text-sm font-semibold text-slate-900">
                                    {sourceDepartment.name || "-"}
                                </p>
                            )}
                            {departmentErrors.department_name && (
                                <p className="mt-1 text-[11px] text-rose-600">
                                    {departmentErrors.department_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                Department Code
                            </p>
                            {deptEditMode ? (
                                <input
                                    type="text"
                                    value={deptData.department_code}
                                    onChange={(event) =>
                                        setDeptData(
                                            "department_code",
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                />
                            ) : (
                                <p className="font-mono text-sm font-semibold text-slate-900">
                                    {sourceDepartment.code || "-"}
                                </p>
                            )}
                            {departmentErrors.department_code && (
                                <p className="mt-1 text-[11px] text-rose-600">
                                    {departmentErrors.department_code}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                Track
                            </p>
                            {deptEditMode ? (
                                <select
                                    value={deptData.track}
                                    onChange={(event) =>
                                        setDeptData("track", event.target.value)
                                    }
                                    className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    {TRACK_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm font-semibold text-slate-900">
                                    {sourceDepartment.track || "-"}
                                </p>
                            )}
                            {departmentErrors.track && (
                                <p className="mt-1 text-[11px] text-rose-600">
                                    {departmentErrors.track}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                Status
                            </p>
                            {deptEditMode ? (
                                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={deptData.is_active}
                                        onChange={(event) =>
                                            setDeptData(
                                                "is_active",
                                                event.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    Active Department
                                </label>
                            ) : (
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                        sourceDepartment.is_active
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-slate-100 text-slate-600"
                                    }`}
                                >
                                    <CheckCircle size={11} />
                                    {sourceDepartment.is_active
                                        ? "Active"
                                        : "Inactive"}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-3">
                        <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                            Description
                        </p>
                        {deptEditMode ? (
                            <textarea
                                value={deptData.description}
                                onChange={(event) =>
                                    setDeptData(
                                        "description",
                                        event.target.value,
                                    )
                                }
                                rows={3}
                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        ) : (
                            <p className="text-xs text-slate-700">
                                {sourceDepartment.description ||
                                    "No description"}
                            </p>
                        )}
                    </div>

                    <div className="mt-3">
                        <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                            Specializations
                        </p>

                        {deptEditMode && (
                            <div className="mb-2 flex gap-2">
                                <input
                                    type="text"
                                    value={deptSpecializationInput}
                                    onChange={(event) =>
                                        setDeptSpecializationInput(
                                            event.target.value,
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            addDepartmentSpecialization();
                                        }
                                    }}
                                    placeholder="Add specialization"
                                    className="flex-1 rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                />
                                <button
                                    type="button"
                                    onClick={addDepartmentSpecialization}
                                    className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700"
                                >
                                    Add
                                </button>
                            </div>
                        )}

                        {(deptData.specialization_names || []).length === 0 ? (
                            <p className="text-xs text-slate-500">
                                No specializations assigned.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {(deptData.specialization_names || []).map(
                                    (item) => (
                                        <span
                                            key={item}
                                            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                                        >
                                            {item}
                                            {deptEditMode && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeDepartmentSpecialization(
                                                            item,
                                                        )
                                                    }
                                                    className="text-emerald-700"
                                                >
                                                    <X size={11} />
                                                </button>
                                            )}
                                        </span>
                                    ),
                                )}
                            </div>
                        )}

                        {departmentSpecializationErrors.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                                {departmentSpecializationErrors.map(
                                    (message, index) => (
                                        <p
                                            key={`${message}-${index}`}
                                            className="text-[11px] text-rose-600"
                                        >
                                            {message}
                                        </p>
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <SummaryCard
                        label="Admins"
                        value={departmentMembersAdmins.length}
                    />
                    <SummaryCard
                        label="Teachers"
                        value={departmentMembersTeachers.length}
                    />
                    <SummaryCard
                        label="Students"
                        value={sourceDepartment.students_count}
                        muted
                    />
                </div>
            </div>
        );
    };

    const secondaryIcon =
        activeTab === "students" ||
        activeTab === "teachers" ||
        activeTab === "sections"
            ? BookOpen
            : activeTab === "super-admins" || activeTab === "users"
              ? Shield
              : activeTab === "departments"
                ? Building2
                : activeTab === "classes" || activeTab === "subjects"
                  ? Users
                  : ClipboardList;

    const primaryIcon =
        activeTab === "departments"
            ? Building2
            : activeTab === "classes" || activeTab === "sections"
              ? Layers
              : activeTab === "subjects"
                ? BookOpen
                : activeTab === "audit-logs"
                  ? ClipboardList
                  : User;

    return (
        <Modal show={show} onClose={onClose} maxWidth="3xl">
            <div className="h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)] min-h-0 overflow-hidden">
                <div className="flex h-full min-h-0 flex-col md:flex-row">
                    <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-emerald-200 md:h-full md:w-[220px] md:border-b-0 md:border-r">
                        <div className="bg-emerald-600 px-4 py-4">
                            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-200 text-sm font-semibold text-emerald-900">
                                {initials(data.identity.title)}
                            </div>
                            <p className="text-sm font-semibold text-emerald-50">
                                {data.identity.title}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-emerald-300">
                                {data.identity.subtitle}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {data.identity.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-semibold text-emerald-200"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-3">
                            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                Menu
                            </p>
                            {isDepartmentTab ? (
                                <div className="space-y-1">
                                    <SidebarButton
                                        active={panel === "info"}
                                        onClick={() => setPanel("info")}
                                        icon={Building2}
                                        label="Department Information"
                                    />
                                    <SidebarButton
                                        active={panel === "members"}
                                        onClick={() => setPanel("members")}
                                        icon={Users}
                                        label="Teachers & Admin"
                                        count={
                                            departmentMembersAdmins.length +
                                            departmentMembersTeachers.length
                                        }
                                    />
                                    <SidebarButton
                                        active={panel === "assign"}
                                        onClick={() => setPanel("assign")}
                                        icon={UserPlus}
                                        label="Assign Teachers & Admin"
                                        count={
                                            (deptData.teacher_ids || []).length
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <SidebarButton
                                        active={panel === "info"}
                                        onClick={() => setPanel("info")}
                                        icon={primaryIcon}
                                        label={data.infoLabel}
                                    />
                                    <SidebarButton
                                        active={panel === "secondary"}
                                        onClick={() => setPanel("secondary")}
                                        icon={secondaryIcon}
                                        label={data.secondaryLabel}
                                        count={data.secondaryCount}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-emerald-200 px-3 py-3">
                            <div className="rounded-md bg-emerald-50 px-3 py-2.5">
                                <p className="text-[10px] text-emerald-700">
                                    {data.identity.keyLabel}
                                </p>
                                <p className="mt-0.5 truncate font-mono text-xs font-semibold text-emerald-900">
                                    {data.identity.keyValue}
                                </p>
                            </div>
                        </div>
                    </aside>

                    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
                        <div className="flex items-start justify-between gap-3 border-b border-emerald-200 px-5 py-4">
                            <div>
                                <p className="text-[15px] font-semibold text-slate-900">
                                    {data.headerTitle}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {data.headerSubtitle}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto bg-emerald-50 p-4 pb-8">
                            {loading && (
                                <div className="rounded-lg border border-emerald-200 bg-white px-4 py-6 text-sm text-emerald-700">
                                    Loading details...
                                </div>
                            )}

                            {!loading && error && (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {error}
                                </div>
                            )}

                            {!loading && !error && (
                                <>
                                    {isDepartmentTab
                                        ? renderDepartmentPanel()
                                        : panel === "info"
                                          ? data.infoPanel
                                          : data.secondaryPanel}
                                </>
                            )}
                        </div>

                        {isDepartmentTab && !loading && !error && (
                            <div className="pointer-events-none absolute right-5 bottom-5 z-20 flex items-center gap-2">
                                {!deptEditMode ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDeptEditMode(true);
                                            setPanel("info");
                                        }}
                                        className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
                                        title="Edit department"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={exitDepartmentEditMode}
                                            disabled={departmentSaving}
                                            className="pointer-events-auto rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDepartmentSave}
                                            disabled={departmentSaving}
                                            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            <Save size={13} />
                                            {departmentSaving
                                                ? "Saving..."
                                                : "Save Changes"}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </Modal>
    );
}

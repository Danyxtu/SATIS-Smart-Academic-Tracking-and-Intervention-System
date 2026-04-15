import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Building2,
    ClipboardList,
    Layers,
    Shield,
    User,
    Users,
    X,
} from "lucide-react";
import Modal from "@/Components/Modal";

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

export default function ArchiveDetailModal({
    show,
    onClose,
    activeTab,
    payload,
    loading,
    error,
    row,
}) {
    const [panel, setPanel] = useState("info");

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
                    title: dept.name || "Archived Department",
                    subtitle: dept.code || "department",
                    tags: [
                        dept.track,
                        dept.is_active ? "Active" : "Inactive",
                    ].filter(Boolean),
                    keyLabel: "Code",
                    keyValue: dept.code || "-",
                },
                headerTitle: "Department information",
                headerSubtitle: "Academic structure, sections, and staffing",
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

        if (activeTab === "classes") {
            const classInfo = payload?.class || {
                id: row?.id,
                subject_name: row?.subject_name,
                subject_code: row?.subject_code,
                teacher_name: row?.teacher_name,
                grade_level: row?.grade_level,
                section_name: row?.section_name,
                strand: row?.strand,
                track: row?.track,
                semester: row?.semester,
                students_total: row?.students_total,
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
                title: log.task || "Audit Log",
                subtitle: log.user_name || log.user?.name || "system",
                tags: [
                    log.module || null,
                    log.is_success ? "Success" : "Failed",
                ].filter(Boolean),
                keyLabel: "Logged At",
                keyValue: formatDateTime(log.logged_at),
            },
            headerTitle: "Audit log details",
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
    }, [activeTab, payload, row]);

    const secondaryIcon =
        activeTab === "students" || activeTab === "teachers"
            ? BookOpen
            : activeTab === "super-admins"
              ? Shield
              : activeTab === "departments"
                ? Building2
                : activeTab === "classes"
                  ? Users
                  : ClipboardList;

    const primaryIcon =
        activeTab === "departments"
            ? Building2
            : activeTab === "classes"
              ? Layers
              : activeTab === "audit-logs"
                ? ClipboardList
                : User;

    return (
        <Modal show={show} onClose={onClose} maxWidth="3xl" closeable={false}>
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

                    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
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

                        <div className="min-h-0 flex-1 overflow-y-auto bg-emerald-50 p-4">
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
                                    {panel === "info"
                                        ? data.infoPanel
                                        : data.secondaryPanel}
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </Modal>
    );
}

import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    Archive,
    ArrowLeft,
    Calendar,
    Users,
    GraduationCap,
    BookOpen,
    TrendingUp,
    TrendingDown,
    Building2,
    Sparkles,
    AlertTriangle,
    CheckCircle,
    CircleDashed,
    ChevronDown,
    ChevronRight,
    X,
} from "lucide-react";

const INTERVENTION_LABELS = {
    automated_nudge: "Tier 1: Reminder Nudge",
    task_list: "Tier 2: Goal Checklist",
    extension_grant: "Tier 2: Deadline Extension",
    parent_contact: "Tier 2: Parent Contact",
    academic_agreement: "Tier 3: Academic Agreement",
    one_on_one_meeting: "Tier 3: One-on-One Meeting",
};

export default function Show({
    schoolYear,
    isCurrent,
    stats = {},
    departments = [],
    teachers = [],
}) {
    const safeStats = {
        students: Number(stats.students ?? 0),
        teachers: Number(stats.teachers ?? 0),
        total_classes: Number(stats.total_classes ?? 0),
        sem1_classes: Number(stats.sem1_classes ?? 0),
        sem2_classes: Number(stats.sem2_classes ?? 0),
        passed: Number(stats.passed ?? 0),
        failed: Number(stats.failed ?? 0),
        total_graded: Number(stats.total_graded ?? 0),
        interventions:
            stats.interventions && typeof stats.interventions === "object"
                ? stats.interventions
                : {},
    };

    const teacherDirectory = Array.isArray(teachers) ? teachers : [];
    const departmentDirectory = Array.isArray(departments) ? departments : [];
    const [activeCardKey, setActiveCardKey] = useState(null);
    const [expandedClassId, setExpandedClassId] = useState(null);

    const adminTeacherIds = useMemo(() => {
        const ids = new Set();

        departmentDirectory.forEach((department) => {
            (department.admins ?? []).forEach((admin) => {
                if (admin?.id) {
                    ids.add(Number(admin.id));
                }
            });
        });

        return ids;
    }, [departmentDirectory]);

    const teacherOverview = useMemo(
        () =>
            teacherDirectory
                .map((teacher) => {
                    const roles = ["Teacher"];

                    if (adminTeacherIds.has(Number(teacher.id))) {
                        roles.push("Admin");
                    }

                    return {
                        ...teacher,
                        roles,
                    };
                })
                .sort((a, b) =>
                    String(a?.name ?? "").localeCompare(String(b?.name ?? "")),
                ),
        [teacherDirectory, adminTeacherIds],
    );

    const classOverview = useMemo(() => {
        const classes = [];

        teacherOverview.forEach((teacher) => {
            (teacher.classes ?? []).forEach((classItem) => {
                classes.push({
                    ...classItem,
                    teacher: {
                        id: teacher.id,
                        name: teacher.name,
                        email: teacher.email,
                        department: teacher.department,
                        roles: teacher.roles,
                    },
                });
            });
        });

        return classes.sort((a, b) => {
            const left = `${a?.subject?.name ?? ""}|${a?.grade_level ?? ""}|${a?.section ?? ""}`;
            const right = `${b?.subject?.name ?? ""}|${b?.grade_level ?? ""}|${b?.section ?? ""}`;

            return left.localeCompare(right);
        });
    }, [teacherOverview]);

    const studentOverview = useMemo(() => {
        const byStudentId = new Map();

        classOverview.forEach((classItem) => {
            const classLabel = `${classItem?.subject?.name ?? "Unnamed Subject"} (${classItem?.grade_level ?? "No grade"} - ${classItem?.section ?? "No section"})`;

            (classItem.students ?? []).forEach((student) => {
                const studentId = Number(student?.id);

                if (!studentId) {
                    return;
                }

                if (!byStudentId.has(studentId)) {
                    byStudentId.set(studentId, {
                        ...student,
                        enrolled_classes_count: 0,
                        enrolled_classes: [],
                    });
                }

                const entry = byStudentId.get(studentId);
                entry.enrolled_classes_count += 1;
                entry.enrolled_classes.push(classLabel);
            });
        });

        return Array.from(byStudentId.values()).sort((a, b) =>
            String(a?.name ?? "").localeCompare(String(b?.name ?? "")),
        );
    }, [classOverview]);

    const closeCardModal = () => {
        setActiveCardKey(null);
        setExpandedClassId(null);
    };

    const passRateValue =
        safeStats.total_graded > 0
            ? (safeStats.passed / safeStats.total_graded) * 100
            : 0;
    const failRateValue =
        safeStats.total_graded > 0
            ? (safeStats.failed / safeStats.total_graded) * 100
            : 0;
    const passRate =
        safeStats.total_graded > 0 ? passRateValue.toFixed(1) : null;
    const sem1Share =
        safeStats.total_classes > 0
            ? (
                  (safeStats.sem1_classes / safeStats.total_classes) *
                  100
              ).toFixed(1)
            : "0.0";
    const sem2Share =
        safeStats.total_classes > 0
            ? (
                  (safeStats.sem2_classes / safeStats.total_classes) *
                  100
              ).toFixed(1)
            : "0.0";

    const statCards = [
        {
            key: "students",
            label: "Students",
            value: safeStats.students,
            icon: GraduationCap,
            color: "from-amber-500 to-orange-500",
            shadow: "shadow-amber-500/20",
            note: "Enrolled in this school year",
        },
        {
            key: "teachers",
            label: "Teachers",
            value: safeStats.teachers,
            icon: Users,
            color: "from-violet-500 to-purple-600",
            shadow: "shadow-violet-500/20",
            note: "Handled at least one class",
        },
        {
            key: "classes",
            label: "Total Classes",
            value: safeStats.total_classes,
            icon: BookOpen,
            color: "from-blue-500 to-indigo-600",
            shadow: "shadow-blue-500/20",
            note: "Semester 1 and 2 combined",
        },
    ];

    const totalInterventions = Object.values(safeStats.interventions).reduce(
        (a, b) => Number(a) + Number(b),
        0,
    );

    const interventionEntries = Object.entries(safeStats.interventions)
        .map(([type, count]) => [type, Number(count)])
        .sort((a, b) => b[1] - a[1]);

    const topInterventionCount = interventionEntries[0]?.[1] ?? 0;

    return (
        <>
            <Head title={`Archive - ${schoolYear}`} />

            <div className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-7 shadow-xl">
                    <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute -bottom-12 left-1/4 h-36 w-36 rounded-full bg-blue-500/15 blur-2xl" />
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                                <Archive className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <div className="mb-0.5 flex items-center gap-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-white">
                                        {schoolYear}
                                    </h1>
                                    {isCurrent && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-500/30">
                                            <Sparkles size={10} />
                                            Current
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-400">
                                    Academic year overview
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
                                <CircleDashed
                                    size={14}
                                    className="text-slate-300"
                                />
                                {safeStats.total_graded} graded enrollments
                            </div>
                            <Link
                                href={route("superadmin.archive.index")}
                                className="inline-flex items-center gap-2 self-start rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 transition-colors hover:bg-white/20 lg:self-auto"
                            >
                                <ArrowLeft size={15} />
                                Back to Archive
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {statCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <button
                                type="button"
                                key={card.label}
                                onClick={() => setActiveCardKey(card.key)}
                                className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div
                                        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} ${card.shadow} shadow-md`}
                                    >
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Archived
                                    </span>
                                </div>
                                <p className="text-3xl font-bold tabular-nums text-slate-900">
                                    {card.value}
                                </p>
                                <p className="mt-0.5 text-sm text-slate-500">
                                    {card.label}
                                </p>
                                <p className="mt-2 text-xs text-slate-400">
                                    {card.note}
                                </p>
                                <p className="mt-2 text-xs font-semibold text-blue-600">
                                    Click to view details
                                </p>
                            </button>
                        );
                    })}
                </div>

                {activeCardKey && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                        <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">
                                        {activeCardKey === "students" &&
                                            "Students Enrolled This School Year"}
                                        {activeCardKey === "teachers" &&
                                            "Teachers and Assigned Departments"}
                                        {activeCardKey === "classes" &&
                                            "Classes and Enrolled Students"}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {activeCardKey === "students" &&
                                            `${studentOverview.length} enrolled students`}
                                        {activeCardKey === "teachers" &&
                                            `${teacherOverview.length} teachers with handled classes`}
                                        {activeCardKey === "classes" &&
                                            `${classOverview.length} classes in ${schoolYear}`}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeCardModal}
                                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Close details"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="max-h-[70vh] overflow-y-auto p-6">
                                {activeCardKey === "students" && (
                                    <div className="space-y-2">
                                        {studentOverview.length === 0 ? (
                                            <p className="text-sm text-slate-500">
                                                No enrolled students found for
                                                this school year.
                                            </p>
                                        ) : (
                                            studentOverview.map((student) => (
                                                <div
                                                    key={student.id}
                                                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                                                >
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {student.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {student.email ||
                                                                    "No email"}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                                                            {
                                                                student.enrolled_classes_count
                                                            }{" "}
                                                            enrolled
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {(
                                                            student.enrolled_classes ??
                                                            []
                                                        )
                                                            .slice(0, 4)
                                                            .map(
                                                                (
                                                                    classLabel,
                                                                ) => (
                                                                    <span
                                                                        key={`${student.id}-${classLabel}`}
                                                                        className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700"
                                                                    >
                                                                        {
                                                                            classLabel
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        {(
                                                            student.enrolled_classes ??
                                                            []
                                                        ).length > 4 && (
                                                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                                                                +
                                                                {(
                                                                    student.enrolled_classes ??
                                                                    []
                                                                ).length -
                                                                    4}{" "}
                                                                more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeCardKey === "teachers" && (
                                    <div className="space-y-2">
                                        {teacherOverview.length === 0 ? (
                                            <p className="text-sm text-slate-500">
                                                No teachers found for this
                                                school year.
                                            </p>
                                        ) : (
                                            teacherOverview.map((teacher) => (
                                                <div
                                                    key={teacher.id}
                                                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                                                >
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {teacher.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {teacher
                                                                    .department
                                                                    ?.name ||
                                                                    "No department"}
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-1.5">
                                                            {(
                                                                teacher.roles ??
                                                                []
                                                            ).map((role) => (
                                                                <span
                                                                    key={`${teacher.id}-${role}`}
                                                                    className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200"
                                                                >
                                                                    {role}
                                                                </span>
                                                            ))}
                                                            <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                                                                {
                                                                    teacher.classes_count
                                                                }{" "}
                                                                classes
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeCardKey === "classes" && (
                                    <div className="space-y-2">
                                        {classOverview.length === 0 ? (
                                            <p className="text-sm text-slate-500">
                                                No classes found for this school
                                                year.
                                            </p>
                                        ) : (
                                            classOverview.map((classItem) => {
                                                const isExpanded =
                                                    expandedClassId ===
                                                    classItem.id;

                                                return (
                                                    <div
                                                        key={classItem.id}
                                                        className="rounded-xl border border-slate-200 bg-slate-50/70"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setExpandedClassId(
                                                                    isExpanded
                                                                        ? null
                                                                        : classItem.id,
                                                                )
                                                            }
                                                            className="flex w-full items-start justify-between gap-3 p-3 text-left"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {classItem
                                                                        ?.subject
                                                                        ?.name ||
                                                                        "Unnamed Subject"}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {classItem
                                                                        ?.subject
                                                                        ?.code ||
                                                                        "-"}
                                                                    {" • "}
                                                                    {
                                                                        classItem.grade_level
                                                                    }
                                                                    {" • "}
                                                                    {
                                                                        classItem.section
                                                                    }
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-600">
                                                                    Teacher:{" "}
                                                                    {
                                                                        classItem
                                                                            .teacher
                                                                            ?.name
                                                                    }
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                                                                    {
                                                                        classItem.students_count
                                                                    }{" "}
                                                                    enrolled
                                                                </span>
                                                                {isExpanded ? (
                                                                    <ChevronDown
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="text-slate-500"
                                                                    />
                                                                ) : (
                                                                    <ChevronRight
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="text-slate-500"
                                                                    />
                                                                )}
                                                            </div>
                                                        </button>

                                                        {isExpanded && (
                                                            <div className="border-t border-slate-200 px-3 py-3">
                                                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                                    Enrolled
                                                                    students
                                                                </p>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {(
                                                                        classItem.students ??
                                                                        []
                                                                    ).length ===
                                                                    0 ? (
                                                                        <span className="text-xs text-slate-500">
                                                                            No
                                                                            enrolled
                                                                            students
                                                                        </span>
                                                                    ) : (
                                                                        (
                                                                            classItem.students ??
                                                                            []
                                                                        ).map(
                                                                            (
                                                                                student,
                                                                            ) => (
                                                                                <span
                                                                                    key={`${classItem.id}-${student.id}`}
                                                                                    className="rounded-md bg-white px-2 py-1 text-[11px] text-slate-700 ring-1 ring-slate-200"
                                                                                >
                                                                                    {
                                                                                        student.name
                                                                                    }
                                                                                </span>
                                                                            ),
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/20">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Teacher Class Assignments
                            </h2>
                            <p className="text-xs text-slate-500">
                                Teachers, handled classes, and students within
                                each class
                            </p>
                        </div>
                    </div>

                    <div className="max-h-[640px] space-y-4 overflow-y-auto p-6">
                        {teacherDirectory.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                No teacher-class data available for this school
                                year.
                            </p>
                        ) : (
                            teacherDirectory.map((teacher) => (
                                <div
                                    key={teacher.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {teacher.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {teacher.email || "No email"} •{" "}
                                                {teacher.department?.name ??
                                                    "No department"}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                                                {teacher.classes_count ?? 0}{" "}
                                                classes
                                            </span>
                                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                                                {teacher.students_count ?? 0}{" "}
                                                students
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-3">
                                        {(teacher.classes ?? []).length ===
                                        0 ? (
                                            <p className="text-xs text-slate-500">
                                                No classes handled.
                                            </p>
                                        ) : (
                                            (teacher.classes ?? []).map(
                                                (classItem) => (
                                                    <div
                                                        key={classItem.id}
                                                        className="rounded-lg border border-slate-200 bg-white p-3"
                                                    >
                                                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {classItem
                                                                        ?.subject
                                                                        ?.name ||
                                                                        "Unnamed Subject"}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {classItem
                                                                        ?.subject
                                                                        ?.code ||
                                                                        "-"}
                                                                    {" • "}
                                                                    {classItem.grade_level ||
                                                                        "No grade"}
                                                                    {" • "}
                                                                    {classItem.section ||
                                                                        "No section"}
                                                                </p>
                                                            </div>
                                                            <div className="text-xs font-semibold text-slate-600">
                                                                Semester{" "}
                                                                {classItem.semester ||
                                                                    "-"}
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                                            <BookOpen
                                                                size={13}
                                                                className="text-slate-400"
                                                            />
                                                            <span>
                                                                {classItem.students_count ??
                                                                    0}{" "}
                                                                enrolled in this
                                                                class
                                                            </span>
                                                        </div>

                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {(
                                                                classItem.students ??
                                                                []
                                                            ).length === 0 ? (
                                                                <span className="text-xs text-slate-500">
                                                                    No enrolled
                                                                    students
                                                                </span>
                                                            ) : (
                                                                (
                                                                    classItem.students ??
                                                                    []
                                                                ).map(
                                                                    (
                                                                        student,
                                                                    ) => (
                                                                        <span
                                                                            key={`${classItem.id}-${student.id}`}
                                                                            className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700"
                                                                        >
                                                                            {
                                                                                student.name
                                                                            }
                                                                        </span>
                                                                    ),
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                            )
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                            <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-md shadow-slate-500/20">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Performance Snapshot
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Quick indicators for this archived year
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                        Pass Rate
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-emerald-700">
                                        {passRate !== null
                                            ? `${passRate}%`
                                            : "-"}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Graded Records
                                    </p>
                                    <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                                        {safeStats.total_graded}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                        Interventions
                                    </p>
                                    <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
                                        {totalInterventions}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                            <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Semester Breakdown
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Classes per semester
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 p-6">
                                {[
                                    {
                                        label: "1st Semester",
                                        value: safeStats.sem1_classes,
                                        share: sem1Share,
                                    },
                                    {
                                        label: "2nd Semester",
                                        value: safeStats.sem2_classes,
                                        share: sem2Share,
                                    },
                                ].map((sem) => (
                                    <div
                                        key={sem.label}
                                        className="rounded-xl border border-slate-100 bg-slate-50 p-5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {sem.label}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {sem.share}% of yearly
                                                    classes
                                                </p>
                                            </div>
                                            <p className="text-3xl font-bold tabular-nums leading-none text-slate-900">
                                                {sem.value}
                                            </p>
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                                style={{
                                                    width: `${sem.share}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {safeStats.total_graded > 0 && (
                            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                                <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            Grade Outcomes
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Based on {safeStats.total_graded}{" "}
                                            graded enrollments
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4 p-6">
                                    <div>
                                        <div className="mb-2 flex justify-between text-sm">
                                            <span className="font-medium text-slate-700">
                                                Pass Rate
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {passRate}%
                                            </span>
                                        </div>
                                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                                                style={{
                                                    width: `${passRate}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs">
                                            <span className="font-medium text-emerald-600">
                                                Passed:{" "}
                                                {passRateValue.toFixed(1)}%
                                            </span>
                                            <span className="font-medium text-rose-600">
                                                Failed:{" "}
                                                {failRateValue.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                            <CheckCircle
                                                size={20}
                                                className="shrink-0 text-emerald-500"
                                            />
                                            <div>
                                                <p className="text-2xl font-bold text-emerald-700">
                                                    {safeStats.passed}
                                                </p>
                                                <p className="text-xs text-emerald-600">
                                                    Passed
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4">
                                            <TrendingDown
                                                size={20}
                                                className="shrink-0 text-rose-500"
                                            />
                                            <div>
                                                <p className="text-2xl font-bold text-rose-700">
                                                    {safeStats.failed}
                                                </p>
                                                <p className="text-xs text-rose-600">
                                                    Failed
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {totalInterventions > 0 && (
                            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                                <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/20">
                                        <AlertTriangle className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            Interventions
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            {totalInterventions} total
                                            interventions
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2 p-6">
                                    {interventionEntries.map(
                                        ([type, count]) => (
                                            <div
                                                key={type}
                                                className="rounded-xl bg-slate-50 px-4 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-sm text-slate-700">
                                                        {INTERVENTION_LABELS[
                                                            type
                                                        ] ?? type}
                                                    </span>
                                                    <span className="text-sm font-bold tabular-nums text-slate-900">
                                                        {count}
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                                                        style={{
                                                            width: `${
                                                                topInterventionCount >
                                                                0
                                                                    ? (count /
                                                                          topInterventionCount) *
                                                                      100
                                                                    : 0
                                                            }%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="self-start overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:sticky xl:top-6">
                        <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-md shadow-slate-500/20">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Department Membership
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {departmentDirectory.length} departments
                                </p>
                            </div>
                        </div>

                        <div className="max-h-[620px] divide-y divide-slate-50 overflow-y-auto">
                            {departmentDirectory.length === 0 ? (
                                <div className="px-6 py-8 text-center">
                                    <p className="text-sm text-slate-500">
                                        No department data available.
                                    </p>
                                </div>
                            ) : (
                                departmentDirectory.map((department) => (
                                    <div
                                        key={department.id}
                                        className="space-y-3 px-6 py-4 hover:bg-slate-50/80"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {department.name}
                                                </p>
                                                <span className="mt-0.5 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                    {department.code}
                                                </span>
                                            </div>
                                            <div className="text-right text-[10px] uppercase tracking-wide text-slate-400">
                                                <p>
                                                    {department.admins_count ??
                                                        0}{" "}
                                                    admins
                                                </p>
                                                <p>
                                                    {department.teachers_count ??
                                                        0}{" "}
                                                    teachers
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                Admins
                                            </p>
                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                {(department.admins ?? [])
                                                    .length === 0 ? (
                                                    <span className="text-xs text-slate-500">
                                                        No admin assigned
                                                    </span>
                                                ) : (
                                                    (
                                                        department.admins ?? []
                                                    ).map((admin) => (
                                                        <span
                                                            key={`${department.id}-admin-${admin.id}`}
                                                            className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700 ring-1 ring-emerald-100"
                                                        >
                                                            {admin.name}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                Teachers
                                            </p>
                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                {(department.teachers ?? [])
                                                    .length === 0 ? (
                                                    <span className="text-xs text-slate-500">
                                                        No teachers assigned
                                                    </span>
                                                ) : (
                                                    (department.teachers ?? [])
                                                        .slice(0, 16)
                                                        .map((teacher) => (
                                                            <span
                                                                key={`${department.id}-teacher-${teacher.id}`}
                                                                className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700"
                                                            >
                                                                {teacher.name}
                                                            </span>
                                                        ))
                                                )}
                                                {(department.teachers ?? [])
                                                    .length > 16 && (
                                                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                                                        +
                                                        {(
                                                            department.teachers ??
                                                            []
                                                        ).length - 16}{" "}
                                                        more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = (page) => <SuperAdminLayout children={page} />;

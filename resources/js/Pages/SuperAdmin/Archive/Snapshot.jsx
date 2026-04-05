import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    Archive,
    ArrowLeft,
    ArrowRight,
    Calendar,
    Database,
    Users,
    GraduationCap,
    BookOpen,
    ClipboardList,
    CheckCircle2,
    Clock3,
    Bell,
    UserCog,
    Building2,
    ChevronDown,
    ChevronRight,
    X,
} from "lucide-react";

export default function Snapshot({
    snapshot,
    teachers = [],
    departments = [],
}) {
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

                    if (adminTeacherIds.has(Number(teacher?.id))) {
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
        const flattenedClasses = [];

        teacherOverview.forEach((teacher) => {
            (teacher.classes ?? []).forEach((classItem) => {
                flattenedClasses.push({
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

        return flattenedClasses.sort((a, b) => {
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

                const existing = byStudentId.get(studentId);
                existing.enrolled_classes_count += 1;
                existing.enrolled_classes.push(classLabel);
            });
        });

        return Array.from(byStudentId.values()).sort((a, b) =>
            String(a?.name ?? "").localeCompare(String(b?.name ?? "")),
        );
    }, [classOverview]);

    const busiestTeacher = useMemo(() => {
        return [...teacherOverview].sort(
            (a, b) =>
                Number(b?.classes_count ?? 0) - Number(a?.classes_count ?? 0),
        )[0];
    }, [teacherOverview]);

    const largestClass = useMemo(() => {
        return [...classOverview].sort(
            (a, b) =>
                Number(b?.students_count ?? 0) - Number(a?.students_count ?? 0),
        )[0];
    }, [classOverview]);

    const departmentsWithAdmins = useMemo(
        () =>
            departmentDirectory.filter(
                (department) => Number(department?.admins_count ?? 0) > 0,
            ).length,
        [departmentDirectory],
    );

    const closeCardModal = () => {
        setActiveCardKey(null);
        setExpandedClassId(null);
    };

    const formatSnapshotDate = (isoDate) => {
        if (!isoDate) {
            return "Unknown date";
        }

        const parsed = new Date(isoDate);
        return Number.isNaN(parsed.getTime())
            ? String(isoDate)
            : parsed.toLocaleString();
    };

    const summaryCards = [
        {
            key: "students",
            label: "Students",
            value: snapshot.stats.students,
            icon: GraduationCap,
            color: "from-amber-500 to-orange-500",
            shadow: "shadow-amber-500/20",
            note: "Who is enrolled",
        },
        {
            key: "teachers",
            label: "Teachers",
            value: snapshot.stats.teachers,
            icon: Users,
            color: "from-violet-500 to-purple-600",
            shadow: "shadow-violet-500/20",
            note: "Roles and departments",
        },
        {
            key: "classes",
            label: "Classes",
            value: snapshot.totals.classes,
            icon: BookOpen,
            color: "from-blue-500 to-indigo-600",
            shadow: "shadow-blue-500/20",
            note: "Teachers and enrolled students",
        },
        {
            key: null,
            label: "Enrollments",
            value: snapshot.totals.enrollments,
            icon: ClipboardList,
            color: "from-emerald-500 to-teal-600",
            shadow: "shadow-emerald-500/20",
            note: "Total enrollment records",
        },
    ];

    const detailRows = [
        {
            label: "Grades",
            value: snapshot.totals.grades,
            icon: CheckCircle2,
        },
        {
            label: "Attendance Records",
            value: snapshot.totals.attendance_records,
            icon: Calendar,
        },
        {
            label: "Interventions",
            value: snapshot.totals.interventions,
            icon: UserCog,
        },
        {
            label: "Intervention Tasks",
            value: snapshot.totals.intervention_tasks,
            icon: ClipboardList,
        },
        {
            label: "Student Notifications",
            value: snapshot.totals.student_notifications,
            icon: Bell,
        },
        {
            label: "Departments",
            value: snapshot.stats.departments,
            icon: Building2,
        },
        {
            label: "Admins",
            value: snapshot.stats.admins,
            icon: Users,
        },
    ];

    return (
        <>
            <Head title={`Snapshot - ${snapshot.school_year}`} />

            <div className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-7 shadow-xl">
                    <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute -bottom-12 left-1/4 h-36 w-36 rounded-full bg-blue-500/15 blur-2xl" />

                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                                <Database className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-200 ring-1 ring-blue-400/30">
                                    <Archive size={10} />
                                    Rollover Snapshot
                                </p>
                                <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
                                    <span>{snapshot.school_year}</span>
                                    <ArrowRight
                                        size={18}
                                        className="text-slate-300"
                                    />
                                    <span>
                                        {snapshot.next_school_year || "-"}
                                    </span>
                                </h1>
                                <p className="mt-1 text-sm text-slate-400">
                                    Captured before starting the new school year
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
                                <Clock3 size={14} className="text-slate-300" />
                                {formatSnapshotDate(snapshot.created_at)}
                            </p>
                            <p className="rounded-xl bg-white/10 px-4 py-2 text-[11px] text-slate-300 ring-1 ring-white/10">
                                Key: {snapshot.archive_key}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((item) => {
                        const Icon = item.icon;
                        const isInteractive = Boolean(item.key);
                        const CardTag = isInteractive ? "button" : "div";

                        return (
                            <CardTag
                                key={item.label}
                                {...(isInteractive
                                    ? {
                                          type: "button",
                                          onClick: () =>
                                              setActiveCardKey(item.key),
                                      }
                                    : {})}
                                className={`rounded-2xl border border-slate-100 bg-white dark:bg-gray-900 p-5 shadow-sm ${isInteractive ? "transition hover:-translate-y-0.5 hover:shadow-md" : ""}`}
                            >
                                <div
                                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-md ${item.shadow}`}
                                >
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <p className="text-3xl font-bold tabular-nums text-slate-900">
                                    {item.value}
                                </p>
                                <p className="mt-0.5 text-sm text-slate-500">
                                    {item.label}
                                </p>
                                <p className="mt-2 text-xs text-slate-400">
                                    {item.note}
                                </p>
                                {isInteractive && (
                                    <p className="mt-2 text-xs font-semibold text-blue-600">
                                        Click to view details
                                    </p>
                                )}
                            </CardTag>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-white dark:bg-gray-900 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Highest Teaching Load
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {busiestTeacher?.name || "No teacher data"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {busiestTeacher
                                ? `${busiestTeacher.classes_count ?? 0} classes handled`
                                : "-"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white dark:bg-gray-900 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Largest Class Enrollment
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {largestClass?.subject?.name || "No class data"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {largestClass
                                ? `${largestClass.students_count ?? 0} enrolled students`
                                : "-"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white dark:bg-gray-900 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Department Coverage
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {departmentDirectory.length} departments in scope
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {departmentsWithAdmins} with admin assignment
                        </p>
                    </div>
                </div>

                {activeCardKey && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                        <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white dark:bg-gray-900 shadow-2xl">
                            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">
                                        {activeCardKey === "students" &&
                                            "Students Enrolled in This Snapshot Year"}
                                        {activeCardKey === "teachers" &&
                                            "Teachers, Departments, and Roles"}
                                        {activeCardKey === "classes" &&
                                            "Classes and Enrolled Students"}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {activeCardKey === "students" &&
                                            `${studentOverview.length} enrolled students`}
                                        {activeCardKey === "teachers" &&
                                            `${teacherOverview.length} teachers with handled classes`}
                                        {activeCardKey === "classes" &&
                                            `${classOverview.length} classes in ${snapshot.school_year}`}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeCardModal}
                                    className="z-10 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
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
                                                this snapshot.
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
                                                        <span className="rounded-full bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
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
                                                                    index,
                                                                ) => (
                                                                    <span
                                                                        key={`${student.id}-${index}-${classLabel}`}
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
                                                snapshot.
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
                                                                    className="rounded-md bg-white dark:bg-gray-900 px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200"
                                                                >
                                                                    {role}
                                                                </span>
                                                            ))}
                                                            <span className="rounded-md bg-white dark:bg-gray-900 px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
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
                                                No classes found for this
                                                snapshot.
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
                                                                <span className="rounded-full bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
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
                                                                                    className="rounded-md bg-white dark:bg-gray-900 px-2 py-1 text-[11px] text-slate-700 ring-1 ring-slate-200"
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

                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:bg-gray-900 shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="font-semibold text-slate-900">
                            Snapshot Details
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Captured system totals at rollover time
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                        {detailRows.map((row) => {
                            const Icon = row.icon;
                            return (
                                <div
                                    key={row.label}
                                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                                            <Icon
                                                size={13}
                                                className="text-slate-400"
                                            />
                                            <span>{row.label}</span>
                                        </div>
                                        <span className="text-lg font-bold tabular-nums text-slate-900">
                                            {row.value}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:bg-gray-900 shadow-sm">
                        <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/20">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Teacher Class Assignments
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Archived teacher to class to student details
                                </p>
                            </div>
                        </div>

                        <div className="max-h-[620px] space-y-4 overflow-y-auto p-6">
                            {teacherOverview.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    No detailed teacher snapshot data available.
                                </p>
                            ) : (
                                teacherOverview.map((teacher) => (
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
                                                    {teacher.department?.name ??
                                                        "No department"}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(teacher.roles ?? []).map(
                                                    (role) => (
                                                        <span
                                                            key={`${teacher.id}-${role}`}
                                                            className="rounded-full bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200"
                                                        >
                                                            {role}
                                                        </span>
                                                    ),
                                                )}
                                                <span className="rounded-full bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                                                    {teacher.classes_count ?? 0}{" "}
                                                    classes
                                                </span>
                                                <span className="rounded-full bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                                                    {teacher.students_count ??
                                                        0}{" "}
                                                    students
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 space-y-3">
                                            {(teacher.classes ?? []).map(
                                                (classItem) => (
                                                    <div
                                                        key={classItem.id}
                                                        className="rounded-lg border border-slate-200 bg-white dark:bg-gray-900 p-3"
                                                    >
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {classItem?.subject
                                                                ?.name ||
                                                                "Unnamed Subject"}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {classItem?.subject
                                                                ?.code || "-"}
                                                            {" • "}
                                                            {classItem.grade_level ||
                                                                "No grade"}
                                                            {" • "}
                                                            {classItem.section ||
                                                                "No section"}
                                                            {" • Semester "}
                                                            {classItem.semester ||
                                                                "-"}
                                                        </p>

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
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:bg-gray-900 shadow-sm">
                        <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-md shadow-slate-500/20">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Department Membership
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Archived admins and teachers per department
                                </p>
                            </div>
                        </div>

                        <div className="max-h-[620px] divide-y divide-slate-50 overflow-y-auto">
                            {departmentDirectory.length === 0 ? (
                                <div className="px-6 py-8 text-center text-sm text-slate-500">
                                    No department snapshot data available.
                                </div>
                            ) : (
                                departmentDirectory.map((department) => (
                                    <div
                                        key={department.id}
                                        className="space-y-3 px-6 py-4"
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
                                                        .slice(0, 18)
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
                                                    .length > 18 && (
                                                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                                                        +
                                                        {(
                                                            department.teachers ??
                                                            []
                                                        ).length - 18}{" "}
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

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                        href={route("superadmin.archive.index")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <ArrowLeft size={14} />
                        Back to Archive
                    </Link>
                    <Link
                        href={route("superadmin.archive.show", {
                            schoolYear: snapshot.school_year,
                        })}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Open School Year Details
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </>
    );
}

Snapshot.layout = (page) => <SuperAdminLayout children={page} />;

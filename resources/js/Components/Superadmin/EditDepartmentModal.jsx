import { useForm } from "@inertiajs/react";
import {
    X,
    Building2,
    Hash,
    FileText,
    Info,
    Save,
    CheckCircle,
    Users,
    Search,
    UserCog,
    Shield,
    UserPlus,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const TRACK_OPTIONS = ["Academic", "TVL"];

function FieldError({ error }) {
    if (!error) return null;
    return (
        <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
            <Info size={12} /> {error}
        </p>
    );
}

function getPersonName(person) {
    if (!person) return "Unnamed user";
    if (person.name) return person.name;

    return (
        [person.first_name, person.middle_name, person.last_name]
            .filter(Boolean)
            .join(" ") || "Unnamed user"
    );
}

function getPersonEmail(person) {
    return person?.email || person?.personal_email || "No email";
}

function getPersonInitials(person) {
    const first = person?.first_name?.[0] ?? person?.name?.[0] ?? "U";
    const last = person?.last_name?.[0] ?? "";
    return `${first}${last}`.toUpperCase();
}

export default function EditDepartmentModal({
    isOpen,
    onClose,
    department,
    onSuccess,
}) {
    const [tab, setTab] = useState("info");
    const [teachers, setTeachers] = useState([]);
    const [teacherSearch, setTeacherSearch] = useState("");
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [specializationInput, setSpecializationInput] = useState("");

    const normalizedDepartment = useMemo(() => {
        if (!department) return null;

        return {
            ...department,
            name: department.name ?? department.department_name ?? "",
            code: department.code ?? department.department_code ?? "",
        };
    }, [department]);

    const departmentAdmins = useMemo(() => {
        if (!normalizedDepartment) return [];

        const adminsFromList = Array.isArray(
            normalizedDepartment.department_admins,
        )
            ? normalizedDepartment.department_admins
            : [];

        if (adminsFromList.length > 0) return adminsFromList;

        return normalizedDepartment.department_admin
            ? [normalizedDepartment.department_admin]
            : [];
    }, [normalizedDepartment]);

    const adminIdSet = useMemo(
        () => new Set(departmentAdmins.map((admin) => String(admin.id))),
        [departmentAdmins],
    );

    const departmentTeachers = useMemo(() => {
        const teachersFromDepartment = Array.isArray(
            normalizedDepartment?.department_teachers,
        )
            ? normalizedDepartment.department_teachers
            : [];

        return teachersFromDepartment.filter(
            (teacher) => !adminIdSet.has(String(teacher.id)),
        );
    }, [normalizedDepartment, adminIdSet]);

    const { data, setData, put, processing, errors, reset, clearErrors } =
        useForm({
            department_name: "",
            department_code: "",
            track: "Academic",
            description: "",
            is_active: true,
            specialization_names: [],
            teacher_ids: [],
            admin_id: "",
        });

    // Populate form values immediately when edit modal opens.
    useEffect(() => {
        if (!isOpen || !normalizedDepartment) return;

        const initialTeacherIds = Array.isArray(
            normalizedDepartment.department_teachers,
        )
            ? normalizedDepartment.department_teachers
                  .map((teacher) => teacher.id)
                  .filter((teacherId) => Boolean(teacherId))
            : [];

        const initialAdminId = departmentAdmins[0]?.id
            ? String(departmentAdmins[0].id)
            : "";

        setData({
            department_name: normalizedDepartment.name,
            department_code: normalizedDepartment.code,
            track: normalizedDepartment.track || "Academic",
            description: normalizedDepartment.description || "",
            is_active: normalizedDepartment.is_active ?? true,
            specialization_names: Array.isArray(
                normalizedDepartment.specializations,
            )
                ? normalizedDepartment.specializations
                      .map(
                          (specialization) =>
                              specialization?.specialization_name,
                      )
                      .filter(Boolean)
                : [],
            teacher_ids: initialTeacherIds,
            admin_id: initialAdminId,
        });
        setTab("info");
        setSpecializationInput("");
        setTeacherSearch("");
        setTeachers([]);
    }, [isOpen, normalizedDepartment, departmentAdmins]);

    // Fetch assignable teachers when opening assignment tab.
    useEffect(() => {
        if (
            tab !== "assign" ||
            !normalizedDepartment?.id ||
            teachers.length > 0
        )
            return;

        setLoadingTeachers(true);
        fetch(route("superadmin.departments.teachers", normalizedDepartment.id))
            .then((r) => r.json())
            .then(({ teachers: list, admin_id }) => {
                setTeachers(list);
                const currentIds = list
                    .filter(
                        (t) =>
                            String(t.department_id) ===
                            String(normalizedDepartment.id),
                    )
                    .map((t) => t.id);
                setData((prev) => ({
                    ...prev,
                    teacher_ids: currentIds,
                    admin_id: admin_id ? String(admin_id) : "",
                }));
            })
            .finally(() => setLoadingTeachers(false));
    }, [tab, normalizedDepartment?.id, teachers.length]);

    const handleClose = () => {
        clearErrors();
        reset();
        setTab("info");
        setTeachers([]);
        setTeacherSearch("");
        setSpecializationInput("");
        onClose();
    };

    const addSpecialization = () => {
        const value = specializationInput.trim();

        if (!value) {
            return;
        }

        const exists = data.specialization_names.some(
            (item) => item.toLowerCase() === value.toLowerCase(),
        );

        if (exists) {
            setSpecializationInput("");
            return;
        }

        setData("specialization_names", [...data.specialization_names, value]);
        setSpecializationInput("");
    };

    const removeSpecialization = (value) => {
        setData(
            "specialization_names",
            data.specialization_names.filter((item) => item !== value),
        );
    };

    const specializationErrors = Object.entries(errors)
        .filter(
            ([key]) =>
                key === "specialization_names" ||
                key.startsWith("specialization_names."),
        )
        .flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
        .filter(Boolean);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("superadmin.departments.update", normalizedDepartment.id), {
            preserveScroll: true,
            onSuccess: () => {
                handleClose();
                onSuccess?.();
            },
        });
    };

    const toggleTeacher = (id) => {
        const next = data.teacher_ids.includes(id)
            ? data.teacher_ids.filter((t) => t !== id)
            : [...data.teacher_ids, id];
        setData("teacher_ids", next);
        // clear admin if deselected
        if (!next.includes(id) && String(data.admin_id) === String(id)) {
            setData("admin_id", "");
        }
    };

    const filteredTeachers = useMemo(
        () =>
            teachers.filter((t) => {
                const full =
                    `${t.first_name} ${t.middle_name ?? ""} ${t.last_name} ${t.email ?? t.personal_email ?? ""}`.toLowerCase();
                return full.includes(teacherSearch.toLowerCase());
            }),
        [teachers, teacherSearch],
    );

    const selectedTeachers = teachers.filter((t) =>
        data.teacher_ids.includes(t.id),
    );

    if (!isOpen || !normalizedDepartment) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                            className="absolute top-3 right-3 z-10 rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <X size={18} />
                        </button>
                        <div className="relative flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Edit Department
                                </h2>
                                <p className="text-xs text-blue-100 mt-0.5 truncate max-w-xs">
                                    {normalizedDepartment.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 px-6 pt-3 gap-1">
                        {[
                            {
                                key: "info",
                                label: "Department Info",
                                icon: Building2,
                            },
                            {
                                key: "members",
                                label: "Teachers & Admin",
                                icon: Users,
                            },
                            {
                                key: "assign",
                                label: "Assign Teachers & Admin",
                                icon: UserPlus,
                            },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px ${
                                    tab === key
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                <Icon size={13} />
                                {label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-5 space-y-4 max-h-[52vh] overflow-y-auto">
                            {/* ── Tab: Department Info ── */}
                            {tab === "info" && (
                                <>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                                            <Building2
                                                size={13}
                                                className="text-slate-400"
                                            />
                                            Department Name
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.department_name}
                                            onChange={(e) =>
                                                setData(
                                                    "department_name",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g., Information and Communications Technology"
                                            className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${errors.department_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                        />
                                        <FieldError
                                            error={errors.department_name}
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                                            <Hash
                                                size={13}
                                                className="text-slate-400"
                                            />
                                            Department Code
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.department_code}
                                            onChange={(e) =>
                                                setData(
                                                    "department_code",
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            placeholder="e.g., ICT"
                                            className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${errors.department_code ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                        />
                                        <FieldError
                                            error={errors.department_code}
                                        />
                                        <p className="mt-1 text-xs text-slate-400">
                                            Short unique identifier (e.g., ICT,
                                            STEM, ABM)
                                        </p>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                                            Track
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={data.track}
                                            onChange={(e) =>
                                                setData("track", e.target.value)
                                            }
                                            className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${errors.track ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                        >
                                            {TRACK_OPTIONS.map((option) => (
                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                        <FieldError error={errors.track} />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                                            Strands / Specializations
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={specializationInput}
                                                onChange={(e) =>
                                                    setSpecializationInput(
                                                        e.target.value,
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        addSpecialization();
                                                    }
                                                }}
                                                placeholder="e.g., ICT-CSS"
                                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={addSpecialization}
                                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {data.specialization_names.length >
                                            0 && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {data.specialization_names.map(
                                                    (name) => (
                                                        <span
                                                            key={name}
                                                            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
                                                        >
                                                            {name}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeSpecialization(
                                                                        name,
                                                                    )
                                                                }
                                                                className="text-blue-500 hover:text-blue-700"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        {specializationErrors.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {specializationErrors.map(
                                                    (error, index) => (
                                                        <FieldError
                                                            key={`${error}-${index}`}
                                                            error={error}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        <p className="mt-1 text-xs text-slate-400">
                                            Manage strands/specializations for
                                            this department.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                                            <FileText
                                                size={13}
                                                className="text-slate-400"
                                            />
                                            Description
                                            <span className="text-slate-400 text-xs">
                                                (Optional)
                                            </span>
                                        </label>
                                        <textarea
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    "description",
                                                    e.target.value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Brief description of the department..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors resize-none"
                                        />
                                    </div>

                                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${data.is_active ? "bg-emerald-100" : "bg-slate-200"}`}
                                                >
                                                    <CheckCircle
                                                        size={18}
                                                        className={
                                                            data.is_active
                                                                ? "text-emerald-600"
                                                                : "text-slate-400"
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">
                                                        Active Department
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Enable or disable this
                                                        department
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex cursor-pointer items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={data.is_active}
                                                    onChange={(e) =>
                                                        setData(
                                                            "is_active",
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="peer sr-only"
                                                />
                                                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ── Tab: Teachers & Admin ── */}
                            {tab === "members" && (
                                <>
                                    <p className="text-xs text-slate-500">
                                        Current users assigned to this
                                        department.
                                    </p>

                                    {departmentAdmins.length === 0 &&
                                    departmentTeachers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-10 text-center">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                                                <Users
                                                    size={22}
                                                    className="text-slate-300"
                                                />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">
                                                No teacher or admin is assigned
                                                to this department yet.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="flex items-center gap-2 text-xs font-semibold text-violet-700">
                                                        <Shield size={12} />
                                                        Admins
                                                    </p>
                                                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                                        {
                                                            departmentAdmins.length
                                                        }
                                                    </span>
                                                </div>

                                                {departmentAdmins.length ===
                                                0 ? (
                                                    <p className="text-xs text-violet-500">
                                                        No admin assigned yet.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        {departmentAdmins.map(
                                                            (admin) => (
                                                                <div
                                                                    key={`admin-${admin.id}`}
                                                                    className="flex items-center gap-3 rounded-lg border border-violet-200 bg-white px-3 py-2.5"
                                                                >
                                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">
                                                                        {getPersonInitials(
                                                                            admin,
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-sm font-medium text-slate-800">
                                                                            {getPersonName(
                                                                                admin,
                                                                            )}
                                                                        </p>
                                                                        <p className="truncate text-xs text-slate-500">
                                                                            {getPersonEmail(
                                                                                admin,
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                                                        <Users size={12} />
                                                        Teachers
                                                    </p>
                                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                        {
                                                            departmentTeachers.length
                                                        }
                                                    </span>
                                                </div>

                                                {departmentTeachers.length ===
                                                0 ? (
                                                    <p className="text-xs text-emerald-600">
                                                        No teacher assigned yet.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        {departmentTeachers.map(
                                                            (teacher) => (
                                                                <div
                                                                    key={`teacher-${teacher.id}`}
                                                                    className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-white px-3 py-2.5"
                                                                >
                                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                                                                        {getPersonInitials(
                                                                            teacher,
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-sm font-medium text-slate-800">
                                                                            {getPersonName(
                                                                                teacher,
                                                                            )}
                                                                        </p>
                                                                        <p className="truncate text-xs text-slate-500">
                                                                            {getPersonEmail(
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
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ── Tab: Assign Teachers & Admin ── */}
                            {tab === "assign" && (
                                <>
                                    <p className="text-xs text-slate-500">
                                        Assign teachers to this department and
                                        choose one department admin.
                                    </p>

                                    <div className="relative">
                                        <Search
                                            size={14}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search teachers..."
                                            value={teacherSearch}
                                            onChange={(e) =>
                                                setTeacherSearch(e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                                        />
                                    </div>

                                    {loadingTeachers ? (
                                        <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                                            Loading teachers...
                                        </div>
                                    ) : teachers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                                            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                                <Users
                                                    size={22}
                                                    className="text-slate-300"
                                                />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">
                                                No teachers available
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                All teachers are assigned to
                                                other departments.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                {filteredTeachers.length ===
                                                0 ? (
                                                    <p className="text-center text-xs text-slate-400 py-4">
                                                        No teachers match your
                                                        search.
                                                    </p>
                                                ) : (
                                                    filteredTeachers.map(
                                                        (t) => {
                                                            const checked =
                                                                data.teacher_ids.includes(
                                                                    t.id,
                                                                );
                                                            const isAdmin =
                                                                String(
                                                                    data.admin_id,
                                                                ) ===
                                                                String(t.id);
                                                            return (
                                                                <label
                                                                    key={t.id}
                                                                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${checked ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            checked
                                                                        }
                                                                        onChange={() =>
                                                                            toggleTeacher(
                                                                                t.id,
                                                                            )
                                                                        }
                                                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                                                                        {getPersonInitials(
                                                                            t,
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-medium text-slate-800 truncate">
                                                                            {getPersonName(
                                                                                t,
                                                                            )}
                                                                        </p>
                                                                        <p className="text-xs text-slate-400 truncate">
                                                                            {getPersonEmail(
                                                                                t,
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    {isAdmin && (
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 shrink-0">
                                                                            <Shield
                                                                                size={
                                                                                    9
                                                                                }
                                                                            />{" "}
                                                                            Admin
                                                                        </span>
                                                                    )}
                                                                </label>
                                                            );
                                                        },
                                                    )
                                                )}
                                            </div>

                                            {selectedTeachers.length > 0 && (
                                                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 space-y-2">
                                                    <p className="flex items-center gap-2 text-xs font-semibold text-violet-700">
                                                        <UserCog size={13} />
                                                        Department Admin
                                                        <span className="font-normal text-violet-500">
                                                            (only one allowed)
                                                        </span>
                                                    </p>
                                                    <select
                                                        value={data.admin_id}
                                                        onChange={(e) =>
                                                            setData(
                                                                "admin_id",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500 transition-colors"
                                                    >
                                                        <option value="">
                                                            — No admin —
                                                        </option>
                                                        {selectedTeachers.map(
                                                            (t) => (
                                                                <option
                                                                    key={t.id}
                                                                    value={t.id}
                                                                >
                                                                    {getPersonName(
                                                                        t,
                                                                    )}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    {data.admin_id && (
                                                        <p className="text-xs text-violet-600 flex items-center gap-1">
                                                            <Info size={11} />
                                                            Any previous admin
                                                            in this department
                                                            will be demoted to
                                                            teacher.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={processing}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {processing ? (
                                    <>
                                        <svg
                                            className="animate-spin h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"
                                            />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={14} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

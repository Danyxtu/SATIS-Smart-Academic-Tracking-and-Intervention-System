import axios from "axios";
import { router, useForm } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    ArrowRightLeft,
    BookOpen,
    Building2,
    Check,
    CheckCircle,
    ClipboardList,
    Copy,
    Layers,
    Pencil,
    Save,
    Search,
    Shield,
    Trash2,
    User,
    UserMinus,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import Modal from "@/Components/Modal";
import DepartmentDeleteConfirmModal from "@/Components/Superadmin/DepartmentDeleteConfirmModal";
import SubjectDeleteConfirmModal from "@/Components/Superadmin/SubjectDeleteConfirmModal";

const ROLE_LABELS = {
    super_admin: "Super Admin",
    admin: "Admin",
    teacher: "Teacher",
    student: "Student",
};

const SECTION_CLASS_COLOR_OPTIONS = [
    "indigo",
    "blue",
    "red",
    "green",
    "amber",
    "purple",
    "teal",
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

function toSemesterLabel(semester) {
    return String(semester) === "2" ? "2nd Semester" : "1st Semester";
}

function normalizeSemesterValue(semester) {
    const normalized = String(semester ?? "").trim();

    if (normalized === "1" || normalized === "2") {
        return normalized;
    }

    return "";
}

function normalizeScalarOptions(options = [], fallback = []) {
    if (!Array.isArray(options) || options.length === 0) {
        return fallback;
    }

    return options.map((option) => String(option ?? "").trim()).filter(Boolean);
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

function normalizeTrackOptions(trackOptions = []) {
    if (!Array.isArray(trackOptions) || trackOptions.length === 0) {
        return [];
    }

    return trackOptions
        .map((option) => {
            if (typeof option === "string") {
                return {
                    value: option,
                    label: option,
                };
            }

            if (option && typeof option === "object") {
                const value =
                    option.value || option.id || option.track_id || "";
                const label =
                    option.label || option.track_name || option.name || value;

                if (!value) {
                    return null;
                }

                return {
                    value: String(value),
                    label,
                };
            }

            return null;
        })
        .filter(Boolean);
}

function normalizeDepartmentOptions(departmentOptions = []) {
    if (!Array.isArray(departmentOptions) || departmentOptions.length === 0) {
        return [];
    }

    return departmentOptions
        .map((option) => {
            if (!option || typeof option !== "object") {
                return null;
            }

            const value =
                option.value ||
                option.id ||
                option.department_id ||
                option.departmentId ||
                "";
            const label =
                option.label ||
                option.name ||
                option.department_name ||
                option.departmentName ||
                "";
            const code =
                option.code ||
                option.department_code ||
                option.departmentCode ||
                "";

            if (!value || !label) {
                return null;
            }

            return {
                value: String(value),
                label: String(label),
                code: String(code || ""),
            };
        })
        .filter(Boolean);
}

function normalizeSectionOptions(sectionOptions = []) {
    if (!Array.isArray(sectionOptions) || sectionOptions.length === 0) {
        return [];
    }

    return sectionOptions
        .map((option) => {
            if (!option || typeof option !== "object") {
                return null;
            }

            const value = option.value || option.id || option.section_id || "";
            const sectionName =
                option.section_name || option.name || option.label || "";

            if (!value || !sectionName) {
                return null;
            }

            const department =
                option.department && typeof option.department === "object"
                    ? option.department
                    : {};

            return {
                value: String(value),
                section_name: String(sectionName),
                section_full_label:
                    option.section_full_label || option.full_label || "",
                section_code: option.section_code || option.code || "",
                grade_level: option.grade_level || "",
                strand: option.strand || "",
                track: option.track || "",
                department_name:
                    option.department_name || department.department_name || "",
                department_code:
                    option.department_code || department.department_code || "",
            };
        })
        .filter(Boolean);
}

function normalizeSubjectOptions(subjectOptions = []) {
    if (!Array.isArray(subjectOptions) || subjectOptions.length === 0) {
        return [];
    }

    return subjectOptions
        .map((option) => {
            if (!option || typeof option !== "object") {
                return null;
            }

            const id = option.id || option.value || option.subject_id || "";
            const subjectName = option.subject_name || option.name || "";

            if (!id || !subjectName) {
                return null;
            }

            return {
                id: String(id),
                subject_name: String(subjectName),
                subject_code: option.subject_code || option.code || "",
            };
        })
        .filter(Boolean);
}

function classSubjectOptionLabel(subject) {
    const subjectCode = subject?.subject_code || "-";
    const subjectName = subject?.subject_name || "Unnamed Subject";

    return `[${subject?.id || "-"}] ${subjectCode} - ${subjectName}`;
}

function classTeacherOptionLabel(teacher) {
    const teacherName = teacher?.name || "Unnamed Teacher";
    const departmentCode = teacher?.department?.department_code || "N/A";

    return `[${teacher?.id || "-"}] ${teacherName} - ${departmentCode}`;
}

function normalizeWhitespace(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ");
}

function normalizePersonRoles(roles) {
    if (!Array.isArray(roles)) {
        return [];
    }

    return roles
        .map((role) => {
            if (!role) {
                return "";
            }

            if (typeof role === "string") {
                return role;
            }

            if (typeof role === "object") {
                return role.name || role.role || "";
            }

            return "";
        })
        .filter(Boolean)
        .map((role) => String(role));
}

function isSuperAdminPerson(person) {
    if (person?.is_superadmin === true) {
        return true;
    }

    return normalizePersonRoles(person?.roles || person?.role_names).includes(
        "super_admin",
    );
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
    onDepartmentDeleted,
    subjectManageMode = "view",
    onSubjectSaved,
    onSubjectDeleted,
    sectionManageMode = "view",
    onSectionSaved,
    trackOptions = [],
    subjectTypeOptions = [],
    subjectSemesterOptions = [],
    subjectGradeLevelOptions = [],
    departmentOptions = [],
    teacherOptions = [],
    subjectOptions = [],
    sectionOptions = [],
    currentSchoolYear = "",
}) {
    const [panel, setPanel] = useState("info");
    const [deptEditMode, setDeptEditMode] = useState(false);
    const [sectionEditMode, setSectionEditMode] = useState(false);
    const [deptTeachers, setDeptTeachers] = useState([]);
    const [deptTeachersLoaded, setDeptTeachersLoaded] = useState(false);
    const [deptTeachersLoading, setDeptTeachersLoading] = useState(false);
    const [deptTeacherSearch, setDeptTeacherSearch] = useState("");
    const [deptSpecializationInput, setDeptSpecializationInput] = useState("");
    const [deptAssignMode, setDeptAssignMode] = useState("assign");
    const [deptCreateTeacher, setDeptCreateTeacher] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
    });
    const [deptCreateTeacherErrors, setDeptCreateTeacherErrors] = useState({});
    const [deptCreateTeacherSubmitting, setDeptCreateTeacherSubmitting] =
        useState(false);
    const [deptReassignTeacherId, setDeptReassignTeacherId] = useState(null);
    const [deptReassignSearch, setDeptReassignSearch] = useState("");
    const [deptPersistedDepartment, setDeptPersistedDepartment] =
        useState(null);
    const [departmentDeleting, setDepartmentDeleting] = useState(false);
    const [showDepartmentDeleteModal, setShowDepartmentDeleteModal] =
        useState(false);
    const [departmentDeleteError, setDepartmentDeleteError] = useState("");
    const [sectionPersistedData, setSectionPersistedData] = useState(null);
    const [sectionClasses, setSectionClasses] = useState([]);
    const [sectionClassesLoaded, setSectionClassesLoaded] = useState(false);
    const [sectionClassesLoading, setSectionClassesLoading] = useState(false);
    const [sectionClassesError, setSectionClassesError] = useState("");
    const [sectionClassesMode, setSectionClassesMode] = useState("list");
    const [sectionClassDraft, setSectionClassDraft] = useState({
        subject_id: "",
        teacher_id: "",
        school_year: "",
        color: "indigo",
    });
    const [sectionClassSubjectSearch, setSectionClassSubjectSearch] =
        useState("");
    const [sectionClassTeacherSearch, setSectionClassTeacherSearch] =
        useState("");
    const [sectionClassQueue, setSectionClassQueue] = useState([]);
    const [sectionClassNotice, setSectionClassNotice] = useState("");
    const [sectionClassSaveError, setSectionClassSaveError] = useState("");
    const [sectionClassSyncing, setSectionClassSyncing] = useState(false);
    const [sectionStudents, setSectionStudents] = useState([]);
    const [sectionStudentsLoaded, setSectionStudentsLoaded] = useState(false);
    const [sectionStudentsLoading, setSectionStudentsLoading] = useState(false);
    const [sectionStudentsError, setSectionStudentsError] = useState("");
    const [sectionStudentsEditMode, setSectionStudentsEditMode] =
        useState(false);
    const [sectionStudentSearch, setSectionStudentSearch] = useState("");
    const [selectedSectionStudentId, setSelectedSectionStudentId] =
        useState(null);
    const [sectionStudentActions, setSectionStudentActions] = useState({});
    const [sectionStudentReassigningId, setSectionStudentReassigningId] =
        useState(null);
    const [sectionStudentSectionSearch, setSectionStudentSectionSearch] =
        useState("");
    const [sectionStudentsSyncing, setSectionStudentsSyncing] = useState(false);
    const [sectionStudentsSaveError, setSectionStudentsSaveError] =
        useState("");
    const [subjectPersistedData, setSubjectPersistedData] = useState(null);
    const [subjectEditMode, setSubjectEditMode] = useState(false);
    const [subjectDeleting, setSubjectDeleting] = useState(false);
    const [showSubjectDeleteModal, setShowSubjectDeleteModal] = useState(false);
    const [subjectDeleteError, setSubjectDeleteError] = useState("");
    const [subjectCopyStatus, setSubjectCopyStatus] = useState("idle");
    const [userSemesterFilter, setUserSemesterFilter] = useState("all");
    const [userQuarterFilter, setUserQuarterFilter] = useState("midterm");
    const [selectedUserClassDetail, setSelectedUserClassDetail] =
        useState(null);

    const isDepartmentTab = activeTab === "departments";
    const isSectionTab = activeTab === "sections";
    const isSubjectTab = activeTab === "subjects";
    const isDepartmentCreateMode = departmentManageMode === "create";

    const userRolesForModal = useMemo(() => {
        if (activeTab !== "users") {
            return [];
        }

        const currentUser = payload?.user || row || {};

        return normalizeRoles(
            currentUser.roles_list ||
                currentUser.roles ||
                (currentUser.role ? [currentUser.role] : []),
        );
    }, [activeTab, payload, row]);

    const userHasTeacherRole =
        activeTab === "users" && userRolesForModal.includes("teacher");
    const userHasStudentRole =
        activeTab === "users" &&
        !userHasTeacherRole &&
        userRolesForModal.includes("student");

    const resolvedTrackOptions = useMemo(
        () => normalizeTrackOptions(trackOptions),
        [trackOptions],
    );

    const resolvedSubjectTypeOptions = useMemo(
        () =>
            Array.isArray(subjectTypeOptions)
                ? subjectTypeOptions.filter(
                      (option) => option?.key && option?.label,
                  )
                : [],
        [subjectTypeOptions],
    );

    const resolvedSubjectSemesterOptions = useMemo(
        () => normalizeScalarOptions(subjectSemesterOptions, ["1", "2"]),
        [subjectSemesterOptions],
    );

    const resolvedSubjectGradeLevelOptions = useMemo(
        () => normalizeScalarOptions(subjectGradeLevelOptions, ["11", "12"]),
        [subjectGradeLevelOptions],
    );

    const resolvedDepartmentOptions = useMemo(
        () => normalizeDepartmentOptions(departmentOptions),
        [departmentOptions],
    );

    const resolvedSubjectOptions = useMemo(
        () => normalizeSubjectOptions(subjectOptions),
        [subjectOptions],
    );

    const resolvedSectionOptions = useMemo(
        () => normalizeSectionOptions(sectionOptions),
        [sectionOptions],
    );

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
        school_track_id: "",
        description: "",
        is_active: true,
        specialization_names: [],
        teacher_ids: [],
        admin_id: "",
        reassign_teacher_department_ids: {},
    });

    const {
        data: sectionData,
        setData: setSectionData,
        put: putSection,
        processing: sectionSaving,
        errors: sectionErrors,
        clearErrors: clearSectionErrors,
    } = useForm({
        department_id: "",
        section_name: "",
        section_code: "",
        cohort: "",
        grade_level: "",
        strand: "",
        track: "",
        school_year: "",
        description: "",
        advisor_teacher_id: "",
        is_active: true,
    });

    const {
        data: subjectData,
        setData: setSubjectData,
        put: putSubject,
        processing: subjectSaving,
        errors: subjectErrors,
        clearErrors: clearSubjectErrors,
    } = useForm({
        subject_name: "",
        subject_code: "",
        total_hours: "",
        type_key: "",
        semester: "",
        grade_level: "",
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
            school_track_id: row?.school_track_id,
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
            school_track_id: merged.school_track_id ?? null,
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

    const sourceSection = useMemo(() => {
        if (!isSectionTab) {
            return null;
        }

        const fallback = {
            id: row?.id,
            section_name: row?.section_name,
            section_full_label: row?.section_full_label,
            section_code: row?.section_code,
            department_id: row?.department_id ?? row?.department?.id,
            department_name:
                row?.department_name || row?.department?.department_name,
            department_code:
                row?.department_code || row?.department?.department_code,
            cohort: row?.cohort,
            grade_level: row?.grade_level,
            strand: row?.strand,
            track: row?.track,
            school_year: row?.school_year,
            description: row?.description,
            advisor_teacher_id: row?.advisor_teacher_id,
            advisor_teacher_name:
                row?.advisor_teacher_name || row?.advisor_name,
            is_active: row?.is_active,
            students_count: row?.students_count,
            classes_count: row?.classes_count,
        };

        const incoming = payload?.section || {};
        const merged = {
            ...fallback,
            ...incoming,
        };

        const department =
            merged.department && typeof merged.department === "object"
                ? merged.department
                : {};
        const sectionClasses = Array.isArray(payload?.classes)
            ? payload.classes
            : Array.isArray(merged.classes)
              ? merged.classes
              : [];

        return {
            id: merged.id ?? null,
            section_name: merged.section_name || "",
            section_full_label: merged.section_full_label || "",
            section_code: merged.section_code || "",
            department_id: merged.department_id ?? department.id ?? null,
            department_name:
                merged.department_name || department.department_name || "",
            department_code:
                merged.department_code || department.department_code || "",
            cohort: merged.cohort || "",
            grade_level: merged.grade_level || "",
            strand: merged.strand || "",
            track: merged.track || "",
            school_year: merged.school_year || "",
            description: merged.description || "",
            advisor_teacher_id:
                merged.advisor_teacher_id ?? merged.advisor_teacher?.id ?? null,
            advisor_teacher_name:
                merged.advisor_teacher_name ||
                merged.advisor_name ||
                merged.adviser_name ||
                merged.advisor_teacher?.name ||
                "",
            is_active: merged.is_active ?? true,
            students_count: asNumber(merged.students_count, 0),
            classes_count: asNumber(
                merged.classes_count,
                sectionClasses.length,
            ),
            classes: sectionClasses,
        };
    }, [isSectionTab, payload, row]);

    const sourceSubject = useMemo(() => {
        if (!isSubjectTab) {
            return null;
        }

        const fallback = {
            id: row?.id,
            subject_name: row?.subject_name || row?.name,
            subject_code: row?.subject_code || row?.code,
            total_hours: row?.total_hours,
            subject_type_key: row?.subject_type_key || row?.type_key,
            subject_type_name: row?.subject_type_name || row?.type_name,
            semester: row?.semester,
            grade_level: row?.grade_level,
            classes_count: row?.classes_count,
            current_classes_count: row?.current_classes_count,
            can_delete: row?.can_delete,
            delete_blocked_reason: row?.delete_blocked_reason,
            current_school_year: row?.current_school_year,
            current_semester: row?.current_semester,
            created_at: row?.created_at,
            updated_at: row?.updated_at,
        };

        const incoming = payload?.subject || {};
        const merged = {
            ...fallback,
            ...incoming,
        };

        return {
            id: merged.id ?? null,
            subject_name: merged.subject_name || merged.name || "",
            subject_code: merged.subject_code || merged.code || "",
            total_hours:
                merged.total_hours === null || merged.total_hours === undefined
                    ? ""
                    : String(merged.total_hours),
            subject_type_key: merged.subject_type_key || merged.type_key || "",
            subject_type_name:
                merged.subject_type_name || merged.type_name || "",
            semester:
                merged.semester === null || merged.semester === undefined
                    ? ""
                    : String(merged.semester),
            grade_level:
                merged.grade_level === null || merged.grade_level === undefined
                    ? ""
                    : String(merged.grade_level),
            classes_count: asNumber(merged.classes_count, 0),
            current_classes_count: asNumber(merged.current_classes_count, 0),
            can_delete:
                typeof merged.can_delete === "boolean"
                    ? merged.can_delete
                    : asNumber(merged.current_classes_count, 0) === 0,
            delete_blocked_reason: merged.delete_blocked_reason || "",
            current_school_year: merged.current_school_year || "",
            current_semester:
                merged.current_semester === null ||
                merged.current_semester === undefined
                    ? ""
                    : String(merged.current_semester),
            created_at: merged.created_at || "",
            updated_at: merged.updated_at || "",
        };
    }, [isSubjectTab, payload, row]);

    const activeDepartment = deptPersistedDepartment || sourceDepartment;
    const activeSection = sectionPersistedData || sourceSection;
    const activeSubject = subjectPersistedData || sourceSubject;
    const sourceDepartmentSyncKey = useMemo(() => {
        if (!sourceDepartment) {
            return "";
        }

        const specializationKey = Array.isArray(
            sourceDepartment.specializations,
        )
            ? sourceDepartment.specializations.join("|")
            : "";
        const adminKey = Array.isArray(sourceDepartment.admins)
            ? sourceDepartment.admins
                  .map((admin) => String(admin.id || ""))
                  .sort()
                  .join("|")
            : "";
        const teacherKey = Array.isArray(sourceDepartment.teachers)
            ? sourceDepartment.teachers
                  .map((teacher) => String(teacher.id || ""))
                  .sort()
                  .join("|")
            : "";

        return [
            sourceDepartment.id ?? "",
            sourceDepartment.name ?? "",
            sourceDepartment.code ?? "",
            sourceDepartment.track ?? "",
            sourceDepartment.school_track_id ?? "",
            sourceDepartment.description ?? "",
            sourceDepartment.is_active ? "1" : "0",
            sourceDepartment.admins_count ?? "",
            sourceDepartment.teachers_count ?? "",
            sourceDepartment.students_count ?? "",
            specializationKey,
            adminKey,
            teacherKey,
        ].join("::");
    }, [sourceDepartment]);

    const sourceSectionSyncKey = useMemo(() => {
        if (!sourceSection) {
            return "";
        }

        return [
            sourceSection.id ?? "",
            sourceSection.section_name ?? "",
            sourceSection.section_code ?? "",
            sourceSection.department_id ?? "",
            sourceSection.cohort ?? "",
            sourceSection.grade_level ?? "",
            sourceSection.strand ?? "",
            sourceSection.track ?? "",
            sourceSection.school_year ?? "",
            sourceSection.description ?? "",
            sourceSection.advisor_teacher_id ?? "",
            sourceSection.is_active ? "1" : "0",
            sourceSection.classes_count ?? "",
            sourceSection.students_count ?? "",
        ].join("::");
    }, [sourceSection]);

    const sourceSubjectSyncKey = useMemo(() => {
        if (!sourceSubject) {
            return "";
        }

        return [
            sourceSubject.id ?? "",
            sourceSubject.subject_name ?? "",
            sourceSubject.subject_code ?? "",
            sourceSubject.total_hours ?? "",
            sourceSubject.subject_type_key ?? "",
            sourceSubject.semester ?? "",
            sourceSubject.grade_level ?? "",
            sourceSubject.classes_count ?? "",
            sourceSubject.current_classes_count ?? "",
            sourceSubject.can_delete ? "1" : "0",
            sourceSubject.delete_blocked_reason ?? "",
            sourceSubject.current_school_year ?? "",
            sourceSubject.current_semester ?? "",
        ].join("::");
    }, [sourceSubject]);

    const sectionTeacherPool = useMemo(
        () => (Array.isArray(teacherOptions) ? teacherOptions : []),
        [teacherOptions],
    );

    const sectionAdviserOptions = useMemo(() => {
        const selectedDepartmentId = String(
            sectionData.department_id || activeSection?.department_id || "",
        );

        const byId = new Map();

        sectionTeacherPool.forEach((teacher) => {
            if (!teacher?.id) {
                return;
            }

            const teacherDepartmentId =
                teacher.department_id || teacher.department?.id;

            if (
                selectedDepartmentId &&
                String(teacherDepartmentId || "") !== selectedDepartmentId
            ) {
                return;
            }

            byId.set(String(teacher.id), teacher);
        });

        const currentAdviserId =
            sectionData.advisor_teacher_id || activeSection?.advisor_teacher_id;

        if (currentAdviserId && !byId.has(String(currentAdviserId))) {
            const fallbackTeacher = sectionTeacherPool.find(
                (teacher) => String(teacher.id) === String(currentAdviserId),
            ) || {
                id: currentAdviserId,
                name: activeSection?.advisor_teacher_name || "Current adviser",
            };

            byId.set(String(fallbackTeacher.id), fallbackTeacher);
        }

        return Array.from(byId.values());
    }, [
        sectionTeacherPool,
        sectionData.department_id,
        sectionData.advisor_teacher_id,
        activeSection?.department_id,
        activeSection?.advisor_teacher_id,
        activeSection?.advisor_teacher_name,
    ]);

    const reassignableDepartmentOptions = useMemo(
        () =>
            resolvedDepartmentOptions.filter(
                (department) =>
                    String(department.value) !== String(activeDepartment?.id),
            ),
        [resolvedDepartmentOptions, activeDepartment?.id],
    );

    const filteredReassignDepartmentOptions = useMemo(() => {
        const keyword = String(deptReassignSearch || "")
            .trim()
            .toLowerCase();

        if (!keyword) {
            return reassignableDepartmentOptions;
        }

        return reassignableDepartmentOptions.filter((department) => {
            const searchable =
                `${department.label} ${department.code}`.toLowerCase();

            return searchable.includes(keyword);
        });
    }, [reassignableDepartmentOptions, deptReassignSearch]);

    const sectionClassTeacherOptions = useMemo(() => {
        const selectedDepartmentId = String(activeSection?.department_id || "");

        return sectionTeacherPool.filter((teacher) => {
            if (!teacher?.id) {
                return false;
            }

            if (!selectedDepartmentId) {
                return true;
            }

            const teacherDepartmentId =
                teacher.department_id || teacher.department?.id;

            return String(teacherDepartmentId || "") === selectedDepartmentId;
        });
    }, [sectionTeacherPool, activeSection?.department_id]);

    const sectionClassSubjectLookup = useMemo(() => {
        const lookup = new Map();

        resolvedSubjectOptions.forEach((subject) => {
            lookup.set(classSubjectOptionLabel(subject), subject);
        });

        return lookup;
    }, [resolvedSubjectOptions]);

    const sectionClassTeacherLookup = useMemo(() => {
        const lookup = new Map();

        sectionClassTeacherOptions.forEach((teacher) => {
            lookup.set(classTeacherOptionLabel(teacher), teacher);
        });

        return lookup;
    }, [sectionClassTeacherOptions]);

    const selectedSectionClassSubject = useMemo(
        () =>
            resolvedSubjectOptions.find(
                (subject) =>
                    String(subject.id) === String(sectionClassDraft.subject_id),
            ) || null,
        [resolvedSubjectOptions, sectionClassDraft.subject_id],
    );

    const selectedSectionClassTeacher = useMemo(
        () =>
            sectionClassTeacherOptions.find(
                (teacher) =>
                    String(teacher.id) === String(sectionClassDraft.teacher_id),
            ) || null,
        [sectionClassTeacherOptions, sectionClassDraft.teacher_id],
    );

    const sectionClassQueueKeySet = useMemo(
        () =>
            new Set(
                sectionClassQueue.map((item) =>
                    `${item.subject_id}|${item.school_year}`.toLowerCase(),
                ),
            ),
        [sectionClassQueue],
    );

    const sectionClassDraftDuplicateMessage = useMemo(() => {
        const subjectId = String(sectionClassDraft.subject_id || "").trim();
        const schoolYear = normalizeWhitespace(sectionClassDraft.school_year);

        if (!subjectId || !schoolYear) {
            return "";
        }

        const queueKey = `${subjectId}|${schoolYear}`.toLowerCase();

        if (sectionClassQueueKeySet.has(queueKey)) {
            return "Duplicate queue entry: this subject and school year is already queued for the selected section.";
        }

        return "";
    }, [
        sectionClassDraft.subject_id,
        sectionClassDraft.school_year,
        sectionClassQueueKeySet,
    ]);

    const sectionClassesCount = sectionClassesLoaded
        ? sectionClasses.length
        : asNumber(
              activeSection?.classes_count,
              Array.isArray(activeSection?.classes)
                  ? activeSection.classes.length
                  : 0,
          );

    const sectionClassDisplayItems = sectionClassesLoaded
        ? sectionClasses
        : Array.isArray(activeSection?.classes)
          ? activeSection.classes
          : [];

    const canAddSectionClassToQueue = useMemo(() => {
        const schoolYear = normalizeWhitespace(sectionClassDraft.school_year);
        const matchedSubject = sectionClassSubjectLookup.get(
            sectionClassSubjectSearch,
        );
        const matchedTeacher = sectionClassTeacherLookup.get(
            sectionClassTeacherSearch,
        );

        const isSubjectExactMatch =
            Boolean(matchedSubject) &&
            String(matchedSubject.id) === String(sectionClassDraft.subject_id);
        const isTeacherExactMatch =
            Boolean(matchedTeacher) &&
            String(matchedTeacher.id) === String(sectionClassDraft.teacher_id);

        return (
            isSubjectExactMatch &&
            isTeacherExactMatch &&
            /^\d{4}-\d{4}$/.test(schoolYear) &&
            !sectionClassDraftDuplicateMessage &&
            !sectionClassSyncing
        );
    }, [
        sectionClassDraft.subject_id,
        sectionClassDraft.teacher_id,
        sectionClassDraft.school_year,
        sectionClassSubjectLookup,
        sectionClassTeacherLookup,
        sectionClassSubjectSearch,
        sectionClassTeacherSearch,
        sectionClassDraftDuplicateMessage,
        sectionClassSyncing,
    ]);

    const sectionStudentActionEntries = useMemo(
        () =>
            Object.entries(sectionStudentActions || {})
                .map(([studentId, details]) => ({
                    student_id: Number(studentId),
                    operation: details?.action,
                    target_section_id: details?.target_section_id
                        ? Number(details.target_section_id)
                        : null,
                }))
                .filter(
                    (entry) =>
                        entry.student_id > 0 &&
                        (entry.operation === "remove" ||
                            entry.operation === "reassign"),
                ),
        [sectionStudentActions],
    );

    const sectionStudentsCount = sectionStudentsLoaded
        ? sectionStudents.length
        : asNumber(activeSection?.students_count, 0);

    const sectionStudentsProjectedCount = Math.max(
        0,
        sectionStudentsCount - sectionStudentActionEntries.length,
    );

    const sectionStudentsHasInvalidActions = sectionStudentActionEntries.some(
        (entry) => entry.operation === "reassign" && !entry.target_section_id,
    );

    const sectionStudentReassignOptions = useMemo(
        () =>
            resolvedSectionOptions.filter(
                (option) =>
                    String(option.value) !== String(activeSection?.id || ""),
            ),
        [resolvedSectionOptions, activeSection?.id],
    );

    const filteredSectionStudentReassignOptions = useMemo(() => {
        const keyword = String(sectionStudentSectionSearch || "")
            .trim()
            .toLowerCase();

        if (!keyword) {
            return sectionStudentReassignOptions;
        }

        return sectionStudentReassignOptions.filter((option) => {
            const searchable = [
                option.section_full_label,
                option.section_name,
                option.section_code,
                option.grade_level,
                option.strand,
                option.track,
                option.department_name,
                option.department_code,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(keyword);
        });
    }, [sectionStudentReassignOptions, sectionStudentSectionSearch]);

    const filteredSectionStudents = useMemo(() => {
        const keyword = String(sectionStudentSearch || "")
            .trim()
            .toLowerCase();

        if (!keyword) {
            return sectionStudents;
        }

        return sectionStudents.filter((student) => {
            const searchable = [
                student.name,
                student.student_name,
                student.personal_email,
                student.lrn,
                student.grade_level,
                student.strand,
                student.track,
                student.section,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(keyword);
        });
    }, [sectionStudents, sectionStudentSearch]);

    const selectedSectionStudent = useMemo(() => {
        if (!sectionStudents.length) {
            return null;
        }

        const fromSelection = sectionStudents.find(
            (student) =>
                String(student.id) === String(selectedSectionStudentId || ""),
        );

        if (fromSelection) {
            return fromSelection;
        }

        return filteredSectionStudents[0] || sectionStudents[0] || null;
    }, [sectionStudents, filteredSectionStudents, selectedSectionStudentId]);

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
        const selectedTrackId = department.school_track_id
            ? String(department.school_track_id)
            : resolvedTrackOptions.find(
                  (option) => option.label === department.track,
              )?.value ||
              resolvedTrackOptions[0]?.value ||
              "";

        setDeptData({
            department_name: department.name || "",
            department_code: department.code || "",
            school_track_id: selectedTrackId,
            description: department.description || "",
            is_active: department.is_active ?? true,
            specialization_names: department.specializations || [],
            teacher_ids: teacherIds,
            admin_id: adminId,
            reassign_teacher_department_ids: {},
        });
    };

    const hydrateSectionForm = (section) => {
        if (!section) {
            return;
        }

        setSectionData({
            department_id: section.department_id
                ? String(section.department_id)
                : "",
            section_name: section.section_name || "",
            section_code: section.section_code || "",
            cohort: section.cohort || "",
            grade_level: section.grade_level || "",
            strand: section.strand || "",
            track: section.track || "",
            school_year: section.school_year || currentSchoolYear || "",
            description: section.description || "",
            advisor_teacher_id: section.advisor_teacher_id
                ? String(section.advisor_teacher_id)
                : "",
            is_active: section.is_active ?? true,
        });
    };

    const hydrateSubjectForm = (subject) => {
        if (!subject) {
            return;
        }

        setSubjectData({
            subject_name: subject.subject_name || "",
            subject_code: subject.subject_code || "",
            total_hours: subject.total_hours || "",
            type_key: subject.subject_type_key || "",
            semester: subject.semester || "",
            grade_level: subject.grade_level || "",
        });
    };

    useEffect(() => {
        if (!show || !isDepartmentTab) {
            return;
        }

        setDeptPersistedDepartment(null);
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
        setDeptAssignMode("assign");
        setDeptCreateTeacher({
            first_name: "",
            middle_name: "",
            last_name: "",
            email: "",
        });
        setDeptCreateTeacherErrors({});
        setDeptCreateTeacherSubmitting(false);
        setDeptReassignTeacherId(null);
        setDeptReassignSearch("");
        setDepartmentDeleting(false);
        setShowDepartmentDeleteModal(false);
        setDepartmentDeleteError("");
        clearDepartmentErrors();
    }, [
        show,
        isDepartmentTab,
        sourceDepartmentSyncKey,
        departmentManageMode,
        clearDepartmentErrors,
        resolvedTrackOptions,
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
                if (activeDepartment?.id) {
                    const response = await fetch(
                        route(
                            "superadmin.departments.teachers",
                            activeDepartment.id,
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
        activeDepartment?.id,
    ]);

    useEffect(() => {
        if (!show || !isSectionTab) {
            return;
        }

        setSectionPersistedData(null);
        setSectionClasses([]);
        setSectionClassesLoaded(false);
        setSectionClassesLoading(false);
        setSectionClassesError("");
        setSectionClassesMode("list");
        setSectionClassDraft({
            subject_id: "",
            teacher_id: "",
            school_year: sourceSection?.school_year || currentSchoolYear || "",
            color: "indigo",
        });
        setSectionClassSubjectSearch("");
        setSectionClassTeacherSearch("");
        setSectionClassQueue([]);
        setSectionClassNotice("");
        setSectionClassSaveError("");
        setSectionClassSyncing(false);
        setSectionStudents([]);
        setSectionStudentsLoaded(false);
        setSectionStudentsLoading(false);
        setSectionStudentsError("");
        setSectionStudentsEditMode(false);
        setSectionStudentSearch("");
        setSelectedSectionStudentId(null);
        setSectionStudentActions({});
        setSectionStudentReassigningId(null);
        setSectionStudentSectionSearch("");
        setSectionStudentsSyncing(false);
        setSectionStudentsSaveError("");
        hydrateSectionForm(sourceSection);
        setSectionEditMode(sectionManageMode === "edit");
        clearSectionErrors();

        if (sectionManageMode === "edit") {
            setPanel("info");
        }
    }, [
        show,
        isSectionTab,
        sourceSectionSyncKey,
        sectionManageMode,
        clearSectionErrors,
        currentSchoolYear,
        sourceSection?.school_year,
    ]);

    useEffect(() => {
        if (!show || !isSubjectTab) {
            return;
        }

        setSubjectPersistedData(null);
        hydrateSubjectForm(sourceSubject);
        setSubjectEditMode(subjectManageMode === "edit");
        setSubjectDeleting(false);
        setShowSubjectDeleteModal(false);
        setSubjectDeleteError("");
        setSubjectCopyStatus("idle");
        clearSubjectErrors();
        setPanel("info");
    }, [
        show,
        isSubjectTab,
        sourceSubjectSyncKey,
        subjectManageMode,
        clearSubjectErrors,
    ]);

    useEffect(() => {
        if (
            !show ||
            !isSectionTab ||
            !activeSection?.id ||
            sectionClassesLoaded ||
            sectionClassesLoading
        ) {
            return;
        }

        const loadSectionClasses = async () => {
            setSectionClassesLoading(true);
            setSectionClassesError("");

            try {
                const response = await axios.get(
                    route(
                        "superadmin.academic-management.sections.classes.index",
                        activeSection.id,
                    ),
                );

                const list = Array.isArray(response?.data?.classes)
                    ? response.data.classes
                    : [];
                const responseCount = Number(
                    response?.data?.classes_count ?? response?.data?.count,
                );
                const normalizedCount = Number.isFinite(responseCount)
                    ? responseCount
                    : list.length;

                setSectionClasses(list);

                setSectionPersistedData((previous) =>
                    previous
                        ? {
                              ...previous,
                              classes_count: normalizedCount,
                              classes: list,
                          }
                        : previous,
                );
            } catch {
                setSectionClasses([]);
                setSectionClassesError(
                    "Unable to load section classes right now.",
                );
            } finally {
                setSectionClassesLoaded(true);
                setSectionClassesLoading(false);
            }
        };

        loadSectionClasses();
    }, [
        show,
        isSectionTab,
        activeSection?.id,
        sectionClassesLoaded,
        sectionClassesLoading,
    ]);

    useEffect(() => {
        if (
            !show ||
            !isSectionTab ||
            !activeSection?.id ||
            sectionStudentsLoaded ||
            sectionStudentsLoading
        ) {
            return;
        }

        const loadSectionStudents = async () => {
            setSectionStudentsLoading(true);
            setSectionStudentsError("");

            try {
                const response = await axios.get(
                    route(
                        "superadmin.academic-management.sections.students.index",
                        activeSection.id,
                    ),
                );

                const list = Array.isArray(response?.data?.students)
                    ? response.data.students
                    : [];
                const responseCount = Number(
                    response?.data?.students_count ?? response?.data?.count,
                );
                const normalizedCount = Number.isFinite(responseCount)
                    ? responseCount
                    : list.length;

                setSectionStudents(list);
                setSelectedSectionStudentId((currentId) => {
                    const keepCurrent = list.some(
                        (student) =>
                            String(student.id) === String(currentId || ""),
                    );

                    if (keepCurrent) {
                        return currentId;
                    }

                    return list[0]?.id ? String(list[0].id) : null;
                });

                setSectionPersistedData((previous) =>
                    previous
                        ? {
                              ...previous,
                              students_count: normalizedCount,
                          }
                        : previous,
                );
            } catch {
                setSectionStudents([]);
                setSectionStudentsError(
                    "Unable to load section students right now.",
                );
            } finally {
                setSectionStudentsLoaded(true);
                setSectionStudentsLoading(false);
            }
        };

        loadSectionStudents();
    }, [
        show,
        isSectionTab,
        activeSection?.id,
        sectionStudentsLoaded,
        sectionStudentsLoading,
    ]);

    useEffect(() => {
        if (!show || !isSectionTab || panel === "students") {
            return;
        }

        setSectionStudentReassigningId(null);
        setSectionStudentSectionSearch("");
    }, [show, isSectionTab, panel]);

    useEffect(() => {
        if (!show || !isSectionTab) {
            return;
        }

        const selectedId = selectedSectionStudent?.id
            ? String(selectedSectionStudent.id)
            : null;
        const currentId = selectedSectionStudentId
            ? String(selectedSectionStudentId)
            : null;

        if (selectedId !== currentId) {
            setSelectedSectionStudentId(selectedId);
        }
    }, [
        show,
        isSectionTab,
        selectedSectionStudent?.id,
        selectedSectionStudentId,
    ]);

    useEffect(() => {
        if (!show || !isSectionTab) {
            return;
        }

        setSectionClassSubjectSearch(
            selectedSectionClassSubject
                ? classSubjectOptionLabel(selectedSectionClassSubject)
                : "",
        );
    }, [
        show,
        isSectionTab,
        selectedSectionClassSubject?.id,
        selectedSectionClassSubject?.subject_code,
        selectedSectionClassSubject?.subject_name,
    ]);

    useEffect(() => {
        if (!show || !isSectionTab) {
            return;
        }

        if (sectionClassDraft.teacher_id && !selectedSectionClassTeacher) {
            setSectionClassDraft((previous) => ({
                ...previous,
                teacher_id: "",
            }));
            setSectionClassTeacherSearch("");
            return;
        }

        setSectionClassTeacherSearch(
            selectedSectionClassTeacher
                ? classTeacherOptionLabel(selectedSectionClassTeacher)
                : "",
        );
    }, [
        show,
        isSectionTab,
        sectionClassDraft.teacher_id,
        selectedSectionClassTeacher?.id,
        selectedSectionClassTeacher?.name,
        selectedSectionClassTeacher?.department?.department_code,
    ]);

    useEffect(() => {
        if (isDepartmentTab) {
            return;
        }

        if (activeTab === "users") {
            setSelectedUserClassDetail(null);
            setUserSemesterFilter("all");
            setUserQuarterFilter("midterm");

            if (userHasTeacherRole) {
                setPanel("advisory");
                return;
            }

            if (userHasStudentRole) {
                setPanel("info");
                return;
            }
        }

        setPanel("info");
    }, [
        activeTab,
        show,
        payload,
        isDepartmentTab,
        userHasTeacherRole,
        userHasStudentRole,
    ]);

    const data = (() => {
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
            const hasTeacherRole = userRoles.includes("teacher");
            const hasStudentRole =
                !hasTeacherRole && userRoles.includes("student");
            const prioritizedRole = hasTeacherRole
                ? "teacher"
                : hasStudentRole
                  ? "student"
                  : userRoles[0] || current.role;
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

            const advisoryClasses = Array.isArray(
                current.teacher_advisory_classes,
            )
                ? current.teacher_advisory_classes
                : Array.isArray(current.advisory_classes)
                  ? current.advisory_classes
                  : [];

            const teachingClasses = Array.isArray(
                current.teacher_teaching_classes,
            )
                ? current.teacher_teaching_classes
                : Array.isArray(current.teaching_classes)
                  ? current.teaching_classes
                  : [];

            const studentSection =
                current.student_section &&
                typeof current.student_section === "object"
                    ? current.student_section
                    : null;

            const studentClasses = Array.isArray(current.student_classes)
                ? current.student_classes
                : [];

            const currentSemesterValue = normalizeSemesterValue(
                current.current_semester,
            );

            const matchesSemester = (semesterValue) =>
                userSemesterFilter === "all" ||
                normalizeSemesterValue(semesterValue) === userSemesterFilter;

            const advisoryClassesFiltered = advisoryClasses.filter((entry) => {
                if (userSemesterFilter === "all") {
                    return true;
                }

                const sectionClasses = Array.isArray(entry?.classes)
                    ? entry.classes
                    : [];

                return sectionClasses.some((classEntry) =>
                    matchesSemester(classEntry?.semester),
                );
            });

            const teachingClassesFiltered = teachingClasses.filter((entry) =>
                matchesSemester(entry?.semester),
            );

            const studentClassesFiltered = studentClasses.filter((entry) =>
                matchesSemester(entry?.semester),
            );

            const secondSemesterStarted =
                currentSemesterValue === "2" ||
                studentClasses.some(
                    (entry) => normalizeSemesterValue(entry?.semester) === "2",
                );

            const semesterFilterToggle =
                hasTeacherRole || hasStudentRole ? (
                    <div className="rounded-lg border border-emerald-200 bg-white p-1">
                        <div className="grid w-full grid-cols-3 gap-1">
                            {[
                                { value: "all", label: "All Semester" },
                                { value: "1", label: "1st Semester" },
                                { value: "2", label: "2nd Semester" },
                            ].map((option) => {
                                const active =
                                    userSemesterFilter === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            setUserSemesterFilter(option.value)
                                        }
                                        className={`w-full rounded-md px-3 py-2 text-[11px] font-semibold transition ${
                                            active
                                                ? "bg-emerald-600 text-white"
                                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : null;

            const selectedAdvisoryClass =
                selectedUserClassDetail?.source === "advisory"
                    ? selectedUserClassDetail.item
                    : null;

            const selectedTeachingClass =
                selectedUserClassDetail?.source === "teaching"
                    ? selectedUserClassDetail.item
                    : null;

            const selectedStudentClass =
                selectedUserClassDetail?.source === "student"
                    ? selectedUserClassDetail.item
                    : null;

            const advisoryPanel = (
                <div className="space-y-3">
                    {semesterFilterToggle}

                    {selectedAdvisoryClass ? (
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setSelectedUserClassDetail(null)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                            >
                                <ArrowLeft size={13} />
                                Back to Advisory Classes
                            </button>

                            <div className="rounded-lg border border-emerald-200 bg-white p-3">
                                <p className="text-sm font-semibold text-slate-900">
                                    {selectedAdvisoryClass.section_label ||
                                        selectedAdvisoryClass.section_name ||
                                        "Advisory Section"}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    {selectedAdvisoryClass.section_code ||
                                        "No section code"}
                                    {selectedAdvisoryClass.school_year
                                        ? ` • ${selectedAdvisoryClass.school_year}`
                                        : ""}
                                </p>

                                <div className="mt-3 rounded-md bg-emerald-50 px-4">
                                    <FieldRow
                                        label="Grade level"
                                        value={
                                            selectedAdvisoryClass.grade_level
                                                ? `Grade ${selectedAdvisoryClass.grade_level}`
                                                : "-"
                                        }
                                    />
                                    <FieldRow
                                        label="Strand"
                                        value={
                                            selectedAdvisoryClass.strand || "-"
                                        }
                                    />
                                    <FieldRow
                                        label="Track"
                                        value={
                                            selectedAdvisoryClass.track || "-"
                                        }
                                    />
                                    <FieldRow
                                        label="Class records"
                                        value={asNumber(
                                            selectedAdvisoryClass.classes_count,
                                            Array.isArray(
                                                selectedAdvisoryClass.classes,
                                            )
                                                ? selectedAdvisoryClass.classes
                                                      .length
                                                : 0,
                                        )}
                                    />
                                </div>
                            </div>

                            {(() => {
                                const advisoryClassItems = Array.isArray(
                                    selectedAdvisoryClass.classes,
                                )
                                    ? selectedAdvisoryClass.classes
                                    : [];

                                const filteredClassItems =
                                    userSemesterFilter === "all"
                                        ? advisoryClassItems
                                        : advisoryClassItems.filter((item) =>
                                              matchesSemester(item?.semester),
                                          );

                                if (filteredClassItems.length === 0) {
                                    return (
                                        <EmptyCard message="No advisory class records found for the selected semester." />
                                    );
                                }

                                return (
                                    <div className="space-y-2">
                                        {filteredClassItems.map((item) => (
                                            <div
                                                key={`advisory-detail-${item.id || item.subject_id || item.subject_code || item.subject_name}`}
                                                className="rounded-lg border border-emerald-200 bg-white p-3"
                                            >
                                                <p className="text-[13px] font-semibold text-slate-900">
                                                    {item.subject_name ||
                                                        "Unknown Subject"}
                                                </p>
                                                <p className="mt-1 text-[11px] text-slate-500">
                                                    {item.subject_code ||
                                                        "No subject code"}
                                                    {item.semester
                                                        ? ` • ${toSemesterLabel(item.semester)}`
                                                        : ""}
                                                </p>
                                                <p className="mt-1 text-[11px] text-slate-500">
                                                    Teacher:{" "}
                                                    {item.teacher_name ||
                                                        "Unassigned"}
                                                    {` • ${asNumber(item.students_count, 0)} students`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    ) : advisoryClassesFiltered.length === 0 ? (
                        <EmptyCard message="No advisory classes found for the selected semester." />
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <SummaryCard
                                    label="Advisory classes"
                                    value={advisoryClassesFiltered.length}
                                />
                                <SummaryCard
                                    label="School year"
                                    value={
                                        advisoryClassesFiltered[0]
                                            ?.school_year || "-"
                                    }
                                />
                                <SummaryCard
                                    label="Semester filter"
                                    value={
                                        userSemesterFilter === "all"
                                            ? "All"
                                            : toSemesterLabel(
                                                  userSemesterFilter,
                                              )
                                    }
                                    muted
                                />
                            </div>

                            {advisoryClassesFiltered.map((entry) => {
                                const sectionClasses = Array.isArray(
                                    entry?.classes,
                                )
                                    ? entry.classes
                                    : [];

                                const filteredSectionClasses =
                                    userSemesterFilter === "all"
                                        ? sectionClasses
                                        : sectionClasses.filter((item) =>
                                              matchesSemester(item?.semester),
                                          );

                                const subjectMap = new Map();

                                filteredSectionClasses.forEach((item) => {
                                    const uniqueKey = [
                                        item.subject_id ||
                                            item.subject_code ||
                                            item.subject_name ||
                                            item.id ||
                                            "subject",
                                        normalizeSemesterValue(item.semester) ||
                                            "all",
                                    ].join("::");

                                    if (!subjectMap.has(uniqueKey)) {
                                        subjectMap.set(uniqueKey, {
                                            subject_name: item.subject_name,
                                            subject_code: item.subject_code,
                                            semester: normalizeSemesterValue(
                                                item.semester,
                                            ),
                                        });
                                    }
                                });

                                const subjects = Array.from(
                                    subjectMap.values(),
                                );

                                return (
                                    <button
                                        key={`advisory-${entry.id || entry.section_id || entry.section_name}`}
                                        type="button"
                                        onClick={() =>
                                            setSelectedUserClassDetail({
                                                source: "advisory",
                                                item: entry,
                                            })
                                        }
                                        className="w-full rounded-lg border border-emerald-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                                    >
                                        <p className="text-sm font-semibold text-slate-900">
                                            {entry.section_label ||
                                                entry.section_name ||
                                                "Advisory Section"}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {entry.section_code ||
                                                "No section code"}
                                            {entry.school_year
                                                ? ` • ${entry.school_year}`
                                                : ""}
                                        </p>

                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {subjects.length === 0 ? (
                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                    No subject records
                                                </span>
                                            ) : (
                                                subjects
                                                    .slice(0, 4)
                                                    .map((subject, index) => (
                                                        <span
                                                            key={`subject-chip-${entry.id}-${subject.subject_code || subject.subject_name || index}`}
                                                            className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                                        >
                                                            {subject.subject_code ||
                                                                subject.subject_name ||
                                                                "Subject"}
                                                            {subject.semester
                                                                ? ` • Sem ${subject.semester}`
                                                                : ""}
                                                        </span>
                                                    ))
                                            )}
                                            {subjects.length > 4 && (
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                    +{subjects.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            );

            const teachingPanel = (
                <div className="space-y-3">
                    {semesterFilterToggle}

                    {selectedTeachingClass ? (
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setSelectedUserClassDetail(null)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                            >
                                <ArrowLeft size={13} />
                                Back to Teaching Classes
                            </button>

                            <div className="rounded-lg border border-emerald-200 bg-white p-3">
                                <p className="text-sm font-semibold text-slate-900">
                                    {selectedTeachingClass.section_label ||
                                        selectedTeachingClass.section_name ||
                                        "Teaching Class"}
                                </p>
                                <p className="mt-1 text-[13px] font-semibold text-emerald-700">
                                    {selectedTeachingClass.subject_name ||
                                        "Unknown Subject"}
                                </p>

                                <div className="mt-3 rounded-md bg-emerald-50 px-4">
                                    <FieldRow
                                        label="Subject code"
                                        value={
                                            selectedTeachingClass.subject_code ||
                                            "-"
                                        }
                                        mono
                                    />
                                    <FieldRow
                                        label="Semester"
                                        value={
                                            selectedTeachingClass.semester
                                                ? toSemesterLabel(
                                                      selectedTeachingClass.semester,
                                                  )
                                                : "-"
                                        }
                                    />
                                    <FieldRow
                                        label="School year"
                                        value={
                                            selectedTeachingClass.school_year ||
                                            "-"
                                        }
                                    />
                                    <FieldRow
                                        label="Grade level"
                                        value={
                                            selectedTeachingClass.grade_level
                                                ? `Grade ${selectedTeachingClass.grade_level}`
                                                : "-"
                                        }
                                    />
                                    <FieldRow
                                        label="Strand / Track"
                                        value={
                                            [
                                                selectedTeachingClass.strand,
                                                selectedTeachingClass.track,
                                            ]
                                                .filter(Boolean)
                                                .join(" / ") || "-"
                                        }
                                    />
                                    <FieldRow
                                        label="Students"
                                        value={asNumber(
                                            selectedTeachingClass.students_count,
                                            0,
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : teachingClassesFiltered.length === 0 ? (
                        <EmptyCard message="No teaching classes found for the selected semester." />
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <SummaryCard
                                    label="Teaching classes"
                                    value={teachingClassesFiltered.length}
                                />
                                <SummaryCard
                                    label="Students"
                                    value={teachingClassesFiltered.reduce(
                                        (sum, entry) =>
                                            sum +
                                            asNumber(entry.students_count, 0),
                                        0,
                                    )}
                                />
                                <SummaryCard
                                    label="Semester filter"
                                    value={
                                        userSemesterFilter === "all"
                                            ? "All"
                                            : toSemesterLabel(
                                                  userSemesterFilter,
                                              )
                                    }
                                    muted
                                />
                            </div>

                            {teachingClassesFiltered.map((entry) => (
                                <button
                                    key={`teaching-${entry.id || entry.subject_id || entry.section_id}`}
                                    type="button"
                                    onClick={() =>
                                        setSelectedUserClassDetail({
                                            source: "teaching",
                                            item: entry,
                                        })
                                    }
                                    className="w-full rounded-lg border border-emerald-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    <p className="text-sm font-semibold text-slate-900">
                                        {entry.section_label ||
                                            entry.section_name ||
                                            "Section"}
                                    </p>
                                    <p className="mt-1 text-[13px] font-semibold text-emerald-700">
                                        {entry.subject_name ||
                                            "Unknown Subject"}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {entry.subject_code ||
                                            "No subject code"}
                                        {entry.semester
                                            ? ` • ${toSemesterLabel(entry.semester)}`
                                            : ""}
                                        {` • ${asNumber(entry.students_count, 0)} students`}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            );

            const studentSectionPanel = studentSection ? (
                <div className="space-y-3">
                    <div className="rounded-lg border border-emerald-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">
                            {studentSection.section_label ||
                                studentSection.section_name ||
                                "Student Section"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            {studentSection.section_code || "No section code"}
                            {studentSection.school_year
                                ? ` • ${studentSection.school_year}`
                                : ""}
                        </p>

                        <div className="mt-3 rounded-md bg-emerald-50 px-4">
                            <FieldRow
                                label="Grade level"
                                value={
                                    studentSection.grade_level
                                        ? `Grade ${studentSection.grade_level}`
                                        : "-"
                                }
                            />
                            <FieldRow
                                label="Strand"
                                value={studentSection.strand || "-"}
                            />
                            <FieldRow
                                label="Track"
                                value={studentSection.track || "-"}
                            />
                            <FieldRow
                                label="LRN"
                                value={studentSection.lrn || "-"}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <SummaryCard
                            label="Classes"
                            value={studentClasses.length}
                        />
                        <SummaryCard
                            label="Semester"
                            value={
                                currentSemesterValue
                                    ? toSemesterLabel(currentSemesterValue)
                                    : "N/A"
                            }
                        />
                        <SummaryCard label="Status" value="Enrolled" muted />
                    </div>
                </div>
            ) : (
                <EmptyCard message="This student is not assigned to a section yet." />
            );

            const studentClassesPanel = (
                <div className="space-y-3">
                    {semesterFilterToggle}

                    {selectedStudentClass ? (
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedUserClassDetail(null);
                                    setUserQuarterFilter("midterm");
                                }}
                                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                            >
                                <ArrowLeft size={13} />
                                Back to Class Banners
                            </button>

                            <div className="rounded-lg border border-emerald-200 bg-white p-3">
                                <p className="text-sm font-semibold text-slate-900">
                                    {selectedStudentClass.section_label ||
                                        selectedStudentClass.section_name ||
                                        "Section"}
                                </p>
                                <p className="mt-1 text-[13px] font-semibold text-emerald-700">
                                    {selectedStudentClass.subject_name ||
                                        "Unknown Subject"}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    {selectedStudentClass.subject_code ||
                                        "No subject code"}
                                    {selectedStudentClass.semester
                                        ? ` • ${toSemesterLabel(selectedStudentClass.semester)}`
                                        : ""}
                                    {selectedStudentClass.teacher_name
                                        ? ` • ${selectedStudentClass.teacher_name}`
                                        : ""}
                                </p>
                            </div>

                            <div className="rounded-lg border border-emerald-200 bg-white p-1">
                                <div className="grid w-full grid-cols-2 gap-1">
                                    {[
                                        {
                                            value: "midterm",
                                            label: "Midterm Quarter",
                                        },
                                        {
                                            value: "final",
                                            label: "Final Quarter",
                                        },
                                    ].map((quarterOption) => {
                                        const active =
                                            userQuarterFilter ===
                                            quarterOption.value;

                                        return (
                                            <button
                                                key={quarterOption.value}
                                                type="button"
                                                onClick={() =>
                                                    setUserQuarterFilter(
                                                        quarterOption.value,
                                                    )
                                                }
                                                className={`w-full rounded-md px-3 py-2 text-[11px] font-semibold transition ${
                                                    active
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                }`}
                                            >
                                                {quarterOption.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {(() => {
                                const selectedQuarterGrade =
                                    userQuarterFilter === "final"
                                        ? selectedStudentClass.final_quarter_grade
                                        : selectedStudentClass.midterm_grade;

                                const hasQuarterGrade =
                                    selectedQuarterGrade !== null &&
                                    selectedQuarterGrade !== undefined;

                                const standingLabel = hasQuarterGrade
                                    ? asNumber(selectedQuarterGrade, 0) >= 75
                                        ? "Passing"
                                        : "At Risk"
                                    : "No standing yet";

                                const tone = gradeTone(
                                    hasQuarterGrade
                                        ? asNumber(selectedQuarterGrade, 0)
                                        : 0,
                                );

                                return (
                                    <div className="space-y-3">
                                        <div className="rounded-lg border border-emerald-200 bg-white p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                                {userQuarterFilter === "final"
                                                    ? "Final Quarter Performance"
                                                    : "Midterm Quarter Performance"}
                                            </p>

                                            {hasQuarterGrade ? (
                                                <div className="mt-2 flex items-center justify-between gap-3">
                                                    <p className="text-2xl font-semibold text-emerald-900">
                                                        {selectedQuarterGrade}
                                                    </p>
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.pill}`}
                                                    >
                                                        {standingLabel}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="mt-2 text-xs text-slate-600">
                                                    No recorded grade yet for
                                                    this quarter.
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-md bg-emerald-50 px-4">
                                            <FieldRow
                                                label="Midterm grade"
                                                value={
                                                    selectedStudentClass.midterm_grade ??
                                                    "-"
                                                }
                                            />
                                            <FieldRow
                                                label="Final quarter grade"
                                                value={
                                                    selectedStudentClass.final_quarter_grade ??
                                                    "-"
                                                }
                                            />
                                            <FieldRow
                                                label="Final grade"
                                                value={
                                                    selectedStudentClass.final_grade ??
                                                    "-"
                                                }
                                            />
                                            <FieldRow
                                                label="Standing"
                                                value={
                                                    selectedStudentClass.remarks ||
                                                    "No standing yet"
                                                }
                                            />
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : userSemesterFilter === "2" && !secondSemesterStarted ? (
                        <EmptyCard message="2nd semester has not started yet for this school year." />
                    ) : studentClasses.length === 0 ? (
                        <EmptyCard message="This student has no classes yet." />
                    ) : studentClassesFiltered.length === 0 ? (
                        <EmptyCard message="No classes found for the selected semester." />
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <SummaryCard
                                    label="Classes"
                                    value={studentClassesFiltered.length}
                                />
                                <SummaryCard
                                    label="Semester filter"
                                    value={
                                        userSemesterFilter === "all"
                                            ? "All"
                                            : toSemesterLabel(
                                                  userSemesterFilter,
                                              )
                                    }
                                />
                                <SummaryCard
                                    label="Current semester"
                                    value={
                                        currentSemesterValue
                                            ? toSemesterLabel(
                                                  currentSemesterValue,
                                              )
                                            : "N/A"
                                    }
                                    muted
                                />
                            </div>

                            {studentClassesFiltered.map((entry) => (
                                <button
                                    key={`student-class-${entry.class_id || entry.enrollment_id}`}
                                    type="button"
                                    onClick={() => {
                                        setSelectedUserClassDetail({
                                            source: "student",
                                            item: entry,
                                        });
                                        setUserQuarterFilter("midterm");
                                    }}
                                    className="w-full rounded-lg border border-emerald-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    <p className="text-sm font-semibold text-slate-900">
                                        {entry.section_label ||
                                            entry.section_name ||
                                            "Section"}
                                    </p>
                                    <p className="mt-1 text-[13px] font-semibold text-emerald-700">
                                        {entry.subject_name ||
                                            "Unknown Subject"}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {entry.subject_code ||
                                            "No subject code"}
                                        {entry.semester
                                            ? ` • ${toSemesterLabel(entry.semester)}`
                                            : ""}
                                        {entry.teacher_name
                                            ? ` • ${entry.teacher_name}`
                                            : ""}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            );

            const rolesPanel =
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
                                Created: {formatDateTime(current.created_at)}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-700">
                                Updated: {formatDateTime(current.updated_at)}
                            </p>
                        </div>
                    </div>
                );

            return {
                identity: {
                    title: userName,
                    subtitle: current.username || current.email || "user",
                    tags: [
                        toLabelRole(prioritizedRole),
                        current.status || null,
                    ].filter(Boolean),
                    keyLabel: "User ID",
                    keyValue: current.user_id || current.id || "-",
                },
                headerTitle: "User information",
                headerSubtitle: hasTeacherRole
                    ? "Teacher assignments and class workload"
                    : hasStudentRole
                      ? "Section placement and class performance standing"
                      : "Profile details and assigned access",
                infoLabel: "Profile",
                secondaryLabel: hasTeacherRole
                    ? "Advisory Class"
                    : hasStudentRole
                      ? "Section"
                      : "Roles",
                secondaryCount: hasTeacherRole
                    ? advisoryClassesFiltered.length
                    : hasStudentRole
                      ? studentSection
                          ? 1
                          : 0
                      : userRoles.length,
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
                                    value={toLabelRole(prioritizedRole)}
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

                        {hasTeacherRole && (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <SummaryCard
                                    label="Advisory"
                                    value={advisoryClassesFiltered.length}
                                />
                                <SummaryCard
                                    label="Teaching"
                                    value={teachingClassesFiltered.length}
                                />
                                <SummaryCard
                                    label="Role count"
                                    value={userRoles.length}
                                    muted
                                />
                            </div>
                        )}

                        {hasStudentRole && (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <SummaryCard
                                    label="Section"
                                    value={
                                        studentSection?.section_code ||
                                        studentSection?.section_name ||
                                        "-"
                                    }
                                />
                                <SummaryCard
                                    label="Classes"
                                    value={studentClasses.length}
                                />
                                <SummaryCard
                                    label="Current semester"
                                    value={
                                        currentSemesterValue
                                            ? toSemesterLabel(
                                                  currentSemesterValue,
                                              )
                                            : "N/A"
                                    }
                                    muted
                                />
                            </div>
                        )}
                    </div>
                ),
                secondaryPanel: hasTeacherRole
                    ? advisoryPanel
                    : hasStudentRole
                      ? studentSectionPanel
                      : rolesPanel,
                isTeacherPriority: hasTeacherRole,
                isStudentPriority: hasStudentRole,
                advisoryCount: advisoryClassesFiltered.length,
                teachingCount: teachingClassesFiltered.length,
                advisoryPanel,
                teachingPanel,
                studentSectionPanel,
                studentClassesPanel,
                studentClassesCount: studentClassesFiltered.length,
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
            const subject = activeSubject || payload?.subject || row || {};
            const classCount = asNumber(subject.classes_count, 0);
            const currentClassCount = asNumber(
                subject.current_classes_count,
                0,
            );
            const detailsTitle = subjectEditMode
                ? "Edit subject details"
                : "Subject profile";

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
                headerSubtitle: subjectEditMode
                    ? "Update subject details and classification"
                    : "Catalog details and classification",
                infoLabel: "Subject info",
                secondaryLabel: "Subject info",
                secondaryCount: undefined,
                infoPanel: (
                    <div className="space-y-3">
                        <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                {detailsTitle}
                            </p>
                            {subjectEditMode ? (
                                <div className="rounded-md bg-emerald-50 p-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Subject Name
                                            </p>
                                            <input
                                                type="text"
                                                value={subjectData.subject_name}
                                                onChange={(event) =>
                                                    setSubjectData(
                                                        "subject_name",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="e.g., General Mathematics"
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                            {subjectErrors.subject_name && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {subjectErrors.subject_name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Subject Code
                                            </p>
                                            <input
                                                type="text"
                                                value={subjectData.subject_code}
                                                onChange={(event) =>
                                                    setSubjectData(
                                                        "subject_code",
                                                        event.target.value.toUpperCase(),
                                                    )
                                                }
                                                placeholder="e.g., GENMATH"
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 font-mono text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                            {subjectErrors.subject_code && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {subjectErrors.subject_code}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Total Hours
                                            </p>
                                            <input
                                                type="number"
                                                min="1"
                                                value={subjectData.total_hours}
                                                onChange={(event) =>
                                                    setSubjectData(
                                                        "total_hours",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="e.g., 160"
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                            {subjectErrors.total_hours && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {subjectErrors.total_hours}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Semester
                                            </p>
                                            <select
                                                value={subjectData.semester}
                                                onChange={(event) =>
                                                    setSubjectData(
                                                        "semester",
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            >
                                                <option value="">
                                                    Select semester
                                                </option>
                                                {resolvedSubjectSemesterOptions.map(
                                                    (semesterOption) => (
                                                        <option
                                                            key={semesterOption}
                                                            value={
                                                                semesterOption
                                                            }
                                                        >
                                                            {toSemesterLabel(
                                                                semesterOption,
                                                            )}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            {subjectErrors.semester && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {subjectErrors.semester}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Grade Level
                                            </p>
                                            <select
                                                value={subjectData.grade_level}
                                                onChange={(event) =>
                                                    setSubjectData(
                                                        "grade_level",
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            >
                                                <option value="">
                                                    Select grade level
                                                </option>
                                                {resolvedSubjectGradeLevelOptions.map(
                                                    (gradeOption) => (
                                                        <option
                                                            key={gradeOption}
                                                            value={gradeOption}
                                                        >
                                                            {gradeOption}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            {subjectErrors.grade_level && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {subjectErrors.grade_level}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Subject Type
                                            </p>
                                            <select
                                                value={subjectData.type_key}
                                                onChange={(event) =>
                                                    setSubjectData(
                                                        "type_key",
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            >
                                                <option value="">
                                                    Select subject type
                                                </option>
                                                {resolvedSubjectTypeOptions.map(
                                                    (option) => (
                                                        <option
                                                            key={option.key}
                                                            value={option.key}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            {subjectErrors.type_key && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {subjectErrors.type_key}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-md bg-emerald-50 px-4">
                                    <FieldRow
                                        label="Subject"
                                        value={
                                            subject.subject_name ||
                                            subject.name ||
                                            "-"
                                        }
                                    />
                                    <FieldRow
                                        label="Code"
                                        value={
                                            subject.subject_code ||
                                            subject.code ||
                                            "-"
                                        }
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
                                                ? toSemesterLabel(
                                                      subject.semester,
                                                  )
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
                                    <FieldRow
                                        label="Classes"
                                        value={classCount}
                                    />
                                    <FieldRow
                                        label="Current semester classes"
                                        value={currentClassCount}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <SummaryCard
                                label="Created"
                                value={formatDateTime(subject.created_at)}
                            />
                            <SummaryCard
                                label="Updated"
                                value={formatDateTime(subject.updated_at)}
                                muted
                            />
                            <SummaryCard
                                label="Current Usage"
                                value={currentClassCount}
                            />
                        </div>
                    </div>
                ),
                secondaryPanel: null,
            };
        }

        if (activeTab === "sections") {
            const section = activeSection || payload?.section || row || {};
            const sectionClasses = Array.isArray(section?.classes)
                ? section.classes
                : Array.isArray(payload?.classes)
                  ? payload.classes
                  : [];
            const departmentName =
                section.department_name || section.department?.department_name;
            const departmentCode =
                section.department_code || section.department?.department_code;
            const sectionStatusLabel = sectionEditMode
                ? sectionData.is_active
                    ? "Active"
                    : "Inactive"
                : section.is_active
                  ? "Active"
                  : "Inactive";

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
                            {sectionEditMode ? (
                                <div className="rounded-md bg-emerald-50 p-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Department
                                            </p>
                                            <select
                                                value={
                                                    sectionData.department_id
                                                }
                                                onChange={(event) => {
                                                    const selectedDepartmentId =
                                                        event.target.value;
                                                    const selectedDepartment =
                                                        resolvedDepartmentOptions.find(
                                                            (option) =>
                                                                String(
                                                                    option.value,
                                                                ) ===
                                                                String(
                                                                    selectedDepartmentId,
                                                                ),
                                                        ) || null;

                                                    setSectionData(
                                                        "department_id",
                                                        selectedDepartmentId,
                                                    );
                                                    setSectionData(
                                                        "advisor_teacher_id",
                                                        "",
                                                    );

                                                    if (
                                                        !sectionData.strand &&
                                                        selectedDepartment?.code
                                                    ) {
                                                        setSectionData(
                                                            "strand",
                                                            selectedDepartment.code,
                                                        );
                                                    }
                                                }}
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            >
                                                <option value="">
                                                    Select department
                                                </option>
                                                {resolvedDepartmentOptions.map(
                                                    (option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.code
                                                                ? `${option.code} - ${option.label}`
                                                                : option.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            {sectionErrors.department_id && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {
                                                        sectionErrors.department_id
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Section Name
                                            </p>
                                            <input
                                                type="text"
                                                value={sectionData.section_name}
                                                onChange={(event) =>
                                                    setSectionData(
                                                        "section_name",
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                            {sectionErrors.section_name && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {sectionErrors.section_name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Adviser Teacher
                                            </p>
                                            <select
                                                value={
                                                    sectionData.advisor_teacher_id
                                                }
                                                onChange={(event) =>
                                                    setSectionData(
                                                        "advisor_teacher_id",
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={
                                                    !sectionData.department_id
                                                }
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-60"
                                            >
                                                <option value="">
                                                    {sectionData.department_id
                                                        ? "Unassigned (N/A)"
                                                        : "Select department first"}
                                                </option>
                                                {sectionAdviserOptions.map(
                                                    (teacher) => (
                                                        <option
                                                            key={teacher.id}
                                                            value={teacher.id}
                                                        >
                                                            {teacher.name ||
                                                                teacher.teacher_name ||
                                                                personName(
                                                                    teacher,
                                                                )}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            {sectionErrors.advisor_teacher_id && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {
                                                        sectionErrors.advisor_teacher_id
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Section Code
                                            </p>
                                            <input
                                                type="text"
                                                value={sectionData.section_code}
                                                onChange={(event) =>
                                                    setSectionData(
                                                        "section_code",
                                                        event.target.value.toUpperCase(),
                                                    )
                                                }
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                            {sectionErrors.section_code && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {sectionErrors.section_code}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Cohort
                                            </p>
                                            <input
                                                type="text"
                                                value={sectionData.cohort}
                                                onChange={(event) =>
                                                    setSectionData(
                                                        "cohort",
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                            {sectionErrors.cohort && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {sectionErrors.cohort}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Grade Level
                                            </p>
                                            <input
                                                type="text"
                                                value={sectionData.grade_level}
                                                onChange={(event) =>
                                                    setSectionData(
                                                        "grade_level",
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                            {sectionErrors.grade_level && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {sectionErrors.grade_level}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Strand
                                            </p>
                                            <input
                                                type="text"
                                                value={sectionData.strand}
                                                onChange={(event) =>
                                                    setSectionData(
                                                        "strand",
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                            {sectionErrors.strand && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {sectionErrors.strand}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Track
                                            </p>
                                            <input
                                                type="text"
                                                value={sectionData.track}
                                                onChange={(event) =>
                                                    setSectionData(
                                                        "track",
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                            {sectionErrors.track && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {sectionErrors.track}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                School Year
                                            </p>
                                            <input
                                                type="text"
                                                value={sectionData.school_year}
                                                onChange={(event) =>
                                                    setSectionData(
                                                        "school_year",
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                            {sectionErrors.school_year && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {sectionErrors.school_year}
                                                </p>
                                            )}
                                        </div>

                                        <div className="sm:col-span-2">
                                            <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                                Description
                                            </p>
                                            <textarea
                                                value={sectionData.description}
                                                onChange={(event) =>
                                                    setSectionData(
                                                        "description",
                                                        event.target.value,
                                                    )
                                                }
                                                rows={3}
                                                className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                            {sectionErrors.description && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {sectionErrors.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        sectionData.is_active
                                                    }
                                                    onChange={(event) =>
                                                        setSectionData(
                                                            "is_active",
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                    className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                Active Section
                                            </label>
                                            {sectionErrors.is_active && (
                                                <p className="mt-1 text-[11px] text-rose-600">
                                                    {sectionErrors.is_active}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
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
                            )}
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
                                value={sectionStatusLabel}
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
                : Array.isArray(classInfo?.students)
                  ? classInfo.students
                  : Array.isArray(row?.students)
                    ? row.students
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
    })();

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
        activeDepartment?.teachers?.forEach(register);
        activeDepartment?.admins?.forEach(register);

        return Array.from(peopleMap.values());
    }, [deptTeachers, activeDepartment]);

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

    const departmentTeacherReassignmentMap = useMemo(
        () => deptData.reassign_teacher_department_ids || {},
        [deptData.reassign_teacher_department_ids],
    );

    const departmentReassignedTeacherIdSet = useMemo(
        () =>
            new Set(
                Object.entries(departmentTeacherReassignmentMap)
                    .filter(([, departmentId]) => Boolean(departmentId))
                    .map(([teacherId]) => String(teacherId)),
            ),
        [departmentTeacherReassignmentMap],
    );

    const departmentAdminOptionTeachers = useMemo(
        () =>
            departmentSelectedTeachers.filter(
                (teacher) =>
                    !departmentReassignedTeacherIdSet.has(String(teacher.id)),
            ),
        [departmentSelectedTeachers, departmentReassignedTeacherIdSet],
    );

    useEffect(() => {
        if (!deptData.admin_id) {
            return;
        }

        const selectedAdmin = departmentSelectedTeachers.find(
            (teacher) => String(teacher.id) === String(deptData.admin_id),
        );

        if (selectedAdmin && isSuperAdminPerson(selectedAdmin)) {
            setDeptData("admin_id", "");
        }
    }, [deptData.admin_id, departmentSelectedTeachers, setDeptData]);

    useEffect(() => {
        if (!deptData.admin_id) {
            return;
        }

        if (departmentReassignedTeacherIdSet.has(String(deptData.admin_id))) {
            setDeptData("admin_id", "");
        }
    }, [deptData.admin_id, departmentReassignedTeacherIdSet, setDeptData]);

    const sourceAdminIdSet = new Set(
        (activeDepartment?.admins || []).map((admin) => String(admin.id)),
    );

    const departmentMembersAdmins = deptEditMode
        ? departmentSelectedAdmin
            ? [departmentSelectedAdmin]
            : []
        : activeDepartment?.admins || [];

    const departmentMembersTeachers = deptEditMode
        ? departmentSelectedTeachers.filter(
              (teacher) => String(teacher.id) !== String(deptData.admin_id),
          )
        : (activeDepartment?.teachers || []).filter(
              (teacher) => !sourceAdminIdSet.has(String(teacher.id)),
          );

    const hasSuperAdminInAdminOptions = departmentAdminOptionTeachers.some(
        (teacher) => isSuperAdminPerson(teacher),
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
        const wasSelected = (deptData.teacher_ids || []).some(
            (id) => String(id) === teacherKey,
        );
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

        if (wasSelected) {
            const nextReassignmentMap = {
                ...(deptData.reassign_teacher_department_ids || {}),
            };

            delete nextReassignmentMap[teacherKey];
            setDeptData("reassign_teacher_department_ids", nextReassignmentMap);
        }
    };

    const demoteDepartmentAdmin = () => {
        setDeptData("admin_id", "");
    };

    const removeDepartmentTeacher = (teacherId) => {
        const teacherKey = String(teacherId);

        setDeptData(
            "teacher_ids",
            (deptData.teacher_ids || []).filter(
                (id) => String(id) !== teacherKey,
            ),
        );

        if (String(deptData.admin_id) === teacherKey) {
            setDeptData("admin_id", "");
        }

        const nextReassignmentMap = {
            ...(deptData.reassign_teacher_department_ids || {}),
        };

        delete nextReassignmentMap[teacherKey];
        setDeptData("reassign_teacher_department_ids", nextReassignmentMap);

        if (String(deptReassignTeacherId) === teacherKey) {
            setDeptReassignTeacherId(null);
            setDeptReassignSearch("");
        }
    };

    const setDepartmentTeacherReassignment = (teacherId, departmentId) => {
        const teacherKey = String(teacherId);

        setDeptData("reassign_teacher_department_ids", {
            ...(deptData.reassign_teacher_department_ids || {}),
            [teacherKey]: String(departmentId),
        });
    };

    const setDeptCreateTeacherField = (field, value) => {
        setDeptCreateTeacher((previous) => ({
            ...previous,
            [field]: value,
        }));

        setDeptCreateTeacherErrors((previous) => {
            if (!previous[field]) {
                return previous;
            }

            const nextErrors = {
                ...previous,
            };

            delete nextErrors[field];

            return nextErrors;
        });
    };

    const handleCreateDepartmentTeacher = async (event) => {
        event.preventDefault();

        const assignPanelEditable = deptEditMode || panel === "assign";

        if (
            !activeDepartment?.id ||
            !assignPanelEditable ||
            deptCreateTeacherSubmitting
        ) {
            return;
        }

        setDeptCreateTeacherSubmitting(true);
        setDeptCreateTeacherErrors({});

        try {
            const response = await axios.post(
                route(
                    "superadmin.departments.teachers.store",
                    activeDepartment.id,
                ),
                deptCreateTeacher,
                {
                    headers: {
                        Accept: "application/json",
                    },
                },
            );
            const createdTeacher = response?.data?.teacher || null;

            if (createdTeacher?.id) {
                setDeptTeachers((previous) => {
                    const byId = new Map(
                        previous.map((teacher) => [
                            String(teacher.id),
                            teacher,
                        ]),
                    );

                    byId.set(String(createdTeacher.id), createdTeacher);

                    return Array.from(byId.values());
                });
                setDeptTeachersLoaded(true);

                const alreadySelected = (deptData.teacher_ids || []).some(
                    (id) => String(id) === String(createdTeacher.id),
                );

                if (!alreadySelected) {
                    setDeptData("teacher_ids", [
                        ...(deptData.teacher_ids || []),
                        createdTeacher.id,
                    ]);
                }

                setDeptAssignMode("assign");
                setDeptTeacherSearch("");
                setDeptTeachersLoaded(false);
                onDepartmentSaved?.(activeDepartment.id);
            }

            setDeptCreateTeacher({
                first_name: "",
                middle_name: "",
                last_name: "",
                email: "",
            });
        } catch (requestError) {
            const status = requestError?.response?.status;
            const responsePayload = requestError?.response?.data || {};

            if (status === 422) {
                const validationErrors = responsePayload?.errors || {};

                setDeptCreateTeacherErrors(
                    Object.fromEntries(
                        Object.entries(validationErrors).map(
                            ([field, messages]) => [
                                field,
                                Array.isArray(messages)
                                    ? messages[0]
                                    : messages,
                            ],
                        ),
                    ),
                );

                return;
            }

            if (status === 419) {
                setDeptCreateTeacherErrors({
                    _form: "Your session has expired. Please refresh the page and try again.",
                });

                return;
            }

            setDeptCreateTeacherErrors({
                _form:
                    responsePayload?.message ||
                    "Unable to create teacher. Please try again.",
            });
        } finally {
            setDeptCreateTeacherSubmitting(false);
        }
    };

    const exitDepartmentEditMode = () => {
        if (!activeDepartment) {
            setDeptEditMode(false);
            return;
        }

        hydrateDepartmentForm(activeDepartment);
        clearDepartmentErrors();
        setDeptEditMode(false);
        setDeptReassignTeacherId(null);
        setDeptReassignSearch("");
    };

    const handleDepartmentSave = () => {
        const isCreate = isDepartmentCreateMode || !activeDepartment?.id;
        const endpoint = isCreate
            ? route("superadmin.departments.store")
            : route("superadmin.departments.update", activeDepartment.id);

        const submit = isCreate ? postDepartment : putDepartment;

        submit(endpoint, {
            preserveScroll: true,
            onSuccess: () => {
                const trackLabel =
                    resolvedTrackOptions.find(
                        (option) =>
                            String(option.value) ===
                            String(deptData.school_track_id),
                    )?.label ||
                    activeDepartment?.track ||
                    "";

                const reassignedTeacherIdSet = new Set(
                    Object.entries(
                        deptData.reassign_teacher_department_ids || {},
                    )
                        .filter(([, departmentId]) => Boolean(departmentId))
                        .map(([teacherId]) => String(teacherId)),
                );

                const selectedTeachersSnapshot = departmentSelectedTeachers
                    .filter(
                        (teacher) =>
                            !reassignedTeacherIdSet.has(String(teacher.id)),
                    )
                    .map((teacher) => ({
                        ...teacher,
                        roles: normalizePersonRoles(teacher?.roles),
                        is_superadmin: isSuperAdminPerson(teacher),
                    }));

                const selectedAdminSnapshot =
                    departmentSelectedAdmin &&
                    !reassignedTeacherIdSet.has(
                        String(departmentSelectedAdmin.id),
                    ) &&
                    !isSuperAdminPerson(departmentSelectedAdmin)
                        ? {
                              ...departmentSelectedAdmin,
                              roles: normalizePersonRoles(
                                  departmentSelectedAdmin?.roles,
                              ),
                              is_superadmin: isSuperAdminPerson(
                                  departmentSelectedAdmin,
                              ),
                          }
                        : null;

                setDeptPersistedDepartment((previous) => ({
                    ...(previous || activeDepartment || {}),
                    name: deptData.department_name || "",
                    code: deptData.department_code || "",
                    track: trackLabel,
                    school_track_id:
                        deptData.school_track_id ||
                        previous?.school_track_id ||
                        activeDepartment?.school_track_id ||
                        null,
                    description: deptData.description || "",
                    is_active: Boolean(deptData.is_active),
                    specializations: [...(deptData.specialization_names || [])],
                    students_count:
                        previous?.students_count ||
                        activeDepartment?.students_count ||
                        0,
                    admins: selectedAdminSnapshot
                        ? [selectedAdminSnapshot]
                        : [],
                    teachers: selectedTeachersSnapshot,
                    admins_count: selectedAdminSnapshot ? 1 : 0,
                    teachers_count: selectedTeachersSnapshot.filter(
                        (teacher) =>
                            String(teacher.id) !==
                            String(selectedAdminSnapshot?.id || ""),
                    ).length,
                }));

                setDeptEditMode(false);
                setDeptReassignTeacherId(null);
                setDeptReassignSearch("");
                setDeptTeachersLoaded(false);
                onDepartmentSaved?.(activeDepartment?.id);
            },
        });
    };

    const departmentDeleteBlockedReason = useMemo(() => {
        if (
            !isDepartmentTab ||
            !activeDepartment?.id ||
            isDepartmentCreateMode
        ) {
            return "";
        }

        const adminCount = asNumber(
            activeDepartment?.admins_count,
            Array.isArray(activeDepartment?.admins)
                ? activeDepartment.admins.length
                : 0,
        );
        const teacherCount = asNumber(
            activeDepartment?.teachers_count,
            Array.isArray(activeDepartment?.teachers)
                ? activeDepartment.teachers.length
                : 0,
        );

        if (adminCount > 0 || teacherCount > 0) {
            return "Cannot delete department with assigned admins or teachers.";
        }

        return "";
    }, [isDepartmentTab, activeDepartment, isDepartmentCreateMode]);

    const openDepartmentDeleteModal = () => {
        if (
            !isDepartmentTab ||
            !activeDepartment?.id ||
            isDepartmentCreateMode ||
            departmentDeleting
        ) {
            return;
        }

        if (departmentDeleteBlockedReason) {
            return;
        }

        setDepartmentDeleteError("");
        setShowDepartmentDeleteModal(true);
    };

    const closeDepartmentDeleteModal = () => {
        if (departmentDeleting) {
            return;
        }

        setShowDepartmentDeleteModal(false);
        setDepartmentDeleteError("");
    };

    const confirmDepartmentDelete = () => {
        if (
            !isDepartmentTab ||
            !activeDepartment?.id ||
            isDepartmentCreateMode ||
            departmentDeleting
        ) {
            return;
        }

        setDepartmentDeleteError("");
        setDepartmentDeleting(true);

        router.delete(
            route("superadmin.departments.destroy", activeDepartment.id),
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const flashError = page?.props?.flash?.error;

                    if (flashError) {
                        setDepartmentDeleteError(flashError);
                        return;
                    }

                    setShowDepartmentDeleteModal(false);
                    setDepartmentDeleteError("");
                    onDepartmentDeleted?.(activeDepartment.id);
                    onClose?.();
                },
                onError: () => {
                    setDepartmentDeleteError(
                        "Unable to delete department right now. Please try again.",
                    );
                },
                onFinish: () => {
                    setDepartmentDeleting(false);
                },
            },
        );
    };

    const exitSubjectEditMode = () => {
        if (!activeSubject) {
            setSubjectEditMode(false);
            return;
        }

        hydrateSubjectForm(activeSubject);
        clearSubjectErrors();
        setSubjectEditMode(false);
    };

    const handleSubjectSave = () => {
        if (!activeSubject?.id) {
            return;
        }

        putSubject(route("superadmin.subjects.update", activeSubject.id), {
            preserveScroll: true,
            onSuccess: () => {
                const selectedType = resolvedSubjectTypeOptions.find(
                    (option) =>
                        String(option.key) === String(subjectData.type_key),
                );
                const nextSubject = {
                    ...(activeSubject || {}),
                    subject_name: subjectData.subject_name || "",
                    subject_code: subjectData.subject_code || "",
                    total_hours:
                        subjectData.total_hours === null ||
                        subjectData.total_hours === undefined
                            ? ""
                            : String(subjectData.total_hours),
                    subject_type_key: subjectData.type_key || "",
                    subject_type_name:
                        selectedType?.label || activeSubject.subject_type_name,
                    semester: subjectData.semester || "",
                    grade_level: subjectData.grade_level || "",
                    updated_at: new Date().toISOString(),
                };

                setSubjectPersistedData(nextSubject);
                setSubjectEditMode(false);
                onSubjectSaved?.(nextSubject);
            },
        });
    };

    const handleCopySubject = async () => {
        if (!activeSubject) {
            return;
        }

        const copyPayload = [
            `Subject: ${activeSubject.subject_name || "-"}`,
            `Code: ${activeSubject.subject_code || "-"}`,
            `Type: ${activeSubject.subject_type_name || activeSubject.subject_type_key || "-"}`,
            `Semester: ${activeSubject.semester ? toSemesterLabel(activeSubject.semester) : "-"}`,
            `Grade Level: ${activeSubject.grade_level || "-"}`,
        ].join("\n");

        try {
            if (typeof navigator === "undefined" || !navigator.clipboard) {
                throw new Error("Clipboard unavailable");
            }

            await navigator.clipboard.writeText(copyPayload);
            setSubjectCopyStatus("copied");
            window.setTimeout(() => setSubjectCopyStatus("idle"), 1600);
        } catch {
            setSubjectCopyStatus("error");
            window.setTimeout(() => setSubjectCopyStatus("idle"), 2000);
        }
    };

    const subjectDeleteBlockedReason = useMemo(() => {
        if (!isSubjectTab || !activeSubject?.id) {
            return "";
        }

        if (activeSubject.delete_blocked_reason) {
            return activeSubject.delete_blocked_reason;
        }

        if (
            activeSubject.can_delete === false ||
            asNumber(activeSubject.current_classes_count, 0) > 0
        ) {
            const schoolYear =
                activeSubject.current_school_year || "the current school year";
            const semesterLabel = activeSubject.current_semester
                ? toSemesterLabel(activeSubject.current_semester)
                : "current semester";

            return `Cannot delete subject assigned to classes for ${schoolYear}, ${semesterLabel}.`;
        }

        return "";
    }, [isSubjectTab, activeSubject]);

    const openSubjectDeleteModal = () => {
        if (!isSubjectTab || !activeSubject?.id || subjectDeleting) {
            return;
        }

        if (subjectDeleteBlockedReason) {
            return;
        }

        setSubjectDeleteError("");
        setShowSubjectDeleteModal(true);
    };

    const closeSubjectDeleteModal = () => {
        if (subjectDeleting) {
            return;
        }

        setShowSubjectDeleteModal(false);
        setSubjectDeleteError("");
    };

    const confirmSubjectDelete = () => {
        if (!isSubjectTab || !activeSubject?.id || subjectDeleting) {
            return;
        }

        setSubjectDeleteError("");
        setSubjectDeleting(true);

        router.delete(route("superadmin.subjects.destroy", activeSubject.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                const flashError = page?.props?.flash?.error;

                if (flashError) {
                    setSubjectDeleteError(flashError);
                    return;
                }

                setShowSubjectDeleteModal(false);
                setSubjectDeleteError("");
                onSubjectDeleted?.(activeSubject.id);
                onClose?.();
            },
            onError: () => {
                setSubjectDeleteError(
                    "Unable to delete subject right now. Please try again.",
                );
            },
            onFinish: () => {
                setSubjectDeleting(false);
            },
        });
    };

    const exitSectionEditMode = () => {
        if (!activeSection) {
            setSectionEditMode(false);
            return;
        }

        hydrateSectionForm(activeSection);
        clearSectionErrors();
        setSectionEditMode(false);
    };

    const handleSectionSave = () => {
        if (!activeSection?.id) {
            return;
        }

        putSection(
            route(
                "superadmin.academic-management.sections.update",
                activeSection.id,
            ),
            {
                preserveScroll: true,
                onSuccess: () => {
                    const selectedDepartment = resolvedDepartmentOptions.find(
                        (option) =>
                            String(option.value) ===
                            String(sectionData.department_id),
                    );
                    const selectedAdviser = sectionAdviserOptions.find(
                        (teacher) =>
                            String(teacher.id) ===
                            String(sectionData.advisor_teacher_id),
                    );

                    setSectionPersistedData((previous) => ({
                        ...(previous || activeSection || {}),
                        department_id: sectionData.department_id || null,
                        department_name:
                            selectedDepartment?.label ||
                            activeSection.department_name ||
                            "",
                        department_code:
                            selectedDepartment?.code ||
                            activeSection.department_code ||
                            "",
                        section_name: sectionData.section_name || "",
                        section_full_label: sectionData.section_name || "",
                        section_code: sectionData.section_code || "",
                        cohort: sectionData.cohort || "",
                        grade_level: sectionData.grade_level || "",
                        strand: sectionData.strand || "",
                        track: sectionData.track || "",
                        school_year: sectionData.school_year || "",
                        description: sectionData.description || "",
                        advisor_teacher_id:
                            sectionData.advisor_teacher_id || null,
                        advisor_teacher_name: sectionData.advisor_teacher_id
                            ? selectedAdviser?.name ||
                              selectedAdviser?.teacher_name ||
                              personName(selectedAdviser) ||
                              activeSection.advisor_teacher_name ||
                              "Assigned adviser"
                            : "Not assigned",
                        is_active: Boolean(sectionData.is_active),
                        students_count:
                            previous?.students_count ||
                            activeSection.students_count ||
                            0,
                        classes_count:
                            previous?.classes_count ||
                            activeSection.classes_count ||
                            0,
                        classes:
                            previous?.classes || activeSection.classes || [],
                    }));

                    setSectionEditMode(false);
                    onSectionSaved?.(activeSection.id);
                },
            },
        );
    };

    const retrySectionClassesLoad = () => {
        if (sectionClassesLoading) {
            return;
        }

        setSectionClassesLoaded(false);
        setSectionClassesError("");
    };

    const resetSectionClassQueueComposer = () => {
        setSectionClassDraft({
            subject_id: "",
            teacher_id: "",
            school_year: activeSection?.school_year || currentSchoolYear || "",
            color: "indigo",
        });
        setSectionClassSubjectSearch("");
        setSectionClassTeacherSearch("");
    };

    const removeQueuedSectionClass = (queueId) => {
        setSectionClassQueue((previous) =>
            previous.filter((item) => item.queue_id !== queueId),
        );
        setSectionClassNotice("");
        setSectionClassSaveError("");
    };

    const addSectionClassToQueue = () => {
        setSectionClassNotice("");
        setSectionClassSaveError("");

        if (!activeSection?.id) {
            setSectionClassNotice(
                "Select a valid section before adding class entries.",
            );
            return;
        }

        const matchedSubject = sectionClassSubjectLookup.get(
            sectionClassSubjectSearch,
        );

        if (
            !matchedSubject ||
            String(matchedSubject.id) !== String(sectionClassDraft.subject_id)
        ) {
            setSectionClassNotice(
                "Subject input must exactly match one of the loaded options.",
            );
            return;
        }

        const matchedTeacher = sectionClassTeacherLookup.get(
            sectionClassTeacherSearch,
        );

        if (
            !matchedTeacher ||
            String(matchedTeacher.id) !== String(sectionClassDraft.teacher_id)
        ) {
            setSectionClassNotice(
                "Teacher input must exactly match one of the loaded options.",
            );
            return;
        }

        const schoolYear = normalizeWhitespace(sectionClassDraft.school_year);

        if (!/^\d{4}-\d{4}$/.test(schoolYear)) {
            setSectionClassNotice("School year must be in YYYY-YYYY format.");
            return;
        }

        if (sectionClassDraftDuplicateMessage) {
            setSectionClassNotice(sectionClassDraftDuplicateMessage);
            return;
        }

        const queueItem = {
            queue_id: crypto.randomUUID(),
            section_id: Number(activeSection.id),
            section_name:
                activeSection.section_full_label ||
                activeSection.section_name ||
                "Section",
            section_code: activeSection.section_code || "",
            subject_id: Number(matchedSubject.id),
            subject_name: matchedSubject.subject_name,
            subject_code: matchedSubject.subject_code || "",
            teacher_id: Number(matchedTeacher.id),
            teacher_name: matchedTeacher.name || personName(matchedTeacher),
            school_year: schoolYear,
            color: sectionClassDraft.color || "indigo",
        };

        setSectionClassQueue((previous) => [...previous, queueItem]);
        setSectionClassNotice(
            `Queued: ${queueItem.subject_name} for ${queueItem.section_name}.`,
        );
        resetSectionClassQueueComposer();
    };

    const handleSectionClassesSave = async () => {
        if (!activeSection?.id || sectionClassQueue.length === 0) {
            setSectionClassSaveError(
                "Add at least one class to queue before saving changes.",
            );
            return;
        }

        setSectionClassSaveError("");
        setSectionClassSyncing(true);

        try {
            const payloadQueue = sectionClassQueue.map((item) => ({
                subject_id: item.subject_id,
                teacher_id: item.teacher_id,
                school_year: item.school_year,
                color: item.color,
            }));

            const response = await axios.post(
                route(
                    "superadmin.academic-management.sections.classes.sync",
                    activeSection.id,
                ),
                {
                    class_queue: payloadQueue,
                },
            );

            const list = Array.isArray(response?.data?.classes)
                ? response.data.classes
                : [];
            const responseCount = Number(
                response?.data?.classes_count ?? response?.data?.count,
            );
            const normalizedCount = Number.isFinite(responseCount)
                ? responseCount
                : list.length;

            setSectionClasses(list);
            setSectionClassesLoaded(true);
            setSectionClassQueue([]);
            setSectionClassNotice("");
            resetSectionClassQueueComposer();

            setSectionPersistedData((previous) => ({
                ...(previous || activeSection || {}),
                classes_count: normalizedCount,
                classes: list,
            }));

            onSectionSaved?.(activeSection.id);
        } catch (requestError) {
            const status = requestError?.response?.status;
            const responsePayload = requestError?.response?.data || {};

            if (status === 422) {
                const validationErrors = responsePayload?.errors || {};
                const firstError = Object.values(validationErrors)
                    .flat()
                    .find(Boolean);

                setSectionClassSaveError(
                    firstError ||
                        responsePayload?.message ||
                        "Unable to save queued classes.",
                );
                return;
            }

            setSectionClassSaveError(
                responsePayload?.message || "Unable to save queued classes.",
            );
        } finally {
            setSectionClassSyncing(false);
        }
    };

    const clearSectionStudentAction = (studentId) => {
        const studentKey = String(studentId);

        setSectionStudentActions((previous) => {
            if (!previous?.[studentKey]) {
                return previous;
            }

            const next = { ...previous };
            delete next[studentKey];

            return next;
        });

        setSectionStudentsSaveError("");
    };

    const toggleSectionStudentRemove = (studentId) => {
        const studentKey = String(studentId);

        setSectionStudentActions((previous) => {
            const existing = previous?.[studentKey];

            if (existing?.action === "remove") {
                const next = { ...previous };
                delete next[studentKey];
                return next;
            }

            return {
                ...previous,
                [studentKey]: {
                    action: "remove",
                },
            };
        });

        setSectionStudentReassigningId((current) =>
            current === studentKey ? null : current,
        );
        setSectionStudentsSaveError("");
    };

    const toggleSectionStudentReassign = (studentId) => {
        const studentKey = String(studentId);

        setSectionStudentActions((previous) => {
            const existing = previous?.[studentKey];

            if (existing?.action === "reassign") {
                return previous;
            }

            return {
                ...previous,
                [studentKey]: {
                    action: "reassign",
                    target_section_id: "",
                },
            };
        });

        setSectionStudentReassigningId((current) =>
            current === studentKey ? null : studentKey,
        );
        setSectionStudentSectionSearch("");
        setSectionStudentsSaveError("");
    };

    const selectSectionStudentReassignTarget = (studentId, targetSectionId) => {
        const studentKey = String(studentId);

        setSectionStudentActions((previous) => ({
            ...previous,
            [studentKey]: {
                action: "reassign",
                target_section_id: String(targetSectionId || ""),
            },
        }));

        setSectionStudentReassigningId(null);
        setSectionStudentSectionSearch("");
        setSectionStudentsSaveError("");
    };

    const retrySectionStudentsLoad = () => {
        if (sectionStudentsLoading) {
            return;
        }

        setSectionStudentsLoaded(false);
        setSectionStudentsError("");
    };

    const exitSectionStudentsEditMode = () => {
        setSectionStudentsEditMode(false);
        setSectionStudentActions({});
        setSectionStudentReassigningId(null);
        setSectionStudentSectionSearch("");
        setSectionStudentsSaveError("");
    };

    const handleSectionStudentsSave = async () => {
        if (!activeSection?.id || sectionStudentActionEntries.length === 0) {
            exitSectionStudentsEditMode();
            return;
        }

        if (sectionStudentsHasInvalidActions) {
            setSectionStudentsSaveError(
                "Choose a target section for every student marked for reassignment.",
            );
            return;
        }

        setSectionStudentsSyncing(true);
        setSectionStudentsSaveError("");

        try {
            const response = await axios.post(
                route(
                    "superadmin.academic-management.sections.students.sync",
                    activeSection.id,
                ),
                {
                    actions: sectionStudentActionEntries,
                },
            );

            const list = Array.isArray(response?.data?.students)
                ? response.data.students
                : [];
            const responseCount = Number(
                response?.data?.students_count ?? response?.data?.count,
            );
            const normalizedCount = Number.isFinite(responseCount)
                ? responseCount
                : list.length;

            setSectionStudents(list);
            setSelectedSectionStudentId((currentId) => {
                const keepCurrent = list.some(
                    (student) => String(student.id) === String(currentId || ""),
                );

                if (keepCurrent) {
                    return currentId;
                }

                return list[0]?.id ? String(list[0].id) : null;
            });

            setSectionPersistedData((previous) => ({
                ...(previous || activeSection || {}),
                students_count: normalizedCount,
            }));

            setSectionStudentsLoaded(true);
            setSectionStudentActions({});
            setSectionStudentReassigningId(null);
            setSectionStudentSectionSearch("");
            setSectionStudentsEditMode(false);
            onSectionSaved?.(activeSection.id);
        } catch (requestError) {
            const status = requestError?.response?.status;
            const responsePayload = requestError?.response?.data || {};

            if (status === 422) {
                const validationErrors = responsePayload?.errors || {};
                const firstError = Object.values(validationErrors)
                    .flat()
                    .find(Boolean);

                setSectionStudentsSaveError(
                    firstError ||
                        responsePayload?.message ||
                        "Unable to save section student changes.",
                );

                return;
            }

            setSectionStudentsSaveError(
                responsePayload?.message ||
                    "Unable to save section student changes.",
            );
        } finally {
            setSectionStudentsSyncing(false);
        }
    };

    const renderSectionStudentsPanel = () => {
        if (sectionStudentsLoading) {
            return (
                <div className="rounded-lg border border-emerald-200 bg-white px-4 py-6 text-sm text-emerald-700">
                    Loading section students...
                </div>
            );
        }

        if (sectionStudentsError) {
            return (
                <div className="space-y-3">
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {sectionStudentsError}
                    </div>
                    <button
                        type="button"
                        onClick={retrySectionStudentsLoad}
                        className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        const pendingActionsCount = sectionStudentActionEntries.length;

        return (
            <div className="space-y-3">
                <div className="rounded-md border border-emerald-200 bg-white p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <p className="text-xs font-semibold text-slate-800">
                                Students in this section
                            </p>
                            <p className="text-[11px] text-slate-500">
                                Search students in real time and open a banner
                                to view full details.
                            </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                            {sectionStudentsEditMode
                                ? `${pendingActionsCount} pending`
                                : `${sectionStudentsCount} total`}
                        </span>
                    </div>

                    <div className="relative mt-3">
                        <Search
                            size={14}
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={sectionStudentSearch}
                            onChange={(event) =>
                                setSectionStudentSearch(event.target.value)
                            }
                            placeholder="Search name, username, email, LRN, grade..."
                            className="w-full rounded-md border border-emerald-200 bg-white py-2 pr-3 pl-9 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                        />
                    </div>

                    {sectionStudentsEditMode && (
                        <p className="mt-2 text-[11px] text-slate-500">
                            Mark students for removal or reassignment, then use
                            Save Changes.
                        </p>
                    )}

                    {sectionStudentsSaveError && (
                        <p className="mt-2 text-[11px] text-rose-600">
                            {sectionStudentsSaveError}
                        </p>
                    )}
                </div>

                {sectionStudents.length === 0 ? (
                    <EmptyCard message="No students are currently assigned to this section." />
                ) : (
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                        <div className="space-y-2 rounded-md border border-emerald-200 bg-white p-3">
                            {filteredSectionStudents.length === 0 ? (
                                <p className="py-8 text-center text-xs text-slate-500">
                                    No students match your search.
                                </p>
                            ) : (
                                filteredSectionStudents.map((student) => {
                                    const studentKey = String(student.id);
                                    const actionDetails =
                                        sectionStudentActions[studentKey];
                                    const actionTarget =
                                        actionDetails?.action === "reassign"
                                            ? sectionStudentReassignOptions.find(
                                                  (option) =>
                                                      String(option.value) ===
                                                      String(
                                                          actionDetails.target_section_id ||
                                                              "",
                                                      ),
                                              )
                                            : null;
                                    const isSelected =
                                        String(
                                            selectedSectionStudentId || "",
                                        ) === studentKey;

                                    return (
                                        <div
                                            key={studentKey}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() =>
                                                setSelectedSectionStudentId(
                                                    studentKey,
                                                )
                                            }
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === "Enter" ||
                                                    event.key === " "
                                                ) {
                                                    event.preventDefault();
                                                    setSelectedSectionStudentId(
                                                        studentKey,
                                                    );
                                                }
                                            }}
                                            className={`rounded-md border p-3 text-left transition ${
                                                isSelected
                                                    ? "border-emerald-400 bg-emerald-50"
                                                    : "border-emerald-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-semibold text-slate-900">
                                                        {student.name ||
                                                            "Unnamed student"}
                                                    </p>
                                                    <p className="truncate text-[11px] text-slate-500">
                                                        {student.user_id
                                                            ? `User #${student.user_id}`
                                                            : "No linked user"}
                                                    </p>
                                                    <p className="truncate text-[11px] text-slate-500">
                                                        {student.personal_email ||
                                                            "-"}
                                                    </p>
                                                </div>

                                                {actionDetails?.action ===
                                                "remove" ? (
                                                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                                                        Remove
                                                    </span>
                                                ) : actionDetails?.action ===
                                                  "reassign" ? (
                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                        Reassign
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                                                <span className="rounded bg-slate-100 px-2 py-0.5">
                                                    LRN: {student.lrn || "-"}
                                                </span>
                                                <span className="rounded bg-slate-100 px-2 py-0.5">
                                                    Grade{" "}
                                                    {student.grade_level || "-"}
                                                </span>
                                                {student.strand && (
                                                    <span className="rounded bg-slate-100 px-2 py-0.5">
                                                        {student.strand}
                                                    </span>
                                                )}
                                            </div>

                                            {actionTarget && (
                                                <p className="mt-2 text-[11px] text-amber-700">
                                                    Target:{" "}
                                                    {actionTarget.section_full_label ||
                                                        actionTarget.section_name}
                                                    {actionTarget.section_code
                                                        ? ` (${actionTarget.section_code})`
                                                        : ""}
                                                </p>
                                            )}

                                            {sectionStudentsEditMode && (
                                                <>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();
                                                                toggleSectionStudentRemove(
                                                                    student.id,
                                                                );
                                                            }}
                                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                                                actionDetails?.action ===
                                                                "remove"
                                                                    ? "border-rose-300 bg-rose-100 text-rose-700"
                                                                    : "border-emerald-200 bg-white text-slate-700 hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            <UserMinus
                                                                size={12}
                                                            />
                                                            Remove
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();
                                                                toggleSectionStudentReassign(
                                                                    student.id,
                                                                );
                                                            }}
                                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                                                actionDetails?.action ===
                                                                "reassign"
                                                                    ? "border-amber-300 bg-amber-100 text-amber-700"
                                                                    : "border-emerald-200 bg-white text-slate-700 hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            <ArrowRightLeft
                                                                size={12}
                                                            />
                                                            Reassign
                                                        </button>

                                                        {actionDetails && (
                                                            <button
                                                                type="button"
                                                                onClick={(
                                                                    event,
                                                                ) => {
                                                                    event.stopPropagation();
                                                                    clearSectionStudentAction(
                                                                        student.id,
                                                                    );
                                                                    if (
                                                                        sectionStudentReassigningId ===
                                                                        studentKey
                                                                    ) {
                                                                        setSectionStudentReassigningId(
                                                                            null,
                                                                        );
                                                                        setSectionStudentSectionSearch(
                                                                            "",
                                                                        );
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                                            >
                                                                <X size={12} />
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>

                                                    {sectionStudentReassigningId ===
                                                        studentKey && (
                                                        <div
                                                            className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2"
                                                            onClick={(event) =>
                                                                event.stopPropagation()
                                                            }
                                                        >
                                                            <div className="relative mb-2">
                                                                <Search
                                                                    size={12}
                                                                    className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        sectionStudentSectionSearch
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        setSectionStudentSectionSearch(
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="Filter sections"
                                                                    className="w-full rounded-md border border-emerald-200 bg-white py-1.5 pr-2 pl-8 text-[11px] focus:border-emerald-500 focus:ring-emerald-500"
                                                                />
                                                            </div>

                                                            <div className="max-h-32 space-y-1 overflow-y-auto">
                                                                {filteredSectionStudentReassignOptions.length ===
                                                                0 ? (
                                                                    <p className="px-1 py-2 text-[11px] text-slate-500">
                                                                        No
                                                                        matching
                                                                        sections.
                                                                    </p>
                                                                ) : (
                                                                    filteredSectionStudentReassignOptions.map(
                                                                        (
                                                                            option,
                                                                        ) => {
                                                                            const optionLabel =
                                                                                option.section_full_label ||
                                                                                option.section_name;
                                                                            const optionMeta =
                                                                                [
                                                                                    option.section_code
                                                                                        ? `Code ${option.section_code}`
                                                                                        : null,
                                                                                    option.grade_level
                                                                                        ? `Grade ${option.grade_level}`
                                                                                        : null,
                                                                                    option.department_code ||
                                                                                        null,
                                                                                ]
                                                                                    .filter(
                                                                                        Boolean,
                                                                                    )
                                                                                    .join(
                                                                                        " • ",
                                                                                    );
                                                                            const isOptionSelected =
                                                                                String(
                                                                                    actionDetails?.target_section_id ||
                                                                                        "",
                                                                                ) ===
                                                                                String(
                                                                                    option.value,
                                                                                );

                                                                            return (
                                                                                <button
                                                                                    key={`section-target-${studentKey}-${option.value}`}
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        selectSectionStudentReassignTarget(
                                                                                            student.id,
                                                                                            option.value,
                                                                                        )
                                                                                    }
                                                                                    className={`w-full rounded-md border px-2 py-1.5 text-left transition ${
                                                                                        isOptionSelected
                                                                                            ? "border-amber-300 bg-amber-100"
                                                                                            : "border-emerald-200 bg-white hover:bg-emerald-100"
                                                                                    }`}
                                                                                >
                                                                                    <p className="text-[11px] font-semibold text-slate-800">
                                                                                        {
                                                                                            optionLabel
                                                                                        }
                                                                                    </p>
                                                                                    {optionMeta && (
                                                                                        <p className="text-[10px] text-slate-500">
                                                                                            {
                                                                                                optionMeta
                                                                                            }
                                                                                        </p>
                                                                                    )}
                                                                                </button>
                                                                            );
                                                                        },
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="rounded-md border border-emerald-200 bg-white p-3">
                            {!selectedSectionStudent ? (
                                <p className="py-8 text-center text-xs text-slate-500">
                                    Select a student banner to view details.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {selectedSectionStudent.name ||
                                                "Unnamed student"}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {selectedSectionStudent.user_id
                                                ? `User #${selectedSectionStudent.user_id}`
                                                : "No linked user"}
                                        </p>
                                    </div>

                                    <div className="rounded-md bg-emerald-50 px-4">
                                        <FieldRow
                                            label="LRN"
                                            value={
                                                selectedSectionStudent.lrn ||
                                                "-"
                                            }
                                            mono
                                        />
                                        <FieldRow
                                            label="Email"
                                            value={
                                                selectedSectionStudent.personal_email ||
                                                "-"
                                            }
                                        />
                                        <FieldRow
                                            label="Grade"
                                            value={
                                                selectedSectionStudent.grade_level ||
                                                "-"
                                            }
                                        />
                                        <FieldRow
                                            label="Strand"
                                            value={
                                                selectedSectionStudent.strand ||
                                                "-"
                                            }
                                        />
                                        <FieldRow
                                            label="Track"
                                            value={
                                                selectedSectionStudent.track ||
                                                "-"
                                            }
                                        />
                                        <FieldRow
                                            label="Current section"
                                            value={
                                                selectedSectionStudent.section ||
                                                "-"
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <SummaryCard label="Current" value={sectionStudentsCount} />
                    <SummaryCard
                        label="Pending Actions"
                        value={pendingActionsCount}
                    />
                    <SummaryCard
                        label="Projected Remaining"
                        value={sectionStudentsProjectedCount}
                        muted
                    />
                </div>
            </div>
        );
    };

    const renderSectionClassesPanel = () => {
        if (sectionClassesLoading) {
            return (
                <div className="rounded-lg border border-emerald-200 bg-white px-4 py-6 text-sm text-emerald-700">
                    Loading section classes...
                </div>
            );
        }

        if (sectionClassesError) {
            return (
                <div className="space-y-3">
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {sectionClassesError}
                    </div>
                    <button
                        type="button"
                        onClick={retrySectionClassesLoad}
                        className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                <div className="rounded-md border border-emerald-200 bg-white p-3">
                    <div className="inline-flex w-full overflow-hidden rounded-md border border-emerald-200 bg-emerald-50 p-1">
                        <button
                            type="button"
                            onClick={() => setSectionClassesMode("list")}
                            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition ${
                                sectionClassesMode === "list"
                                    ? "bg-white text-emerald-700 shadow-sm"
                                    : "text-slate-600 hover:bg-white/70"
                            }`}
                        >
                            Classes ({sectionClassesCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSectionClassesMode("add")}
                            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition ${
                                sectionClassesMode === "add"
                                    ? "bg-white text-emerald-700 shadow-sm"
                                    : "text-slate-600 hover:bg-white/70"
                            }`}
                        >
                            Add Class ({sectionClassQueue.length})
                        </button>
                    </div>

                    {sectionClassSaveError && (
                        <p className="mt-2 text-[11px] text-rose-600">
                            {sectionClassSaveError}
                        </p>
                    )}

                    {sectionClassNotice && (
                        <p className="mt-2 text-[11px] text-amber-700">
                            {sectionClassNotice}
                        </p>
                    )}
                </div>

                {sectionClassesMode === "list" ? (
                    sectionClassDisplayItems.length === 0 ? (
                        <EmptyCard message="No class records were provided for this section." />
                    ) : (
                        <div className="space-y-3">
                            {sectionClassDisplayItems.map((entry) => (
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
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {entry.school_year || "-"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="space-y-3">
                        <div className="rounded-md border border-emerald-200 bg-white p-3">
                            <p className="text-xs font-semibold text-slate-800">
                                Add class to queue
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                                Subject and teacher inputs must exactly match
                                the loaded options before queueing.
                            </p>

                            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                                <div>
                                    <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                        Subject
                                    </p>
                                    <input
                                        type="text"
                                        list="section-class-subject-options"
                                        value={sectionClassSubjectSearch}
                                        onChange={(event) => {
                                            const nextValue =
                                                event.target.value;
                                            setSectionClassSubjectSearch(
                                                nextValue,
                                            );

                                            const matchedSubject =
                                                sectionClassSubjectLookup.get(
                                                    nextValue,
                                                ) || null;

                                            setSectionClassDraft(
                                                (previous) => ({
                                                    ...previous,
                                                    subject_id: matchedSubject
                                                        ? String(
                                                              matchedSubject.id,
                                                          )
                                                        : "",
                                                }),
                                            );
                                            setSectionClassNotice("");
                                            setSectionClassSaveError("");
                                        }}
                                        placeholder="Type to search subject"
                                        className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                    <datalist id="section-class-subject-options">
                                        {resolvedSubjectOptions.map(
                                            (subject) => (
                                                <option
                                                    key={`section-class-subject-${subject.id}`}
                                                    value={classSubjectOptionLabel(
                                                        subject,
                                                    )}
                                                />
                                            ),
                                        )}
                                    </datalist>
                                </div>

                                <div>
                                    <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                        Teacher
                                    </p>
                                    <input
                                        type="text"
                                        list="section-class-teacher-options"
                                        value={sectionClassTeacherSearch}
                                        onChange={(event) => {
                                            const nextValue =
                                                event.target.value;
                                            setSectionClassTeacherSearch(
                                                nextValue,
                                            );

                                            const matchedTeacher =
                                                sectionClassTeacherLookup.get(
                                                    nextValue,
                                                ) || null;

                                            setSectionClassDraft(
                                                (previous) => ({
                                                    ...previous,
                                                    teacher_id: matchedTeacher
                                                        ? String(
                                                              matchedTeacher.id,
                                                          )
                                                        : "",
                                                }),
                                            );
                                            setSectionClassNotice("");
                                            setSectionClassSaveError("");
                                        }}
                                        placeholder={
                                            sectionClassTeacherOptions.length >
                                            0
                                                ? "Type to search teacher"
                                                : "No teacher options for section"
                                        }
                                        className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                                        disabled={
                                            sectionClassTeacherOptions.length ===
                                            0
                                        }
                                    />
                                    <datalist id="section-class-teacher-options">
                                        {sectionClassTeacherOptions.map(
                                            (teacher) => (
                                                <option
                                                    key={`section-class-teacher-${teacher.id}`}
                                                    value={classTeacherOptionLabel(
                                                        teacher,
                                                    )}
                                                />
                                            ),
                                        )}
                                    </datalist>
                                </div>

                                <div>
                                    <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                        School Year
                                    </p>
                                    <input
                                        type="text"
                                        value={sectionClassDraft.school_year}
                                        onChange={(event) =>
                                            setSectionClassDraft(
                                                (previous) => ({
                                                    ...previous,
                                                    school_year:
                                                        event.target.value,
                                                }),
                                            )
                                        }
                                        placeholder="e.g., 2026-2027"
                                        className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                                        Color Tag
                                    </p>
                                    <select
                                        value={sectionClassDraft.color}
                                        onChange={(event) =>
                                            setSectionClassDraft(
                                                (previous) => ({
                                                    ...previous,
                                                    color: event.target.value,
                                                }),
                                            )
                                        }
                                        className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                    >
                                        {SECTION_CLASS_COLOR_OPTIONS.map(
                                            (color) => (
                                                <option
                                                    key={`section-class-color-${color}`}
                                                    value={color}
                                                >
                                                    {color
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        color.slice(1)}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                            </div>

                            {sectionClassDraftDuplicateMessage && (
                                <p className="mt-2 text-[11px] text-rose-600">
                                    {sectionClassDraftDuplicateMessage}
                                </p>
                            )}

                            <div className="mt-3 flex justify-end">
                                <button
                                    type="button"
                                    onClick={addSectionClassToQueue}
                                    disabled={!canAddSectionClassToQueue}
                                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <UserPlus size={13} />
                                    Add to Queue
                                </button>
                            </div>
                        </div>

                        <div className="rounded-md border border-emerald-200 bg-white p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-semibold text-slate-800">
                                    Queue Summary
                                </p>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                    {sectionClassQueue.length} queued
                                </span>
                            </div>

                            {sectionClassQueue.length === 0 ? (
                                <p className="rounded-md border border-dashed border-emerald-200 bg-emerald-50 px-3 py-5 text-center text-xs text-slate-500">
                                    Queue is empty. Build an entry and add it to
                                    queue.
                                </p>
                            ) : (
                                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                    {sectionClassQueue.map((item) => (
                                        <div
                                            key={item.queue_id}
                                            className="rounded-md border border-emerald-200 bg-emerald-50 p-3"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-semibold text-slate-900">
                                                        {item.subject_name}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-[11px] text-slate-600">
                                                        {item.subject_code ||
                                                            "-"}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-[11px] text-slate-600">
                                                        {item.teacher_name}
                                                    </p>
                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {item.school_year} •{" "}
                                                        {item.color}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeQueuedSectionClass(
                                                            item.queue_id,
                                                        )
                                                    }
                                                    disabled={
                                                        sectionClassSyncing
                                                    }
                                                    className="rounded-md border border-rose-200 bg-white p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                                                    title="Remove queued class"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <SummaryCard label="Current" value={sectionClassesCount} />
                    <SummaryCard
                        label="Queued"
                        value={sectionClassQueue.length}
                    />
                    <SummaryCard
                        label="After Save"
                        value={sectionClassesCount + sectionClassQueue.length}
                        muted
                    />
                </div>
            </div>
        );
    };

    const renderDepartmentPanel = () => {
        if (!activeDepartment) {
            return (
                <EmptyCard message="Department details are unavailable for this record." />
            );
        }

        if (panel === "specializations") {
            return (
                <div className="space-y-3">
                    <div className="rounded-md border border-emerald-200 bg-white p-3">
                        <p className="mb-2 text-xs text-slate-500">
                            View and manage all strands and specializations for
                            this department.
                        </p>

                        {deptEditMode && (
                            <div className="mb-3 flex gap-2">
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
                                    placeholder="Add strand/specialization"
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
                            <EmptyCard message="No strand/specialization assigned yet." />
                        ) : (
                            <div className="space-y-2">
                                {(deptData.specialization_names || []).map(
                                    (item) => (
                                        <div
                                            key={item}
                                            className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-3 py-2"
                                        >
                                            <p className="text-sm font-semibold text-emerald-900">
                                                {item}
                                            </p>

                                            {deptEditMode && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeDepartmentSpecialization(
                                                            item,
                                                        )
                                                    }
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-300 bg-white text-emerald-700"
                                                >
                                                    <X size={11} />
                                                </button>
                                            )}
                                        </div>
                                    ),
                                )}
                            </div>
                        )}

                        {departmentSpecializationErrors.length > 0 && (
                            <div className="mt-2 space-y-0.5">
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

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <SummaryCard
                            label="Strand/Specialization"
                            value={(deptData.specialization_names || []).length}
                        />
                        <SummaryCard
                            label="Teachers"
                            value={departmentMembersTeachers.length}
                        />
                        <SummaryCard
                            label="Admins"
                            value={departmentMembersAdmins.length}
                            muted
                        />
                    </div>
                </div>
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
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-semibold text-slate-800">
                                                            {personName(admin)}
                                                        </p>
                                                        <p className="truncate text-[11px] text-slate-500">
                                                            {personEmail(admin)}
                                                        </p>
                                                    </div>

                                                    {deptEditMode && (
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                demoteDepartmentAdmin
                                                            }
                                                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-violet-300 bg-violet-50 text-violet-700 transition hover:bg-violet-100"
                                                            title="Demote admin"
                                                        >
                                                            <UserMinus
                                                                size={13}
                                                            />
                                                        </button>
                                                    )}
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
                                            (teacher) => {
                                                const teacherKey = String(
                                                    teacher.id,
                                                );
                                                const reassignedDepartmentId =
                                                    departmentTeacherReassignmentMap[
                                                        teacherKey
                                                    ] || "";
                                                const reassignedDepartment =
                                                    reassignableDepartmentOptions.find(
                                                        (departmentOption) =>
                                                            String(
                                                                departmentOption.value,
                                                            ) ===
                                                            String(
                                                                reassignedDepartmentId,
                                                            ),
                                                    );

                                                return (
                                                    <div
                                                        key={`dept-teacher-${teacher.id}`}
                                                        className="space-y-1.5"
                                                    >
                                                        <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-700">
                                                                {personInitials(
                                                                    teacher,
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
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

                                                                {reassignedDepartment && (
                                                                    <p className="mt-1 text-[11px] font-semibold text-indigo-700">
                                                                        Assign
                                                                        to -&gt;{" "}
                                                                        {
                                                                            reassignedDepartment.label
                                                                        }{" "}
                                                                        (
                                                                        {reassignedDepartment.code ||
                                                                            "-"}
                                                                        )
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {deptEditMode && (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const isOpen =
                                                                                String(
                                                                                    deptReassignTeacherId,
                                                                                ) ===
                                                                                teacherKey;

                                                                            setDeptReassignTeacherId(
                                                                                isOpen
                                                                                    ? null
                                                                                    : teacher.id,
                                                                            );
                                                                            setDeptReassignSearch(
                                                                                "",
                                                                            );
                                                                        }}
                                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-indigo-300 bg-indigo-50 text-indigo-700 transition hover:bg-indigo-100"
                                                                        title="Reassign teacher"
                                                                    >
                                                                        <ArrowRightLeft
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeDepartmentTeacher(
                                                                                teacher.id,
                                                                            )
                                                                        }
                                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-300 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                                                                        title="Unassign teacher"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {deptEditMode &&
                                                            String(
                                                                deptReassignTeacherId,
                                                            ) ===
                                                                teacherKey && (
                                                                <div className="rounded-xl border border-indigo-200 bg-white p-3 shadow-sm">
                                                                    <p className="text-xs font-semibold text-indigo-700">
                                                                        Reassign
                                                                        teacher
                                                                        to
                                                                        another
                                                                        department
                                                                    </p>
                                                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                                                        Select
                                                                        destination
                                                                        department
                                                                        for this
                                                                        teacher.
                                                                    </p>

                                                                    <div className="relative mt-2">
                                                                        <Search
                                                                            size={
                                                                                13
                                                                            }
                                                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={
                                                                                deptReassignSearch
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                setDeptReassignSearch(
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            placeholder="Search department name or code"
                                                                            className="w-full rounded-lg border border-indigo-200 bg-indigo-50 py-2 pl-8 pr-3 text-xs focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                                                        />
                                                                    </div>

                                                                    <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-indigo-100 bg-indigo-50/50 p-2">
                                                                        {filteredReassignDepartmentOptions.length ===
                                                                        0 ? (
                                                                            <p className="px-1 py-1 text-xs text-slate-500">
                                                                                No
                                                                                department
                                                                                matched
                                                                                your
                                                                                search.
                                                                            </p>
                                                                        ) : (
                                                                            filteredReassignDepartmentOptions.map(
                                                                                (
                                                                                    departmentOption,
                                                                                ) => (
                                                                                    <button
                                                                                        key={`${teacher.id}-${departmentOption.value}`}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setDepartmentTeacherReassignment(
                                                                                                teacher.id,
                                                                                                departmentOption.value,
                                                                                            );
                                                                                            setDeptReassignTeacherId(
                                                                                                null,
                                                                                            );
                                                                                            setDeptReassignSearch(
                                                                                                "",
                                                                                            );
                                                                                        }}
                                                                                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition ${
                                                                                            String(
                                                                                                reassignedDepartmentId,
                                                                                            ) ===
                                                                                            String(
                                                                                                departmentOption.value,
                                                                                            )
                                                                                                ? "bg-indigo-100 text-indigo-800"
                                                                                                : "bg-white text-slate-700 hover:bg-indigo-100"
                                                                                        }`}
                                                                                    >
                                                                                        <span className="font-semibold">
                                                                                            {
                                                                                                departmentOption.label
                                                                                            }
                                                                                        </span>
                                                                                        <span className="font-mono text-[10px]">
                                                                                            {
                                                                                                departmentOption.code
                                                                                            }
                                                                                        </span>
                                                                                    </button>
                                                                                ),
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                );
                                            },
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
                    <div className="w-full rounded-md border border-emerald-200 bg-white p-1">
                        <div className="grid grid-cols-2 gap-1">
                            <button
                                type="button"
                                onClick={() => setDeptAssignMode("assign")}
                                className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                                    deptAssignMode === "assign"
                                        ? "bg-emerald-600 text-white"
                                        : "text-slate-600 hover:bg-emerald-50"
                                }`}
                            >
                                Assign Teacher/Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeptAssignMode("create")}
                                className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                                    deptAssignMode === "create"
                                        ? "bg-emerald-600 text-white"
                                        : "text-slate-600 hover:bg-emerald-50"
                                }`}
                            >
                                Create Teacher
                            </button>
                        </div>
                    </div>

                    {deptAssignMode === "assign" ? (
                        <>
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
                                    {departmentFilteredTeachers.map(
                                        (teacher) => {
                                            const teacherKey = String(
                                                teacher.id,
                                            );
                                            const checked = (
                                                deptData.teacher_ids || []
                                            ).some(
                                                (id) =>
                                                    String(id) === teacherKey,
                                            );
                                            const isAdmin =
                                                String(deptData.admin_id) ===
                                                teacherKey;

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
                                                        disabled={
                                                            !(
                                                                deptEditMode ||
                                                                panel ===
                                                                    "assign"
                                                            )
                                                        }
                                                        className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-700">
                                                        {personInitials(
                                                            teacher,
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
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
                                                    {isAdmin && (
                                                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                                            Admin
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        },
                                    )}
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
                                            setDeptData(
                                                "admin_id",
                                                event.target.value,
                                            )
                                        }
                                        disabled={
                                            !(
                                                deptEditMode ||
                                                panel === "assign"
                                            )
                                        }
                                        className="w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-xs focus:border-violet-500 focus:ring-violet-500 disabled:opacity-60"
                                    >
                                        <option value="">- No admin -</option>
                                        {departmentAdminOptionTeachers.map(
                                            (teacher) => {
                                                const disabledOption =
                                                    isSuperAdminPerson(teacher);

                                                return (
                                                    <option
                                                        key={teacher.id}
                                                        value={teacher.id}
                                                        disabled={
                                                            disabledOption
                                                        }
                                                    >
                                                        {personName(teacher)}
                                                        {disabledOption
                                                            ? " (Super Admin)"
                                                            : ""}
                                                    </option>
                                                );
                                            },
                                        )}
                                    </select>

                                    {hasSuperAdminInAdminOptions && (
                                        <p className="mt-2 text-[11px] font-semibold text-rose-600">
                                            superadmin cannot be admin of a
                                            department
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-3 rounded-md border border-emerald-200 bg-white p-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Create Teacher in this Department
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    New teacher accounts created here are
                                    directly assigned to this selected
                                    department and receive temporary credentials
                                    through email.
                                </p>
                            </div>

                            {deptCreateTeacherErrors._form && (
                                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                    {deptCreateTeacherErrors._form}
                                </div>
                            )}

                            <form
                                onSubmit={handleCreateDepartmentTeacher}
                                className="space-y-3"
                            >
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-emerald-700">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={deptCreateTeacher.first_name}
                                            onChange={(event) =>
                                                setDeptCreateTeacherField(
                                                    "first_name",
                                                    event.target.value,
                                                )
                                            }
                                            disabled={
                                                !(
                                                    deptEditMode ||
                                                    panel === "assign"
                                                )
                                            }
                                            className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-60"
                                        />
                                        {deptCreateTeacherErrors.first_name && (
                                            <p className="mt-1 text-[11px] text-rose-600">
                                                {
                                                    deptCreateTeacherErrors.first_name
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-emerald-700">
                                            Middle Name
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                deptCreateTeacher.middle_name
                                            }
                                            onChange={(event) =>
                                                setDeptCreateTeacherField(
                                                    "middle_name",
                                                    event.target.value,
                                                )
                                            }
                                            disabled={
                                                !(
                                                    deptEditMode ||
                                                    panel === "assign"
                                                )
                                            }
                                            className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-60"
                                        />
                                        {deptCreateTeacherErrors.middle_name && (
                                            <p className="mt-1 text-[11px] text-rose-600">
                                                {
                                                    deptCreateTeacherErrors.middle_name
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-emerald-700">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={deptCreateTeacher.last_name}
                                            onChange={(event) =>
                                                setDeptCreateTeacherField(
                                                    "last_name",
                                                    event.target.value,
                                                )
                                            }
                                            disabled={
                                                !(
                                                    deptEditMode ||
                                                    panel === "assign"
                                                )
                                            }
                                            className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-60"
                                        />
                                        {deptCreateTeacherErrors.last_name && (
                                            <p className="mt-1 text-[11px] text-rose-600">
                                                {
                                                    deptCreateTeacherErrors.last_name
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-emerald-700">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={deptCreateTeacher.email}
                                            onChange={(event) =>
                                                setDeptCreateTeacherField(
                                                    "email",
                                                    event.target.value,
                                                )
                                            }
                                            disabled={
                                                !(
                                                    deptEditMode ||
                                                    panel === "assign"
                                                )
                                            }
                                            required
                                            className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-60"
                                        />
                                        {deptCreateTeacherErrors.email && (
                                            <p className="mt-1 text-[11px] text-rose-600">
                                                {deptCreateTeacherErrors.email}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        !(deptEditMode || panel === "assign") ||
                                        deptCreateTeacherSubmitting
                                    }
                                    className="w-full rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {deptCreateTeacherSubmitting
                                        ? "Creating Teacher..."
                                        : "Create Teacher"}
                                </button>
                            </form>
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
                                    {activeDepartment.name || "-"}
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
                                    {activeDepartment.code || "-"}
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
                                    value={deptData.school_track_id}
                                    onChange={(event) =>
                                        setDeptData(
                                            "school_track_id",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    {resolvedTrackOptions.length === 0 && (
                                        <option value="">
                                            No tracks available
                                        </option>
                                    )}
                                    {resolvedTrackOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm font-semibold text-slate-900">
                                    {activeDepartment.track || "-"}
                                </p>
                            )}
                            {departmentErrors.school_track_id && (
                                <p className="mt-1 text-[11px] text-rose-600">
                                    {departmentErrors.school_track_id}
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
                                        activeDepartment.is_active
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-slate-100 text-slate-600"
                                    }`}
                                >
                                    <CheckCircle size={11} />
                                    {activeDepartment.is_active
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
                                {activeDepartment.description ||
                                    "No description"}
                            </p>
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
                        value={activeDepartment.students_count}
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
        <>
            <Modal
                show={show}
                onClose={onClose}
                maxWidth="3xl"
                closeable={!(isDepartmentTab || isSubjectTab)}
            >
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
                                            active={panel === "specializations"}
                                            onClick={() =>
                                                setPanel("specializations")
                                            }
                                            icon={Layers}
                                            label="Strand/Specialization"
                                            count={
                                                (
                                                    deptData.specialization_names ||
                                                    []
                                                ).length
                                            }
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
                                            label="Add/Assign Teacher & Admin"
                                            count={
                                                (deptData.teacher_ids || [])
                                                    .length
                                            }
                                        />
                                    </div>
                                ) : isSectionTab ? (
                                    <div className="space-y-1">
                                        <SidebarButton
                                            active={panel === "info"}
                                            onClick={() => setPanel("info")}
                                            icon={Layers}
                                            label="Section info"
                                        />
                                        <SidebarButton
                                            active={panel === "secondary"}
                                            onClick={() => {
                                                if (sectionEditMode) {
                                                    exitSectionEditMode();
                                                }

                                                setPanel("secondary");
                                            }}
                                            icon={BookOpen}
                                            label="Classes"
                                            count={data.secondaryCount}
                                        />
                                        <SidebarButton
                                            active={panel === "students"}
                                            onClick={() => {
                                                if (sectionEditMode) {
                                                    exitSectionEditMode();
                                                }

                                                setPanel("students");
                                            }}
                                            icon={Users}
                                            label="Students"
                                            count={sectionStudentsCount}
                                        />
                                    </div>
                                ) : isSubjectTab ? (
                                    <div className="space-y-1">
                                        <SidebarButton
                                            active={panel === "info"}
                                            onClick={() => setPanel("info")}
                                            icon={BookOpen}
                                            label={data.infoLabel}
                                        />
                                    </div>
                                ) : activeTab === "users" &&
                                  data.isTeacherPriority ? (
                                    <div className="space-y-1">
                                        <SidebarButton
                                            active={panel === "info"}
                                            onClick={() => {
                                                setSelectedUserClassDetail(
                                                    null,
                                                );
                                                setPanel("info");
                                            }}
                                            icon={User}
                                            label="Profile"
                                        />
                                        <SidebarButton
                                            active={panel === "advisory"}
                                            onClick={() => {
                                                setSelectedUserClassDetail(
                                                    null,
                                                );
                                                setPanel("advisory");
                                            }}
                                            icon={Users}
                                            label="Advisory Class"
                                            count={data.advisoryCount}
                                        />
                                        <SidebarButton
                                            active={panel === "teaching"}
                                            onClick={() => {
                                                setSelectedUserClassDetail(
                                                    null,
                                                );
                                                setPanel("teaching");
                                            }}
                                            icon={BookOpen}
                                            label="Teaching Class"
                                            count={data.teachingCount}
                                        />
                                    </div>
                                ) : activeTab === "users" &&
                                  data.isStudentPriority ? (
                                    <div className="space-y-1">
                                        <SidebarButton
                                            active={panel === "info"}
                                            onClick={() => {
                                                setSelectedUserClassDetail(
                                                    null,
                                                );
                                                setUserQuarterFilter("midterm");
                                                setPanel("info");
                                            }}
                                            icon={User}
                                            label="Student Information"
                                        />
                                        <SidebarButton
                                            active={panel === "section"}
                                            onClick={() => {
                                                setSelectedUserClassDetail(
                                                    null,
                                                );
                                                setUserQuarterFilter("midterm");
                                                setPanel("section");
                                            }}
                                            icon={Layers}
                                            label="Section"
                                            count={
                                                data.secondaryCount ?? undefined
                                            }
                                        />
                                        <SidebarButton
                                            active={panel === "classes"}
                                            onClick={() => {
                                                setSelectedUserClassDetail(
                                                    null,
                                                );
                                                setUserQuarterFilter("midterm");
                                                setPanel("classes");
                                            }}
                                            icon={BookOpen}
                                            label="Classes"
                                            count={data.studentClassesCount}
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
                                            onClick={() =>
                                                setPanel("secondary")
                                            }
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
                                        {(() => {
                                            if (isDepartmentTab) {
                                                return renderDepartmentPanel();
                                            }

                                            if (isSubjectTab) {
                                                return data.infoPanel;
                                            }

                                            if (
                                                activeTab === "users" &&
                                                data.isTeacherPriority
                                            ) {
                                                if (panel === "info") {
                                                    return data.infoPanel;
                                                }

                                                if (panel === "teaching") {
                                                    return data.teachingPanel;
                                                }

                                                return data.advisoryPanel;
                                            }

                                            if (
                                                activeTab === "users" &&
                                                data.isStudentPriority
                                            ) {
                                                if (panel === "info") {
                                                    return data.infoPanel;
                                                }

                                                if (panel === "classes") {
                                                    return data.studentClassesPanel;
                                                }

                                                return data.studentSectionPanel;
                                            }

                                            if (
                                                isSectionTab &&
                                                panel === "students"
                                            ) {
                                                return renderSectionStudentsPanel();
                                            }

                                            if (
                                                isSectionTab &&
                                                panel === "secondary"
                                            ) {
                                                return renderSectionClassesPanel();
                                            }

                                            return panel === "info"
                                                ? data.infoPanel
                                                : data.secondaryPanel;
                                        })()}
                                    </>
                                )}
                            </div>

                            {(isDepartmentTab ||
                                isSectionTab ||
                                isSubjectTab) &&
                                !loading &&
                                !error && (
                                    <div className="pointer-events-none absolute right-5 bottom-5 z-20 flex items-center gap-2">
                                        {isDepartmentTab &&
                                        !(
                                            deptEditMode || panel === "assign"
                                        ) ? (
                                            <>
                                                {!isDepartmentCreateMode &&
                                                    activeDepartment?.id && (
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                openDepartmentDeleteModal
                                                            }
                                                            disabled={
                                                                departmentDeleting ||
                                                                Boolean(
                                                                    departmentDeleteBlockedReason,
                                                                )
                                                            }
                                                            title={
                                                                departmentDeleteBlockedReason ||
                                                                "Delete department"
                                                            }
                                                            className={`pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition ${
                                                                departmentDeleteBlockedReason ||
                                                                departmentDeleting
                                                                    ? "cursor-not-allowed bg-rose-300"
                                                                    : "bg-rose-600 hover:bg-rose-700"
                                                            }`}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDeptEditMode(true);
                                                    }}
                                                    disabled={
                                                        departmentDeleting
                                                    }
                                                    className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    title="Edit department"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            </>
                                        ) : isDepartmentTab ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={
                                                        exitDepartmentEditMode
                                                    }
                                                    disabled={
                                                        departmentSaving ||
                                                        departmentDeleting
                                                    }
                                                    className="pointer-events-auto rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleDepartmentSave
                                                    }
                                                    disabled={
                                                        departmentSaving ||
                                                        departmentDeleting
                                                    }
                                                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60"
                                                >
                                                    <Save size={13} />
                                                    {departmentSaving
                                                        ? "Saving..."
                                                        : "Save Changes"}
                                                </button>
                                            </>
                                        ) : isSubjectTab ? (
                                            !subjectEditMode ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            openSubjectDeleteModal
                                                        }
                                                        disabled={
                                                            subjectDeleting ||
                                                            Boolean(
                                                                subjectDeleteBlockedReason,
                                                            )
                                                        }
                                                        title={
                                                            subjectDeleteBlockedReason ||
                                                            "Delete subject"
                                                        }
                                                        className={`pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition ${
                                                            subjectDeleteBlockedReason ||
                                                            subjectDeleting
                                                                ? "cursor-not-allowed bg-rose-300"
                                                                : "bg-rose-600 hover:bg-rose-700"
                                                        }`}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleCopySubject
                                                        }
                                                        className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-white shadow-lg transition hover:bg-slate-800"
                                                        title={
                                                            subjectCopyStatus ===
                                                            "copied"
                                                                ? "Copied"
                                                                : subjectCopyStatus ===
                                                                    "error"
                                                                  ? "Copy failed"
                                                                  : "Copy subject details"
                                                        }
                                                    >
                                                        {subjectCopyStatus ===
                                                        "copied" ? (
                                                            <Check size={18} />
                                                        ) : (
                                                            <Copy size={18} />
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPanel("info");
                                                            setSubjectEditMode(
                                                                true,
                                                            );
                                                            clearSubjectErrors();
                                                        }}
                                                        disabled={
                                                            subjectDeleting
                                                        }
                                                        className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                        title="Edit subject"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            exitSubjectEditMode
                                                        }
                                                        disabled={
                                                            subjectSaving ||
                                                            subjectDeleting
                                                        }
                                                        className="pointer-events-auto rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleSubjectSave
                                                        }
                                                        disabled={
                                                            subjectSaving ||
                                                            subjectDeleting
                                                        }
                                                        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60"
                                                    >
                                                        <Save size={13} />
                                                        {subjectSaving
                                                            ? "Saving..."
                                                            : "Save Changes"}
                                                    </button>
                                                </>
                                            )
                                        ) : isSectionTab &&
                                          panel === "students" ? (
                                            !sectionStudentsEditMode ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSectionEditMode(
                                                            false,
                                                        );
                                                        setSectionStudentsEditMode(
                                                            true,
                                                        );
                                                        setSectionStudentsSaveError(
                                                            "",
                                                        );
                                                    }}
                                                    disabled={
                                                        sectionStudentsLoading
                                                    }
                                                    className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    title="Edit students"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            exitSectionStudentsEditMode
                                                        }
                                                        disabled={
                                                            sectionStudentsSyncing
                                                        }
                                                        className="pointer-events-auto rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleSectionStudentsSave
                                                        }
                                                        disabled={
                                                            sectionStudentsSyncing ||
                                                            sectionStudentActionEntries.length ===
                                                                0 ||
                                                            sectionStudentsHasInvalidActions
                                                        }
                                                        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <Save size={13} />
                                                        {sectionStudentsSyncing
                                                            ? "Saving..."
                                                            : "Save Changes"}
                                                    </button>
                                                </>
                                            )
                                        ) : isSectionTab &&
                                          panel === "secondary" ? (
                                            sectionClassesMode === "add" ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSectionClassesMode(
                                                                "list",
                                                            );
                                                            setSectionClassQueue(
                                                                [],
                                                            );
                                                            setSectionClassNotice(
                                                                "",
                                                            );
                                                            setSectionClassSaveError(
                                                                "",
                                                            );
                                                            resetSectionClassQueueComposer();
                                                        }}
                                                        disabled={
                                                            sectionClassSyncing
                                                        }
                                                        className="pointer-events-auto rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleSectionClassesSave
                                                        }
                                                        disabled={
                                                            sectionClassSyncing ||
                                                            sectionClassQueue.length ===
                                                                0
                                                        }
                                                        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <Save size={13} />
                                                        {sectionClassSyncing
                                                            ? "Saving..."
                                                            : "Save Changes"}
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSectionClassesMode(
                                                            "add",
                                                        );
                                                        setSectionClassSaveError(
                                                            "",
                                                        );
                                                    }}
                                                    className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
                                                    title="Add classes"
                                                >
                                                    <UserPlus size={18} />
                                                </button>
                                            )
                                        ) : !sectionEditMode ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPanel("info");
                                                    setSectionEditMode(true);
                                                }}
                                                className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
                                                title="Edit section"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={
                                                        exitSectionEditMode
                                                    }
                                                    disabled={sectionSaving}
                                                    className="pointer-events-auto rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSectionSave}
                                                    disabled={sectionSaving}
                                                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60"
                                                >
                                                    <Save size={13} />
                                                    {sectionSaving
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

            <DepartmentDeleteConfirmModal
                show={Boolean(
                    show && isDepartmentTab && showDepartmentDeleteModal,
                )}
                onClose={closeDepartmentDeleteModal}
                onConfirm={confirmDepartmentDelete}
                departmentName={
                    activeDepartment?.name || activeDepartment?.code || ""
                }
                blockedReason={departmentDeleteBlockedReason}
                error={departmentDeleteError}
                deleting={departmentDeleting}
            />

            <SubjectDeleteConfirmModal
                show={Boolean(show && isSubjectTab && showSubjectDeleteModal)}
                onClose={closeSubjectDeleteModal}
                onConfirm={confirmSubjectDelete}
                subjectName={
                    activeSubject?.subject_name ||
                    activeSubject?.subject_code ||
                    ""
                }
                blockedReason={subjectDeleteBlockedReason}
                error={subjectDeleteError}
                deleting={subjectDeleting}
            />
        </>
    );
}

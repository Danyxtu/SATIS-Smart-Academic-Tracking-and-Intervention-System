import { useEffect, useMemo, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    Check,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Info,
    Lock,
    Mail,
    RefreshCw,
    Save,
    Shield,
    Trash2,
    UserPlus,
    Users,
    X,
} from "lucide-react";

const STEP_PROFILE = 1;
const STEP_SECURITY = 2;
const STEP_REVIEW = 3;

const TEACHER_MODE_SINGLE = "single";
const TEACHER_MODE_MULTIPLE = "multiple";

const STUDENT_MODE_SINGLE = "single";
const STUDENT_MODE_MULTIPLE = "multiple";
const STUDENT_MODE_CSV = "csv";

const PASSWORD_MASK = "********";
const STUDENT_USERNAME_FORMAT = /^[a-z]{2}\d{4}\d{5}$/;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEPS = [
    {
        id: STEP_PROFILE,
        label: "Profile",
        icon: Users,
    },
    {
        id: STEP_SECURITY,
        label: "Security",
        icon: Lock,
    },
    {
        id: STEP_REVIEW,
        label: "Review",
        icon: CheckCircle,
    },
];

function WizardStep({ step, currentStep }) {
    const Icon = step.icon;
    const isActive = currentStep === step.id;
    const isDone = currentStep > step.id;

    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : isDone
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-50 text-slate-400"
            }`}
        >
            <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    isDone ? "bg-emerald-600 text-white" : "bg-white"
                }`}
            >
                {isDone ? <Check size={10} /> : step.id}
            </span>
            <Icon size={12} />
            <span>{step.label}</span>
        </div>
    );
}

function Field({ label, icon: Icon, required, optional, error, children }) {
    return (
        <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                {Icon && <Icon size={13} className="text-slate-400" />}
                {label}
                {required && <span className="text-rose-500">*</span>}
                {optional && (
                    <span className="text-xs text-slate-400">(Optional)</span>
                )}
            </label>
            {children}
            {error && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                    <Info size={12} /> {error}
                </p>
            )}
        </div>
    );
}

const getRoleConfig = (role) => {
    if (role === "teacher") {
        return {
            label: "Teacher",
            icon: Shield,
        };
    }

    return {
        label: "Student",
        icon: Shield,
    };
};

function generateRandomPassword(length = 12) {
    const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";

    let generated = "";

    for (let index = 0; index < length; index += 1) {
        generated += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return generated;
}

const normalizeDepartmentSearch = (value = "") =>
    String(value).trim().toLowerCase();

const formatDepartmentOptionLabel = (department) =>
    `${department.department_code} - ${department.department_name}`;

const findDepartmentFromSearch = (departments, value) => {
    const normalized = normalizeDepartmentSearch(value);

    if (!normalized) {
        return null;
    }

    return (
        departments.find((department) => {
            const code = normalizeDepartmentSearch(department.department_code);
            const name = normalizeDepartmentSearch(department.department_name);
            const label = normalizeDepartmentSearch(
                formatDepartmentOptionLabel(department),
            );

            return (
                normalized === code ||
                normalized === name ||
                normalized === label
            );
        }) || null
    );
};

const normalizeUsernameSeed = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const getInitialsPrefix = (firstName = "", lastName = "") => {
    const first = normalizeUsernameSeed(firstName).split(" ")[0] || "";
    const lastTokens = normalizeUsernameSeed(lastName).split(" ").filter(Boolean);
    const last = lastTokens[lastTokens.length - 1] || "";

    const firstInitial = first.slice(0, 1) || "x";
    const lastInitial = last.slice(0, 1) || "x";

    return `${firstInitial}${lastInitial}`;
};

const buildStudentUsername = ({
    firstName,
    lastName,
    year,
    sequence,
}) => {
    const prefix = getInitialsPrefix(firstName, lastName);
    const yearPart = String(year || new Date().getFullYear()).padStart(4, "0").slice(-4);
    const sequencePart = String(Math.max(1, Number(sequence) || 1)).padStart(5, "0");

    return `${prefix}${yearPart}${sequencePart}`;
};

const isValidStudentUsername = (value = "") =>
    STUDENT_USERNAME_FORMAT.test(String(value || ""));

const splitCsvRow = (line = "") => {
    const row = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const next = line[index + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            row.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    row.push(current.trim());
    return row;
};

const normalizeCsvHeader = (value = "") => {
    const normalized = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");

    if (["firstname", "fname", "first"].includes(normalized)) {
        return "first_name";
    }

    if (["lastname", "lname", "last"].includes(normalized)) {
        return "last_name";
    }

    if (["middlename", "mname", "middle"].includes(normalized)) {
        return "middle_name";
    }

    if (["email", "personalemail", "mail"].includes(normalized)) {
        return "email";
    }

    return normalized;
};

const parseStudentCsv = (text = "") => {
    const lines = String(text)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) {
        return {
            rows: [],
            error: "CSV must include a header row and at least one student row.",
        };
    }

    const headers = splitCsvRow(lines[0]).map(normalizeCsvHeader);
    const firstNameIndex = headers.indexOf("first_name");
    const lastNameIndex = headers.indexOf("last_name");
    const middleNameIndex = headers.indexOf("middle_name");
    const emailIndex = headers.indexOf("email");

    if (firstNameIndex === -1 || lastNameIndex === -1) {
        return {
            rows: [],
            error:
                "CSV headers must include first_name and last_name. Optional: middle_name, email.",
        };
    }

    const rows = [];

    for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
        const line = lines[rowIndex];
        const row = splitCsvRow(line);

        const firstName = String(row[firstNameIndex] || "").trim();
        const lastName = String(row[lastNameIndex] || "").trim();
        const middleName =
            middleNameIndex >= 0
                ? String(row[middleNameIndex] || "").trim()
                : "";
        const email =
            emailIndex >= 0 ? String(row[emailIndex] || "").trim().toLowerCase() : "";

        if (!firstName && !lastName && !middleName && !email) {
            continue;
        }

        if (!firstName || !lastName) {
            return {
                rows: [],
                error: `Row ${rowIndex + 1}: first_name and last_name are required.`,
            };
        }

        if (email && !EMAIL_FORMAT.test(email)) {
            return {
                rows: [],
                error: `Row ${rowIndex + 1}: email format is invalid.`,
            };
        }

        rows.push({
            id: `csv-${Date.now()}-${rowIndex}`,
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            email,
            username: "",
        });
    }

    if (rows.length === 0) {
        return {
            rows: [],
            error: "No valid student rows found in CSV.",
        };
    }

    return {
        rows,
        error: null,
    };
};

function emptyTeacherDraft() {
    return {
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        department_search: "",
        department_id: "",
        assign_as_admin: false,
    };
}

function emptyStudentDraft() {
    return {
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
    };
}

const applyStudentQueueUsernames = (queue, firstSequenceNumber, yearNumber) =>
    queue.map((queueItem, index) => ({
        ...queueItem,
        username: buildStudentUsername({
            firstName: queueItem.first_name,
            lastName: queueItem.last_name,
            year: yearNumber,
            sequence: firstSequenceNumber + index,
        }),
    }));

export default function CreateUserModal({
    open,
    onClose,
    departments,
    studentCount = 0,
}) {
    const [step, setStep] = useState(STEP_PROFILE);
    const [teacherMode, setTeacherMode] = useState(TEACHER_MODE_SINGLE);
    const [teacherDraft, setTeacherDraft] = useState(emptyTeacherDraft());
    const [teacherQueue, setTeacherQueue] = useState([]);

    const [studentMode, setStudentMode] = useState(STUDENT_MODE_SINGLE);
    const [studentDraft, setStudentDraft] = useState(emptyStudentDraft());
    const [studentQueue, setStudentQueue] = useState([]);
    const [studentCsvFileName, setStudentCsvFileName] = useState("");

    const [clientErrors, setClientErrors] = useState({});

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
        transform,
    } = useForm({
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        username: "",
        password: "",
        role: "student",
        assign_as_admin: false,
        department_id: "",
        teacher_mode: TEACHER_MODE_SINGLE,
        teacher_queue: [],
        student_mode: STUDENT_MODE_SINGLE,
        student_queue: [],
    });

    const normalizedDepartments = useMemo(
        () => (Array.isArray(departments) ? departments : []),
        [departments],
    );

    const isTeacher = data.role === "teacher";
    const isStudent = data.role === "student";

    const currentYearNumber = useMemo(() => new Date().getFullYear(), []);
    const firstStudentSequenceNumber = useMemo(
        () => Math.max(1, Number(studentCount || 0) + 1),
        [studentCount],
    );

    const selectedDepartment = useMemo(
        () =>
            isTeacher && data.department_id
                ? (normalizedDepartments.find(
                      (department) =>
                          String(department.id) === String(data.department_id),
                  ) ?? null)
                : null,
        [isTeacher, data.department_id, normalizedDepartments],
    );

    const selectedAdmin = selectedDepartment?.department_admin ?? null;
    const selectedAdminName =
        selectedAdmin?.name ??
        [selectedAdmin?.first_name, selectedAdmin?.last_name]
            .filter(Boolean)
            .join(" ");

    const selectedDraftDepartment = useMemo(
        () =>
            normalizedDepartments.find(
                (department) =>
                    String(department.id) === String(teacherDraft.department_id),
            ) || null,
        [normalizedDepartments, teacherDraft.department_id],
    );

    const queueHasAdminForDraftDepartment = useMemo(() => {
        if (!teacherDraft.department_id) {
            return false;
        }

        return teacherQueue.some(
            (queueItem) =>
                String(queueItem.department_id) ===
                    String(teacherDraft.department_id) &&
                Boolean(queueItem.assign_as_admin),
        );
    }, [teacherQueue, teacherDraft.department_id]);

    const teacherQueueValidationErrors = useMemo(
        () =>
            Object.entries(errors || {})
                .filter(
                    ([field]) =>
                        field === "teacher_queue" ||
                        field.startsWith("teacher_queue."),
                )
                .flatMap(([, value]) =>
                    Array.isArray(value) ? value : [value],
                )
                .filter(Boolean),
        [errors],
    );

    const studentQueueValidationErrors = useMemo(
        () =>
            Object.entries(errors || {})
                .filter(
                    ([field]) =>
                        field === "student_queue" ||
                        field.startsWith("student_queue."),
                )
                .flatMap(([, value]) =>
                    Array.isArray(value) ? value : [value],
                )
                .filter(Boolean),
        [errors],
    );

    const serverErrorList = useMemo(() => {
        if (!errors || typeof errors !== "object") {
            return [];
        }

        return Object.values(errors)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean);
    }, [errors]);

    const singleStudentUsernamePreview = useMemo(() => {
        if (!isStudent || studentMode !== STUDENT_MODE_SINGLE) {
            return "";
        }

        return buildStudentUsername({
            firstName: data.first_name,
            lastName: data.last_name,
            year: currentYearNumber,
            sequence: firstStudentSequenceNumber,
        });
    }, [
        isStudent,
        studentMode,
        data.first_name,
        data.last_name,
        currentYearNumber,
        firstStudentSequenceNumber,
    ]);

    const singleStudentUsernameValid = useMemo(
        () =>
            !singleStudentUsernamePreview ||
            isValidStudentUsername(singleStudentUsernamePreview),
        [singleStudentUsernamePreview],
    );

    const modeLabel = useMemo(() => {
        if (isTeacher) {
            return teacherMode === TEACHER_MODE_MULTIPLE
                ? "Add Multiple Teacher"
                : "Add Single Teacher";
        }

        if (studentMode === STUDENT_MODE_MULTIPLE) {
            return "Add Multiple Student";
        }

        if (studentMode === STUDENT_MODE_CSV) {
            return "Add Student via CSV";
        }

        return "Add Single Student";
    }, [isTeacher, teacherMode, studentMode]);

    const showSingleForm = useMemo(() => {
        if (isTeacher) {
            return teacherMode === TEACHER_MODE_SINGLE;
        }

        return studentMode === STUDENT_MODE_SINGLE;
    }, [isTeacher, teacherMode, studentMode]);

    useEffect(() => {
        if (!open) {
            return;
        }

        reset();
        clearErrors();
        setStep(STEP_PROFILE);

        setTeacherMode(TEACHER_MODE_SINGLE);
        setTeacherDraft(emptyTeacherDraft());
        setTeacherQueue([]);

        setStudentMode(STUDENT_MODE_SINGLE);
        setStudentDraft(emptyStudentDraft());
        setStudentQueue([]);
        setStudentCsvFileName("");

        setClientErrors({});

        setData("teacher_mode", TEACHER_MODE_SINGLE);
        setData("teacher_queue", []);
        setData("student_mode", STUDENT_MODE_SINGLE);
        setData("student_queue", []);
        setData("username", "");
        setData("password", generateRandomPassword());
    }, [open, reset, clearErrors, setData]);

    useEffect(() => {
        setData("teacher_mode", teacherMode);
    }, [teacherMode, setData]);

    useEffect(() => {
        setData("student_mode", studentMode);
    }, [studentMode, setData]);

    useEffect(() => {
        setData(
            "teacher_queue",
            teacherQueue.map((queueItem) => ({
                first_name: queueItem.first_name,
                last_name: queueItem.last_name,
                middle_name: queueItem.middle_name || "",
                email: queueItem.email,
                department_id: Number(queueItem.department_id),
                assign_as_admin: Boolean(queueItem.assign_as_admin),
            })),
        );
    }, [teacherQueue, setData]);

    useEffect(() => {
        setData(
            "student_queue",
            studentQueue.map((queueItem) => ({
                first_name: queueItem.first_name,
                last_name: queueItem.last_name,
                middle_name: queueItem.middle_name || "",
                email: queueItem.email || null,
                username: queueItem.username,
            })),
        );
    }, [studentQueue, setData]);

    useEffect(() => {
        if (isStudent && studentMode === STUDENT_MODE_SINGLE) {
            setData("username", singleStudentUsernamePreview);
            return;
        }

        if (!isStudent) {
            setData("username", "");
        }
    }, [isStudent, studentMode, singleStudentUsernamePreview, setData]);

    useEffect(() => {
        if (!open || !errors || typeof errors !== "object") {
            return;
        }

        const errorKeys = Object.keys(errors);

        if (errorKeys.some((field) => field === "password")) {
            setStep(STEP_SECURITY);
            return;
        }

        if (
            errorKeys.some(
                (field) =>
                    field === "first_name" ||
                    field === "last_name" ||
                    field === "middle_name" ||
                    field === "email" ||
                    field === "username" ||
                    field === "department_id" ||
                    field === "assign_as_admin" ||
                    field === "role" ||
                    field === "teacher_mode" ||
                    field === "student_mode" ||
                    field === "teacher_queue" ||
                    field.startsWith("teacher_queue.") ||
                    field === "student_queue" ||
                    field.startsWith("student_queue."),
            )
        ) {
            setStep(STEP_PROFILE);
        }
    }, [open, errors]);

    const closeModal = () => {
        if (processing) {
            return;
        }

        reset();
        clearErrors();
        setStep(STEP_PROFILE);

        setTeacherMode(TEACHER_MODE_SINGLE);
        setTeacherDraft(emptyTeacherDraft());
        setTeacherQueue([]);

        setStudentMode(STUDENT_MODE_SINGLE);
        setStudentDraft(emptyStudentDraft());
        setStudentQueue([]);
        setStudentCsvFileName("");

        setClientErrors({});
        onClose?.();
    };

    const handleRoleChange = (role) => {
        setData("role", role);
        setClientErrors({});

        if (role === "student") {
            setTeacherMode(TEACHER_MODE_SINGLE);
            setTeacherDraft(emptyTeacherDraft());
            setTeacherQueue([]);
            setData("department_id", "");
            setData("assign_as_admin", false);
            setData("teacher_queue", []);

            setStudentMode(STUDENT_MODE_SINGLE);
            setStudentDraft(emptyStudentDraft());
            setStudentQueue([]);
            setStudentCsvFileName("");
            return;
        }

        setStudentMode(STUDENT_MODE_SINGLE);
        setStudentDraft(emptyStudentDraft());
        setStudentQueue([]);
        setStudentCsvFileName("");
        setData("student_queue", []);
        setData("username", "");

        setTeacherMode(TEACHER_MODE_SINGLE);
        setTeacherDraft(emptyTeacherDraft());
        setTeacherQueue([]);
    };

    const handleTeacherModeChange = (mode) => {
        setTeacherMode(mode);
        setClientErrors({});

        if (mode === TEACHER_MODE_SINGLE) {
            setTeacherDraft(emptyTeacherDraft());
            setTeacherQueue([]);
            setData("teacher_queue", []);
            return;
        }

        setData("assign_as_admin", false);
    };

    const handleStudentModeChange = (mode) => {
        setStudentMode(mode);
        setStudentDraft(emptyStudentDraft());
        setStudentQueue([]);
        setStudentCsvFileName("");
        setData("student_queue", []);
        setClientErrors({});
    };

    const handleTeacherDraftDepartmentSearchChange = (value) => {
        setTeacherDraft((previousDraft) => ({
            ...previousDraft,
            department_search: value,
        }));

        const matchedDepartment = findDepartmentFromSearch(
            normalizedDepartments,
            value,
        );

        if (matchedDepartment) {
            setTeacherDraft((previousDraft) => ({
                ...previousDraft,
                department_search: value,
                department_id: String(matchedDepartment.id),
                assign_as_admin: false,
            }));
            return;
        }

        setTeacherDraft((previousDraft) => ({
            ...previousDraft,
            department_id: "",
            assign_as_admin: false,
        }));
    };

    const validateTeacherDraftForQueue = () => {
        const nextErrors = {};

        const firstName = String(teacherDraft.first_name || "").trim();
        const lastName = String(teacherDraft.last_name || "").trim();
        const middleName = String(teacherDraft.middle_name || "").trim();
        const email = String(teacherDraft.email || "").trim().toLowerCase();
        const departmentId = String(teacherDraft.department_id || "").trim();
        const assignAsAdmin = Boolean(teacherDraft.assign_as_admin);

        if (!firstName) {
            nextErrors.queue_first_name = "First name is required.";
        }

        if (!lastName) {
            nextErrors.queue_last_name = "Last name is required.";
        }

        if (!email) {
            nextErrors.queue_email = "Email address is required.";
        } else if (!EMAIL_FORMAT.test(email)) {
            nextErrors.queue_email = "Enter a valid email address.";
        }

        if (!departmentId) {
            nextErrors.queue_department =
                "Select a department from the suggestions.";
        }

        const duplicateInQueue = teacherQueue.some(
            (queueItem) =>
                String(queueItem.email || "").toLowerCase() === email,
        );

        if (duplicateInQueue) {
            nextErrors.queue_email = "This email already exists in the queue.";
        }

        if (assignAsAdmin && selectedDraftDepartment?.department_admin) {
            nextErrors.queue_assign_as_admin =
                "This department already has an assigned admin.";
        }

        if (assignAsAdmin && queueHasAdminForDraftDepartment) {
            nextErrors.queue_assign_as_admin =
                "Queue already has an assigned admin for this department.";
        }

        setClientErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return null;
        }

        return {
            id: `teacher-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            email,
            department_id: departmentId,
            department_name: selectedDraftDepartment?.department_name || "",
            department_code: selectedDraftDepartment?.department_code || "",
            assign_as_admin: assignAsAdmin,
        };
    };

    const addTeacherToQueue = () => {
        const queuePayload = validateTeacherDraftForQueue();

        if (!queuePayload) {
            return;
        }

        setTeacherQueue((previousQueue) => [...previousQueue, queuePayload]);
        setTeacherDraft(emptyTeacherDraft());
        setClientErrors({});
    };

    const removeQueuedTeacher = (queueId) => {
        setTeacherQueue((previousQueue) =>
            previousQueue.filter((queueItem) => queueItem.id !== queueId),
        );
    };

    const validateStudentDraftForQueue = () => {
        const nextErrors = {};

        const firstName = String(studentDraft.first_name || "").trim();
        const lastName = String(studentDraft.last_name || "").trim();
        const middleName = String(studentDraft.middle_name || "").trim();
        const email = String(studentDraft.email || "").trim().toLowerCase();

        if (!firstName) {
            nextErrors.student_queue_first_name = "First name is required.";
        }

        if (!lastName) {
            nextErrors.student_queue_last_name = "Last name is required.";
        }

        if (email && !EMAIL_FORMAT.test(email)) {
            nextErrors.student_queue_email = "Enter a valid email address.";
        }

        if (email) {
            const duplicateEmail = studentQueue.some(
                (queueItem) =>
                    String(queueItem.email || "").toLowerCase() === email,
            );

            if (duplicateEmail) {
                nextErrors.student_queue_email =
                    "This email already exists in the student queue.";
            }
        }

        setClientErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return null;
        }

        return {
            id: `student-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            email,
            username: "",
        };
    };

    const addStudentToQueue = () => {
        const studentPayload = validateStudentDraftForQueue();

        if (!studentPayload) {
            return;
        }

        const nextQueue = applyStudentQueueUsernames(
            [...studentQueue, studentPayload],
            firstStudentSequenceNumber,
            currentYearNumber,
        );

        setStudentQueue(nextQueue);
        setStudentDraft(emptyStudentDraft());
        setClientErrors({});
    };

    const removeQueuedStudent = (queueId) => {
        const filteredQueue = studentQueue.filter(
            (queueItem) => queueItem.id !== queueId,
        );

        const reAssignedQueue = applyStudentQueueUsernames(
            filteredQueue,
            firstStudentSequenceNumber,
            currentYearNumber,
        );

        setStudentQueue(reAssignedQueue);
    };

    const handleStudentCsvUpload = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const text = await file.text();
        const { rows, error } = parseStudentCsv(text);

        if (error) {
            setStudentQueue([]);
            setStudentCsvFileName(file.name);
            setClientErrors((previousErrors) => ({
                ...previousErrors,
                student_csv: error,
            }));
            return;
        }

        const normalizedQueue = applyStudentQueueUsernames(
            rows,
            firstStudentSequenceNumber,
            currentYearNumber,
        );

        const duplicateEmailSet = new Set();
        const hasDuplicateEmail = normalizedQueue.some((queueItem) => {
            const email = String(queueItem.email || "").trim().toLowerCase();

            if (!email) {
                return false;
            }

            if (duplicateEmailSet.has(email)) {
                return true;
            }

            duplicateEmailSet.add(email);
            return false;
        });

        if (hasDuplicateEmail) {
            setStudentQueue([]);
            setStudentCsvFileName(file.name);
            setClientErrors((previousErrors) => ({
                ...previousErrors,
                student_csv:
                    "CSV has duplicate email addresses. Keep one row per email.",
            }));
            return;
        }

        setStudentQueue(normalizedQueue);
        setStudentCsvFileName(file.name);
        setClientErrors((previousErrors) => {
            const nextErrors = { ...previousErrors };
            delete nextErrors.student_csv;
            return nextErrors;
        });
    };

    const validateProfileStep = () => {
        const nextErrors = {};
        const role = String(data.role || "");

        if (!role) {
            nextErrors.role = "Role is required.";
        }

        if (role === "teacher" && teacherMode === TEACHER_MODE_MULTIPLE) {
            if (teacherQueue.length === 0) {
                nextErrors.teacher_queue =
                    "Add at least one teacher to the queue.";
            }

            setClientErrors(nextErrors);
            return Object.keys(nextErrors).length === 0;
        }

        if (role === "student" && studentMode !== STUDENT_MODE_SINGLE) {
            if (studentQueue.length === 0) {
                nextErrors.student_queue =
                    "Add at least one student in queue before proceeding.";
            }

            if (
                studentQueue.some(
                    (queueItem) => !isValidStudentUsername(queueItem.username),
                )
            ) {
                nextErrors.student_queue =
                    "One or more queued student usernames are invalid.";
            }

            if (studentMode === STUDENT_MODE_CSV && !studentCsvFileName) {
                nextErrors.student_csv = "Please upload a CSV file first.";
            }

            setClientErrors(nextErrors);
            return Object.keys(nextErrors).length === 0;
        }

        if (!String(data.first_name || "").trim()) {
            nextErrors.first_name = "First name is required.";
        }

        if (!String(data.last_name || "").trim()) {
            nextErrors.last_name = "Last name is required.";
        }

        if (role === "teacher") {
            if (!String(data.email || "").trim()) {
                nextErrors.email = "Email address is required.";
            } else if (!EMAIL_FORMAT.test(String(data.email || "").trim())) {
                nextErrors.email = "Enter a valid email address.";
            }

            if (!String(data.department_id || "").trim()) {
                nextErrors.department_id = "Department is required for teachers.";
            }
        }

        if (role === "student" && studentMode === STUDENT_MODE_SINGLE) {
            if (!String(data.email || "").trim()) {
                nextErrors.email =
                    "Email address is required for single student creation.";
            } else if (!EMAIL_FORMAT.test(String(data.email || "").trim())) {
                nextErrors.email = "Enter a valid email address.";
            }

            if (!String(data.username || "").trim()) {
                nextErrors.username = "Username is required.";
            } else if (!isValidStudentUsername(data.username)) {
                nextErrors.username =
                    "Username format must be like dd202300100.";
            }
        }

        setClientErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateSecurityStep = () => {
        const nextErrors = {};

        if (!String(data.password || "").trim()) {
            nextErrors.password = "Password is required.";
        }

        setClientErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const goNext = () => {
        if (step === STEP_PROFILE && !validateProfileStep()) {
            return;
        }

        if (step === STEP_SECURITY && !validateSecurityStep()) {
            return;
        }

        setClientErrors({});
        setStep((previousStep) => Math.min(previousStep + 1, STEP_REVIEW));
    };

    const goBack = () => {
        if (step === STEP_PROFILE) {
            closeModal();
            return;
        }

        setStep((previousStep) => Math.max(previousStep - 1, STEP_PROFILE));
    };

    const handleCreate = () => {
        if (processing) {
            return;
        }

        const profileIsValid = validateProfileStep();
        const securityIsValid = validateSecurityStep();

        if (!profileIsValid) {
            setStep(STEP_PROFILE);
            return;
        }

        if (!securityIsValid) {
            setStep(STEP_SECURITY);
            return;
        }

        let payload;

        if (isTeacher && teacherMode === TEACHER_MODE_MULTIPLE) {
            payload = {
                role: "teacher",
                teacher_mode: TEACHER_MODE_MULTIPLE,
                password: data.password,
                teacher_queue: teacherQueue.map((queueItem) => ({
                    first_name: queueItem.first_name,
                    last_name: queueItem.last_name,
                    middle_name: queueItem.middle_name || "",
                    email: queueItem.email,
                    department_id: Number(queueItem.department_id),
                    assign_as_admin: Boolean(queueItem.assign_as_admin),
                })),
            };
        } else if (isStudent && studentMode !== STUDENT_MODE_SINGLE) {
            payload = {
                role: "student",
                student_mode: studentMode,
                password: data.password,
                student_queue: studentQueue.map((queueItem) => ({
                    first_name: queueItem.first_name,
                    last_name: queueItem.last_name,
                    middle_name: queueItem.middle_name || "",
                    email: queueItem.email || null,
                    username: queueItem.username,
                })),
            };
        } else if (isTeacher) {
            payload = {
                first_name: data.first_name,
                last_name: data.last_name,
                middle_name: data.middle_name,
                email: data.email,
                password: data.password,
                role: "teacher",
                teacher_mode: TEACHER_MODE_SINGLE,
                assign_as_admin: Boolean(data.assign_as_admin),
                department_id: data.department_id || null,
            };
        } else {
            payload = {
                first_name: data.first_name,
                last_name: data.last_name,
                middle_name: data.middle_name,
                email: data.email,
                username: data.username,
                password: data.password,
                role: "student",
                student_mode: STUDENT_MODE_SINGLE,
            };
        }

        transform(() => payload);

        post(route("superadmin.users.store"), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setStep(STEP_PROFILE);

                setTeacherMode(TEACHER_MODE_SINGLE);
                setTeacherDraft(emptyTeacherDraft());
                setTeacherQueue([]);

                setStudentMode(STUDENT_MODE_SINGLE);
                setStudentDraft(emptyStudentDraft());
                setStudentQueue([]);
                setStudentCsvFileName("");

                setClientErrors({});
                onClose?.();
            },
            onFinish: () => {
                transform((currentData) => currentData);
            },
        });
    };

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 pb-10 sm:items-center">
            <div
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                onClick={closeModal}
            />

            <div className="relative flex h-[calc(100vh-6rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
                <div className="relative shrink-0 overflow-hidden border-b border-emerald-100 bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5">
                    <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                    <button
                        type="button"
                        onClick={closeModal}
                        disabled={processing}
                        className="absolute right-3 top-3 rounded-lg p-1.5 text-emerald-100 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-60"
                    >
                        <X size={16} />
                    </button>

                    <div className="relative flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                            <UserPlus size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">
                                Create User Wizard
                            </h2>
                            <p className="text-xs text-emerald-100">
                                Step {step} of {STEPS.length}: {STEPS[step - 1].label}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 border-b border-emerald-100 px-6 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {STEPS.map((wizardStep) => (
                            <WizardStep
                                key={wizardStep.id}
                                step={wizardStep}
                                currentStep={step}
                            />
                        ))}
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-emerald-50/40 px-6 py-5">
                    {step === STEP_PROFILE && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Role <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["teacher", "student"].map((role) => {
                                        const cfg = getRoleConfig(role);
                                        const Icon = cfg.icon;
                                        const active = data.role === role;

                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => handleRoleChange(role)}
                                                className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                                                    active
                                                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                                        active
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-slate-300 text-slate-600"
                                                    }`}
                                                >
                                                    <Icon size={14} />
                                                </span>
                                                {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {isTeacher && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Teacher Add Mode
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleTeacherModeChange(TEACHER_MODE_SINGLE)
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                                                teacherMode === TEACHER_MODE_SINGLE
                                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                            }`}
                                        >
                                            Add Single Teacher
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleTeacherModeChange(TEACHER_MODE_MULTIPLE)
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                                                teacherMode === TEACHER_MODE_MULTIPLE
                                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                            }`}
                                        >
                                            Add Multiple Teacher
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isStudent && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Student Add Mode
                                    </label>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleStudentModeChange(STUDENT_MODE_SINGLE)
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                                                studentMode === STUDENT_MODE_SINGLE
                                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                            }`}
                                        >
                                            Add Single Student
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleStudentModeChange(
                                                    STUDENT_MODE_MULTIPLE,
                                                )
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                                                studentMode === STUDENT_MODE_MULTIPLE
                                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                            }`}
                                        >
                                            Add Multiple Student
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleStudentModeChange(STUDENT_MODE_CSV)
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                                                studentMode === STUDENT_MODE_CSV
                                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                            }`}
                                        >
                                            Add via CSV
                                        </button>
                                    </div>
                                </div>
                            )}

                            {showSingleForm && (
                                <>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <Field
                                            label="First Name"
                                            icon={Shield}
                                            required
                                            error={
                                                errors.first_name ||
                                                clientErrors.first_name
                                            }
                                        >
                                            <input
                                                type="text"
                                                value={data.first_name}
                                                onChange={(event) =>
                                                    setData(
                                                        "first_name",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="e.g., Juan"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                            />
                                        </Field>

                                        <Field
                                            label="Last Name"
                                            icon={Shield}
                                            required
                                            error={
                                                errors.last_name ||
                                                clientErrors.last_name
                                            }
                                        >
                                            <input
                                                type="text"
                                                value={data.last_name}
                                                onChange={(event) =>
                                                    setData(
                                                        "last_name",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="e.g., Dela Cruz"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                            />
                                        </Field>
                                    </div>

                                    <Field
                                        label="Middle Name"
                                        icon={Shield}
                                        optional
                                        error={errors.middle_name}
                                    >
                                        <input
                                            type="text"
                                            value={data.middle_name}
                                            onChange={(event) =>
                                                setData(
                                                    "middle_name",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="e.g., Rivera"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                        />
                                    </Field>

                                    <Field
                                        label="Email Address"
                                        icon={Mail}
                                        required={
                                            isTeacher ||
                                            (isStudent &&
                                                studentMode ===
                                                    STUDENT_MODE_SINGLE)
                                        }
                                        optional={
                                            isStudent &&
                                            studentMode !== STUDENT_MODE_SINGLE
                                        }
                                        error={errors.email || clientErrors.email}
                                    >
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(event) =>
                                                setData("email", event.target.value)
                                            }
                                            placeholder={
                                                isTeacher
                                                    ? "teacher@school.edu"
                                                    : "student@school.edu"
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                        />
                                    </Field>

                                    {isStudent && (
                                        <Field
                                            label="Generated Username"
                                            icon={Users}
                                            required
                                            error={
                                                errors.username ||
                                                clientErrors.username
                                            }
                                        >
                                            <input
                                                type="text"
                                                value={data.username || ""}
                                                readOnly
                                                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-mono text-slate-700"
                                            />
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                Format: initials + year + user
                                                number (example:
                                                dd202300100).
                                            </p>
                                            {!singleStudentUsernameValid && (
                                                <p className="mt-1 text-xs text-rose-600">
                                                    Username format is invalid.
                                                </p>
                                            )}
                                        </Field>
                                    )}

                                    {isTeacher && (
                                        <Field
                                            label="Department"
                                            icon={Shield}
                                            required
                                            error={
                                                errors.department_id ||
                                                clientErrors.department_id
                                            }
                                        >
                                            <select
                                                value={data.department_id}
                                                onChange={(event) => {
                                                    setData(
                                                        "department_id",
                                                        event.target.value,
                                                    );
                                                    setData(
                                                        "assign_as_admin",
                                                        false,
                                                    );
                                                }}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                            >
                                                <option value="">
                                                    Select a department
                                                </option>
                                                {normalizedDepartments.map(
                                                    (department) => (
                                                        <option
                                                            key={department.id}
                                                            value={department.id}
                                                        >
                                                            {
                                                                department.department_name
                                                            }
                                                            {department.department_code
                                                                ? ` (${department.department_code})`
                                                                : ""}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </Field>
                                    )}

                                    {isTeacher && data.department_id && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                Department Admin
                                            </p>

                                            {selectedAdmin ? (
                                                <div className="mt-1.5 space-y-0.5">
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {selectedAdminName ||
                                                            "Assigned admin"}
                                                    </p>
                                                    <p className="text-xs text-slate-600">
                                                        {selectedAdmin.email ||
                                                            "No email provided"}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
                                                    <p className="text-xs text-amber-800">
                                                        No admin is currently
                                                        assigned to the {" "}
                                                        {
                                                            selectedDepartment?.department_name
                                                        } department.
                                                    </p>
                                                    <label className="mt-2 flex cursor-pointer items-start gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(
                                                                data.assign_as_admin,
                                                            )}
                                                            onChange={(event) =>
                                                                setData(
                                                                    "assign_as_admin",
                                                                    event.target
                                                                        .checked,
                                                                )
                                                            }
                                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <span className="text-xs text-amber-900">
                                                            Assign this teacher
                                                            as the admin for
                                                            this department.
                                                        </span>
                                                    </label>
                                                    {errors.assign_as_admin && (
                                                        <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                                                            <Info size={12} />
                                                            {
                                                                errors.assign_as_admin
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {isTeacher &&
                                teacherMode === TEACHER_MODE_MULTIPLE && (
                                    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Queue Teacher
                                        </p>

                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                            <input
                                                type="text"
                                                value={teacherDraft.first_name}
                                                onChange={(event) =>
                                                    setTeacherDraft(
                                                        (previousDraft) => ({
                                                            ...previousDraft,
                                                            first_name:
                                                                event.target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                                placeholder="First name"
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            />

                                            <input
                                                type="text"
                                                value={teacherDraft.last_name}
                                                onChange={(event) =>
                                                    setTeacherDraft(
                                                        (previousDraft) => ({
                                                            ...previousDraft,
                                                            last_name:
                                                                event.target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                                placeholder="Last name"
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            />

                                            <input
                                                type="text"
                                                value={teacherDraft.middle_name}
                                                onChange={(event) =>
                                                    setTeacherDraft(
                                                        (previousDraft) => ({
                                                            ...previousDraft,
                                                            middle_name:
                                                                event.target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                                placeholder="Middle name (optional)"
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            />

                                            <input
                                                type="email"
                                                value={teacherDraft.email}
                                                onChange={(event) =>
                                                    setTeacherDraft(
                                                        (previousDraft) => ({
                                                            ...previousDraft,
                                                            email: event.target
                                                                .value,
                                                        }),
                                                    )
                                                }
                                                placeholder="Email address"
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            />

                                            <div className="md:col-span-2">
                                                <input
                                                    type="text"
                                                    list="teacher-department-options"
                                                    value={
                                                        teacherDraft.department_search
                                                    }
                                                    onChange={(event) =>
                                                        handleTeacherDraftDepartmentSearchChange(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Type to search and select a department"
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                                />
                                                <datalist id="teacher-department-options">
                                                    {normalizedDepartments.map(
                                                        (department) => (
                                                            <option
                                                                key={
                                                                    department.id
                                                                }
                                                                value={formatDepartmentOptionLabel(
                                                                    department,
                                                                )}
                                                            />
                                                        ),
                                                    )}
                                                </datalist>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Assign department by typing
                                                    code or name, then selecting
                                                    from suggestions.
                                                </p>
                                            </div>
                                        </div>

                                        {selectedDraftDepartment && (
                                            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                    Department Admin
                                                </p>
                                                {selectedDraftDepartment.department_admin ? (
                                                    <p className="mt-1 text-xs text-slate-700">
                                                        This department already
                                                        has admin: {" "}
                                                        {selectedDraftDepartment
                                                            .department_admin
                                                            ?.name || "Assigned admin"}
                                                    </p>
                                                ) : queueHasAdminForDraftDepartment ? (
                                                    <p className="mt-1 text-xs text-amber-700">
                                                        Queue already contains
                                                        an assigned admin for
                                                        this department.
                                                    </p>
                                                ) : (
                                                    <label className="mt-1 flex cursor-pointer items-start gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(
                                                                teacherDraft.assign_as_admin,
                                                            )}
                                                            onChange={(event) =>
                                                                setTeacherDraft(
                                                                    (
                                                                        previousDraft,
                                                                    ) => ({
                                                                        ...previousDraft,
                                                                        assign_as_admin:
                                                                            event
                                                                                .target
                                                                                .checked,
                                                                    }),
                                                                )
                                                            }
                                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <span className="text-xs text-slate-700">
                                                            No admin yet. Check
                                                            to assign this
                                                            teacher as admin.
                                                        </span>
                                                    </label>
                                                )}
                                            </div>
                                        )}

                                        {(clientErrors.queue_first_name ||
                                            clientErrors.queue_last_name ||
                                            clientErrors.queue_email ||
                                            clientErrors.queue_department ||
                                            clientErrors.queue_assign_as_admin ||
                                            clientErrors.teacher_queue) && (
                                            <div className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                                                {clientErrors.queue_first_name && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.queue_first_name
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.queue_last_name && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.queue_last_name
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.queue_email && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.queue_email
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.queue_department && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.queue_department
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.queue_assign_as_admin && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.queue_assign_as_admin
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.teacher_queue && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.teacher_queue
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {teacherQueueValidationErrors.length > 0 && (
                                            <div className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                                                {teacherQueueValidationErrors.map(
                                                    (message, index) => (
                                                        <p
                                                            key={`${message}-${index}`}
                                                            className="text-xs text-rose-700"
                                                        >
                                                            {message}
                                                        </p>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={addTeacherToQueue}
                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                                        >
                                            <UserPlus size={13} />
                                            Add Queue
                                        </button>

                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                Teacher Queue ({teacherQueue.length})
                                            </p>
                                            <div className="max-h-48 space-y-2 overflow-y-auto">
                                                {teacherQueue.length === 0 ? (
                                                    <p className="text-xs text-slate-500">
                                                        No queued teachers yet.
                                                    </p>
                                                ) : (
                                                    teacherQueue.map(
                                                        (queueItem) => (
                                                            <div
                                                                key={
                                                                    queueItem.id
                                                                }
                                                                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-semibold text-slate-800">
                                                                        {
                                                                            queueItem.first_name
                                                                        }{" "}
                                                                        {
                                                                            queueItem.last_name
                                                                        }
                                                                    </p>
                                                                    <p className="truncate text-xs text-slate-500">
                                                                        {
                                                                            queueItem.email
                                                                        }
                                                                    </p>
                                                                    <p className="truncate text-[11px] text-slate-500">
                                                                        {
                                                                            queueItem.department_code
                                                                        }{" "}
                                                                        -{" "}
                                                                        {
                                                                            queueItem.department_name
                                                                        }
                                                                        {queueItem.assign_as_admin
                                                                            ? " (Assign as admin)"
                                                                            : ""}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeQueuedTeacher(
                                                                            queueItem.id,
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2
                                                                        size={13}
                                                                    />
                                                                </button>
                                                            </div>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {isStudent &&
                                studentMode !== STUDENT_MODE_SINGLE && (
                                    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            {studentMode === STUDENT_MODE_CSV
                                                ? "Import Students from CSV"
                                                : "Queue Student"}
                                        </p>

                                        {studentMode === STUDENT_MODE_MULTIPLE ? (
                                            <>
                                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                    <input
                                                        type="text"
                                                        value={studentDraft.first_name}
                                                        onChange={(event) =>
                                                            setStudentDraft(
                                                                (
                                                                    previousDraft,
                                                                ) => ({
                                                                    ...previousDraft,
                                                                    first_name:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="First name"
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                                    />

                                                    <input
                                                        type="text"
                                                        value={studentDraft.last_name}
                                                        onChange={(event) =>
                                                            setStudentDraft(
                                                                (
                                                                    previousDraft,
                                                                ) => ({
                                                                    ...previousDraft,
                                                                    last_name:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="Last name"
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                                    />

                                                    <input
                                                        type="text"
                                                        value={
                                                            studentDraft.middle_name
                                                        }
                                                        onChange={(event) =>
                                                            setStudentDraft(
                                                                (
                                                                    previousDraft,
                                                                ) => ({
                                                                    ...previousDraft,
                                                                    middle_name:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="Middle name (optional)"
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                                    />

                                                    <input
                                                        type="email"
                                                        value={studentDraft.email}
                                                        onChange={(event) =>
                                                            setStudentDraft(
                                                                (
                                                                    previousDraft,
                                                                ) => ({
                                                                    ...previousDraft,
                                                                    email: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="Email address (optional)"
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={addStudentToQueue}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                                                >
                                                    <UserPlus size={13} />
                                                    Add Queue
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="rounded-lg border border-slate-200 bg-white p-3">
                                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                        Upload CSV File
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept=".csv,text/csv"
                                                        onChange={handleStudentCsvUpload}
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                                    />
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Required headers:
                                                        first_name, last_name.
                                                        Optional:
                                                        middle_name, email.
                                                    </p>
                                                    {studentCsvFileName && (
                                                        <p className="mt-1 text-xs text-slate-600">
                                                            Selected file: {" "}
                                                            {studentCsvFileName}
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {(clientErrors.student_queue_first_name ||
                                            clientErrors.student_queue_last_name ||
                                            clientErrors.student_queue_email ||
                                            clientErrors.student_queue ||
                                            clientErrors.student_csv) && (
                                            <div className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                                                {clientErrors.student_queue_first_name && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.student_queue_first_name
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.student_queue_last_name && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.student_queue_last_name
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.student_queue_email && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.student_queue_email
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.student_queue && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.student_queue
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.student_csv && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.student_csv
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {studentQueueValidationErrors.length > 0 && (
                                            <div className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                                                {studentQueueValidationErrors.map(
                                                    (message, index) => (
                                                        <p
                                                            key={`${message}-${index}`}
                                                            className="text-xs text-rose-700"
                                                        >
                                                            {message}
                                                        </p>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                Student Queue ({studentQueue.length})
                                            </p>
                                            <div className="max-h-52 space-y-2 overflow-y-auto">
                                                {studentQueue.length === 0 ? (
                                                    <p className="text-xs text-slate-500">
                                                        No queued students yet.
                                                    </p>
                                                ) : (
                                                    studentQueue.map(
                                                        (queueItem) => (
                                                            <div
                                                                key={
                                                                    queueItem.id
                                                                }
                                                                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-semibold text-slate-800">
                                                                        {
                                                                            queueItem.first_name
                                                                        }{" "}
                                                                        {
                                                                            queueItem.last_name
                                                                        }
                                                                    </p>
                                                                    <p className="truncate font-mono text-[11px] text-slate-600">
                                                                        {
                                                                            queueItem.username
                                                                        }
                                                                    </p>
                                                                    <p className="truncate text-xs text-slate-500">
                                                                        {queueItem.email ||
                                                                            "No email"}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeQueuedStudent(
                                                                            queueItem.id,
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2
                                                                        size={13}
                                                                    />
                                                                </button>
                                                            </div>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}

                    {step === STEP_SECURITY && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <Field
                                label="Password"
                                icon={Lock}
                                required
                                error={errors.password || clientErrors.password}
                            >
                                <input
                                    type="password"
                                    value={data.password}
                                    readOnly
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                />
                            </Field>

                            <button
                                type="button"
                                onClick={() =>
                                    setData("password", generateRandomPassword())
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                            >
                                <RefreshCw size={13} />
                                Regenerate Password
                            </button>

                            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                                <Info
                                    size={15}
                                    className="mt-0.5 shrink-0 text-amber-600"
                                />
                                <p className="text-xs leading-relaxed text-amber-800">
                                    <span className="font-semibold">Note:</span>{" "}
                                    The user will be required to change their
                                    password on first login.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === STEP_REVIEW && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Review User Details
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Confirm account details before creating user
                                    records.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Role
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {isTeacher ? "Teacher" : "Student"}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Mode
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {modeLabel}
                                    </p>
                                </div>
                            </div>

                            {isTeacher && teacherMode === TEACHER_MODE_MULTIPLE && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Queued Teachers ({teacherQueue.length})
                                    </p>
                                    {teacherQueue.length === 0 ? (
                                        <p className="text-sm text-slate-500">None</p>
                                    ) : (
                                        <div className="mt-1.5 max-h-44 space-y-1.5 overflow-y-auto">
                                            {teacherQueue.map((queueItem) => (
                                                <p
                                                    key={queueItem.id}
                                                    className="rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-700"
                                                >
                                                    {queueItem.first_name}{" "}
                                                    {queueItem.last_name} - {" "}
                                                    {queueItem.email} - {" "}
                                                    {queueItem.department_code} - {" "}
                                                    {queueItem.department_name}
                                                    {queueItem.assign_as_admin
                                                        ? " (Assign as admin)"
                                                        : ""}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {isStudent && studentMode !== STUDENT_MODE_SINGLE && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Queued Students ({studentQueue.length})
                                    </p>
                                    {studentQueue.length === 0 ? (
                                        <p className="text-sm text-slate-500">None</p>
                                    ) : (
                                        <div className="mt-1.5 max-h-44 space-y-1.5 overflow-y-auto">
                                            {studentQueue.map((queueItem) => (
                                                <p
                                                    key={queueItem.id}
                                                    className="rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-700"
                                                >
                                                    {queueItem.first_name}{" "}
                                                    {queueItem.last_name} - {" "}
                                                    {queueItem.username}
                                                    {queueItem.email
                                                        ? ` - ${queueItem.email}`
                                                        : " - No email"}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {showSingleForm && (
                                <>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                Full Name
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {[
                                                    data.first_name,
                                                    data.middle_name,
                                                    data.last_name,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ") || "-"}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                Email
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                {data.email || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    {isTeacher && (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                Department
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                {selectedDepartment
                                                    ? `${selectedDepartment.department_name}${selectedDepartment.department_code ? ` (${selectedDepartment.department_code})` : ""}`
                                                    : "None"}
                                            </p>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                Admin: {" "}
                                                {selectedAdminName ||
                                                    (data.assign_as_admin
                                                        ? "Assign this teacher as admin"
                                                        : "None")}
                                            </p>
                                        </div>
                                    )}

                                    {isStudent && (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                Username
                                            </p>
                                            <p className="font-mono text-sm text-slate-800">
                                                {data.username || "-"}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Generated Password
                                </p>
                                <p className="font-mono text-sm text-slate-800">
                                    {data.password ? PASSWORD_MASK : "-"}
                                </p>
                            </div>

                            {serverErrorList.length > 0 && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                                        Validation Errors
                                    </p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
                                        {serverErrorList.map((error, index) => (
                                            <li key={`${error}-${index}`}>
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="shrink-0 flex items-center justify-between border-t border-emerald-100 bg-white px-6 py-4">
                    <button
                        type="button"
                        onClick={goBack}
                        disabled={processing}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                    >
                        <ChevronLeft size={13} />
                        {step === STEP_PROFILE ? "Cancel" : "Back"}
                    </button>

                    {step < STEP_REVIEW ? (
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={processing}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                        >
                            Next
                            <ChevronRight size={13} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                        >
                            <Save size={13} />
                            {processing ? "Creating..." : "Create User"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

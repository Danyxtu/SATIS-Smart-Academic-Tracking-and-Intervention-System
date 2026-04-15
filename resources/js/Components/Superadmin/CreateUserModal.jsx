import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    Check,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Info,
    Lock,
    Mail,
    QrCode,
    RefreshCw,
    Save,
    Shield,
    Trash2,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const STEP_USER_SELECTION = 1;
const STEP_PROFILE = 2;
const STEP_SECURITY = 3;
const STEP_REVIEW = 4;
const STEP_SUMMARY = 5;

const TEACHER_MODE_SINGLE = "single";
const TEACHER_MODE_MULTIPLE = "multiple";

const STUDENT_MODE_SINGLE = "single";
const STUDENT_MODE_MULTIPLE = "multiple";
const STUDENT_MODE_CSV = "csv";

const STUDENT_GRADE_LEVEL_OPTIONS = ["11", "12"];

const STUDENT_USERNAME_FORMAT = /^[a-z]{2}\d{4}\d{5}$/;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LRN_LENGTH = 12;

const STEPS = [
    {
        id: STEP_USER_SELECTION,
        label: "User Selection",
        icon: Users,
    },
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
    {
        id: STEP_SUMMARY,
        label: "Summary",
        icon: QrCode,
    },
];

function WizardStep({
    step,
    displayIndex,
    currentStep,
    maxVisitedStep,
    onNavigate,
    disableNavigation,
}) {
    const Icon = step.icon;
    const isActive = currentStep === step.id;
    const isVisited = step.id <= maxVisitedStep;
    const isDone = maxVisitedStep > step.id;
    const isClickable =
        isVisited &&
        !disableNavigation &&
        !isActive &&
        step.id !== STEP_SUMMARY;

    return (
        <button
            type="button"
            onClick={() => onNavigate?.(step.id)}
            disabled={!isClickable}
            className={`inline-flex items-center gap-2 rounded-full text-xs font-semibold transition-all ${
                isActive
                    ? "scale-105 bg-emerald-100 px-4 py-1.5 text-emerald-700 shadow-sm"
                    : isVisited
                      ? "bg-emerald-50 px-4 py-1.5 text-emerald-700"
                      : "bg-slate-50 px-3 py-1 text-slate-400"
            } ${
                isClickable
                    ? "cursor-pointer hover:bg-emerald-100 hover:text-emerald-700"
                    : "cursor-default"
            }`}
        >
            <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    isDone ? "bg-emerald-600 text-white" : "bg-white"
                }`}
            >
                {isDone ? <Check size={10} /> : displayIndex + 1}
            </span>
            <Icon size={12} />
            <span>{step.label}</span>
        </button>
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

const normalizeSectionSearch = (value = "") =>
    String(value).trim().toLowerCase();

const formatSectionOptionLabel = (section) => {
    if (section?.section_full_label) {
        return section.section_full_label;
    }

    const specialization =
        section?.track || section?.strand || section?.department_code || "";

    return [section?.grade_level, specialization, section?.section_name]
        .filter(Boolean)
        .join(" - ");
};

const normalizeGradeLevelValue = (value = "") => {
    const normalized = String(value || "").trim();
    const matched = normalized.match(/(11|12)/);

    return matched?.[1] || "";
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
    const lastTokens = normalizeUsernameSeed(lastName)
        .split(" ")
        .filter(Boolean);
    const last = lastTokens[lastTokens.length - 1] || "";

    const firstInitial = first.slice(0, 1) || "x";
    const lastInitial = last.slice(0, 1) || "x";

    return `${firstInitial}${lastInitial}`;
};

const buildStudentUsername = ({ firstName, lastName, year, sequence }) => {
    const prefix = getInitialsPrefix(firstName, lastName);
    const yearPart = String(year || new Date().getFullYear())
        .padStart(4, "0")
        .slice(-4);
    const sequencePart = String(Math.max(1, Number(sequence) || 1)).padStart(
        5,
        "0",
    );

    return `${prefix}${yearPart}${sequencePart}`;
};

const buildStudentUsernamePrefixForYear = ({ firstName, lastName, year }) => {
    const prefix = getInitialsPrefix(firstName, lastName);
    const yearPart = String(year || new Date().getFullYear())
        .padStart(4, "0")
        .slice(-4);

    return `${prefix}${yearPart}`;
};

const normalizeUsernameSequence = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
        return 0;
    }

    return Math.floor(numericValue);
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

    if (["lrn", "learnerreferencenumber"].includes(normalized)) {
        return "lrn";
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
    const lrnIndex = headers.indexOf("lrn");

    if (firstNameIndex === -1 || lastNameIndex === -1 || lrnIndex === -1) {
        return {
            rows: [],
            error: "CSV headers must include first_name, last_name, and lrn. Optional: middle_name.",
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
        const lrn = String(row[lrnIndex] || "").trim();

        if (!firstName && !lastName && !middleName && !lrn) {
            continue;
        }

        if (!firstName || !lastName || !lrn) {
            return {
                rows: [],
                error: `Row ${rowIndex + 1}: first_name, last_name, and lrn are required.`,
            };
        }

        if (lrn.length !== LRN_LENGTH) {
            return {
                rows: [],
                error: `Row ${rowIndex + 1}: lrn must be exactly ${LRN_LENGTH} characters.`,
            };
        }

        rows.push({
            id: `csv-${Date.now()}-${rowIndex}`,
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            lrn,
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
        lrn: "",
    };
}

const applyStudentQueueUsernames = (
    queue,
    yearNumber,
    latestByPrefix = {},
) => {
    const runningSequenceByPrefix = {};

    return queue.map((queueItem) => {
        const usernamePrefix = buildStudentUsernamePrefixForYear({
            firstName: queueItem.first_name,
            lastName: queueItem.last_name,
            year: yearNumber,
        });

        const baseSequence = normalizeUsernameSequence(
            latestByPrefix[usernamePrefix],
        );

        const nextSequence =
            normalizeUsernameSequence(runningSequenceByPrefix[usernamePrefix]) ||
            baseSequence;

        const resolvedSequence = nextSequence + 1;
        runningSequenceByPrefix[usernamePrefix] = resolvedSequence;

        return {
            ...queueItem,
            username: buildStudentUsername({
                firstName: queueItem.first_name,
                lastName: queueItem.last_name,
                year: yearNumber,
                sequence: resolvedSequence,
            }),
        };
    });
};

export default function CreateUserModal({
    open,
    onClose,
    departments,
    sections = [],
    studentUsernameLatestByPrefix = {},
}) {
    const wasOpenRef = useRef(false);
    const studentSectionPickerRef = useRef(null);

    const [step, setStep] = useState(STEP_USER_SELECTION);
    const [maxVisitedStep, setMaxVisitedStep] = useState(STEP_USER_SELECTION);
    const [teacherMode, setTeacherMode] = useState(TEACHER_MODE_SINGLE);
    const [teacherDraft, setTeacherDraft] = useState(emptyTeacherDraft());
    const [teacherQueue, setTeacherQueue] = useState([]);

    const [studentMode, setStudentMode] = useState(STUDENT_MODE_SINGLE);
    const [studentDraft, setStudentDraft] = useState(emptyStudentDraft());
    const [studentQueue, setStudentQueue] = useState([]);
    const [studentSectionSearch, setStudentSectionSearch] = useState("");
    const [showStudentSectionOptions, setShowStudentSectionOptions] =
        useState(false);
    const [studentCsvFileName, setStudentCsvFileName] = useState("");
    const [createdStudentCredentials, setCreatedStudentCredentials] = useState(
        [],
    );
    const [selectedCreatedStudentId, setSelectedCreatedStudentId] =
        useState("");

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
        lrn: "",
        email: "",
        username: "",
        password: "",
        role: "",
        grade_level: "",
        assign_as_admin: false,
        department_id: "",
        teacher_mode: TEACHER_MODE_SINGLE,
        teacher_queue: [],
        student_mode: STUDENT_MODE_SINGLE,
        section_id: "",
        student_queue: [],
    });

    const normalizedDepartments = useMemo(
        () => (Array.isArray(departments) ? departments : []),
        [departments],
    );

    const normalizedSections = useMemo(
        () => (Array.isArray(sections) ? sections : []),
        [sections],
    );

    const isTeacher = data.role === "teacher";
    const isStudent = data.role === "student";

    const currentYearNumber = useMemo(() => new Date().getFullYear(), []);
    const normalizedStudentUsernameLatestByPrefix = useMemo(() => {
        if (
            !studentUsernameLatestByPrefix ||
            typeof studentUsernameLatestByPrefix !== "object"
        ) {
            return {};
        }

        return Object.entries(studentUsernameLatestByPrefix).reduce(
            (carry, [prefix, sequence]) => {
                const normalizedPrefix = String(prefix || "").toLowerCase();

                if (!/^[a-z]{2}\d{4}$/.test(normalizedPrefix)) {
                    return carry;
                }

                carry[normalizedPrefix] = normalizeUsernameSequence(sequence);
                return carry;
            },
            {},
        );
    }, [studentUsernameLatestByPrefix]);

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

    const selectedStudentSection = useMemo(
        () =>
            isStudent && data.section_id
                ? (normalizedSections.find(
                      (section) =>
                          String(section.id) === String(data.section_id),
                  ) ?? null)
                : null,
        [isStudent, data.section_id, normalizedSections],
    );

    const selectedStudentGradeLevel = useMemo(
        () => normalizeGradeLevelValue(data.grade_level),
        [data.grade_level],
    );

    const filteredStudentSections = useMemo(() => {
        const normalizedSearch = normalizeSectionSearch(studentSectionSearch);

        const sectionsByGrade = selectedStudentGradeLevel
            ? normalizedSections.filter(
                  (section) =>
                      normalizeGradeLevelValue(section.grade_level) ===
                      selectedStudentGradeLevel,
              )
            : normalizedSections;

        if (!normalizedSearch) {
            return sectionsByGrade;
        }

        return sectionsByGrade.filter((section) => {
            const searchTargets = [
                formatSectionOptionLabel(section),
                section.section_name,
                section.section_code,
                section.grade_level,
                section.track,
                section.strand,
                section.department_name,
                section.department_code,
                section.school_year,
            ]
                .map((value) => normalizeSectionSearch(value))
                .filter(Boolean);

            return searchTargets.some((value) =>
                value.includes(normalizedSearch),
            );
        });
    }, [normalizedSections, selectedStudentGradeLevel, studentSectionSearch]);

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
                    String(department.id) ===
                    String(teacherDraft.department_id),
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

        const usernamePrefix = buildStudentUsernamePrefixForYear({
            firstName: data.first_name,
            lastName: data.last_name,
            year: currentYearNumber,
        });

        const latestSequence = normalizeUsernameSequence(
            normalizedStudentUsernameLatestByPrefix[usernamePrefix],
        );

        return buildStudentUsername({
            firstName: data.first_name,
            lastName: data.last_name,
            year: currentYearNumber,
            sequence: latestSequence + 1,
        });
    }, [
        isStudent,
        studentMode,
        data.first_name,
        data.last_name,
        currentYearNumber,
        normalizedStudentUsernameLatestByPrefix,
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

    const visibleSteps = useMemo(
        () =>
            isTeacher
                ? STEPS.filter((wizardStep) => wizardStep.id !== STEP_SECURITY)
                : STEPS,
        [isTeacher],
    );

    const activeVisibleStepIndex = useMemo(() => {
        const currentIndex = visibleSteps.findIndex(
            (wizardStep) => wizardStep.id === step,
        );

        return currentIndex >= 0 ? currentIndex : 0;
    }, [visibleSteps, step]);

    const activeVisibleStep = visibleSteps[activeVisibleStepIndex] ?? null;

    useEffect(() => {
        if (open && !wasOpenRef.current) {
            reset();
            clearErrors();
            setStep(STEP_USER_SELECTION);
            setMaxVisitedStep(STEP_USER_SELECTION);

            setTeacherMode(TEACHER_MODE_SINGLE);
            setTeacherDraft(emptyTeacherDraft());
            setTeacherQueue([]);

            setStudentMode(STUDENT_MODE_SINGLE);
            setStudentDraft(emptyStudentDraft());
            setStudentQueue([]);
            setStudentSectionSearch("");
            setShowStudentSectionOptions(false);
            setStudentCsvFileName("");
            setCreatedStudentCredentials([]);
            setSelectedCreatedStudentId("");

            setClientErrors({});

            setData("teacher_mode", TEACHER_MODE_SINGLE);
            setData("teacher_queue", []);
            setData("student_mode", STUDENT_MODE_SINGLE);
            setData("grade_level", "");
            setData("section_id", "");
            setData("student_queue", []);
            setData("lrn", "");
            setData("username", "");
            setData("password", generateRandomPassword());
        }

        wasOpenRef.current = open;
    }, [open, reset, clearErrors, setData]);

    useEffect(() => {
        setMaxVisitedStep((previousMaxVisitedStep) =>
            Math.max(previousMaxVisitedStep, step),
        );
    }, [step]);

    useEffect(() => {
        if (!showStudentSectionOptions) {
            return undefined;
        }

        const handleClickOutside = (event) => {
            if (!studentSectionPickerRef.current) {
                return;
            }

            if (!studentSectionPickerRef.current.contains(event.target)) {
                setShowStudentSectionOptions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showStudentSectionOptions]);

    useEffect(() => {
        if (!isStudent) {
            setShowStudentSectionOptions(false);
            return;
        }

        if (!data.section_id) {
            return;
        }

        if (!selectedStudentSection) {
            return;
        }

        setStudentSectionSearch(
            formatSectionOptionLabel(selectedStudentSection),
        );
    }, [isStudent, data.section_id, selectedStudentSection]);

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
                lrn: queueItem.lrn || "",
                username: queueItem.username,
            })),
        );
    }, [studentQueue, setData]);

    const pendingStudentProfiles = useMemo(() => {
        if (!isStudent) {
            return [];
        }

        const generatedPassword = String(data.password || "");

        if (studentMode === STUDENT_MODE_SINGLE) {
            const username = String(data.username || "").trim();

            if (!username) {
                return [];
            }

            return [
                {
                    id: "single-student-review",
                    first_name: String(data.first_name || "").trim(),
                    middle_name: String(data.middle_name || "").trim(),
                    last_name: String(data.last_name || "").trim(),
                    full_name:
                        [data.first_name, data.middle_name, data.last_name]
                            .filter(Boolean)
                            .join(" ") || "Student",
                    lrn: String(data.lrn || "").trim(),
                    username,
                    password: generatedPassword,
                },
            ];
        }

        return studentQueue.map((queueItem) => ({
            id: queueItem.id,
            first_name: String(queueItem.first_name || "").trim(),
            middle_name: String(queueItem.middle_name || "").trim(),
            last_name: String(queueItem.last_name || "").trim(),
            full_name:
                [
                    queueItem.first_name,
                    queueItem.middle_name,
                    queueItem.last_name,
                ]
                    .filter(Boolean)
                    .join(" ") || "Student",
            lrn: String(queueItem.lrn || "").trim(),
            username: queueItem.username,
            password: generatedPassword,
        }));
    }, [
        isStudent,
        data.password,
        data.username,
        data.first_name,
        data.middle_name,
        data.last_name,
        data.lrn,
        studentMode,
        studentQueue,
    ]);

    useEffect(() => {
        if (createdStudentCredentials.length === 0) {
            setSelectedCreatedStudentId("");
            return;
        }

        const selectedStillExists = createdStudentCredentials.some(
            (credential) =>
                String(credential.id) === String(selectedCreatedStudentId),
        );

        if (!selectedStillExists) {
            setSelectedCreatedStudentId(
                String(createdStudentCredentials[0].id),
            );
        }
    }, [createdStudentCredentials, selectedCreatedStudentId]);

    const selectedCreatedStudentCredential = useMemo(
        () =>
            createdStudentCredentials.find(
                (credential) =>
                    String(credential.id) === String(selectedCreatedStudentId),
            ) ??
            createdStudentCredentials[0] ??
            null,
        [createdStudentCredentials, selectedCreatedStudentId],
    );

    const selectedCreatedStudentQrPayload = useMemo(() => {
        if (
            !selectedCreatedStudentCredential?.username ||
            !selectedCreatedStudentCredential?.password
        ) {
            return "";
        }

        return JSON.stringify({
            type: "satis_student_credentials",
            version: 1,
            username: selectedCreatedStudentCredential.username,
            password: selectedCreatedStudentCredential.password,
        });
    }, [selectedCreatedStudentCredential]);

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
        if (
            !open ||
            step === STEP_SUMMARY ||
            !errors ||
            typeof errors !== "object"
        ) {
            return;
        }

        const errorKeys = Object.keys(errors);

        if (errorKeys.length === 0) {
            return;
        }

        if (!isTeacher && errorKeys.some((field) => field === "password")) {
            setStep(STEP_SECURITY);
            return;
        }

        if (
            errorKeys.some(
                (field) =>
                    field === "first_name" ||
                    field === "last_name" ||
                    field === "middle_name" ||
                    field === "lrn" ||
                    field === "email" ||
                    field === "grade_level" ||
                    field === "username" ||
                    field === "section_id" ||
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
    }, [open, errors, step, isTeacher]);

    const closeModal = () => {
        if (processing) {
            return;
        }

        reset();
        clearErrors();
        setStep(STEP_USER_SELECTION);
        setMaxVisitedStep(STEP_USER_SELECTION);

        setTeacherMode(TEACHER_MODE_SINGLE);
        setTeacherDraft(emptyTeacherDraft());
        setTeacherQueue([]);

        setStudentMode(STUDENT_MODE_SINGLE);
        setStudentDraft(emptyStudentDraft());
        setStudentQueue([]);
        setStudentSectionSearch("");
        setShowStudentSectionOptions(false);
        setStudentCsvFileName("");
        setCreatedStudentCredentials([]);
        setSelectedCreatedStudentId("");

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
            setStudentSectionSearch("");
            setShowStudentSectionOptions(false);
            setStudentCsvFileName("");
            setCreatedStudentCredentials([]);
            setSelectedCreatedStudentId("");
            setData("email", "");
            setData("lrn", "");
            setData("grade_level", "");
            setData("section_id", "");
            return;
        }

        setStudentMode(STUDENT_MODE_SINGLE);
        setStudentDraft(emptyStudentDraft());
        setStudentQueue([]);
        setStudentSectionSearch("");
        setShowStudentSectionOptions(false);
        setStudentCsvFileName("");
        setCreatedStudentCredentials([]);
        setSelectedCreatedStudentId("");
        setData("student_queue", []);
        setData("lrn", "");
        setData("username", "");
        setData("grade_level", "");
        setData("section_id", "");

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
        setCreatedStudentCredentials([]);
        setSelectedCreatedStudentId("");
        setShowStudentSectionOptions(false);
        setData("student_queue", []);
        setClientErrors({});
    };

    const handleStudentGradeLevelChange = (gradeLevel) => {
        setData("grade_level", gradeLevel);

        if (!selectedStudentSection) {
            return;
        }

        if (
            normalizeGradeLevelValue(selectedStudentSection.grade_level) !==
            gradeLevel
        ) {
            setData("section_id", "");
            setStudentSectionSearch("");
        }
    };

    const handleStudentSectionSearchChange = (value) => {
        setStudentSectionSearch(value);
        setShowStudentSectionOptions(true);

        const normalizedInput = normalizeSectionSearch(value);

        if (!normalizedInput) {
            setData("section_id", "");
            return;
        }

        const matchedSection = normalizedSections.find(
            (section) =>
                normalizeSectionSearch(formatSectionOptionLabel(section)) ===
                normalizedInput,
        );

        if (!matchedSection) {
            setData("section_id", "");
            return;
        }

        const matchedSectionGradeLevel = normalizeGradeLevelValue(
            matchedSection.grade_level,
        );

        if (
            selectedStudentGradeLevel &&
            matchedSectionGradeLevel !== selectedStudentGradeLevel
        ) {
            setData("section_id", "");
            return;
        }

        setData("section_id", String(matchedSection.id));

        if (matchedSectionGradeLevel) {
            setData("grade_level", matchedSectionGradeLevel);
        }
    };

    const selectStudentSection = (section) => {
        setData("section_id", String(section.id));
        setStudentSectionSearch(formatSectionOptionLabel(section));
        const matchedSectionGradeLevel = normalizeGradeLevelValue(
            section.grade_level,
        );
        if (matchedSectionGradeLevel) {
            setData("grade_level", matchedSectionGradeLevel);
        }
        setShowStudentSectionOptions(false);
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
        const email = String(teacherDraft.email || "")
            .trim()
            .toLowerCase();
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
        const lrn = String(studentDraft.lrn || "").trim();

        if (!firstName) {
            nextErrors.student_queue_first_name = "First name is required.";
        }

        if (!lastName) {
            nextErrors.student_queue_last_name = "Last name is required.";
        }

        if (!lrn) {
            nextErrors.student_queue_lrn = "LRN is required.";
        } else if (lrn.length !== LRN_LENGTH) {
            nextErrors.student_queue_lrn = `LRN must be exactly ${LRN_LENGTH} characters.`;
        } else {
            const duplicateLrn = studentQueue.some(
                (queueItem) => String(queueItem.lrn || "").trim() === lrn,
            );

            if (duplicateLrn) {
                nextErrors.student_queue_lrn =
                    "This LRN already exists in the student queue.";
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
            lrn,
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
            currentYearNumber,
            normalizedStudentUsernameLatestByPrefix,
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
            currentYearNumber,
            normalizedStudentUsernameLatestByPrefix,
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
            currentYearNumber,
            normalizedStudentUsernameLatestByPrefix,
        );

        const duplicateLrnSet = new Set();
        const hasDuplicateLrn = normalizedQueue.some((queueItem) => {
            const lrn = String(queueItem.lrn || "").trim();

            if (!lrn) {
                return false;
            }

            if (duplicateLrnSet.has(lrn)) {
                return true;
            }

            duplicateLrnSet.add(lrn);
            return false;
        });

        if (hasDuplicateLrn) {
            setStudentQueue([]);
            setStudentCsvFileName(file.name);
            setClientErrors((previousErrors) => ({
                ...previousErrors,
                student_csv:
                    "CSV has duplicate LRN values. Keep one row per LRN.",
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

        if (role === "student" && !selectedStudentGradeLevel) {
            nextErrors.grade_level = "Grade level is required for students.";
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
            if (!String(data.section_id || "").trim()) {
                nextErrors.section_id =
                    "Section assignment is required for student creation.";
            }

            if (studentQueue.length === 0) {
                nextErrors.student_queue =
                    "Add at least one student in queue before proceeding.";
            }

            if (
                studentQueue.some(
                    (queueItem) => !String(queueItem.lrn || "").trim(),
                )
            ) {
                nextErrors.student_queue =
                    "Every queued student must include an LRN.";
            }

            if (
                studentQueue.some(
                    (queueItem) =>
                        String(queueItem.lrn || "").trim().length !==
                        LRN_LENGTH,
                )
            ) {
                nextErrors.student_queue = `Every queued student LRN must be exactly ${LRN_LENGTH} characters.`;
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
                nextErrors.department_id =
                    "Department is required for teachers.";
            }
        }

        if (role === "student" && studentMode === STUDENT_MODE_SINGLE) {
            if (!String(data.section_id || "").trim()) {
                nextErrors.section_id =
                    "Section assignment is required for student creation.";
            }

            if (!String(data.lrn || "").trim()) {
                nextErrors.lrn = "LRN is required.";
            } else if (String(data.lrn || "").trim().length !== LRN_LENGTH) {
                nextErrors.lrn = `LRN must be exactly ${LRN_LENGTH} characters.`;
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

        if (isTeacher) {
            setClientErrors(nextErrors);
            return true;
        }

        if (!String(data.password || "").trim()) {
            nextErrors.password = "Password is required.";
        }

        setClientErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const goNext = () => {
        if (step === STEP_USER_SELECTION) {
            if (!data.role) {
                setClientErrors({
                    role: "Select whether you are creating a teacher or student.",
                });
                return;
            }

            setClientErrors({});
            setStep(STEP_PROFILE);
            return;
        }

        if (step === STEP_PROFILE) {
            if (!validateProfileStep()) {
                return;
            }

            setClientErrors({});
            setStep(isTeacher ? STEP_REVIEW : STEP_SECURITY);
            return;
        }

        if (step === STEP_SECURITY) {
            if (!validateSecurityStep()) {
                return;
            }

            setClientErrors({});
            setStep(STEP_REVIEW);
            return;
        }

        setClientErrors({});
        setStep((previousStep) => Math.min(previousStep + 1, STEP_REVIEW));
    };

    const goBack = () => {
        if (step === STEP_SUMMARY) {
            closeModal();
            return;
        }

        if (step === STEP_USER_SELECTION) {
            closeModal();
            return;
        }

        if (isTeacher && step === STEP_REVIEW) {
            setStep(STEP_PROFILE);
            return;
        }

        setStep((previousStep) =>
            Math.max(previousStep - 1, STEP_USER_SELECTION),
        );
    };

    const handleVisitedStepNavigation = (targetStep) => {
        if (processing || step === STEP_SUMMARY) {
            return;
        }

        if (targetStep > maxVisitedStep) {
            return;
        }

        if (targetStep === step) {
            return;
        }

        setStep(targetStep);
        setClientErrors({});
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
                grade_level: selectedStudentGradeLevel || null,
                section_id: Number(data.section_id),
                password: data.password,
                student_queue: studentQueue.map((queueItem) => ({
                    first_name: queueItem.first_name,
                    last_name: queueItem.last_name,
                    middle_name: queueItem.middle_name || "",
                    lrn: queueItem.lrn,
                    username: queueItem.username,
                })),
            };
        } else if (isTeacher) {
            payload = {
                first_name: data.first_name,
                last_name: data.last_name,
                middle_name: data.middle_name,
                email: data.email,
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
                lrn: data.lrn,
                username: data.username,
                password: data.password,
                role: "student",
                student_mode: STUDENT_MODE_SINGLE,
                grade_level: selectedStudentGradeLevel || null,
                section_id: Number(data.section_id),
            };
        }

        transform(() => payload);

        post(route("superadmin.users.store"), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                if (isStudent) {
                    const flashCredentials = Array.isArray(
                        page?.props?.flash?.created_student_credentials,
                    )
                        ? page.props.flash.created_student_credentials
                        : [];

                    const sourceCredentials =
                        flashCredentials.length > 0
                            ? flashCredentials
                            : pendingStudentProfiles;

                    const normalizedCredentials = sourceCredentials.map(
                        (credential, index) => ({
                            id:
                                credential.id ||
                                credential.username ||
                                `created-student-${index}`,
                            first_name:
                                credential.first_name ||
                                credential.full_name ||
                                "",
                            middle_name: credential.middle_name || "",
                            last_name: credential.last_name || "",
                            full_name:
                                credential.full_name ||
                                [
                                    credential.first_name,
                                    credential.middle_name,
                                    credential.last_name,
                                ]
                                    .filter(Boolean)
                                    .join(" ") ||
                                "Student",
                            lrn: credential.lrn || "",
                            username: credential.username || "",
                            password:
                                credential.password || data.password || "",
                        }),
                    );

                    setCreatedStudentCredentials(normalizedCredentials);
                    setSelectedCreatedStudentId(
                        normalizedCredentials[0]
                            ? String(normalizedCredentials[0].id)
                            : "",
                    );
                    setStep(STEP_SUMMARY);
                    clearErrors();
                    setClientErrors({});
                    return;
                }

                reset();
                clearErrors();
                setStep(STEP_USER_SELECTION);
                setMaxVisitedStep(STEP_USER_SELECTION);

                setTeacherMode(TEACHER_MODE_SINGLE);
                setTeacherDraft(emptyTeacherDraft());
                setTeacherQueue([]);

                setStudentMode(STUDENT_MODE_SINGLE);
                setStudentDraft(emptyStudentDraft());
                setStudentQueue([]);
                setStudentCsvFileName("");
                setCreatedStudentCredentials([]);
                setSelectedCreatedStudentId("");

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
                        className="absolute z-10 right-3 top-3 rounded-lg p-1.5 text-emerald-100 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-60"
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
                                Step {activeVisibleStepIndex + 1} of{" "}
                                {visibleSteps.length}:{" "}
                                {activeVisibleStep?.label}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 border-b border-emerald-100 px-6 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {visibleSteps.map((wizardStep, stepIndex) => (
                            <WizardStep
                                key={wizardStep.id}
                                step={wizardStep}
                                displayIndex={stepIndex}
                                currentStep={step}
                                maxVisitedStep={maxVisitedStep}
                                onNavigate={handleVisitedStepNavigation}
                                disableNavigation={
                                    processing || step === STEP_SUMMARY
                                }
                            />
                        ))}
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-emerald-50/40 px-6 py-5">
                    {step === STEP_USER_SELECTION && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <div>
                                <p className="text-base font-semibold text-slate-900">
                                    User Selection
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Choose which account type you want to
                                    create.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {["teacher", "student"].map((role) => {
                                    const cfg = getRoleConfig(role);
                                    const Icon = cfg.icon;
                                    const isSelected = data.role === role;

                                    return (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => {
                                                handleRoleChange(role);
                                                setStep(STEP_PROFILE);
                                            }}
                                            className={`rounded-xl border p-4 text-left transition-all ${
                                                isSelected
                                                    ? "border-emerald-400 bg-emerald-50 shadow-sm"
                                                    : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                                                        isSelected
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}
                                                >
                                                    <Icon size={18} />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {cfg.label}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {role === "teacher"
                                                            ? "Manage department-linked teacher accounts with server-generated credentials"
                                                            : "Create student credentials and QR access"}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {(clientErrors.role || errors.role) && (
                                <p className="text-xs text-rose-600">
                                    {clientErrors.role || errors.role}
                                </p>
                            )}
                        </div>
                    )}

                    {step === STEP_PROFILE && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            {isTeacher && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Teacher Add Mode
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleTeacherModeChange(
                                                    TEACHER_MODE_SINGLE,
                                                )
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                                                teacherMode ===
                                                TEACHER_MODE_SINGLE
                                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                            }`}
                                        >
                                            Add Single Teacher
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleTeacherModeChange(
                                                    TEACHER_MODE_MULTIPLE,
                                                )
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                                                teacherMode ===
                                                TEACHER_MODE_MULTIPLE
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
                                                handleStudentModeChange(
                                                    STUDENT_MODE_SINGLE,
                                                )
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                                                studentMode ===
                                                STUDENT_MODE_SINGLE
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
                                                studentMode ===
                                                STUDENT_MODE_MULTIPLE
                                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                            }`}
                                        >
                                            Add Multiple Student
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleStudentModeChange(
                                                    STUDENT_MODE_CSV,
                                                )
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

                            {isStudent && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Grade Level{" "}
                                        <span className="text-rose-500">*</span>
                                    </label>

                                    <div className="grid w-full grid-cols-2 gap-2">
                                        {STUDENT_GRADE_LEVEL_OPTIONS.map(
                                            (gradeLevel) => {
                                                const isActive =
                                                    selectedStudentGradeLevel ===
                                                    gradeLevel;

                                                return (
                                                    <button
                                                        key={gradeLevel}
                                                        type="button"
                                                        onClick={() =>
                                                            handleStudentGradeLevelChange(
                                                                gradeLevel,
                                                            )
                                                        }
                                                        className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                                                            isActive
                                                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                                        }`}
                                                    >
                                                        Grade {gradeLevel}
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>

                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Pick grade level first so section
                                        options stay aligned.
                                    </p>

                                    {(errors.grade_level ||
                                        clientErrors.grade_level) && (
                                        <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                                            <Info size={12} />
                                            {errors.grade_level ||
                                                clientErrors.grade_level}
                                        </p>
                                    )}
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

                                    {isStudent && (
                                        <Field
                                            label="LRN"
                                            icon={Shield}
                                            required
                                            error={
                                                errors.lrn || clientErrors.lrn
                                            }
                                        >
                                            <input
                                                type="text"
                                                value={data.lrn || ""}
                                                onChange={(event) =>
                                                    setData(
                                                        "lrn",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Learner Reference Number"
                                                minLength={LRN_LENGTH}
                                                maxLength={LRN_LENGTH}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                            />
                                        </Field>
                                    )}

                                    {isTeacher && (
                                        <Field
                                            label="Email Address"
                                            icon={Mail}
                                            required
                                            error={
                                                errors.email ||
                                                clientErrors.email
                                            }
                                        >
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(event) =>
                                                    setData(
                                                        "email",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="teacher@school.edu"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                            />
                                        </Field>
                                    )}

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
                                                number (example: dd202300100).
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
                                                            value={
                                                                department.id
                                                            }
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
                                                        assigned to the{" "}
                                                        {
                                                            selectedDepartment?.department_name
                                                        }{" "}
                                                        department.
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
                                                        has admin:{" "}
                                                        {selectedDraftDepartment
                                                            .department_admin
                                                            ?.name ||
                                                            "Assigned admin"}
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

                                        {teacherQueueValidationErrors.length >
                                            0 && (
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
                                                Teacher Queue (
                                                {teacherQueue.length})
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
                                                                        size={
                                                                            13
                                                                        }
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

                                        {studentMode ===
                                        STUDENT_MODE_MULTIPLE ? (
                                            <>
                                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                    <input
                                                        type="text"
                                                        value={
                                                            studentDraft.first_name
                                                        }
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
                                                        value={
                                                            studentDraft.last_name
                                                        }
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
                                                        type="text"
                                                        value={studentDraft.lrn}
                                                        onChange={(event) =>
                                                            setStudentDraft(
                                                                (
                                                                    previousDraft,
                                                                ) => ({
                                                                    ...previousDraft,
                                                                    lrn: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="LRN"
                                                        minLength={LRN_LENGTH}
                                                        maxLength={LRN_LENGTH}
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
                                                        onChange={
                                                            handleStudentCsvUpload
                                                        }
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                                    />
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Required headers:
                                                        first_name, last_name,
                                                        lrn. Optional:
                                                        middle_name.
                                                    </p>
                                                    {studentCsvFileName && (
                                                        <p className="mt-1 text-xs text-slate-600">
                                                            Selected file:{" "}
                                                            {studentCsvFileName}
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {(clientErrors.student_queue_first_name ||
                                            clientErrors.student_queue_last_name ||
                                            clientErrors.student_queue_lrn ||
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
                                                {clientErrors.student_queue_lrn && (
                                                    <p className="text-xs text-rose-700">
                                                        {
                                                            clientErrors.student_queue_lrn
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

                                        {studentQueueValidationErrors.length >
                                            0 && (
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
                                                Student Queue (
                                                {studentQueue.length})
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
                                                                        LRN:{" "}
                                                                        {queueItem.lrn ||
                                                                            "-"}
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
                                                                        size={
                                                                            13
                                                                        }
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

                            {isStudent && (
                                <Field
                                    label="Section Assignment"
                                    icon={Shield}
                                    required
                                    error={
                                        errors.section_id ||
                                        clientErrors.section_id
                                    }
                                >
                                    <div
                                        ref={studentSectionPickerRef}
                                        className="relative"
                                    >
                                        <input
                                            type="text"
                                            value={studentSectionSearch}
                                            onFocus={() =>
                                                setShowStudentSectionOptions(
                                                    true,
                                                )
                                            }
                                            onChange={(event) =>
                                                handleStudentSectionSearchChange(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={
                                                selectedStudentGradeLevel
                                                    ? "Click to view sections or type to search"
                                                    : "Select grade level first"
                                            }
                                            disabled={
                                                !selectedStudentGradeLevel
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                                        />

                                        {showStudentSectionOptions &&
                                            selectedStudentGradeLevel && (
                                                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                                                    {filteredStudentSections.length ===
                                                    0 ? (
                                                        <p className="px-2.5 py-2 text-xs text-slate-500">
                                                            No sections matched
                                                            your filters.
                                                        </p>
                                                    ) : (
                                                        filteredStudentSections.map(
                                                            (section) => (
                                                                <button
                                                                    key={
                                                                        section.id
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        selectStudentSection(
                                                                            section,
                                                                        )
                                                                    }
                                                                    className="w-full rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-emerald-50"
                                                                >
                                                                    <p className="text-sm font-medium text-slate-800">
                                                                        {formatSectionOptionLabel(
                                                                            section,
                                                                        )}
                                                                    </p>
                                                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                                                        {section.department_code
                                                                            ? `${section.department_code} • `
                                                                            : ""}
                                                                        {section.school_year ||
                                                                            ""}
                                                                    </p>
                                                                </button>
                                                            ),
                                                        )
                                                    )}
                                                </div>
                                            )}
                                    </div>

                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Uses full label format: Grade -
                                        Specialization - Section.
                                    </p>

                                    {selectedStudentSection && (
                                        <p className="mt-1 text-xs text-slate-600">
                                            Assigned to:{" "}
                                            {formatSectionOptionLabel(
                                                selectedStudentSection,
                                            )}
                                        </p>
                                    )}
                                </Field>
                            )}
                        </div>
                    )}

                    {step === STEP_SECURITY && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            {isTeacher ? (
                                <>
                                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                        <Info
                                            size={15}
                                            className="mt-0.5 shrink-0 text-emerald-700"
                                        />
                                        <p className="text-xs leading-relaxed text-emerald-800">
                                            <span className="font-semibold">
                                                Teacher credentials are fully
                                                server-generated.
                                            </span>{" "}
                                            Temporary username and password are
                                            generated after account creation and
                                            sent to the teacher&apos;s email.
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                                        <Info
                                            size={15}
                                            className="mt-0.5 shrink-0 text-amber-600"
                                        />
                                        <p className="text-xs leading-relaxed text-amber-800">
                                            <span className="font-semibold">
                                                Next login flow:
                                            </span>{" "}
                                            Teacher must create a new password
                                            on first login, then verify email
                                            before accessing the teacher portal.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Field
                                        label="Password"
                                        icon={Lock}
                                        required
                                        error={
                                            errors.password ||
                                            clientErrors.password
                                        }
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
                                            setData(
                                                "password",
                                                generateRandomPassword(),
                                            )
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
                                            <span className="font-semibold">
                                                Note:
                                            </span>{" "}
                                            The user will be required to change
                                            their password on first login.
                                        </p>
                                    </div>
                                </>
                            )}
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

                            {isTeacher &&
                                teacherMode === TEACHER_MODE_MULTIPLE && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            Queued Teachers (
                                            {teacherQueue.length})
                                        </p>
                                        {teacherQueue.length === 0 ? (
                                            <p className="text-sm text-slate-500">
                                                None
                                            </p>
                                        ) : (
                                            <div className="mt-1.5 max-h-44 space-y-1.5 overflow-y-auto">
                                                {teacherQueue.map(
                                                    (queueItem) => (
                                                        <p
                                                            key={queueItem.id}
                                                            className="rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-700"
                                                        >
                                                            {
                                                                queueItem.first_name
                                                            }{" "}
                                                            {
                                                                queueItem.last_name
                                                            }{" "}
                                                            - {queueItem.email}{" "}
                                                            -{" "}
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
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                            {isStudent && (
                                <>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            Grade Level
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {selectedStudentGradeLevel
                                                ? `Grade ${selectedStudentGradeLevel}`
                                                : "None"}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            Assigned Section
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {selectedStudentSection
                                                ? formatSectionOptionLabel(
                                                      selectedStudentSection,
                                                  )
                                                : "None"}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            Student Information (
                                            {pendingStudentProfiles.length})
                                        </p>

                                        {pendingStudentProfiles.length === 0 ? (
                                            <p className="mt-2 text-sm text-slate-500">
                                                No student records available.
                                            </p>
                                        ) : (
                                            <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                                                {pendingStudentProfiles.map(
                                                    (studentProfile) => (
                                                        <div
                                                            key={
                                                                studentProfile.id
                                                            }
                                                            className="rounded-md border border-slate-200 bg-white px-3 py-2"
                                                        >
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {[
                                                                    studentProfile.first_name,
                                                                    studentProfile.middle_name,
                                                                    studentProfile.last_name,
                                                                ]
                                                                    .filter(
                                                                        Boolean,
                                                                    )
                                                                    .join(" ")}
                                                            </p>
                                                            <p className="text-xs text-slate-600">
                                                                LRN:{" "}
                                                                {studentProfile.lrn ||
                                                                    "-"}
                                                            </p>
                                                            <p className="font-mono text-xs text-slate-600">
                                                                Username:{" "}
                                                                {
                                                                    studentProfile.username
                                                                }
                                                            </p>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {showSingleForm && isTeacher && (
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
                                                Admin:{" "}
                                                {selectedAdminName ||
                                                    (data.assign_as_admin
                                                        ? "Assign this teacher as admin"
                                                        : "None")}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {isTeacher && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Credentials Delivery
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        Temporary username and password will be
                                        generated by the server and emailed to
                                        the teacher after account creation.
                                    </p>
                                </div>
                            )}

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

                    {step === STEP_SUMMARY && (
                        <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Student Account Summary
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Share these credentials with students and
                                    let them scan their QR to log in.
                                </p>
                            </div>

                            {createdStudentCredentials.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                                    No created student credentials found.
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
                                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                        {createdStudentCredentials.map(
                                            (credential) => {
                                                const isActive =
                                                    String(credential.id) ===
                                                    String(
                                                        selectedCreatedStudentCredential?.id,
                                                    );

                                                return (
                                                    <button
                                                        key={String(
                                                            credential.id,
                                                        )}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedCreatedStudentId(
                                                                String(
                                                                    credential.id,
                                                                ),
                                                            )
                                                        }
                                                        className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                                                            isActive
                                                                ? "border-emerald-300 bg-emerald-50"
                                                                : "border-slate-200 bg-white hover:border-slate-300"
                                                        }`}
                                                    >
                                                        <p className="truncate text-sm font-semibold text-slate-900">
                                                            {
                                                                credential.full_name
                                                            }
                                                        </p>
                                                        <p className="truncate text-xs text-slate-600">
                                                            LRN:{" "}
                                                            {credential.lrn ||
                                                                "-"}
                                                        </p>
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-3">
                                            <QRCodeSVG
                                                value={
                                                    selectedCreatedStudentQrPayload
                                                }
                                                size={180}
                                                includeMargin
                                            />
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {selectedCreatedStudentCredential?.full_name ||
                                                    "-"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-600">
                                                LRN:{" "}
                                                {selectedCreatedStudentCredential?.lrn ||
                                                    "-"}
                                            </p>
                                            <p className="mt-1 truncate font-mono text-xs text-slate-700">
                                                {selectedCreatedStudentCredential?.username ||
                                                    "-"}
                                            </p>
                                            <p className="mt-1 truncate font-mono text-xs text-slate-700">
                                                {selectedCreatedStudentCredential?.password ||
                                                    "-"}
                                            </p>
                                        </div>
                                    </div>
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
                        {step === STEP_SUMMARY
                            ? "Close"
                            : step === STEP_USER_SELECTION
                              ? "Cancel"
                              : "Back"}
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
                    ) : step === STEP_REVIEW ? (
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                        >
                            <Save size={13} />
                            {processing ? "Creating..." : "Create User"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={closeModal}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

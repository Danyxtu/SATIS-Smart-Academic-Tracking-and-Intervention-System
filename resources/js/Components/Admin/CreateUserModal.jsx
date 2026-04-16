import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    AlertTriangle,
    Check,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Hash,
    Info,
    Key,
    Mail,
    QrCode,
    Trash2,
    User,
    UserCog,
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

const STUDENT_MODE_SINGLE = "single";
const STUDENT_MODE_MULTIPLE = "multiple";
const STUDENT_MODE_CSV = "csv";

const STUDENT_GRADE_LEVEL_OPTIONS = ["11", "12"];
const LRN_LENGTH = 12;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEPS = [
    {
        id: STEP_USER_SELECTION,
        label: "User Selection",
        icon: Users,
    },
    {
        id: STEP_PROFILE,
        label: "Profile",
        icon: User,
    },
    {
        id: STEP_SECURITY,
        label: "Security",
        icon: Key,
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
                    ? "scale-105 bg-blue-100 px-4 py-1.5 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-300"
                    : isVisited
                      ? "bg-blue-50 px-4 py-1.5 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                      : "bg-slate-50 px-3 py-1 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
            } ${
                isClickable
                    ? "cursor-pointer hover:bg-blue-100 hover:text-blue-700"
                    : "cursor-default"
            }`}
        >
            <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    isDone
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300"
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
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
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
            icon: UserCog,
            description:
                "Create teacher account scoped to your department with server-generated credentials.",
        };
    }

    return {
        label: "Student",
        icon: Users,
        description:
            "Create one or multiple student accounts and share login via QR credentials.",
    };
};

function emptyStudentDraft() {
    return {
        first_name: "",
        last_name: "",
        middle_name: "",
        lrn: "",
        parent_contact_number: "",
    };
}

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

    if (
        [
            "parentcontactnumber",
            "parentcontact",
            "parentphone",
            "guardiancontactnumber",
            "guardiancontact",
            "guardianphone",
        ].includes(normalized)
    ) {
        return "parent_contact_number";
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
    const parentContactNumberIndex = headers.indexOf("parent_contact_number");

    if (firstNameIndex === -1 || lastNameIndex === -1 || lrnIndex === -1) {
        return {
            rows: [],
            error: "CSV headers must include first_name, last_name, and lrn. Optional: middle_name.",
        };
    }

    const rows = [];

    for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
        const row = splitCsvRow(lines[rowIndex]);

        const firstName = String(row[firstNameIndex] || "").trim();
        const lastName = String(row[lastNameIndex] || "").trim();
        const middleName =
            middleNameIndex >= 0
                ? String(row[middleNameIndex] || "").trim()
                : "";
        const lrn = String(row[lrnIndex] || "").trim();
        const parentContactNumber =
            parentContactNumberIndex >= 0
                ? String(row[parentContactNumberIndex] || "").trim()
                : "";

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
            parent_contact_number: parentContactNumber,
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

export default function CreateUserModal({
    open,
    onClose,
    department,
    initialRole,
}) {
    const wasOpenRef = useRef(false);

    const [step, setStep] = useState(STEP_USER_SELECTION);
    const [maxVisitedStep, setMaxVisitedStep] = useState(STEP_USER_SELECTION);

    const [studentMode, setStudentMode] = useState(STUDENT_MODE_SINGLE);
    const [studentDraft, setStudentDraft] = useState(emptyStudentDraft());
    const [studentQueue, setStudentQueue] = useState([]);
    const [studentCsvFileName, setStudentCsvFileName] = useState("");

    const [clientErrors, setClientErrors] = useState({});

    const [createdSummary, setCreatedSummary] = useState(null);
    const [createdStudentCredentials, setCreatedStudentCredentials] = useState(
        [],
    );
    const [selectedCreatedStudentId, setSelectedCreatedStudentId] =
        useState("");

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
        parent_contact_number: "",
        email: "",
        role: "",
        grade_level: "",
        student_mode: STUDENT_MODE_SINGLE,
        student_queue: [],
    });

    const isTeacher = data.role === "teacher";
    const isStudent = data.role === "student";

    const selectedStudentGradeLevel = useMemo(
        () => String(data.grade_level || "").trim(),
        [data.grade_level],
    );

    const modeLabel = useMemo(() => {
        if (isTeacher) {
            return "Add Teacher";
        }

        if (studentMode === STUDENT_MODE_MULTIPLE) {
            return "Add Multiple Student";
        }

        if (studentMode === STUDENT_MODE_CSV) {
            return "Add via CSV";
        }

        return "Add Student";
    }, [isTeacher, studentMode]);

    const pendingStudentProfiles = useMemo(() => {
        if (!isStudent) {
            return [];
        }

        if (studentMode === STUDENT_MODE_SINGLE) {
            const fullName = [data.first_name, data.middle_name, data.last_name]
                .filter(Boolean)
                .join(" ")
                .trim();

            if (!fullName && !String(data.lrn || "").trim()) {
                return [];
            }

            return [
                {
                    id: "single-student",
                    first_name: String(data.first_name || "").trim(),
                    middle_name: String(data.middle_name || "").trim(),
                    last_name: String(data.last_name || "").trim(),
                    full_name: fullName || "Student",
                    lrn: String(data.lrn || "").trim(),
                    parent_contact_number: String(
                        data.parent_contact_number || "",
                    ).trim(),
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
            parent_contact_number: String(
                queueItem.parent_contact_number || "",
            ).trim(),
        }));
    }, [
        isStudent,
        studentMode,
        data.first_name,
        data.middle_name,
        data.last_name,
        data.lrn,
        data.parent_contact_number,
        studentQueue,
    ]);

    const serverErrorList = useMemo(() => {
        if (!errors || typeof errors !== "object") {
            return [];
        }

        return Object.values(errors)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean);
    }, [errors]);

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
        if (open && !wasOpenRef.current) {
            const normalizedRole =
                initialRole === "teacher" ? "teacher" : "student";

            reset();
            clearErrors();
            setClientErrors({});

            setStep(STEP_USER_SELECTION);
            setMaxVisitedStep(STEP_USER_SELECTION);

            setStudentMode(STUDENT_MODE_SINGLE);
            setStudentDraft(emptyStudentDraft());
            setStudentQueue([]);
            setStudentCsvFileName("");

            setCreatedSummary(null);
            setCreatedStudentCredentials([]);
            setSelectedCreatedStudentId("");

            setData("role", normalizedRole);
            setData("grade_level", "");
            setData("student_mode", STUDENT_MODE_SINGLE);
            setData("student_queue", []);
        }

        wasOpenRef.current = open;
    }, [open, initialRole, reset, clearErrors, setData]);

    useEffect(() => {
        setMaxVisitedStep((previousMaxVisitedStep) =>
            Math.max(previousMaxVisitedStep, step),
        );
    }, [step]);

    useEffect(() => {
        setData("student_mode", studentMode);
    }, [studentMode, setData]);

    useEffect(() => {
        setData(
            "student_queue",
            studentQueue.map((queueItem) => ({
                first_name: queueItem.first_name,
                last_name: queueItem.last_name,
                middle_name: queueItem.middle_name || "",
                lrn: queueItem.lrn,
                parent_contact_number: queueItem.parent_contact_number || "",
            })),
        );
    }, [studentQueue, setData]);

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

        if (
            errorKeys.some(
                (field) =>
                    field === "first_name" ||
                    field === "last_name" ||
                    field === "middle_name" ||
                    field === "lrn" ||
                    field === "parent_contact_number" ||
                    field === "email" ||
                    field === "grade_level" ||
                    field === "role" ||
                    field === "student_mode" ||
                    field === "student_queue" ||
                    field.startsWith("student_queue."),
            )
        ) {
            setStep(STEP_PROFILE);
        }
    }, [open, errors, step]);

    const closeModal = () => {
        if (processing) {
            return;
        }

        reset();
        clearErrors();

        setStep(STEP_USER_SELECTION);
        setMaxVisitedStep(STEP_USER_SELECTION);

        setStudentMode(STUDENT_MODE_SINGLE);
        setStudentDraft(emptyStudentDraft());
        setStudentQueue([]);
        setStudentCsvFileName("");

        setCreatedSummary(null);
        setCreatedStudentCredentials([]);
        setSelectedCreatedStudentId("");

        setClientErrors({});
        onClose?.();
    };

    const handleRoleChange = (role) => {
        setData("role", role);
        setClientErrors({});

        if (role === "student") {
            setData("email", "");
            return;
        }

        setStudentMode(STUDENT_MODE_SINGLE);
        setStudentDraft(emptyStudentDraft());
        setStudentQueue([]);
        setStudentCsvFileName("");
        setData("student_queue", []);
        setData("lrn", "");
        setData("parent_contact_number", "");
        setData("grade_level", "");
    };

    const handleStudentModeChange = (mode) => {
        setStudentMode(mode);
        setStudentDraft(emptyStudentDraft());
        setStudentQueue([]);
        setStudentCsvFileName("");
        setData("student_queue", []);

        if (mode !== STUDENT_MODE_SINGLE) {
            setData("first_name", "");
            setData("last_name", "");
            setData("middle_name", "");
            setData("lrn", "");
            setData("parent_contact_number", "");
        }

        setClientErrors({});
    };

    const handleStudentGradeLevelChange = (gradeLevel) => {
        setData("grade_level", gradeLevel);
    };

    const validateStudentDraftForQueue = () => {
        const nextErrors = {};

        const firstName = String(studentDraft.first_name || "").trim();
        const lastName = String(studentDraft.last_name || "").trim();
        const middleName = String(studentDraft.middle_name || "").trim();
        const lrn = String(studentDraft.lrn || "").trim();
        const parentContactNumber = String(
            studentDraft.parent_contact_number || "",
        ).trim();

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
            parent_contact_number: parentContactNumber,
        };
    };

    const addStudentToQueue = () => {
        const studentPayload = validateStudentDraftForQueue();

        if (!studentPayload) {
            return;
        }

        setStudentQueue((previousQueue) => [...previousQueue, studentPayload]);
        setStudentDraft(emptyStudentDraft());
        setClientErrors({});
    };

    const removeQueuedStudent = (queueId) => {
        setStudentQueue((previousQueue) =>
            previousQueue.filter((queueItem) => queueItem.id !== queueId),
        );
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

        const duplicateLrnSet = new Set();
        const hasDuplicateLrn = rows.some((queueItem) => {
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

        setStudentQueue(rows);
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

        if (role === "student") {
            if (!selectedStudentGradeLevel) {
                nextErrors.grade_level =
                    "Grade level is required for students.";
            }

            if (studentMode === STUDENT_MODE_SINGLE) {
                if (!String(data.first_name || "").trim()) {
                    nextErrors.first_name = "First name is required.";
                }

                if (!String(data.last_name || "").trim()) {
                    nextErrors.last_name = "Last name is required.";
                }

                const lrn = String(data.lrn || "").trim();

                if (!lrn) {
                    nextErrors.lrn = "LRN is required.";
                } else if (lrn.length !== LRN_LENGTH) {
                    nextErrors.lrn = `LRN must be exactly ${LRN_LENGTH} characters.`;
                }

                setClientErrors(nextErrors);
                return Object.keys(nextErrors).length === 0;
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

        if (!String(data.email || "").trim()) {
            nextErrors.email = "Email address is required for teachers.";
        } else if (!EMAIL_FORMAT.test(String(data.email || "").trim())) {
            nextErrors.email = "Enter a valid email address.";
        }

        setClientErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateSecurityStep = () => {
        setClientErrors({});
        return true;
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
            setStep(STEP_SECURITY);
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

        if (isStudent && studentMode !== STUDENT_MODE_SINGLE) {
            payload = {
                role: "student",
                student_mode: studentMode,
                grade_level: selectedStudentGradeLevel || null,
                student_queue: studentQueue.map((queueItem) => ({
                    first_name: queueItem.first_name,
                    last_name: queueItem.last_name,
                    middle_name: queueItem.middle_name || "",
                    lrn: queueItem.lrn,
                    parent_contact_number:
                        queueItem.parent_contact_number || "",
                })),
            };
        } else if (isStudent) {
            payload = {
                first_name: data.first_name,
                last_name: data.last_name,
                middle_name: data.middle_name,
                lrn: data.lrn,
                parent_contact_number: data.parent_contact_number,
                role: "student",
                student_mode: STUDENT_MODE_SINGLE,
                grade_level: selectedStudentGradeLevel || null,
            };
        } else {
            payload = {
                first_name: data.first_name,
                last_name: data.last_name,
                middle_name: data.middle_name,
                email: data.email,
                role: "teacher",
            };
        }

        transform(() => payload);

        post(route("admin.users.store"), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                if (isStudent) {
                    const flashCredentials = Array.isArray(
                        page?.props?.flash?.created_student_credentials,
                    )
                        ? page.props.flash.created_student_credentials
                        : [];

                    const normalizedCredentials = flashCredentials.map(
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
                            password: credential.password || "",
                        }),
                    );

                    setCreatedSummary({
                        role: "Student",
                        mode: modeLabel,
                        grade_level: selectedStudentGradeLevel,
                    });

                    setCreatedStudentCredentials(normalizedCredentials);
                    setSelectedCreatedStudentId(
                        normalizedCredentials[0]
                            ? String(normalizedCredentials[0].id)
                            : "",
                    );
                    clearErrors();
                    setClientErrors({});
                    setStep(STEP_SUMMARY);
                    return;
                }

                setCreatedSummary({
                    role: "Teacher",
                    full_name: [
                        data.first_name,
                        data.middle_name,
                        data.last_name,
                    ]
                        .filter(Boolean)
                        .join(" "),
                    email: data.email,
                    department_name: department?.name || "",
                });
                clearErrors();
                setClientErrors({});
                setStep(STEP_SUMMARY);
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

            <div className="relative flex h-[calc(100vh-6rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                <div className="relative shrink-0 overflow-hidden border-b border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 dark:border-slate-700">
                    <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                    <button
                        type="button"
                        onClick={closeModal}
                        disabled={processing}
                        className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-blue-100 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-60"
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
                            <p className="text-xs text-blue-100">
                                Step {step} of {STEPS.length}:{" "}
                                {STEPS[step - 1]?.label}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 border-b border-blue-100 px-6 py-3 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-2">
                        {STEPS.map((wizardStep, stepIndex) => (
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

                <div className="min-h-0 flex-1 overflow-y-auto bg-blue-50/30 px-6 py-5 dark:bg-slate-900/40">
                    {step === STEP_USER_SELECTION && (
                        <div className="space-y-4 rounded-xl border border-blue-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                            <div>
                                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    User Selection
                                </p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
                                            onClick={() =>
                                                handleRoleChange(role)
                                            }
                                            className={`rounded-xl border p-4 text-left transition-all ${
                                                isSelected
                                                    ? "border-blue-400 bg-blue-50 shadow-sm dark:border-blue-600 dark:bg-blue-900/20"
                                                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-800"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                                    }`}
                                                >
                                                    <Icon size={18} />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {cfg.label}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {cfg.description}
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
                        <div className="space-y-4 rounded-xl border border-blue-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                            {isStudent && (
                                <>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                                                        ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                }`}
                                            >
                                                Add Student
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
                                                        ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                                                    studentMode ===
                                                    STUDENT_MODE_CSV
                                                        ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                }`}
                                            >
                                                Add via CSV
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Grade Level{" "}
                                            <span className="text-rose-500">
                                                *
                                            </span>
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
                                                                    ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                                                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                            }`}
                                                        >
                                                            Grade {gradeLevel}
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>

                                        {(errors.grade_level ||
                                            clientErrors.grade_level) && (
                                            <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                                                <Info size={12} />
                                                {errors.grade_level ||
                                                    clientErrors.grade_level}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {isStudent &&
                                studentMode === STUDENT_MODE_SINGLE && (
                                    <>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <Field
                                                label="First Name"
                                                icon={User}
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
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                />
                                            </Field>

                                            <Field
                                                label="Last Name"
                                                icon={User}
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
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                />
                                            </Field>
                                        </div>

                                        <Field
                                            label="Middle Name"
                                            icon={User}
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
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                            />
                                        </Field>

                                        <Field
                                            label="LRN"
                                            icon={Hash}
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
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                            />
                                        </Field>

                                        <Field
                                            label="Parent Contact Number"
                                            icon={Hash}
                                            optional
                                            error={errors.parent_contact_number}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    data.parent_contact_number ||
                                                    ""
                                                }
                                                onChange={(event) =>
                                                    setData(
                                                        "parent_contact_number",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="e.g., +639171234567"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                            />
                                        </Field>
                                    </>
                                )}

                            {isStudent &&
                                studentMode !== STUDENT_MODE_SINGLE && (
                                    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
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
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                    />

                                                    <input
                                                        type="text"
                                                        value={
                                                            studentDraft.parent_contact_number
                                                        }
                                                        onChange={(event) =>
                                                            setStudentDraft(
                                                                (
                                                                    previousDraft,
                                                                ) => ({
                                                                    ...previousDraft,
                                                                    parent_contact_number:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="Parent contact (optional)"
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={addStudentToQueue}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                                >
                                                    <UserPlus size={13} />
                                                    Add Queue
                                                </button>
                                            </>
                                        ) : (
                                            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                                    Upload CSV File
                                                </label>
                                                <input
                                                    type="file"
                                                    accept=".csv,text/csv"
                                                    onChange={
                                                        handleStudentCsvUpload
                                                    }
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                />
                                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                    Required headers:
                                                    first_name, last_name, lrn.
                                                    Optional: middle_name,
                                                    parent_contact_number.
                                                </p>
                                                {studentCsvFileName && (
                                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                                        Selected file:{" "}
                                                        {studentCsvFileName}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {(clientErrors.student_queue_first_name ||
                                            clientErrors.student_queue_last_name ||
                                            clientErrors.student_queue_lrn ||
                                            clientErrors.student_queue ||
                                            clientErrors.student_csv) && (
                                            <div className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-900 dark:bg-rose-900/20">
                                                {clientErrors.student_queue_first_name && (
                                                    <p className="text-xs text-rose-700 dark:text-rose-300">
                                                        {
                                                            clientErrors.student_queue_first_name
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.student_queue_last_name && (
                                                    <p className="text-xs text-rose-700 dark:text-rose-300">
                                                        {
                                                            clientErrors.student_queue_last_name
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.student_queue_lrn && (
                                                    <p className="text-xs text-rose-700 dark:text-rose-300">
                                                        {
                                                            clientErrors.student_queue_lrn
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.student_queue && (
                                                    <p className="text-xs text-rose-700 dark:text-rose-300">
                                                        {
                                                            clientErrors.student_queue
                                                        }
                                                    </p>
                                                )}
                                                {clientErrors.student_csv && (
                                                    <p className="text-xs text-rose-700 dark:text-rose-300">
                                                        {
                                                            clientErrors.student_csv
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                                Student Queue (
                                                {studentQueue.length})
                                            </p>
                                            <div className="max-h-52 space-y-2 overflow-y-auto">
                                                {studentQueue.length === 0 ? (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        No queued students yet.
                                                    </p>
                                                ) : (
                                                    studentQueue.map(
                                                        (queueItem) => (
                                                            <div
                                                                key={
                                                                    queueItem.id
                                                                }
                                                                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/40"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                                        {
                                                                            queueItem.first_name
                                                                        }{" "}
                                                                        {
                                                                            queueItem.last_name
                                                                        }
                                                                    </p>
                                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                                        LRN:{" "}
                                                                        {queueItem.lrn ||
                                                                            "-"}
                                                                    </p>
                                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                                        Parent:{" "}
                                                                        {queueItem.parent_contact_number ||
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

                            {isTeacher && (
                                <>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <Field
                                            label="First Name"
                                            icon={User}
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
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                            />
                                        </Field>

                                        <Field
                                            label="Last Name"
                                            icon={User}
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
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                            />
                                        </Field>
                                    </div>

                                    <Field
                                        label="Middle Name"
                                        icon={User}
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
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        />
                                    </Field>

                                    <Field
                                        label="Email Address"
                                        icon={Mail}
                                        required
                                        error={
                                            errors.email || clientErrors.email
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
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        />
                                    </Field>

                                    {department && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-300">
                                            Teacher will be created in
                                            department:{" "}
                                            <strong>{department.name}</strong>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {step === STEP_SECURITY && (
                        <div className="space-y-4 rounded-xl border border-blue-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                            {isTeacher ? (
                                <>
                                    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-900/20">
                                        <Info
                                            size={15}
                                            className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300"
                                        />
                                        <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                                            <span className="font-semibold">
                                                Teacher credentials are fully
                                                server-generated.
                                            </span>{" "}
                                            Temporary username and password are
                                            generated after account creation and
                                            sent to the teacher&apos;s email.
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-900/20">
                                        <AlertTriangle
                                            size={15}
                                            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300"
                                        />
                                        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                                            Teacher must create a new password
                                            on first login, then verify email
                                            before accessing the teacher portal.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-900/20">
                                    <Info
                                        size={15}
                                        className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300"
                                    />
                                    <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                                        Student credentials are generated during
                                        creation and will appear in the Summary
                                        step as QR-ready login credentials.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === STEP_REVIEW && (
                        <div className="space-y-4 rounded-xl border border-blue-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    Review User Details
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Confirm account details before creating user
                                    records.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Role
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {isTeacher ? "Teacher" : "Student"}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Mode
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {modeLabel}
                                    </p>
                                </div>
                            </div>

                            {isStudent && (
                                <>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Grade Level
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {selectedStudentGradeLevel
                                                ? `Grade ${selectedStudentGradeLevel}`
                                                : "None"}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Student Information (
                                            {pendingStudentProfiles.length})
                                        </p>

                                        {pendingStudentProfiles.length === 0 ? (
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
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
                                                            className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                                                        >
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
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
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                LRN:{" "}
                                                                {studentProfile.lrn ||
                                                                    "-"}
                                                            </p>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                Parent:{" "}
                                                                {studentProfile.parent_contact_number ||
                                                                    "-"}
                                                            </p>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {isTeacher && (
                                <>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                Full Name
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {[
                                                    data.first_name,
                                                    data.middle_name,
                                                    data.last_name,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ") || "-"}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                Email
                                            </p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                                {data.email || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    {department && (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                Department Scope
                                            </p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                                {department.name}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {serverErrorList.length > 0 && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900 dark:bg-rose-900/20">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                                        Validation Errors
                                    </p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700 dark:text-rose-300">
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
                        <div className="space-y-4 rounded-xl border border-blue-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                            {isStudent ? (
                                <>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            Student Account Summary
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Share these credentials with
                                            students and let them scan their QR
                                            to log in.
                                        </p>
                                    </div>

                                    {createdStudentCredentials.length === 0 ? (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                                            No created student credentials
                                            found.
                                        </div>
                                    ) : (
                                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
                                            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                                {createdStudentCredentials.map(
                                                    (credential) => {
                                                        const isActive =
                                                            String(
                                                                credential.id,
                                                            ) ===
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
                                                                        ? "border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/30"
                                                                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                                                                }`}
                                                            >
                                                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                    {
                                                                        credential.full_name
                                                                    }
                                                                </p>
                                                                <p className="truncate text-xs text-slate-600 dark:text-slate-400">
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
                                                <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                                                    <QRCodeSVG
                                                        value={
                                                            selectedCreatedStudentQrPayload
                                                        }
                                                        size={200}
                                                        includeMargin
                                                    />
                                                </div>

                                                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {selectedCreatedStudentCredential?.full_name ||
                                                            "-"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                        LRN:{" "}
                                                        {selectedCreatedStudentCredential?.lrn ||
                                                            "-"}
                                                    </p>
                                                    <p className="mt-1 truncate font-mono text-xs text-slate-700 dark:text-slate-300">
                                                        {selectedCreatedStudentCredential?.username ||
                                                            "-"}
                                                    </p>
                                                    <p className="mt-1 truncate font-mono text-xs text-slate-700 dark:text-slate-300">
                                                        {selectedCreatedStudentCredential?.password ||
                                                            "-"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-900/20">
                                        <CheckCircle
                                            size={15}
                                            className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300"
                                        />
                                        <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                                            Teacher account created
                                            successfully. Login credentials were
                                            sent to the teacher email.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                Full Name
                                            </p>
                                            <p className="text-sm text-slate-800 dark:text-slate-200">
                                                {createdSummary?.full_name ||
                                                    "-"}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                Email
                                            </p>
                                            <p className="text-sm text-slate-800 dark:text-slate-200">
                                                {createdSummary?.email || "-"}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-between border-t border-blue-100 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
                    <button
                        type="button"
                        onClick={goBack}
                        disabled={processing}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
                            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                        >
                            Next
                            <ChevronRight size={13} />
                        </button>
                    ) : step === STEP_REVIEW ? (
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                        >
                            <UserPlus size={13} />
                            {processing ? "Creating..." : "Create User"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={closeModal}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

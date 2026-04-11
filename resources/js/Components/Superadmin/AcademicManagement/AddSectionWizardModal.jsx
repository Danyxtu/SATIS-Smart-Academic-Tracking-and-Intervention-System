import { useEffect, useMemo, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Plus,
    Save,
    Search,
    Trash2,
    Upload,
    UserCheck,
    UserPlus,
    Users,
    X,
} from "lucide-react";

const WIZARD_STEPS = [
    {
        id: 1,
        title: "Section Details",
        description: "Track, department, grade level, section name, adviser",
    },
    {
        id: 2,
        title: "Students",
        description: "Assign existing or add new students",
    },
    {
        id: 3,
        title: "Summary",
        description: "Review and create section",
    },
];

const GRADE_LEVEL_OPTIONS = ["11", "12"];
const TRACK_OPTIONS = ["Academic", "TVL"];

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

const STEP_ONE_ERROR_FIELDS = [
    "track",
    "department_id",
    "advisor_teacher_id",
    "section_name",
    "grade_level",
    "school_year",
];

function FieldError({ message }) {
    if (!message) return null;

    return <p className="mt-1.5 text-xs text-rose-600">{message}</p>;
}

function WizardStep({ step, currentStep }) {
    const isActive = currentStep === step.id;
    const isComplete = currentStep > step.id;

    return (
        <div className="flex items-center gap-2">
            <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isComplete
                        ? "bg-emerald-600 text-white"
                        : isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-600"
                }`}
            >
                {isComplete ? <CheckCircle2 size={14} /> : step.id}
            </div>
            <div className="hidden sm:block">
                <p
                    className={`text-xs font-semibold ${
                        isActive ? "text-indigo-700" : "text-slate-600"
                    }`}
                >
                    {step.title}
                </p>
                <p className="text-[11px] text-slate-500">{step.description}</p>
            </div>
        </div>
    );
}

function emptyDraftStudent() {
    return {
        first_name: "",
        last_name: "",
        middle_name: "",
        lrn: "",
        personal_email: "",
    };
}

const CSV_HEADER_ALIASES = {
    student_name: ["studentname", "student", "name", "fullname", "full_name"],
    first_name: ["firstname", "first", "first_name"],
    last_name: ["lastname", "last", "surname", "last_name"],
    middle_name: ["middlename", "middle", "middle_name"],
    lrn: ["lrn", "learnerreferencenumber", "learnerreference"],
    personal_email: ["personalemail", "email", "personal_email"],
};

const normalizeCsvHeader = (value = "") =>
    String(value)
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const parseCsvLine = (line = "") => {
    const values = [];
    let currentValue = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
            if (inQuotes && line[index + 1] === '"') {
                currentValue += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }

            continue;
        }

        if (character === "," && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = "";
            continue;
        }

        currentValue += character;
    }

    values.push(currentValue.trim());

    return values;
};

const resolveCsvHeaderIndexes = (headerValues = []) => {
    const normalizedHeaderValues = headerValues.map(normalizeCsvHeader);

    const findIndex = (aliases = []) =>
        normalizedHeaderValues.findIndex((headerValue) =>
            aliases.includes(headerValue),
        );

    const indexes = {
        student_name: findIndex(CSV_HEADER_ALIASES.student_name),
        first_name: findIndex(CSV_HEADER_ALIASES.first_name),
        last_name: findIndex(CSV_HEADER_ALIASES.last_name),
        middle_name: findIndex(CSV_HEADER_ALIASES.middle_name),
        lrn: findIndex(CSV_HEADER_ALIASES.lrn),
        personal_email: findIndex(CSV_HEADER_ALIASES.personal_email),
    };

    const hasExplicitNameHeaders =
        indexes.first_name !== -1 && indexes.last_name !== -1;
    const hasSingleNameHeader = indexes.student_name !== -1;
    const hasRequiredHeaders =
        indexes.lrn !== -1 && (hasExplicitNameHeaders || hasSingleNameHeader);

    return {
        indexes,
        hasRequiredHeaders,
    };
};

const splitStudentFullName = (fullName = "") => {
    const normalizedName = String(fullName).replace(/\s+/g, " ").trim();

    if (!normalizedName) {
        return {
            first_name: "",
            middle_name: "",
            last_name: "",
        };
    }

    const parts = normalizedName.split(" ");

    if (parts.length === 1) {
        return {
            first_name: parts[0],
            middle_name: "",
            last_name: "",
        };
    }

    return {
        first_name: parts[0],
        middle_name: "",
        last_name: parts.slice(1).join(" "),
    };
};

const parseStudentsFromCsvText = (csvText, existingLrns = new Set()) => {
    const parsedRows = [];
    const parseErrors = [];

    const normalizedText = String(csvText || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();

    if (!normalizedText) {
        return {
            parsedRows,
            parseErrors: ["The uploaded CSV file is empty."],
        };
    }

    const lines = normalizedText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");

    if (lines.length === 0) {
        return {
            parsedRows,
            parseErrors: ["The uploaded CSV file is empty."],
        };
    }

    const firstRowValues = parseCsvLine(lines[0]);
    const { indexes, hasRequiredHeaders } =
        resolveCsvHeaderIndexes(firstRowValues);
    const useHeaderRow = hasRequiredHeaders;
    const startIndex = useHeaderRow ? 1 : 0;
    const seenLrns = new Set();

    for (let rowIndex = startIndex; rowIndex < lines.length; rowIndex += 1) {
        const lineNumber = rowIndex + 1;
        const rowValues = parseCsvLine(lines[rowIndex]);

        if (rowValues.every((value) => String(value || "").trim() === "")) {
            continue;
        }

        const fullNameFromHeader = useHeaderRow
            ? indexes.student_name !== -1
                ? String(rowValues[indexes.student_name] ?? "").trim()
                : ""
            : "";
        const splitName = splitStudentFullName(fullNameFromHeader);

        const firstName = useHeaderRow
            ? String(rowValues[indexes.first_name] ?? "").trim() ||
              splitName.first_name
            : String(rowValues[0] ?? "").trim();
        const lastName = useHeaderRow
            ? String(rowValues[indexes.last_name] ?? "").trim() ||
              splitName.last_name
            : String(rowValues[1] ?? "").trim();
        const lrn = useHeaderRow
            ? String(rowValues[indexes.lrn] ?? "").trim()
            : String(rowValues[2] ?? "").trim();
        const personalEmailRaw = useHeaderRow
            ? indexes.personal_email !== -1
                ? String(rowValues[indexes.personal_email] ?? "").trim()
                : ""
            : String(rowValues[3] ?? "").trim();
        const middleName = useHeaderRow
            ? indexes.middle_name !== -1
                ? String(rowValues[indexes.middle_name] ?? "").trim()
                : splitName.middle_name
            : String(rowValues[4] ?? "").trim();

        if (!firstName || !lastName || !lrn) {
            parseErrors.push(
                `Line ${lineNumber}: first_name, last_name, and lrn are required.`,
            );
            continue;
        }

        if (existingLrns.has(lrn) || seenLrns.has(lrn)) {
            parseErrors.push(`Line ${lineNumber}: duplicate lrn ${lrn}.`);
            continue;
        }

        seenLrns.add(lrn);

        parsedRows.push({
            id: crypto.randomUUID(),
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            lrn,
            personal_email: personalEmailRaw.toLowerCase(),
        });
    }

    if (useHeaderRow && lines.length === 1) {
        parseErrors.push("CSV contains headers but no student rows.");
    }

    return {
        parsedRows,
        parseErrors,
    };
};

const formatValidationFieldLabel = (field = "") => {
    if (field.startsWith("new_students.")) {
        const matched = field.match(/^new_students\.(\d+)\.(.+)$/);

        if (matched) {
            const rowNumber = Number(matched[1]) + 1;
            const attribute = matched[2].replace(/_/g, " ");
            return `New student #${rowNumber} (${attribute})`;
        }

        return "New students";
    }

    if (field.startsWith("assigned_student_ids.")) {
        const matched = field.match(/^assigned_student_ids\.(\d+)$/);

        if (matched) {
            const rowNumber = Number(matched[1]) + 1;
            return `Assigned student #${rowNumber}`;
        }

        return "Assigned students";
    }

    return field.replace(/_/g, " ");
};

const resolveStepFromValidationErrors = (validationErrors = {}) => {
    const keys = Object.keys(validationErrors || {});

    if (keys.length === 0) {
        return 3;
    }

    const hasStepOneErrors = keys.some((key) =>
        STEP_ONE_ERROR_FIELDS.some(
            (fieldName) => key === fieldName || key.startsWith(`${fieldName}.`),
        ),
    );

    if (hasStepOneErrors) {
        return 1;
    }

    const hasStepTwoErrors = keys.some(
        (key) =>
            key === "student_assignment" ||
            key === "assigned_student_ids" ||
            key.startsWith("assigned_student_ids.") ||
            key === "new_students" ||
            key.startsWith("new_students."),
    );

    if (hasStepTwoErrors) {
        return 2;
    }

    return 3;
};

export default function AddSectionWizardModal({
    isOpen,
    onClose,
    departments = [],
    teachers = [],
    currentSchoolYear = "",
    availableStudents = [],
}) {
    const initialFormState = useMemo(
        () => ({
            track: "Academic",
            department_id: "",
            advisor_teacher_id: "",
            section_name: "",
            grade_level: "",
            school_year: currentSchoolYear || "",
            assigned_student_ids: [],
            new_students: [],
        }),
        [currentSchoolYear],
    );

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm(initialFormState);

    const [step, setStep] = useState(1);
    const [wizardNotice, setWizardNotice] = useState("");
    const [departmentSearch, setDepartmentSearch] = useState("");

    const [existingSearch, setExistingSearch] = useState("");
    const [selectedExistingIds, setSelectedExistingIds] = useState([]);
    const [queuedExistingStudents, setQueuedExistingStudents] = useState([]);

    const [newStudentDraft, setNewStudentDraft] = useState(emptyDraftStudent());
    const [newStudentsQueue, setNewStudentsQueue] = useState([]);
    const [bulkLines, setBulkLines] = useState("");
    const [bulkImportErrors, setBulkImportErrors] = useState([]);

    const filteredDepartmentsByTrack = useMemo(
        () =>
            departments.filter(
                (department) =>
                    String(department.track || "Academic") ===
                    String(data.track || "Academic"),
            ),
        [departments, data.track],
    );

    const selectedDepartment = useMemo(
        () =>
            filteredDepartmentsByTrack.find(
                (department) =>
                    String(department.id) === String(data.department_id),
            ) || null,
        [filteredDepartmentsByTrack, data.department_id],
    );

    const departmentSearchMessage = useMemo(() => {
        if (!String(departmentSearch || "").trim()) {
            return "";
        }

        if (selectedDepartment) {
            return "";
        }

        return "Select a department from the loaded suggestions.";
    }, [departmentSearch, selectedDepartment]);

    const availableAdviserTeachers = useMemo(() => {
        if (!selectedDepartment) {
            return [];
        }

        return teachers.filter(
            (teacher) =>
                Number(teacher.department_id) === Number(selectedDepartment.id),
        );
    }, [teachers, selectedDepartment]);

    const gradeToken = useMemo(() => {
        const match = String(data.grade_level || "").match(/(\d{1,2})/);
        if (match?.[1]) {
            return match[1];
        }

        return String(data.grade_level || "").trim();
    }, [data.grade_level]);

    const sectionNamePreview = useMemo(() => {
        const sectionName = String(data.section_name || "").trim();
        if (!sectionName) {
            return "";
        }

        const prefix = gradeToken || "?";
        const departmentCode = selectedDepartment?.department_code || "DEPT";

        return `${prefix} - ${departmentCode} - ${sectionName}`;
    }, [data.section_name, gradeToken, selectedDepartment?.department_code]);

    const queuedExistingIdSet = useMemo(
        () => new Set(queuedExistingStudents.map((student) => student.id)),
        [queuedExistingStudents],
    );

    const filteredAvailableStudents = useMemo(() => {
        const keyword = existingSearch.trim().toLowerCase();

        return availableStudents.filter((student) => {
            if (queuedExistingIdSet.has(student.id)) {
                return false;
            }

            if (keyword === "") {
                return true;
            }

            const haystack = [
                student.student_name,
                student.lrn,
                student.grade_level,
                student.strand,
                student.personal_email,
                student.section_name,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(keyword);
        });
    }, [availableStudents, existingSearch, queuedExistingIdSet]);

    const selectedAvailableCount = useMemo(
        () =>
            selectedExistingIds.filter((id) =>
                filteredAvailableStudents.some((student) => student.id === id),
            ).length,
        [filteredAvailableStudents, selectedExistingIds],
    );

    const assignmentCount =
        queuedExistingStudents.length + newStudentsQueue.length;

    const stepOneIssues = useMemo(() => {
        const issues = [];

        if (!String(data.track || "").trim()) {
            issues.push("Track is required.");
        }

        if (!data.department_id || !selectedDepartment) {
            issues.push(
                "Department is required and must match a loaded option.",
            );
        }

        if (!String(data.section_name || "").trim()) {
            issues.push("Section name is required.");
        }

        if (!String(data.grade_level || "").trim()) {
            issues.push("Grade level is required.");
        }

        if (!String(currentSchoolYear || "").trim()) {
            issues.push(
                "Current school year is not configured in School Settings.",
            );
        }

        return issues;
    }, [
        data.track,
        data.department_id,
        data.grade_level,
        data.section_name,
        selectedDepartment,
        currentSchoolYear,
    ]);

    const summaryIssues = useMemo(() => {
        const issues = [...stepOneIssues];

        const lrnCounts = new Map();
        newStudentsQueue.forEach((student) => {
            const normalizedLrn = String(student.lrn || "").trim();
            if (!normalizedLrn) return;
            lrnCounts.set(
                normalizedLrn,
                (lrnCounts.get(normalizedLrn) || 0) + 1,
            );
        });

        const duplicateLrns = [...lrnCounts.entries()]
            .filter(([, count]) => count > 1)
            .map(([lrn]) => lrn);

        if (duplicateLrns.length > 0) {
            issues.push(
                `Duplicate LRNs in new student queue: ${duplicateLrns.join(", ")}`,
            );
        }

        return issues;
    }, [newStudentsQueue, stepOneIssues]);

    const serverValidationEntries = useMemo(
        () =>
            Object.entries(errors || {}).flatMap(([field, message]) => {
                const messages = Array.isArray(message) ? message : [message];

                return messages
                    .map((entry, index) => {
                        const normalizedMessage = String(entry || "").trim();

                        if (!normalizedMessage) {
                            return null;
                        }

                        return {
                            key: `${field}-${index}`,
                            field,
                            fieldLabel: formatValidationFieldLabel(field),
                            message: normalizedMessage,
                        };
                    })
                    .filter(Boolean);
            }),
        [errors],
    );

    const resetWizardState = () => {
        setStep(1);
        setWizardNotice("");
        setDepartmentSearch("");
        setExistingSearch("");
        setSelectedExistingIds([]);
        setQueuedExistingStudents([]);
        setNewStudentDraft(emptyDraftStudent());
        setNewStudentsQueue([]);
        setBulkLines("");
        setBulkImportErrors([]);
        clearErrors();
        reset();
        setData({ ...initialFormState });
    };

    const closeWizard = () => {
        if (processing) {
            return;
        }

        resetWizardState();
        onClose?.();
    };

    useEffect(() => {
        setData(
            "assigned_student_ids",
            queuedExistingStudents.map((student) => student.id),
        );
    }, [queuedExistingStudents, setData]);

    useEffect(() => {
        setData(
            "new_students",
            newStudentsQueue.map((student) => ({
                first_name: student.first_name,
                last_name: student.last_name,
                middle_name: student.middle_name || null,
                lrn: student.lrn,
                personal_email: student.personal_email || null,
            })),
        );
    }, [newStudentsQueue, setData]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setData("school_year", currentSchoolYear || "");
    }, [isOpen, currentSchoolYear, setData]);

    useEffect(() => {
        if (!data.department_id) {
            return;
        }

        const stillLoaded = filteredDepartmentsByTrack.some(
            (department) =>
                String(department.id) === String(data.department_id),
        );

        if (!stillLoaded) {
            setData("department_id", "");
            setData("advisor_teacher_id", "");
            setDepartmentSearch("");
        }
    }, [filteredDepartmentsByTrack, data.department_id, setData]);

    useEffect(() => {
        if (!data.advisor_teacher_id) {
            return;
        }

        const adviserStillAvailable = availableAdviserTeachers.some(
            (teacher) => String(teacher.id) === String(data.advisor_teacher_id),
        );

        if (!adviserStillAvailable) {
            setData("advisor_teacher_id", "");
        }
    }, [availableAdviserTeachers, data.advisor_teacher_id, setData]);

    const handleTrackChange = (track) => {
        setData("track", track);
        setData("department_id", "");
        setData("advisor_teacher_id", "");
        setDepartmentSearch("");
    };

    const handleDepartmentSearchChange = (value) => {
        setDepartmentSearch(value);

        const matchedDepartment = findDepartmentFromSearch(
            filteredDepartmentsByTrack,
            value,
        );

        if (matchedDepartment) {
            setData("department_id", String(matchedDepartment.id));
            return;
        }

        setData("department_id", "");
        setData("advisor_teacher_id", "");
    };

    const handleNextStep = () => {
        if (step === 1 && stepOneIssues.length > 0) {
            setWizardNotice(
                "Fix section details before moving to the next step.",
            );
            return;
        }

        setWizardNotice("");
        setStep((previousStep) => Math.min(previousStep + 1, 3));
    };

    const handlePreviousStep = () => {
        setWizardNotice("");
        setStep((previousStep) => Math.max(previousStep - 1, 1));
    };

    const toggleExistingSelection = (studentId) => {
        setSelectedExistingIds((previousIds) =>
            previousIds.includes(studentId)
                ? previousIds.filter((id) => id !== studentId)
                : [...previousIds, studentId],
        );
    };

    const queueSingleExisting = (student) => {
        setQueuedExistingStudents((previousStudents) => {
            if (previousStudents.some((item) => item.id === student.id)) {
                return previousStudents;
            }

            return [...previousStudents, student];
        });

        setSelectedExistingIds((previousIds) =>
            previousIds.filter((id) => id !== student.id),
        );
    };

    const queueSelectedExisting = () => {
        if (selectedExistingIds.length === 0) {
            setWizardNotice("Select students first before bulk assigning.");
            return;
        }

        const selectedIdSet = new Set(selectedExistingIds);
        const studentsToAdd = filteredAvailableStudents.filter((student) =>
            selectedIdSet.has(student.id),
        );

        setQueuedExistingStudents((previousStudents) => {
            const currentIds = new Set(
                previousStudents.map((student) => student.id),
            );
            const nextStudents = studentsToAdd.filter(
                (student) => !currentIds.has(student.id),
            );

            return [...previousStudents, ...nextStudents];
        });

        setSelectedExistingIds([]);
        setWizardNotice("");
    };

    const removeQueuedExisting = (studentId) => {
        setQueuedExistingStudents((previousStudents) =>
            previousStudents.filter((student) => student.id !== studentId),
        );
    };

    const queueSingleNewStudent = () => {
        const firstName = newStudentDraft.first_name.trim();
        const lastName = newStudentDraft.last_name.trim();
        const middleName = newStudentDraft.middle_name.trim();
        const lrn = newStudentDraft.lrn.trim();
        const personalEmail = newStudentDraft.personal_email
            .trim()
            .toLowerCase();

        if (!firstName || !lastName || !lrn) {
            setWizardNotice(
                "Single add requires first name, last name, and LRN.",
            );
            return;
        }

        if (newStudentsQueue.some((student) => student.lrn === lrn)) {
            setWizardNotice(`LRN ${lrn} already exists in the queue.`);
            return;
        }

        setNewStudentsQueue((previousStudents) => [
            ...previousStudents,
            {
                id: crypto.randomUUID(),
                first_name: firstName,
                last_name: lastName,
                middle_name: middleName,
                lrn,
                personal_email: personalEmail,
            },
        ]);

        setNewStudentDraft(emptyDraftStudent());
        setWizardNotice("");
    };

    const queueBulkNewStudents = () => {
        const lines = bulkLines
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line !== "");

        if (lines.length === 0) {
            setWizardNotice("Paste at least one row to bulk import.");
            return;
        }

        const parseErrors = [];
        const parsedRows = [];

        lines.forEach((line, index) => {
            const parts = parseCsvLine(line);

            if (parts.length < 3) {
                parseErrors.push(
                    `Line ${index + 1}: Use first_name,last_name,lrn,email(optional),middle_name(optional).`,
                );
                return;
            }

            const [
                firstName,
                lastName,
                lrn,
                personalEmail = "",
                middleName = "",
            ] = parts;

            if (!firstName || !lastName || !lrn) {
                parseErrors.push(
                    `Line ${index + 1}: first name, last name, and lrn are required.`,
                );
                return;
            }

            parsedRows.push({
                id: crypto.randomUUID(),
                first_name: firstName,
                last_name: lastName,
                middle_name: middleName,
                lrn,
                personal_email: personalEmail.toLowerCase(),
            });
        });

        const existingLrnSet = new Set(
            newStudentsQueue.map((student) => student.lrn),
        );

        const dedupedRows = parsedRows.filter((row) => {
            if (existingLrnSet.has(row.lrn)) {
                parseErrors.push(`Skipped duplicate lrn: ${row.lrn}.`);
                return false;
            }

            existingLrnSet.add(row.lrn);
            return true;
        });

        if (dedupedRows.length > 0) {
            setNewStudentsQueue((previousStudents) => [
                ...previousStudents,
                ...dedupedRows,
            ]);
            setBulkLines("");
        }

        setBulkImportErrors(parseErrors);

        if (parseErrors.length === 0) {
            setWizardNotice("");
        }
    };

    const handleCsvFileImport = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }

        const fileName = String(file.name || "").toLowerCase();
        const isCsvFile = fileName.endsWith(".csv") || file.type === "text/csv";

        if (!isCsvFile) {
            setBulkImportErrors(["Please upload a valid CSV file."]);
            setWizardNotice("CSV import failed. Invalid file type.");
            return;
        }

        try {
            const csvText = await file.text();
            const existingLrns = new Set(
                newStudentsQueue.map((student) => student.lrn),
            );
            const { parsedRows, parseErrors } = parseStudentsFromCsvText(
                csvText,
                existingLrns,
            );

            if (parsedRows.length > 0) {
                setNewStudentsQueue((previousStudents) => [
                    ...previousStudents,
                    ...parsedRows,
                ]);
            }

            setBulkImportErrors(parseErrors);

            if (parsedRows.length > 0) {
                const importedLabel =
                    parsedRows.length === 1 ? "student" : "students";
                const skippedLabel = parseErrors.length === 1 ? "row" : "rows";
                setWizardNotice(
                    parseErrors.length > 0
                        ? `Imported ${parsedRows.length} ${importedLabel} from ${file.name}. ${parseErrors.length} ${skippedLabel} skipped.`
                        : `Imported ${parsedRows.length} ${importedLabel} from ${file.name}.`,
                );
                return;
            }

            setWizardNotice(
                `No students were imported from ${file.name}. Check the errors below.`,
            );
        } catch (error) {
            setBulkImportErrors([
                "Unable to read the CSV file. Please try again.",
            ]);
            setWizardNotice("CSV import failed. Unable to read the file.");
        }
    };

    const removeQueuedNewStudent = (studentId) => {
        setNewStudentsQueue((previousStudents) =>
            previousStudents.filter((student) => student.id !== studentId),
        );
    };

    const createSection = () => {
        clearErrors();

        if (summaryIssues.length > 0) {
            setWizardNotice("Fix summary issues before creating the section.");
            return;
        }

        post(route("superadmin.academic-management.sections.store"), {
            preserveScroll: true,
            onSuccess: () => {
                resetWizardState();
                onClose?.();
            },
            onError: (validationErrors) => {
                setStep(resolveStepFromValidationErrors(validationErrors));
                setWizardNotice(
                    "Unable to save section. Review validation messages below.",
                );
            },
        });
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                onClick={closeWizard}
            />

            <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
                <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-200">
                                <Plus size={16} className="text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900">
                                    Add Section Wizard
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Simplified section setup with student
                                    assignment
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={closeWizard}
                            disabled={processing}
                            className="z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex flex-wrap items-center gap-4">
                            {WIZARD_STEPS.map((wizardStep) => (
                                <WizardStep
                                    key={wizardStep.id}
                                    step={wizardStep}
                                    currentStep={step}
                                />
                            ))}
                        </div>
                    </div>

                    {wizardNotice && (
                        <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 sm:mx-6">
                            {wizardNotice}
                        </div>
                    )}

                    {serverValidationEntries.length > 0 && (
                        <div className="mx-4 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-6">
                            <p className="font-semibold">Validation errors:</p>
                            <ul className="mt-1 space-y-1">
                                {serverValidationEntries.map((entry) => (
                                    <li key={entry.key}>
                                        -{" "}
                                        <span className="font-medium">
                                            {entry.fieldLabel}:
                                        </span>{" "}
                                        {entry.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="max-h-[72vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                            Track{" "}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={data.track}
                                            onChange={(event) =>
                                                handleTrackChange(
                                                    event.target.value,
                                                )
                                            }
                                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                                errors.track
                                                    ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                    : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            {TRACK_OPTIONS.map((track) => (
                                                <option
                                                    key={track}
                                                    value={track}
                                                >
                                                    {track}
                                                </option>
                                            ))}
                                        </select>
                                        <FieldError message={errors.track} />
                                        <p className="mt-1 text-xs text-indigo-600">
                                            {data.track === "TVL"
                                                ? "All departments are loaded in TVL Track."
                                                : "All departments are loaded in Acedemic Track."}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                            Department{" "}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            list="section-department-options"
                                            value={departmentSearch}
                                            onChange={(event) =>
                                                handleDepartmentSearchChange(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={`Type to search ${String(data.track || "").toLowerCase()} departments`}
                                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                                errors.department_id ||
                                                departmentSearchMessage
                                                    ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                    : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        />
                                        <datalist id="section-department-options">
                                            {filteredDepartmentsByTrack.map(
                                                (department) => (
                                                    <option
                                                        key={department.id}
                                                        value={formatDepartmentOptionLabel(
                                                            department,
                                                        )}
                                                    />
                                                ),
                                            )}
                                        </datalist>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Type code or full name, then select
                                            from loaded suggestions.
                                        </p>
                                        <FieldError
                                            message={
                                                errors.department_id ||
                                                departmentSearchMessage
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                            Grade Level{" "}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={data.grade_level}
                                            onChange={(event) =>
                                                setData(
                                                    "grade_level",
                                                    event.target.value,
                                                )
                                            }
                                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                                errors.grade_level
                                                    ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                    : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="">
                                                Select grade level
                                            </option>
                                            {GRADE_LEVEL_OPTIONS.map(
                                                (grade) => (
                                                    <option
                                                        key={grade}
                                                        value={grade}
                                                    >
                                                        {`Grade ${grade}`}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <FieldError
                                            message={errors.grade_level}
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                            Section Name{" "}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.section_name}
                                            onChange={(event) =>
                                                setData(
                                                    "section_name",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="e.g., Einstein"
                                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 ${
                                                errors.section_name
                                                    ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                    : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        />
                                        <FieldError
                                            message={errors.section_name}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium text-slate-800">
                                            Adviser Teacher
                                        </label>
                                        <select
                                            value={data.advisor_teacher_id}
                                            onChange={(event) =>
                                                setData(
                                                    "advisor_teacher_id",
                                                    event.target.value,
                                                )
                                            }
                                            disabled={!selectedDepartment}
                                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                                                errors.advisor_teacher_id
                                                    ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
                                                    : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="">
                                                {selectedDepartment
                                                    ? "Unassigned (N/A)"
                                                    : "Select department first"}
                                            </option>
                                            {availableAdviserTeachers.map(
                                                (teacher) => (
                                                    <option
                                                        key={teacher.id}
                                                        value={teacher.id}
                                                    >
                                                        {teacher.name}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <FieldError
                                            message={errors.advisor_teacher_id}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                                        Section Name Preview (Backend)
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-indigo-900">
                                        {sectionNamePreview ||
                                            "Fill in required fields to preview."}
                                    </p>
                                </div>

                                {stepOneIssues.length > 0 && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                                            Fix Before Next Step
                                        </p>
                                        <ul className="space-y-1 text-sm text-amber-700">
                                            {stepOneIssues.map((issue) => (
                                                <li key={issue}>- {issue}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                                <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Assign Existing Students
                                            </h3>
                                            <p className="text-xs text-slate-600">
                                                Super Admin can assign any
                                                student, even if currently
                                                enrolled in another section.
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                                            Pool:{" "}
                                            {filteredAvailableStudents.length}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search
                                                size={14}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                            <input
                                                type="text"
                                                value={existingSearch}
                                                onChange={(event) =>
                                                    setExistingSearch(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Search student, lrn, section"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={queueSelectedExisting}
                                            className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                                        >
                                            <UserCheck size={13} />
                                            Bulk Assign (
                                            {selectedAvailableCount})
                                        </button>
                                    </div>

                                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
                                        {filteredAvailableStudents.length ===
                                        0 ? (
                                            <p className="px-2 py-5 text-center text-sm text-slate-500">
                                                No matching students.
                                            </p>
                                        ) : (
                                            filteredAvailableStudents.map(
                                                (student) => {
                                                    const checked =
                                                        selectedExistingIds.includes(
                                                            student.id,
                                                        );

                                                    return (
                                                        <div
                                                            key={student.id}
                                                            className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    checked
                                                                }
                                                                onChange={() =>
                                                                    toggleExistingSelection(
                                                                        student.id,
                                                                    )
                                                                }
                                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-medium text-slate-800">
                                                                    {
                                                                        student.student_name
                                                                    }
                                                                </p>
                                                                <p className="truncate text-xs text-slate-500">
                                                                    LRN:{" "}
                                                                    {student.lrn ||
                                                                        "-"}{" "}
                                                                    | Current:{" "}
                                                                    {student.section_name ||
                                                                        "No Section"}
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    queueSingleExisting(
                                                                        student,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100"
                                                                title="Assign"
                                                            >
                                                                <Plus
                                                                    size={13}
                                                                />
                                                            </button>
                                                        </div>
                                                    );
                                                },
                                            )
                                        )}
                                    </div>

                                    <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Queued Existing Students (
                                            {queuedExistingStudents.length})
                                        </p>
                                        <div className="max-h-48 space-y-2 overflow-y-auto">
                                            {queuedExistingStudents.length ===
                                            0 ? (
                                                <p className="text-xs text-slate-500">
                                                    No existing students queued.
                                                </p>
                                            ) : (
                                                queuedExistingStudents.map(
                                                    (student) => (
                                                        <div
                                                            key={student.id}
                                                            className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium text-slate-800">
                                                                    {
                                                                        student.student_name
                                                                    }
                                                                </p>
                                                                <p className="truncate text-xs text-slate-500">
                                                                    LRN:{" "}
                                                                    {student.lrn ||
                                                                        "-"}
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeQueuedExisting(
                                                                        student.id,
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

                                <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Add New Students
                                        </h3>
                                        <p className="text-xs text-slate-600">
                                            Add students one by one or import
                                            rows in bulk.
                                        </p>
                                    </div>

                                    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Single Add
                                        </p>
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                            <input
                                                type="text"
                                                value={
                                                    newStudentDraft.first_name
                                                }
                                                onChange={(event) =>
                                                    setNewStudentDraft(
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
                                                value={
                                                    newStudentDraft.last_name
                                                }
                                                onChange={(event) =>
                                                    setNewStudentDraft(
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
                                                value={
                                                    newStudentDraft.middle_name
                                                }
                                                onChange={(event) =>
                                                    setNewStudentDraft(
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
                                                type="text"
                                                value={newStudentDraft.lrn}
                                                onChange={(event) =>
                                                    setNewStudentDraft(
                                                        (previousDraft) => ({
                                                            ...previousDraft,
                                                            lrn: event.target
                                                                .value,
                                                        }),
                                                    )
                                                }
                                                placeholder="LRN"
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            />
                                            <input
                                                type="email"
                                                value={
                                                    newStudentDraft.personal_email
                                                }
                                                onChange={(event) =>
                                                    setNewStudentDraft(
                                                        (previousDraft) => ({
                                                            ...previousDraft,
                                                            personal_email:
                                                                event.target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                                placeholder="Personal email (optional)"
                                                className="md:col-span-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={queueSingleNewStudent}
                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                        >
                                            <UserPlus size={13} />
                                            Add Student
                                        </button>
                                    </div>

                                    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Bulk Add
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                                                <Upload size={13} />
                                                Upload CSV File
                                                <input
                                                    type="file"
                                                    accept=".csv,text/csv"
                                                    className="hidden"
                                                    onChange={
                                                        handleCsvFileImport
                                                    }
                                                    disabled={processing}
                                                />
                                            </label>
                                            <p className="text-xs text-slate-500">
                                                Required: lrn plus either
                                                student_name or
                                                first_name/last_name. Optional:
                                                personal_email and middle_name.
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Format:
                                            student_name,lrn,email(optional) or
                                            first_name,last_name,lrn,email(optional),middle_name(optional)
                                        </p>
                                        <textarea
                                            value={bulkLines}
                                            onChange={(event) =>
                                                setBulkLines(event.target.value)
                                            }
                                            rows={5}
                                            placeholder={
                                                "Juan,Dela Cruz,123456789012,,\nMaria,Santos,123456789013,maria@email.com,"
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={queueBulkNewStudents}
                                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                                        >
                                            <Upload size={13} />
                                            Import Rows
                                        </button>
                                        {bulkImportErrors.length > 0 && (
                                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                                <ul className="space-y-1 text-xs text-amber-700">
                                                    {bulkImportErrors.map(
                                                        (error) => (
                                                            <li key={error}>
                                                                - {error}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Queued New Students (
                                            {newStudentsQueue.length})
                                        </p>
                                        <div className="max-h-48 space-y-2 overflow-y-auto">
                                            {newStudentsQueue.length === 0 ? (
                                                <p className="text-xs text-slate-500">
                                                    No new students queued.
                                                </p>
                                            ) : (
                                                newStudentsQueue.map(
                                                    (student) => (
                                                        <div
                                                            key={student.id}
                                                            className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium text-slate-800">
                                                                    {
                                                                        student.first_name
                                                                    }{" "}
                                                                    {
                                                                        student.last_name
                                                                    }
                                                                </p>
                                                                <p className="truncate text-xs text-slate-500">
                                                                    LRN:{" "}
                                                                    {
                                                                        student.lrn
                                                                    }
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeQueuedNewStudent(
                                                                        student.id,
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
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                                        Section Output Preview
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-indigo-900">
                                        {sectionNamePreview ||
                                            "Missing required values"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                        <p className="text-xs text-slate-500">
                                            Department
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {selectedDepartment
                                                ? `${selectedDepartment.department_code} - ${selectedDepartment.department_name}`
                                                : "-"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                        <p className="text-xs text-slate-500">
                                            Track
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {data.track || "-"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                        <p className="text-xs text-slate-500">
                                            Grade Level
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {data.grade_level || "-"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                        <p className="text-xs text-slate-500">
                                            Students
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {assignmentCount}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                        <p className="text-xs text-slate-500">
                                            Adviser
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {availableAdviserTeachers.find(
                                                (teacher) =>
                                                    String(teacher.id) ===
                                                    String(
                                                        data.advisor_teacher_id,
                                                    ),
                                            )?.name || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                    <div className="rounded-xl border border-slate-100 bg-white p-3">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Existing Students (
                                            {queuedExistingStudents.length})
                                        </p>
                                        <div className="max-h-44 space-y-1.5 overflow-y-auto">
                                            {queuedExistingStudents.length ===
                                            0 ? (
                                                <p className="text-xs text-slate-500">
                                                    No students queued.
                                                </p>
                                            ) : (
                                                queuedExistingStudents.map(
                                                    (student) => (
                                                        <p
                                                            key={student.id}
                                                            className="rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                                                        >
                                                            {
                                                                student.student_name
                                                            }{" "}
                                                            (
                                                            {student.lrn || "-"}
                                                            )
                                                        </p>
                                                    ),
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-white p-3">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            New Students (
                                            {newStudentsQueue.length})
                                        </p>
                                        <div className="max-h-44 space-y-1.5 overflow-y-auto">
                                            {newStudentsQueue.length === 0 ? (
                                                <p className="text-xs text-slate-500">
                                                    No students queued.
                                                </p>
                                            ) : (
                                                newStudentsQueue.map(
                                                    (student) => (
                                                        <p
                                                            key={student.id}
                                                            className="rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                                                        >
                                                            {student.first_name}{" "}
                                                            {student.last_name}{" "}
                                                            ({student.lrn})
                                                        </p>
                                                    ),
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {summaryIssues.length > 0 && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                        <div className="mb-2 flex items-center gap-2 text-amber-700">
                                            <AlertTriangle size={14} />
                                            <p className="text-xs font-semibold uppercase tracking-wide">
                                                Resolve Before Save
                                            </p>
                                        </div>
                                        <ul className="space-y-1 text-sm text-amber-700">
                                            {summaryIssues.map((issue) => (
                                                <li key={issue}>- {issue}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {(errors.student_assignment ||
                                    errors.assigned_student_ids ||
                                    errors.new_students ||
                                    Object.keys(errors || {}).some(
                                        (key) =>
                                            key.startsWith("new_students.") ||
                                            key.startsWith(
                                                "assigned_student_ids.",
                                            ),
                                    )) && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        <p className="font-semibold">
                                            Validation errors:
                                        </p>
                                        {errors.student_assignment && (
                                            <p>{errors.student_assignment}</p>
                                        )}
                                        {errors.assigned_student_ids && (
                                            <p>{errors.assigned_student_ids}</p>
                                        )}
                                        {errors.new_students && (
                                            <p>{errors.new_students}</p>
                                        )}
                                        {Object.entries(errors || {})
                                            .filter(
                                                ([key]) =>
                                                    key.startsWith(
                                                        "new_students.",
                                                    ) ||
                                                    key.startsWith(
                                                        "assigned_student_ids.",
                                                    ),
                                            )
                                            .map(([key, message]) => {
                                                const messages = Array.isArray(
                                                    message,
                                                )
                                                    ? message
                                                    : [message];

                                                return messages.map(
                                                    (entry, index) => (
                                                        <p
                                                            key={`${key}-${index}`}
                                                        >
                                                            {formatValidationFieldLabel(
                                                                key,
                                                            )}
                                                            : {entry}
                                                        </p>
                                                    ),
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                        <button
                            type="button"
                            onClick={closeWizard}
                            disabled={processing}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                        >
                            Close
                        </button>

                        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handlePreviousStep}
                                    disabled={processing}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                                >
                                    <ChevronLeft size={14} />
                                    Back
                                </button>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    disabled={processing}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
                                >
                                    Next
                                    <ChevronRight size={14} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={createSection}
                                    disabled={processing}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
                                >
                                    {processing ? (
                                        <>
                                            <svg
                                                className="h-3.5 w-3.5 animate-spin"
                                                viewBox="0 0 24 24"
                                                fill="none"
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
                                                    d="M4 12a8 8 0 018-8v8z"
                                                />
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            Create Section
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

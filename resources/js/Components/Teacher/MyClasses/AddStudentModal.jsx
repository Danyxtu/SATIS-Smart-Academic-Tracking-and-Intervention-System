import { useEffect, useMemo } from "react";
import { useForm } from "@inertiajs/react";
import { X } from "lucide-react";

const LRN_LENGTH = 12;
const INVALID_ZERO_LRN = "000000000000";
const FIELD_CLASS =
    "block w-full h-9 rounded-sm border border-slate-300 bg-white px-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/80";

const AddStudentModal = ({
    subjectId,
    subjectLabel,
    existingLrns = [],
    onClose,
    onSuccess,
}) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: "",
        last_name: "",
        middle_initial: "",
        student_name: "",
        lrn: "",
        personal_email: "",
    });

    const normalizedFirstName = data.first_name.replace(/\s+/g, " ").trim();
    const normalizedLastName = data.last_name.replace(/\s+/g, " ").trim();
    const normalizedMiddleInitial = data.middle_initial.trim().toUpperCase();
    const studentNamePayload = [
        normalizedFirstName,
        normalizedLastName,
        normalizedMiddleInitial,
    ]
        .filter(Boolean)
        .join(" ");

    useEffect(() => {
        if (data.student_name !== studentNamePayload) {
            setData("student_name", studentNamePayload);
        }
    }, [studentNamePayload, data.student_name, setData]);

    const normalizedExistingLrns = useMemo(
        () =>
            new Set(
                existingLrns
                    .map((lrn) => String(lrn ?? "").replace(/\D/g, ""))
                    .filter(Boolean),
            ),
        [existingLrns],
    );

    const handleClose = () => {
        reset();
        onClose();
    };

    const firstNameClientError =
        normalizedFirstName && /\d/.test(normalizedFirstName)
            ? "First name cannot contain numbers."
            : "";
    const lastNameClientError =
        normalizedLastName && /\d/.test(normalizedLastName)
            ? "Last name cannot contain numbers."
            : "";
    const nameClientError = firstNameClientError || lastNameClientError;

    const normalizedLrn = data.lrn.replace(/\D/g, "");
    const lrnClientError =
        normalizedLrn.length > 0 && normalizedLrn.length !== LRN_LENGTH
            ? "LRN must be exactly 12 digits."
            : normalizedLrn === INVALID_ZERO_LRN
              ? "LRN cannot be 000000000000."
              : normalizedExistingLrns.has(normalizedLrn)
                ? "This LRN already exists in the class list."
                : "";

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!subjectId || lrnClientError || nameClientError) return;

        post(route("teacher.classes.students.store", subjectId), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => {
                onSuccess?.();
                handleClose();
            },
        });
    };

    const canSubmit = Boolean(
        subjectId &&
        normalizedFirstName &&
        normalizedLastName &&
        normalizedLrn.length === LRN_LENGTH &&
        !nameClientError &&
        !lrnClientError,
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center gap-3 bg-gradient-to-r from-slate-50 to-indigo-50 px-5 py-4 border-b border-slate-200">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                Add Student
                            </h3>
                            {subjectLabel && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {subjectLabel}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-slate-600 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Name *
                            </label>
                            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <input
                                        type="text"
                                        name="first_name"
                                        required
                                        className={FIELD_CLASS}
                                        value={data.first_name}
                                        onChange={(e) =>
                                            setData(
                                                "first_name",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="First Name"
                                    />
                                    {firstNameClientError && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {firstNameClientError}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        name="last_name"
                                        required
                                        className={FIELD_CLASS}
                                        value={data.last_name}
                                        onChange={(e) =>
                                            setData("last_name", e.target.value)
                                        }
                                        placeholder="Last Name"
                                    />
                                    {lastNameClientError && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {lastNameClientError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 max-w-[180px]">
                                <input
                                    type="text"
                                    name="middle_initial"
                                    className={`${FIELD_CLASS} uppercase`}
                                    value={data.middle_initial}
                                    onChange={(e) =>
                                        setData(
                                            "middle_initial",
                                            e.target.value
                                                .replace(/[^a-zA-Z]/g, "")
                                                .slice(0, 1)
                                                .toUpperCase(),
                                        )
                                    }
                                    maxLength={1}
                                    placeholder="Middle Initial"
                                />
                            </div>

                            {!nameClientError && errors.student_name && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.student_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                LRN (Learner Reference Number) *
                            </label>
                            <input
                                type="text"
                                name="lrn"
                                required
                                className={`mt-1 ${FIELD_CLASS}`}
                                value={data.lrn}
                                onChange={(e) =>
                                    setData(
                                        "lrn",
                                        e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, LRN_LENGTH),
                                    )
                                }
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={LRN_LENGTH}
                                minLength={LRN_LENGTH}
                                pattern="[0-9]{12}"
                                placeholder="e.g., 123456789012"
                            />
                            {lrnClientError ? (
                                <p className="text-xs text-red-600 mt-1">
                                    {lrnClientError}
                                </p>
                            ) : (
                                errors.lrn && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.lrn}
                                    </p>
                                )
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Personal Email (optional)
                            </label>
                            <input
                                type="email"
                                name="personal_email"
                                className={`mt-1 ${FIELD_CLASS}`}
                                value={data.personal_email}
                                onChange={(e) =>
                                    setData("personal_email", e.target.value)
                                }
                                placeholder="e.g., student@example.com"
                            />
                            <p className="mt-1 text-[11px] text-slate-500">
                                Username is generated automatically and used as
                                the student login credential.
                            </p>
                            {errors.personal_email && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.personal_email}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50/80 gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="bg-white h-9 px-4 border border-slate-300 rounded-sm shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-indigo-600 h-9 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                            disabled={!canSubmit || processing}
                        >
                            {processing ? "Adding…" : "Add Student"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;

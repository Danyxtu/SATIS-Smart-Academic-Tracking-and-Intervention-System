import axios from "axios";
import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Loader2, Search, UserRound, X } from "lucide-react";

const LRN_LENGTH = 12;
const INVALID_ZERO_LRN = "000000000000";
const FIELD_CLASS =
    "block w-full h-9 rounded-sm border border-slate-300 bg-white px-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/80";

const AddStudentModal = ({ subjectId, subjectLabel, onClose, onSuccess }) => {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        setError,
        clearErrors,
    } = useForm({
        lrn: "",
    });
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [searchError, setSearchError] = useState("");

    const normalizedLrn = data.lrn.replace(/\D/g, "");
    const lrnClientError =
        normalizedLrn.length > 0 && normalizedLrn.length !== LRN_LENGTH
            ? "LRN must be exactly 12 digits."
            : normalizedLrn === INVALID_ZERO_LRN
              ? "LRN cannot be 000000000000."
              : "";

    const resetSearchState = () => {
        setSearchResult(null);
        setSearchError("");
    };

    const handleClose = () => {
        reset();
        clearErrors();
        resetSearchState();
        onClose();
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        clearErrors("lrn");
        resetSearchState();

        if (
            !subjectId ||
            lrnClientError ||
            normalizedLrn.length !== LRN_LENGTH
        ) {
            return;
        }

        setIsSearching(true);

        try {
            const response = await axios.get(
                route("teacher.classes.students.search", subjectId),
                {
                    params: {
                        lrn: normalizedLrn,
                    },
                },
            );

            const student = response?.data?.student ?? null;
            if (!student) {
                setSearchError("No student account was found for this LRN.");
                return;
            }

            setSearchResult(student);
        } catch (error) {
            const responseErrors = error?.response?.data?.errors;
            const responseMessage = error?.response?.data?.message;
            const lrnError = Array.isArray(responseErrors?.lrn)
                ? responseErrors.lrn[0]
                : null;

            if (lrnError) {
                setError("lrn", lrnError);
            } else {
                setSearchError(
                    responseMessage ||
                        "Unable to search student right now. Please try again.",
                );
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleAssign = (e) => {
        e.preventDefault();
        if (!subjectId || !canAssign) return;

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

    const canAssign = Boolean(
        subjectId &&
        normalizedLrn.length === LRN_LENGTH &&
        !lrnClientError &&
        searchResult &&
        String(searchResult.lrn ?? "") === normalizedLrn &&
        !searchResult.is_already_assigned,
    );

    const handleLrnChange = (e) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, LRN_LENGTH);

        setData("lrn", value);
        clearErrors("lrn");

        if (searchResult || searchError) {
            resetSearchState();
        }
    };

    const studentMeta = [
        searchResult?.grade_level ? `Grade ${searchResult.grade_level}` : "",
        searchResult?.section,
        searchResult?.strand,
    ]
        .filter(Boolean)
        .join(" • ");

    const searchButtonDisabled = Boolean(
        isSearching ||
        processing ||
        normalizedLrn.length !== LRN_LENGTH ||
        Boolean(lrnClientError),
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
                <form onSubmit={handleSearch}>
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
                            className="z-10 h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-slate-600 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                LRN (Learner Reference Number) *
                            </label>
                            <div className="mt-1 flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    name="lrn"
                                    required
                                    className={FIELD_CLASS}
                                    value={data.lrn}
                                    onChange={handleLrnChange}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={LRN_LENGTH}
                                    minLength={LRN_LENGTH}
                                    pattern="[0-9]{12}"
                                    placeholder="e.g., 123456789012"
                                />
                                <button
                                    type="submit"
                                    className="inline-flex h-9 items-center justify-center gap-1 rounded-sm border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                    disabled={searchButtonDisabled}
                                >
                                    {isSearching ? (
                                        <>
                                            <Loader2
                                                size={15}
                                                className="animate-spin"
                                            />
                                            Searching
                                        </>
                                    ) : (
                                        <>
                                            <Search size={15} />
                                            Search
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="mt-1 text-[11px] text-slate-500">
                                Enter a student LRN to find an existing account,
                                then assign that student to this class.
                            </p>

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

                        {searchError && (
                            <p className="text-xs text-red-600">
                                {searchError}
                            </p>
                        )}

                        {searchResult && (
                            <div className="rounded-md border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <UserRound size={16} />
                                    <p className="text-sm font-semibold">
                                        Student Found
                                    </p>
                                </div>

                                <p className="text-sm text-slate-900">
                                    {searchResult.name || "Student"}
                                </p>

                                <div className="text-xs text-slate-600 space-y-1">
                                    <p>LRN: {searchResult.lrn}</p>
                                    {searchResult.username && (
                                        <p>Username: {searchResult.username}</p>
                                    )}
                                    {studentMeta && <p>{studentMeta}</p>}
                                </div>

                                {searchResult.is_already_assigned ? (
                                    <p className="text-xs font-medium text-amber-700">
                                        This student is already assigned to this
                                        class.
                                    </p>
                                ) : (
                                    <p className="text-xs font-medium text-emerald-700">
                                        Student is ready to be assigned.
                                    </p>
                                )}
                            </div>
                        )}

                        {!searchResult && !searchError && (
                            <p className="text-xs text-slate-500">
                                Search by LRN to load exactly one student for
                                assignment.
                            </p>
                        )}
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
                            type="button"
                            onClick={handleAssign}
                            className="bg-indigo-600 h-9 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                            disabled={!canAssign || processing || isSearching}
                        >
                            {processing ? "Assigning…" : "Assign Student"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;

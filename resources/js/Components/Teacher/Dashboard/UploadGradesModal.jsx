import React, { useState, useMemo, useRef, useCallback } from "react";
import Modal from "@/Components/Modal";
import axios from "axios";
import {
    X,
    Upload,
    BookOpen,
    Search,
    ChevronRight,
    GraduationCap,
    FileSpreadsheet,
    ArrowLeft,
    UploadCloud,
    CheckCircle2,
    XCircle,
    Loader2,
    FileText,
    Trash2,
    AlertTriangle,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────── */
/*  STEPS                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */
const STEP_SELECT_SUBJECT = 1;
const STEP_UPLOAD_CSV = 2;
const STEP_RESULT = 3;

/**
 * UploadGradesModal – Multi-step modal.
 *
 * Step 1 → Pick a subject from allSubjects
 * Step 2 → Drag-and-drop / browse a CSV, upload via axios
 * Step 3 → Success / error summary
 *
 * All steps are reversible — the teacher can go back at any time.
 *
 * Props:
 *  - show        (boolean)   Whether the modal is visible
 *  - onClose     (function)  Callback to close the modal
 *  - allSubjects (array)     Array of { id, name, code, subject_teacher_id }
 */
export default function UploadGradesModal({ show, onClose, allSubjects = [] }) {
    /* ── shared state ── */
    const [step, setStep] = useState(STEP_SELECT_SUBJECT);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState(null);

    /* ── upload state ── */
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    /* ── result state ── */
    const [result, setResult] = useState(null); // { success, summary, errors }

    const fileInputRef = useRef(null);

    /* ── derived ── */
    const normalizedSubjects = useMemo(() => {
        const source = Array.isArray(allSubjects) ? allSubjects : [];

        return source
            .map((subject) => ({
                id: subject?.id ?? subject?.subject_id ?? null,
                name:
                    subject?.name ??
                    subject?.subject_name ??
                    subject?.subject ??
                    "",
                code: subject?.code ?? subject?.subject_code ?? "",
                subject_teacher_id:
                    subject?.subject_teacher_id ??
                    subject?.id ??
                    subject?.subject_teachers_id ??
                    null,
            }))
            .filter(
                (subject) =>
                    Boolean(subject.subject_teacher_id) &&
                    Boolean(subject.name?.trim()),
            );
    }, [allSubjects]);

    const filteredSubjects = useMemo(() => {
        if (!searchQuery.trim()) return normalizedSubjects;
        const q = searchQuery.toLowerCase();
        return normalizedSubjects.filter(
            (subject) =>
                subject.name?.toLowerCase().includes(q) ||
                subject.code?.toLowerCase().includes(q),
        );
    }, [normalizedSubjects, searchQuery]);

    /* ── helpers ── */
    const resetAll = useCallback(() => {
        setStep(STEP_SELECT_SUBJECT);
        setSearchQuery("");
        setSelectedSubject(null);
        setFile(null);
        setIsDragging(false);
        setUploading(false);
        setUploadProgress(0);
        setResult(null);
    }, []);

    const handleClose = () => {
        resetAll();
        onClose();
    };

    /* ── Step 1 → 2 ── */
    const handleSelectSubject = (subject) => {
        setSelectedSubject(subject);
        setStep(STEP_UPLOAD_CSV);
    };

    const handleBackToSubjects = () => {
        setSelectedSubject(null);
        setFile(null);
        setResult(null);
        setStep(STEP_SELECT_SUBJECT);
    };

    /* ── Drag & drop ── */
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) setFile(dropped);
    };
    const handleFileChange = (e) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };
    const clearFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    /* ── Upload via axios ── */
    const handleUpload = async () => {
        if (!file || !selectedSubject) return;

        const formData = new FormData();
        formData.append("grades_file", file);

        setUploading(true);
        setUploadProgress(0);

        try {
            const response = await axios.post(
                route(
                    "teacher.classes.grades.import",
                    selectedSubject.subject_teacher_id,
                ),
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (e) => {
                        if (e.total) {
                            setUploadProgress(
                                Math.round((e.loaded * 100) / e.total),
                            );
                        }
                    },
                },
            );

            // Laravel redirect-based success — axios follows the redirect,
            // and Inertia page props arrive in the HTML. We treat 2xx as success.
            setResult({
                success: true,
                summary: response.data?.grade_import_summary ?? null,
                message:
                    response.data?.message ??
                    "Grades uploaded successfully! Student dashboards will be updated automatically.",
                errors: [],
            });
            setStep(STEP_RESULT);
        } catch (error) {
            const data = error.response?.data;
            const validationErrors = data?.errors ?? {};
            const flatErrors = Object.values(validationErrors).flat();

            setResult({
                success: false,
                summary: null,
                message:
                    data?.message ??
                    "Something went wrong while uploading the file.",
                errors: flatErrors,
            });
            setStep(STEP_RESULT);
        } finally {
            setUploading(false);
        }
    };

    /* ── Step indicator dots ── */
    const stepLabels = ["Select Subject", "Upload CSV", "Result"];

    /* ────────────────────────────────────────────────────────────────────── */
    /*  RENDER                                                              */
    /* ────────────────────────────────────────────────────────────────────── */
    return (
        <Modal show={show} onClose={handleClose} maxWidth="3xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                {/* ── Header ── */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    Upload Grades
                                </h3>
                                <p className="text-sm text-indigo-100">
                                    {step === STEP_SELECT_SUBJECT &&
                                        "Select a subject to upload grades for"}
                                    {step === STEP_UPLOAD_CSV &&
                                        `Uploading to: ${selectedSubject?.name}`}
                                    {step === STEP_RESULT && "Upload complete"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        {stepLabels.map((label, idx) => {
                            const stepNum = idx + 1;
                            const isActive = step === stepNum;
                            const isComplete = step > stepNum;
                            return (
                                <div
                                    key={label}
                                    className="flex items-center gap-2"
                                >
                                    <div
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                            isActive
                                                ? "bg-white text-indigo-600"
                                                : isComplete
                                                  ? "bg-white/30 text-white"
                                                  : "bg-white/10 text-indigo-200"
                                        }`}
                                    >
                                        {isComplete ? (
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        ) : (
                                            <span>{stepNum}</span>
                                        )}
                                        <span className="hidden sm:inline">
                                            {label}
                                        </span>
                                    </div>
                                    {idx < stepLabels.length - 1 && (
                                        <ChevronRight className="w-4 h-4 text-indigo-200" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ─────────── STEP 1 : SELECT SUBJECT ─────────── */}
                {step === STEP_SELECT_SUBJECT && (
                    <>
                        {/* Search Bar */}
                        <div className="px-6 pt-5 pb-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Search subjects…"
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {filteredSubjects.length}{" "}
                                {filteredSubjects.length === 1
                                    ? "subject"
                                    : "subjects"}{" "}
                                found
                            </p>
                        </div>

                        {/* Subject List */}
                        <div className="px-6 pb-2 max-h-[540px] overflow-y-auto custom-scrollbar">
                            {filteredSubjects.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredSubjects.map((subject) => (
                                        <button
                                            key={subject.subject_teacher_id}
                                            type="button"
                                            onClick={() =>
                                                handleSelectSubject(subject)
                                            }
                                            className="w-full group flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-200 cursor-pointer text-left"
                                        >
                                            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
                                                <BookOpen className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors truncate">
                                                    {subject.name}
                                                </h4>
                                                {subject.code && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {subject.code}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                                <span>Select</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <GraduationCap className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                        {searchQuery
                                            ? "No Matching Subjects"
                                            : "No Subjects Assigned"}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                        {searchQuery
                                            ? `No subjects match "${searchQuery}". Try a different search term.`
                                            : "You have no subjects assigned for the current semester. Please contact your department."}
                                    </p>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="mt-4 inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Click a subject to proceed to CSV upload.
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}

                {/* ─────────── STEP 2 : UPLOAD CSV ─────────── */}
                {step === STEP_UPLOAD_CSV && (
                    <>
                        <div className="px-6 py-6">
                            {/* Selected subject badge */}
                            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-800">
                                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                                        {selectedSubject?.name}
                                    </p>
                                    {selectedSubject?.code && (
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                            {selectedSubject.code}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleBackToSubjects}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Change
                                </button>
                            </div>

                            {/* Drop zone */}
                            <div
                                className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                                    isDragging
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                        : file
                                          ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
                                          : "border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-750"
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() =>
                                    !file && fileInputRef.current?.click()
                                }
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />

                                {file ? (
                                    <div className="text-center">
                                        <FileText className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearFile();
                                            }}
                                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <UploadCloud className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                            Drag & drop your CSV file here
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                            or click to browse
                                        </p>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                            <FileSpreadsheet className="w-3.5 h-3.5" />
                                            .csv files only (max 4 MB)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Upload progress */}
                            {uploading && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Uploading…
                                        </span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${uploadProgress}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                                The CSV should include columns for{" "}
                                <strong>LRN</strong> and the assignment /
                                activity names matching your grade structure.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                            <button
                                onClick={handleBackToSubjects}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                    !file || uploading
                                        ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                                }`}
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {uploading ? "Uploading…" : "Upload Grades"}
                            </button>
                        </div>
                    </>
                )}

                {/* ─────────── STEP 3 : RESULT ─────────── */}
                {step === STEP_RESULT && result && (
                    <>
                        <div className="px-6 py-8">
                            <div className="text-center">
                                {/* Icon */}
                                <div
                                    className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                                        result.success
                                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                                            : "bg-red-100 dark:bg-red-900/30"
                                    }`}
                                >
                                    {result.success ? (
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                                    )}
                                </div>

                                <h4
                                    className={`text-lg font-bold mb-2 ${
                                        result.success
                                            ? "text-emerald-900 dark:text-emerald-200"
                                            : "text-red-900 dark:text-red-200"
                                    }`}
                                >
                                    {result.success
                                        ? "Grades Uploaded Successfully!"
                                        : "Upload Failed"}
                                </h4>

                                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                                    {result.message}
                                </p>

                                {/* Summary stats */}
                                {result.summary && (
                                    <div className="flex items-center justify-center gap-4 mt-5">
                                        {result.summary.updated != null && (
                                            <div className="px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                                                    {result.summary.updated}
                                                </p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                                                    Updated
                                                </p>
                                            </div>
                                        )}
                                        {result.summary.skipped != null &&
                                            result.summary.skipped > 0 && (
                                                <div className="px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                                                        {result.summary.skipped}
                                                    </p>
                                                    <p className="text-xs text-amber-600 dark:text-amber-500">
                                                        Skipped
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                )}

                                {/* Error details */}
                                {result.errors?.length > 0 && (
                                    <div className="mt-5 text-left max-h-40 overflow-y-auto rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Errors
                                        </div>
                                        <ul className="space-y-1">
                                            {result.errors.map((err, i) => (
                                                <li
                                                    key={i}
                                                    className="text-xs text-red-600 dark:text-red-400"
                                                >
                                                    • {err}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                            <button
                                onClick={() => {
                                    setFile(null);
                                    setResult(null);
                                    setStep(STEP_UPLOAD_CSV);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Upload Another File
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleBackToSubjects}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Change Subject
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

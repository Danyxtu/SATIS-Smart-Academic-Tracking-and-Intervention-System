import { FileText, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "@inertiajs/react";

const COLOR_OPTIONS = [
    {
        name: "indigo",
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        icon: "text-indigo-500",
    },
    {
        name: "blue",
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: "text-blue-500",
    },
    {
        name: "red",
        bg: "bg-red-100",
        text: "text-red-700",
        icon: "text-red-500",
    },
    {
        name: "green",
        bg: "bg-green-100",
        text: "text-green-700",
        icon: "text-green-500",
    },
    {
        name: "amber",
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: "text-amber-500",
    },
    {
        name: "purple",
        bg: "bg-purple-100",
        text: "text-purple-700",
        icon: "text-purple-500",
    },
    {
        name: "teal",
        bg: "bg-teal-100",
        text: "text-teal-700",
        icon: "text-teal-500",
    },
];

const GRADE_LEVEL_OPTIONS = ["Grade 11", "Grade 12"];

const STRAND_OPTIONS = [
    "Science, Technology, Engineering & Mathematics (STEM)",
    "Accounting, Business & Management (ABM)",
    "Humanities and Social Sciences (HUMSS)",
    "HOME ECONOMICS (HE) HE1 Bread & Pastry Production IBBPI NC II (160 hrs.)",
    "Cookery NC II (320 hrs.)",
    "Food and Beverage Services [FBS] NC II (160 hrs.)",
    "HE2 - Dressmaking NC II (320 hrs.)",
    "Tailoring NC II (320 hrs.)",
    "Caregiving NC II (640 hrs.)",
    "AFA1 - Food (Fish) Processing [FFP] NC II (640 hrs.)",
    "AFA2 - Aquaculture NC II (640 hrs.)",
    "Computer System Servicing NC II (CSS) (640 hrs.)",
    "ICT2 Technical Drafting NC II (320 hrs.)",
    "Animation NC II (320 hrs.)",
    "IA1 - Electrical Installation & Maintenance (EIM) NC II (640 hrs.)",
];

const AddNewClassModal = ({
    onClose,
    defaultSchoolYear,
    currentSemester = 1,
    initialFile = null,
}) => {
    const { data, setData, post, processing, errors, reset, progress } =
        useForm({
            grade_level: "",
            section: "",
            subject_name: "",
            color: "indigo",
            school_year: defaultSchoolYear,
            strand: "",
            classlist: null,
        });

    useEffect(() => {
        setData("school_year", defaultSchoolYear);
    }, [defaultSchoolYear]);

    useEffect(() => {
        if (initialFile) {
            setData("classlist", initialFile);
        }
    }, [initialFile]);

    const handleClose = () => {
        reset();
        setData("school_year", defaultSchoolYear);
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    const handleFileChange = (file) => {
        setData("classlist", file || null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("teacher.classes.store"), {
            forceFormData: true,
            onSuccess: () => {
                handleClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-1 flex-col overflow-hidden"
                >
                    {/* Modal Header */}
                    <div className="flex justify-between items-center p-6 border-b">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                Add New Class
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Showing subjects for{" "}
                                <span className="font-semibold text-indigo-600">
                                    Semester {currentSemester}
                                </span>
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Modal Body (Form) */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Grade Level
                                </label>
                                <select
                                    name="grade_level"
                                    required
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    value={data.grade_level}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Select Grade Level
                                    </option>
                                    {GRADE_LEVEL_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                {errors.grade_level && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.grade_level}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Section
                                </label>
                                <input
                                    type="text"
                                    name="section"
                                    required
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    value={data.section}
                                    onChange={handleChange}
                                    placeholder="e.g., STEM-C"
                                />
                                {errors.section && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.section}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    name="subject_name"
                                    required
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    value={data.subject_name}
                                    onChange={handleChange}
                                    placeholder="e.g., General Mathematics"
                                />
                                {errors.subject_name && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.subject_name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    School Year
                                </label>
                                <input
                                    type="text"
                                    name="school_year"
                                    required
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    value={data.school_year}
                                    onChange={handleChange}
                                    placeholder="e.g., 2025-2026"
                                />
                                {errors.school_year && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.school_year}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Strand / Program
                            </label>
                            <select
                                name="strand"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                value={data.strand}
                                onChange={handleChange}
                            >
                                <option value="" disabled>
                                    Select Strand
                                </option>
                                {STRAND_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            {errors.strand && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.strand}
                                </p>
                            )}
                        </div>

                        {/* Color Picker */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Color Theme
                            </label>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {COLOR_OPTIONS.map((color) => (
                                    <label
                                        key={color.name}
                                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition hover:border-indigo-400 ${
                                            data.color === color.name
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-gray-200"
                                        }`}
                                    >
                                        <span
                                            className={`inline-flex items-center gap-2 capitalize ${color.text}`}
                                        >
                                            <span
                                                className={`h-4 w-4 rounded-full ${color.bg}`}
                                            ></span>
                                            {color.name}
                                        </span>
                                        <input
                                            type="radio"
                                            name="color"
                                            value={color.name}
                                            checked={data.color === color.name}
                                            onChange={handleChange}
                                            className="h-4 w-4 accent-indigo-600"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* File Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Upload Classlist (CSV/Excel)
                            </label>
                            {data.classlist ? (
                                <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <FileText
                                            size={18}
                                            className="text-gray-500"
                                        />
                                        {data.classlist.name}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleFileChange(null)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 px-6 py-8 text-center text-sm text-gray-500 transition hover:border-indigo-400 hover:bg-indigo-50">
                                    <input
                                        type="file"
                                        name="file"
                                        className="hidden"
                                        accept=".csv,text/csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                        onChange={(e) =>
                                            handleFileChange(e.target.files[0])
                                        }
                                    />
                                    <FileText
                                        size={28}
                                        className="text-indigo-400"
                                    />
                                    <span className="mt-2 font-semibold text-gray-700">
                                        Drop your roster or click to browse
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        CSV, XLS, XLSX up to 4MB
                                    </span>
                                </label>
                            )}
                            {errors.classlist && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.classlist}
                                </p>
                            )}
                        </div>

                        {/* (REQUIRED) Note */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-sm text-blue-700">
                                <strong>Note:</strong> Once the class list is
                                added, the system will automatically generate a
                                unique email for each student (e.g.,
                                hz202300349@bshs.edu.ph).
                            </p>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex flex-col space-y-2 p-6 border-t bg-gray-50">
                        {(errors.grade_level ||
                            errors.section ||
                            errors.subject_name ||
                            errors.color ||
                            errors.school_year ||
                            errors.strand) && (
                            <div className="text-sm text-red-600">
                                Please fix the highlighted errors before
                                submitting.
                            </div>
                        )}
                        {progress && (
                            <div className="text-sm text-gray-600">
                                Uploading… {progress.percentage}%
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                disabled={
                                    processing ||
                                    !data.grade_level ||
                                    !data.section ||
                                    !data.subject_name
                                }
                            >
                                {processing ? "Creating…" : "Create Class"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddNewClassModal;

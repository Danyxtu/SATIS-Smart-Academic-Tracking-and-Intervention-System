import { useForm } from "@inertiajs/react";
import {
    X,
    Building2,
    Hash,
    FileText,
    Info,
    Save,
    CheckCircle,
} from "lucide-react";

export default function CreateDepartmentModal({ isOpen, onClose, onSuccess }) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            department_name: "",
            department_code: "",
            description: "",
            is_active: true,
        });

    const handleClose = () => {
        clearErrors();
        reset();
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("superadmin.departments.store"), {
            preserveScroll: true,
            onSuccess: () => {
                handleClose();
                onSuccess?.();
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-2xl transform rounded-2xl bg-white shadow-2xl transition-all">
                    <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-7">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                            className="absolute top-3 right-3 rounded-xl p-3 text-white/80 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                <Building2 className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Create Department
                                </h2>
                                <p className="text-sm text-blue-100 mt-0.5">
                                    Add a new academic department
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                    <Building2
                                        size={14}
                                        className="text-slate-400"
                                    />
                                    Department Name
                                    <span className="text-rose-500">*</span>
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
                                    className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                        errors.department_name
                                            ? "border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-rose-400"
                                            : ""
                                    }`}
                                />
                                {errors.department_name && (
                                    <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                        <Info size={14} />
                                        {errors.department_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                    <Hash
                                        size={14}
                                        className="text-slate-400"
                                    />
                                    Department Code
                                    <span className="text-rose-500">*</span>
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
                                    className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                        errors.department_code
                                            ? "border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-rose-400"
                                            : ""
                                    }`}
                                />
                                {errors.department_code && (
                                    <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                        <Info size={14} />
                                        {errors.department_code}
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-slate-400">
                                    Short unique identifier (e.g., ICT, STEM,
                                    ABM)
                                </p>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                    <FileText
                                        size={14}
                                        className="text-slate-400"
                                    />
                                    Description
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Brief description of the department..."
                                    className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors resize-none ${
                                        errors.description
                                            ? "border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-rose-400"
                                            : ""
                                    }`}
                                />
                                {errors.description && (
                                    <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                        <Info size={14} />
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                                                data.is_active
                                                    ? "bg-emerald-100"
                                                    : "bg-slate-200"
                                            }`}
                                        >
                                            <CheckCircle
                                                size={20}
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
                        </div>

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
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save size={15} />
                                        Create Department
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

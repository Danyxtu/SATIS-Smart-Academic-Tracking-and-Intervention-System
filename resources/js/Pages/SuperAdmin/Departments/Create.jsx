import { Head, Link, useForm } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    Building2,
    ArrowLeft,
    Save,
    Info,
    FileText,
    Hash,
    CheckCircle,
} from "lucide-react";

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        code: "",
        description: "",
        is_active: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("superadmin.departments.store"));
    };

    return (
        <>
            <Head title="Create Department" />

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route("superadmin.departments.index")}
                        className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Create Department
                        </h1>
                        <p className="text-slate-500">
                            Add a new academic department
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden"
                >
                    <div className="flex items-center gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Department Details
                            </h2>
                            <p className="text-sm text-slate-500">
                                Fill in the information below
                            </p>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Name */}
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
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                placeholder="e.g., Information and Communications Technology"
                                className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                    errors.name
                                        ? "border-rose-300 bg-rose-50/50"
                                        : ""
                                }`}
                            />
                            {errors.name && (
                                <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                    <Info size={14} />
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Code */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Hash size={14} className="text-slate-400" />
                                Department Code
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) =>
                                    setData(
                                        "code",
                                        e.target.value.toUpperCase()
                                    )
                                }
                                placeholder="e.g., ICT"
                                className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                    errors.code
                                        ? "border-rose-300 bg-rose-50/50"
                                        : ""
                                }`}
                            />
                            {errors.code && (
                                <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                    <Info size={14} />
                                    {errors.code}
                                </p>
                            )}
                            <p className="mt-2 text-xs text-slate-400">
                                Short unique identifier (e.g., ICT, STEM, ABM)
                            </p>
                        </div>

                        {/* Description */}
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
                                        ? "border-rose-300 bg-rose-50/50"
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

                        {/* Active Status */}
                        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
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
                                        <p className="font-medium text-slate-900">
                                            Active Department
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Enable or disable this department
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
                                                e.target.checked
                                            )
                                        }
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <Link
                            href={route("superadmin.departments.index")}
                            className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
                        >
                            <Save size={16} />
                            {processing ? "Creating..." : "Create Department"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Create.layout = (page) => <SuperAdminLayout children={page} />;

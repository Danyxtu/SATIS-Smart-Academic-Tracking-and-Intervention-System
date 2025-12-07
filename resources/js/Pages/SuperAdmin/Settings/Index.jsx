import { Head, useForm } from "@inertiajs/react";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import {
    Settings,
    Save,
    Calendar,
    GraduationCap,
    Clock,
    Info,
    School,
    MapPin,
    CheckCircle,
    Sparkles,
    Shield,
} from "lucide-react";

export default function Index({ settings, schoolYears }) {
    const { data, setData, post, processing, errors } = useForm({
        current_school_year: settings?.current_school_year || "",
        current_semester: settings?.current_semester || "1",
        enrollment_open: settings?.enrollment_open ?? true,
        grade_submission_open: settings?.grade_submission_open ?? true,
        school_name: settings?.school_name || "",
        school_address: settings?.school_address || "",
    });

    const currentYear = new Date().getFullYear();
    const generatedSchoolYears = Array.from({ length: 5 }, (_, i) => {
        const year = currentYear - 2 + i;
        return `${year}-${year + 1}`;
    });

    const availableSchoolYears = schoolYears?.length
        ? schoolYears
        : generatedSchoolYears;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("superadmin.settings.update"));
    };

    return (
        <>
            <Head title="System Settings" />

            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-500/25">
                        <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            System Settings
                        </h1>
                        <p className="text-slate-500">
                            Configure school year, semester, and system-wide
                            settings
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Academic Period */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Academic Period
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Set the current school year and semester
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* School Year */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <Calendar
                                            size={14}
                                            className="text-slate-400"
                                        />
                                        Current School Year
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.current_school_year}
                                        onChange={(e) =>
                                            setData(
                                                "current_school_year",
                                                e.target.value
                                            )
                                        }
                                        className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                            errors.current_school_year
                                                ? "border-rose-300 bg-rose-50/50"
                                                : ""
                                        }`}
                                    >
                                        <option value="">
                                            Select school year
                                        </option>
                                        {availableSchoolYears.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.current_school_year && (
                                        <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                            <Info size={14} />
                                            {errors.current_school_year}
                                        </p>
                                    )}
                                </div>

                                {/* Semester */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <Sparkles
                                            size={14}
                                            className="text-slate-400"
                                        />
                                        Current Semester
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.current_semester}
                                        onChange={(e) =>
                                            setData(
                                                "current_semester",
                                                e.target.value
                                            )
                                        }
                                        className={`w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors ${
                                            errors.current_semester
                                                ? "border-rose-300 bg-rose-50/50"
                                                : ""
                                        }`}
                                    >
                                        <option value="1">1st Semester</option>
                                        <option value="2">2nd Semester</option>
                                    </select>
                                    {errors.current_semester && (
                                        <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                                            <Info size={14} />
                                            {errors.current_semester}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                        <Info
                                            size={16}
                                            className="text-blue-600"
                                        />
                                    </div>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-semibold">
                                            Academic Period Impact
                                        </p>
                                        <p className="mt-1 text-blue-700">
                                            Changing the school year or semester
                                            affects enrollment, grades, and
                                            attendance records. Make sure all
                                            grades are submitted before changing
                                            to a new period.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Controls */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                                <Clock className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    System Controls
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Toggle system features and deadlines
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Enrollment Open */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                            data.enrollment_open
                                                ? "bg-emerald-100"
                                                : "bg-slate-200"
                                        }`}
                                    >
                                        <GraduationCap
                                            size={20}
                                            className={
                                                data.enrollment_open
                                                    ? "text-emerald-600"
                                                    : "text-slate-400"
                                            }
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            Enrollment Period
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Allow students to be enrolled in
                                            classes
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.enrollment_open}
                                        onChange={(e) =>
                                            setData(
                                                "enrollment_open",
                                                e.target.checked
                                            )
                                        }
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                </label>
                            </div>

                            {/* Grade Submission */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                            data.grade_submission_open
                                                ? "bg-emerald-100"
                                                : "bg-slate-200"
                                        }`}
                                    >
                                        <CheckCircle
                                            size={20}
                                            className={
                                                data.grade_submission_open
                                                    ? "text-emerald-600"
                                                    : "text-slate-400"
                                            }
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            Grade Submission
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Allow teachers to submit and edit
                                            grades
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.grade_submission_open}
                                        onChange={(e) =>
                                            setData(
                                                "grade_submission_open",
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

                    {/* School Information */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                                <School className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    School Information
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Basic school details for reports and
                                    documents
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* School Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                    <School
                                        size={14}
                                        className="text-slate-400"
                                    />
                                    School Name
                                </label>
                                <input
                                    type="text"
                                    value={data.school_name}
                                    onChange={(e) =>
                                        setData("school_name", e.target.value)
                                    }
                                    placeholder="e.g., Sample Senior High School"
                                    className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                                />
                            </div>

                            {/* School Address */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                    <MapPin
                                        size={14}
                                        className="text-slate-400"
                                    />
                                    School Address
                                </label>
                                <textarea
                                    value={data.school_address}
                                    onChange={(e) =>
                                        setData(
                                            "school_address",
                                            e.target.value
                                        )
                                    }
                                    rows={2}
                                    placeholder="Full school address..."
                                    className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
                        >
                            <Save size={18} />
                            {processing ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Index.layout = (page) => <SuperAdminLayout children={page} />;

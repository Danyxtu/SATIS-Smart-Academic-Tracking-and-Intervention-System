import React, { useMemo } from "react";
import StudentLayout from "@/Layouts/StudentLayout";
import { Head, Link } from "@inertiajs/react";
import {
    ChevronRight,
    Calendar,
    Table,
    Medal,
    CheckCircle2,
    XCircle,
} from "lucide-react";

const formatGrade = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "N/A";
    return Number.isInteger(numeric) ? `${numeric}` : numeric.toFixed(1);
};

const formatScore = (score, total) => {
    const scoreValue = Number(score);
    const totalValue = Number(total);
    const scoreText = Number.isFinite(scoreValue)
        ? formatGrade(scoreValue)
        : "--";
    const totalText = Number.isFinite(totalValue)
        ? formatGrade(totalValue)
        : "--";
    return `${scoreText}/${totalText}`;
};

const buildRemarks = (overallFinal = {}) => {
    const remarkText = String(overallFinal.remarks ?? "").trim();
    return remarkText !== "" ? remarkText : "N/A";
};

const getQuarterMetadata = (quarterValue) => {
    const quarterNum = Number(quarterValue);

    if (!Number.isFinite(quarterNum) || quarterNum <= 0) {
        return {
            quarterNum: null,
            shortLabel: "",
            title: "",
            fullLabel: "",
        };
    }

    if (quarterNum === 1) {
        return {
            quarterNum,
            shortLabel: "Q1",
            title: "Midterm Quarter",
            fullLabel: "Midterm Quarter (Q1)",
        };
    }

    if (quarterNum === 2) {
        return {
            quarterNum,
            shortLabel: "Q2",
            title: "Final Quarter",
            fullLabel: "Final Quarter (Q2)",
        };
    }

    return {
        quarterNum,
        shortLabel: `Q${quarterNum}`,
        title: `Quarter ${quarterNum}`,
        fullLabel: `Quarter ${quarterNum}`,
    };
};

const remarksClasses = (remarks) => {
    const normalized = String(remarks || "")
        .trim()
        .toLowerCase();

    if (normalized === "passed") {
        return {
            badge: "bg-green-100 text-green-700 border-green-200",
            panel: "bg-green-50 border-green-200",
            icon: <CheckCircle2 size={18} className="text-green-600" />,
        };
    }

    if (normalized === "failed") {
        return {
            badge: "bg-red-100 text-red-700 border-red-200",
            panel: "bg-red-50 border-red-200",
            icon: <XCircle size={18} className="text-red-600" />,
        };
    }

    return {
        badge: "bg-gray-100 text-gray-700 border-gray-200",
        panel: "bg-gray-50 border-gray-200",
        icon: <Medal size={18} className="text-gray-500" />,
    };
};

const QuarterBreakdownTable = ({ quarter, isActiveQuarter }) => {
    const categories = Array.isArray(quarter?.categories)
        ? quarter.categories
        : [];

    return (
        <div
            className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${
                isActiveQuarter
                    ? "border-pink-300 ring-2 ring-pink-100"
                    : "border-gray-200"
            }`}
        >
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {quarter.label || `Quarter ${quarter.quarter}`}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {quarter.hasStarted
                                ? `${quarter.completedActivities || 0}/${quarter.totalActivities || 0} activities with scores`
                                : "This quarter has not started yet."}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-wider text-gray-500">
                            Quarterly Grade
                        </p>
                        <p className="text-2xl font-bold text-pink-700">
                            {formatGrade(quarter.quarterlyGrade)}
                        </p>
                    </div>
                </div>
            </div>

            {!quarter.hasStarted ? (
                <div className="px-5 py-8 text-center">
                    <Calendar
                        size={28}
                        className="mx-auto text-gray-300 mb-2"
                    />
                    <p className="text-gray-600">
                        No graded activities yet for this quarter.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-white">
                            <tr className="border-b border-gray-200">
                                <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[260px]">
                                    Category / Activity
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Initial
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Expected
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Quarterly
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Score Details
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-6 text-center text-gray-500"
                                    >
                                        No category breakdown available yet.
                                    </td>
                                </tr>
                            )}

                            {categories.map((category) => (
                                <React.Fragment
                                    key={`${quarter.quarter}-${category.id || category.label}`}
                                >
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-800">
                                                {category.label || "Category"}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Weight:{" "}
                                                {formatGrade(category.weight)}%
                                                •{" "}
                                                {category.completedActivities ||
                                                    0}
                                                /{category.activitiesCount || 0}{" "}
                                                activities
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 font-medium">
                                            {formatGrade(category.initialGrade)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 font-medium">
                                            {formatGrade(
                                                category.expectedGrade,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 font-semibold">
                                            {formatGrade(
                                                category.quarterlyGrade,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            Category summary
                                        </td>
                                    </tr>

                                    {(category.activities || []).map(
                                        (activity) => (
                                            <tr
                                                key={`${quarter.quarter}-${category.id || category.label}-${activity.id || activity.name}`}
                                                className="border-b border-gray-100"
                                            >
                                                <td className="px-4 py-2 pl-10 text-gray-700">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span>
                                                            {activity.name ||
                                                                "Activity"}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            (Total:{" "}
                                                            {formatGrade(
                                                                activity.totalScore,
                                                            )}
                                                            )
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-gray-400">
                                                    --
                                                </td>
                                                <td className="px-4 py-2 text-gray-400">
                                                    --
                                                </td>
                                                <td className="px-4 py-2 text-gray-700">
                                                    {formatGrade(
                                                        activity.percentage,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-gray-700">
                                                    {formatScore(
                                                        activity.score,
                                                        activity.totalScore,
                                                    )}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-pink-50 border-t border-pink-200">
                                <td className="px-4 py-3 font-semibold text-pink-800">
                                    Quarter Summary
                                </td>
                                <td className="px-4 py-3 font-semibold text-pink-800">
                                    {formatGrade(quarter.initialGrade)}
                                </td>
                                <td className="px-4 py-3 font-semibold text-pink-800">
                                    {formatGrade(quarter.expectedGrade)}
                                </td>
                                <td className="px-4 py-3 font-semibold text-pink-800">
                                    {formatGrade(quarter.quarterlyGrade)}
                                </td>
                                <td className="px-4 py-3 text-xs text-pink-700">
                                    {quarter.completedActivities || 0}/
                                    {quarter.totalActivities || 0} activities
                                    completed
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

const AnalyticsQuarterDetails = ({
    enrollment = {},
    subject = {},
    selectedQuarter = 1,
    quarters = [],
    overallFinal = {},
}) => {
    const orderedQuarters = useMemo(
        () =>
            [...(Array.isArray(quarters) ? quarters : [])].sort(
                (a, b) => Number(a?.quarter || 0) - Number(b?.quarter || 0),
            ),
        [quarters],
    );
    const selectedQuarterLabel =
        getQuarterMetadata(selectedQuarter).fullLabel ||
        `Quarter ${selectedQuarter}`;

    const remarks = buildRemarks(overallFinal);
    const remarkStyle = remarksClasses(remarks);

    return (
        <>
            <Head
                title={`${subject.name || "Subject"} ${selectedQuarterLabel} Details`}
            />

            <div className="max-w-7xl mx-auto space-y-5">
                <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Link
                        href={route("analytics.index")}
                        className="hover:text-pink-600 transition-colors"
                    >
                        Performance Analytics
                    </Link>
                    <ChevronRight size={16} />
                    <Link
                        href={route("analytics.show", {
                            enrollment: enrollment.id,
                        })}
                        className="hover:text-pink-600 transition-colors"
                    >
                        {subject.name || "Subject"}
                    </Link>
                    <ChevronRight size={16} />
                    <span className="text-gray-900">
                        {selectedQuarterLabel} Details
                    </span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {subject.name || "Subject"} Quarter Breakdown
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                {subject.teacher || "N/A"} •{" "}
                                {subject.schoolYear || "N/A"}
                                {subject.section ? ` • ${subject.section}` : ""}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Table size={18} className="text-pink-600" />
                            <span className="text-sm font-medium text-gray-700">
                                Category and activity performance
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {orderedQuarters.map((quarter) => {
                            const isActive =
                                Number(quarter?.quarter) ===
                                Number(selectedQuarter);

                            return (
                                <Link
                                    key={`quarter-tab-${quarter.quarter}`}
                                    href={route("analytics.quarter.show", {
                                        enrollment: enrollment.id,
                                        quarter: quarter.quarter,
                                    })}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                        isActive
                                            ? "bg-pink-600 text-white border-pink-600"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-pink-400 hover:text-pink-700"
                                    }`}
                                >
                                    {quarter.label ||
                                        getQuarterMetadata(quarter.quarter)
                                            .fullLabel}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-5">
                    {orderedQuarters.map((quarter) => (
                        <QuarterBreakdownTable
                            key={`quarter-breakdown-${quarter.quarter}`}
                            quarter={quarter}
                            isActiveQuarter={
                                Number(quarter?.quarter) ===
                                Number(selectedQuarter)
                            }
                        />
                    ))}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Overall Final Grade
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Final evaluation based on completed quarter grades.
                        </p>
                    </div>

                    <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                            <p className="text-xs uppercase tracking-wider text-blue-700 font-semibold">
                                Midterm Grade
                            </p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">
                                {formatGrade(overallFinal.midtermQuarterGrade)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                            <p className="text-xs uppercase tracking-wider text-indigo-700 font-semibold">
                                Final Quarter Grade
                            </p>
                            <p className="text-2xl font-bold text-indigo-900 mt-1">
                                {formatGrade(overallFinal.finalQuarterGrade)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
                            <p className="text-xs uppercase tracking-wider text-pink-700 font-semibold">
                                Final Grade
                            </p>
                            <p className="text-2xl font-bold text-pink-900 mt-1">
                                {formatGrade(overallFinal.combinedAverage)}
                            </p>
                        </div>

                        <div
                            className={`rounded-xl border p-4 ${remarkStyle.panel}`}
                        >
                            <p className="text-xs uppercase tracking-wider font-semibold text-gray-700">
                                Remarks
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                {remarkStyle.icon}
                                <span
                                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-sm font-semibold ${remarkStyle.badge}`}
                                >
                                    {remarks}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

AnalyticsQuarterDetails.layout = (page) => <StudentLayout children={page} />;

export default AnalyticsQuarterDetails;

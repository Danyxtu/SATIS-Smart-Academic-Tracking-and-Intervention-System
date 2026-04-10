import React from "react";
import { Head, useForm } from "@inertiajs/react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import {
    AlertTriangle,
    ClipboardList,
    Eye,
    Info,
    Save,
    SlidersHorizontal,
    TrendingDown,
} from "lucide-react";

function ObserveToggle({
    title,
    description,
    icon: Icon,
    checked,
    onChange,
    accentClass,
}) {
    return (
        <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/40">
            <div
                className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg ${accentClass}`}
            >
                <Icon size={18} />
            </div>

            <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {description}
                </p>
            </div>

            <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={checked}
                onChange={onChange}
            />
        </label>
    );
}

const asNumber = (value, fallback) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

function ClassSettings({ settings = {}, globalRules = {} }) {
    const form = useForm({
        observe_at_risk: Boolean(settings?.observe?.at_risk ?? true),
        observe_needs_attention: Boolean(
            settings?.observe?.needs_attention ?? true,
        ),
        observe_recent_decline: Boolean(
            settings?.observe?.recent_decline ?? true,
        ),
        needs_attention_absence_threshold: String(
            settings?.needs_attention?.absence_threshold ??
                globalRules?.needs_attention_defaults?.absence_threshold ??
                3,
        ),
        needs_attention_failing_activities_threshold: String(
            settings?.needs_attention?.failing_activities_threshold ??
                globalRules?.needs_attention_defaults
                    ?.failing_activities_threshold ??
                3,
        ),
        recent_decline_minimum_drop_percent: String(
            settings?.recent_decline?.minimum_drop_percent ??
                globalRules?.recent_decline_defaults?.minimum_drop_percent ??
                20,
        ),
    });

    const submit = (event) => {
        event.preventDefault();

        form.transform((values) => ({
            observe: {
                at_risk: Boolean(values.observe_at_risk),
                needs_attention: Boolean(values.observe_needs_attention),
                recent_decline: Boolean(values.observe_recent_decline),
            },
            needs_attention: {
                absence_threshold: asNumber(
                    values.needs_attention_absence_threshold,
                    3,
                ),
                failing_activities_threshold: asNumber(
                    values.needs_attention_failing_activities_threshold,
                    3,
                ),
            },
            recent_decline: {
                minimum_drop_percent: asNumber(
                    values.recent_decline_minimum_drop_percent,
                    20,
                ),
            },
        }));

        form.put(route("teacher.class-settings.update"), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Class Settings" />

            <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-white via-indigo-50/40 to-sky-50/40 p-6 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800">
                    <div className="flex items-start gap-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                            <SlidersHorizontal size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Class Settings
                            </h1>
                            <p className="mt-1 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
                                Calibrate what appears in your teacher
                                watchlist. At Risk follows global SATIS rules,
                                while Needs Attention and Recent Decline
                                thresholds can be calibrated for your account
                                only.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-4 flex items-center gap-2">
                            <Eye size={18} className="text-indigo-600" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                What You Observe
                            </h2>
                        </div>

                        <div className="space-y-3">
                            <ObserveToggle
                                title="At Risk"
                                description="Show students flagged by the global At Risk rule."
                                icon={AlertTriangle}
                                checked={form.data.observe_at_risk}
                                onChange={(event) =>
                                    form.setData(
                                        "observe_at_risk",
                                        event.target.checked,
                                    )
                                }
                                accentClass="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                            />

                            <ObserveToggle
                                title="Needs Attention"
                                description="Show students flagged by the global Needs Attention rule."
                                icon={ClipboardList}
                                checked={form.data.observe_needs_attention}
                                onChange={(event) =>
                                    form.setData(
                                        "observe_needs_attention",
                                        event.target.checked,
                                    )
                                }
                                accentClass="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
                            />

                            <ObserveToggle
                                title="Recent Decline"
                                description="Show students whose final quarter is failing after a significant midterm decline."
                                icon={TrendingDown}
                                checked={form.data.observe_recent_decline}
                                onChange={(event) =>
                                    form.setData(
                                        "observe_recent_decline",
                                        event.target.checked,
                                    )
                                }
                                accentClass="bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300"
                            />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-4 flex items-center gap-2">
                            <Info size={18} className="text-indigo-600" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                Global Rules (Read-Only)
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-900/10">
                                <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                                    At Risk
                                </p>
                                <p className="mt-2 text-sm text-red-900 dark:text-red-100">
                                    Passing grade below{" "}
                                    {globalRules?.passing_grade ?? 75}%
                                </p>
                                <p className="text-sm text-red-900 dark:text-red-100">
                                    Absences at least{" "}
                                    {globalRules?.at_risk?.absence_threshold ??
                                        5}
                                </p>
                            </div>

                            <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                                    Needs Attention
                                </p>
                                <p className="mt-2 text-sm text-amber-900 dark:text-amber-100">
                                    Absences above{" "}
                                    {globalRules?.needs_attention
                                        ?.absence_threshold ?? 3}
                                </p>
                                <p className="text-sm text-amber-900 dark:text-amber-100">
                                    Failing activities above{" "}
                                    {globalRules?.needs_attention
                                        ?.failing_activities_threshold ?? 3}
                                </p>
                            </div>

                            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900/40 dark:bg-sky-900/10">
                                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                                    Recent Decline Defaults
                                </p>
                                <p className="mt-2 text-sm text-sky-900 dark:text-sky-100">
                                    Minimum decline{" "}
                                    {globalRules?.recent_decline_defaults
                                        ?.minimum_drop_percent ?? 20}
                                    %
                                </p>
                                <p className="text-sm text-sky-900 dark:text-sky-100">
                                    Final quarter must be failing:{" "}
                                    {(globalRules?.recent_decline_defaults
                                        ?.require_final_quarter_failing ?? true)
                                        ? "Yes"
                                        : "No"}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            Needs Attention Calibration (Teacher-Only)
                        </h2>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            Adjust your own Needs Attention sensitivity without
                            affecting other teachers.
                        </p>

                        <fieldset
                            disabled={!form.data.observe_needs_attention}
                            className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 disabled:opacity-60"
                        >
                            <div>
                                <label
                                    htmlFor="needs_attention_absence_threshold"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                                >
                                    Absence Threshold
                                </label>
                                <input
                                    id="needs_attention_absence_threshold"
                                    type="number"
                                    min="1"
                                    max="15"
                                    step="1"
                                    value={
                                        form.data
                                            .needs_attention_absence_threshold
                                    }
                                    onChange={(event) =>
                                        form.setData(
                                            "needs_attention_absence_threshold",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Students are flagged when absences are
                                    greater than this value.
                                </p>
                                {form.errors[
                                    "needs_attention.absence_threshold"
                                ] && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {
                                            form.errors[
                                                "needs_attention.absence_threshold"
                                            ]
                                        }
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="needs_attention_failing_activities_threshold"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                                >
                                    Failing Activities Threshold
                                </label>
                                <input
                                    id="needs_attention_failing_activities_threshold"
                                    type="number"
                                    min="1"
                                    max="20"
                                    step="1"
                                    value={
                                        form.data
                                            .needs_attention_failing_activities_threshold
                                    }
                                    onChange={(event) =>
                                        form.setData(
                                            "needs_attention_failing_activities_threshold",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Students are flagged when failing activities
                                    are greater than this value.
                                </p>
                                {form.errors[
                                    "needs_attention.failing_activities_threshold"
                                ] && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {
                                            form.errors[
                                                "needs_attention.failing_activities_threshold"
                                            ]
                                        }
                                    </p>
                                )}
                            </div>
                        </fieldset>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            Recent Decline Calibration (Teacher-Only)
                        </h2>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            This is computed from midterm to final quarter:
                            decline % = ((midterm - final) / midterm) x 100, and
                            final quarter must be failing.
                        </p>

                        <fieldset
                            disabled={!form.data.observe_recent_decline}
                            className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-1 disabled:opacity-60"
                        >
                            <div>
                                <label
                                    htmlFor="minimum_drop_percent"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                                >
                                    Minimum Decline Percent (%)
                                </label>
                                <input
                                    id="minimum_drop_percent"
                                    type="number"
                                    min="1"
                                    max="60"
                                    step="0.1"
                                    value={
                                        form.data
                                            .recent_decline_minimum_drop_percent
                                    }
                                    onChange={(event) =>
                                        form.setData(
                                            "recent_decline_minimum_drop_percent",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Alert when the final quarter is failing and
                                    the decline from midterm reaches this
                                    percentage.
                                </p>
                                {form.errors[
                                    "recent_decline.minimum_drop_percent"
                                ] && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {
                                            form.errors[
                                                "recent_decline.minimum_drop_percent"
                                            ]
                                        }
                                    </p>
                                )}
                            </div>
                        </fieldset>
                    </section>

                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Changes apply to your dashboard and intervention
                            watchlist.
                        </p>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={15} />
                            {form.processing
                                ? "Saving..."
                                : "Save Class Settings"}
                        </button>
                    </div>

                    {form.recentlySuccessful && (
                        <p className="text-sm font-medium text-emerald-600">
                            Settings saved.
                        </p>
                    )}
                </form>
            </div>
        </>
    );
}

ClassSettings.layout = (page) => <SchoolStaffLayout children={page} />;

export default ClassSettings;

/**
 * Grades are now grouped by quarter:
 *   { 1: { taskId: score, ... }, 2: { taskId: score, ... } }
 *
 * Each helper receives the full grades object and picks the right quarter slice.
 */

const isAttendanceCategory = (category = {}) => {
    const id = String(category?.id ?? "").toLowerCase();
    const label = String(category?.label ?? "").toLowerCase();

    return id === "attendance" || label.includes("attendance");
};

const resolveAttendanceRate = (attendanceSummary = {}) => {
    const presentDays = Number(attendanceSummary?.present_days ?? 0);
    const totalDays = Number(attendanceSummary?.total_days ?? 0);

    if (!Number.isFinite(totalDays) || totalDays <= 0) {
        return null;
    }

    const safePresentDays = Number.isFinite(presentDays) ? presentDays : 0;
    const rate = safePresentDays / totalDays;

    return Math.max(0, Math.min(1, rate));
};

const calculateFinalGrade = (
    grades = {},
    categories = [],
    quarter = 1,
    attendanceSummary = null,
) => {
    if (!categories.length) return "N/A";

    const quarterGrades = grades?.[quarter] ?? {};
    const attendanceRate = resolveAttendanceRate(attendanceSummary);

    let totalWeight = 0;
    let weightedScore = 0;

    categories.forEach((category) => {
        if (isAttendanceCategory(category)) {
            if (attendanceRate === null || !category.weight) {
                return;
            }

            weightedScore += attendanceRate * category.weight;
            totalWeight += category.weight;
            return;
        }

        const tasks = category?.tasks ?? [];
        if (!tasks.length || !category.weight) {
            return;
        }

        let earned = 0;
        let possible = 0;

        tasks.forEach((task) => {
            const rawValue = quarterGrades?.[task.id];

            if (
                rawValue === "" ||
                rawValue === null ||
                rawValue === undefined
            ) {
                return;
            }

            const numericValue = Number(rawValue);

            if (Number.isNaN(numericValue)) {
                return;
            }

            earned += numericValue;
            possible += Number(task.total ?? 0);
        });

        if (!possible) {
            return;
        }

        const categoryAverage = earned / possible;
        weightedScore += categoryAverage * category.weight;
        totalWeight += category.weight;
    });

    if (!totalWeight) {
        return "—";
    }

    const percentage = (weightedScore / totalWeight) * 100;
    return `${percentage.toFixed(1)}%`;
};

const calculateOverallFinalGrade = (
    grades = {},
    categories = [],
    attendanceSummary = null,
) => {
    const q1Complete = isQuarterComplete(
        grades,
        categories,
        1,
        attendanceSummary,
    );
    const q2Complete = isQuarterComplete(
        grades,
        categories,
        2,
        attendanceSummary,
    );

    // Final grade is only available when both quarters are complete
    if (!q1Complete || !q2Complete) {
        return "—";
    }

    const q1Grade = calculateFinalGrade(
        grades,
        categories,
        1,
        attendanceSummary,
    );
    const q2Grade = calculateFinalGrade(
        grades,
        categories,
        2,
        attendanceSummary,
    );

    if (q1Grade === "—" || q2Grade === "—") {
        return "—";
    }

    const q1Numeric = parseFloat(q1Grade);
    const q2Numeric = parseFloat(q2Grade);

    if (isNaN(q1Numeric) || isNaN(q2Numeric)) {
        return "—";
    }

    const average = (q1Numeric + q2Numeric) / 2;
    return `${average.toFixed(1)}%`;
};

// Calculate Expected Quarterly Grade - projects what the grade would be if all remaining tasks are completed at current performance level
const calculateExpectedQuarterlyGrade = (
    grades = {},
    categories = [],
    quarter = 1,
    attendanceSummary = null,
) => {
    if (!categories.length) return "N/A";

    const quarterGrades = grades?.[quarter] ?? {};
    const attendanceRate = resolveAttendanceRate(attendanceSummary);

    let totalEarned = 0;
    let totalPossible = 0;
    let completedTasksCount = 0;
    let totalTasksCount = 0;

    // First pass: calculate current performance rate
    categories.forEach((category) => {
        if (isAttendanceCategory(category)) {
            return;
        }

        const tasks = category?.tasks ?? [];
        tasks.forEach((task) => {
            totalTasksCount++;
            const rawValue = quarterGrades?.[task.id];

            if (
                rawValue === "" ||
                rawValue === null ||
                rawValue === undefined
            ) {
                return;
            }

            const numericValue = Number(rawValue);
            if (Number.isNaN(numericValue)) {
                return;
            }

            completedTasksCount++;
            totalEarned += numericValue;
            totalPossible += Number(task.total ?? 0);
        });
    });

    // If no tasks completed yet, return N/A
    if (!completedTasksCount || !totalPossible) {
        return "—";
    }

    // Calculate current performance rate
    const currentPerformanceRate = totalEarned / totalPossible;

    // Now calculate expected grade assuming same performance on remaining tasks
    let weightedScore = 0;
    let totalWeight = 0;

    categories.forEach((category) => {
        if (isAttendanceCategory(category)) {
            if (attendanceRate !== null && category.weight) {
                weightedScore += attendanceRate * category.weight;
                totalWeight += category.weight;
            }
            return;
        }

        const tasks = category?.tasks ?? [];
        if (!tasks.length || !category.weight) {
            return;
        }

        let earned = 0;
        let possible = 0;

        tasks.forEach((task) => {
            const taskTotal = Number(task.total ?? 0);
            const rawValue = quarterGrades?.[task.id];

            if (
                rawValue === "" ||
                rawValue === null ||
                rawValue === undefined
            ) {
                // Project score based on current performance
                earned += taskTotal * currentPerformanceRate;
                possible += taskTotal;
            } else {
                const numericValue = Number(rawValue);
                if (!Number.isNaN(numericValue)) {
                    earned += numericValue;
                    possible += taskTotal;
                }
            }
        });

        if (!possible) {
            return;
        }

        const categoryAverage = earned / possible;
        weightedScore += categoryAverage * category.weight;
        totalWeight += category.weight;
    });

    if (!totalWeight) {
        return "—";
    }

    const percentage = (weightedScore / totalWeight) * 100;
    return `${percentage.toFixed(1)}%`;
};

// Check if a quarter has quarterly exam scores (indicates quarter is started/finished)
const hasQuarterlyExamScores = (grades = {}, categories = [], quarter = 1) => {
    const quarterGrades = grades?.[quarter] ?? {};

    const quarterlyExamCategory = categories.find(
        (cat) =>
            cat.id === "quarterly_exam" ||
            cat.label?.toLowerCase().includes("quarterly exam"),
    );

    if (!quarterlyExamCategory || !quarterlyExamCategory.tasks?.length) {
        return false;
    }

    return quarterlyExamCategory.tasks.some((task) => {
        const value = quarterGrades?.[task.id];
        return value !== "" && value !== null && value !== undefined;
    });
};

// Check if quarter is complete (all categories have at least some scores)
const isQuarterComplete = (
    grades = {},
    categories = [],
    quarter = 1,
    attendanceSummary = null,
) => {
    if (!categories.length) return false;

    const quarterGrades = grades?.[quarter] ?? {};
    const attendanceRate = resolveAttendanceRate(attendanceSummary);

    return categories.every((category) => {
        if (isAttendanceCategory(category)) {
            return attendanceRate !== null;
        }

        const tasks = category?.tasks ?? [];
        if (!tasks.length) return false;

        return tasks.some((task) => {
            const value = quarterGrades?.[task.id];
            return value !== "" && value !== null && value !== undefined;
        });
    });
};

export {
    calculateFinalGrade,
    calculateOverallFinalGrade,
    calculateExpectedQuarterlyGrade,
    hasQuarterlyExamScores,
    isQuarterComplete,
};

/**
 * Grade Calculation API Utilities
 *
 * Frontend utilities for calling server-side grade calculations
 * Replaces client-side calculations for data integrity
 */

/**
 * Fetch calculated grades for a class
 */
export const fetchClassGrades = async (classId) => {
    try {
        const response = await fetch(
            `/teacher/classes/${classId}/calculate-grades`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                credentials: "same-origin",
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching class grades:", error);
        throw error;
    }
};

/**
 * Fetch calculated grades for a specific student
 */
export const fetchStudentGrades = async (classId, enrollmentId) => {
    try {
        const response = await fetch(
            `/teacher/classes/${classId}/students/${enrollmentId}/calculate-grades`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                credentials: "same-origin",
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching student grades:", error);
        throw error;
    }
};

/**
 * Recalculate grades after bulk update
 */
export const recalculateGrades = async (classId, enrollmentIds = null) => {
    try {
        const body = enrollmentIds ? { enrollment_ids: enrollmentIds } : {};

        const response = await fetch(
            `/teacher/classes/${classId}/recalculate-grades`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
                credentials: "same-origin",
                body: JSON.stringify(body),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error recalculating grades:", error);
        throw error;
    }
};

/**
 * Helper function to extract grades from API response
 */
export const extractGradesFromResponse = (apiResponse) => {
    if (!apiResponse?.data?.calculated_grades) {
        return {};
    }

    const gradesMap = {};

    apiResponse.data.calculated_grades.forEach((item) => {
        if (item.enrollment_id && item.calculated_grades) {
            gradesMap[item.enrollment_id] = item.calculated_grades;
        }
    });

    return gradesMap;
};

/**
 * Helper function to get grade display value
 */
export const getGradeDisplayValue = (
    calculatedGrades,
    type = "overall_grade",
) => {
    if (!calculatedGrades || !calculatedGrades[type]) {
        return "—";
    }

    return calculatedGrades[type];
};

/**
 * Helper function to check if quarter is complete
 */
export const isQuarterComplete = (calculatedGrades, quarter = 1) => {
    if (!calculatedGrades) return false;

    const key = `q${quarter}_complete`;
    return calculatedGrades[key] === true;
};

/**
 * Helper function to check if quarter has exam scores
 */
export const hasQuarterExamScores = (calculatedGrades, quarter = 1) => {
    if (!calculatedGrades) return false;

    const key = `q${quarter}_has_exam`;
    return calculatedGrades[key] === true;
};

/**
 * Debounced grade calculation caller
 * Prevents too many API calls when user is typing
 */
let recalculateTimeout;
export const debouncedRecalculate = (
    classId,
    enrollmentIds = null,
    delay = 1000,
) => {
    clearTimeout(recalculateTimeout);

    return new Promise((resolve, reject) => {
        recalculateTimeout = setTimeout(async () => {
            try {
                const result = await recalculateGrades(classId, enrollmentIds);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, delay);
    });
};

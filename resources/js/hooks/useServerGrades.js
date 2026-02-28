import { useState, useEffect, useCallback } from "react";
import {
    fetchClassGrades,
    recalculateGrades,
    extractGradesFromResponse,
    debouncedRecalculate,
} from "@/utils/gradeCalculationApi";

/**
 * Custom hook for managing server-calculated grades
 *
 * Replaces frontend grade calculations with server-side calculations
 * Provides loading states, error handling, and optimistic updates
 */
export const useServerGrades = (classId, initialGrades = {}) => {
    const [calculatedGrades, setCalculatedGrades] = useState(initialGrades);
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculationError, setCalculationError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    /**
     * Fetch grades from server
     */
    const fetchGrades = useCallback(async () => {
        if (!classId) return;

        setIsCalculating(true);
        setCalculationError(null);

        try {
            const response = await fetchClassGrades(classId);
            const grades = extractGradesFromResponse(response);

            setCalculatedGrades(grades);
            setLastUpdated(
                response.data?.updated_at || new Date().toISOString(),
            );
        } catch (error) {
            console.error("Error fetching grades:", error);
            setCalculationError(error.message);
        } finally {
            setIsCalculating(false);
        }
    }, [classId]);

    /**
     * Recalculate grades (immediate)
     */
    const recalculate = useCallback(
        async (enrollmentIds = null) => {
            if (!classId) return;

            setIsCalculating(true);
            setCalculationError(null);

            try {
                const response = await recalculateGrades(
                    classId,
                    enrollmentIds,
                );
                const grades = extractGradesFromResponse(response);

                setCalculatedGrades(grades);
                setLastUpdated(
                    response.data?.updated_at || new Date().toISOString(),
                );

                return response;
            } catch (error) {
                console.error("Error recalculating grades:", error);
                setCalculationError(error.message);
                throw error;
            } finally {
                setIsCalculating(false);
            }
        },
        [classId],
    );

    /**
     * Debounced recalculation (for typing scenarios)
     */
    const debouncedRecalculateGrades = useCallback(
        async (enrollmentIds = null, delay = 1000) => {
            if (!classId) return;

            try {
                // Show calculating state immediately
                setIsCalculating(true);
                setCalculationError(null);

                const response = await debouncedRecalculate(
                    classId,
                    enrollmentIds,
                    delay,
                );
                const grades = extractGradesFromResponse(response);

                setCalculatedGrades(grades);
                setLastUpdated(
                    response.data?.updated_at || new Date().toISOString(),
                );

                return response;
            } catch (error) {
                console.error("Error in debounced recalculation:", error);
                setCalculationError(error.message);
                throw error;
            } finally {
                setIsCalculating(false);
            }
        },
        [classId],
    );

    /**
     * Get calculated grade for a specific student and type
     */
    const getStudentGrade = useCallback(
        (enrollmentId, gradeType = "overall_grade") => {
            const studentGrades = calculatedGrades[enrollmentId];
            if (!studentGrades) return "—";

            return studentGrades[gradeType] || "—";
        },
        [calculatedGrades],
    );

    /**
     * Check if student's quarter is complete
     */
    const isStudentQuarterComplete = useCallback(
        (enrollmentId, quarter = 1) => {
            const studentGrades = calculatedGrades[enrollmentId];
            if (!studentGrades) return false;

            return studentGrades[`q${quarter}_complete`] === true;
        },
        [calculatedGrades],
    );

    /**
     * Check if student has exam scores for quarter
     */
    const hasStudentExamScores = useCallback(
        (enrollmentId, quarter = 1) => {
            const studentGrades = calculatedGrades[enrollmentId];
            if (!studentGrades) return false;

            return studentGrades[`q${quarter}_has_exam`] === true;
        },
        [calculatedGrades],
    );

    /**
     * Get all grades for a student
     */
    const getStudentAllGrades = useCallback(
        (enrollmentId) => {
            return calculatedGrades[enrollmentId] || {};
        },
        [calculatedGrades],
    );

    /**
     * Initialize grades on mount
     */
    useEffect(() => {
        if (classId && Object.keys(calculatedGrades).length === 0) {
            fetchGrades();
        }
    }, [classId, calculatedGrades, fetchGrades]);

    return {
        // Data
        calculatedGrades,
        lastUpdated,

        // Loading states
        isCalculating,
        calculationError,

        // Actions
        fetchGrades,
        recalculate,
        debouncedRecalculateGrades,

        // Helpers
        getStudentGrade,
        isStudentQuarterComplete,
        hasStudentExamScores,
        getStudentAllGrades,

        // Utilities
        clearError: () => setCalculationError(null),
        resetGrades: () => setCalculatedGrades({}),
    };
};

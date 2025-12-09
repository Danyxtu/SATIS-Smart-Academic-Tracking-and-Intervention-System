import React from "react";
import { router } from "@inertiajs/react";
import { Calendar, BookOpen } from "lucide-react";

/**
 * Reusable Semester Navigation Component
 * Allows users to switch between semester views
 *
 * @param {Object} props
 * @param {number} props.currentSemester - Currently selected semester (1 or 2)
 * @param {string} props.schoolYear - Current school year (e.g., "2024-2025")
 * @param {number} props.semester1Count - Number of subjects in semester 1
 * @param {number} props.semester2Count - Number of subjects in semester 2
 * @param {string} props.routeName - The route name to navigate to (default: current route)
 * @param {Object} props.routeParams - Additional route parameters to preserve
 */
const SemesterNavigation = ({
    currentSemester = 1,
    schoolYear = "",
    semester1Count = 0,
    semester2Count = 0,
    routeName = null,
    routeParams = {},
}) => {
    const handleSemesterChange = (semester) => {
        if (semester === currentSemester) return;

        // Navigate with semester query parameter
        router.get(
            window.location.pathname,
            { ...routeParams, semester },
            {
                preserveState: true,
                preserveScroll: true,
                only: ["subjects", "stats", "semesters"],
            }
        );
    };

    const semesters = [
        {
            id: 1,
            label: "1st Semester",
            shortLabel: "Sem 1",
            count: semester1Count,
        },
        {
            id: 2,
            label: "2nd Semester",
            shortLabel: "Sem 2",
            count: semester2Count,
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
            {/* Header with School Year */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-pink-600" />
                    <span className="font-semibold text-gray-700">
                        Academic Year {schoolYear}
                    </span>
                </div>
            </div>

            {/* Semester Tabs */}
            <div className="flex gap-2">
                {semesters.map((semester) => {
                    const isActive = currentSemester === semester.id;
                    const hasSubjects = semester.count > 0;

                    return (
                        <button
                            key={semester.id}
                            onClick={() => handleSemesterChange(semester.id)}
                            disabled={!hasSubjects}
                            className={`
                                flex-1 relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all
                                ${
                                    isActive
                                        ? "bg-pink-600 text-white shadow-md"
                                        : hasSubjects
                                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        : "bg-gray-50 text-gray-400 cursor-not-allowed"
                                }
                            `}
                        >
                            <BookOpen size={18} />
                            <span className="hidden sm:inline">
                                {semester.label}
                            </span>
                            <span className="sm:hidden">
                                {semester.shortLabel}
                            </span>

                            {/* Subject Count Badge */}
                            <span
                                className={`
                                    ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                                    ${
                                        isActive
                                            ? "bg-white/20 text-white"
                                            : "bg-gray-200 text-gray-600"
                                    }
                                `}
                            >
                                {semester.count}
                            </span>

                            {/* Active Indicator */}
                            {isActive && (
                                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-pink-600 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Info Text */}
            <p className="text-center text-xs text-gray-500 mt-3">
                Viewing {currentSemester === 1 ? "First" : "Second"} Semester
                subjects
                {semester1Count + semester2Count > 0 && (
                    <span className="ml-1">
                        (
                        {currentSemester === 1
                            ? semester1Count
                            : semester2Count}{" "}
                        of {semester1Count + semester2Count} total)
                    </span>
                )}
            </p>
        </div>
    );
};

export default SemesterNavigation;

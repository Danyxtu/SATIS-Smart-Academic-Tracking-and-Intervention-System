import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SuperAdminLayout from "@/Layouts/SuperAdminLayout";
import { Head } from "@inertiajs/react";
import { useLoading } from "@/Context/LoadingContext";

// Icons
import {
    LayoutGrid,
    List,
    Check,
    XIcon,
    Clock,
    History,
    AlertCircle,
} from "lucide-react";

// Utils
import showToast from "@/Utils/toast";
import { buildSeatLayout } from "@/Utils/Teacher/Attendance";

// Components
import NavLink from "@/Components/NavLink";
import SeatingGrid from "@/Components/SeatingGrid";
import StudentList from "@/Components/StudentList";

const GRID_ROWS = 5;
const GRID_COLS = 10;

const Attendance = (props) => {
    // Props from the server
    const { classes, rosters } = props;
    console.log("Rosters:", rosters);
    console.log("Classes:", classes);

    const { startLoading, stopLoading } = useLoading();
    const [viewMode, setViewMode] = useState("grid");
    const [selectedClassId, setSelectedClassId] = useState(
        classes[0]?.id ?? null,
    );

    const [currentDate, setCurrentDate] = useState(
        new Date().toISOString().split("T")[0],
    );
    const [isDraggingEnabled, setIsDraggingEnabled] = useState(false);
    const [attendanceAlreadySaved, setAttendanceAlreadySaved] = useState(false);
    const [checkingAttendance, setCheckingAttendance] = useState(false);

    // Check if selected date is a Sunday
    const isSunday = useMemo(() => {
        const date = new Date(currentDate);
        return date.getDay() === 0; // 0 = Sunday
    }, [currentDate]);

    const baseStates = useMemo(() => {
        const map = {};

        classes.forEach((cls) => {
            const roster = (rosters[cls.id] || []).map((student) => ({
                ...student,
                status: student.status || "present",
            }));

            map[cls.id] = {
                students: roster,
                seatLayout: buildSeatLayout(roster),
            };
        });

        return map;
    }, [classes, rosters]);

    const [classStates, setClassStates] = useState(baseStates);

    useEffect(() => {
        setClassStates(baseStates);
    }, [baseStates]);

    useEffect(() => {
        if (!selectedClassId && classes[0]) {
            setSelectedClassId(classes[0].id);
        }
    }, [classes, selectedClassId]);

    // Check if attendance already exists for selected class and date
    useEffect(() => {
        const checkAttendanceExists = async () => {
            if (!selectedClassId || !currentDate) {
                setAttendanceAlreadySaved(false);
                return;
            }

            setCheckingAttendance(true);
            try {
                const response = await axios.get(
                    route("teacher.attendance.check"),
                    {
                        params: { classId: selectedClassId, date: currentDate },
                    },
                );
                setAttendanceAlreadySaved(response.data.exists);
            } catch (error) {
                setAttendanceAlreadySaved(false);
            } finally {
                setCheckingAttendance(false);
            }
        };

        checkAttendanceExists();
    }, [selectedClassId, currentDate]);

    const currentClassState = useMemo(() => {
        if (selectedClassId && classStates[selectedClassId]) {
            return classStates[selectedClassId];
        }

        return {
            students: [],
            seatLayout: buildSeatLayout([]),
        };
    }, [classStates, selectedClassId]);

    const students = currentClassState.students;
    const seatLayout = currentClassState.seatLayout;

    const stats = useMemo(() => {
        const present = students.filter((s) => s.status === "present").length;
        const absent = students.filter((s) => s.status === "absent").length;
        const late = students.filter((s) => s.status === "late").length;
        return { present, absent, late, total: students.length };
    }, [students]);

    const handleViewModeChange = (newMode) => {
        startLoading();
        setTimeout(() => {
            setViewMode(newMode);
            stopLoading();
        }, 150);
    };

    // Update students helper
    const updateStudents = (updater) => {
        if (!selectedClassId) return;

        setClassStates((prev) => {
            const current = prev[selectedClassId];
            if (!current) return prev;

            return {
                ...prev,
                [selectedClassId]: {
                    ...current,
                    students: updater(current.students),
                },
            };
        });
    };

    // Update seat layout
    const updateSeatLayout = (updater) => {
        if (!selectedClassId) return;

        setClassStates((prev) => {
            const current = prev[selectedClassId];
            if (!current) return prev;

            return {
                ...prev,
                [selectedClassId]: {
                    ...current,
                    seatLayout: updater(current.seatLayout),
                },
            };
        });
    };

    // Handle grid item click
    const handleGridClick = (studentId) => {
        if (isDraggingEnabled || !selectedClassId) return;

        updateStudents((currentStudents) =>
            currentStudents.map((student) => {
                if (student.id !== studentId) {
                    return student;
                }

                if (student.status === "present") {
                    return { ...student, status: "absent" };
                }

                if (student.status === "absent") {
                    return { ...student, status: "late" };
                }

                return { ...student, status: "present" };
            }),
        );
    };

    // Handle list item click
    const handleListClick = (studentId, newStatus) => {
        updateStudents((currentStudents) =>
            currentStudents.map((student) =>
                student.id === studentId
                    ? { ...student, status: newStatus }
                    : student,
            ),
        );
    };

    // Handle seat drag and drop
    const handleSeatDrop = (draggedSeatInfo, targetCoords) => {
        updateSeatLayout((prevLayout) => {
            const newLayout = [...prevLayout];

            const sourceIndex = newLayout.findIndex(
                (seat) =>
                    seat.row === draggedSeatInfo.row &&
                    seat.col === draggedSeatInfo.col,
            );
            const targetIndex = newLayout.findIndex(
                (seat) =>
                    seat.row === targetCoords.row &&
                    seat.col === targetCoords.col,
            );

            if (sourceIndex === -1 || targetIndex === -1) {
                return prevLayout;
            }

            const sourceSeat = newLayout[sourceIndex];
            const targetSeat = newLayout[targetIndex];

            newLayout[sourceIndex] = {
                ...sourceSeat,
                studentId: targetSeat.studentId,
            };
            newLayout[targetIndex] = {
                ...targetSeat,
                studentId: draggedSeatInfo.studentId,
            };

            return newLayout;
        });
    };

    // Submit attendance
    const handleSubmit = async () => {
        if (!selectedClassId) return;

        const payload = {
            classId: selectedClassId,
            date: currentDate,
            students: students.map((s) => ({ id: s.id, status: s.status })),
            seatLayout,
        };

        startLoading();

        try {
            const response = await axios.post(
                route("teacher.attendance.create"),
                payload,
            );
            showToast.success(
                response.data.message ||
                    `Attendance saved for ${stats.total} students.`,
            );
        } catch (error) {
            if (
                error.response?.status === 422 &&
                error.response?.data?.already_saved
            ) {
                showToast.error(error.response.data.message);
            } else if (error.response?.data?.message) {
                showToast.error(error.response.data.message);
            } else {
                showToast.error("Failed to save attendance. Please try again.");
            }
        } finally {
            stopLoading();
        }
    };

    const hasClasses = classes.length > 0;

    return (
        <>
            <Head title="Attendance" />
            <div className="space-y-4">
                {/* Compact Header */}
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Take Attendance
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select a class and mark attendance
                    </p>
                </div>

                {/* Compact Controls Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sticky top-16 z-40">
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Left: Class & Date Selectors */}
                        <div className="flex flex-wrap items-end gap-3 flex-1">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Class
                                </label>
                                {hasClasses ? (
                                    <select
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-1.5"
                                        value={selectedClassId ?? ""}
                                        onChange={(e) =>
                                            setSelectedClassId(
                                                Number(e.target.value),
                                            )
                                        }
                                    >
                                        {classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 py-1.5">
                                        No classes assigned
                                    </p>
                                )}
                            </div>

                            <div className="w-full sm:w-auto">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    className={`rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-1.5 ${
                                        isSunday
                                            ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                                            : ""
                                    }`}
                                    value={currentDate}
                                    onChange={(e) =>
                                        setCurrentDate(e.target.value)
                                    }
                                />
                                {isSunday && (
                                    <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
                                        <AlertCircle size={10} /> Sunday - No
                                        classes
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-wrap items-end gap-2">
                            <button
                                onClick={() =>
                                    setIsDraggingEnabled(!isDraggingEnabled)
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    isDraggingEnabled
                                        ? "bg-red-500 text-white hover:bg-red-600"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                {isDraggingEnabled
                                    ? "Disable Drag"
                                    : "Enable Drag"}
                            </button>

                            <NavLink
                                href="/teacher/attendance/log"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <History size={14} />
                                View Log
                            </NavLink>

                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <button
                                    onClick={() => handleViewModeChange("grid")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                        viewMode === "grid"
                                            ? "bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm"
                                            : "text-gray-600 dark:text-gray-400"
                                    }`}
                                >
                                    <LayoutGrid size={14} />
                                    Grid
                                </button>
                                <button
                                    onClick={() => handleViewModeChange("list")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                        viewMode === "list"
                                            ? "bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm"
                                            : "text-gray-600 dark:text-gray-400"
                                    }`}
                                >
                                    <List size={14} />
                                    List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="pb-20">
                    {hasClasses && selectedClassId ? (
                        viewMode === "grid" ? (
                            <SeatingGrid
                                className="active:cursor-grab"
                                students={students}
                                seatLayout={seatLayout}
                                onClick={handleGridClick}
                                isDraggingEnabled={isDraggingEnabled}
                                onSeatDrop={handleSeatDrop}
                            />
                        ) : (
                            <StudentList
                                students={students}
                                onClick={handleListClick}
                            />
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                                <AlertCircle className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                No Classes Available
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Create a class to start taking attendance
                            </p>
                        </div>
                    )}
                </div>

                {/* Compact Bottom Bar */}
                {/* Compact Bottom Bar */}
                <div className="fixed bottom-0 left-0 lg:left-56 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                            {/* Stats */}
                            <div className="flex items-center gap-3 lg:gap-4">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:inline">
                                    Summary:
                                </span>
                                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                    <Check size={16} />
                                    <span className="font-bold text-sm">
                                        {stats.present}
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">
                                        Present
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                                    <XIcon size={16} />
                                    <span className="font-bold text-sm">
                                        {stats.absent}
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">
                                        Absent
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
                                    <Clock size={16} />
                                    <span className="font-bold text-sm">
                                        {stats.late}
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">
                                        Late
                                    </span>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex flex-col items-end gap-1">
                                {attendanceAlreadySaved && !isSunday && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                        ⚠️ Already saved for this date
                                    </span>
                                )}
                                {isSunday && (
                                    <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                                        🚫 Cannot save on Sunday
                                    </span>
                                )}
                                <button
                                    onClick={handleSubmit}
                                    disabled={
                                        !hasClasses ||
                                        attendanceAlreadySaved ||
                                        checkingAttendance ||
                                        isSunday
                                    }
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                        attendanceAlreadySaved || isSunday
                                            ? "bg-gray-400 dark:bg-gray-600 text-white"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                                    }`}
                                >
                                    {checkingAttendance
                                        ? "Checking..."
                                        : isSunday
                                          ? "No Class"
                                          : attendanceAlreadySaved
                                            ? "Already Saved"
                                            : "Save Attendance"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

Attendance.layout = (page) => <SuperAdminLayout children={page} />;

export default Attendance;

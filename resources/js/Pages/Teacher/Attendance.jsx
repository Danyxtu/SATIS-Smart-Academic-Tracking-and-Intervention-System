import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import TeacherLayout from "@/Layouts/TeacherLayout";
import { Head } from "@inertiajs/react";
import { useLoading } from "@/Context/LoadingContext";

// Icons
import { LayoutGrid, List, Check, XIcon, Clock, History } from "lucide-react";

// Utils
import showToast from "@/Utils/toast";

// Components
import NavLink from "@/Components/NavLink";
import SeatingGrid from "@/Components/SeatingGrid";
import StudentList from "@/Components/StudentList";

const GRID_ROWS = 5;
const GRID_COLS = 10;

const buildSeatLayout = (students) => {
    const totalSeats = GRID_ROWS * GRID_COLS;
    const assignments = students.map((student) => student.id);

    while (assignments.length < totalSeats) {
        assignments.push(null);
    }

    return assignments.map((studentId, index) => ({
        row: Math.floor(index / GRID_COLS) + 1,
        col: (index % GRID_COLS) + 1,
        studentId,
    }));
};

const Attendance = (props) => {
    // Props from the server
    const { classes, rosters } = props;
    console.log("Rosters:", rosters);
    console.log("Classes:", classes);

    const { startLoading, stopLoading } = useLoading();
    const [viewMode, setViewMode] = useState("grid");
    const [selectedClassId, setSelectedClassId] = useState(
        classes[0]?.id ?? null
    );

    const [currentDate, setCurrentDate] = useState(
        new Date().toISOString().split("T")[0]
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
                    }
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
            })
        );
    };

    // Handle list item click
    const handleListClick = (studentId, newStatus) => {
        updateStudents((currentStudents) =>
            currentStudents.map((student) =>
                student.id === studentId
                    ? { ...student, status: newStatus }
                    : student
            )
        );
    };

    // Handle seat drag and drop
    const handleSeatDrop = (draggedSeatInfo, targetCoords) => {
        updateSeatLayout((prevLayout) => {
            const newLayout = [...prevLayout];

            const sourceIndex = newLayout.findIndex(
                (seat) =>
                    seat.row === draggedSeatInfo.row &&
                    seat.col === draggedSeatInfo.col
            );
            const targetIndex = newLayout.findIndex(
                (seat) =>
                    seat.row === targetCoords.row &&
                    seat.col === targetCoords.col
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
                route("teacher.attendance.store"),
                payload
            );
            showToast.success(
                response.data.message ||
                    `Attendance saved for ${stats.total} students.`
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
            <div className="bg-gray-100 min-h-screen p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Take Attendance
                    </h1>
                    <p className="text-lg text-gray-600">
                        Select a class and choose your preferred method.
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-8 sticky top-20 z-40">
                    <div className="flex items-center gap-4">
                        <div>
                            <label
                                htmlFor="classSelect"
                                className="block text-sm font-medium text-gray-500 mb-1"
                            >
                                Class
                            </label>
                            {hasClasses ? (
                                <select
                                    id="classSelect"
                                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={selectedClassId ?? ""}
                                    onChange={(e) =>
                                        setSelectedClassId(
                                            Number(e.target.value)
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
                                <p className="text-sm text-gray-500">
                                    No classes assigned yet.
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="dateSelect"
                                className="block text-sm font-medium text-gray-500 mb-1"
                            >
                                Date
                            </label>
                            <input
                                type="date"
                                id="dateSelect"
                                className={`rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                    isSunday ? "border-red-300 bg-red-50" : ""
                                }`}
                                value={currentDate}
                                onChange={(e) => setCurrentDate(e.target.value)}
                            />
                            {isSunday && (
                                <p className="text-xs text-red-600 mt-1">
                                    ⚠️ Sunday - No classes
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() =>
                                setIsDraggingEnabled(!isDraggingEnabled)
                            }
                            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors
                                ${
                                    isDraggingEnabled
                                        ? "bg-red-500 text-white hover:bg-red-600"
                                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                }`}
                        >
                            {isDraggingEnabled
                                ? "Disable Dragging"
                                : "Enable Dragging"}
                        </button>
                        <NavLink
                            href="/teacher/attendance/log"
                            className="flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                        >
                            <History size={18} />
                            View Log
                        </NavLink>

                        <div className="flex items-center p-1 bg-gray-200 rounded-lg">
                            <button
                                onClick={() => handleViewModeChange("grid")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm
                                ${
                                    viewMode === "grid"
                                        ? "bg-white text-indigo-700 shadow-sm"
                                        : "text-gray-600 hover:text-gray-800"
                                }`}
                            >
                                <LayoutGrid size={18} />
                                Grid View
                            </button>
                            <button
                                onClick={() => handleViewModeChange("list")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm
                                ${
                                    viewMode === "list"
                                        ? "bg-white text-indigo-700 shadow-sm"
                                        : "text-gray-600 hover:text-gray-800"
                                }`}
                            >
                                <List size={18} />
                                List View
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pb-24">
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
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl shadow">
                            <p className="text-xl font-semibold text-gray-700">
                                You don't have any classes yet.
                            </p>
                            <p className="text-gray-500">
                                Create a class to start taking attendance.
                            </p>
                        </div>
                    )}
                </div>

                <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 shadow-lg-top z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-20">
                            <div className="flex items-center space-x-6">
                                <h3 className="text-lg font-medium text-gray-800 hidden sm:block">
                                    Summary:
                                </h3>
                                <div className="flex items-center gap-2 text-green-600">
                                    <Check size={20} />
                                    <span className="font-bold text-lg">
                                        {stats.present}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        Present
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-red-600">
                                    <XIcon size={20} />
                                    <span className="font-bold text-lg">
                                        {stats.absent}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        Absent
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-yellow-600">
                                    <Clock size={20} />
                                    <span className="font-bold text-lg">
                                        {stats.late}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        Late
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {attendanceAlreadySaved && !isSunday && (
                                    <span className="text-sm text-amber-600 font-medium">
                                        ⚠️ Attendance already saved for this
                                        date
                                    </span>
                                )}
                                {isSunday && (
                                    <span className="text-sm text-red-600 font-medium">
                                        🚫 Cannot take attendance on Sunday
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
                                    className={`font-semibold py-3 px-6 rounded-lg shadow-md transition-colors disabled:opacity-50 ${
                                        attendanceAlreadySaved || isSunday
                                            ? "bg-gray-400 text-white cursor-not-allowed"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                                    }`}
                                >
                                    {checkingAttendance
                                        ? "Checking..."
                                        : isSunday
                                        ? "No Class on Sunday"
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

Attendance.layout = (page) => <TeacherLayout children={page} />;

export default Attendance;

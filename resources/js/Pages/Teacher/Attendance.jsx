import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useLoading } from "@/Context/LoadingContext";
import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    LayoutGrid,
    List,
    Check,
    XIcon,
    Clock,
    History,
    AlertCircle,
    Users,
} from "lucide-react";
import showToast from "@/Utils/toast";
import { buildSeatLayout } from "@/Utils/Teacher/Attendance";
import SeatingGrid from "@/Components/SeatingGrid";
import StudentList from "@/Components/StudentList";

const CLASS_COLOR_STYLES = {
    indigo: {
        accent: "bg-indigo-500",
        soft: "bg-indigo-50 dark:bg-indigo-900/30",
        text: "text-indigo-700 dark:text-indigo-300",
    },
    blue: {
        accent: "bg-blue-500",
        soft: "bg-blue-50 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-300",
    },
    emerald: {
        accent: "bg-emerald-500",
        soft: "bg-emerald-50 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-300",
    },
    teal: {
        accent: "bg-teal-500",
        soft: "bg-teal-50 dark:bg-teal-900/30",
        text: "text-teal-700 dark:text-teal-300",
    },
    amber: {
        accent: "bg-amber-500",
        soft: "bg-amber-50 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-300",
    },
    rose: {
        accent: "bg-rose-500",
        soft: "bg-rose-50 dark:bg-rose-900/30",
        text: "text-rose-700 dark:text-rose-300",
    },
    violet: {
        accent: "bg-violet-500",
        soft: "bg-violet-50 dark:bg-violet-900/30",
        text: "text-violet-700 dark:text-violet-300",
    },
};

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const Attendance = ({ classes, rosters, initialSelectedClassId = null }) => {
    const { startLoading, stopLoading } = useLoading();
    const dateInputRef = useRef(null);
    const [viewMode, setViewMode] = useState("grid");
    const [selectedClassId, setSelectedClassId] = useState(
        initialSelectedClassId ? Number(initialSelectedClassId) : null,
    );
    const [currentDate, setCurrentDate] = useState(getTodayDateString());
    const [isDraggingEnabled, setIsDraggingEnabled] = useState(false);
    const [attendanceAlreadySaved, setAttendanceAlreadySaved] = useState(false);
    const [checkingAttendance, setCheckingAttendance] = useState(false);

    useEffect(() => {
        if (initialSelectedClassId) {
            setSelectedClassId(Number(initialSelectedClassId));
        } else {
            setSelectedClassId(null);
        }
    }, [initialSelectedClassId]);

    const isSunday = useMemo(() => {
        const date = new Date(currentDate);
        return date.getDay() === 0;
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
                seatLayout: buildSeatLayout(roster, cls.seating_layout),
            };
        });

        return map;
    }, [classes, rosters]);

    const [classStates, setClassStates] = useState(baseStates);

    useEffect(() => {
        setClassStates(baseStates);
    }, [baseStates]);

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

    const selectedClass = useMemo(
        () => classes.find((cls) => cls.id === selectedClassId) ?? null,
        [classes, selectedClassId],
    );

    const selectedClassColor = selectedClass
        ? (CLASS_COLOR_STYLES[selectedClass.color] ?? CLASS_COLOR_STYLES.indigo)
        : CLASS_COLOR_STYLES.indigo;

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

    const formattedCurrentDate = useMemo(() => {
        const parsedDate = new Date(`${currentDate}T00:00:00`);
        if (Number.isNaN(parsedDate.getTime())) {
            return "Invalid date";
        }

        return parsedDate.toLocaleDateString("en-US", {
            month: "long",
            day: "2-digit",
            year: "numeric",
        });
    }, [currentDate]);

    const openDatePicker = () => {
        const input = dateInputRef.current;
        if (!input) {
            return;
        }

        if (typeof input.showPicker === "function") {
            input.showPicker();
            return;
        }

        input.focus();
        input.click();
    };

    const formatSummaryDate = (dateValue) => {
        if (!dateValue) {
            return "No attendance records yet";
        }

        const parsedDate = new Date(`${dateValue}T00:00:00`);
        if (Number.isNaN(parsedDate.getTime())) {
            return "No attendance records yet";
        }

        return parsedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const handleClassSelect = (classId) => {
        const id = Number(classId);
        
        // Use router.get to visit the class-specific URL
        // This ensures the browser address bar updates to /teacher/attendance/1
        router.get(route("teacher.attendance.index", { classId: id }), {}, {
            preserveState: true,
            preserveScroll: true,
        });

        // Set local state for immediate visual feedback
        setSelectedClassId(id);
        setViewMode("grid");
        setCurrentDate(getTodayDateString());
        setIsDraggingEnabled(false);
        setAttendanceAlreadySaved(false);
        setCheckingAttendance(false);
    };

    const handleBackToClassCards = () => {
        // Visit the root attendance URL
        router.get(route("teacher.attendance.index"), {}, {
            preserveState: true,
            preserveScroll: true,
        });

        // Clear local state
        setSelectedClassId(null);
        setIsDraggingEnabled(false);
        setAttendanceAlreadySaved(false);
        setCheckingAttendance(false);
    };

    const handleViewModeChange = (newMode) => {
        startLoading();
        setTimeout(() => {
            setViewMode(newMode);
            stopLoading();
        }, 150);
    };

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

    const handleListClick = (studentId, newStatus) => {
        updateStudents((currentStudents) =>
            currentStudents.map((student) =>
                student.id === studentId
                    ? { ...student, status: newStatus }
                    : student,
            ),
        );
    };

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

    const handleSaveLayout = async () => {
        if (!selectedClassId) return;

        startLoading();
        try {
            const response = await axios.post(
                route("teacher.attendance.layout.update"),
                {
                    classId: selectedClassId,
                    seatLayout,
                },
            );
            showToast.success(
                response.data.message || "Seating layout saved successfully.",
            );

            // Update the local classes prop so it's persisted correctly
            router.reload({ only: ["classes"] });
        } catch (error) {
            showToast.error("Failed to save seating layout.");
        } finally {
            stopLoading();
        }
    };

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
            setAttendanceAlreadySaved(true);
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
                {!selectedClass && (
                    <>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                Attendance Classes
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Select a class card to start taking attendance.
                            </p>
                        </div>

                        {hasClasses ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {classes.map((cls) => {
                                    const summary =
                                        cls.attendance_summary || {};
                                    const todaySummary = summary.today || {};
                                    const studentCount =
                                        cls.student_count ??
                                        rosters[cls.id]?.length ??
                                        0;
                                    const colorTheme =
                                        CLASS_COLOR_STYLES[cls.color] ??
                                        CLASS_COLOR_STYLES.indigo;

                                    return (
                                        <div
                                            key={cls.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() =>
                                                handleClassSelect(cls.id)
                                            }
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === "Enter" ||
                                                    event.key === " "
                                                ) {
                                                    event.preventDefault();
                                                    handleClassSelect(cls.id);
                                                }
                                            }}
                                            className="overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                        >
                                            <div
                                                className={`h-1.5 ${colorTheme.accent}`}
                                            />

                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                            Class:{" "}
                                                            {cls.grade_level} -{" "}
                                                            {cls.section}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                            {cls.subject}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                            todaySummary.is_recorded
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                                        }`}
                                                    >
                                                        {todaySummary.is_recorded
                                                            ? "Recorded Today"
                                                            : "Pending Today"}
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                                    <div className="rounded-lg bg-gray-50 px-2.5 py-2 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
                                                        <span className="flex items-center gap-1.5">
                                                            <Users size={12} />
                                                            {studentCount}{" "}
                                                            Students
                                                        </span>
                                                    </div>
                                                    <div className="rounded-lg bg-gray-50 px-2.5 py-2 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
                                                        <span className="flex items-center gap-1.5">
                                                            <CalendarDays
                                                                size={12}
                                                            />
                                                            {summary.days_recorded ??
                                                                0}{" "}
                                                            Days Logged
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                                                    <span>
                                                        Last record:{" "}
                                                        {formatSummaryDate(
                                                            summary.last_recorded_date,
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="mt-2 flex items-center gap-3 text-[11px]">
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                        P {summary.present ?? 0}
                                                    </span>
                                                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                                        A {summary.absent ?? 0}
                                                    </span>
                                                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                                        L {summary.late ?? 0}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <Link
                                                        href={route(
                                                            "teacher.attendance.log.show",
                                                            cls.id,
                                                        )}
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                    >
                                                        <History size={12} />
                                                        View Log
                                                    </Link>

                                                    <span
                                                        className={`text-[11px] font-semibold ${colorTheme.text}`}
                                                    >
                                                        Take Attendance
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                                    <AlertCircle className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    No Classes Available
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Create a class to start taking attendance.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {selectedClass && (
                    <>
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-start gap-3">
                                    <button
                                        type="button"
                                        onClick={handleBackToClassCards}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <ArrowLeft size={14} />
                                        Classes
                                    </button>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            Take Attendance
                                        </p>
                                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                            Class: {selectedClass.grade_level} -{" "}
                                            {selectedClass.section} -{" "}
                                            {selectedClass.subject}
                                        </h1>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${selectedClassColor.soft} ${selectedClassColor.text}`}
                                    >
                                        <Users size={13} />
                                        {selectedClass.grade_level} -{" "}
                                        {selectedClass.section}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        <BookOpen size={13} />
                                        {selectedClass.subject}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                        <CalendarDays size={13} />
                                        {formattedCurrentDate}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sticky top-2 z-40">
                            <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
                                <div className="flex flex-wrap items-end gap-3 flex-1">
                                    <div className="min-w-[220px]">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Selected Class
                                        </label>
                                        <p
                                            className={`rounded-lg px-3 py-2 text-sm font-semibold ${selectedClassColor.soft} ${selectedClassColor.text}`}
                                        >
                                            {selectedClass.label}
                                        </p>
                                    </div>

                                    <div className="w-auto">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Date
                                        </label>
                                        <div className="relative">
                                            <input
                                                ref={dateInputRef}
                                                type="date"
                                                className="absolute h-0 w-0 opacity-0 pointer-events-none"
                                                value={currentDate}
                                                onChange={(e) =>
                                                    setCurrentDate(
                                                        e.target.value,
                                                    )
                                                }
                                                aria-label="Select attendance date"
                                            />
                                            <button
                                                type="button"
                                                onClick={openDatePicker}
                                                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-sm font-bold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                    isSunday
                                                        ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
                                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                                }`}
                                            >
                                                <CalendarDays size={14} />
                                                <span>
                                                    {formattedCurrentDate}
                                                </span>
                                            </button>
                                        </div>
                                        {isSunday && (
                                            <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
                                                <AlertCircle size={10} /> Sunday
                                                - no classes
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-end gap-2">
                                    {isDraggingEnabled && (
                                        <button
                                            onClick={handleSaveLayout}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                                        >
                                            Save Layout
                                        </button>
                                    )}

                                    <button
                                        onClick={() =>
                                            setIsDraggingEnabled(
                                                !isDraggingEnabled,
                                            )
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

                                    <Link
                                        href={route(
                                            "teacher.attendance.log.show",
                                            selectedClass.id,
                                        )}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <History size={14} />
                                        View Log
                                    </Link>

                                    <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <button
                                            onClick={() =>
                                                handleViewModeChange("grid")
                                            }
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
                                            onClick={() =>
                                                handleViewModeChange("list")
                                            }
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

                        <div className="pb-20">
                            {viewMode === "grid" ? (
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
                            )}
                        </div>

                        <div className="fixed bottom-0 left-0 lg:left-56 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
                            <div className="px-4 py-3">
                                <div className="flex items-center justify-between">
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

                                    <div className="flex flex-col items-end gap-1">
                                        {attendanceAlreadySaved &&
                                            !isSunday && (
                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                                    Already saved for this date
                                                </span>
                                            )}
                                        {isSunday && (
                                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                                                Cannot save on Sunday
                                            </span>
                                        )}
                                        <button
                                            onClick={handleSubmit}
                                            disabled={
                                                !selectedClassId ||
                                                attendanceAlreadySaved ||
                                                checkingAttendance ||
                                                isSunday
                                            }
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                                attendanceAlreadySaved ||
                                                isSunday
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
                    </>
                )}
            </div>
        </>
    );
};

Attendance.layout = (page) => <SchoolStaffLayout children={page} />;

export default Attendance;

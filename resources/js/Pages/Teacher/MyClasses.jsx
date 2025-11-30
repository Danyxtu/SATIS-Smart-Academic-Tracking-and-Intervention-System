import React, { useState, useMemo } from "react";
import TeacherLayout from "../../Layouts/TeacherLayout";
import { Head } from "@inertiajs/react";
import { useLoading } from "@/Context/LoadingContext";
import {
    ChevronRight,
    Book,
    Users,
    Search,
    Plus,
    X,
    ArrowLeft,
    Upload,
    FileText, // (NEW) Icon for file
    Palette, // (NEW) Icon for color
    UploadCloud, // (NEW) Icon for dropzone
} from "lucide-react";
import AddNewClassModal from "@/Components/AddNewClassModal";
import ClassCard from "@/Components/ClassCard";
import AddStudentModal from "@/Components/AddStudentModal"; // NEW Import
import StudentStatusModal from "@/Components/StudentStatusModal"; // NEW Import

// --- Mock Data (Now used as INITIAL state) ---

// (UPDATED) Added 'color' property
const INITIAL_CLASSES = [
    {
        id: 1,
        name: "Grade 12",
        section: "STEM-A",
        subject: "Physics",
        color: "indigo",
    },
    {
        id: 2,
        name: "Grade 10",
        section: "ABM-B",
        subject: "Economics",
        color: "blue",
    },
    {
        id: 3,
        name: "Grade 11",
        section: "HUMSS-A",
        subject: "History",
        color: "amber",
    },
    {
        id: 4,
        name: "Grade 12",
        section: "STEM-B",
        subject: "Calculus",
        color: "red",
    },
];

const INITIAL_ASSIGNMENTS = [
    { id: "a1", label: "Activity 1", total: 20 },
    { id: "q1", label: "Quiz 1", total: 25 },
    { id: "a2", label: "Activity 2", total: 20 },
    { id: "p1", label: "Project", total: 100 },
];

const INITIAL_STUDENTS_DATA = {
    1: [
        {
            id: 101,
            name: "Sheena De Guzman",
            lrn: "123456789012",
            email: "sd202500101@bshs.edu.ph",
            grades: { a1: 18, q1: 22, a2: 15, p1: 88 },
        },
        {
            id: 102,
            name: "John Smith",
            lrn: "123456789013",
            email: "js202500102@bshs.edu.ph",
            grades: { a1: 20, q1: 20, a2: 17, p1: 75 },
        },
        {
            id: 103,
            name: "Maria Clara",
            lrn: "123456789014",
            email: "mc202500103@bshs.edu.ph",
            grades: { a1: 15, q1: 24, a2: 19, p1: 95 },
        },
    ],
    2: [
        {
            id: 201,
            name: "Crisostomo Ibarra",
            lrn: "223456789012",
            email: "ci202500201@bshs.edu.ph",
            grades: { a1: 10, q1: 15, a2: 12, p1: 60 },
        },
        {
            id: 202,
            name: "Juan Dela Cruz",
            lrn: "223456789013",
            email: "jd202500202@bshs.edu.ph",
            grades: { a1: 19, q1: 18, a2: 18, p1: 80 },
        },
    ],
    3: [
        {
            id: 301,
            name: "Sisa Alagasi",
            lrn: "323456789012",
            email: "sa202500301@bshs.edu.ph",
            grades: { a1: 17, q1: 21, a2: 20, p1: 90 },
        },
    ],
    4: [],
};

// --- (NEW) Color Theme Options ---

// --- Helper Functions ---

const generateEmail = (name) => {
    if (!name) return "";
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toLowerCase();
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${initials}${year}${randomNum}@bshs.edu.ph`;
};

const calculateFinalGrade = (grades, assignments) => {
    let totalScore = 0;
    let totalPossible = 0;
    assignments.forEach((assign) => {
        totalScore += grades[assign.id] || 0;
        totalPossible += assign.total;
    });
    if (totalPossible === 0) return "N/A";
    const percentage = (totalScore / totalPossible) * 100;
    return `${percentage.toFixed(1)}%`;
};

// --- (NEW) Helper to "Simulate" processing a classlist file ---
const simulateFileProcess = () => {
    // In a real app, you'd parse the CSV/Excel file.
    // Here, we just generate a few mock students.
    const mockFileStudents = [
        { id: 901, name: "New Student A", lrn: "999999999012", grades: {} },
        { id: 902, name: "New Student B", lrn: "999999999013", grades: {} },
        { id: 903, name: "New Student C", lrn: "999999999014", grades: {} },
    ];
    // Add the auto-generated email
    return mockFileStudents.map((s) => ({
        ...s,
        email: generateEmail(s.name),
    }));
};

// --- Main 'MyClasses' Component ---

const MyClasses = () => {
    // --- (UPDATED) State ---
    const [selectedClass, setSelectedClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({
        id: null,
        name: "",
        lrn: "",
        email: "",
    }); // Initialize newStudent properly
    const [studentViewMode, setStudentViewMode] = useState("classList"); // New state for toggling student view
    const [isStudentStatusModalOpen, setIsStudentStatusModalOpen] =
        useState(false); // NEW
    const [selectedStudentForStatus, setSelectedStudentForStatus] =
        useState(null); // NEW

    // --- (NEW) State for Class Management ---
    const [classes, setClasses] = useState(INITIAL_CLASSES);
    const [studentsData, setStudentsData] = useState(INITIAL_STUDENTS_DATA);
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // --- (UPDATED) Event Handlers ---

    const { startLoading, stopLoading } = useLoading();

    const handleClassSelect = (classObj) => {
        startLoading();
        setTimeout(() => {
            setSelectedClass(classObj);
            // (UPDATED) Pull from state
            setStudents(studentsData[classObj.id] || []);
            setAssignments(INITIAL_ASSIGNMENTS);
            setStudentViewMode("classList"); // Reset view mode when changing class
            stopLoading();
        }, 300);
    };

    const handleGoBack = () => {
        startLoading();
        setTimeout(() => {
            setSelectedClass(null);
            setStudents([]);
            setAssignments([]);
            setSearchTerm("");
            setStudentViewMode("classList"); // Reset view mode when going back
            stopLoading();
        }, 300);
    };

    const handleGradeChange = (studentId, assignmentId, value) => {
        setStudents((currentStudents) => {
            const updatedStudents = currentStudents.map((student) =>
                student.id === studentId
                    ? {
                          ...student,
                          grades: {
                              ...student.grades,
                              [assignmentId]: Number(value),
                          },
                      }
                    : student
            );
            // Update the master list 'studentsData' immediately when grades change
            setStudentsData((prevData) => ({
                ...prevData,
                [selectedClass.id]: updatedStudents,
            }));
            return updatedStudents; // Return the updated students for the current state
        });
    };

    const handleNewStudentChange = (e) => {
        const { name, value } = e.target;
        setNewStudent((prev) => {
            const updatedStudent = { ...prev, [name]: value };
            if (name === "name") {
                updatedStudent.email = generateEmail(value);
            }
            return updatedStudent;
        });
    };

    const handleAddStudent = (e) => {
        e.preventDefault();
        const newId = Math.max(...students.map((s) => s.id), 0) + 1;
        const newStudentWithId = {
            ...newStudent,
            id: newId,
            grades: {},
        };
        const updatedStudents = [...students, newStudentWithId];

        // (UPDATED) Update both states
        setStudents(updatedStudents);
        setStudentsData((prevData) => ({
            ...prevData,
            [selectedClass.id]: updatedStudents,
        }));

        setIsAddStudentModalOpen(false);
        setNewStudent({ id: null, name: "", lrn: "", email: "" }); // Reset form
    };

    // const handleNewStudentChange = (e) => {
    //     // This function is unchanged
    //     const { name, value } = e.target;
    //     setNewStudent(prev => {
    //         const updatedStudent = { ...prev, [name]: value };
    //         if (name === 'name') {
    //             updatedStudent.email = generateEmail(value);
    //         }
    //         return updatedStudent;
    //     });
    // };

    // const handleAddStudent = (e) => {
    //     // This function is unchanged
    //     e.preventDefault();
    //     const newId = Math.max(...students.map((s) => s.id), 0) + 1;
    //     const newStudentWithId = {
    //         ...newStudent,
    //         id: newId,
    //         grades: {},
    //     };
    //     const updatedStudents = [...students, newStudentWithId];

    //     // (UPDATED) Update both states
    //     setStudents(updatedStudents);
    //     setStudentsData((prevData) => ({
    //         ...prevData,
    //         [selectedClass.id]: updatedStudents,
    //     }));

    //     setIsAddStudentModalOpen(false);
    //     setNewStudent({
    //         /* ... (reset form) ... */
    //     });
    // };

    // --- (NEW) Handlers for "Add Class" Modal ---

    // const openAddClassModal = () => setIsAddClassModalOpen(true);

    // --- (NEW) Handlers for Drag-and-Drop ---
    const colorOptions = [
        {
            name: "indigo",
            bg: "bg-indigo-100",
            text: "text-indigo-700",
            icon: "text-indigo-500",
        },
        {
            name: "blue",
            bg: "bg-blue-100",
            text: "text-blue-700",
            icon: "text-blue-500",
        },
        {
            name: "red",
            bg: "bg-red-100",
            text: "text-red-700",
            icon: "text-red-500",
        },
        {
            name: "green",
            bg: "bg-green-100",
            text: "text-green-700",
            icon: "text-green-500",
        },
        {
            name: "amber",
            bg: "bg-amber-100",
            text: "text-amber-700",
            icon: "text-amber-500",
        },
        {
            name: "purple",
            bg: "bg-purple-100",
            text: "text-purple-700",
            icon: "text-purple-500",
        },
    ];
    const getColorClasses = (colorName) => {
        return (
            colorOptions.find((c) => c.name === colorName) || colorOptions[0]
        );
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (
            file &&
            (file.type === "text/csv" || file.type.includes("spreadsheetml"))
        ) {
            setNewClassInfo((prev) => ({ ...prev, file: file }));
            openAddClassModal();
        } else {
            alert("Please drop a valid CSV or Excel file.");
        }
    };

    // --- (UPDATED) Computed/Memoized Values ---

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        return students.filter(
            (student) =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.lrn.includes(searchTerm)
        );
    }, [students, searchTerm]);

    // --- (NEW) Helper to get color class names ---

    return (
        <>
            <Head title="My Classes" />

            <nav className="flex items-center text-lg text-gray-600 mb-6">
                <span
                    className={`text-3xl font-bold ${
                        !selectedClass
                            ? "text-gray-900"
                            : "text-indigo-600 hover:underline cursor-pointer"
                    }`}
                    onClick={handleGoBack}
                >
                    My Classes
                </span>
                {selectedClass && (
                    <>
                        <ChevronRight size={20} className="mx-1" />
                        <span className="text-3xl font-bold text-gray-900">
                            {selectedClass.name} - {selectedClass.section}
                        </span>
                    </>
                )}
            </nav>

            {/* --- Conditional View: Grid or Classlist --- */}

            {!selectedClass ? (
                // (UPDATED) 1. Class Grid View (Main Page)
                <div
                    className="relative"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* (NEW) Dropzone Overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-indigo-500 bg-opacity-75 rounded-xl border-4 border-dashed border-white">
                            <UploadCloud
                                size={64}
                                className="text-white mb-4"
                            />
                            <p className="text-2xl font-bold text-white">
                                Drop CSV/Excel file here
                            </p>
                        </div>
                    )}

                    {/* (NEW) Add Class Button */}
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setIsAddClassModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700"
                        >
                            <Plus size={18} />
                            Add New Class
                        </button>
                    </div>

                    {/* (UPDATED) Class Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((cls) => {
                            const colors = getColorClasses(cls.color);
                            return (
                                <ClassCard
                                    key={cls.id}
                                    colors={colors}
                                    cls={cls}
                                    studentsData={studentsData}
                                    handleClassSelect={handleClassSelect}
                                />
                            );
                        })}
                    </div>
                </div>
            ) : (
                // 2. Classlist View (Details Page)
                // This section is mostly unchanged, but it reads from 'students' state
                // which is now correctly managed by handleClassSelect
                <div className="bg-white rounded-xl shadow-lg p-6">
                    {/* Header Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {selectedClass.name} -{" "}
                                {selectedClass.section}
                            </h2>
                            <p className="text-gray-600">
                                {selectedClass.subject}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Toggle Buttons for Student View Mode */}
                            <div className="flex items-center p-1 bg-gray-100 rounded-lg">
                                <button
                                    onClick={() =>
                                        setStudentViewMode("classList")
                                    }
                                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                                        studentViewMode === "classList"
                                            ? "bg-white text-indigo-700 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    Student List
                                </button>
                                <button
                                    onClick={() =>
                                        setStudentViewMode("gradeOverview")
                                    }
                                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                                        studentViewMode === "gradeOverview"
                                            ? "bg-white text-indigo-700 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    Grade Overview
                                </button>
                            </div>

                            <button className="flex items-center gap-2 bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200">
                                <Upload size={18} />
                                Upload Grades
                            </button>
                            <button
                                onClick={() =>
                                    setIsAddStudentModalOpen(true)
                                }
                                className="flex items-center gap-2 bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700"
                            >
                                <Plus size={18} />
                                Add Student
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Search student by name or LRN..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search
                            size={20}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                    </div>

                    {/* Conditional Rendering based on studentViewMode */}
                    {studentViewMode === "classList" ? (
                        // Student List (No Grades)
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Student Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            LRN
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStudents.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => {
                                                setSelectedStudentForStatus(
                                                    student
                                                );
                                                setIsStudentStatusModalOpen(
                                                    true
                                                );
                                            }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.lrn}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.email}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <p className="text-center text-gray-500 py-8">
                                    No students found.
                                </p>
                            )}
                        </div>
                    ) : (
                        // Grade Overview Table (With Grades)
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Student Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            LRN
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {student.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.lrn}
                                            </td>
                                            {assignments.map((assign) => (
                                                <td
                                                    key={assign.id}
                                                    className="px-6 py-4 whitespace-nowGrap"
                                                >
                                                    <input
                                                        type="number"
                                                        className="w-20 border-gray-300 rounded-md"
                                                        value={
                                                            student.grades[
                                                                assign.id
                                                            ] || ""
                                                        }
                                                        onChange={(e) =>
                                                            handleGradeChange(
                                                                student.id,
                                                                assign.id,
                                                                e.target
                                                                    .value
                                                            )
                                                        }
                                                        max={assign.total}
                                                        min={0}
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {calculateFinalGrade(
                                                    student.grades,
                                                    assignments
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <p className="text-center text-gray-500 py-8">
                                    No students found.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* --- (NEW) Add Class Modal --- */}
            {isAddClassModalOpen && (
                <AddNewClassModal
                    onClose={() => setIsAddClassModalOpen(false)}
                    classes={INITIAL_CLASSES}
                    setClasses={setClasses}
                    setStudentsData={setStudentsData}
                    setIsDragging={setIsDragging}
                />
            )}

            {/* --- Add Student Modal --- */}
            {isAddStudentModalOpen && (
                <AddStudentModal
                    newStudent={newStudent}
                    handleNewStudentChange={handleNewStudentChange}
                    handleAddStudent={handleAddStudent}
                    onClose={() => setIsAddStudentModalOpen(false)}
                />
            )}
            {isStudentStatusModalOpen && (
                <StudentStatusModal
                    onClose={() => setIsStudentStatusModalOpen(false)}
                    calculateFinalGrade={calculateFinalGrade}
                    student={selectedStudentForStatus}
                    assignments={assignments}
                />
            )}
        </>
    );
};

MyClasses.layout = (page) => <TeacherLayout children={page} />;

export default MyClasses;

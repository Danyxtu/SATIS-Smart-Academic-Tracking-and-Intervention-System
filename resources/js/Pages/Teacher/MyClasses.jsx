import React, { useState, useMemo } from 'react';
import TeacherLayout from '../../Layouts/TeacherLayout';
import { Head } from '@inertiajs/react';
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
    Palette,  // (NEW) Icon for color
    UploadCloud // (NEW) Icon for dropzone
} from 'lucide-react';

// --- Mock Data (Now used as INITIAL state) ---

// (UPDATED) Added 'color' property
const INITIAL_CLASSES = [
    { id: 1, name: 'Grade 12', section: 'STEM-A', subject: 'Physics', color: 'indigo' },
    { id: 2, name: 'Grade 10', section: 'ABM-B', subject: 'Economics', color: 'blue' },
    { id: 3, name: 'Grade 11', section: 'HUMSS-A', subject: 'History', color: 'amber' },
    { id: 4, name: 'Grade 12', section: 'STEM-B', subject: 'Calculus', color: 'red' },
];

const INITIAL_ASSIGNMENTS = [
    { id: 'a1', label: 'Activity 1', total: 20 },
    { id: 'q1', label: 'Quiz 1', total: 25 },
    { id: 'a2', label: 'Activity 2', total: 20 },
    { id: 'p1', label: 'Project', total: 100 },
];

const INITIAL_STUDENTS_DATA = {
    1: [ 
        { id: 101, name: 'Sheena De Guzman', lrn: '123456789012', email: 'sd202500101@bshs.edu.ph', grades: { a1: 18, q1: 22, a2: 15, p1: 88 } },
        { id: 102, name: 'John Smith', lrn: '123456789013', email: 'js202500102@bshs.edu.ph', grades: { a1: 20, q1: 20, a2: 17, p1: 75 } },
        { id: 103, name: 'Maria Clara', lrn: '123456789014', email: 'mc202500103@bshs.edu.ph', grades: { a1: 15, q1: 24, a2: 19, p1: 95 } },
    ],
    2: [ 
        { id: 201, name: 'Crisostomo Ibarra', lrn: '223456789012', email: 'ci202500201@bshs.edu.ph', grades: { a1: 10, q1: 15, a2: 12, p1: 60 } },
        { id: 202, name: 'Juan Dela Cruz', lrn: '223456789013', email: 'jd202500202@bshs.edu.ph', grades: { a1: 19, q1: 18, a2: 18, p1: 80 } },
    ],
    3: [ 
        { id: 301, name: 'Sisa Alagasi', lrn: '323456789012', email: 'sa202500301@bshs.edu.ph', grades: { a1: 17, q1: 21, a2: 20, p1: 90 } },
    ],
    4: [], 
};

// --- (NEW) Color Theme Options ---
const colorOptions = [
    { name: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', icon: 'text-indigo-500' },
    { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-500' },
    { name: 'red', bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-500' },
    { name: 'green', bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-500' },
    { name: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-500' },
    { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-500' },
];

// --- Helper Functions ---

const generateEmail = (name) => {
    if (!name) return '';
    const initials = name.split(' ').map(n => n[0]).join('').toLowerCase();
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${initials}${year}${randomNum}@bshs.edu.ph`;
};

const calculateFinalGrade = (grades, assignments) => {
    let totalScore = 0;
    let totalPossible = 0;
    assignments.forEach(assign => {
        totalScore += grades[assign.id] || 0;
        totalPossible += assign.total;
    });
    if (totalPossible === 0) return 'N/A';
    const percentage = (totalScore / totalPossible) * 100;
    return `${percentage.toFixed(1)}%`;
};

// --- (NEW) Helper to "Simulate" processing a classlist file ---
const simulateFileProcess = () => {
    // In a real app, you'd parse the CSV/Excel file.
    // Here, we just generate a few mock students.
    const mockFileStudents = [
        { id: 901, name: 'New Student A', lrn: '999999999012', grades: {} },
        { id: 902, name: 'New Student B', lrn: '999999999013', grades: {} },
        { id: 903, name: 'New Student C', lrn: '999999999014', grades: {} },
    ];
    // Add the auto-generated email
    return mockFileStudents.map(s => ({ ...s, email: generateEmail(s.name) }));
};

// --- Main 'MyClasses' Component ---

const MyClasses = () => {
    // --- (UPDATED) State ---
    const [selectedClass, setSelectedClass] = useState(null); 
    const [students, setStudents] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ /* ... (form state as before) ... */ });

    // --- (NEW) State for Class Management ---
    const [classes, setClasses] = useState(INITIAL_CLASSES);
    const [studentsData, setStudentsData] = useState(INITIAL_STUDENTS_DATA);
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [newClassInfo, setNewClassInfo] = useState({
        name: '',
        section: '',
        color: 'indigo',
        file: null,
    });
    
    // --- (UPDATED) Event Handlers ---
    
    const handleClassSelect = (classObj) => {
        setSelectedClass(classObj);
        // (UPDATED) Pull from state
        setStudents(studentsData[classObj.id] || []);
        setAssignments(INITIAL_ASSIGNMENTS); 
    };

    const handleGoBack = () => {
        setSelectedClass(null);
        setStudents([]);
        setAssignments([]);
        setSearchTerm('');
    };

    const handleGradeChange = (studentId, assignmentId, value) => {
        // This function is unchanged, but it updates the 'students' state
        setStudents(currentStudents =>
            currentStudents.map(student =>
                student.id === studentId
                    ? { ...student, grades: { ...student.grades, [assignmentId]: Number(value) } }
                    : student
            )
        );
        // (NEW) We also need to update the master list 'studentsData'
        setStudentsData(prevData => ({
            ...prevData,
            [selectedClass.id]: students,
        }));
    };

    const handleNewStudentChange = (e) => {
        // This function is unchanged
        const { name, value } = e.target;
        setNewStudent(prev => {
            const updatedStudent = { ...prev, [name]: value };
            if (name === 'name') {
                updatedStudent.email = generateEmail(value);
            }
            return updatedStudent;
        });
    };

    const handleAddStudent = (e) => {
        // This function is unchanged
        e.preventDefault();
        const newId = Math.max(...(students.map(s => s.id)), 0) + 1;
        const newStudentWithId = {
            ...newStudent, id: newId, grades: {},
        };
        const updatedStudents = [...students, newStudentWithId];
        
        // (UPDATED) Update both states
        setStudents(updatedStudents);
        setStudentsData(prevData => ({
            ...prevData,
            [selectedClass.id]: updatedStudents,
        }));
        
        setIsAddStudentModalOpen(false);
        setNewStudent({ /* ... (reset form) ... */ });
    };
    
    // --- (NEW) Handlers for "Add Class" Modal ---

    const openAddClassModal = () => setIsAddClassModalOpen(true);
    
    const closeAddClassModal = () => {
        setIsAddClassModalOpen(false);
        setIsDragging(false);
        setNewClassInfo({ name: '', section: '', color: 'indigo', file: null });
    };

    const handleNewClassFormChange = (e) => {
        const { name, value } = e.target;
        setNewClassInfo(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFileChange = (file) => {
        if (file) {
            setNewClassInfo(prev => ({ ...prev, file: file }));
        }
    };

    const handleCreateClass = (e) => {
        e.preventDefault();
        
        // 1. Create new class ID
        const newClassId = Math.max(...classes.map(c => c.id), 0) + 1;
        
        // 2. Create new class object
        const newClass = {
            id: newClassId,
            name: newClassInfo.name,
            section: newClassInfo.section,
            subject: 'New Subject', // Placeholder
            color: newClassInfo.color,
        };

        // 3. (DEMO) Process file if it exists
        let newStudentsList = [];
        if (newClassInfo.file) {
            console.log("Simulating file processing for:", newClassInfo.file.name);
            newStudentsList = simulateFileProcess();
        }

        // 4. Update state
        setClasses(prev => [...prev, newClass]);
        setStudentsData(prevData => ({
            ...prevData,
            [newClassId]: newStudentsList,
        }));
        
        console.log("New Class Added:", newClass);
        console.log("New Students Added:", newStudentsList);
        
        // 5. Close modal
        closeAddClassModal();
    };

    // --- (NEW) Handlers for Drag-and-Drop ---

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
        if (file && (file.type === 'text/csv' || file.type.includes('spreadsheetml'))) {
            setNewClassInfo(prev => ({ ...prev, file: file }));
            openAddClassModal();
        } else {
            alert("Please drop a valid CSV or Excel file.");
        }
    };

    // --- (UPDATED) Computed/Memoized Values ---
    
    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        return students.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.lrn.includes(searchTerm)
        );
    }, [students, searchTerm]);

    // --- (NEW) Helper to get color class names ---
    const getColorClasses = (colorName) => {
        return colorOptions.find(c => c.name === colorName) || colorOptions[0];
    };

    // --- Render Logic ---

    return (
        <TeacherLayout>
            <Head title="My Classes" />
            
            {/* --- Breadcrumbs --- */}
            <nav className="flex items-center text-lg text-gray-600 mb-6">
                <span 
                    className={`text-3xl font-bold ${!selectedClass ? 'text-gray-900' : 'text-indigo-600 hover:underline cursor-pointer'}`}
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
                            <UploadCloud size={64} className="text-white mb-4" />
                            <p className="text-2xl font-bold text-white">Drop CSV/Excel file here</p>
                        </div>
                    )}
                    
                    {/* (NEW) Add Class Button */}
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={openAddClassModal}
                            className="flex items-center gap-2 bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700"
                        >
                            <Plus size={18} />
                            Add New Class
                        </button>
                    </div>
                    
                    {/* (UPDATED) Class Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map(cls => {
                            const colors = getColorClasses(cls.color);
                            return (
                                <button
                                    key={cls.id}
                                    onClick={() => handleClassSelect(cls)}
                                    className="bg-white rounded-xl shadow-lg p-6 text-left transition-all hover:shadow-xl hover:scale-105"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-sm font-medium`}>
                                            {cls.name}
                                        </span>
                                        <Book className={colors.icon} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">{cls.section}</h2>
                                    <p className="text-gray-600 text-lg">{cls.subject}</p>
                                    <div className="flex items-center text-gray-500 mt-6">
                                        <Users size={16} className="mr-2" />
                                        <span className="text-sm font-medium">
                                            {studentsData[cls.id]?.length || 0} Students
                                        </span>
                                    </div>
                                </button>
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
                                {selectedClass.name} - {selectedClass.section}
                            </h2>
                            <p className="text-gray-600">{selectedClass.subject}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200">
                                <Upload size={18} />
                                Upload Grades
                            </button>
                            <button
                                onClick={() => setIsAddStudentModalOpen(true)}
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
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Grade Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LRN</th>
                                    {assignments.map(assign => (
                                        <th key={assign.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {assign.label} ({assign.total})
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Grade</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.map(student => (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                            <div className="text-sm text-gray-500">{student.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.lrn}</td>
                                        {assignments.map(assign => (
                                            <td key={assign.id} className="px-6 py-4 whitespace-nowGrap">
                                                <input
                                                    type="number"
                                                    className="w-20 border-gray-300 rounded-md"
                                                    value={student.grades[assign.id] || ''}
                                                    onChange={(e) => handleGradeChange(student.id, assign.id, e.target.value)}
                                                    max={assign.total}
                                                    min={0}
                                                />
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {calculateFinalGrade(student.grades, assignments)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredStudents.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No students found.</p>
                        )}
                    </div>
                </div>
            )}

            {/* --- (NEW) Add Class Modal --- */}
            {isAddClassModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <form onSubmit={handleCreateClass}>
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b">
                                <h3 className="text-xl font-bold text-gray-900">Add New Class</h3>
                                <button
                                    type="button"
                                    onClick={closeAddClassModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            {/* Modal Body (Form) */}
                            <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Class Name</label>
                                    <input
                                        type="text" name="name" id="name" required
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                        value={newClassInfo.name} onChange={handleNewClassFormChange}
                                        placeholder="e.g., Grade 12"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="section" className="block text-sm font-medium text-gray-700">Section</label>
                                    <input
                                        type="text" name="section" id="section" required
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                        value={newClassInfo.section} onChange={handleNewClassFormChange}
                                        placeholder="e.g., STEM-C"
                                    />
                                </div>
                                
                                {/* Color Picker */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                                    <div className="flex flex-wrap gap-3">
                                        {colorOptions.map(color => (
                                            <label key={color.name} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="color"
                                                    value={color.name}
                                                    checked={newClassInfo.color === color.name}
                                                    onChange={handleNewClassFormChange}
                                                    className={`form-radio ${color.text} ${color.icon.replace('text-', 'focus:ring-')}`}
                                                />
                                                <span className={`px-2 py-0.5 rounded-full text-sm ${color.bg} ${color.text}`}>
                                                    {color.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* File Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Upload Classlist (CSV/Excel)</label>
                                    {newClassInfo.file ? (
                                        <div className="mt-2 flex items-center justify-between p-3 bg-gray-100 rounded-md">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <FileText size={18} />
                                                {newClassInfo.file.name}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setNewClassInfo(prev => ({ ...prev, file: null }))}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <input
                                            type="file"
                                            name="file"
                                            id="file"
                                            required // Make it required if not drag-dropped
                                            className="mt-1 block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-indigo-100 file:text-indigo-700
                                                hover:file:bg-indigo-200"
                                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                            onChange={(e) => handleFileChange(e.target.files[0])}
                                        />
                                    )}
                                </div>
                                
                                {/* (REQUIRED) Note */}
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                    <p className="text-sm text-blue-700">
                                        <strong>Note:</strong> Once the class list is added, the system will automatically generate a unique email for each student (e.g., hz202300349@bshs.edu.ph).
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end p-6 border-t bg-gray-50">
                                <button
                                    type="button"
                                    onClick={closeAddClassModal}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="ml-3 bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                    disabled={!newClassInfo.file || !newClassInfo.name || !newClassInfo.section}
                                >
                                    Create Class
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Add Student Modal --- */}
            {/* This component is unchanged */}
            {isAddStudentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    {/* ... The entire Add Student Modal form ... */}
                </div>
            )}

        </TeacherLayout>
    );
}

export default MyClasses;
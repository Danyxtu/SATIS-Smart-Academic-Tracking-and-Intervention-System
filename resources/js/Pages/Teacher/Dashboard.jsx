import React, { useState } from "react";
import TeacherLayout from "@/Layouts/TeacherLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    Users,
    AlertTriangle,
    ClipboardList,
    MessageSquare,
    UploadCloud,
    FileUp,
    TrendingDown,
    X,
    CheckCircle2,
} from "lucide-react";

// --- Reusable Components ---

// 1. Top Stat Cards
const StatCard = ({ title, value, icon: Icon, iconBgColor }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
        <div className={`rounded-full p-3 ${iconBgColor}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

// 2. Student at Risk Card
const StudentRiskCard = ({ student }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between transition-all hover:shadow-md">
        <div className="flex items-center space-x-3">
            <img
                src={student.avatar}
                alt={`${student.first_name} ${student.last_name}`}
                className="w-10 h-10 rounded-full"
            />
            <div>
                <p className="font-semibold text-gray-800">{`${student.first_name} ${student.last_name}`}</p>
                <p className="text-sm text-gray-500">{student.subject}</p>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            <div className="text-right">
                <p className="font-bold text-red-600 text-lg">
                    {student.grade}%
                </p>
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <TrendingDown size={14} /> {student.trend}
                </p>
            </div>
            <Link
                href="#" // Replace with actual intervention URL
                className="bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
                Start Intervention
            </Link>
        </div>
    </div>
);

// 3. Recent Activity Feed Item
const ActivityFeedItem = ({ icon: Icon, text, time, iconBgColor }) => (
    <div className="flex space-x-3">
        <div className={`rounded-full p-2 ${iconBgColor}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
            <p
                className="text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: text }}
            />
            <p className="text-xs text-gray-500">{time}</p>
        </div>
    </div>
);

// 4. The Grade Sheet Uploader
const GradeUploader = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };
    const handleUpload = () => {
        console.log("Uploading file:", file.name);
        // Example: router.post('/teacher/upload-grades', { file });
        alert(`Uploading ${file.name}... (This is a demo)`);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-8">
            <div
                className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg transition-all
                    ${
                        isDragging
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-300"
                    }
                    ${file ? "bg-green-50 border-green-400" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {file ? (
                    <>
                        <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
                        <p className="text-xl font-semibold text-gray-800">
                            {file.name}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            ({(file.size / 1024).toFixed(1)} KB)
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setFile(null)}
                                className="text-sm font-medium text-red-600 hover:text-red-800"
                            >
                                Clear File
                            </button>
                            <button
                                onClick={handleUpload}
                                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700"
                            >
                                Upload & Process File
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <UploadCloud className="w-16 h-16 text-gray-400 mb-4" />
                        <p className="text-xl font-semibold text-gray-800 mb-2">
                            Drag & drop your Excel/CSV file here
                        </p>
                        <p className="text-gray-500 mb-4">or</p>
                        <label className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg cursor-pointer hover:bg-gray-300 transition-colors">
                            <span>Browse File</span>
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            />
                        </label>
                    </>
                )}
            </div>
            <p className="text-center text-gray-500 text-sm mt-6">
                Uploading a new grade sheet will automatically update all
                student dashboards and re-calculate at-risk predictions.
            </p>
        </div>
    );
};

const mockActivity = [
    {
        icon: FileUp,
        text: "You uploaded grades for <strong>Grade 12 - STEM</strong>.",
        time: "2 hours ago",
        iconBgColor: "bg-indigo-500",
    },
    {
        icon: ClipboardList,
        text: "You started an intervention for <strong>John Smith</strong>.",
        time: "5 hours ago",
        iconBgColor: "bg-yellow-500",
    },
    {
        icon: CheckCircle2,
        text: '<strong>Maria Clara</strong> completed task: "Review Module 3".',
        time: "1 day ago",
        iconBgColor: "bg-green-500",
    },
];

// --- Main Dashboard Page Component ---
export default function Dashboard({ user, students, totalStudents }) {
    const { auth } = usePage().props;
    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    const stats = [
        {
            title: "Total Students",
            value: totalStudents,
            icon: Users,
            iconBgColor: "bg-indigo-500",
        },
        {
            title: "Students at Risk",
            value: students.filter(s => s.grade < 75).length,
            icon: AlertTriangle,
            iconBgColor: "bg-red-500",
        },
        {
            title: "Interventions Active",
            value: "5", // Replace with real data
            icon: ClipboardList,
            iconBgColor: "bg-yellow-500",
        },
        {
            title: "Feedback Sent (7d)",
            value: "31", // Replace with real data
            icon: MessageSquare,
            iconBgColor: "bg-blue-500",
        },
    ];

    const atRiskStudents = students.filter(student => student.grade < 75);

    return (
        <TeacherLayout>
            <Head title="Teacher Dashboard" />

            {/* 1. Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome Back, {auth.user.name}!
                </h1>
                <p className="text-lg text-gray-600">
                    Here's your overview for {currentDate}.
                </p>
            </div>

            {/* 2. Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>

            {/* 3. Main Content (2-col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* 3a. Left Column (Students at Risk) */}
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" />
                        High Priority: Students at Risk
                    </h2>
                    <div className="bg-.jsx rounded-xl shadow-lg p-6 space-y-4">
                        {atRiskStudents.length > 0 ? (
                            atRiskStudents.map((student) => (
                                <StudentRiskCard
                                    key={student.id}
                                    student={student}
                                />
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">
                                No students are currently flagged as "at-risk".
                                Great job!
                            </p>
                        )}
                    </div>
                </div>

                {/* 3b. Right Column (Recent Activity) */}
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        Recent Activity
                    </h2>
                    <div className="bg-white rounded-xl shadow-lg p-6 space-y-5">
                        {mockActivity.map((item, index) => (
                            <ActivityFeedItem key={index} {...item} />
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Uploader (Full Width) */}
            <div className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Upload New Grade Sheet
                </h2>
                <GradeUploader />
            </div>
        </TeacherLayout>
    );
}
import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react'; // <-- THE FIX IS HERE
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FileDown, Lightbulb, Bot } from 'lucide-react';

import { subjectsData } from './Index'; 

// --- Mock Data for the selected subject ---
const detailedMockData = {
    1: { 
        name: 'Oral Communication',
        teacher: 'Ms. Yoshiru',
        schoolYear: '2024-2025',
        finalGrade: 89,
        quarterlyGrades: [
            { quarter: 'Q1', grade: 88, remarks: 'Good', attendance: '95%' },
            { quarter: 'Q2', grade: 92, remarks: 'Excellent', attendance: '90%' },
            { quarter: 'Q3', grade: 85, remarks: 'Good', attendance: '91%' },
            { quarter: 'Q4', grade: 87, remarks: 'Good', attendance: '94%' },
        ],
        teacherFeedback: [
            { quarter: 'Q1', text: 'Excellent in class participation. Keep up the Good Work!' },
            { quarter: 'Q2', text: 'You show good understanding. Double-check your work for simple mistakes.' },
            { quarter: 'Q3', text: 'Excellent job meeting all deadlines.' },
            { quarter: 'Q4', text: 'Very good progress this year.' },
        ],
    },
    2: { name: 'Practical Research 1', teacher: 'Mr. Madrazo', finalGrade: 92 },
    3: { name: 'Philosophy', teacher: 'Mr. Legazpi', finalGrade: 86 },
};

// --- Reusable Components ---

// Quarterly Grades Table
const QuarterlyGrades = ({ data }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Quarterly Grades</h3>
        <table className="w-full text-left">
            <thead>
                <tr className="border-b-2 border-gray-200">
                    <th className="py-2 px-3 text-sm font-semibold text-gray-600">Quarter</th>
                    <th className="py-2 px-3 text-sm font-semibold text-gray-600">Grade</th>
                    <th className="py-2 px-3 text-sm font-semibold text-gray-600">Remarks</th>
                    <th className="py-2 px-3 text-sm font-semibold text-gray-600">Attendance</th>
                </tr>
            </thead>
            <tbody>
                {data.map((q) => (
                    <tr key={q.quarter} className="border-b border-gray-100">
                        <td className="py-3 px-3 font-medium text-gray-700">{q.quarter}</td>
                        <td className={`py-3 px-3 font-bold ${q.grade >= 90 ? 'text-blue-600' : 'text-gray-800'}`}>{q.grade}</td>
                        <td className="py-3 px-3 text-gray-600">{q.remarks}</td>
                        <td className="py-3 px-3 text-gray-600">{q.attendance}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Bar Chart
const GradeChart = ({ data }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} domain={[70, 100]} />
                <Tooltip />
                <Bar dataKey="Grade" fill="#ec4899" radius={[5, 5, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

// Teacher Feedback
const TeacherFeedback = ({ data }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Teacher Feedback</h3>
        <div className="space-y-3">
            {data.map(fb => (
                <div key={fb.quarter}>
                    <span className="text-sm font-bold text-pink-600">{fb.quarter}</span>
                    <p className="text-gray-700">{fb.text}</p>
                </div>
            ))}
        </div>
    </div>
);

// Suggested Interventions
const SuggestedInterventions = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Suggested Interventions</h3>
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
                You're doing great! To maintain your "Excellent" standing, try to review your notes for 15 minutes after each class.
            </p>
        </div>
    </div>
);

// Personalized Study Aids
const StudyAids = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-pink-200">
        <div className="flex items-center gap-3 mb-2">
            <Bot className="w-6 h-6 text-pink-600" />
            <h3 className="text-xl font-semibold text-gray-800">Personalized Study Aids</h3>
        </div>
        <p className="text-gray-700 mb-4">Struggling in certain areas? Let A.I. create a custom reviewer to help you catch up!</p>
        <button className="w-full bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors">
            Generate Personalized Quiz
        </button>
    </div>
);


// --- Main Page Component ---
const AnalyticsShow = () => {
    
    const { subject_id } = usePage().props;

    const subjectInfo = subjectsData.find(s => s.id == subject_id);
    const subjectDetails = detailedMockData[subject_id];

    const details = {
        schoolYear: '2024-2025',
        quarterlyGrades: [],
        teacherFeedback: [],
        name: subjectInfo?.subject,
        teacher: subjectInfo?.teacher,
        finalGrade: subjectInfo?.grade,
        ...subjectDetails, 
    };

    const chartData = details.quarterlyGrades.length > 0
        ? details.quarterlyGrades.map(q => ({ name: q.quarter, Grade: q.grade }))
        : [];

    return (
        <AuthenticatedLayout>
            <Head title={details.name} />

            <div className="max-w-7xl mx-auto space-y-6">

                {/* --- 1. Breadcrumbs --- */}
                <div className="text-sm font-medium text-gray-500">
                    <Link href={route('analytics.index')} className="hover:text-pink-600 transition-colors">
                        Performance Analytics
                    </Link>
                    <span className="mx-2">&gt;</span>
                    <span className="text-gray-900">{details.name}</span>
                </div>

                {/* --- 2. Header --- */}
                <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">{details.name}</h1>
                        <p className="text-lg text-gray-600">{details.teacher}  •  {details.schoolYear}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors">
                            <FileDown size={18} />
                            Export PDF
                        </button>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-500">FINAL GRADE</p>
                            <p className="text-6xl font-bold text-blue-600">{details.finalGrade}</p>
                        </div>
                    </div>
                </div>

                {/* --- 3. Main Content Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <div className="lg:col-span-2 space-y-6">
                        {details.quarterlyGrades.length > 0 ? (
                            <QuarterlyGrades data={details.quarterlyGrades} />
                        ) : (
                            <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Quarterly Grades</h3>
                                <p className="text-gray-500">No quarterly grade data available for this subject yet.</p>
                            </div>
                        )}
                        <SuggestedInterventions />
                        <StudyAids />
                    </div>

                    <div className="space-y-6">
                        {chartData.length > 0 ? (
                            <GradeChart data={chartData} />
                        ) : (
                             <div className="bg-white rounded-2xl shadow-lg p-6 h-80 flex items-center justify-center">
                                <p className="text-gray-500">No grade chart to display.</p>
                             </div>
                        )}
                        {details.teacherFeedback.length > 0 ? (
                            <TeacherFeedback data={details.teacherFeedback} />
                        ) : (
                             <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Teacher Feedback</h3>
                                <p className="text-gray-500">No feedback available for this subject.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
};

export default AnalyticsShow;
import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';

// --- Mock Data (Replace with your actual data) ---
const subjectsData = [
    {
        id: 1,
        subjectName: 'Mathematics',
        instructor: 'Prof. Felix Miravilla',
        grade: 92,
        trend: 'Improving',
        deadline: 'Project - Nov 10',
        intervention: 'Maintain study habit',
        riskLevel: 'Low',
    },
    {
        id: 2,
        subjectName: 'Programming',
        instructor: 'Prof. Danny D.P Dinglasa Jr.',
        grade: 80,
        trend: 'Stable',
        deadline: 'None',
        intervention: 'Review last module',
        riskLevel: 'Low',
    },
    {
        id: 3,
        subjectName: 'English',
        instructor: 'Prof. Jane Doe',
        grade: 74,
        trend: 'Declining',
        deadline: 'Essay - Nov 5',
        intervention: 'Attend remedial sessions',
        riskLevel: 'Medium',
    },
    {
        id: 4,
        subjectName: 'Physics',
        instructor: 'Prof. John Smith',
        grade: 68,
        trend: 'Declining',
        deadline: 'Final Exam - Nov 12',
        intervention: 'Urgent consultation required',
        riskLevel: 'High',
    },
];

// --- Reusable Progress Bar Component ---
const ProgressBar = ({ value, riskLevel }) => {
    let barColor = 'bg-pink-400'; // Default
    if (riskLevel === 'Low') barColor = 'bg-green-500';
    if (riskLevel === 'Medium') barColor = 'bg-yellow-500';
    if (riskLevel === 'High') barColor = 'bg-red-500';

    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5 my-3">
            <div
                className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
                style={{ width: `${value}%` }}
            />
        </div>
    );
};

// --- Reusable Risk Status Component ---
const RiskStatus = ({ riskLevel }) => {
    if (riskLevel === 'Low') {
        return (
            <div className="flex flex-col items-center text-green-600">
                <CheckCircle size={32} />
                <span className="text-sm font-medium mt-1">Low Risk</span>
            </div>
        );
    }
    if (riskLevel === 'Medium') {
        return (
            <div className="flex flex-col items-center text-yellow-600">
                <AlertTriangle size={32} />
                <span className="text-sm font-medium mt-1">Medium Risk</span>
            </div>
        );
    }
    if (riskLevel === 'High') {
        return (
            <div className="flex flex-col items-center text-red-600">
                <XCircle size={32} />
                <span className="text-sm font-medium mt-1">High Risk</span>
            </div>
        );
    }
    return null;
};

// --- Reusable Subject Card Component ---
const SubjectRiskCard = ({ subject }) => {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center space-x-6">
            {/* Left Section: Details */}
            <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800">{subject.subjectName}</h3>
                <p className="text-sm text-gray-600">Instructors: {subject.instructor}</p>
                <p className="text-sm text-gray-600">Grade: {subject.grade}%</p>
                
                <ProgressBar value={subject.grade} riskLevel={subject.riskLevel} />
                
                <div className="text-sm space-y-1 mt-4">
                    <p><span className="font-semibold text-gray-700">Trend:</span> {subject.trend}</p>
                    <p><span className="font-semibold text-gray-700">Incoming Deadline:</span> {subject.deadline}</p>
                    <p><span className="font-semibold text-gray-700">Intervention:</span> {subject.intervention}</p>
                </div>
            </div>

            {/* Right Section: Status */}
            <div className="w-24 flex-shrink-0">
                <RiskStatus riskLevel={subject.riskLevel} />
            </div>
        </div>
    );
};


// --- Main SubjectRisk Page Component ---
const SubjectRisk = () => {
    return (
        <AuthenticatedLayout>
            <Head title="Subjects at Risk" />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <h1 className="text-4xl font-bold text-gray-900 mb-8">
                    Risk Level Indicators
                </h1>

                {/* List of Subjects */}
                <div className="space-y-6">
                    {subjectsData.map((subject) => (
                        <SubjectRiskCard key={subject.id} subject={subject} />
                    ))}
                </div>

                {/* View More Button */}
                <div className="flex justify-center mt-8">
                    <button className="flex items-center gap-2 px-6 py-3 text-lg font-medium text-gray-700 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors">
                        <span>View more</span>
                        <ChevronDown size={20} />
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default SubjectRisk;
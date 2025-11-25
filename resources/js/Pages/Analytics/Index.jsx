import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { BarChart3 } from 'lucide-react';

// --- Mock Data ---
// We will export this so the Show.jsx page can use the same data source
export const subjectsData = [
    { id: 1, subject: 'Oral Communication', teacher: 'Ms. Toshiru', grade: 89 },
    { id: 2, subject: 'Practical Research 1', teacher: 'Mr. Madrazo', grade: 92 },
    { id: 3, subject: 'Philosophy', teacher: 'Mr. Legazpi', grade: 86 },
    { id: 4, subject: 'Entrepreneurship', teacher: 'Mr. Reyes', grade: 88 },
    { id: 5, subject: 'Basic Calculus', teacher: 'Mrs. Santos', grade: 78 },
    { id: 6, subject: 'Filipino sa Piling Larang', teacher: 'Mr. Lopez', grade: 75 },
    { id: 7, subject: 'UCSP', teacher: 'Mr. Ramos', grade: 70 },
    { id: 8, subject: 'PE HEALTH', teacher: 'Mrs. Dela Cruz', grade: 95 },
];

// --- Helper function for color-coding ---
const getGradeStyles = (grade) => {
    if (grade >= 90) return { color: 'text-green-600', bg: 'bg-green-500' };
    if (grade >= 80) return { color: 'text-blue-600', bg: 'bg-blue-500' };
    if (grade >= 75) return { color: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { color: 'text-red-600', bg: 'bg-red-500' };
};

// --- Reusable Subject Card Component (Unchanged) ---
const SubjectGradeCard = ({ subject, teacher, grade }) => {
    const { color, bg } = getGradeStyles(grade);
    const label = grade > 75 ? "EXPECTED FINAL GRADE" : "FINAL GRADE";

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 transition-all hover:shadow-xl hover:scale-[1.02]">
            <h3 className="text-xl font-bold text-gray-800">{subject}</h3>
            <p className="text-sm text-gray-500 mb-4">{teacher}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`text-6xl font-bold ${color}`}>{grade}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                <div 
                    className={`${bg} h-2.5 rounded-full`}
                    style={{ width: `${grade}%` }}
                />
            </div>
        </div>
    );
};

// --- Main Page Component ---
const AnalyticsIndex = () => {
  return (
    <AuthenticatedLayout>
        <Head title="Performance Analytics" />

        <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 size={36} className="text-pink-600" />
                Performance Analytics
            </h1>

            {/* Grid of Subject Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjectsData.map((item) => (
                    // --- This Link now works with your new route ---
                    <Link 
                        href={route('analytics.show', { subject_id: item.id })} 
                        key={item.id}
                        className="focus:outline-none focus:ring-2 focus:ring-pink-400 rounded-2xl"
                    >
                        <SubjectGradeCard
                            subject={item.subject}
                            teacher={item.teacher}
                            grade={item.grade}
                        />
                    </Link>
                ))}
            </div>
        </div>
    </AuthenticatedLayout>
  );
};

export default AnalyticsIndex;
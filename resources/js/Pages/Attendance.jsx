import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import default calendar styles
import { 
    CalendarCheck, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    UserCheck, 
    ChevronRight,
    BookOpen,
    History
} from 'lucide-react';

// --- Mock Data (Replace with your actual data) ---
const summaryData = [
    { label: 'Overall Rate', value: '92%', icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Total Absences', value: '4', icon: XCircle, color: 'text-red-600' },
    { label: 'Total Lates', value: '2', icon: Clock, color: 'text-yellow-600' },
    { label: 'Days Present', value: '58', icon: UserCheck, color: 'text-pink-600' },
];

const subjectAttendance = [
    { id: 1, subject: 'Mathematics', instructor: 'Prof. Felix Miravilla', rate: 95, absences: 1, lates: 0 },
    { id: 2, subject: 'Programming', instructor: 'Prof. Danny D.P Dinglasa Jr.', rate: 90, absences: 2, lates: 1 },
    { id: 3, subject: 'Earth and Life Science', instructor: 'Ms. Jane Doe', rate: 88, absences: 1, lates: 1 },
    { id: 4, subject: 'English', instructor: 'Prof. John Smith', rate: 100, absences: 0, lates: 0 },
];

const attendanceLog = [
    { id: 1, date: 'Nov 4, 2025', subject: 'Programming', status: 'Absent', icon: XCircle, color: 'text-red-600' },
    { id: 2, date: 'Nov 3, 2025', subject: 'Earth and Life Science', status: 'Late', icon: Clock, color: 'text-yellow-600' },
    { id: 3, date: 'Nov 3, 2025', subject: 'Mathematics', status: 'Present', icon: CheckCircle2, color: 'text-green-600' },
    { id: 4, date: 'Nov 1, 2025', subject: 'Programming', status: 'Absent', icon: XCircle, color: 'text-red-600' },
];

// Dates to mark on the calendar
// In a real app, you'd generate this from your attendance data
const markedDates = {
    '2025-11-04': 'absent',
    '2025-11-01': 'absent',
    '2025-11-03': 'late',
};
// --- End of Mock Data ---


// --- Reusable Components ---

// Top Summary Card
const SummaryCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
            <Icon size={24} className={color} />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-sm font-medium text-gray-500">{label}</p>
        </div>
    </div>
);

// Progress Bar for Subjects
const AttendanceProgressBar = ({ rate }) => {
    let barColor = 'bg-green-500';
    if (rate < 90) barColor = 'bg-yellow-500';
    if (rate < 80) barColor = 'bg-red-500';

    return (
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`${barColor} h-2 rounded-full`} style={{ width: `${rate}%` }} />
        </div>
    );
};

// Subject Attendance Card
const SubjectAttendanceCard = ({ item }) => (
    <div className="bg-white rounded-2xl shadow-lg p-5 transition-all hover:shadow-xl">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-lg font-bold text-gray-800">{item.subject}</h3>
                <p className="text-sm text-gray-500 mb-3">{item.instructor}</p>
            </div>
            <span className="text-2xl font-bold text-pink-600">{item.rate}%</span>
        </div>
        <AttendanceProgressBar rate={item.rate} />
        <div className="flex justify-between text-sm mt-3">
            <span className="text-gray-600">Absences: <span className="font-bold text-red-600">{item.absences}</span></span>
            <span className="text-gray-600">Lates: <span className="font-bold text-yellow-600">{item.lates}</span></span>
        </div>
    </div>
);

// Calendar Component
const AttendanceCalendar = () => {
    const [date, setDate] = useState(new Date('2025-11-05'));

    const getTileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toISOString().split('T')[0];
            const type = markedDates[dateString];
            if (type === 'absent') {
                return 'day-absent';
            }
            if (type === 'late') {
                return 'day-late';
            }
        }
        return null;
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 attendance-calendar">
            <Calendar
                onChange={setDate}
                value={date}
                tileClassName={getTileClassName}
                view="month"
            />
            <div className="flex justify-center space-x-4 mt-4 pt-3 border-t">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-100 border border-red-400" />
                    <span className="text-xs font-medium text-gray-600">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-400" />
                    <span className="text-xs font-medium text-gray-600">Late</span>
                </div>
            </div>
        </div>
    );
};

// Recent Activity Log
const RecentActivity = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <History size={22} className="text-pink-600" />
            Recent Activity
        </h3>
        <div className="space-y-4">
            {attendanceLog.map(item => (
                <div key={item.id} className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${item.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                        <item.icon size={18} className={item.color} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-700">{item.subject} - <span className={item.color}>{item.status}</span></p>
                        <p className="text-sm text-gray-500">{item.date}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- Main Attendance Page Component ---
const Attendance = () => {
  return (
    <AuthenticatedLayout>
        <Head title="Attendance" />

        {/* Global CSS for Calendar */}
        <style>{`
            .attendance-calendar .react-calendar {
                border: none;
                width: 100%;
            }
            .attendance-calendar .react-calendar__tile {
                border-radius: 8px;
            }
            .attendance-calendar .react-calendar__tile--now {
                background: #fdf2f8; /* pink-50 */
                color: #be185d; /* pink-700 */
            }
            .attendance-calendar .react-calendar__tile--active {
                background: #ec4899; /* pink-500 */
                color: white;
            }
            .attendance-calendar .day-absent {
                background: #fee2e2; /* red-100 */
                color: #b91c1c; /* red-700 */
                font-weight: bold;
                border-radius: 8px;
            }
            .attendance-calendar .day-late {
                background: #fef3c7; /* yellow-100 */
                color: #b45309; /* yellow-700 */
                font-weight: bold;
                border-radius: 8px;
            }
        `}</style>

        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <CalendarCheck size={36} className="text-pink-600" />
                Attendance Overview
            </h1>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryData.map(stat => <SummaryCard key={stat.label} {...stat} />)}
            </div>

            {/* Main Content: 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Column: Subject Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                        <BookOpen size={24} />
                        Attendance by Subject
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {subjectAttendance.map(item => (
                            <SubjectAttendanceCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>

                {/* Right Column: Calendar & Activity */}
                <div className="space-y-6">
                    <AttendanceCalendar />
                    <RecentActivity />
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
  );
};

export default Attendance;
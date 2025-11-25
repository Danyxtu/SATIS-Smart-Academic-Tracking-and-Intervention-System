import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    AlertTriangle, 
    BarChart2, 
    CheckSquare, 
    Square, 
    MessageSquare, 
    Mail, 
    Calendar, 
    ChevronDown,
    ListTodo
} from 'lucide-react';

// --- Mock Data (Replace with your actual data) ---
const summaryStats = [
    { label: 'Active Interventions', value: '2' },
    { label: 'Total Feedback', value: '3' },
    { label: 'Resolved', value: '1' },
    { label: 'Success Rate', value: '78%' },
];

const interventions = [
    {
        id: 1,
        title: 'Earth and Life Science',
        startDate: 'Started 3 days ago',
        priority: 'High Priority',
        priorityLevel: 'High',
        description: "Student's science performance has dropped to 68%, showing difficulty with recent lab work and theoretical concepts. Missing 3 assignments and attendance at 78%. Requires immediate teacher consultation and personalized tutoring.",
        stats: [
            { label: 'Current Grade', value: '68%' },
            { label: 'Attendance', value: '78%' },
            { label: 'Missing Work', value: '3' },
        ],
        actionPlan: [
            { id: 1, text: 'Schedule meeting with Science teacher this week.', completed: false, status: 'Update Progress' },
            { id: 2, text: 'Enroll in after-school tutoring program.', completed: true },
            { id: 3, text: 'Complete missing lab reports by Friday.', completed: false },
        ]
    },
    {
        id: 2,
        title: 'Statistics & Probability',
        startDate: 'Started 2 weeks ago',
        priority: 'Medium Priority',
        priorityLevel: 'Medium',
        description: 'Irregular attendance in Mathematics (85%) affecting comprehension of sequential topics. Grade currently at 72%, showing slow decline. Early intervention recommended to prevent further issues.',
        stats: [
            { label: 'Current Grade', value: '72%' },
            { label: 'Attendance', value: '85%' },
            { label: 'Missing Work', value: '2' },
        ],
        actionPlan: [
            { id: 1, text: 'Review module on sequential topics.', completed: true },
            { id: 2, text: 'Attend next 3 classes without fail.', completed: false, status: 'In Progress' },
        ]
    }
];

const recentFeedback = [
    { id: 1, from: 'Ms. Science', subject: 'Earth & Life Science', time: '2 days ago', comment: 'N/A needs to focus on lab safety procedures. Shows good curiosity but needs to follow instructions more carefully.' },
    { id: 2, from: 'Mr. Math', subject: 'Statistics & Probability', time: '4 days ago', comment: 'Great improvement in problem-solving! Keep practicing the algebraic equations we discussed.' },
    { id: 3, from: 'Ms. English', subject: 'Oral Communication', time: '1 week ago', comment: 'Excellent essay on Shakespeare. Your analytical skills are developing well. Keep up the good work!' },
];
// --- End of Mock Data ---


// --- Reusable Components ---

// Filter Tabs
const FilterTabs = () => {
    const [activeTab, setActiveTab] = useState('All');
    const tabs = ['All', 'Critical', 'In Progress', 'Completed'];

    return (
        <div className="flex items-center space-x-2 rounded-full bg-pink-100 p-1.5">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                        activeTab === tab
                            ? 'bg-white text-pink-700 shadow-md'
                            : 'text-gray-600 hover:bg-white/50'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};

// Top Stat Card
const StatCard = ({ label, value }) => (
    <div className="bg-white rounded-2xl shadow p-4 text-center">
        <p className="text-3xl font-bold text-pink-600">{value}</p>
        <p className="text-sm font-medium text-gray-600 mt-1">{label}</p>
    </div>
);

// Priority Tag
const PriorityTag = ({ level }) => {
    const colors = {
        High: 'bg-red-100 text-red-700 border border-red-200',
        Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        Low: 'bg-green-100 text-green-700 border border-green-200',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[level]}`}>
            {level} Priority
        </span>
    );
};

// Intervention Card Mini-Stat
const MiniStat = ({ label, value }) => (
    <div className="flex-1 bg-pink-50 rounded-lg p-3 text-center border border-pink-100">
        <p className="text-xl font-bold text-pink-700">{value}</p>
        <p className="text-xs text-gray-600">{label}</p>
    </div>
);

// Main Intervention Card
const InterventionCard = ({ item, tag, stat }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-pink-200">
        <div className="flex justify-between items-start mb-3">
            <div>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    {item.priorityLevel === 'High' && <AlertTriangle className="text-red-500" size={24} />}
                    {item.priorityLevel === 'Medium' && <BarChart2 className="text-yellow-500" size={24} />}
                    {item.title}
                </h3>
                <p className="text-xs text-gray-500">{item.startDate}</p>
            </div>
            <PriorityTag level={item.priorityLevel} />
        </div>
        <p className="text-gray-700 mb-4">{item.description}</p>
        <div className="flex gap-4 mb-5">
            {item.stats.map(stat => <MiniStat key={stat.label} {...stat} />)}
        </div>
        
        <h4 className="text-sm font-semibold text-gray-800 mb-2">ACTION PLAN</h4>
        <div className="space-y-2">
            {item.actionPlan.map(plan => (
                <div key={plan.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                        {plan.completed ? <CheckSquare size={18} className="text-pink-600" /> : <Square size={18} className="text-gray-400" />}
                        <span className={plan.completed ? 'line-through text-gray-500' : ''}>{plan.text}</span>
                    </div>
                    {plan.status && (
                        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">
                            {plan.status}
                        </span>
                    )}
                </div>
            ))}
        </div>
    </div>
);

// Recent Feedback Card
const RecentFeedbackCard = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare size={22} className="text-pink-600" />
            Recent Feedback
        </h3>
        <div className="space-y-4">
            {recentFeedback.map(fb => (
                <div key={fb.id}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-700">{fb.from}</span>
                        <span className="text-xs text-gray-400">{fb.time}</span>
                    </div>
                    <p className="text-xs font-medium text-pink-600 mb-1">{fb.subject}</p>
                    <p className="text-sm text-gray-600">{fb.comment}</p>
                </div>
            ))}
        </div>
        <button className="flex items-center gap-1.5 justify-center w-full mt-6 text-sm font-medium text-gray-700 hover:text-pink-600">
            View More <ChevronDown size={16} />
        </button>
    </div>
);

// Quick Actions Card
const QuickActionsCard = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Quick Actions
        </h3>
        <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-pink-50 border border-pink-100 hover:bg-pink-100 transition-colors">
                <Mail size={20} className="text-pink-600" />
                <span className="font-medium text-gray-700">Email All Teachers</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-pink-50 border border-pink-100 hover:bg-pink-100 transition-colors">
                <Calendar size={20} className="text-pink-600" />
                <span className="font-medium text-gray-700">Schedule Meeting</span>
            </button>
        </div>
    </div>
);


// --- Main Page Component ---
const InterventionFeedback = () => {
    return (
        <AuthenticatedLayout>
            <Head title="Interventions & Feedback" />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header: Title and Tabs */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <ListTodo size={36} className="text-pink-600" />
                        Interventions & Feedback
                    </h1>
                    <FilterTabs />
                </div>

                {/* Summary Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {summaryStats.map(stat => <StatCard key={stat.label} {...stat} />)}
                </div>

                {/* Main Content: 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Left Column: Intervention Cards */}
                    <div className="lg:col-span-2 space-y-6">
                        {interventions.map(item => <InterventionCard  key={item.id} item={item} />)}
                    </div>

                    {/* Right Column: Feedback & Actions */}
                    <div className="space-y-6">
                        <RecentFeedbackCard />
                        <QuickActionsCard />
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
};

export default InterventionFeedback;
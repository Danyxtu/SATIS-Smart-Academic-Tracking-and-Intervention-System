import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import HeaderImage from '../../assets/dashboard-header.png';
import { 
  HiAcademicCap, HiExclamation, HiChartPie, HiBadgeCheck  // <-- CORRECTED ICON NAME
} from 'react-icons/hi';

// --- Reusable StatCard Component ---
function StatCard({ title, value, icon, iconBgColor }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 h-full">
      <div className={`rounded-full p-3 ${iconBgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// --- Your PerformanceMetrics Component (Unchanged) ---
const PerformanceMetrics = ({ metrics }) => {
    const ProgressBar = ({ label, value, max = 100 }) => {
        const percentage = (value / max) * 100;
        return (
        <div className="mb-5 last:mb-0">
            <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">{label}:</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden border border-gray-300">
            <div 
                className="bg-gradient-to-r from-pink-300 to-pink-400 h-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            />
            </div>
        </div>
        );
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-pink-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Metrics</h2>
        
        <ProgressBar label="Academic Performance" value={metrics?.academicPerformance || 71.7} />
        <ProgressBar label="Attendance Rate" value={metrics?.attendanceRate || 85} />
        <ProgressBar label="Task Completion" value={metrics?.taskCompletion || 70} />
        <ProgressBar label="Overall Health" value={metrics?.overallHealth || 75} />
        
        {/* Scale */}
        <div className="flex justify-between items-center mt-4 px-1">
            <span className="text-sm font-medium text-gray-700">0</span>
            <span className="text-sm font-medium text-gray-700">25</span>
            <span className="text-sm font-medium text-gray-700">50</span>
            <span className="text-sm font-medium text-gray-700">75</span>
            <span className="text-sm font-medium text-gray-700">100</span>
        </div>
        </div>
    );
};


// --- Main Dashboard Component ---
export default function Dashboard() {
    const student = {
        firstName: 'Sheena',
        lastName: 'De Guzman',
    }

    // Data for the improved StatCards
    const summaryStats = [
        { 
            title: 'GPA', 
            value: '3.8', 
            icon: <HiAcademicCap className="w-6 h-6 text-green-600" />, 
            iconBgColor: 'bg-green-100' 
        },
        { 
            title: 'Subject at Risk', 
            value: '3', 
            icon: <HiExclamation className="w-6 h-6 text-red-600" />, 
            iconBgColor: 'bg-red-100' 
        },
        { 
            title: 'Attendance', 
            value: '85%', 
            icon: <HiChartPie className="w-6 h-6 text-blue-600" />, 
            iconBgColor: 'bg-blue-100' 
        },
        { 
            title: 'Completed Task', 
            value: '7', 
            icon: <HiBadgeCheck className="w-6 h-6 text-yellow-600" />, // <-- CORRECTED ICON USAGE
            iconBgColor: 'bg-yellow-100' 
        },
    ];

    // Data for your PerformanceMetrics
    const metricsData = {
        academicPerformance: 71.7,
        attendanceRate: 85,
        taskCompletion: 70,
        overallHealth: 75
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            
            {/* Your Welcome Header */}
            <div
                className="text-xl h-[150px] font-semibold leading-tight p-6 rounded-lg text-white"
                style={{
                    backgroundImage: `url(${HeaderImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <h1><strong>Welcome Back! {student.firstName}</strong></h1>
            </div>
            
            {/* Main Content Area */}
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Improved Summary Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {summaryStats.map((stat) => (
                            <StatCard
                                key={stat.title}
                                title={stat.title}
                                value={stat.value}
                                icon={stat.icon}
                                iconBgColor={stat.iconBgColor}
                            />
                        ))}
                    </div>
                    
                    {/* Your Performance Metrics Component */}
                    <div>
                        <PerformanceMetrics metrics={metricsData} />
                    </div>

                </div>
            </div>
            
        </AuthenticatedLayout>
    );
}
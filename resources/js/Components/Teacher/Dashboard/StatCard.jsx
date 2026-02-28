import { Icon } from "lucide-react";

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

export default StatCard;

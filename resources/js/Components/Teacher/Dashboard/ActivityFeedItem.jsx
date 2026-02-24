import { Icon } from "lucide-react";

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

export default ActivityFeedItem;

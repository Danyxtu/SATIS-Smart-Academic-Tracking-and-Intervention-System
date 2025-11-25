import MiniStat from '@/Components/MiniStat';
import PriorityTag from '@/Components/PriorityTag';

const InterventionCard = ({ item }) => (
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


export default InterventionCard;
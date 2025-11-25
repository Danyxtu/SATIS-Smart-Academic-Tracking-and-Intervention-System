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

export default PriorityTag

const MiniStat = ({ label, value }) => (
    <div className="flex-1 bg-pink-50 rounded-lg p-3 text-center border border-pink-100">
        <p className="text-xl font-bold text-pink-700">{value}</p>
        <p className="text-xs text-gray-600">{label}</p>
    </div>
);

export default MiniStat;
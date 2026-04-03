const StatusButton = ({
    label,
    icon,
    isActive,
    onClick,
    className,
    activeClassName,
}) => (
    <button
        onClick={onClick}
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
            ${isActive ? activeClassName : className}
        `}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export default StatusButton;

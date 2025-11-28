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
        className={`flex items-center gap-1.5 py-2 px-3 rounded-full font-medium text-sm transition-all
            ${isActive ? activeClassName : className}
        `}
    >
        {icon}
        <span className="hidden md:inline">{label}</span>
    </button>
);

export default StatusButton;

export const getRiskLevelBadge = (riskLevel) => {
    const styles = {
        critical: {
            bg: "bg-red-100 dark:bg-red-900/30",
            text: "text-red-700 dark:text-red-400",
            border: "border-red-200 dark:border-red-800",
            label: "Critical",
            icon: AlertTriangle,
        },
        warning: {
            bg: "bg-amber-100 dark:bg-amber-900/30",
            text: "text-amber-700 dark:text-amber-400",
            border: "border-amber-200 dark:border-amber-800",
            label: "Warning",
            icon: TrendingDown,
        },
        watchlist: {
            bg: "bg-blue-100 dark:bg-blue-900/30",
            text: "text-blue-700 dark:text-blue-400",
            border: "border-blue-200 dark:border-blue-800",
            label: "Watchlist",
            icon: Eye,
        },
    };
    return styles[riskLevel] || styles.watchlist;
};

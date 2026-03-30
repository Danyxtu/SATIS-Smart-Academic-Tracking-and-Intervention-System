const WelcomeScreen = ({
    title,
    description,
    screenNumber,
    totalScreens,
    icon: Icon,
    gradient,
}) => (
    <div className="flex flex-col items-center justify-center text-center p-5 sm:p-7 animate-fade-in">
        <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 sm:mb-5 shadow-lg`}
        >
            <Icon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 font-poppins">
            {title}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-lg mb-6 leading-relaxed">
            {description}
        </p>
        <div className="flex items-center gap-2">
            {[...Array(totalScreens)].map((_, i) => (
                <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                        i + 1 === screenNumber
                            ? "w-8 bg-primary"
                            : "w-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                />
            ))}
        </div>
    </div>
);
export default WelcomeScreen;

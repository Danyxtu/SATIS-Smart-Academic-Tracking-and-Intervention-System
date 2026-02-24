const WelcomeScreen = ({
    title,
    description,
    screenNumber,
    totalScreens,
    icon: Icon,
    gradient,
}) => (
    <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 animate-fade-in">
        <div
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg`}
        >
            <Icon className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 font-poppins">
            {title}
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-xl mb-8 leading-relaxed">
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

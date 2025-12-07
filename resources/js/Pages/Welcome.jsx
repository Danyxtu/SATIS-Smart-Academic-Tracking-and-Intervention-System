import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import Background from "../../assets/background.png";
import {
    BookOpen,
    Users,
    TrendingUp,
    ChevronRight,
    ChevronLeft,
    Sparkles,
} from "lucide-react";

const screens = [
    {
        title: "Welcome to SATIS",
        description:
            "Smart Academic Tracking and Intervention System (SATIS) is designed to empower educators and support students effectively. We provide comprehensive tools to monitor academic progress, identify at-risk students, and implement timely interventions.",
        icon: BookOpen,
        gradient: "from-primary/20 to-pink-500/20",
    },
    {
        title: "Unlock Student Potential",
        description:
            "With SATIS, you can gain insights into student performance through intuitive dashboards and analytics. Proactively address learning gaps and foster an environment where every student has the opportunity to succeed.",
        icon: Users,
        gradient: "from-blue-500/20 to-primary/20",
    },
    {
        title: "Streamline Interventions",
        description:
            "Our system simplifies the process of creating, tracking, and managing intervention plans. Collaborate with ease, assign tasks, and monitor the effectiveness of support strategies, all in one place.",
        icon: TrendingUp,
        gradient: "from-primary/20 to-purple-500/20",
    },
];

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

export default function Welcome() {
    const [screen, setScreen] = useState(1);
    const totalScreens = 3;

    const nextScreen = () => {
        if (screen < totalScreens) {
            setScreen(screen + 1);
        } else {
            router.visit(route("login"));
        }
    };

    const prevScreen = () => {
        if (screen > 1) {
            setScreen(screen - 1);
        }
    };

    const handleLoginClick = () => {
        router.visit(route("login"));
    };

    const goToScreen = (num) => {
        setScreen(num);
    };

    const currentScreen = screens[screen - 1];

    return (
        <>
            <Head title={`Welcome - Screen ${screen}`} />

            <div
                className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 relative"
                style={{
                    backgroundImage: `url(${Background})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundAttachment: "fixed",
                }}
            >
                {/* Overlay for better readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-primary/10 backdrop-blur-[2px]" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center w-full px-4">
                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse-slow" />
                            <ApplicationLogo className="w-28 h-28 sm:w-36 sm:h-36 relative drop-shadow-lg" />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-gray-600 tracking-wider uppercase">
                                Academic Excellence
                            </span>
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="w-full sm:max-w-2xl overflow-hidden rounded-2xl shadow-2xl bg-white/90 backdrop-blur-md border border-white/50">
                        <WelcomeScreen
                            title={currentScreen.title}
                            description={currentScreen.description}
                            screenNumber={screen}
                            totalScreens={totalScreens}
                            icon={currentScreen.icon}
                            gradient={currentScreen.gradient}
                        />

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-100">
                            <div>
                                {screen > 1 ? (
                                    <button
                                        onClick={prevScreen}
                                        className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-sm text-gray-700 hover:bg-gray-50 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Back
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleLoginClick}
                                        className="inline-flex items-center px-5 py-2.5 text-sm text-gray-500 hover:text-primary transition-colors duration-200"
                                    >
                                        Skip to Login
                                    </button>
                                )}
                            </div>

                            <div>
                                {screen < totalScreens ? (
                                    <button
                                        onClick={nextScreen}
                                        className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-primary to-pink-400 border border-transparent rounded-xl font-medium text-sm text-white hover:from-primary/90 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 shadow-lg shadow-primary/25"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleLoginClick}
                                        className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 border border-transparent rounded-xl font-medium text-sm text-white hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg shadow-green-500/25"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Get Started
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            © 2025 SATIS - Smart Academic Tracking System
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

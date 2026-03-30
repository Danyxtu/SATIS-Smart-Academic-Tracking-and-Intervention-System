import Background from "../../assets/background.png";

export default function GuestLayout({ children, cardClassName = "" }) {
    return (
        <div
            className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-y-auto py-4 sm:py-6"
            style={{
                backgroundImage: `url(${Background})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
            }}
        >
            {/* Gradient overlay for better readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-primary/10 backdrop-blur-[2px]" />

            {/* Content wrapper */}
            <div className="relative z-10 w-full flex flex-col items-center px-3 sm:px-4">
                {/* Main Card with glassmorphism effect */}
                <div
                    className={`mt-4 w-full max-w-md overflow-hidden rounded-2xl border border-white/50 bg-white/90 px-5 py-5 shadow-2xl backdrop-blur-md sm:mt-6 sm:px-7 sm:py-6 ${cardClassName}`}
                >
                    {children}
                </div>

                {/* Footer */}
                <div className="mt-4 text-center sm:mt-5">
                    <p className="text-xs sm:text-sm text-gray-600">
                        © 2025 SATIS - Smart Academic Tracking System
                    </p>
                </div>
            </div>
        </div>
    );
}

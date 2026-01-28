import Background from "../../assets/background.png";

export default function GuestLayout({ children }) {
    return (
        <div
            className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0 relative"
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
            <div className="relative z-10 w-full flex flex-col items-center px-4">
                {/* Main Card with glassmorphism effect */}
                <div className="mt-6 w-full overflow-hidden bg-white/90 backdrop-blur-md px-8 py-8 shadow-2xl sm:max-w-md sm:rounded-2xl border border-white/50">
                    {children}
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        © 2025 SATIS - Smart Academic Tracking System
                    </p>
                </div>
            </div>
        </div>
    );
}

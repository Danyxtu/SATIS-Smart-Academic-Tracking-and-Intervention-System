import { Download, Smartphone } from "lucide-react";

const DEFAULT_APP_DOWNLOAD_URL =
    "https://github.com/Danyxtu/SATIS-Smart-Academic-Tracking-and-Intervention-System-App/releases/download/v1.0.0/application-9742e067-df1a-4996-bfcb-7d27583e404e.apk";

export default function AppDownloadCTA({
    href = DEFAULT_APP_DOWNLOAD_URL,
    title = "Download the App!",
    subtitle = "Get SATIS Mobile for instant updates.",
    className = "",
    floating = true,
}) {
    const wrapperClasses = floating
        ? "fixed bottom-4 right-4 z-50 w-[220px] sm:bottom-6 sm:right-6 sm:w-[280px]"
        : "w-full max-w-xs";

    return (
        <div className={`${wrapperClasses} ${className}`.trim()}>
            <div className="rounded-2xl bg-gradient-to-r from-primary via-pink-400 to-rose-400 p-[1px] shadow-2xl shadow-primary/30">
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download the SATIS mobile app"
                    className="group flex animate-float-cta items-center gap-3 rounded-2xl bg-white/95 px-3.5 py-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-pink-500 text-white shadow-md shadow-primary/30">
                        <Smartphone className="h-5 w-5" />
                    </span>

                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-extrabold leading-tight tracking-tight text-gray-800">
                            {title}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-tight text-gray-600">
                            {subtitle}
                        </span>
                    </span>

                    <Download className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-hover:translate-y-0.5" />
                </a>
            </div>
        </div>
    );
}

import ApplicationLogo from "@/Components/ApplicationLogo";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    BookMarked,
    Home,
    SearchX,
    ShieldAlert,
    Sparkles,
    TriangleAlert,
} from "lucide-react";
import Background from "../../../assets/background.png";

const ERROR_CONTENT = {
    403: {
        code: "403",
        title: "This Resource Is Restricted",
        subtitle: "Academic Access Control",
        description:
            "This action is prohibited or restricted. You are not permitted to open this academic module without proper access clearance.",
        helper: "If this feels incorrect, please contact your adviser, subject teacher, or system administrator.",
        Icon: ShieldAlert,
        accent: "from-amber-500 to-orange-500",
    },
    404: {
        code: "404",
        title: "Learning Resource Not Found",
        subtitle: "Academic Record Missing",
        description:
            "The page you requested is not in the current academic records. It may have been moved, renamed, or removed.",
        helper: "Please return to the previous page or go back to the main portal to continue your tasks.",
        Icon: SearchX,
        accent: "from-sky-500 to-blue-600",
    },
    500: {
        code: "500",
        title: "Academic Processing Interrupted",
        subtitle: "Internal Evaluation Fault",
        description:
            "The system encountered an unexpected fault while processing this academic request. Your current task may not have completed.",
        helper: "Please go back and try again. If this persists, report the incident with the time and module name to your administrator.",
        Icon: TriangleAlert,
        accent: "from-rose-500 to-red-600",
    },
    503: {
        code: "503",
        title: "Campus Services Temporarily Unavailable",
        subtitle: "Maintenance or High Traffic",
        description:
            "The portal is currently unavailable due to scheduled maintenance or peak academic system load.",
        helper: "Please wait a few minutes and return to continue your coursework or record updates.",
        Icon: BookMarked,
        accent: "from-indigo-500 to-blue-600",
    },
};

const FALLBACK_CONTENT = {
    code: "Error",
    title: "Unexpected Academic System Issue",
    subtitle: "System Notice",
    description:
        "An unexpected issue occurred while opening this module. Please try again in a moment.",
    helper: "If the issue continues, please report it to your system administrator.",
    Icon: BookMarked,
    accent: "from-primary to-pink-500",
};

export default function Status({ status = 404 }) {
    const details = ERROR_CONTENT[status] ?? FALLBACK_CONTENT;
    const { code, title, subtitle, description, helper, Icon, accent } =
        details;

    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        window.location.href = "/";
    };

    return (
        <>
            <Head title={`${code} - ${title}`} />

            <div
                className="relative flex min-h-screen w-full items-center justify-center px-4 py-6 sm:px-6"
                style={{
                    backgroundImage: `url(${Background})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundAttachment: "fixed",
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-white/55 to-primary/15 backdrop-blur-[2px]" />

                <div className="relative z-10 w-full max-w-2xl">
                    <div className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-2xl backdrop-blur-md sm:p-7">
                        <div className="mb-5 flex flex-col items-center text-center">
                            <div className="relative mb-3">
                                <div className="absolute -inset-3 rounded-full bg-primary/20 blur-xl" />
                                <ApplicationLogo className="relative h-16 w-16 sm:h-20 sm:w-20" />
                            </div>

                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                {subtitle}
                            </div>

                            <div
                                className={`mb-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${accent} px-3 py-1.5 text-white shadow-md`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="text-sm font-bold">
                                    {code}
                                </span>
                            </div>

                            <h1 className="text-2xl font-extrabold tracking-tight text-gray-800 sm:text-3xl">
                                {title}
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
                                {description}
                            </p>
                            <p className="mt-2 max-w-xl text-xs leading-relaxed text-gray-500 sm:text-sm">
                                {helper}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                            <button
                                type="button"
                                onClick={handleGoBack}
                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-primary/40 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
                            >
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                Go Back
                            </button>

                            <Link
                                href="/"
                                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:from-primary/90 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <Home className="mr-1.5 h-4 w-4" />
                                Return to Portal
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

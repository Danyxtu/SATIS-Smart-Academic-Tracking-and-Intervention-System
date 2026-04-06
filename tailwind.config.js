import defaultTheme from "tailwindcss/defaultTheme";
import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class", // Enable class-based dark mode

    content: [
        "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
        "./storage/framework/views/*.php",
        "./resources/views/**/*.blade.php",
        "./resources/js/**/*.jsx",
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ["Figtree", ...defaultTheme.fontFamily.sans],
                poppins: ["Poppins", "sans-serif"],
            },
            colors: {
                primary: "#CB8AB2",
                secondary: "#6B7280",
                // Dark mode specific colors
                dark: {
                    bg: "#1a1a2e",
                    card: "#16213e",
                    surface: "#0f3460",
                    border: "#e94560",
                },
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-in-out",
                "slide-in": "slideIn 0.3s ease-out",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "float-cta": "floatCta 2.2s ease-in-out infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideIn: {
                    "0%": { transform: "translateY(-10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                floatCta: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-8px)" },
                },
            },
        },
    },

    plugins: [forms],
};

import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./Context/ThemeContext";
import ThemeShortcuts from "@/Components/ThemeShortcuts";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${appName} - ${title}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider>
                <App {...props} />
                <ThemeShortcuts />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: "#363636",
                            color: "#fff",
                        },
                        success: {
                            duration: 3000,
                            style: {
                                background: "#10B981",
                                color: "#fff",
                            },
                            iconTheme: {
                                primary: "#fff",
                                secondary: "#10B981",
                            },
                        },
                        error: {
                            duration: 5000,
                            style: {
                                background: "#EF4444",
                                color: "#fff",
                            },
                            iconTheme: {
                                primary: "#fff",
                                secondary: "#EF4444",
                            },
                        },
                    }}
                />
            </ThemeProvider>,
        );
    },
    progress: {
        color: "#4B5563",
    },
});

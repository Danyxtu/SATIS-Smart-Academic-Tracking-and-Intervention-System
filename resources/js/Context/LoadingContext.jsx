import React, { createContext, useState, useCallback } from "react";

export const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);

    const startLoading = useCallback(() => {
        setIsLoading(true);
    }, []);

    const stopLoading = useCallback(() => {
        setIsLoading(false);
    }, []);

    const withLoading = useCallback(
        async (asyncFunction, delayMs = 300) => {
            try {
                startLoading();
                const result = await asyncFunction();
                // Add a minimum delay for better UX
                await new Promise((resolve) =>
                    setTimeout(resolve, Math.max(0, delayMs))
                );
                return result;
            } finally {
                stopLoading();
            }
        },
        [startLoading, stopLoading]
    );

    return (
        <LoadingContext.Provider
            value={{
                isLoading,
                startLoading,
                stopLoading,
                withLoading,
            }}
        >
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = React.useContext(LoadingContext);
    if (!context) {
        // Return a safe fallback if not in provider
        return {
            isLoading: false,
            startLoading: () => {},
            stopLoading: () => {},
            withLoading: async (fn) => await fn(),
        };
    }
    return context;
};

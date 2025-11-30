import React from "react";
import { useLoading } from "@/Context/LoadingContext";

export const LoadingOverlay = () => {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-gray-700 font-medium">Loading...</p>
            </div>
        </div>
    );
};

export default LoadingOverlay;

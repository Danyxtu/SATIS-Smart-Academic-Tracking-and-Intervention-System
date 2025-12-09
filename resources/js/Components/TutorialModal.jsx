import React, { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";

/**
 * TutorialModal - A modal component for step-by-step tutorials
 *
 * Props:
 * - visible: boolean - Controls modal visibility
 * - onClose: function - Called when tutorial is closed
 * - steps: array - Array of step objects with { title, description, icon, highlightArea, tip }
 * - title: string - Tutorial title (e.g., "Dashboard Tutorial")
 * - accentColor: string - Primary color for the tutorial theme
 */
const TutorialModal = ({
    visible,
    onClose,
    steps = [],
    title = "Tutorial",
    accentColor = "#DB2777",
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (visible) {
            setCurrentStep(0);
            // Prevent body scroll when modal is open
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [visible]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(currentStep + 1);
                setIsAnimating(false);
            }, 150);
        } else {
            handleClose();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(currentStep - 1);
                setIsAnimating(false);
            }, 150);
        }
    };

    const handleClose = () => {
        onClose();
        setCurrentStep(0);
    };

    const handleStepClick = (index) => {
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentStep(index);
            setIsAnimating(false);
        }, 150);
    };

    if (!visible || steps.length === 0) return null;

    const currentStepData = steps[currentStep] || {
        title: "Step",
        description: "No description available.",
    };
    const IconComponent = currentStepData.icon;
    const isLastStep = currentStep === steps.length - 1;
    const progressPercentage = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal Container */}
            <div
                className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden animate-slide-up"
                style={{ borderTopColor: accentColor, borderTopWidth: "4px" }}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 pb-4">
                    <div>
                        <h2
                            className="text-xl font-bold"
                            style={{ color: accentColor }}
                        >
                            {title}
                        </h2>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                            Step {currentStep + 1} of {steps.length}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 -mr-2 -mt-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X size={22} className="text-gray-400" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-5 pb-5">
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                backgroundColor: accentColor,
                                width: `${progressPercentage}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <div
                    className={`px-5 pb-5 transition-opacity duration-150 ${
                        isAnimating ? "opacity-0" : "opacity-100"
                    }`}
                >
                    <div className="flex flex-col items-center text-center">
                        {/* Icon */}
                        {IconComponent && (
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                                style={{ backgroundColor: `${accentColor}15` }}
                            >
                                <IconComponent
                                    size={36}
                                    style={{ color: accentColor }}
                                    strokeWidth={1.5}
                                />
                            </div>
                        )}

                        {/* Step Title */}
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            {currentStepData.title}
                        </h3>

                        {/* Step Description */}
                        <p className="text-gray-600 leading-relaxed px-2">
                            {currentStepData.description}
                        </p>

                        {/* Highlight Area Badge */}
                        {currentStepData.highlightArea && (
                            <div
                                className="mt-4 px-4 py-2 rounded-full"
                                style={{ backgroundColor: `${accentColor}15` }}
                            >
                                <span
                                    className="text-sm font-semibold"
                                    style={{ color: accentColor }}
                                >
                                    📍 Location: {currentStepData.highlightArea}
                                </span>
                            </div>
                        )}

                        {/* Tip */}
                        {currentStepData.tip && (
                            <div className="mt-5 w-full bg-amber-50 rounded-xl p-4 border border-amber-100">
                                <p className="text-xs font-bold text-amber-800 mb-1">
                                    💡 Tip
                                </p>
                                <p className="text-sm text-amber-700 leading-relaxed">
                                    {currentStepData.tip}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="px-5 pb-4">
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all ${
                                currentStep === 0
                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            <ChevronLeft size={20} />
                            Previous
                        </button>
                        <button
                            onClick={handleNext}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                            style={{ backgroundColor: accentColor }}
                        >
                            {isLastStep ? "Finish" : "Next"}
                            {isLastStep ? (
                                <CheckCircle size={20} />
                            ) : (
                                <ChevronRight size={20} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Step Dots */}
                <div className="flex justify-center gap-2 pb-6">
                    {steps.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleStepClick(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                index === currentStep
                                    ? "w-6"
                                    : index < currentStep
                                    ? "w-2 opacity-50"
                                    : "w-2"
                            }`}
                            style={{
                                backgroundColor:
                                    index <= currentStep
                                        ? accentColor
                                        : "#E5E7EB",
                            }}
                        />
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default TutorialModal;

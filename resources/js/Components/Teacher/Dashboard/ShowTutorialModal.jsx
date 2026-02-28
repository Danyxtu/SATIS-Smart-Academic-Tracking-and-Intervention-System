import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import {
    X,
    Sparkles,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    UserPlus,
    Users,
    Upload,
    BarChart,
} from "lucide-react";

const tutorialSteps = [
    {
        title: "Welcome to Class Creation",
        description:
            "This tutorial will guide you through the process of creating and managing your class in SATIS. Follow these steps to get started!",
        icon: Sparkles,
        iconBg: "bg-indigo-500",
        tips: [
            "Make sure you have your class list ready",
            "You'll need student information (names, IDs)",
            "Have your subject details handy",
        ],
    },
    {
        title: "Step 1: Navigate to My Classes",
        description:
            "Click on 'My Classes' in the navigation menu at the top of the page. This will take you to your class management dashboard.",
        icon: BookOpen,
        iconBg: "bg-blue-500",
        tips: [
            "Look for the book icon in the navigation bar",
            "You can also click 'View Full Class List' in Quick Actions",
            "Your existing classes will be displayed here",
        ],
    },
    {
        title: "Step 2: Create a New Class",
        description:
            "Click the 'Create Class' or 'Add Class' button to start setting up your new class. You'll be prompted to enter the class details.",
        icon: UserPlus,
        iconBg: "bg-emerald-500",
        tips: [
            "Select your subject from the dropdown",
            "Choose the correct section/block",
            "Set the schedule if required",
        ],
    },
    {
        title: "Step 3: Add Students",
        description:
            "Once your class is created, you can add students either manually one by one, or by uploading a CSV/Excel file with student information.",
        icon: Users,
        iconBg: "bg-violet-500",
        tips: [
            "Use bulk upload for large classes",
            "Ensure student IDs are correct",
            "Verify student names match official records",
        ],
    },
    {
        title: "Step 4: Upload Grades",
        description:
            "After adding students, you can start uploading grades. Use the grade upload feature to import grades from a spreadsheet or enter them manually.",
        icon: Upload,
        iconBg: "bg-amber-500",
        tips: [
            "Download the grade template first",
            "Fill in scores for each assessment",
            "Double-check before submitting",
        ],
    },
    {
        title: "Step 5: Monitor & Track",
        description:
            "Your dashboard will automatically update with student analytics. Monitor at-risk students, track grade distributions, and create interventions as needed.",
        icon: BarChart,
        iconBg: "bg-rose-500",
        tips: [
            "Check your dashboard regularly",
            "Create interventions for struggling students",
            "Track attendance patterns",
        ],
    },
    {
        title: "You're All Set!",
        description:
            "Congratulations! You now know how to create and manage your class in SATIS. Remember, you can always access this tutorial by clicking the help button.",
        icon: CheckCircle,
        iconBg: "bg-green-500",
        tips: [
            "Explore the Interventions feature",
            "Use the Attendance tracker",
            "Contact support if you need help",
        ],
    },
];

const ShowTutorialModal = ({ closeTutorial }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const nextStep = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                    onClick={closeTutorial}
                />

                {/* Modal */}
                <div className="flex min-h-full items-center justify-center p-4">
                    <div className="relative w-full max-w-2xl transform rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-2xl overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                                style={{
                                    width: `${
                                        ((currentStep + 1) /
                                            tutorialSteps.length) *
                                        100
                                    }%`,
                                }}
                            />
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={closeTutorial}
                            className="absolute top-4 right-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        {/* Step Counter */}
                        <div className="absolute top-4 left-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Step {currentStep + 1} of {tutorialSteps.length}
                        </div>

                        {/* Content */}
                        <div className="pt-14 pb-6 px-6">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div
                                    className={`h-20 w-20 rounded-2xl ${tutorialSteps[currentStep].iconBg} flex items-center justify-center shadow-lg`}
                                >
                                    {React.createElement(
                                        tutorialSteps[currentStep].icon,
                                        {
                                            size: 40,
                                            className: "text-white",
                                        },
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
                                {tutorialSteps[currentStep].title}
                            </h2>

                            {/* Description */}
                            <p className="text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
                                {tutorialSteps[currentStep].description}
                            </p>

                            {/* Tips */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                    <Sparkles
                                        size={16}
                                        className="text-amber-500"
                                    />
                                    Tips
                                </h3>
                                <ul className="space-y-2">
                                    {tutorialSteps[currentStep].tips.map(
                                        (tip, index) => (
                                            <li
                                                key={index}
                                                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                                            >
                                                <CheckCircle
                                                    size={16}
                                                    className="text-green-500 mt-0.5 flex-shrink-0"
                                                />
                                                {tip}
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </div>

                            {/* Step Indicators */}
                            <div className="flex justify-center gap-2 mb-6">
                                {tutorialSteps.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentStep(index)}
                                        className={`h-2 rounded-full transition-all ${
                                            index === currentStep
                                                ? "w-8 bg-indigo-500"
                                                : index < currentStep
                                                  ? "w-2 bg-indigo-300"
                                                  : "w-2 bg-gray-300 dark:bg-gray-600"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                    currentStep === 0
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                            >
                                <ChevronLeft size={18} />
                                Previous
                            </button>

                            {currentStep === tutorialSteps.length - 1 ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            closeTutorial();
                                            setCurrentStep(0);
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <CheckCircle size={18} />
                                        Got it!
                                    </button>
                                    <Link
                                        href={
                                            route("teacher.classes.index") +
                                            "?highlight=addclass"
                                        }
                                        className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                                    >
                                        <BookOpen size={18} />
                                        Go to My Classes
                                    </Link>
                                </div>
                            ) : (
                                <button
                                    onClick={() => nextStep()}
                                    className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                                >
                                    Next
                                    <ChevronRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ShowTutorialModal;

import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import TutorialCard from "@/Components/TutorialCard";
import TutorialModal from "@/Components/TutorialModal";
import { getTutorialCards, getTutorialById } from "@/Data/tutorialData";
import { BookOpen } from "lucide-react";

// --- FAQ Accordion Item ---
const FAQItem = ({ question, answer, icon, isOpen, onClick }) => (
    <div
        className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
            isOpen
                ? "border-indigo-200 shadow-md"
                : "border-gray-100 hover:border-gray-200"
        }`}
    >
        <button
            onClick={onClick}
            className="w-full px-6 py-5 flex items-start gap-4 text-left"
        >
            <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isOpen ? "bg-indigo-100" : "bg-gray-100"
                }`}
            >
                <span className={isOpen ? "text-indigo-600" : "text-gray-500"}>
                    {icon}
                </span>
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{question}</h3>
                <div
                    className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-96 mt-3" : "max-h-0"
                    }`}
                >
                    <p className="text-gray-600 leading-relaxed">{answer}</p>
                </div>
            </div>
            <div
                className={`w-6 h-6 flex items-center justify-center transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                }`}
            >
                <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>
        </button>
    </div>
);

// --- Feature Card ---
const FeatureCard = ({ title, description, icon, color, link, linkText }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
        <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${color} group-hover:scale-110 transition-transform`}
        >
            {icon}
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {description}
        </p>
        {link && (
            <Link
                href={link}
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
                {linkText}
                <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </Link>
        )}
    </div>
);

// --- Study Tip Card ---
const TipCard = ({ number, title, description, gradient }) => (
    <div className={`rounded-2xl p-6 ${gradient} relative overflow-hidden`}>
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold mb-3">
                Tip #{number}
            </span>
            <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
            <p className="text-white/90 text-sm leading-relaxed">
                {description}
            </p>
        </div>
    </div>
);

// --- Contact Card ---
const ContactCard = ({
    icon,
    title,
    subtitle,
    action,
    actionText,
    gradient,
}) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-lg transition-all duration-300 group">
        <div
            className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${gradient} group-hover:scale-110 transition-transform`}
        >
            {icon}
        </div>
        <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-500 text-sm mb-4">{subtitle}</p>
        <button
            onClick={action}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
            {actionText}
        </button>
    </div>
);

// --- Main Component ---
const LearnMore = () => {
    const [openFAQ, setOpenFAQ] = useState(0);
    const [activeTutorial, setActiveTutorial] = useState(null);
    const [tutorialVisible, setTutorialVisible] = useState(false);

    // Get tutorial cards data
    const tutorialCards = getTutorialCards();

    // Handle tutorial card press
    const handleTutorialPress = (tutorialId) => {
        const tutorial = getTutorialById(tutorialId);
        if (tutorial) {
            setActiveTutorial(tutorial);
            setTutorialVisible(true);
        }
    };

    // Handle tutorial close
    const handleTutorialClose = () => {
        setTutorialVisible(false);
        setTimeout(() => setActiveTutorial(null), 300);
    };

    const faqs = [
        {
            question: "How do I check my attendance?",
            answer: "Go to the Attendance section in the sidebar to view your complete attendance records. You can see daily records, monthly summaries, and your overall attendance rate. The system tracks present, absent, late, and excused statuses for each of your enrolled subjects.",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            ),
        },
        {
            question: "Where can I see my grades?",
            answer: "Navigate to Performance Analytics in the sidebar to view your grades, progress, and academic performance across all subjects. You can see individual assignment scores, overall subject grades, and track your improvement over time with visual charts.",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
            ),
        },
        {
            question: "How do I contact my teacher?",
            answer: "Use the Intervention & Feedback section to view messages from your teachers. When your teacher starts an intervention, you'll receive notifications with their guidance and can view any tasks or goals they've assigned to help you succeed.",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            ),
        },
        {
            question: "What does 'At Risk' mean?",
            answer: "When a subject is marked 'At Risk', it means your grade is below 75% or you have concerning attendance patterns. Don't worry! This early warning helps you and your teachers take action early. Check the Subjects at Risk section to see what areas need improvement.",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            ),
        },
        {
            question: "What are intervention tasks?",
            answer: "Intervention tasks are personalized goals set by your teacher to help you improve. These might include completing specific assignments, attending extra help sessions, or following a study plan. Complete these tasks to show progress and get back on track!",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                </svg>
            ),
        },
        {
            question: "How is my overall grade calculated?",
            answer: "Your overall grade is calculated as the average of all your subject grades. Each subject grade is based on your scores in assignments, quizzes, exams, and other assessments, weighted according to your school's grading policy.",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
            ),
        },
    ];

    const features = [
        {
            title: "Dashboard",
            description:
                "Your central hub for academic overview. See your grades, attendance, notifications, and pending tasks at a glance.",
            icon: (
                <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                </svg>
            ),
            color: "bg-gradient-to-br from-indigo-500 to-purple-600",
            link: route("dashboard"),
            linkText: "Go to Dashboard",
        },
        {
            title: "Performance Analytics",
            description:
                "Deep dive into your academic performance. View detailed charts, grade breakdowns, and track your progress over time.",
            icon: (
                <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
            ),
            color: "bg-gradient-to-br from-emerald-500 to-teal-600",
            link: route("analytics.index"),
            linkText: "View Analytics",
        },
        {
            title: "Intervention & Feedback",
            description:
                "Receive personalized support from your teachers. View messages, complete assigned tasks, and track your improvement journey.",
            icon: (
                <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                </svg>
            ),
            color: "bg-gradient-to-br from-amber-500 to-orange-600",
            link: route("interventions-feed"),
            linkText: "View Feedback",
        },
        {
            title: "Subjects at Risk",
            description:
                "Early warning system for struggling subjects. Identify areas needing attention before they become bigger problems.",
            icon: (
                <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            ),
            color: "bg-gradient-to-br from-red-500 to-rose-600",
            link: route("subject-at-risk"),
            linkText: "Check Status",
        },
    ];

    const studyTips = [
        {
            number: 1,
            title: "Set a Study Schedule",
            description:
                "Create a consistent study routine. Study at the same time each day to build a habit that sticks.",
            gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
        },
        {
            number: 2,
            title: "Take Active Notes",
            description:
                "Don't just read - write summaries, create diagrams, and ask yourself questions about the material.",
            gradient: "bg-gradient-to-br from-purple-500 to-pink-600",
        },
        {
            number: 3,
            title: "Break It Down",
            description:
                "Large tasks feel overwhelming. Break them into smaller, manageable chunks and tackle them one at a time.",
            gradient: "bg-gradient-to-br from-orange-500 to-red-600",
        },
        {
            number: 4,
            title: "Ask For Help Early",
            description:
                "Struggling? Don't wait! Ask your teacher for help as soon as you don't understand something.",
            gradient: "bg-gradient-to-br from-teal-500 to-emerald-600",
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Learn More" />

            <div className="min-h-screen bg-gray-50/50">
                {/* Hero Header */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl mx-4 mt-4 p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <svg
                            className="w-full h-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                <pattern
                                    id="grid"
                                    width="10"
                                    height="10"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d="M 10 0 L 0 0 0 10"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="0.5"
                                    />
                                </pattern>
                            </defs>
                            <rect width="100" height="100" fill="url(#grid)" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold">Learn More</h1>
                        </div>
                        <p className="text-indigo-100 text-lg max-w-2xl">
                            Explore resources to help you succeed in your
                            academic journey. Find answers to common questions,
                            learn how to use SATIS features, and discover study
                            tips.
                        </p>
                    </div>

                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -right-5 -bottom-10 w-32 h-32 bg-pink-400/20 rounded-full blur-xl" />
                </div>

                <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
                    {/* Platform Features */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-indigo-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Platform Features
                                </h2>
                                <p className="text-gray-500">
                                    Everything you need to track and improve
                                    your academics
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {features.map((feature, index) => (
                                <FeatureCard key={index} {...feature} />
                            ))}
                        </div>
                    </section>

                    {/* Tutorials Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Step-by-Step Tutorials
                                </h2>
                                <p className="text-gray-500">
                                    Learn how to use each feature of SATIS
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tutorialCards.map((tutorial) => (
                                <TutorialCard
                                    key={tutorial.id}
                                    title={tutorial.title}
                                    description={tutorial.description}
                                    icon={tutorial.icon}
                                    color={tutorial.color}
                                    stepCount={tutorial.stepCount}
                                    onPress={() =>
                                        handleTutorialPress(tutorial.id)
                                    }
                                />
                            ))}
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-purple-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Frequently Asked Questions
                                </h2>
                                <p className="text-gray-500">
                                    Find answers to common questions about SATIS
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {faqs.map((faq, index) => (
                                <FAQItem
                                    key={index}
                                    {...faq}
                                    isOpen={openFAQ === index}
                                    onClick={() =>
                                        setOpenFAQ(
                                            openFAQ === index ? -1 : index
                                        )
                                    }
                                />
                            ))}
                        </div>
                    </section>

                    {/* Study Tips */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-amber-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Study Tips for Success
                                </h2>
                                <p className="text-gray-500">
                                    Proven strategies to improve your academic
                                    performance
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {studyTips.map((tip, index) => (
                                <TipCard key={index} {...tip} />
                            ))}
                        </div>
                    </section>

                    {/* Understanding Your Progress */}
                    <section className="bg-white rounded-2xl border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-emerald-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Understanding Your Progress
                                </h2>
                                <p className="text-gray-500">
                                    Learn what the different status indicators
                                    mean
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full border border-emerald-200">
                                        On Track
                                    </span>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    You're Doing Great!
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Your grade is 75% or higher. Keep up the
                                    excellent work and maintain your study
                                    habits.
                                </p>
                            </div>

                            <div className="p-5 rounded-xl bg-amber-50 border border-amber-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full border border-amber-200">
                                        Needs Attention
                                    </span>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    Room for Improvement
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Your grade is between 70-75%. Consider
                                    dedicating more time to this subject or
                                    asking for help.
                                </p>
                            </div>

                            <div className="p-5 rounded-xl bg-red-50 border border-red-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full border border-red-200">
                                        At Risk
                                    </span>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    Take Action Now
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Your grade is below 70%. Reach out to your
                                    teacher immediately and follow any
                                    intervention tasks assigned.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Contact & Resources */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Contact & Resources
                                </h2>
                                <p className="text-gray-500">
                                    Get help when you need it
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <ContactCard
                                icon={
                                    <svg
                                        className="w-8 h-8 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                }
                                title="Email Support"
                                subtitle="support@satis.edu"
                                action={() =>
                                    (window.location.href =
                                        "mailto:support@satis.edu")
                                }
                                actionText="Send Email →"
                                gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                            />
                            <ContactCard
                                icon={
                                    <svg
                                        className="w-8 h-8 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                    </svg>
                                }
                                title="Call Us"
                                subtitle="(123) 456-789"
                                action={() =>
                                    (window.location.href = "tel:123456789")
                                }
                                actionText="Call Now →"
                                gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
                            />
                            <ContactCard
                                icon={
                                    <svg
                                        className="w-8 h-8 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                }
                                title="Send Message"
                                subtitle="Contact Administration"
                                action={() => {}}
                                actionText="Open Chat →"
                                gradient="bg-gradient-to-br from-purple-400 to-pink-500"
                            />
                        </div>
                    </section>

                    {/* Still Need Help Banner */}
                    <section className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <svg
                                className="w-full h-full"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                            >
                                <defs>
                                    <pattern
                                        id="dots"
                                        width="10"
                                        height="10"
                                        patternUnits="userSpaceOnUse"
                                    >
                                        <circle
                                            cx="1"
                                            cy="1"
                                            r="1"
                                            fill="white"
                                        />
                                    </pattern>
                                </defs>
                                <rect
                                    width="100"
                                    height="100"
                                    fill="url(#dots)"
                                />
                            </svg>
                        </div>

                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Still Need Help?
                            </h2>
                            <p className="text-indigo-100 mb-6 max-w-md mx-auto">
                                Our support team is ready to assist you with any
                                questions or concerns about your academic
                                journey.
                            </p>
                            <button className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
                                Contact Support Team
                            </button>
                        </div>

                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-pink-400/20 rounded-full blur-xl" />
                    </section>
                </div>
            </div>

            {/* Tutorial Modal */}
            {activeTutorial && (
                <TutorialModal
                    visible={tutorialVisible}
                    onClose={handleTutorialClose}
                    steps={activeTutorial.steps}
                    title={activeTutorial.title}
                    accentColor={activeTutorial.color}
                />
            )}
        </AuthenticatedLayout>
    );
};

export default LearnMore;

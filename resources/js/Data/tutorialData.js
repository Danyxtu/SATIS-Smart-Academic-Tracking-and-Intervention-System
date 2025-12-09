import {
    Home,
    BarChart3,
    ClipboardList,
    MessageCircle,
    AlertTriangle,
    Bell,
    GraduationCap,
    TrendingUp,
    TrendingDown,
    BookOpen,
    Calendar,
    Clock,
    Target,
    Award,
    Users,
    FileText,
    CheckCircle,
    XCircle,
    Mail,
    Phone,
    PieChart,
    Activity,
    Zap,
    Star,
    Info,
} from "lucide-react";

/**
 * Tutorial Data Configuration
 *
 * Contains all tutorial steps for each section of the app.
 * Each tutorial has:
 * - id: unique identifier
 * - title: display title
 * - description: card description
 * - icon: Lucide icon component
 * - color: accent color
 * - steps: array of step objects
 */

export const tutorialData = {
    dashboard: {
        id: "dashboard",
        title: "Dashboard",
        description:
            "Learn about your personalized dashboard and quick stats overview",
        icon: Home,
        color: "#DB2777",
        steps: [
            {
                title: "Welcome Section",
                description:
                    "The welcome section greets you with a personalized message based on the time of day. It shows your name and gives you a quick summary of your academic status.",
                icon: Home,
                highlightArea: "Top of Dashboard",
                tip: "Check this section every morning to start your day with an overview of your progress!",
            },
            {
                title: "Key Statistics",
                description:
                    "View your most important metrics at a glance: Overall Grade, Attendance Rate, and Subjects at Risk. These cards give you instant insight into your academic performance.",
                icon: BarChart3,
                highlightArea: "Stats Grid Section",
                tip: "Tap on any stat card to dive deeper into that specific area.",
            },
            {
                title: "Quick Actions",
                description:
                    "Access frequently used features quickly. View your attendance, check performance analytics, or access intervention resources with just one tap.",
                icon: Zap,
                highlightArea: "Quick Actions Section",
            },
            {
                title: "Subjects Overview",
                description:
                    "See all your enrolled subjects with their current grades. Each subject card shows your progress and any alerts for subjects needing attention.",
                icon: BookOpen,
                highlightArea: "Subjects Section",
                tip: "Subjects highlighted in red need immediate attention.",
            },
            {
                title: "Performance Chart",
                description:
                    "The mini chart shows your grade trend over time. An upward trend means you're improving, while a downward trend suggests areas needing focus.",
                icon: TrendingUp,
                highlightArea: "Chart Section",
            },
            {
                title: "Notifications",
                description:
                    "Stay updated with important announcements, grade changes, and intervention alerts. Unread notifications are highlighted for easy identification.",
                icon: Bell,
                highlightArea: "Notifications Section",
                tip: "Click 'Mark all as read' to clear your notification list.",
            },
            {
                title: "Navigation Menu",
                description:
                    "Access the sidebar menu to navigate to any section of the app. You can find all features organized in the left sidebar.",
                icon: Home,
                highlightArea: "Left Sidebar",
            },
        ],
    },

    performance: {
        id: "performance",
        title: "Performance Analytics",
        description:
            "Understand your grades, trends, and academic progress in detail",
        icon: BarChart3,
        color: "#2563EB",
        steps: [
            {
                title: "Overall Performance",
                description:
                    "View your cumulative grade across all subjects. This percentage represents your overall academic standing and is updated in real-time.",
                icon: GraduationCap,
                highlightArea: "Performance Header",
                tip: "Aim to keep your overall grade above 85% for excellent standing.",
            },
            {
                title: "Grade Trend Chart",
                description:
                    "The line chart shows how your grades have changed over time. Each point represents a grading period. Look for upward trends!",
                icon: TrendingUp,
                highlightArea: "Main Chart Area",
            },
            {
                title: "Subject Breakdown",
                description:
                    "See individual grades for each subject. Subjects are color-coded: green for good standing, yellow for warning, and red for at-risk.",
                icon: PieChart,
                highlightArea: "Subject Cards",
                tip: "Focus on subjects in yellow before they turn red.",
            },
            {
                title: "Grade Distribution",
                description:
                    "The pie chart shows the distribution of your grades. Understand what percentage of your subjects fall into each grade category.",
                icon: Activity,
                highlightArea: "Distribution Chart",
            },
            {
                title: "Improvement Areas",
                description:
                    "Based on your performance data, we highlight subjects where you can improve. These recommendations are personalized to your learning patterns.",
                icon: Target,
                highlightArea: "Recommendations Section",
            },
        ],
    },

    intervention: {
        id: "intervention",
        title: "Interventions",
        description:
            "Learn how to use intervention resources and get academic support",
        icon: MessageCircle,
        color: "#059669",
        steps: [
            {
                title: "Active Interventions",
                description:
                    "View all your current intervention cases. Each intervention shows the subject, priority level (High/Medium/Low), and current status.",
                icon: AlertTriangle,
                highlightArea: "Interventions List",
                tip: "High priority interventions should be addressed within the week.",
            },
            {
                title: "Intervention Details",
                description:
                    "Click on any intervention card to see full details including: action plan, teacher feedback, grade comparison, and recommended resources.",
                icon: FileText,
                highlightArea: "Intervention Card",
            },
            {
                title: "Teacher Communication",
                description:
                    "Easily contact your teacher through email or phone directly from the intervention page. Quick communication helps resolve issues faster.",
                icon: Mail,
                highlightArea: "Contact Section",
                tip: "Reach out to teachers during their office hours for best response times.",
            },
            {
                title: "Action Plans",
                description:
                    "Each intervention includes a step-by-step action plan. Follow these recommendations to improve your performance in that subject.",
                icon: CheckCircle,
                highlightArea: "Action Plan Section",
            },
            {
                title: "Progress Tracking",
                description:
                    "The grade evolution chart shows your progress since the intervention started. See how your efforts are paying off!",
                icon: TrendingUp,
                highlightArea: "Progress Chart",
            },
            {
                title: "Your Feedback",
                description:
                    "Share your own feedback with teachers. Let them know about challenges you're facing or additional help you need.",
                icon: MessageCircle,
                highlightArea: "Feedback Input",
            },
        ],
    },

    feedback: {
        id: "feedback",
        title: "Feedback System",
        description: "Learn how to give and receive feedback from teachers",
        icon: Star,
        color: "#F59E0B",
        steps: [
            {
                title: "Receiving Feedback",
                description:
                    "Teachers can provide feedback on your assignments, participation, and overall progress. Check your notifications regularly for new feedback.",
                icon: Bell,
                highlightArea: "Notifications",
                tip: "Feedback is your roadmap to improvement - read it carefully!",
            },
            {
                title: "Understanding Ratings",
                description:
                    "Feedback may include ratings on effort, participation, and improvement. These help you understand not just your grades, but your learning habits.",
                icon: Star,
                highlightArea: "Ratings Section",
            },
            {
                title: "Responding to Feedback",
                description:
                    "You can respond to teacher feedback with questions or clarifications. This creates a dialogue that supports your learning journey.",
                icon: MessageCircle,
                highlightArea: "Response Input",
            },
            {
                title: "Feedback History",
                description:
                    "View all past feedback in one place. Track how teacher comments have changed over time as you improve.",
                icon: Clock,
                highlightArea: "History Section",
            },
        ],
    },

    subjectsAtRisk: {
        id: "subjectsAtRisk",
        title: "Subjects at Risk",
        description:
            "Identify and manage subjects that need immediate attention",
        icon: AlertTriangle,
        color: "#DC2626",
        steps: [
            {
                title: "Risk Overview",
                description:
                    "This page shows all subjects where your grade is below the passing threshold or declining rapidly. Early intervention is key to success!",
                icon: AlertTriangle,
                highlightArea: "Risk Summary",
                tip: "Check this page weekly to catch issues early.",
            },
            {
                title: "Risk Levels",
                description:
                    "Subjects are categorized by risk level: Critical (needs immediate action), Warning (trending down), and Watch (borderline). Prioritize accordingly.",
                icon: Activity,
                highlightArea: "Risk Categories",
            },
            {
                title: "Subject Details",
                description:
                    "Click on any at-risk subject to see detailed information including: current grade, grade trend, missing assignments, and intervention options.",
                icon: BookOpen,
                highlightArea: "Subject Cards",
            },
            {
                title: "Missing Assignments",
                description:
                    "View all missing or incomplete assignments for each subject. Completing these can quickly improve your grade.",
                icon: XCircle,
                highlightArea: "Missing Work Section",
                tip: "Submitting late work is usually better than not submitting at all!",
            },
            {
                title: "Request Intervention",
                description:
                    "If you need additional help, you can request an intervention directly from this page. Teachers will be notified of your need for support.",
                icon: Users,
                highlightArea: "Request Button",
            },
        ],
    },

    attendance: {
        id: "attendance",
        title: "Attendance",
        description:
            "Track your attendance records and understand its impact on your grades",
        icon: ClipboardList,
        color: "#7C3AED",
        steps: [
            {
                title: "Attendance Overview",
                description:
                    "View your overall attendance rate at the top of the page. This percentage reflects your presence across all subjects throughout the term.",
                icon: ClipboardList,
                highlightArea: "Attendance Header",
                tip: "Aim for 90%+ attendance for best academic results.",
            },
            {
                title: "Monthly Calendar",
                description:
                    "The calendar shows your attendance for the current month. Green dots indicate present days, red for absences, and yellow for tardiness.",
                icon: Calendar,
                highlightArea: "Calendar View",
            },
            {
                title: "Subject Breakdown",
                description:
                    "See attendance statistics for each subject individually. Some subjects may have different attendance requirements.",
                icon: BookOpen,
                highlightArea: "Subject Attendance Cards",
            },
            {
                title: "Attendance History",
                description:
                    "Scroll down to view your complete attendance history. Filter by subject or date range to find specific records.",
                icon: Clock,
                highlightArea: "History Section",
            },
            {
                title: "Absence Details",
                description:
                    "Click on any absence to see details including: date, subject, reason (if provided), and whether it was excused or unexcused.",
                icon: Info,
                highlightArea: "Absence Records",
                tip: "Always provide documentation for excused absences.",
            },
            {
                title: "Impact on Grades",
                description:
                    "Poor attendance directly affects your grades. This section shows how your absences have impacted your academic performance.",
                icon: TrendingDown,
                highlightArea: "Impact Analysis",
            },
        ],
    },
};

/**
 * Get tutorial by ID
 * @param {string} id - Tutorial ID
 * @returns {object|null} Tutorial data or null
 */
export const getTutorialById = (id) => {
    return tutorialData[id] || null;
};

/**
 * Get all tutorials as an array
 * @returns {array} Array of all tutorials
 */
export const getAllTutorials = () => {
    return Object.values(tutorialData);
};

/**
 * Get tutorial cards data for Learn More page
 * @returns {array} Array of card data
 */
export const getTutorialCards = () => {
    return getAllTutorials().map((tutorial) => ({
        id: tutorial.id,
        title: tutorial.title,
        description: tutorial.description,
        icon: tutorial.icon,
        color: tutorial.color,
        stepCount: tutorial.steps.length,
    }));
};

export default tutorialData;

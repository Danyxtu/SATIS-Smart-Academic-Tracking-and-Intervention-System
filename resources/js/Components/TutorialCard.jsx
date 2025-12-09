import React from "react";
import { ChevronRight } from "lucide-react";

/**
 * TutorialCard - A reusable card component for the Learn More page
 *
 * Props:
 * - title: string - Card title
 * - description: string - Card description
 * - icon: Component - Lucide icon component
 * - color: string - Accent color for the card
 * - stepCount: number - Number of tutorial steps
 * - onPress: function - Called when card is pressed
 */
const TutorialCard = ({
    title,
    description,
    icon: IconComponent,
    color = "#DB2777",
    stepCount = 0,
    onPress,
}) => {
    return (
        <button
            onClick={onPress}
            className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 group text-left"
        >
            {/* Icon */}
            <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${color}15` }}
            >
                {IconComponent && (
                    <IconComponent
                        size={28}
                        style={{ color }}
                        strokeWidth={1.5}
                    />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                    {description}
                </p>
                {stepCount > 0 && (
                    <span
                        className="inline-block mt-2 text-xs font-semibold"
                        style={{ color }}
                    >
                        {stepCount} {stepCount === 1 ? "step" : "steps"}
                    </span>
                )}
            </div>

            {/* Arrow */}
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:translate-x-1"
                style={{ backgroundColor: `${color}10` }}
            >
                <ChevronRight size={20} style={{ color }} strokeWidth={2} />
            </div>
        </button>
    );
};

export default TutorialCard;

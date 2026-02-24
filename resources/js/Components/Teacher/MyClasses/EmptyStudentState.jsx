import React from "react";
import { SearchX, Users, UserPlus } from "lucide-react";

const EmptyStudentState = ({ hasSearchTerm, searchTerm, onAddStudent }) => {
    if (hasSearchTerm) {
        // No search results
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <SearchX size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No students found
                </h3>
                <p className="text-gray-500 text-center max-w-md mb-2">
                    No students match your search for "{searchTerm}".
                </p>
                <p className="text-gray-400 text-sm">
                    Try adjusting your search term or check the spelling.
                </p>
            </div>
        );
    }

    // No students enrolled yet
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-full flex items-center justify-center">
                    <Users size={44} className="text-indigo-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <UserPlus size={20} className="text-white" />
                </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No students enrolled yet
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
                This class doesn't have any students at the moment. Add students
                to start tracking grades and attendance.
            </p>
            <button
                onClick={onAddStudent}
                className="flex items-center gap-2 bg-indigo-600 text-white font-medium py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
            >
                <UserPlus size={20} />
                Add Your First Student
            </button>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span>Import from CSV</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span>Add manually</span>
                </div>
            </div>
        </div>
    );
};

export default EmptyStudentState;

import React from "react";
import { Mail, Phone, MapPin, MoreVertical } from "lucide-react";

const ClassList = ({
    filteredStudents,
    setSelectedStudentForStatus,
    setIsStudentStatusModalOpen,
    buildStudentKey,
}) => {
    const handleStudentClick = (student) => {
        setSelectedStudentForStatus(student);
        setIsStudentStatusModalOpen(true);
    };

    return (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Student Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            LRN
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Grade Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Contact
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student, index) => (
                        <tr
                            key={buildStudentKey(student, index)}
                            className="hover:bg-gray-50 transition-colors"
                        >
                            {/* Student Name */}
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-indigo-700 font-semibold text-sm">
                                            {student.name
                                                ?.split(" ")
                                                .map((n) => n[0])
                                                .slice(0, 2)
                                                .join("")
                                                .toUpperCase() || "??"}
                                        </span>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {student.name || "N/A"}
                                        </div>
                                        {student.email && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Mail size={12} />
                                                {student.email}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>

                            {/* LRN */}
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 font-mono">
                                    {student.lrn || "—"}
                                </div>
                            </td>

                            {/* Grade Level */}
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                    {student.grade_level || "—"}
                                </div>
                                {(student.strand || student.track) && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {[student.strand, student.track]
                                            .filter(Boolean)
                                            .join(" • ")}
                                    </div>
                                )}
                            </td>

                            {/* Contact */}
                            <td className="px-6 py-4">
                                <div className="space-y-1">
                                    {student.phone_number && (
                                        <div className="text-xs text-gray-600 flex items-center gap-1">
                                            <Phone size={12} />
                                            {student.phone_number}
                                        </div>
                                    )}
                                    {student.address && (
                                        <div className="text-xs text-gray-600 flex items-center gap-1">
                                            <MapPin size={12} />
                                            <span className="truncate max-w-[200px]">
                                                {student.address}
                                            </span>
                                        </div>
                                    )}
                                    {!student.phone_number &&
                                        !student.address && (
                                            <span className="text-xs text-gray-400">
                                                —
                                            </span>
                                        )}
                                </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => handleStudentClick(student)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                >
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ClassList;

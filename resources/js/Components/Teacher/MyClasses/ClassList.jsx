import React from "react";

const ClassList = (props) => {
    const {
        filteredStudents,
        setSelectedStudentForStatus,
        setIsStudentStatusModalOpen,
        buildStudentKey,
    } = props;

    return (
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        LRN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => {
                    const studentKey = buildStudentKey(student, index);

                    return (
                        <tr
                            key={studentKey}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                                setSelectedStudentForStatus(student);
                                setIsStudentStatusModalOpen(true);
                            }}
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {student.name}
                                </div>
                                {/* {formatAcademicMeta(
                                                    student,
                                                ) && (
                                                    <div className="text-xs text-gray-500">
                                                        {formatAcademicMeta(
                                                            student,
                                                        )}
                                                    </div>
                                                )} */}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.lrn}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.email}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default ClassList;

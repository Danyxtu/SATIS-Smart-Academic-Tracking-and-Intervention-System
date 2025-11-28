const StudentListItem = ({ student, onClick }) => (
    <li className="p-4 flex flex-col sm:flex-row items-center justify-between">
        {/* Student Info */}
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <img
                src={student.avatar}
                alt={student.name}
                className="w-12 h-12 rounded-full"
            />
            <div>
                <p className="text-lg font-semibold text-gray-900">
                    {student.name}
                </p>
                <p
                    className={`text-sm font-medium ${
                        student.status === "present"
                            ? "text-green-600"
                            : student.status === "absent"
                            ? "text-red-600"
                            : "text-yellow-600"
                    }`}
                >
                    Status: <span className="uppercase">{student.status}</span>
                </p>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
            <StatusButton
                label="Present"
                icon={<Check size={16} />}
                isActive={student.status === "present"}
                onClick={() => onClick(student.id, "present")}
                className="bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-600 active:text-white"
                activeClassName="bg-green-600 text-white"
            />
            <StatusButton
                label="Absent"
                icon={<XIcon size={16} />}
                isActive={student.status === "absent"}
                onClick={() => onClick(student.id, "absent")}
                className="bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-600 active:text-white"
                activeClassName="bg-red-600 text-white"
            />
            <StatusButton
                label="Late"
                icon={<Clock size={16} />}
                isActive={student.status === "late"}
                onClick={() => onClick(student.id, "late")}
                className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 active:bg-yellow-600 active:text-white"
                activeClassName="bg-yellow-600 text-white"
            />
        </div>
    </li>
);

export default StudentListItem;

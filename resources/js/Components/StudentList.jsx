import StudentListItem from "./StudentListItem";

const StudentList = ({ students, onClick }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
            {students
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((student) => (
                    <StudentListItem
                        key={student.id}
                        student={student}
                        onClick={onClick}
                    />
                ))}
        </ul>
    </div>
);

export default StudentList;

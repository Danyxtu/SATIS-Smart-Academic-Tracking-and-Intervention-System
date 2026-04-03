import { useEffect, useMemo, useState } from "react";
import StudentListItem from "./StudentListItem";

const StudentList = ({ students, onClick }) => {
    const sortedStudents = useMemo(
        () => [...students].sort((a, b) => a.name.localeCompare(b.name)),
        [students],
    );

    const [animateRows, setAnimateRows] = useState(false);

    const rowSignature = useMemo(
        () => sortedStudents.map((student) => student.id).join(","),
        [sortedStudents],
    );

    useEffect(() => {
        setAnimateRows(false);
        const frame = requestAnimationFrame(() => setAnimateRows(true));

        return () => cancelAnimationFrame(frame);
    }, [rowSignature]);

    const totals = sortedStudents.reduce(
        (acc, student) => {
            if (student.status === "present") {
                acc.present += 1;
            } else if (student.status === "absent") {
                acc.absent += 1;
            } else if (student.status === "late") {
                acc.late += 1;
            }

            return acc;
        },
        { present: 0, absent: 0, late: 0 },
    );

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-gray-100">
                            Student Status List
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">
                            Tap a status button to update attendance quickly.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Present {totals.present}
                        </span>
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                            Absent {totals.absent}
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            Late {totals.late}
                        </span>
                    </div>
                </div>
            </div>

            {sortedStudents.length === 0 ? (
                <div className="px-6 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                        No students found for this class.
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                        Enroll students first to use list attendance mode.
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-gray-700">
                    {sortedStudents.map((student, index) => (
                        <StudentListItem
                            key={student.id}
                            student={student}
                            onClick={onClick}
                            index={index}
                            animateIn={animateRows}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
};

export default StudentList;

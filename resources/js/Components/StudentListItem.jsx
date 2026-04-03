import { Check, X as XIcon, Clock } from "lucide-react";
import StatusButton from "./StatusButton";

const StudentListItem = ({ student, onClick, index = 0, animateIn = true }) => {
    const statusPillClasses =
        student.status === "present"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            : student.status === "absent"
              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";

    const transitionDelay = `${Math.min(index * 35, 280)}ms`;

    return (
        <li
            style={{ transitionDelay }}
            className={`px-4 py-3 transition-all duration-300 ease-out motion-reduce:transition-none ${
                animateIn
                    ? "translate-y-0 opacity-100"
                    : "translate-y-1 opacity-0"
            } hover:bg-slate-50/70 dark:hover:bg-gray-700/30`}
        >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <img
                        src={student.avatar}
                        alt={student.name}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-200 dark:ring-gray-600"
                    />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-gray-100">
                            {student.name}
                        </p>
                        <span
                            className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusPillClasses}`}
                        >
                            {student.status}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    <StatusButton
                        label="Present"
                        icon={<Check size={14} />}
                        isActive={student.status === "present"}
                        onClick={() => onClick(student.id, "present")}
                        className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/35"
                        activeClassName="border border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    />
                    <StatusButton
                        label="Absent"
                        icon={<XIcon size={14} />}
                        isActive={student.status === "absent"}
                        onClick={() => onClick(student.id, "absent")}
                        className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/35"
                        activeClassName="border border-rose-600 bg-rose-600 text-white shadow-sm"
                    />
                    <StatusButton
                        label="Late"
                        icon={<Clock size={14} />}
                        isActive={student.status === "late"}
                        onClick={() => onClick(student.id, "late")}
                        className="border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/35"
                        activeClassName="border border-amber-500 bg-amber-500 text-white shadow-sm"
                    />
                </div>
            </div>
        </li>
    );
};

export default StudentListItem;

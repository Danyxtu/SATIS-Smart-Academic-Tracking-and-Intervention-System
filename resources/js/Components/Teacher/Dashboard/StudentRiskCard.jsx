import { useMemo } from "react";
import { TrendingDown, CheckCircle2 } from "lucide-react";
import { useForm } from "@inertiajs/react";

const StudentRiskCard = ({ student }) => {
    const fullName = useMemo(() => {
        return student?.student_name ?? student?.name ?? "";
    }, [student?.student_name, student?.name]);

    const hasEnrollment = Boolean(student?.enrollment_id);
    const hasActiveIntervention = Boolean(student?.intervention);
    const gradeDisplay =
        typeof student?.grade === "number" && !Number.isNaN(student.grade)
            ? `${student.grade}%`
            : "N/A";

    const { post, processing } = useForm({
        enrollment_id: student?.enrollment_id ?? "",
        type: student?.intervention?.type ?? "parent_contact",
        notes: student?.intervention?.notes ?? "",
    });

    const handleStartIntervention = () => {
        if (!hasEnrollment || processing) {
            return;
        }

        post(route("teacher.interventions.store"), {
            preserveScroll: true,
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between transition-all hover:shadow-md">
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <img
                        src={
                            student?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                fullName,
                            )}`
                        }
                        alt={fullName || "Student avatar"}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    {hasActiveIntervention && (
                        <span className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full p-0.5">
                            <CheckCircle2 size={14} />
                        </span>
                    )}
                </div>
                <div>
                    <p className="font-semibold text-gray-800">
                        {fullName || "Unnamed Student"}
                    </p>
                    <p className="text-sm text-gray-500">
                        {student?.subject || "Subject TBD"}
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="font-bold text-red-600 text-lg">
                        {gradeDisplay}
                    </p>
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <TrendingDown size={14} />{" "}
                        {student?.trend || "Declining"}
                    </p>
                </div>
                <button
                    type="button"
                    disabled={!hasEnrollment || processing}
                    onClick={handleStartIntervention}
                    className={`bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        processing ? "animate-pulse" : "hover:bg-indigo-700"
                    }`}
                >
                    {processing
                        ? "Starting..."
                        : hasActiveIntervention
                          ? "Update Intervention"
                          : "Start Intervention"}
                </button>
            </div>
        </div>
    );
};

export default StudentRiskCard;

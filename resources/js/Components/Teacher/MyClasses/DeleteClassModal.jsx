import { AlertTriangle, Lock, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "@inertiajs/react";

const DeleteClassModal = ({ isOpen, classData, onClose, onDeleted }) => {
    const {
        data,
        setData,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({
        password: "",
    });

    useEffect(() => {
        if (!isOpen) {
            reset();
        }
    }, [isOpen]);

    if (!isOpen || !classData) {
        return null;
    }

    const classLabel = [classData?.name, classData?.section]
        .filter(Boolean)
        .join(" ");
    const subjectLabel = classData?.subject_name || classData?.subject || "N/A";

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        destroy(route("teacher.classes.destroy", classData.id), {
            preserveScroll: true,
            data,
            onSuccess: () => {
                reset();
                onDeleted?.(classData);
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-red-100 bg-red-50 px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-red-100 p-2 text-red-600">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-red-900">
                                Confirm Class Deletion
                            </h3>
                            <p className="mt-1 text-xs text-red-700">
                                This action is irreversible and will remove
                                class records.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="z-10 rounded-md p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                        <p className="text-sm font-semibold text-gray-900">
                            {classLabel || "Class"}
                        </p>
                        <p className="text-xs text-gray-600">{subjectLabel}</p>
                    </div>

                    <p className="text-xs text-gray-600">
                        Enter your account password to confirm deletion.
                    </p>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative">
                            <Lock
                                size={14}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                            />
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            disabled={processing}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            disabled={processing || !data.password}
                        >
                            <Trash2 size={14} />
                            {processing ? "Deleting..." : "Delete Class"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteClassModal;

import { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { X } from "lucide-react";

const AddStudentModal = ({ subjectId, subjectLabel, onClose }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: "",
        last_name: "",
        middle_name: "",
        lrn: "",
        email: "",
    });

    useEffect(() => {
        if (!data.first_name || !data.last_name) {
            setData("email", "");
            return;
        }

        const fullName = `${data.first_name} ${data.last_name}`;
        setData("email", generateEmail(fullName));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.first_name, data.last_name]);

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!subjectId) return;

        post(route("teacher.classes.students.store", subjectId), {
            onSuccess: () => {
                handleClose();
            },
        });
    };

    const canSubmit = Boolean(
        subjectId && data.first_name && data.last_name && data.lrn,
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center p-6 border-b">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                Add Student
                            </h3>
                            {subjectLabel && (
                                <p className="text-sm text-gray-500">
                                    {subjectLabel}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                First Name *
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                required
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                value={data.first_name}
                                onChange={(e) =>
                                    setData("first_name", e.target.value)
                                }
                                placeholder="e.g., Juan"
                            />
                            {errors.first_name && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.first_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                required
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                value={data.last_name}
                                onChange={(e) =>
                                    setData("last_name", e.target.value)
                                }
                                placeholder="e.g., Dela Cruz"
                            />
                            {errors.last_name && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.last_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Middle Name{" "}
                                <span className="text-xs text-gray-400">
                                    (Optional)
                                </span>
                            </label>
                            <input
                                type="text"
                                name="middle_name"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                value={data.middle_name}
                                onChange={(e) =>
                                    setData("middle_name", e.target.value)
                                }
                                placeholder="e.g., Miguel"
                            />
                            {errors.middle_name && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.middle_name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                LRN (Learner Reference Number)
                            </label>
                            <input
                                type="text"
                                name="lrn"
                                required
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                value={data.lrn}
                                onChange={(e) => setData("lrn", e.target.value)}
                                placeholder="e.g., 123456789012"
                            />
                            {errors.lrn && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.lrn}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email (auto-generated)
                            </label>
                            <input
                                type="email"
                                name="email"
                                readOnly
                                className="mt-1 block w-full border-gray-300 bg-gray-50 rounded-md shadow-sm"
                                value={data.email}
                                placeholder="Auto-generated"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end p-6 border-t bg-gray-50">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="ml-3 bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            disabled={!canSubmit || processing}
                        >
                            {processing ? "Adding…" : "Add Student"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const generateEmail = (name) => {
    const cleaned =
        name
            .toLowerCase()
            .replace(/[^a-z\s]/g, "")
            .trim()
            .split(" ")
            .map((segment) => segment.charAt(0))
            .join("") || "student";

    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;

    return `${cleaned}${year}${random}@bshs.edu.ph`;
};

export default AddStudentModal;

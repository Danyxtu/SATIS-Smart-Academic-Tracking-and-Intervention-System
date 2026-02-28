import React, { useState } from "react";
import { X } from "lucide-react";

const AddGradeTaskModal = ({
    category,
    onSave,
    onClose,
    isSubmitting = false,
}) => {
    const [label, setLabel] = useState("");
    const [total, setTotal] = useState(100);

    if (!category) return null;

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!label.trim()) {
            return;
        }

        onSave({
            label: label.trim(),
            total: Number(total) || 0,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Add Activity to</p>
                        <h3 className="text-xl font-bold text-gray-900">
                            {category.label} (
                            {Math.round((category.weight ?? 0) * 100)}%)
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Activity Name
                        </label>
                        <input
                            type="text"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            placeholder="e.g., Quiz 1, Assignment 2"
                            value={label}
                            onChange={(event) => setLabel(event.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Total Points
                        </label>
                        <input
                            type="number"
                            min="1"
                            step="0.5"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            value={total}
                            onChange={(event) => setTotal(event.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Adding…" : "Add Activity"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGradeTaskModal;

import { useState, useEffect, useMemo } from "react";
import { router } from "@inertiajs/react";
import { X, Plus, Trash2, AlertCircle, Check, Settings2 } from "lucide-react";
import showToast from "@/Utils/toast";

const EditGradeCategoriesModal = ({
    isOpen,
    onClose,
    subjectId,
    categories = [],
    quarter = 1,
    onSuccess,
}) => {
    const [localCategories, setLocalCategories] = useState([]);

    // Initialize local state when modal opens
    useEffect(() => {
        if (isOpen && categories.length > 0) {
            setLocalCategories(
                categories.map((cat) => ({
                    ...cat,
                    weight: Math.round((cat.weight || 0) * 100), // Convert to percentage
                })),
            );
        }
    }, [isOpen, categories]);

    // Calculate total percentage
    const totalPercentage = useMemo(() => {
        return localCategories.reduce(
            (sum, cat) => sum + (parseFloat(cat.weight) || 0),
            0,
        );
    }, [localCategories]);

    const isValidTotal = Math.abs(totalPercentage - 100) < 0.01;

    // Handle weight change
    const handleWeightChange = (index, value) => {
        if (value === "") {
            setLocalCategories((prev) => {
                const updated = [...prev];
                updated[index] = { ...updated[index], weight: "" };
                return updated;
            });
            return;
        }

        const numValue = Number(value);
        if (Number.isNaN(numValue)) return;

        const clampedValue = Math.max(0, Math.min(100, numValue));
        setLocalCategories((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], weight: clampedValue };
            return updated;
        });
    };

    const handleWeightFocus = (index) => {
        setLocalCategories((prev) => {
            const updated = [...prev];
            const currentWeight = parseFloat(updated[index].weight);

            if (!Number.isNaN(currentWeight) && currentWeight === 0) {
                updated[index] = { ...updated[index], weight: "" };
            }

            return updated;
        });
    };

    const handleWeightBlur = (index) => {
        setLocalCategories((prev) => {
            const updated = [...prev];
            const currentWeight = updated[index].weight;

            if (
                currentWeight === "" ||
                currentWeight === null ||
                currentWeight === undefined
            ) {
                updated[index] = { ...updated[index], weight: 0 };
                return updated;
            }

            const numericWeight = Number(currentWeight);
            if (Number.isNaN(numericWeight)) {
                updated[index] = { ...updated[index], weight: 0 };
                return updated;
            }

            updated[index] = {
                ...updated[index],
                weight: Math.max(0, Math.min(100, numericWeight)),
            };

            return updated;
        });
    };

    const adjustWeight = (index, delta) => {
        setLocalCategories((prev) => {
            const updated = [...prev];
            const currentWeight = parseFloat(updated[index].weight);
            const safeCurrentWeight = Number.isNaN(currentWeight)
                ? 0
                : currentWeight;
            const nextWeight = Math.max(
                0,
                Math.min(100, safeCurrentWeight + delta),
            );

            updated[index] = { ...updated[index], weight: nextWeight };
            return updated;
        });
    };

    // Handle label change
    const handleLabelChange = (index, value) => {
        setLocalCategories((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], label: value };
            return updated;
        });
    };

    // Add new category
    const addCategory = () => {
        const newId = `custom_${Date.now()}`;
        setLocalCategories((prev) => [
            ...prev,
            {
                id: newId,
                label: "New Category",
                weight: 0,
                tasks: [],
            },
        ]);
    };

    // Remove category (only custom ones without tasks)
    const removeCategory = (index) => {
        const category = localCategories[index];
        if (category.tasks && category.tasks.length > 0) {
            showToast.error(
                "Cannot remove category with existing tasks. Remove tasks first.",
            );
            return;
        }
        setLocalCategories((prev) => prev.filter((_, i) => i !== index));
    };

    // Check if category can be removed
    const canRemoveCategory = (category) => {
        // Can't remove if it has tasks
        if (category.tasks && category.tasks.length > 0) return false;
        // Must have at least 1 category
        if (localCategories.length <= 1) return false;
        return true;
    };

    // Auto-distribute weights evenly
    const distributeEvenly = () => {
        const count = localCategories.length;
        if (count === 0) return;

        const evenWeight = Math.floor(100 / count);
        const remainder = 100 - evenWeight * count;

        setLocalCategories((prev) =>
            prev.map((cat, index) => ({
                ...cat,
                weight: evenWeight + (index === 0 ? remainder : 0),
            })),
        );
    };

    // Submit changes
    const [processing, setProcessing] = useState(false);

    const handleSubmit = () => {
        if (!isValidTotal) {
            showToast.error("Total percentage must equal 100%");
            return;
        }

        // Validate labels
        const hasEmptyLabels = localCategories.some(
            (cat) => !cat.label || cat.label.trim() === "",
        );
        if (hasEmptyLabels) {
            showToast.error("All categories must have a label");
            return;
        }

        // Convert back to decimal weights
        const categoriesPayload = localCategories.map((cat) => ({
            id: cat.id,
            label: cat.label.trim(),
            weight: (parseFloat(cat.weight) || 0) / 100,
            tasks: cat.tasks || [],
        }));

        setProcessing(true);
        router.post(
            route("teacher.classes.grade-structure.update", {
                // Ziggy route expects the parameter name `subjectTeacher` (see routes/teacher.php)
                subjectTeacher: subjectId,
            }),
            { categories: categoriesPayload, quarter },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: () => {
                    showToast.success("Grade categories updated successfully!");
                    onSuccess?.({
                        categories: categoriesPayload,
                        quarter,
                    });
                    onClose();
                    setProcessing(false);
                },
                onError: (errors) => {
                    showToast.error(
                        errors.message ||
                            "Failed to update grade categories. Please try again.",
                    );
                    setProcessing(false);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600">
                    <div className="flex items-center gap-2.5 text-white">
                        <Settings2 size={20} />
                        <div>
                            <h3 className="text-lg font-bold leading-tight">
                                Edit Grade Categories
                            </h3>
                            <p className="text-xs text-white/80">
                                Customize weights and add new categories
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="z-10 text-white/80 hover:text-white transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 overflow-y-auto flex-1">
                    {/* Total Indicator */}
                    <div
                        className={`mb-4 p-3 rounded-lg flex items-center justify-between gap-2 ${
                            isValidTotal
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                        }`}
                    >
                        <div className="flex items-center gap-1.5">
                            {isValidTotal ? (
                                <Check size={16} className="text-green-600" />
                            ) : (
                                <AlertCircle
                                    size={16}
                                    className="text-red-600"
                                />
                            )}
                            <span
                                className={`text-sm font-semibold ${
                                    isValidTotal
                                        ? "text-green-700"
                                        : "text-red-700"
                                }`}
                            >
                                Total: {totalPercentage.toFixed(0)}%
                            </span>
                            {!isValidTotal && (
                                <span className="text-xs text-red-600">
                                    (Must equal 100%)
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={distributeEvenly}
                            className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition"
                        >
                            Distribute Evenly
                        </button>
                    </div>

                    {/* Categories List */}
                    <div className="space-y-3">
                        {localCategories.map((category, index) => (
                            <div
                                key={category.id || index}
                                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                            >
                                <div className="flex items-end gap-3">
                                    {/* Category Label */}
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Category Name
                                        </label>
                                        <input
                                            type="text"
                                            value={category.label}
                                            onChange={(e) =>
                                                handleLabelChange(
                                                    index,
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Category name"
                                        />
                                    </div>

                                    {/* Weight Input */}
                                    <div className="w-40">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Weight (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="1"
                                                value={
                                                    category.weight === ""
                                                        ? ""
                                                        : category.weight
                                                }
                                                onFocus={() =>
                                                    handleWeightFocus(index)
                                                }
                                                onBlur={() =>
                                                    handleWeightBlur(index)
                                                }
                                                onChange={(e) =>
                                                    handleWeightChange(
                                                        index,
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                                            />
                                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        adjustWeight(index, -1)
                                                    }
                                                    className="h-6 w-6 rounded border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                                                    aria-label="Decrease weight"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        adjustWeight(index, 1)
                                                    }
                                                    className="h-6 w-6 rounded border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                                                    aria-label="Increase weight"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <div className="pb-0.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeCategory(index)
                                            }
                                            disabled={
                                                !canRemoveCategory(category)
                                            }
                                            className={`p-2 rounded-lg transition ${
                                                canRemoveCategory(category)
                                                    ? "text-red-600 hover:bg-red-100"
                                                    : "text-gray-300 cursor-not-allowed"
                                            }`}
                                            title={
                                                canRemoveCategory(category)
                                                    ? "Remove category"
                                                    : "Cannot remove (has tasks or last category)"
                                            }
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Task count info */}
                                {category.tasks &&
                                    category.tasks.length > 0 && (
                                        <div className="mt-1 text-xs text-gray-500">
                                            {category.tasks.length} task(s) in
                                            this category
                                        </div>
                                    )}
                            </div>
                        ))}
                    </div>

                    {/* Add Category Button */}
                    <button
                        type="button"
                        onClick={addCategory}
                        className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-2"
                    >
                        <Plus size={16} />
                        Add New Category
                    </button>

                    {/* Info Note */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-800 mb-1.5">
                            💡 Tips
                        </h4>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>
                                • Standard SHS grading: Written Works (30%),
                                Performance Tasks (40%), Quarterly Exam (30%)
                            </li>
                            <li>• All weights must add up to exactly 100%</li>
                            <li>
                                • Categories with tasks cannot be removed -
                                remove tasks first
                            </li>
                            <li>
                                • Use "Distribute Evenly" to auto-balance
                                weights
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isValidTotal || processing}
                        className={`px-4 py-1.5 text-sm rounded-lg font-semibold transition ${
                            isValidTotal && !processing
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        {processing ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditGradeCategoriesModal;

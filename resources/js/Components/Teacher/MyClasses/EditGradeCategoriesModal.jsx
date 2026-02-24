import { useState, useEffect, useMemo } from "react";
import { router } from "@inertiajs/react";
import { X, Plus, Trash2, AlertCircle, Check, Settings2 } from "lucide-react";
import showToast from "@/Utils/toast";

const EditGradeCategoriesModal = ({
    isOpen,
    onClose,
    subjectId,
    categories = [],
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
                }))
            );
        }
    }, [isOpen, categories]);

    // Calculate total percentage
    const totalPercentage = useMemo(() => {
        return localCategories.reduce(
            (sum, cat) => sum + (parseFloat(cat.weight) || 0),
            0
        );
    }, [localCategories]);

    const isValidTotal = Math.abs(totalPercentage - 100) < 0.01;

    // Handle weight change
    const handleWeightChange = (index, value) => {
        const numValue = parseFloat(value) || 0;
        setLocalCategories((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], weight: numValue };
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
                "Cannot remove category with existing tasks. Remove tasks first."
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
            }))
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
            (cat) => !cat.label || cat.label.trim() === ""
        );
        if (hasEmptyLabels) {
            showToast.error("All categories must have a label");
            return;
        }

        // Convert back to decimal weights
        const categoriesPayload = localCategories.map((cat) => ({
            id: cat.id,
            label: cat.label.trim(),
            weight: cat.weight / 100,
            tasks: cat.tasks || [],
        }));

        setProcessing(true);
        router.post(
            route("teacher.classes.grade-structure.update", {
                subject: subjectId,
            }),
            { categories: categoriesPayload },
            {
                preserveScroll: true,
                onSuccess: () => {
                    showToast.success("Grade categories updated successfully!");
                    onSuccess?.();
                    onClose();
                    setProcessing(false);
                },
                onError: (errors) => {
                    showToast.error(
                        errors.message ||
                            "Failed to update grade categories. Please try again."
                    );
                    setProcessing(false);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            }
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-indigo-500 to-purple-600">
                    <div className="flex items-center gap-3 text-white">
                        <Settings2 size={24} />
                        <div>
                            <h3 className="text-xl font-bold">
                                Edit Grade Categories
                            </h3>
                            <p className="text-sm text-white/80">
                                Customize weights and add new categories
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Total Indicator */}
                    <div
                        className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
                            isValidTotal
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {isValidTotal ? (
                                <Check size={20} className="text-green-600" />
                            ) : (
                                <AlertCircle
                                    size={20}
                                    className="text-red-600"
                                />
                            )}
                            <span
                                className={`font-semibold ${
                                    isValidTotal
                                        ? "text-green-700"
                                        : "text-red-700"
                                }`}
                            >
                                Total: {totalPercentage.toFixed(0)}%
                            </span>
                            {!isValidTotal && (
                                <span className="text-sm text-red-600">
                                    (Must equal 100%)
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={distributeEvenly}
                            className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                        >
                            Distribute Evenly
                        </button>
                    </div>

                    {/* Categories List */}
                    <div className="space-y-4">
                        {localCategories.map((category, index) => (
                            <div
                                key={category.id || index}
                                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                            >
                                <div className="flex items-center gap-4">
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
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Category name"
                                        />
                                    </div>

                                    {/* Weight Input */}
                                    <div className="w-32">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Weight (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={category.weight}
                                                onChange={(e) =>
                                                    handleWeightChange(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                %
                                            </span>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <div className="pt-5">
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
                                        <div className="mt-2 text-xs text-gray-500">
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
                        className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Add New Category
                    </button>

                    {/* Info Note */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2">
                            💡 Tips
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
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
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isValidTotal || processing}
                        className={`px-6 py-2 rounded-lg font-semibold transition ${
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

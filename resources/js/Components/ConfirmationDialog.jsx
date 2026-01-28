import Modal from "./Modal";
import DangerButton from "./DangerButton";
import SecondaryButton from "./SecondaryButton";
import { AlertCircle } from "lucide-react";

export default function ConfirmationDialog({
    show = false,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    dangerButtonText = "Confirm",
    cancelButtonText = "Cancel",
    onConfirm = () => {},
    onCancel = () => {},
    isDangerous = true,
}) {
    return (
        <Modal show={show} maxWidth="md" closeable={true} onClose={onCancel}>
            <div className="bg-white dark:bg-gray-800 px-4 py-6 sm:px-6">
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-6">
                    {isDangerous && (
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
                        </div>
                    )}
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                </div>

                {/* Message */}
                <div className="mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {message}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                    <SecondaryButton onClick={onCancel}>
                        {cancelButtonText}
                    </SecondaryButton>
                    <DangerButton onClick={onConfirm}>
                        {dangerButtonText}
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
}

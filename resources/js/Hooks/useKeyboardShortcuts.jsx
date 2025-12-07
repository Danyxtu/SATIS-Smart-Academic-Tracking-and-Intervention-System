import { useEffect, useCallback } from "react";
import showToast from "@/Utils/toast";

/**
 * Custom hook for handling keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to callbacks
 * @param {Object} options - Additional options
 * @param {boolean} options.enabled - Whether shortcuts are enabled (default: true)
 * @param {boolean} options.preventDefault - Whether to prevent default browser behavior (default: true)
 */
export function useKeyboardShortcuts(shortcuts, options = {}) {
    const { enabled = true, preventDefault = true } = options;

    const handleKeyDown = useCallback(
        (event) => {
            if (!enabled) return;

            // Skip if user is typing in an input, textarea, or contenteditable
            const target = event.target;
            const isEditable =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable;

            // Build the key combination string
            const keys = [];
            if (event.ctrlKey || event.metaKey) keys.push("ctrl");
            if (event.altKey) keys.push("alt");
            if (event.shiftKey) keys.push("shift");
            keys.push(event.key.toLowerCase());

            const keyCombo = keys.join("+");

            // Check if this combination has a handler
            const handler = shortcuts[keyCombo];

            if (handler) {
                // For some shortcuts, we still want them to work even in editable fields
                const allowInEditable = handler.allowInEditable ?? false;

                if (!isEditable || allowInEditable) {
                    if (preventDefault) {
                        event.preventDefault();
                    }

                    if (typeof handler === "function") {
                        handler(event);
                    } else if (typeof handler.action === "function") {
                        handler.action(event);
                    }
                }
            }
        },
        [shortcuts, enabled, preventDefault]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Pre-defined keyboard shortcut configurations
 */
export const KeyboardShortcutPresets = {
    /**
     * Save shortcut (Ctrl+S)
     * @param {Function} onSave - Callback to execute on save
     */
    save: (onSave) => ({
        "ctrl+s": {
            action: () => {
                onSave();
                showToast.info("Saving...", { duration: 1500 });
            },
            allowInEditable: true,
            description: "Save changes",
        },
    }),

    /**
     * Escape shortcut to close modals
     * @param {Function} onClose - Callback to execute on escape
     */
    escape: (onClose) => ({
        escape: {
            action: onClose,
            allowInEditable: true,
            description: "Close modal/dialog",
        },
    }),

    /**
     * Navigation shortcuts
     */
    navigation: (handlers) => ({
        "ctrl+h": {
            action: handlers.home,
            description: "Go to dashboard",
        },
        "ctrl+n": {
            action: handlers.notifications,
            description: "Open notifications",
        },
    }),
};

/**
 * Hook for displaying available keyboard shortcuts
 */
export function useShortcutHelp() {
    const shortcuts = [
        { keys: "Ctrl + S", description: "Save current changes" },
        { keys: "Escape", description: "Close modal or dialog" },
        { keys: "Ctrl + /", description: "Show keyboard shortcuts" },
    ];

    const showHelp = () => {
        showToast.info(
            <div className="text-left">
                <div className="font-semibold mb-2">Keyboard Shortcuts</div>
                {shortcuts.map((s, i) => (
                    <div key={i} className="flex justify-between gap-4 text-sm">
                        <span className="font-mono bg-white/20 px-1 rounded">
                            {s.keys}
                        </span>
                        <span className="text-white/80">{s.description}</span>
                    </div>
                ))}
            </div>,
            { duration: 5000 }
        );
    };

    return { shortcuts, showHelp };
}

export default useKeyboardShortcuts;

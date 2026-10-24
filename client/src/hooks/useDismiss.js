import { useEffect } from "react";

// Closes a popover on Escape or a click outside `ref`
export const useDismiss = (open, ref, onClose) => {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        const onDown = (e) => ref.current && !ref.current.contains(e.target) && onClose();
        document.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onDown);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onDown);
        };
    }, [open, ref, onClose]);
};

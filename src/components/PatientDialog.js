import { useEffect, useId, useRef } from "react";

// Adds keyboard behavior to the existing patient dialogs without changing their actions.
export default function PatientDialog({ children, onClose, busy = false, ...props }) {
  const ref = useRef(null);
  const headingId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = ref.current;
    const heading = dialog.querySelector("h1, h2, h3");
    if (heading) {
      if (!heading.id) heading.id = headingId;
      dialog.setAttribute("aria-labelledby", heading.id);
    }
    dialog.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [headingId]);

  const handleKeyDown = event => {
    if (event.key === "Escape" && onClose && !busy) {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    if (event.key !== "Tab") return;
    const controls = [...ref.current.querySelectorAll(
      'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
    )].filter(node => !node.closest('[hidden], [aria-hidden="true"]'));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first) {
      event.preventDefault();
    } else if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div {...props} ref={ref} role="dialog" aria-modal="true" tabIndex={-1} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}

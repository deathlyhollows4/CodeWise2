import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
export function Dialog({
  title,
  description,
  label,
  onConfirm,
  onClose,
  confirmationText,
}: {
  title: string;
  description: string;
  label: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmationText?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const main = document.querySelector(".app") as HTMLElement | null;
    if (main) main.inert = true;
    const buttons = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button,a,input,textarea,select,[tabindex="0"]',
        ) || [],
      ).filter((element) => !element.hasAttribute("disabled"));
    buttons()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const list = buttons(),
          first = list[0],
          last = list[list.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      if (main) main.inert = false;
      previous?.focus();
    };
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={panel}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-description">{description}</p>
        {confirmationText && (
          <div className="field">
            <label htmlFor="destructive-confirmation">
              Type {confirmationText} to confirm
            </label>
            <input
              id="destructive-confirmation"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}
        <div className="actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="danger"
            onClick={onConfirm}
            disabled={!!confirmationText && typed !== confirmationText}
          >
            {label}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

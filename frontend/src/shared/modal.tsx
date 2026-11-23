"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  content: ReactNode;
}

export default function Modal({ open, onClose, title, content }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const appShell = document.getElementById("app-shell");
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => element.offsetParent !== null || element === document.activeElement);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const items = focusable();

      if (items.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = active ? panel?.contains(active) : false;

      if (event.shiftKey && (active === first || active === panel || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    appShell?.setAttribute("inert", "");
    document.addEventListener("keydown", onKeyDown);
    panel?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      appShell?.removeAttribute("inert");
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="relative w-full max-w-md rounded-lg border border-border bg-surface p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-base font-medium text-fg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <XMarkIcon aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{content}</div>
      </div>
    </div>,
    document.body
  );
}

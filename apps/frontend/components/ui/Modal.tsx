"use client";

import { ReactNode } from "react";

const SIZE_CLASSES = {
  md: "max-w-md",
  // Wider variant for forms with multiple side-by-side fields per row (e.g.
  // Record Payment's Payer/Insurance Provider/Policy Number row, task-332) --
  // `md` (28rem) is too narrow to lay those out without squishing/overflow.
  lg: "max-w-2xl",
} as const;

export function Modal({
  title,
  onClose,
  children,
  size = "md",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: keyof typeof SIZE_CLASSES;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[90vh] w-full ${SIZE_CLASSES[size]} flex-col overflow-y-auto rounded-lg bg-surface p-5 shadow-lg`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-muted hover:text-foreground">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

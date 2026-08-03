"use client";

import { KeyboardEvent, ReactNode, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/utils/cn";

// docs/02-design/ui-guidelines.md §9.3 + design-system.md §11.3: inline edit
// for single-field, low-risk corrections. Trigger is a dedicated pencil icon
// -- visible on row hover *and* always reachable via keyboard focus (never
// hover-only) -- not click-anywhere-in-the-cell, which would conflict with
// row-click-to-view-detail patterns already used elsewhere in this app.
// Enter/blur commits, Escape reverts. A failed save shows a red outline +
// inline error in the cell itself, not only a toast, so the user doesn't
// lose context (design-system.md §11.3).
interface InlineEditableCellProps {
  value: string | number;
  type?: "text" | "number";
  onCommit: (nextValue: string | number) => Promise<void>;
  displayValue?: ReactNode;
  disabled?: boolean;
  "aria-label": string;
}

export function InlineEditableCell({ value, type = "text", onCommit, displayValue, disabled, ...rest }: InlineEditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(value));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [flashSuccess, setFlashSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    if (disabled) return;
    setDraft(String(value));
    setError(false);
    setEditing(true);
  }

  function revert() {
    setDraft(String(value));
    setError(false);
    setEditing(false);
  }

  async function commit() {
    const nextValue = type === "number" ? Number(draft) : draft;
    if (String(nextValue) === String(value)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(false);
    try {
      await onCommit(nextValue);
      setEditing(false);
      setFlashSuccess(true);
      window.setTimeout(() => setFlashSuccess(false), 500);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      revert();
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type={type}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => void commit()}
        aria-label={rest["aria-label"]}
        className={cn(
          "w-full rounded-sm border bg-surface px-1.5 py-0.5 text-sm outline-none transition-colors duration-[100ms]",
          error ? "border-error" : "border-primary",
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "group/cell -mx-1.5 flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 transition-colors duration-[180ms]",
        flashSuccess && "bg-success-bg",
      )}
    >
      <span>{displayValue ?? value}</span>
      {!disabled && (
        <button
          type="button"
          onClick={startEdit}
          aria-label={`Edit ${rest["aria-label"]}`}
          className="shrink-0 rounded-sm p-0.5 text-muted opacity-0 transition-opacity duration-[100ms] hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group-hover/cell:opacity-100"
        >
          <Pencil size={13} strokeWidth={1.75} />
        </button>
      )}
      {error && <span className="text-xs text-error">Couldn&apos;t save</span>}
    </div>
  );
}

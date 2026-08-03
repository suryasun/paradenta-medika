"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { ToothCondition } from "@/features/master-data/types/masterData.types";
import { OdontogramEntry } from "../types/emr.types";

// docs/03-sad/15-module-emr.md §12's own literal FDI layout (Section 12
// "Dental Quadrant" ASCII diagram) -- not an invented arc shape. Quadrants
// 1 and 4 are listed ascending (11-18, 41-48) in that source, but the
// *visual* chart reads left-to-right per the same section's own diagram,
// which shows 18..11 and 48..41 -- these arrays encode that display order;
// FDI_TOOTH_NUMBERS in emr.types.ts (quadrant-ascending) is still what the
// record/current-state/history API calls use, unchanged.
const PERMANENT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const PERMANENT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const PRIMARY_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const PRIMARY_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

interface OdontogramChartProps {
  entries: OdontogramEntry[];
  conditions: ToothCondition[];
  selectedTooth: number | null;
  onSelectTooth: (toothNumber: number) => void;
}

function Tooth({
  number,
  entry,
  condition,
  selected,
  onClick,
}: {
  number: number;
  entry: OdontogramEntry | undefined;
  condition: ToothCondition | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  const fill = condition?.colorCode || undefined;
  const statusText = condition ? condition.conditionName : "No condition recorded";

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Tooth ${number} — ${statusText}`}
      aria-label={`Tooth ${number}, ${statusText}`}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 rounded-md border-2 bg-surface p-1 transition-[transform,box-shadow,border-color] duration-[100ms] ease-out hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected ? "border-primary shadow-md" : "border-border",
      )}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" fill={fill ?? "var(--surface)"} stroke={fill ? "transparent" : "var(--border)"} strokeWidth="1.5" />
      </svg>
      <span className="font-tabular text-[10px] font-semibold text-foreground">{number}</span>
      {/* color is reinforcement, never the only signal (SAD §27 UI Rules) --
          the FDI number label and this dot (note present) are always text/shape,
          plus the title/aria-label above always names the condition in words. */}
      {entry?.note && <span className="h-1 w-1 rounded-full bg-[var(--color-info-500)]" aria-hidden="true" />}
    </button>
  );
}

function ToothRow({
  numbers,
  entryByTooth,
  conditionById,
  selectedTooth,
  onSelectTooth,
}: {
  numbers: number[];
  entryByTooth: Map<number, OdontogramEntry>;
  conditionById: Map<string, ToothCondition>;
  selectedTooth: number | null;
  onSelectTooth: (n: number) => void;
}) {
  const half = numbers.length / 2;
  const renderHalf = (nums: number[]) => (
    <div className="flex gap-1.5">
      {nums.map((n) => {
        const entry = entryByTooth.get(n);
        return (
          <Tooth
            key={n}
            number={n}
            entry={entry}
            condition={entry ? conditionById.get(entry.toothConditionId) : undefined}
            selected={selectedTooth === n}
            onClick={() => onSelectTooth(n)}
          />
        );
      })}
    </div>
  );
  return (
    <div className="flex items-center gap-4">
      {renderHalf(numbers.slice(0, half))}
      <div className="h-8 w-px shrink-0 bg-border" aria-hidden="true" />
      {renderHalf(numbers.slice(half))}
    </div>
  );
}

// docs/02-design/design-system.md §11.5, the product's signature
// interactive element: a 2-row FDI dental chart, Permanent/Primary
// toggle, each tooth an independently clickable/keyboard-focusable
// button. This component is pure presentation + selection state --
// OdontogramSection owns the record form / history modal for the
// currently selected tooth.
export function OdontogramChart({ entries, conditions, selectedTooth, onSelectTooth }: OdontogramChartProps) {
  const [dentition, setDentition] = useState<"permanent" | "primary">("permanent");
  const entryByTooth = new Map(entries.map((e) => [e.toothNumber, e]));
  const conditionById = new Map(conditions.map((c) => [c.id, c]));
  const upperRow = dentition === "permanent" ? PERMANENT_UPPER : PRIMARY_UPPER;
  const lowerRow = dentition === "permanent" ? PERMANENT_LOWER : PRIMARY_LOWER;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Dentition</span>
        <div className="flex rounded-full bg-slate-100 p-0.5">
          {(["permanent", "primary"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDentition(d)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-[180ms]",
                dentition === d ? "bg-white text-primary shadow-sm" : "text-muted",
              )}
            >
              {d === "permanent" ? "Permanent (32)" : "Primary (20)"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 overflow-x-auto rounded-lg border border-border bg-slate-50 p-4">
        <ToothRow numbers={upperRow} entryByTooth={entryByTooth} conditionById={conditionById} selectedTooth={selectedTooth} onSelectTooth={onSelectTooth} />
        <div className="h-px w-full bg-border" aria-hidden="true" />
        <ToothRow numbers={lowerRow} entryByTooth={entryByTooth} conditionById={conditionById} selectedTooth={selectedTooth} onSelectTooth={onSelectTooth} />
      </div>
    </div>
  );
}

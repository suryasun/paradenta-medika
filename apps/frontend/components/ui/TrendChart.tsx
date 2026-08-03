"use client";

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "./EmptyState";

// docs/02-design/design-system.md §11.4 (Recharts, newly approved) +
// ui-guidelines.md §9.5: every chart keeps a keyboard-reachable "View as
// table" toggle -- data must never be mouse-hover-only accessible -- and
// a chart is additive, never a replacement for the underlying table. This
// is the shared component every Phase 1 analytics/report page reuses
// rather than each building its own chart+toggle pair.
interface TrendChartProps<T> {
  data: T[];
  xKey: keyof T & string;
  yKey: keyof T & string;
  xLabel?: (item: T) => string;
  emptyTitle?: string;
}

// design-system.md §2's jade primary-500, literal hex -- SVG fill
// attributes (how Recharts renders bars) don't resolve CSS custom
// properties the way an element's style attribute would.
const BAR_COLOR = "#0E9380";

export function TrendChart<T extends object>({ data, xKey, yKey, xLabel, emptyTitle = "No data for this range" }: TrendChartProps<T>) {
  const [view, setView] = useState<"chart" | "table">("chart");

  if (data.length === 0) return <EmptyState title={emptyTitle} />;

  const formatLabel = (item: T) => (xLabel ? xLabel(item) : String((item as Record<string, unknown>)[xKey]));
  const valueOf = (item: T) => String((item as Record<string, unknown>)[yKey]);
  // Recharts v3's generics tie `data`/`dataKey` to a stricter TypedDataKey
  // inference than a caller-supplied generic T can satisfy -- these are
  // plain objects at runtime, so a loosened cast at the Recharts boundary
  // is safe (the public TrendChart<T> API above stays fully typed).
  const chartData = data as unknown as Record<string, unknown>[];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
          className="text-xs font-medium text-primary hover:underline"
        >
          {view === "chart" ? "View as table" : "View as chart"}
        </button>
      </div>
      {view === "chart" ? (
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis dataKey={xKey as string} tickFormatter={(_, i) => formatLabel(data[i])} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip
                formatter={(value) => [String(value), "Count"]}
                labelFormatter={(_, payload) => (payload?.[0] ? formatLabel(payload[0].payload as T) : "")}
              />
              <Bar dataKey={yKey as string} fill={BAR_COLOR} radius={[4, 4, 0, 0]} animationDuration={280} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {data.map((item, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="py-1.5 text-muted">{formatLabel(item)}</td>
                <td className="py-1.5 text-right font-tabular font-medium text-foreground">{valueOf(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

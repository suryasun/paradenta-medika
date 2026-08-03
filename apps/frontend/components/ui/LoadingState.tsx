// docs/02-design/ui-guidelines.md §1: "skeleton rows matching the real row
// height/columns (not a spinner-only overlay) for tables; a skeleton card
// grid for dashboards." `rows`/`columns` render a table-shaped skeleton;
// `cards` renders a card-grid skeleton; omitting both keeps the original
// spinner for the few call sites with no stable shape to preview (e.g. a
// full-page auth guard).
interface LoadingStateProps {
  label?: string;
  rows?: number;
  columns?: number;
  cards?: number;
}

export function LoadingState({ label = "Loading...", rows, columns = 4, cards }: LoadingStateProps) {
  if (rows) {
    return (
      <div role="status" aria-live="polite" aria-label={label} className="flex flex-col gap-2">
        <span className="sr-only">{label}</span>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 rounded-md border border-border bg-surface px-4 py-3">
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="h-4 flex-1 animate-pulse rounded bg-slate-200" style={{ animationDelay: `${(r * columns + c) * 30}ms` }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (cards) {
    return (
      <div role="status" aria-live="polite" aria-label={label} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <span className="sr-only">{label}</span>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" style={{ animationDelay: `${i * 40}ms` }} />
            <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" style={{ animationDelay: `${i * 40 + 20}ms` }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted" role="status" aria-live="polite">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

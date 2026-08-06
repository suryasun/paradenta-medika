import { PaginationMeta } from "@/types/api";
import { Button } from "./Button";

const DEFAULT_LIMIT_OPTIONS = [10, 20, 50, 100];

// task-303 (Reservation Module Addendum #3): `limit`/`onLimitChange` are
// optional so every existing consumer that doesn't pass them keeps its
// exact prior behavior (Previous/Next only, hidden entirely on a single
// page). When a caller opts in, the page-size selector is shown even on a
// single page -- a caller who wants to preemptively grow the page size
// (e.g. to see if a lower limit would create more pages) shouldn't have
// the control disappear on them.
export function Pagination({
  meta,
  onPageChange,
  limit,
  onLimitChange,
  limitOptions = DEFAULT_LIMIT_OPTIONS,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
}) {
  const showPager = meta.totalPages > 1;
  if (!showPager && !onLimitChange) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted">
      <span>
        Page {meta.page} of {meta.totalPages} &middot; {meta.total} total
      </span>
      <div className="flex items-center gap-3">
        {onLimitChange && (
          <label className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              aria-label="Rows per page"
              value={limit ?? meta.limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="rounded-md border border-border bg-white px-2 py-1 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
        {showPager && (
          <div className="flex gap-2">
            <Button variant="secondary" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

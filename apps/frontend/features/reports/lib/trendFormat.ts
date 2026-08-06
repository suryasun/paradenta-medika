import { ReservationTrendGroupBy } from "../types/reports.types";

// docs/06-tasks/task-308.md/task-309.md/task-310.md (Reservation Module
// Addendum #4): shared by every report page with a Day/Month trend toggle
// (Reservation By Status, By Patient Type, By Doctor) so the "Jan 2026"
// formatting logic for a `YYYY-MM` bucket isn't duplicated three times.
// Day buckets (`YYYY-MM-DD`) pass through unchanged.
export function formatTrendLabel(groupBy: ReservationTrendGroupBy, date: string): string {
  if (groupBy !== "month") return date;
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });
}

# task-308: Day/Month Trend Section on "Reservation By Status"

**Phase:** Reservation Module Addendum #4 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE18. Day/Month Trend on Reservation Reports
**Module:** Reservation / Reporting
**Priority:** P3 - Low

---

## Business Goal

Let staff switch the Reservation By Status report's existing trend chart between a day-by-day view and a month-by-month view, useful for spotting seasonal patterns over a longer range than a day-level chart can show legibly.

## Depends On

- task-305 (Reservation By Status Report — already has the day-only trend chart being generalized; already added the `groupBy` backend param and `groupByMonth` helper, since By Status's report + rename shipped together)

## Required Documents

- **AI Contract:** none
- **PRD:** `docs/01-prd/features/reservation.md` RSV-024
- **SAD:** `docs/03-sad/13-module-reservation.md` §42.1/§42.3/§42.5
- **Design:** `docs/02-design/pages/reservation.md` §12

## Required Existing Code

`groupByDate`/`groupByMonth` (`ReservationAnalyticsUseCase.ts`, task-305). `TrendChart`'s existing `xLabel` formatter prop (`components/ui/TrendChart.tsx`) and built-in "View as chart / View as table" toggle — no `TrendChart` changes needed.

## Backend Scope

None beyond task-305's own `groupBy` param — this task is the frontend UI/toggle wiring half of that already-shipped backend capability, split out as its own deliverable since it's a distinct user-facing bullet from the rename itself.

## Frontend Scope

`ReservationByStatusReportPage.tsx`'s Day/Month `<Select>` (added in task-305) drives `formatTrendLabel(groupBy, date)` (`features/reports/lib/trendFormat.ts`, shared with task-309/310) as the `TrendChart`'s `xLabel` prop, rendering `YYYY-MM` buckets as e.g. "Jan 2026" while `YYYY-MM-DD` buckets pass through unchanged. `TrendChart`'s existing built-in "View as table" toggle satisfies the "and tables" part of the request — no separate table component.

## Database Impact

None.

## API Impact

None — reuses task-305's `groupBy` param.

## Workflow Impact

None.

## Security Impact

None.

## Testing Required

- Frontend component test: switching Group By to Month re-queries with `groupBy=month` and formats trend labels as month/year.

## Deliverables

- `formatTrendLabel` shared helper (`features/reports/lib/trendFormat.ts`).
- Day/Month toggle wired into the trend chart's label formatting.
- Test.

## Acceptance Criteria

- Switching between Day and Month re-buckets and correctly re-labels the trend chart.

## Definition of Done

Day/Month toggle functional on the trend chart, test passing.

---

## Dependency Detail

- **Blocked By:** task-305
- **Required Before:** None
- **Can Run In Parallel With:** task-309, task-310

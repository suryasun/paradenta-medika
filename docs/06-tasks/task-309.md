# task-309: Day/Month Trend Section on "Reservations by Patient Type"

**Phase:** Reservation Module Addendum #4 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE18. Day/Month Trend on Reservation Reports
**Module:** Reservation / Reporting
**Priority:** P3 - Low

---

## Business Goal

Add a time-series view of reservation volume to the Patient Type comparison report, additive to its existing New-vs-Old bar comparison — the comparison chart answers "what's the New/Old split", this answers "how is volume trending", two different questions the same report page should answer.

## Depends On

- task-300 (Reservation by Patient Type Report)
- task-306 (Status filter — the new trend respects it)
- task-308 (establishes the `formatTrendLabel` shared helper and Day/Month `<Select>` pattern this task reuses)

## Required Documents

- **AI Contract:** none
- **PRD:** `docs/01-prd/features/reservation.md` RSV-024
- **SAD:** `docs/03-sad/13-module-reservation.md` §42.1/§42.3/§42.5
- **Design:** `docs/02-design/pages/reservation.md` §12

## Required Existing Code

`groupByDate`/`groupByMonth` (`ReservationAnalyticsUseCase.ts`). `formatTrendLabel` (`features/reports/lib/trendFormat.ts`, task-308).

## Backend Scope

`GetReservationByPatientTypeReportUseCase.ts` adds `summary.trend: DateCountPoint[]`, computed via `groupByDate`/`groupByMonth` (per the new `groupBy` query param) over the same `allInRange` array already fetched for the New/Old breakdown — no extra query. `ReservationByPatientTypeReportQueryDto.ts` gains `@IsOptional() @IsIn(['day','month']) groupBy?: 'day' | 'month'`.

## Frontend Scope

`ReservationByPatientTypeReportPage.tsx` gains a Day/Month `<Select>` (same shape as task-308) and a new, separate "Trend Over Time" `Card`+`TrendChart` section below the existing "New vs. Old Comparison" chart — additive, not a replacement.

## Database Impact

None.

## API Impact

`GET /reports/reservations/by-patient-type` response `summary` gains `trend: DateCountPoint[]`; gains an optional `groupBy` query param.

## Workflow Impact

None.

## Security Impact

None.

## Testing Required

- Unit test: `summary.trend` buckets correctly by day (default) and by month (`groupBy=month`).
- Frontend component test: the new Trend Over Time section renders and re-queries on Group By change.

## Deliverables

- `summary.trend` on the use case/DTO.
- New Trend Over Time section on the report page.
- Tests.

## Acceptance Criteria

- The new trend section appears alongside, not instead of, the existing New/Old comparison chart.
- Switching Day/Month re-buckets the new trend chart, independent of the existing comparison chart.

## Definition of Done

Trend section functional end-to-end, tests passing.

---

## Dependency Detail

- **Blocked By:** task-300, task-306, task-308
- **Required Before:** None
- **Can Run In Parallel With:** task-310

# task-310: Day/Month Trend Section on "Reservations by Doctor"

**Phase:** Reservation Module Addendum #4 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE18. Day/Month Trend on Reservation Reports
**Module:** Reservation / Reporting
**Priority:** P3 - Low

---

## Business Goal

Add a time-series view of reservation volume to the By Doctor comparison report, additive to its existing per-doctor bar comparison, matching task-309's identical addition to the Patient Type report.

## Depends On

- task-301 (Reservation by Doctor Report)
- task-307 (Status filter — the new trend respects it)
- task-308 (establishes the `formatTrendLabel` shared helper and Day/Month `<Select>` pattern this task reuses)

## Required Documents

- **AI Contract:** none
- **PRD:** `docs/01-prd/features/reservation.md` RSV-024
- **SAD:** `docs/03-sad/13-module-reservation.md` §42.1/§42.3/§42.5
- **Design:** `docs/02-design/pages/reservation.md` §12

## Required Existing Code

`groupByDate`/`groupByMonth` (`ReservationAnalyticsUseCase.ts`). `formatTrendLabel` (`features/reports/lib/trendFormat.ts`, task-308).

## Backend Scope

`GetReservationByDoctorReportUseCase.ts` adds `summary.trend: DateCountPoint[]`, computed via `groupByDate`/`groupByMonth` over the same `allInRange` array already fetched for `summary.breakdown` — unfiltered by `doctorId` (consistent with `breakdown`'s own existing convention), respecting `status`. `ReservationByDoctorReportQueryDto.ts` gains `@IsOptional() @IsIn(['day','month']) groupBy?: 'day' | 'month'`.

## Frontend Scope

`ReservationByDoctorReportPage.tsx` gains a Day/Month `<Select>` and a new, separate "Trend Over Time" `Card`+`TrendChart` section below the existing "Reservations per Doctor" comparison chart — additive, not a replacement.

## Database Impact

None.

## API Impact

`GET /reports/reservations/by-doctor` response `summary` gains `trend: DateCountPoint[]`; gains an optional `groupBy` query param.

## Workflow Impact

None.

## Security Impact

None.

## Testing Required

- Unit test: `summary.trend` buckets correctly by day (default) and by month (`groupBy=month`), unaffected by the `doctorId` filter.
- Frontend component test: the new Trend Over Time section renders and re-queries on Group By change.

## Deliverables

- `summary.trend` on the use case/DTO.
- New Trend Over Time section on the report page.
- Tests.

## Acceptance Criteria

- The new trend section appears alongside, not instead of, the existing per-doctor comparison chart.
- The trend reflects all doctors regardless of the `doctorId` filter, consistent with `breakdown`'s existing convention.

## Definition of Done

Trend section functional end-to-end, tests passing.

---

## Dependency Detail

- **Blocked By:** task-301, task-307, task-308
- **Required Before:** None
- **Can Run In Parallel With:** task-309

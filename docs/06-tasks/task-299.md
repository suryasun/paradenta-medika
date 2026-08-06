# task-299: Completed Reservations Report

> **Superseded by task-305** (Reservation Module Addendum #4): this report
> was renamed "Reservation By Status", generalizing the hardcoded
> `status: 'COMPLETED'` filter into a user-selectable one. This file is left
> as the historical record of the original shipped scope; see task-305 for
> the current spec.

**Phase:** Reservation Module Addendum #2 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE10. Completed Reservations Report
**Module:** Reservation / Reporting
**Priority:** P2 - Medium

---

## Business Goal

Let clinic management review completed-appointment volume over a date range — both the underlying list (which reservations, which patients, which doctors) and the day-by-day trend — without cross-referencing the general Reservation Analytics dashboard (which reports a single aggregate completion rate, not a per-date completed-reservation trend or list).

## Depends On

- task-290 (Patient Type Categorization — reuses `findAllInDateRange`'s existing optional-filter-param pattern)
- task-291 (New Patient Date-Range Report — direct structural precedent)
- task-295 (Patient MRN/Name on Reservation List — this report's table reuses that same server-side join)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/04-api-contract.md` API-055–071 (pagination/filtering/sorting), API-105/106 (async export jobs — export deferred, same as task-291)
- **PRD:** `docs/01-prd/business-rules.md` §7.5.1, `docs/01-prd/features/reservation.md` RSV-019
- **SAD:** `docs/03-sad/13-module-reservation.md` §40.3/§40.4 (`GET /api/v1/reports/reservations/completed`)
- **Design:** none dedicated — mirrors `docs/02-design/pages/reservation.md` §8.4's New Patient Report layout, plus a `TrendChart`

## Required Existing Code

`GetNewPatientReportUseCase.ts` (task-291) — this task's use case is structurally identical, substituting `status = COMPLETED` for `patient_type_at_booking = NEW`. `ReservationAnalyticsUseCase.ts`'s `groupByDate` helper (exported by this task for reuse, rather than re-implemented). `TrendChart` component (`components/ui/TrendChart.tsx`) and `NewPatientReportPage.tsx`'s date-preset/summary-card/table shell.

## Backend Scope

- `IReservationRepository.findAllInDateRange` gains a second optional filter param, `status?: string`, alongside the existing `patientType?` (task-290/291 precedent), implemented in both the Prisma repository and the test fake.
- `ReservationAnalyticsUseCase.ts`'s `groupByDate` function is exported for reuse.
- New `GetCompletedReservationReportUseCase` (Reports module): `search({ dateFrom, dateTo, status: 'COMPLETED', page, limit, sort, order })` for the paginated `items`, `findAllInDateRange(..., status: 'COMPLETED')` for the full-range set backing `summary: { totalCompleted, trend: DateCountPoint[] }`.
- New `CompletedReservationReportQueryDto` (`dateFrom`/`dateTo` required, extends `ListQueryDto`) — same shape as `NewPatientReportQueryDto`.
- New `CompletedReservationReportController`, route `GET /api/v1/reports/reservations/completed`, new permission `report.reservation.completed.read` (added to the `REGISTRATION` role grant, following the `report.reservation.new-patient.read` precedent).

## Frontend Scope

New page (route `/reports/completed-reservations`):

```text
Completed Reservations Report
├── Header: H1 "Completed Reservations Report"
├── Date-range picker with presets (Today / This Week / This Month / Last 30 Days / Custom)
├── Summary card: Total Completed
├── Trend chart: day-by-day completed count (TrendChart, xKey="date" yKey="count")
└── Results table: Reservation No., Patient (name + MRN), Date, Time,
    Procedure, Staff
```

`completedReservationReport.service.ts` (same `{summary, ...meta}` destructuring pattern as `newPatientReport.service.ts`), `useCompletedReservationReport.ts` hook, types in `reports.types.ts`. New nav entry under Reports.

## Database Impact

None.

## API Impact

Adds `GET /api/v1/reports/reservations/completed`.

## Workflow Impact

None — read-only reporting, no state transitions.

## Security Impact

New permission `report.reservation.completed.read`, following the existing `report.reservation.<name>.read` namespace convention task-291 established.

## Testing Required

- Unit test: report correctly includes only `COMPLETED` reservations within the given range, excluding other statuses and out-of-range rows.
- Unit test: the trend correctly buckets multiple same-day completed reservations into one count per date.
- Integration test: `GET /reports/reservations/completed?dateFrom=...&dateTo=...` returns the documented response shape (paginated `data` + `summary` with `trend`), verified against a manually counted seed dataset.
- Frontend component test: summary card, trend chart, and results table render from mocked data; trend chart shows its empty state when there's no data for the range.

## Deliverables

- `GetCompletedReservationReportUseCase` + `GET /reports/reservations/completed` route.
- `findAllInDateRange`'s new `status` param (repository + fake).
- New report page (frontend), service, hook, types, nav entry.
- `report.reservation.completed.read` permission.
- Tests.

## Acceptance Criteria

- Returns correct counts and a correct day-by-day trend for a given date range, verified against a manually counted seed dataset.
- Date range is inclusive on both ends.
- Only `COMPLETED` reservations are included — no other status.
- Report table shows patient name/MRN via task-295's existing join, not a new client-side lookup.

## Definition of Done

Report endpoint live and tested against a seeded dataset, frontend page renders real data with a working trend chart and results table, export explicitly deferred (not half-built), tests passing.

---

## Dependency Detail

- **Blocked By:** task-290, task-291, task-295
- **Required Before:** None
- **Can Run In Parallel With:** task-296, task-297, task-298

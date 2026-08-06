# task-301: Report Reservation by Doctor

**Phase:** Reservation Module Addendum #3 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE12. Reservation by Doctor Report
**Module:** Reservation / Reporting
**Priority:** P2 - Medium

---

## Business Goal

Let clinic management compare reservation volume across all doctors in a date range, with the option to drill into one doctor's own reservation list without losing the cross-doctor comparison.

## Depends On

- task-295 (Patient MRN/Name on Reservation List — this report's table reuses that join)
- task-299 (Completed Reservations Report — direct structural precedent, first report to pair a table with a chart)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/04-api-contract.md` API-055–071
- **PRD:** `docs/01-prd/business-rules.md` §7.5.2, `docs/01-prd/features/reservation.md` RSV-021
- **SAD:** `docs/03-sad/13-module-reservation.md` §41.3/§41.4 (`GET /api/v1/reports/reservations/by-doctor`)
- **Design:** `docs/02-design/pages/reservation.md` §11

## Required Existing Code

`GetCompletedReservationReportUseCase.ts` (task-299) — structural precedent. `ReservationAnalyticsUseCase.ts`'s `doctorUtilization` computation (`Map<doctorId, count>` grouping) — the same grouping shape, reused as its own dedicated report rather than an embedded dashboard field. `search()`'s existing `doctorId` filter (task-031) — reused directly for the paginated table's optional doctor filter.

## Backend Scope

- New `GetReservationByDoctorReportUseCase`: `search({dateFrom, dateTo, doctorId?, page, limit, sort, order})` for the paginated `items` (respects an optional `doctorId` filter); `findAllInDateRange(from, to)` (always unfiltered by doctor, regardless of the `doctorId` query param) grouped into `[{doctorId, count}]`, sorted descending — the comparison chart always reflects all doctors, so narrowing the table to one doctor never distorts it. Doctor names are **not** resolved server-side (no join) — the frontend resolves them client-side via the existing `useDoctors()` pattern, same as every other Reservation screen.
- New `ReservationByDoctorReportQueryDto` (`dateFrom`/`dateTo` required + optional `doctorId`).
- New `ReservationByDoctorReportController`, route `GET /reports/reservations/by-doctor`, new permission `report.reservation.doctor.read`.

## Frontend Scope

New page (route `/reports/by-doctor`):

```text
Reservations by Doctor
├── Header: H1 "Reservations by Doctor"
├── Date-range picker with presets + optional Doctor filter (Select)
├── Summary card: Total Doctors
├── Comparison chart (TrendChart, xKey="doctorName" yKey="count",
│   doctorId resolved to name client-side)
└── Results table: Reservation No., Patient (name + MRN), Date, Time,
    Doctor, Status
```

`reservationByDoctorReport.service.ts`, `useReservationByDoctorReport.ts` hook, types in `reports.types.ts`, new nav entry under Reports.

## Database Impact

None.

## API Impact

Adds `GET /api/v1/reports/reservations/by-doctor`.

## Workflow Impact

None — read-only reporting.

## Security Impact

New permission `report.reservation.doctor.read`, following the existing `report.reservation.<name>.read` namespace convention.

## Testing Required

- Unit test: per-doctor breakdown is computed over the full range, sorted by count descending.
- Unit test: selecting a `doctorId` narrows the paginated `items` table without narrowing `summary.breakdown`.
- Integration test: `GET /reports/reservations/by-doctor?dateFrom=...&dateTo=...` returns the documented response shape, verified against a manually counted seed dataset.
- Frontend component test: total-doctors card, comparison chart (with resolved names), and results table render from mocked data; selecting a doctor filter narrows the query.

## Deliverables

- `GetReservationByDoctorReportUseCase` + `GET /reports/reservations/by-doctor` route.
- New report page (frontend), service, hook, types, nav entry.
- `report.reservation.doctor.read` permission.
- Tests.

## Acceptance Criteria

- Returns correct per-doctor counts for a given date range, verified against a manually counted seed dataset.
- The comparison chart always reflects all doctors, even when the `doctorId` filter is applied to narrow the table.

## Definition of Done

Report endpoint live and tested against a seeded dataset, frontend page renders real data with a working comparison chart, optional doctor filter, and results table, tests passing.

---

## Dependency Detail

- **Blocked By:** task-295, task-299
- **Required Before:** None
- **Can Run In Parallel With:** task-300, task-302, task-303, task-304

# task-300: Report Reservation by Patient Type

**Phase:** Reservation Module Addendum #3 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE11. Reservation by Patient Type Report
**Module:** Reservation / Reporting
**Priority:** P2 - Medium

---

## Business Goal

Let clinic management compare New vs. Old patient reservation volume side-by-side over a date range — distinct from the existing New Patient Report (task-291), which only ever shows NEW-tagged reservations and can't answer "what fraction of our bookings are returning patients."

## Depends On

- task-290 (Patient Type Categorization — `patient_type_at_booking` is what this report groups by)
- task-291 (New Patient Date-Range Report — direct structural precedent)
- task-295 (Patient MRN/Name on Reservation List — this report's table reuses that join)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/04-api-contract.md` API-055–071 (pagination/filtering/sorting)
- **PRD:** `docs/01-prd/business-rules.md` §7.5.2, `docs/01-prd/features/reservation.md` RSV-020
- **SAD:** `docs/03-sad/13-module-reservation.md` §41.3/§41.4 (`GET /api/v1/reports/reservations/by-patient-type`)
- **Design:** `docs/02-design/pages/reservation.md` §11

## Required Existing Code

`GetNewPatientReportUseCase.ts` (task-291) — this task's use case is structurally identical, except it doesn't filter `search()`/`findAllInDateRange` by `patientType` at all (both types included), and its `summary` is a NEW-vs-OLD count/percentage breakdown instead of a conversion-rate/top-procedure pair.

## Backend Scope

- New `GetReservationByPatientTypeReportUseCase` (Reports module): `search({dateFrom, dateTo, page, limit, sort, order})` for the paginated `items` (no `patientType` filter — the existing Patient Type Badge, task-290, already distinguishes rows); `findAllInDateRange(from, to)` (unfiltered) for `summary`, grouped into `{ newCount, oldCount, newPercentage, oldPercentage, breakdown: [{type:'NEW',count},{type:'OLD',count}] }`.
- New `ReservationByPatientTypeReportQueryDto` (`dateFrom`/`dateTo` required, extends `ListQueryDto`).
- New `ReservationByPatientTypeReportController`, route `GET /reports/reservations/by-patient-type`, new permission `report.reservation.patient-type.read` (added to `PERMISSIONS` + `REGISTRATION`'s grant list in `seed.ts`).

## Frontend Scope

New page (route `/reports/by-patient-type`):

```text
Reservations by Patient Type
├── Header: H1 "Reservations by Patient Type"
├── Date-range picker with presets (Today / This Week / This Month / Last 30 Days / Custom)
├── 2 summary cards: New Patients (count + %), Returning (Old) Patients (count + %)
├── Comparison chart (TrendChart, xKey="type" yKey="count")
└── Results table: Reservation No., Patient (name + MRN), Date, Time,
    Doctor, Status, Patient Type
```

`reservationByPatientTypeReport.service.ts` (same `{summary, ...meta}` destructuring as the other Reservation-module report services), `useReservationByPatientTypeReport.ts` hook, types in `reports.types.ts`, new nav entry under Reports.

## Database Impact

None.

## API Impact

Adds `GET /api/v1/reports/reservations/by-patient-type`.

## Workflow Impact

None — read-only reporting.

## Security Impact

New permission `report.reservation.patient-type.read`, following the existing `report.reservation.<name>.read` namespace convention.

## Testing Required

- Unit test: report includes both NEW and OLD reservations within the range, excluding out-of-range rows.
- Unit test: `newCount`/`oldCount`/percentages are computed over the full range, not just the current page.
- Integration test: `GET /reports/reservations/by-patient-type?dateFrom=...&dateTo=...` returns the documented response shape, verified against a manually counted seed dataset.
- Frontend component test: summary cards, comparison chart, and results table render from mocked data.

## Deliverables

- `GetReservationByPatientTypeReportUseCase` + `GET /reports/reservations/by-patient-type` route.
- New report page (frontend), service, hook, types, nav entry.
- `report.reservation.patient-type.read` permission.
- Tests.

## Acceptance Criteria

- Returns correct New/Old counts and percentages for a given date range, verified against a manually counted seed dataset.
- Both patient types appear in the results table (not filtered to one).
- Percentages sum to 100% (or both 0 when the range has no reservations).

## Definition of Done

Report endpoint live and tested against a seeded dataset, frontend page renders real data with a working comparison chart and results table, tests passing.

---

## Dependency Detail

- **Blocked By:** task-290, task-291, task-295
- **Required Before:** None
- **Can Run In Parallel With:** task-301, task-302, task-303, task-304

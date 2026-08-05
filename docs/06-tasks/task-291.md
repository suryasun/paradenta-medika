# task-291: New Patient Date-Range Report

**Phase:** Reservation Module Enhancement (post-roadmap addendum)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE2. New Patient Date-Range Report
**Module:** Reservation / Reporting
**Priority:** P2 - Medium

---

## Business Goal

Let clinic management pull a date-range report of every reservation made by a New Patient — for marketing-channel review, front-desk staffing, and conversion tracking (how many New Patient bookings actually completed vs. cancelled/no-showed) — without manually cross-referencing the Reservation list against patient history.

## Depends On

- task-290 (Patient Type Categorization — this report filters on `patient_type_at_booking`, which does not exist without it)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/04-api-contract.md` API-055–071 (pagination/filtering/sorting), API-105/106 (async export jobs), API-113 (reporting endpoint performance target)
- **PRD:** `docs/01-prd/business-rules.md` §7.5, `docs/01-prd/features/reservation.md` RSV-017
- **SAD:** `docs/03-sad/13-module-reservation.md` §39.4 (`GET /api/v1/reports/reservations/new-patients`), §39.7 items 3–4 (placement + export deferred)
- **Design:** `docs/02-design/pages/reservation.md` §8.4

## Required Existing Code

`patient_type_at_booking` (task-290). Existing Reporting-module job/export infrastructure (`docs/03-sad/22-module-reporting.md`) — this task's export action is a UI stub only (disabled/hidden) until a future task wires it to that infrastructure; do not build a new synchronous export path.

## Backend Scope

- New `GetNewPatientReportUseCase`: query reservations where `patient_type_at_booking = NEW` and `reservation_date` falls within an inclusive `[dateFrom, dateTo]` range (clinic-timezone-aware, matching the existing Reservation date-filtering convention already used by `ListReservationsUseCase`).
- Returns a paginated result set (existing pagination envelope, API-055–059) plus a `summary` object: `totalNewPatients`, `topProcedure` (most-requested `reservationType`/service among the range), `conversionRate` (`COMPLETED` / (`COMPLETED` + `CANCELLED` + `NO_SHOW`) as a percentage).
- New `GET /api/v1/reports/reservations/new-patients` route, query params `dateFrom`, `dateTo` (both required), plus existing `page`/`limit`/`sort`/`order`.
- Export (CSV/PDF) is explicitly **not** implemented in this task — the endpoint returns JSON only. A "Export" action exists in the frontend as a disabled/hidden stub (see Frontend Scope) pending a future task that wires it into the Reporting module's existing async-job pattern (API-105/106).

## Frontend Scope

New page (route TBD — see SAD §39.7 item 3, left open pending whichever future task specs Reporting-module navigation depth for this addition):

- Date-range picker with presets (Today / This Week / This Month / Last 30 Days / Custom).
- 3 summary cards: Total New Patients, Most Requested Procedure, Conversion Rate.
- Results table: Name, Date, Time, Procedure, Staff, Status, Contact (reuses the existing `Table` component and column set already used by Reservation List).
- Export button, disabled/hidden with a tooltip noting export isn't available yet — no client-side CSV generation as a workaround; that would violate the async-export requirement (API-105/106) this task is explicitly deferring, not silently satisfying a different way.

## Database Impact

None beyond task-290's `patient_type_at_booking` column, which this task depends on.

## API Impact

Adds `GET /api/v1/reports/reservations/new-patients`.

## Workflow Impact

None — read-only reporting, no state transitions.

## Security Impact

New permission `report.reservation.new-patient.read`, following the existing `report.<dashboard>.read` namespace convention (e.g. `report.dashboard.branch.read`). No existing permission covers a Reservation-scoped report.

## Testing Required

- Unit test: report correctly includes only reservations with `patient_type_at_booking = NEW` within the given range, excluding both `OLD`-tagged reservations and `NEW`-tagged reservations outside the range.
- Unit test: `conversionRate` calculation against a seeded mix of Completed/Cancelled/No-show/still-open reservations.
- Integration test: `GET /reports/reservations/new-patients?dateFrom=...&dateTo=...` returns the documented response shape (paginated `data` + `summary`), verified against a manually counted seed dataset (per this task's own Acceptance Criteria).

## Deliverables

- `GetNewPatientReportUseCase` + `GET /reports/reservations/new-patients` route.
- New report page (frontend), export action stubbed disabled.
- `report.reservation.new-patient.read` permission.
- Tests.

## Acceptance Criteria

- Returns correct counts for a given date range, verified against a manually counted seed dataset.
- Date range is inclusive on both ends and evaluated in the clinic's configured timezone.
- `conversionRate` reflects Completed vs. Cancelled/No-show among New-Patient reservations only.
- No synchronous CSV/PDF download exists — export is either absent from the UI or visibly disabled, never a client-side workaround.

## Definition of Done

Report endpoint live, tested against a seeded dataset, frontend page renders real data with working date-range presets and summary cards, export explicitly deferred (not half-built).

---

## Dependency Detail

- **Blocked By:** task-290
- **Required Before:** None
- **Can Run In Parallel With:** task-292, task-293, task-294

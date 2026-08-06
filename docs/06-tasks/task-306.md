# task-306: Status Filter on "Reservations by Patient Type"

**Phase:** Reservation Module Addendum #4 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE17. Status Filter on Reservation Reports
**Module:** Reservation / Reporting
**Priority:** P3 - Low

---

## Business Goal

Let staff narrow the Patient Type comparison report to a specific reservation status (e.g. only CANCELLED reservations' New/Old split), matching the same filter now available on the renamed Reservation By Status report (task-305).

## Depends On

- task-300 (Reservation by Patient Type Report — the report being extended)
- task-305 (establishes the `status`/`ALL` query-param convention this task reuses)

## Required Documents

- **AI Contract:** none beyond the existing API contract already governing this endpoint
- **PRD:** `docs/01-prd/features/reservation.md` RSV-023
- **SAD:** `docs/03-sad/13-module-reservation.md` §42.1/§42.3/§42.4
- **Design:** `docs/02-design/pages/reservation.md` §12

## Required Existing Code

`GetReservationByPatientTypeReportUseCase.ts`/`ReservationByPatientTypeReportQueryDto.ts` (task-300). `ReservationListView.tsx`'s `RESERVATION_STATUS_TONE` map, reused for the Status select's option list.

## Backend Scope

- `ReservationByPatientTypeReportQueryDto.ts` gains `@IsOptional() @IsString() status?: string`.
- `GetReservationByPatientTypeReportUseCase.ts` passes `status` (`ALL` → `undefined`, same convention as task-305) through to both the `search()` call (items) and the `findAllInDateRange()` call (summary) — unlike `doctorId` on the By Doctor report (task-301, which narrows only the table), `status` narrows both the table and the New/Old comparison, since it's a cross-cutting filter, not the report's own dimension.

## Frontend Scope

`ReservationByPatientTypeReportPage.tsx` gains the same Status `<Select>` as task-305 (default "All Statuses", unlike task-305's `COMPLETED` default) next to the date-range shell.

## Database Impact

None.

## API Impact

`GET /reports/reservations/by-patient-type` gains an optional `status` query param.

## Workflow Impact

None.

## Security Impact

None — reuses the existing `report.reservation.patient-type.read` permission.

## Testing Required

- Unit test: an explicit `status` narrows both the table and the New/Old counts.
- Frontend component test: the Status select re-queries with the selected value.

## Deliverables

- DTO/use case extension (backend).
- Status select on the report page (frontend).
- Tests.

## Acceptance Criteria

- Selecting a status narrows both the results table and the New/Old comparison card/chart.
- "All Statuses" (the default) behaves identically to the report's pre-existing unfiltered behavior.

## Definition of Done

Status filter functional end-to-end, tests passing.

---

## Dependency Detail

- **Blocked By:** task-300, task-305
- **Required Before:** task-309
- **Can Run In Parallel With:** task-307

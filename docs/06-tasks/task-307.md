# task-307: Status Filter on "Reservations by Doctor"

**Phase:** Reservation Module Addendum #4 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE17. Status Filter on Reservation Reports
**Module:** Reservation / Reporting
**Priority:** P3 - Low

---

## Business Goal

Let staff narrow the per-doctor comparison report to a specific reservation status (e.g. only NO_SHOW counts per doctor), matching task-306's identical addition to the Patient Type report.

## Depends On

- task-301 (Reservation by Doctor Report — the report being extended)
- task-305 (establishes the `status`/`ALL` query-param convention this task reuses)

## Required Documents

- **AI Contract:** none beyond the existing API contract already governing this endpoint
- **PRD:** `docs/01-prd/features/reservation.md` RSV-023
- **SAD:** `docs/03-sad/13-module-reservation.md` §42.1/§42.3/§42.4
- **Design:** `docs/02-design/pages/reservation.md` §12

## Required Existing Code

`GetReservationByDoctorReportUseCase.ts`/`ReservationByDoctorReportQueryDto.ts` (task-301). `ReservationListView.tsx`'s `RESERVATION_STATUS_TONE` map, reused for the Status select's option list.

## Backend Scope

- `ReservationByDoctorReportQueryDto.ts` gains `@IsOptional() @IsString() status?: string`, independent of the existing optional `doctorId`.
- `GetReservationByDoctorReportUseCase.ts` passes `status` (`ALL` → `undefined`) through to both the `search()` call (items) and the `findAllInDateRange()` call (summary breakdown) — unlike `doctorId`, which narrows only the table (per task-301's own convention: the comparison chart always reflects all doctors), `status` narrows both, since it's a cross-cutting filter, not this report's own dimension.

## Frontend Scope

`ReservationByDoctorReportPage.tsx` gains the same Status `<Select>` as task-306 (default "All Statuses") next to the existing Doctor filter and date-range shell.

## Database Impact

None.

## API Impact

`GET /reports/reservations/by-doctor` gains an optional `status` query param.

## Workflow Impact

None.

## Security Impact

None — reuses the existing `report.reservation.doctor.read` permission.

## Testing Required

- Unit test: an explicit `status` narrows both the table and `summary.breakdown`.
- Unit test: `status` and `doctorId` filters compose correctly (both can be applied together).
- Frontend component test: the Status select re-queries with the selected value.

## Deliverables

- DTO/use case extension (backend).
- Status select on the report page (frontend).
- Tests.

## Acceptance Criteria

- Selecting a status narrows both the results table and the per-doctor comparison chart.
- `status` and `doctorId` can be applied together without conflict.

## Definition of Done

Status filter functional end-to-end, tests passing.

---

## Dependency Detail

- **Blocked By:** task-301, task-305
- **Required Before:** task-310
- **Can Run In Parallel With:** task-306

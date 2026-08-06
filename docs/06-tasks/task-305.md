# task-305: Rename "Completed Reservations" → "Reservation By Status" + Status Filter

**Phase:** Reservation Module Addendum #4 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE16. Reservation By Status Report
**Module:** Reservation / Reporting
**Priority:** P2 - Medium

---

## Business Goal

The Completed Reservations Report (task-299, RSV-019) hardcoded `status: 'COMPLETED'` with no way to see any other status. Renaming it to "Reservation By Status" and making `status` a real, user-selectable filter turns a single-purpose report into a general one, without losing its original default view (still `COMPLETED` on first load).

## Depends On

- task-299 (Completed Reservations Report — the report being renamed and generalized)

## Required Documents

- **AI Contract:** none beyond the existing API/report contracts already governing this endpoint
- **PRD:** `docs/01-prd/features/reservation.md` RSV-019 (renamed)
- **SAD:** `docs/03-sad/13-module-reservation.md` §42.1/§42.3/§42.4/§42.5
- **Design:** `docs/02-design/pages/reservation.md` §12

## Required Existing Code

`GetCompletedReservationReportUseCase.ts`/`CompletedReservationReportQueryDto.ts`/`CompletedReservationReportController.ts` (task-299) — all renamed in place, one-for-one. `ListReservationQueryDto.ts`'s existing `@IsOptional() @IsString() status?: string` convention (not `@IsEnum`, since `IReservationRepository`'s filters already type `status` as `string`). `ReservationAnalyticsUseCase.ts`'s `groupByDate` — gains a `groupByMonth` sibling in the same file.

## Backend Scope

- Full rename: `GetReservationByStatusReportUseCase.ts` (+`.test.ts`), `ReservationByStatusReportQueryDto.ts`, `ReservationByStatusReportController.ts`, `reservationByStatusReportRoutes.test.ts`. Route `/reports/reservations/completed` → `/reports/reservations/by-status`. Permission `report.reservation.completed.read` → `report.reservation.by-status.read` (replaced in `seed.ts`'s flat `PERMISSIONS` array and `REGISTRATION`'s grant list; `ADMINISTRATOR` needs no explicit change, auto-grants the full array).
- `status` becomes an optional query param: omitted defaults to `COMPLETED` (unchanged behavior); `status=ALL` clears the filter entirely (the only way to see every status — omitting the param can't be distinguished from "use the default"). The resolved status is applied identically to both the paginated `search()` read and the `findAllInDateRange()` summary read, so the table and chart always agree.
- `groupBy: 'day' | 'month'` optional query param (default `day`) selects between the new `groupByMonth` helper and the existing `groupByDate` for `summary.trend`.
- `summary.totalCompleted` renamed to `summary.total` (no longer always describes "completed").

## Frontend Scope

- Route folder `app/(dashboard)/reports/completed-reservations/` → `app/(dashboard)/reports/by-status/`. Component `CompletedReservationReportPage.tsx` → `ReservationByStatusReportPage.tsx`. Service/hook renamed to match.
- Adds a Status `<Select>` (All Statuses + the 8 `ReservationStatus` values, reusing `ReservationListView.tsx`'s existing `RESERVATION_STATUS_TONE` map's keys rather than a new list) defaulting to `COMPLETED`, and a Day/Month `<Select>` defaulting to Day, both next to the existing date-range shell.
- Summary card label becomes dynamic ("Total COMPLETED" / "Total (All Statuses)" / etc).
- Nav label "Completed Reservations" → "Reservation By Status", href/permission updated.

## Database Impact

None.

## API Impact

Route renamed `GET /reports/reservations/completed` → `GET /reports/reservations/by-status`; new optional query params `status`, `groupBy`; response `summary.totalCompleted` renamed `summary.total`.

## Workflow Impact

None — read-only reporting.

## Security Impact

Permission key renamed `report.reservation.completed.read` → `report.reservation.by-status.read`. Requires `npx prisma db seed` re-run (adds the new key, removes the old) and affected users to log out/in for the new key to appear in their cached frontend permission list.

## Testing Required

- Unit test: omitting `status` defaults to `COMPLETED`, matching the report's original behavior.
- Unit test: an explicit `status` narrows both the table and `summary.total`.
- Unit test: `status=ALL` clears the filter, including every status in range.
- Unit test: `groupBy=month` buckets the trend by month instead of day.
- Integration test: `GET /reports/reservations/by-status` returns the renamed response shape, and rejects a requester without `report.reservation.by-status.read`.
- Frontend component test: the Status select re-queries with the selected value; "All Statuses" sends `status=ALL`.

## Deliverables

- Renamed use case/DTO/controller/route/permission (backend).
- Renamed page/service/hook/route/nav entry (frontend), with the new Status + Group By selects.
- Tests.

## Acceptance Criteria

- The report's first-load view is unchanged (COMPLETED-only, day trend) despite the rename.
- Selecting a different status or "All Statuses" narrows both the table and the summary card/chart consistently.
- Switching Day/Month re-buckets the trend chart correctly.

## Definition of Done

Renamed end-to-end (backend + frontend + docs + seed), status/groupBy filters functional, tests passing.

---

## Dependency Detail

- **Blocked By:** task-299
- **Required Before:** None
- **Can Run In Parallel With:** task-306, task-307

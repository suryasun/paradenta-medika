# task-298: Reservation List / History Date Split

**Phase:** Reservation Module Addendum #2 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE9. Reservation List / History Date Split
**Module:** Reservation
**Priority:** P2 - Medium

---

## Business Goal

Make the Reservation List screen show only what front-desk staff need day-to-day — today's and upcoming reservations — instead of an undifferentiated mix of past and future rows, while keeping full past-reservation lookup available on the dedicated History screen (task-294). Before this task, both screens defaulted to an unfiltered date range and could show the same rows.

## Depends On

- task-031 (Reservation List & Search)
- task-294 (Reservation History)

## Required Documents

- **AI Contract:** none beyond the standard API contract already governing `GET /reservations`'s `dateFrom`/`dateTo` filters
- **PRD:** `docs/01-prd/features/reservation.md` RSV-005, RSV-018
- **SAD:** `docs/03-sad/13-module-reservation.md` §40.3 (explicit note that this split is UI-bounded, not server-enforced, and why)

## Required Existing Code

`GET /reservations`'s existing `dateFrom`/`dateTo` filter (task-031/task-290) — unchanged by this task. `ReservationListView.tsx` and `ReservationHistoryPage.tsx`'s existing filter-state pattern (`useState<ListReservationsParams>`).

## Backend Scope

None. `GET /reservations` is unchanged and continues to accept any `dateFrom`/`dateTo` a caller sends — including task-291's/task-299's own reports, which query arbitrary ranges through the same endpoint and must not be constrained by this task's UI-only convention.

## Frontend Scope

- `ReservationListView.tsx`: filter state initializes with `dateFrom` set to today (UTC-day-truncated, matching the existing `.toISOString().slice(0,10)` convention already used elsewhere in this codebase). Both its Date-From and Date-To inputs get `min={today}`, so a user cannot pick a date before today on this screen. Clearing the Date-From input falls back to today rather than an unbounded value.
- `ReservationHistoryPage.tsx`: filter state initializes with `dateTo` set to yesterday. Both its Date-From and Date-To inputs get `max={yesterday}`. Clearing the Date-To input falls back to yesterday.

## Database Impact

None.

## API Impact

None — no new query params, no change to `GET /reservations`'s contract.

## Workflow Impact

None — a default/bound change on two existing read-only screens.

## Security Impact

None.

## Testing Required

- Frontend component test: Reservation List's initial query includes `dateFrom` equal to today's date.
- Frontend component test: Reservation History's initial query includes `dateTo` equal to yesterday's date.

## Deliverables

- Default-value and input-bound changes on both screens.
- Tests.

## Acceptance Criteria

- Loading the Reservation List with no filters applied shows only today-and-later reservations.
- Loading Reservation History with no filters applied shows only before-today reservations.
- Neither screen's date inputs allow selecting a date on the "wrong side" of today.
- `GET /reservations` itself remains unconstrained — other consumers (reports, the Calendar view) are unaffected.

## Definition of Done

Both screens default to and are input-bounded to their respective date ranges, tests passing, no backend change.

---

## Dependency Detail

- **Blocked By:** task-031, task-294
- **Required Before:** None
- **Can Run In Parallel With:** task-295, task-296, task-297, task-299

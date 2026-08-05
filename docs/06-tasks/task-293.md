# task-293: Reservation Calendar (Agenda) View

**Phase:** Reservation Module Enhancement (post-roadmap addendum)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE4. Reservation Calendar (Agenda) View
**Module:** Reservation
**Priority:** P2 - Medium

---

## Business Goal

Give front-desk staff a Google Calendar-style view of reservations — Day/Week/Month/Agenda toggle, jump-to-date mini-month picker — so they can see the shape of a day/week at a glance instead of paging through the flat Reservation List. No such view exists today: the only calendar-adjacent UI is the `TimeSlotPicker` used during booking, which shows one doctor's availability for one date, not an overview of all reservations.

## Depends On

- task-002 (Reservation Booking)
- task-031 (Reservation List & Search — this task's Agenda mode reuses its query/filter logic against the same `GET /reservations` endpoint)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/10-code-generation-rules.md` (no new library without approval — this task must not introduce a calendar UI library; build from existing primitives)
- **PRD:** `docs/01-prd/features/reservation.md` (RSV-005 Search Reservation — this task is a new presentation layer over existing search, not a new business capability)
- **SAD:** `docs/03-sad/13-module-reservation.md` §39.6 item 1
- **Design:** `docs/02-design/pages/reservation.md` §8.3

## Required Existing Code

`GET /api/v1/reservations` (existing, task-031) — this task's Day/Week/Month/Agenda views are all client-side groupings of the same paginated/filtered result set this endpoint already returns; no new backend query logic. `TimeSlotPicker` component pattern (visual reference only — not reused directly, since it shows availability, not existing bookings).

## Backend Scope

None required beyond what task-031 and (optionally) task-290 already provide. If Day/Week views need a wider date-range fetch than the existing 20/50/100-item pagination comfortably supports (e.g. a full month of reservations across all doctors), extend `GET /reservations`'s existing `dateFrom`/`dateTo` filter usage — no new endpoint, no schema change.

## Frontend Scope

New route `/reservations/calendar`:

```text
Reservation Calendar
├── Header: H1 + view toggle (Day | Week | Month | Agenda)
├── Left rail: mini-month date picker
├── Doctor filter (reuses existing Doctor Select)
├── Patient Type filter chip (task-290, if merged first — optional soft dependency)
└── Main panel per view:
    ├── Day/Week: time-slot grid, Reservation cards positioned by
    │   start time/duration, colored by Status Badge tone
    ├── Month: compact per-day entry counts, click-through to Day view
    └── Agenda: chronological list grouped by day (time, patient name,
        procedure, doctor) — reuses the existing `Table`/list-row pattern
```

Click an entry → opens Reservation Detail in a `Modal`, not a full navigation (keeps calendar scroll/view position). No new charting or calendar library — built from this project's existing `Table`, `Badge`, `Modal`, `Select` primitives (`docs/04-ai-contract/10-code-generation-rules.md`).

## Database Impact

None.

## API Impact

None (reuses existing `GET /reservations` with its existing filter params). If a wider date-range query pattern is needed, it uses the endpoint's already-documented `dateFrom`/`dateTo` params — no new params, no new endpoint.

## Workflow Impact

None — a new read-only presentation surface over existing reservation data; no state transitions added.

## Security Impact

Gated by `reservation.read` (same permission as Reservation List/Detail — this is another view onto the same data, not a new capability).

## Testing Required

- Frontend component test: Agenda view correctly groups a set of mocked reservations by date.
- Frontend component test: switching Day/Week/Month/Agenda preserves the currently selected date.
- Frontend component test: clicking a reservation entry opens the Detail modal with the correct reservation's data.
- Frontend component test: empty state renders when a selected day/week/month has zero reservations.

## Deliverables

- `/reservations/calendar` route + `ReservationCalendarPage` component (Day/Week/Month/Agenda).
- Reservation Detail modal integration.
- Tests.

## Acceptance Criteria

- Agenda view groups reservations chronologically by day, showing time, patient name, procedure, and doctor, matching the reference screenshot's information density (`docs/images/reservation calender view.PNG`, used as a loose visual reference only, not a literal spec).
- Switching between Day/Week/Month/Agenda does not lose the currently selected date.
- No new third-party calendar/charting library is introduced without an explicit separate approval step.

## Definition of Done

`/reservations/calendar` live with all 4 view modes working against real `GET /reservations` data, Detail modal wired, tests passing, no new library dependency added.

---

## Dependency Detail

- **Blocked By:** task-002, task-031
- **Required Before:** None
- **Can Run In Parallel With:** task-290, task-291, task-292, task-294

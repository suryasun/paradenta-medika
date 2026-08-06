# task-304: Patient MRN/Name on Reservation Calendar

**Phase:** Reservation Module Addendum #3 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE15. Patient MRN/Name on Reservation Calendar
**Module:** Reservation
**Priority:** P3 - Low

---

## Business Goal

Let staff identify which patient a Calendar entry belongs to at a glance, matching what the Reservation List and History screens already show (task-295) — the Calendar fetches through the same `GET /reservations` `search()` endpoint, so the data was already present, just not rendered.

## Depends On

- task-293 (Reservation Calendar / Agenda View)
- task-295 (Patient MRN/Name on Reservation List — the same server-side join this task's data already comes from)

## Required Documents

- **AI Contract:** none
- **PRD:** none new
- **SAD:** `docs/03-sad/13-module-reservation.md` §41.1/§41.5
- **Design:** `docs/02-design/pages/reservation.md` §11

## Required Existing Code

`ReservationCalendarPage.tsx`'s `ReservationEntry` component — the only file this task touches. `Reservation.patientMrn`/`patientFullName` (task-295) — already present on every entry `ReservationCalendarPage` renders, since it fetches via the same `useReservations` hook / `GET /reservations` endpoint as List.

## Backend Scope

None.

## Frontend Scope

`ReservationEntry` (in `ReservationCalendarPage.tsx`) gains a Patient Name/MRN line, positioned above the existing `doctorName · reservationType` line — same rendering convention (`patientFullName ?? "—"`, MRN in a muted parenthetical) already used on `ReservationListView.tsx`/`ReservationHistoryPage.tsx`. Applies uniformly across Day/Week/Month/Agenda views, since they all render through the same `ReservationEntry` component.

## Database Impact

None.

## API Impact

None.

## Workflow Impact

None.

## Security Impact

None.

## Testing Required

- Frontend component test: a calendar entry with a populated `patientFullName`/`patientMrn` renders both.

## Deliverables

- `ReservationEntry` rendering change.
- Test.

## Acceptance Criteria

- Every calendar entry (Day/Week/Month/Agenda) shows the patient's name and MRN when present, matching List/History's existing rendering.

## Definition of Done

Patient Name/MRN visible on Reservation Calendar entries, test passing, no backend change.

---

## Dependency Detail

- **Blocked By:** task-293, task-295
- **Required Before:** None
- **Can Run In Parallel With:** task-300, task-301, task-302, task-303

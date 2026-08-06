# task-302: Edit Reservation (List action + Edit page)

**Phase:** Reservation Module Addendum #3 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE13. Edit Reservation
**Module:** Reservation
**Priority:** P1 - High

---

## Business Goal

Give staff a way to correct a reservation's Doctor/Date/Time/Type/Complaint/Notes after booking, without cancelling and rebooking. The backend (`PUT /reservations/:id`, `UpdateReservationUseCase`, task-032) and the frontend mutation hook (`useUpdateReservation`) already existed, fully wired — but had zero UI consuming them anywhere in the app.

## Depends On

- task-032 (Update Reservation — the backend endpoint this task's UI consumes for the first time)
- task-031 (Reservation List — where the new Edit link is added)

## Required Documents

- **AI Contract:** none beyond the standard API contract already governing `PUT /reservations/:id`
- **PRD:** `docs/01-prd/features/reservation.md` RSV-022
- **SAD:** `docs/03-sad/13-module-reservation.md` §41.3/§41.5
- **Design:** `docs/02-design/pages/reservation.md` §11

## Required Existing Code

`UpdateReservationUseCase.ts`/`UpdateReservationRequestDto.ts` (task-032) — unchanged, this task is purely a new consumer. `useUpdateReservation(id)` (`useReservationMutations.ts`) — already implemented, previously orphaned (no component imported it). `CreateReservationForm.tsx`'s Doctor/Date/`TimeSlotPicker`/Type/Complaint/Notes field set — adapted, not duplicated logic-wise (same field components, same `TimeSlotPicker` reuse).

## Backend Scope

None — `PUT /reservations/:id` already accepts exactly the field set this task's form edits.

## Frontend Scope

- New route `/reservations/{id}/edit` → `EditReservationForm.tsx`, fetching the current reservation via `useReservation(id)`, pre-filling Doctor/Date/Time Slot/Type/Complaint/Notes, and submitting via `useUpdateReservation(id)` (navigates to the Detail page on success, matching that hook's existing behavior).
- Guards against editing a reservation that's moved past BOOKED/CONFIRMED: shows a plain "cannot be edited" message instead of the form, mirroring the backend's own `UpdateReservationUseCase` status guard.
- `ReservationListView.tsx`'s Actions column gains an "Edit" link (`/reservations/{id}/edit`), gated by `PermissionGuard permission="reservation.update"` and shown only when the row's status is BOOKED or CONFIRMED — same client-side gating convention the existing `canCheckIn`/Check In link on that same row already uses, so the link never leads to a guaranteed-to-fail submit.
- Patient is **not** editable on this form — `UpdateReservationRequestDto` has no field for it, and this task doesn't add one.

## Database Impact

None.

## API Impact

None — `PUT /reservations/:id` is unchanged.

## Workflow Impact

None — a new UI path into an existing, unchanged write flow.

## Security Impact

None — reuses the existing `reservation.update` permission already required by the endpoint.

## Testing Required

- Frontend component test: `EditReservationForm` pre-fills from the existing reservation and submits the update with the edited fields.
- Frontend component test: a reservation whose status has moved past BOOKED/CONFIRMED shows the not-editable message instead of the form.
- Frontend component test: `ReservationListView` shows the Edit link only for BOOKED/CONFIRMED rows, pointing at the correct edit route.

## Deliverables

- `/reservations/{id}/edit` route + `EditReservationForm` component.
- Edit link on `ReservationListView.tsx`.
- Tests.

## Acceptance Criteria

- Editing a BOOKED/CONFIRMED reservation's Doctor/Date/Time/Type/Complaint/Notes and submitting persists the change and navigates to the Detail page.
- The Edit link is absent for any reservation not in BOOKED/CONFIRMED status.
- Navigating directly to a non-editable reservation's edit URL shows a clear message, not a broken/erroring form.

## Definition of Done

Edit link live on the Reservation List, edit page functional end-to-end against the real (unchanged) backend endpoint, tests passing.

---

## Dependency Detail

- **Blocked By:** task-032, task-031
- **Required Before:** None
- **Can Run In Parallel With:** task-300, task-301, task-303, task-304

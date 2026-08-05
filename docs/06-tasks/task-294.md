# task-294: Reservation History (Clinic-Wide)

**Phase:** Reservation Module Enhancement (post-roadmap addendum)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE5. Reservation History
**Module:** Reservation
**Priority:** P2 - Medium

---

## Business Goal

Give staff a dedicated, filterable history screen covering every reservation across the clinic — status summary bar, filters, search — for reviewing patterns and looking up past bookings, distinct from the existing per-patient Reservation History tab already on Patient Detail (which is scoped to one patient at a time). The source brief describes this as mirroring an "existing Care Plan History screen"; no such screen exists anywhere in this codebase (confirmed: zero matches for "Care Plan" across all design/SAD docs) — this task designs the screen fresh rather than copying a nonexistent pattern.

## Depends On

- task-002 (Reservation Booking)
- task-031 (Reservation List & Search)
- task-290 (Patient Type Categorization — this screen's Patient Type filter depends on it; the rest of the screen does not)

## Required Documents

- **AI Contract:** none beyond the standard API/DB contracts already governing `GET /reservations`
- **PRD:** `docs/01-prd/features/reservation.md` RSV-018 (distinct from RSV-012, the existing per-patient tab)
- **SAD:** `docs/03-sad/13-module-reservation.md` §39.3 (RSV-018), §39.6 item 3 (explicit correction of the source brief's "Care Plan History" claim)
- **Design:** `docs/02-design/pages/reservation.md` §8.5

## Required Existing Code

`GET /api/v1/reservations` (task-031) — this screen is a new presentation layer over the same endpoint's existing filter/search/pagination capability, not a new read model or query.

## Backend Scope

None beyond what task-031 (and, for the Patient Type filter, task-290) already provide. If the summary bar's counts (completed / cancelled+no-show / new-patient percentage) can't be derived cheaply client-side from a single page of paginated results, extend `GET /reservations`'s response with an optional `summary` block scoped to the currently applied filters — flagged here as a possible follow-up, not committed to in this task's initial scope; start with client-side aggregation over the fetched page and only add a backend summary endpoint if that proves insufficient in practice.

## Frontend Scope

New route `/reservations/history`:

```text
Reservation History
├── Header: H1 "Reservation History"
├── Summary bar: "{X} completed | {Y} cancelled/no-show | {Z}% new patients"
├── Filters: Status, Patient Type (task-290), Date Range, Procedure
├── Search — patient name or procedure text
└── Card list: patient name, patientType Badge, date, procedure,
    status Badge, "View Appointment Details" / "View Full Reservation"
    actions (both route to the existing Reservation Detail page —
    kept as two labeled actions per the source brief's reference,
    flagged as a likely single-action simplification opportunity
    for whoever implements this, since no functional difference
    between them is documented)
```

Reuses existing `Table`/card, `Badge`, filter-bar, and search-input primitives — no new component pattern.

## Database Impact

None.

## API Impact

None (reuses existing `GET /reservations`), unless the summary-bar follow-up above is triggered, in which case it would extend that same endpoint's response — not a new endpoint.

## Workflow Impact

None — a new read-only presentation surface; no state transitions added.

## Security Impact

Gated by `reservation.read` (same permission and same underlying data as the existing Reservation List — a different presentation, not a new capability).

## Testing Required

- Frontend component test: summary bar counts match a set of mocked reservations' statuses.
- Frontend component test: Status/Patient Type/Date Range/Procedure filters correctly narrow the card list, individually and combined.
- Frontend component test: search matches by patient name and by procedure text.
- Frontend component test: both card actions navigate to the same Reservation Detail route for a given reservation.

## Deliverables

- `/reservations/history` route + `ReservationHistoryPage` component.
- Tests.

## Acceptance Criteria

- Summary bar, filters, search, and card list match `docs/03-sad/13-module-reservation.md` §39.6 item 3's layout description.
- This screen is clinic-wide (not scoped to a single patient) and remains distinct from — does not replace — the existing per-patient Reservation History tab on Patient Detail.
- No reference is made anywhere in code or copy to a "Care Plan History" screen, since none exists in this product.

## Definition of Done

`/reservations/history` live with working filters/search/summary bar against real `GET /reservations` data, tests passing, and the per-patient Patient Detail tab left untouched and still functioning as its own separate surface.

---

## Dependency Detail

- **Blocked By:** task-002, task-031, task-290
- **Required Before:** None
- **Can Run In Parallel With:** task-291, task-292, task-293

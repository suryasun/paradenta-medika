# task-315: Today-Default Filter on Queue Board/List

**Phase:** Queue Module Addendum #1 (post-roadmap)
**Epic:** QA. Queue Module Enhancement
**Feature:** QA5. Queue Today Default
**Module:** Queue
**Priority:** P2 - Medium

---

## Business Goal

Have the Queue board/list default to showing only today's data on load, matching the mental model of a live operational board, while still letting staff pick another date when needed (e.g. reconciliation). Mirrors Reservation List's existing "today onward" default (`docs/01-prd/business-rules.md` §7.5.1), applied purely client-side.

## Depends On

- task-038 (Queue List)

## Required Documents

- **Business Rules:** `docs/01-prd/business-rules.md` "Queue Module Addendum #1" (explicitly: client-side default, no server-enforced default)
- **Precedent:** `apps/frontend/features/reservation/components/ReservationListView.tsx` (`todayIso()` helper + initial state pattern)

## Required Existing Code

`apps/frontend/features/queue/components/QueueListView.tsx` (current date filter state), `ReservationListView.tsx`'s `todayIso()` helper as the pattern to mirror.

## Backend Scope

None — `ListQueueQueryDto`/`visitDate` stays a fully optional filter, unchanged. This is an explicit, documented constraint of this task, not an oversight.

## Frontend Scope

- `QueueListView.tsx`: add the same `todayIso()` helper used by Reservation; change the date filter's initial state from empty to `todayIso()`. Unlike Reservation's List/History split, no `min` date bound is added — Queue has no separate history view, and staff may legitimately need to look at past dates for reconciliation; only the *default value* changes.

## Database Impact

None.

## API Impact

None.

## Workflow Impact

None.

## Security Impact

None.

## Testing Required

- Frontend component test: `QueueListView` initializes with today's date selected and fetches accordingly.
- Frontend component test: user can still change the date filter to any other date (past or future) without restriction.

## Deliverables

`QueueListView.tsx` default-date change, tests.

## Acceptance Criteria

- On first load, the Queue board/list shows only today's entries.
- The date filter remains freely editable to any date; no server-side date restriction is introduced.

## Definition of Done

Queue board/list defaults to today on load, tests passing, no backend change.

---

## Dependency Detail

- **Blocked By:** task-038
- **Required Before:** none
- **Can Run In Parallel With:** task-314

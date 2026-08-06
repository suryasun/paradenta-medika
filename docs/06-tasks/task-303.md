# task-303: Configurable Page Size (List + History)

**Phase:** Reservation Module Addendum #3 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE14. Configurable Page Size
**Module:** Reservation
**Priority:** P3 - Low

---

## Business Goal

Let staff choose how many rows show per page on the Reservation List and History screens, instead of the hardcoded 20. Pagination itself (Previous/Next, real un-paginated totals) was already correctly implemented — this closes the one genuine gap, a page-size control.

## Depends On

- task-031 (Reservation List & Search)
- task-294 (Reservation History)

## Required Documents

- **AI Contract:** none beyond the standard API pagination contract (`ListQueryDto`'s existing `@Max(100)` cap on `limit`)
- **PRD:** none new
- **SAD:** `docs/03-sad/13-module-reservation.md` §41.1/§41.5
- **Design:** `docs/02-design/pages/reservation.md` §11

## Required Existing Code

`Pagination.tsx` (`components/ui/`) — the shared component this task extends, used by every paginated list screen in the app, not just Reservation's. `ListReservationsParams.limit` — already exists and is already sent to `GET /reservations`.

## Backend Scope

None — `ListQueryDto`'s `limit` field already accepts any value up to 100.

## Frontend Scope

- `Pagination.tsx` gains optional `limit`/`onLimitChange`/`limitOptions` props (default `[10, 20, 50, 100]`). When `onLimitChange` is supplied, a "Rows per page" `<select>` renders alongside the existing Previous/Next controls — shown even when there's only one page (so a caller wanting a smaller page size to see if it creates more pages isn't blocked). Existing consumers that don't pass the new props keep their exact prior behavior (hidden entirely on a single page).
- `ReservationListView.tsx` and `ReservationHistoryPage.tsx` both pass `limit={filters.limit}` and an `onLimitChange` that updates `filters.limit` and resets to `page: 1`.

## Database Impact

None.

## API Impact

None — `GET /reservations`'s `limit` param is unchanged.

## Workflow Impact

None.

## Security Impact

None.

## Testing Required

- Component test: `Pagination` renders nothing when there's one page and no `onLimitChange` (existing behavior, unchanged).
- Component test: `Pagination` shows the page-size selector even on a single page when `onLimitChange` is provided.
- Component test: selecting a new page size calls `onLimitChange` with the numeric value.
- Frontend component test: both `ReservationListView` and `ReservationHistoryPage` re-query with the new `limit` and reset to `page: 1` when the selector changes.

## Deliverables

- `Pagination.tsx` extended with optional page-size props.
- `ReservationListView.tsx`/`ReservationHistoryPage.tsx` wired to the new props.
- Tests.

## Acceptance Criteria

- Changing the page-size selector on either screen re-fetches with the new `limit` and returns to page 1.
- Every other existing consumer of `Pagination` (unrelated to Reservation) is unaffected, since the new props are optional.

## Definition of Done

Page-size selector live on both screens, backward-compatible with every other `Pagination` consumer, tests passing.

---

## Dependency Detail

- **Blocked By:** task-031, task-294
- **Required Before:** None
- **Can Run In Parallel With:** task-300, task-301, task-302, task-304

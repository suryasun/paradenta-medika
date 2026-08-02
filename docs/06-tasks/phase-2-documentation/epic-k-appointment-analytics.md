# Epic K: Appointment Management (Appointment Analytics) — Documentation (task-060)

> Retroactive documentation, per the template in `phase-1-documentation/epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-060.md`
- `docs/03-sad/13-module-reservation.md` Section 34.5 (7 analytics metrics, literal) and Section 35.1 (4 Operational KPIs, literal — narrower than the fuller 35.2/35.3/35.4 lists)
- `docs/06-tasks/phase-2-plan.md` Ambiguity #1: the full Booking/Walk-in/Check-in/Reschedule/Cancel workflow was already built in Phase 1; Analytics/KPI is the only genuinely new material for "Appointment Management" in Phase 2. Appointment Reminder is explicitly a **Future** capability (Section 28.4) and intentionally not built.

## Task List

| Task | Name |
|---|---|
| task-060 | Reservation Analytics & KPI Dashboard (P2) |

## Implementation Plan

A single read-only aggregation endpoint over the existing `Reservation` table (no new entity), computing the 7 literal Section 34.5 metrics (reservation trend, peak-hour analysis, doctor utilization, appointment conversion, walk-in ratio, cancellation trend, no-show trend) plus the 4 literal Section 35.1 KPIs (total/daily/weekly/monthly reservation counts), scoped to an optional date range + branch filter.

## Files Created

- `apps/backend/src/modules/reservation/application/dtos/ReservationAnalyticsQueryDto.ts`, `ReservationAnalyticsResponseDto.ts`
- `apps/backend/src/modules/reservation/application/use-cases/ReservationAnalyticsUseCase.ts` + `.test.ts`
- `apps/frontend/features/reservation/hooks/useReservationAnalytics.ts`
- `apps/frontend/features/reservation/components/ReservationAnalyticsDashboard.tsx` + `.test.tsx`
- `apps/frontend/app/(dashboard)/reservations/analytics/page.tsx`

## Files Modified

- `apps/backend/src/modules/reservation/presentation/routes/reservation.routes.ts` (registered `GET /reservations/analytics` **before** `GET /reservations/:id` so Express doesn't match "analytics" as the `:id` param)
- `apps/backend/src/modules/reservation/presentation/controllers/ReservationController.ts` (added `analytics` handler)
- `apps/frontend/config/navigation.ts` (added the Analytics Dashboard link)

## Database Changes

None. Pure read-aggregate query over the Phase 1 `Reservation` table.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /reservations/analytics` | `reservation.analytics.read` |

Query params: `dateFrom`, `dateTo` (both optional; default to a trailing-30-day window when omitted — a documented dashboard-convention judgment call, no literal default exists in the SAD), `branchId` (optional).

## Frontend Changes

`ReservationAnalyticsDashboard.tsx` — charts/cards for the 7 trend metrics + 4 KPIs, with a date-range filter. Reachable from a new `/reservations/analytics` route.

## Security Validation

Gated by the dedicated `reservation.analytics.read` permission (not overloaded onto the general `reservation.read`), seeded to `REGISTRATION` and `DOCTOR` roles alongside the existing Operations Dashboard permission.

## Architecture Validation

- No new domain entity or repository — `ReservationAnalyticsUseCase` reads directly through the existing `IReservationRepository`, consistent with the Phase 1 precedent of read-side use cases composing existing repositories rather than duplicating query logic.
- The trailing-30-day default and the branch-filter shape mirror the same judgment-call pattern already used for the Phase 1 Operations Dashboard (`docs/06-tasks/phase-1-implementation-report.md` Section 5, item 3).

# task-060: Reservation Analytics & KPI Dashboard

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** K. Appointment Management  
**Feature:** K1. Reservation Analytics  
**Module:** Reservation  
**Priority:** P2 - Medium

---

## Business Goal

Give Clinic Managers visibility into reservation trends (peak hours, doctor utilization, appointment-vs-walk-in ratio, cancellation/no-show trend) to support scheduling decisions, the analytics slice of the roadmap's 'Appointment Management' capability that Phase 1's basic booking flow does not yet cover.

## Depends On

- Phase 1 task-002 (Create Reservation)
- Phase 1 task-031 (Reservation List)
- Phase 1 task-013/014

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/reservation.md
- **SAD:** docs/03-sad/13-module-reservation.md Section 34.5 (Analytics: Reservation Trend, Peak Hour Analysis, Doctor Utilization, Appointment Conversion, Walk-in Ratio, Cancellation Trend, No Show Trend), Section 35 (KPI)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

Phase 1 Reservation module (task-002, task-031 through task-036).

## Backend Scope

- ReservationAnalyticsUseCase computing the metrics listed in Section 34.5 and the KPIs in Section 35.1 over a date range.
- Endpoint path is not literally enumerated in docs/03-sad/13-module-reservation.md; derive it from the documented URL convention (docs/04-ai-contract/04-api-contract.md), e.g. GET /api/v1/reservations/analytics -- flagged as convention-derived, not a literal SAD path.

## Frontend Scope

- Reservation Analytics dashboard (charts for trend, peak hour, doctor utilization, conversion/no-show rates).

## Database Impact

- Read-only aggregate queries over reservations.

## API Impact

- Adds GET /api/v1/reservations/analytics (convention-derived path).

## Workflow Impact

Read-only management visibility; does not change any reservation state.

## Security Impact

- Gated by reservation.analytics.read (or equivalent) permission -- Clinic Manager/Owner roles per docs/03-sad/01-system-overview.md Section 5.

## Testing Required

- Unit test: each metric computes correctly against seeded reservation data across multiple statuses/sources.

## Deliverables

- ReservationAnalyticsUseCase, controller, route, DTOs, tests, frontend dashboard.

## Acceptance Criteria

- All 7 documented analytics metrics (Section 34.5) and the KPIs in Section 35.1 are available and accurate.
- Response supports a configurable date range.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** Phase 1 task-002, task-031.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** All other Phase 2 epics.

# task-278: AI Slot Recommendation

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DM. Smart Scheduling
**Feature:** DM1. Slot Recommendation
**Module:** Reservation
**Priority:** P2 - Medium

---

## Business Goal

Implement AI-driven appointment-slot recommendation per docs/03-sad/13-module-reservation.md Section 37.3's literal 'AI Slot Recommendation' Phase 4 roadmap item, suggesting optimal time slots to a Registration Staff or patient during booking rather than a plain chronological list.

## Depends On

- task-273 (AI Clinical Pipeline Governance Foundation)
- task-036 (Doctor Availability lookup, Phase 1)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reservation.md, docs/01-prd/business-rules.md § 3
- **SAD:** docs/03-sad/13-module-reservation.md (Section 37.3 Phase 4 ('AI Slot Recommendation'))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-273, task-036.

## Backend Scope

- Application layer: `RecommendReservationSlotsUseCase` — ranks available slots (from the existing task-036 Doctor Availability lookup) by predicted patient convenience/likelihood-of-attendance (reusing task-303's no-show model as a ranking signal) rather than presenting a flat chronological list.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Reads existing Reservation/Doctor Schedule data; no new persistent state beyond an optional prediction record via task-299.

## API Impact

Extends GET /doctors/{doctorId}/availability (task-036) with a `?recommend=true` parameter (no new route; existing endpoint extension).

## Workflow Impact

Improves booking UX by surfacing better slots first; does not remove the ability to book any available slot regardless of ranking.

## Security Impact

No security-sensitive change; purely a ranking/UX enhancement over already-authorized availability data.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `RecommendReservationSlotsUseCase`, extension to task-036's endpoint, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reservation.md:

- Recommended ordering measurably correlates with historical attendance likelihood in a backtest.
- Every originally-available slot remains bookable regardless of its rank.

## Definition of Done

Ranking use case implemented and tested; no slot availability is hidden, only reordered.

---

## Dependency Detail

- **Blocked By:** task-273, task-036
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.

# task-276: AI No-Show Prediction

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DL. Predictive Analytics
**Feature:** DL2. No-Show Prediction
**Module:** Reservation
**Priority:** P2 - Medium

---

## Business Goal

Implement AI no-show prediction per docs/03-sad/13-module-reservation.md Section 37.3's literal Phase 4 roadmap item 'AI No Show Prediction', helping Registration Staff proactively overbook or follow up on reservations likely to be missed.

## Depends On

- task-273 (AI Clinical Pipeline Governance Foundation)
- Phase 1 Reservation module

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reservation.md, docs/01-prd/business-rules.md § 3
- **SAD:** docs/03-sad/13-module-reservation.md (Section 37.3 Phase 4 (AI Slot Recommendation, AI No Show Prediction, Calendar Synchronization, Google Calendar Integration, Outlook Calendar Integration, Multi Branch Reservation))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-273, Phase 1 Reservation module.

## Backend Scope

- Application layer: `PredictNoShowLikelihoodUseCase` — computes a no-show-likelihood score per upcoming reservation based on the patient's historical no-show/cancellation rate, lead time, and appointment type, recorded via task-299's governed AI pipeline.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Reads existing Reservation history; writes via task-299's AI prediction table.

## API Impact

Adds GET /reservations/{id}/no-show-prediction (convention-derived).

## Workflow Impact

Supports Registration Staff decisions (e.g. reminder prioritization, overbooking policy) without automatically cancelling or double-booking a slot — the prediction informs a human decision.

## Security Impact

Prediction output flows through task-299's mandatory-review governance before it can drive any automated action (e.g. auto-overbooking is explicitly not implemented by this task, since no SAD document authorizes automated overbooking).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `PredictNoShowLikelihoodUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reservation.md:

- Prediction score correlates with the patient's actual historical no-show rate in a backtest.
- No automated action (cancellation, overbooking) is taken solely on this prediction.

## Definition of Done

Use case implemented and tested; no auto-action wired without explicit human decision.

---

## Dependency Detail

- **Blocked By:** task-273
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.

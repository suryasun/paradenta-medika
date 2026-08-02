# task-275: Recall Prediction Model

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DL. Predictive Analytics
**Feature:** DL1. Recall Prediction
**Module:** EMR
**Priority:** P2 - Medium

---

## Business Goal

Implement AI-based recall prediction per docs/03-sad/15-module-emr.md Section 8's 'AI Recommendation' future subsection, predicting which patients are likely to need a recall visit based on the four literal input factors, extending Phase 2's rule-based Recall Recommendation Engine (Section 8's Recall Rule Example table) with a predictive layer.

## Depends On

- task-273 (AI Clinical Pipeline Governance Foundation)
- Phase 2's Recall Recommendation Engine (rule-based)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/15-module-emr.md (Section 8 Recall Recommendation Engine, 'AI Recommendation' subsection (Future AI dapat merekomendasikan recall berdasarkan: Oral Hygiene, Periodontal Risk, Treatment History, Missed Appointment))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-273, Phase 2's rule-based Recall Recommendation Engine.

## Backend Scope

- Application layer: `PredictRecallLikelihoodUseCase` — computes a recall-likelihood score using the four literal input factors (Oral Hygiene indicators, Periodontal Risk from CDSS's task-309, Treatment History, Missed Appointment history), recorded via task-299's governed AI pipeline, supplementing — not replacing — the existing literal Recall Rule Example table's deterministic schedule.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Reads existing EMR/Periodontal/Reservation history; writes via task-299's AI prediction table.

## API Impact

Adds GET /patients/{patientId}/recall-prediction (convention-derived).

## Workflow Impact

Supplements the deterministic recall schedule (Scaling=6mo, Implant=3mo, RCT=1mo, Extraction=7days, Orthodontic=4weeks) with a risk-adjusted likelihood score for proactive outreach prioritization.

## Security Impact

Prediction output flows through the same mandatory-review governance as all other AI predictions (task-299).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `PredictRecallLikelihoodUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/emr.md:

- Prediction correctly incorporates all four literal input factors.
- Output does not override or silently change the existing deterministic Recall Rule Example schedule — it is presented as a supplementary risk score.

## Definition of Done

Use case implemented and tested against the four literal input factors.

---

## Dependency Detail

- **Blocked By:** task-273
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.

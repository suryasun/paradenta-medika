# task-273: AI Clinical Pipeline — Governance Foundation

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DK. AI Clinical Assistant
**Feature:** DK1. AI Governance Foundation
**Module:** EMR
**Priority:** P1 - High

---

## Business Goal

Implement the shared AI Architecture governance foundation per docs/03-sad/15-module-emr.md Section 13, with the literal AI Pipeline flow and mandatory AI Governance controls, before any specific AI capability (this Epic's task-300, or Predictive Analytics' tasks) is built — every AI feature in Phase 6 must run through this shared, governed pipeline.

## Depends On

- task-001 (Create Patient)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/15-module-emr.md (Section 13 AI Architecture (AI Modules: Clinical Summary, Tooth Detection, X-Ray Analysis, Smile Design, Recall Prediction, Treatment Recommendation; AI Pipeline: EMR → Feature Extraction → AI Model → Prediction → Doctor Review → Clinical Decision; AI Governance: Human Review Mandatory, Explainable AI, Audit Prediction, Confidence Score, Model Version))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-001, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `AiPrediction` entity (modelName, modelVersion, inputFeatures, prediction, confidenceScore, explanation, doctorReviewStatus pending/accepted/rejected, reviewedBy) implementing all five literal AI Governance controls as structural fields, not optional afterthoughts — a prediction cannot be marked 'accepted' without a reviewedBy user (Human Review Mandatory is enforced at the domain layer, not just a UI convention).
- Infrastructure layer: Prisma migration for `emr_ai_predictions`; `IAiPredictionRepository`.
- Application layer: `RecordAiPredictionUseCase` (any downstream AI feature calls this to persist its output through the governed pipeline) and `ReviewAiPredictionUseCase` (doctor accepts/rejects, per the literal Doctor Review step).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates emr_ai_predictions table.

## API Impact

Adds POST /emr/ai-predictions/{predictionId}/review (convention-derived); prediction-creation itself is invoked internally by each specific AI feature task, not a standalone public-creation endpoint.

## Workflow Impact

Every subsequent AI-powered task in this phase (task-300 AI Clinical Assistant capabilities, task-302/303 Predictive Analytics, task-306/307 Smart Scheduling, task-309 CDSS) writes through this shared entity, guaranteeing the same governance controls apply uniformly rather than being reimplemented — or forgotten — per feature.

## Security Impact

No AI prediction can be treated as a clinical decision without an explicit doctor review (Human Review Mandatory), matching the literal AI Governance list exactly. Every prediction is audited (Audit Prediction).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `AiPrediction` entity, migration, repository
- `RecordAiPredictionUseCase`, `ReviewAiPredictionUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/emr.md:

- A prediction cannot be marked accepted without a reviewedBy user recorded.
- Every prediction carries a non-null confidenceScore and modelVersion.
- Every prediction creation and review is captured in the Audit Trail.

## Definition of Done

Governance entity and use cases implemented and tested against all five literal AI Governance controls.

---

## Dependency Detail

- **Blocked By:** task-001
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.

# task-208: Retry Background Job (POST /jobs/{jobId}/retry)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AL. Background Job Operations
**Feature:** AL1. Job Registry
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Implement `RetryBackgroundJobUseCase` per docs/03-sad/21-module-system.md UC-SYS-007, retaining the same idempotency key on retry.

## Depends On

- task-207

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.8 UC-SYS-007 Operate Background Job, Section 6.4 Error Codes)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-207, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `POST /system/jobs/{jobId}/retry`.
- Application layer: `RetryBackgroundJobUseCase` — retry allowed only for idempotent/retryable job types, retains the same idempotency key.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates system_background_jobs status/attempts.

## API Impact

Adds POST /system/jobs/{jobId}/retry.

## Workflow Impact

Operational recovery step of UC-SYS-007.

## Security Impact

`SYS_JOB_NOT_RETRYABLE` (409) returned when the job type/status cannot be retried. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `RetryBackgroundJobUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Retry preserves the original idempotency key (no duplicate side effects).

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-207
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.

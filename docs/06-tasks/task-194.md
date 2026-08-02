# task-194: System Operations Health Dashboard (GET /system/health/operations)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AI. Audit Dashboard
**Feature:** AI2. Job Health
**Module:** System
**Priority:** P2 - Medium

---

## Business Goal

Implement `GetOperationsHealthUseCase` per docs/03-sad/21-module-system.md UC-SYS-007 Operate Background Job, giving Administrators visibility into queue depth, attempts, and error state — completing the Audit Dashboard's operational half.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.8 UC-SYS-007 Operate Background Job, Section 6.3 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `GET /system/health/operations`.
- Application layer: `GetOperationsHealthUseCase`, aggregates queue depth/attempts/safe-error/trace from the background job registry.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries the background job registry (task-207).

## API Impact

Adds GET /system/health/operations.

## Workflow Impact

Operational visibility component of UC-SYS-007.

## Security Impact

Gated by an operations-health-read permission (Administrator/Security Admin/Owner per Actor Matrix).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetOperationsHealthUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Response includes queue depth, attempt counts, and safe (non-sensitive) error summaries only.

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.

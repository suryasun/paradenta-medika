# task-204: Parameter Rollback (POST /parameters/{parameterKey}/rollback)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AK. Approval Workflow
**Feature:** AK1. System Parameter
**Module:** System
**Priority:** P2 - Medium

---

## Business Goal

Implement `RollbackParameterUseCase` per docs/03-sad/21-module-system.md UC-SYS-003 step 5, creating a new version from a previously validated value.

## Depends On

- task-203 (Approve Configuration Change Request)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.4 UC-SYS-003 Update System Parameter)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-203, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `POST /system/parameters/{parameterKey}/rollback`.
- Application layer: `RollbackParameterUseCase` — creates a new version using a previously validated value and records a mandatory reason (does not delete history).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts a new system_parameters version row referencing a prior version.

## API Impact

Adds POST /system/parameters/{parameterKey}/rollback.

## Workflow Impact

Rollback path of UC-SYS-003.

## Security Impact

Same approval gate as a normal high-risk change; reason is mandatory. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `RollbackParameterUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Rollback without a reason is rejected.

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-203
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.

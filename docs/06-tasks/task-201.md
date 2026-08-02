# task-201: Parameter Versions (GET /parameters/{parameterKey}/versions)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AK. Approval Workflow
**Feature:** AK1. System Parameter
**Module:** System
**Priority:** P2 - Medium

---

## Business Goal

Implement `ListParameterVersionsUseCase` exposing the immutable version history of a parameter.

## Depends On

- task-200

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 6.2 Parameters, Flags, Menus, and Templates)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-200, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /system/parameters/{parameterKey}/versions`.
- Application layer: `ListParameterVersionsUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only.

## API Impact

Adds GET /system/parameters/{parameterKey}/versions.

## Workflow Impact

Supports audit/rollback decisions within UC-SYS-003.

## Security Impact

Gated by parameter-read permission.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ListParameterVersionsUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Versions are strictly ordered and immutable (no version can be edited after activation).

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-200
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.

# task-202: Parameter Change Request (POST /parameters/{parameterKey}/change-requests)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AK. Approval Workflow
**Feature:** AK2. Configuration Change Approval
**Module:** System
**Priority:** P0 - Blocking

---

## Business Goal

Implement `CreateConfigurationChangeRequestUseCase` per docs/03-sad/21-module-system.md UC-SYS-003 step 3, the entry point of the roadmap 'Approval Workflow' feature for high-risk configuration changes.

## Depends On

- task-200

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.4 UC-SYS-003 Update System Parameter (mermaid flowchart: High risk? branch), Section 6.2 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-200, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `ConfigurationChangeRequest` entity (proposed value, scope, requestedBy, status pending/approved/rejected).
- Infrastructure layer: Prisma migration for `system_configuration_change_requests`.
- Application layer: `CreateConfigurationChangeRequestUseCase` — runs schema and module semantic validation; high-risk changes require a second approver per the UC-SYS-003 flowchart.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates system_configuration_change_requests table.

## API Impact

Adds POST /system/parameters/{parameterKey}/change-requests.

## Workflow Impact

Branch point of UC-SYS-003's mermaid flowchart ('High risk?').

## Security Impact

Gated by a module-manager-scoped permission (per Section 4.1 Actor Matrix: Module Manager can propose within their own namespace).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ConfigurationChangeRequest` entity, migration, repository
- `CreateConfigurationChangeRequestUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- `SYS_CONFIG_VERSION_CONFLICT` (409) returned on an effective-version conflict.

## Definition of Done

Entity, migration, and endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-200
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.

# task-200: System Parameter (Entity, Migration & Create/List)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AK. Approval Workflow
**Feature:** AK1. System Parameter
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Create the `SystemParameter` entity/migration and `GET/POST /system/parameters` per docs/03-sad/21-module-system.md UC-SYS-003 Update System Parameter, the versioned configuration foundation for the roadmap 'Approval Workflow' feature.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.4 UC-SYS-003 Update System Parameter (with mermaid flowchart), Section 5.3 Configuration Tables, Section 6.2 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- Domain layer: `SystemParameter` entity (key, scope, valueType, value, effectiveFrom) per the Parameter proposal example in Section 6.2. Secret values must be secret references, never raw (`SYS_SECRET_VALUE_FORBIDDEN`).
- Infrastructure layer: Prisma migration for `system_parameters` (immutable versioned rows).
- Application layer: `CreateParameterUseCase`, `ListParametersUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates system_parameters table (append-only versioned rows).

## API Impact

Adds GET/POST /system/parameters.

## Workflow Impact

First step of UC-SYS-003.

## Security Impact

`SYS_CONFIG_SCHEMA_INVALID` (422) and `SYS_SECRET_VALUE_FORBIDDEN` (422) enforced at creation.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `SystemParameter` entity, migration, repository
- `CreateParameterUseCase`, `ListParametersUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Raw secret values are rejected; only secret references accepted.
- Schema validation matches the parameter's typed schema.

## Definition of Done

Entity, migration, and CRUD endpoints implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.

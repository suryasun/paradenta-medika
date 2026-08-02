# task-207: Background Job Registry (Entity, Migration & GET /system/jobs, GET /system/jobs/{jobId})

**Phase:** Phase 3 - Operational Excellence
**Epic:** AL. Background Job Operations
**Feature:** AL1. Job Registry
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Create the `BackgroundJob` entity/migration and list/detail endpoints per docs/03-sad/21-module-system.md UC-SYS-007 Operate Background Job, the shared registry every async worker in Phase 3 (Report Jobs, Notification delivery, Automatic Stock/Billing consumers) is expected to register against for operational visibility.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.8 UC-SYS-007 Operate Background Job, Section 5.4 Data Model, Section 6.3 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- Domain layer: `BackgroundJob` entity (jobType, status, attempts, lastError (safe/sanitised), traceId, idempotencyKey).
- Infrastructure layer: Prisma migration for `system_background_jobs`.
- Application layer: `ListBackgroundJobsUseCase`, `GetBackgroundJobUseCase` for `GET /system/jobs`, `GET /system/jobs/{jobId}`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates system_background_jobs table.

## API Impact

Adds GET /system/jobs, GET /system/jobs/{jobId}.

## Workflow Impact

Operational visibility for UC-SYS-007; consumed by the Audit Dashboard (task-194) and by task-207's own registry underlying the report job/notification worker tasks.

## Security Impact

Gated by an operations-read permission (Administrator/Security Admin/System Worker per Actor Matrix).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `BackgroundJob` entity, migration, repository
- List/Get use cases, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- Error detail exposed via the API is sanitised ("safe error") — no raw stack traces or secrets.

## Definition of Done

Entity, migration, and read endpoints implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
